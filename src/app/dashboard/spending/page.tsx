"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Segmented } from "@/components/ui/segmented";
import {
  CategoryDonut,
  CategoryLegend,
  DailyChart,
  Delta,
  MONTHS,
  buildCategorySplit,
  buildPeriod,
  dayKey,
  dayLabel,
  fmt,
  monthKey,
  pctChange,
} from "@/components/insights/spending-charts";
import { useGetTransactionsQuery } from "@/store/api/transactionsApi";
import { useGetBudgetsQuery, useSetBudgetMutation } from "@/store/api/budgetsApi";
import { BudgetLimitModal } from "@/components/expenses/budget-limit-modal";
import { apiErrorMessage } from "@/lib/form";
import { CATEGORIES } from "@/lib/finance";
import { useGetKhataEntriesQuery } from "@/store/api/khataApi";
import type { CategoryName } from "@/store/types";
import { CategoryTile } from "@/components/ui/category-icon";
import { avatarTint, initialsOf } from "@/lib/avatar";

type Range = "7" | "30" | "90";

const DAY_MS = 86_400_000;

/** Kesta-style limit step: bigger limits move in bigger steps. */
function budgetStep(limit: number) {
  return limit >= 10000 ? 1000 : limit >= 2000 ? 250 : 100;
}

function daysAgo(dateStr: string, today: Date) {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return 0;
  return Math.max(0, Math.round((today.getTime() - new Date(y, m - 1, d).getTime()) / DAY_MS));
}

/* -------------------------------------------------------------------------- */
/* Small pieces                                                               */
/* -------------------------------------------------------------------------- */

function Card({
  title,
  sub,
  tools,
  className = "",
  children,
}: {
  title: string;
  sub?: ReactNode;
  tools?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className={`rounded-[22px] border border-border bg-surface p-5 shadow-xs min-w-0 ${className}`}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={id} className="text-[17px] font-extrabold tracking-[-0.015em] text-foreground">
            {title}
          </h2>
          {sub && <p className="mt-0.5 text-[14px] font-medium text-foreground-muted">{sub}</p>}
        </div>
        {tools && <div className="flex items-center gap-2 shrink-0">{tools}</div>}
      </header>
      {children}
    </section>
  );
}


function Stat({ label, value, extra }: { label: string; value: ReactNode; extra?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-[16px] border border-border bg-surface px-4 py-3">
      <dt className="text-[14px] font-bold text-foreground-muted">{label}</dt>
      <dd className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <b className="text-[20px] lg:text-[24px] font-extrabold tracking-[-0.035em] text-foreground num">{value}</b>
        {extra}
      </dd>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-[16px] bg-[var(--surface-2)] px-4 py-8 text-center text-[15px] text-foreground-muted">{children}</p>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function SpendingInsightsPage() {
  const { data: transactions = [], isLoading: loadingTx } = useGetTransactionsQuery();
  const { data: budgets = [], isLoading: loadingBudgets } = useGetBudgetsQuery();
  const { data: khata = [], isLoading: loadingKhata } = useGetKhataEntriesQuery();

  const [range, setRange] = useState<Range>("30");
  const [showTable, setShowTable] = useState(false);
  const [limitEdit, setLimitEdit] = useState<{ open: boolean; category?: CategoryName; limit?: number; spent?: number }>({ open: false });
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [setBudget] = useSetBudgetMutation();

  // Nudge a limit up or down by one step (saved straight away).
  const nudgeLimit = async (category: CategoryName, limit: number, delta: number) => {
    setBudgetError(null);
    const next = Math.max(budgetStep(limit), limit + delta);
    if (next === limit) return;
    try {
      await setBudget({ category, limit: next }).unwrap();
    } catch (err) {
      setBudgetError(apiErrorMessage(err, `Couldn't update the ${category} limit.`));
    }
  };

  const today = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const n = Number(range);

  /* Period totals and per-day series ------------------------------------- */
  const period = useMemo(() => buildPeriod(transactions, n, today), [transactions, today, n]);

  /* Category split ------------------------------------------------------- */
  const categories = useMemo(() => buildCategorySplit(period.inRange), [period.inRange]);

  /* Budgets this month --------------------------------------------------- */
  const budgetRows = useMemo(() => {
    const mk = monthKey(today);
    const spentBy = new Map<CategoryName, number>();
    for (const t of transactions) {
      if (t.type !== "expense" || !t.date?.startsWith(mk)) continue;
      spentBy.set(t.category, (spentBy.get(t.category) || 0) + t.amount);
    }
    return budgets
      .filter((b) => b.limit > 0)
      .map((b) => ({ category: b.category, limit: b.limit, spent: spentBy.get(b.category) || 0 }))
      .sort((a, b) => b.spent / b.limit - a.spent / a.limit);
  }, [budgets, transactions, today]);

  /* Khata ---------------------------------------------------------------- */
  const khataStats = useMemo(() => {
    let settled = 0;
    let pending = 0;
    for (const k of khata) {
      if (k.status === "settled") settled += k.amount;
      else pending += k.amount;
    }
    const oldest = khata
      .filter((k) => k.status === "pending" && k.type === "gave")
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);
    return { settled, pending, total: settled + pending, oldest };
  }, [khata]);

  const handleExport = () => {
    const esc = (v: string | number | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [
      ["Date", "Title", "Merchant", "Type", "Category", "Payment method", "Amount"],
      ...[...period.inRange]
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((t) => [t.date, t.title, t.merchant, t.type, t.category, t.paymentMethod, t.amount]),
    ];
    const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TrackKaro-spending-last-${n}-days-${dayKey(today)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loading = loadingTx || loadingBudgets || loadingKhata;
  const saved = period.income - period.spent;
  const savingsRate = period.income > 0 ? Math.round((saved / period.income) * 100) : null;
  const spentChange = pctChange(period.spent, period.prevSpent);
  const overBudget = budgetRows.filter((b) => b.spent > b.limit).length;
  // Budget alert, same rule as the app: the first category over its limit, else one at 75%+.
  const alertBudget =
    budgetRows.find((b) => b.spent > b.limit) ?? budgetRows.find((b) => b.limit > 0 && b.spent / b.limit >= 0.75) ?? null;
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - today.getDate();
  // How far through the month we are (today counts as half gone).
  const monthFraction = (today.getDate() - 0.5) / daysInMonth;
  const budgetSpent = budgetRows.reduce((sum, b) => sum + b.spent, 0);
  const budgetLimit = budgetRows.reduce((sum, b) => sum + b.limit, 0);
  const budgetFraction = budgetLimit > 0 ? budgetSpent / budgetLimit : 0;
  const aheadOfPace = budgetFraction > monthFraction + 0.05;
  const pct = (f: number) => `${Math.round(f * 100)}%`;
  const unbudgeted = CATEGORIES.filter((c) => !budgetRows.some((b) => b.category === c));
  const settledPct = khataStats.total > 0 ? Math.round((khataStats.settled / khataStats.total) * 100) : 0;
  const catTotal = categories.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="pb-16">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[14px] font-[650] text-foreground-muted">
              <span>Money</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m9.5 6 6 6-6 6" />
              </svg>
              <span className="text-foreground">Spending Analysis</span>
            </nav>
            <h1 className="text-[30px] lg:text-[clamp(1.875rem,2.5vw,2.375rem)] font-extrabold tracking-[-0.04em] leading-[1.08] text-foreground">
              Spending insights
            </h1>
            <p className="text-[16px] font-medium text-foreground-muted">
              <b className="font-bold text-foreground">{fmt(period.spent)}</b> spent in the last {n} days
              {spentChange !== null && (
                <>
                  {" "}· {spentChange > 0 ? "up" : spentChange < 0 ? "down" : "flat"}{" "}
                  <b className="font-bold text-foreground">{Math.abs(spentChange)}%</b> on the {n} before
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Segmented
              label="Range"
              value={range}
              onChange={setRange}
              options={[
                { value: "7", label: "7D" },
                { value: "30", label: "30D" },
                { value: "90", label: "90D" },
              ]}
            />
            <button
              type="button"
              onClick={handleExport}
              disabled={period.inRange.length === 0}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-border bg-surface px-[18px] text-[16px] font-bold text-foreground shadow-xs transition hover:bg-surface-muted active:brightness-[0.93] disabled:opacity-50"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 4v11.5M7 10.5l5 5 5-5M5 20h14" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[78px] rounded-[16px]" />
            ))}
          </div>
        ) : (
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Spent" value={fmt(period.spent)} extra={<Delta value={spentChange} goodWhenUp={false} />} />
            <Stat
              label="Income"
              value={fmt(period.income)}
              extra={<Delta value={pctChange(period.income, period.prevIncome)} goodWhenUp />}
            />
            <Stat
              label="Saved"
              value={`${saved < 0 ? "−" : ""}${fmt(saved)}`}
              extra={
                savingsRate !== null && (
                  <small className="text-[14px] text-foreground-muted tabular-nums">{savingsRate}% of income</small>
                )
              }
            />
            <Stat label="Avg per day" value={fmt(period.spent / n)} />
          </dl>
        )}
      </header>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Skeleton className="h-[380px] rounded-[22px] lg:col-span-8" />
          <Skeleton className="h-[380px] rounded-[22px] lg:col-span-4" />
          <Skeleton className="h-[320px] rounded-[22px] lg:col-span-4" />
          <Skeleton className="h-[320px] rounded-[22px] lg:col-span-8" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Daily spending */}
          <Card
            className="lg:col-span-8"
            title="Daily spending"
            sub="What you spent each day"
            tools={
              <button
                type="button"
                aria-pressed={showTable}
                onClick={() => setShowTable((s) => !s)}
                className="inline-flex h-8 items-center gap-1.5 rounded-[10px] border border-border bg-surface px-[11px] text-[14px] font-bold text-foreground transition hover:bg-surface-muted"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  {showTable ? <path d="M4.5 19.5h15M7.5 16v-4.5M12 16V7.5M16.5 16v-6.5" /> : <path d="M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" />}
                </svg>
                {showTable ? "Chart" : "Table"}
              </button>
            }
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="flex flex-wrap items-baseline gap-2">
                <b className="text-[24px] font-extrabold tracking-[-0.035em] text-foreground num">{fmt(period.spent)}</b>
                <span className="text-[14px] text-foreground-muted">spent</span>
                <Delta value={spentChange} goodWhenUp={false} suffix={` vs previous ${n} days`} />
              </p>
              <ul className="flex items-center gap-4 text-[13px] text-foreground-muted" aria-label="Legend">
                <li className="flex items-center gap-1.5">
                  <i className="h-0.5 w-4 rounded-full bg-primary" />
                  Last {n} days
                </li>
                <li className="flex items-center gap-1.5">
                  <i className="w-4 border-t-2 border-dashed border-foreground-muted/60" />
                  Previous {n} days
                </li>
              </ul>
            </div>

            {showTable ? (
              <div className="max-h-[300px] overflow-auto rounded-[12px] no-scrollbar">
                <table className="w-full text-[14px]">
                  <caption className="sr-only">Amount spent each day, against the previous period</caption>
                  <thead className="sticky top-0 bg-surface text-foreground-muted">
                    <tr>
                      <th scope="col" className="py-2 px-2 text-left font-semibold">Day</th>
                      <th scope="col" className="py-2 px-2 text-right font-semibold">Spent</th>
                      <th scope="col" className="py-2 px-2 text-right font-semibold">Previous</th>
                      <th scope="col" className="py-2 px-2 text-right font-semibold">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {[...period.days].reverse().map((d) => {
                      const diff = d.cur - d.prev;
                      return (
                        <tr key={d.date.getTime()}>
                          <th scope="row" className="py-2 px-2 text-left font-medium text-foreground">
                            {dayLabel(d.date)}
                          </th>
                          <td className="py-2 px-2 text-right tabular-nums text-foreground">{fmt(d.cur)}</td>
                          <td className="py-2 px-2 text-right tabular-nums text-foreground-muted">{fmt(d.prev)}</td>
                          <td
                            className={`py-2 px-2 text-right tabular-nums font-semibold ${
                              diff > 0 ? "text-[var(--bad)]" : diff < 0 ? "text-[var(--good)]" : "text-foreground-muted"
                            }`}
                          >
                            {diff === 0 ? "–" : `${diff > 0 ? "+" : "−"}${fmt(diff)}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="text-foreground font-semibold">
                    <tr>
                      <th scope="row" className="py-2 px-2 text-left">Total</th>
                      <td className="py-2 px-2 text-right tabular-nums">{fmt(period.spent)}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{fmt(period.prevSpent)}</td>
                      <td className="py-2 px-2 text-right tabular-nums">
                        {spentChange === null ? "–" : `${spentChange > 0 ? "+" : spentChange < 0 ? "−" : ""}${Math.abs(spentChange)}%`}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <DailyChart days={period.days} />
            )}
          </Card>

          {/* By category */}
          <Card className="lg:col-span-4" title="By category" sub="Where the money went">
            {catTotal === 0 ? (
              <Empty>No expenses in the last {n} days.</Empty>
            ) : (
              <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-5">
                <CategoryDonut slices={categories} />
                <CategoryLegend slices={categories} />
              </div>
            )}
          </Card>

          {/* Budgets: month pace + one ring per category (Kesta budgets) */}
          <Card
            className="lg:col-span-12"
            title={`Budgets · ${MONTHS[today.getMonth()]} ${today.getFullYear()}`}
            sub={`${daysLeft} ${daysLeft === 1 ? "day" : "days"} left in the month`}
            tools={
              <>
                {budgetRows.length > 0 && (
                  <span className={`pill hidden sm:inline-flex ${overBudget > 0 ? "pill--bad" : "pill--good"}`}>
                    <i />
                    {overBudget > 0 ? `${overBudget} over budget` : "All within budget"}
                  </span>
                )}
                {unbudgeted.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setLimitEdit({ open: true })}
                    className="inline-flex h-8 items-center gap-1.5 rounded-[10px] border border-border bg-surface px-[11px] text-[14px] font-bold text-foreground transition hover:bg-surface-muted"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Add budget
                  </button>
                )}
              </>
            }
          >
            {budgetRows.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-[16px] bg-[var(--surface-2)] px-4 py-8 text-center">
                <p className="text-[15px] text-foreground-muted">No budgets set yet. Give a category a monthly limit to track it here.</p>
                <button
                  type="button"
                  onClick={() => setLimitEdit({ open: true })}
                  className="inline-flex h-[38px] items-center rounded-[12px] bg-[var(--primary)] px-3.5 text-[14px] font-bold text-[var(--on-primary)]"
                >
                  Set a budget
                </button>
              </div>
            ) : (
              <>
                {alertBudget && (
                  <div
                    role="status"
                    className="mb-5 flex items-start gap-3 rounded-[16px] border px-4 py-3"
                    style={{
                      borderColor: `color-mix(in srgb, ${alertBudget.spent > alertBudget.limit ? "var(--bad)" : "var(--amber)"} 35%, transparent)`,
                      background: `color-mix(in srgb, ${alertBudget.spent > alertBudget.limit ? "var(--bad)" : "var(--amber)"} 9%, transparent)`,
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={alertBudget.spent > alertBudget.limit ? "var(--bad)" : "var(--amber)"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden="true">
                      <path d="M12 3 2.5 20h19zM12 10v4.5M12 17.5h.01" />
                    </svg>
                    <div className="min-w-0">
                      <p className="text-[15px] font-extrabold" style={{ color: alertBudget.spent > alertBudget.limit ? "var(--bad)" : "var(--warn)" }}>
                        {alertBudget.spent > alertBudget.limit ? `Over budget: ${alertBudget.category}` : `Nearing the limit: ${alertBudget.category}`}
                      </p>
                      <p className="text-[14px] text-foreground">
                        {alertBudget.spent > alertBudget.limit
                          ? `You've gone past your ${fmt(alertBudget.limit)} limit by ${fmt(alertBudget.spent - alertBudget.limit)}. Cut back on non-essentials for the rest of the month.`
                          : `${alertBudget.category} is at ${Math.round((alertBudget.spent / alertBudget.limit) * 100)}% of its limit with ${fmt(alertBudget.limit - alertBudget.spent)} left for ${daysLeft} ${daysLeft === 1 ? "day" : "days"}.`}
                      </p>
                    </div>
                  </div>
                )}
                {/* Pace: everything spent against every limit, with a "Today" marker */}
                <div className="mb-5">
                  <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                    <p className="flex flex-wrap items-baseline gap-x-2.5">
                      <b className="text-[clamp(1.75rem,2.5vw,2.5rem)] font-extrabold tracking-[-0.045em] num text-foreground">{fmt(budgetSpent)}</b>
                      <span className="font-bold text-foreground-muted">of {fmt(budgetLimit)}</span>
                    </p>
                    <p className="flex max-w-[520px] items-start gap-2 text-[15px] text-foreground-muted">
                      <svg
                        className="mt-0.5 shrink-0"
                        style={{ color: aheadOfPace ? "var(--warn)" : "var(--good)" }}
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d={aheadOfPace ? "M12 8v5M12 16.5h.01M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" : "m5 12.5 4.5 4.5L19 7.5"} />
                      </svg>
                      {aheadOfPace ? (
                        <span>
                          Spending is <b className="text-foreground">ahead</b> of the month: {pct(budgetFraction)} gone with {pct(1 - monthFraction)} of the month to run.
                        </span>
                      ) : (
                        <span>
                          On pace: <b className="text-foreground">{pct(budgetFraction)}</b> spent, {pct(monthFraction)} of the month gone.
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="relative h-[18px] rounded-full bg-[var(--well)]" role="img" aria-label={`${pct(budgetFraction)} of all budgets spent, ${pct(monthFraction)} of the month gone`}>
                    <span
                      className="tk-grow-x absolute inset-0 rounded-full"
                      style={{
                        transform: `scaleX(${Math.min(1, budgetFraction)})`,
                        background:
                          budgetFraction > 1
                            ? "var(--bad)"
                            : "linear-gradient(90deg, var(--pine), color-mix(in srgb, var(--pine) 60%, var(--amber)))",
                      }}
                    />
                    <span className="absolute -top-1.5 -bottom-1.5 w-0.5 -ml-px rounded-[1px] bg-foreground" style={{ left: `${monthFraction * 100}%` }}>
                      <i
                        className="absolute -top-6 whitespace-nowrap text-[12px] font-extrabold not-italic text-foreground"
                        style={{
                          // Keep the label inside the bar near the month's start or end.
                          left: monthFraction < 0.08 ? 0 : monthFraction > 0.92 ? "auto" : "50%",
                          right: monthFraction > 0.92 ? 0 : "auto",
                          transform: monthFraction >= 0.08 && monthFraction <= 0.92 ? "translateX(-50%)" : undefined,
                        }}
                      >
                        Today
                      </i>
                    </span>
                  </div>
                  <div className="mt-1.5 flex justify-between text-[13px] font-[650] text-foreground-muted" aria-hidden="true">
                    <span>1 {MONTHS[today.getMonth()]}</span>
                    <span>
                      {daysInMonth} {MONTHS[today.getMonth()]}
                    </span>
                  </div>
                </div>

                {/* One card per category: ring, numbers, and limit controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {budgetRows.map((b, i) => {
                    const ratio = b.spent / b.limit;
                    const over = ratio > 1;
                    const frac = Math.min(1, ratio);
                    const R = 40;
                    const C = 2 * Math.PI * R;
                    const tone = over ? "var(--bad)" : ratio >= 0.7 ? "var(--amber)" : "var(--pine)";
                    const left = b.limit - b.spent;
                    const step = budgetStep(b.limit);
                    return (
                      <article
                        key={b.category}
                        className="relative grid grid-cols-[64px_minmax(0,1fr)] sm:grid-cols-[80px_minmax(0,1fr)] items-center gap-x-4 gap-y-1 rounded-[18px] border border-border bg-surface p-3.5 transition hover:border-[var(--line-2)]"
                      >
                        {/* Whole card opens this month's payments in the category; the controls below sit above this layer. */}
                        <Link
                          href={`/dashboard/expenses?category=${encodeURIComponent(b.category)}`}
                          className="absolute inset-0 z-0 rounded-[18px] focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                          aria-label={`See ${b.category} payments this month`}
                          title={`See ${b.category} payments`}
                        />
                        <span className="pointer-events-none relative h-16 w-16 sm:h-20 sm:w-20">
                          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90 overflow-visible" aria-hidden="true">
                            <circle cx="50" cy="50" r={R} fill="none" stroke="var(--well)" strokeWidth="9" />
                            <circle
                              className="tk-ring"
                              cx="50"
                              cy="50"
                              r={R}
                              fill="none"
                              stroke={tone}
                              strokeWidth="9"
                              strokeLinecap="round"
                              strokeDasharray={C}
                              strokeDashoffset={C * (1 - frac)}
                              style={{ ["--c" as string]: C, animationDelay: `${0.15 + i * 0.06}s` } as React.CSSProperties}
                            />                          </svg>
                          <span className="absolute inset-0 grid place-content-center justify-items-center gap-0.5">
                            <CategoryTile name={b.category} size={24} />
                            <b className="text-[14px] font-extrabold num text-foreground">{Math.round(ratio * 100)}%</b>
                          </span>
                        </span>
                        <span className="pointer-events-none grid min-w-0 justify-items-start gap-0.5">
                          <b className="max-w-full truncate text-[17px] font-extrabold tracking-[-0.015em] text-foreground">{b.category}</b>
                          <span className="font-[650] text-foreground-muted">
                            <b className="font-extrabold num" style={{ color: over ? "var(--bad)" : "var(--text)" }}>
                              {fmt(b.spent)}
                            </b>{" "}
                            of {fmt(b.limit)}
                          </span>
                          <small className="text-[14px]" style={{ color: over ? "var(--bad)" : "var(--muted)" }}>
                            {over ? `${fmt(-left)} over the limit` : `${fmt(left)} left`}
                          </small>
                        </span>
                        {/* Limit controls (Kesta: nudge the limit up or down by a sensible step) */}
                        <div className="relative z-10 col-span-2 mt-2 flex items-center justify-between gap-2 border-t border-border pt-2.5 text-[14px] font-[650] text-foreground-muted">
                          <span>Limit</span>
                          <span className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => nudgeLimit(b.category, b.limit, -step)}
                              disabled={b.limit <= step}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-border bg-surface text-foreground transition hover:bg-surface-muted disabled:opacity-40"
                              aria-label={`Lower ${b.category} limit by ${fmt(step)}`}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                                <path d="M5 12h14" />
                              </svg>
                            </button>
                            <b className="min-w-[72px] text-center font-extrabold num text-foreground">{fmt(b.limit)}</b>
                            <button
                              type="button"
                              onClick={() => nudgeLimit(b.category, b.limit, step)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-border bg-surface text-foreground transition hover:bg-surface-muted disabled:opacity-40"
                              aria-label={`Raise ${b.category} limit by ${fmt(step)}`}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                                <path d="M12 5v14M5 12h14" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => setLimitEdit({ open: true, category: b.category, limit: b.limit, spent: b.spent })}
                              className="ml-1 inline-flex h-8 items-center rounded-[10px] px-2 text-[14px] font-bold text-foreground hover:bg-surface-muted"
                            >
                              Edit
                            </button>
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
                {budgetError && (
                  <p role="alert" className="mt-3 text-[15px] font-[650] text-[var(--bad)]">
                    {budgetError}
                  </p>
                )}
              </>
            )}
          </Card>

          <BudgetLimitModal
            isOpen={limitEdit.open}
            onClose={() => setLimitEdit({ open: false })}
            category={limitEdit.category}
            currentLimit={limitEdit.limit}
            spent={limitEdit.spent}
            available={unbudgeted}
          />

          {/* Khata */}
          <Card className="lg:col-span-12" title="Khata" sub="Money you lent and borrowed, all time">
            {khataStats.total === 0 ? (
              <Empty>
                No khata entries yet.{" "}
                <Link href="/dashboard/khata" className="font-semibold text-primary underline">
                  Add one in Khata Ledger
                </Link>
              </Empty>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div>
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    <b className="text-[44px] font-extrabold tracking-[-0.045em] text-foreground num">{settledPct}</b>
                    <span className="text-[24px] font-extrabold text-foreground">%</span>
                    <span className="text-[14px] text-foreground-muted">of the amount is settled</span>
                  </p>
                  <div
                    className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full"
                    role="img"
                    aria-label={`${fmt(khataStats.settled)} settled, ${fmt(khataStats.pending)} pending`}
                  >
                    <i className="h-full rounded-full bg-primary" style={{ width: `${settledPct}%` }} />
                    <i className="h-full flex-1 rounded-full bg-[var(--amber)]" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-foreground-sub">
                    <span className="flex items-center gap-1.5">
                      <i className="h-2 w-2 rounded-full bg-primary" />
                      <b className="tabular-nums text-foreground">{fmt(khataStats.settled)}</b> settled
                    </span>
                    <span className="flex items-center gap-1.5">
                      <i className="h-2 w-2 rounded-full bg-[var(--amber)]" />
                      <b className="tabular-nums text-foreground">{fmt(khataStats.pending)}</b> pending
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-[15px] font-bold text-foreground">Oldest dues owed to you</h3>
                  {khataStats.oldest.length === 0 ? (
                    <Empty>Nobody owes you anything right now.</Empty>
                  ) : (
                    <ul className="divide-y divide-border/50">
                      {khataStats.oldest.map((k) => {
                        return (
                          <li key={k.id}>
                            <Link
                              href="/dashboard/khata"
                              className="flex items-center gap-3 rounded-[12px] px-1.5 py-2.5 transition hover:bg-[var(--surface-2)]"
                            >
                              <span
                                className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-full text-[14px] font-extrabold text-[#1e1724]"
                                style={{ background: avatarTint(k.personName) }}
                                aria-hidden="true"
                              >
                                {initialsOf(k.personName)}
                              </span>
                              <span className="min-w-0 flex-1">
                                <b className="block truncate text-[15px] font-bold text-foreground">{k.personName}</b>
                                <small className="block truncate text-[13px] text-foreground-muted">
                                  {fmt(k.amount)}
                                  {k.notes ? ` · ${k.notes}` : ""}
                                </small>
                              </span>
                              <span className="text-right">
                                <b className="block text-[15px] font-extrabold num text-foreground">{daysAgo(k.date, today)}d</b>
                                <small className="block text-[12px] text-foreground-muted">pending</small>
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
