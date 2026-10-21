"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Segmented } from "@/components/ui/segmented";
import {
  CATEGORY_HEX,
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
  fmtShort,
  monthKey,
  niceMax,
  pctChange,
} from "@/components/insights/spending-charts";
import { useGetTransactionsQuery } from "@/store/api/transactionsApi";
import { useGetBudgetsQuery } from "@/store/api/budgetsApi";
import { useGetKhataEntriesQuery } from "@/store/api/khataApi";
import type { CategoryName } from "@/store/types";

type Range = "7" | "30" | "90";

const DAY_MS = 86_400_000;

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
      className={`glass glass--card glass-specular rounded-[28px] p-5 sm:p-6 min-w-0 ${className}`}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={id} className="font-display font-medium text-lg text-foreground">
            {title}
          </h2>
          {sub && <p className="text-xs text-foreground-muted mt-0.5">{sub}</p>}
        </div>
        {tools && <div className="flex items-center gap-2 shrink-0">{tools}</div>}
      </header>
      {children}
    </section>
  );
}


function Stat({ label, value, extra }: { label: string; value: ReactNode; extra?: ReactNode }) {
  return (
    <div className="glass glass--card rounded-[22px] px-4 py-3.5 min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">{label}</dt>
      <dd className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <b className="font-display font-medium text-2xl sm:text-[28px] text-foreground tabular-nums">{value}</b>
        {extra}
      </dd>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-[18px] bg-surface-muted/40 px-4 py-8 text-center text-xs text-foreground-muted">{children}</p>
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

  const today = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const n = Number(range);

  /* Period totals and per-day series ------------------------------------- */
  const period = useMemo(() => buildPeriod(transactions, n, today), [transactions, today, n]);

  /* Category split ------------------------------------------------------- */
  const categories = useMemo(() => buildCategorySplit(period.inRange), [period.inRange]);

  /* Last six months ------------------------------------------------------ */
  const months = useMemo(() => {
    const list = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - 5 + i, 1);
      return { key: monthKey(d), label: MONTHS[d.getMonth()], total: 0 };
    });
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      const m = list.find((x) => t.date?.startsWith(x.key));
      if (m) m.total += t.amount;
    }
    return list;
  }, [transactions, today]);

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
  const monthMax = niceMax(Math.max(...months.map((m) => m.total)));
  const monthAvg = months.reduce((s, m) => s + m.total, 0) / months.length;
  const budgetScale = Math.max(1, ...budgetRows.map((b) => Math.max(b.limit, b.spent))) * 1.04;
  const settledPct = khataStats.total > 0 ? Math.round((khataStats.settled / khataStats.total) * 100) : 0;
  const catTotal = categories.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="pb-16">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="font-display font-normal text-[26px] sm:text-[32px] lg:text-[38px] tracking-[-0.02em] text-foreground leading-tight mb-1.5">
              Spending insights
            </h1>
            <p className="text-xs sm:text-sm font-medium text-foreground-muted">
              How your money moved over the last {n} days
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
              className="glass glass--card inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13px] font-semibold text-foreground disabled:opacity-50 transition hover:-translate-y-px"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 4v11.5M7 10.5l5 5 5-5M5 20h14" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[86px] rounded-[22px]" />
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
                  <small className="text-xs text-foreground-muted tabular-nums">{savingsRate}% of income</small>
                )
              }
            />
            <Stat label="Avg per day" value={fmt(period.spent / n)} />
          </dl>
        )}
      </header>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Skeleton className="h-[380px] rounded-[28px] lg:col-span-8" />
          <Skeleton className="h-[380px] rounded-[28px] lg:col-span-4" />
          <Skeleton className="h-[320px] rounded-[28px] lg:col-span-4" />
          <Skeleton className="h-[320px] rounded-[28px] lg:col-span-8" />
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
                className="glass glass--card inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-foreground"
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
                <b className="font-display font-medium text-2xl text-foreground tabular-nums">{fmt(period.spent)}</b>
                <span className="text-xs text-foreground-muted">spent</span>
                <Delta value={spentChange} goodWhenUp={false} suffix={` vs previous ${n} days`} />
              </p>
              <ul className="flex items-center gap-4 text-[11px] text-foreground-muted" aria-label="Legend">
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
              <div className="max-h-[300px] overflow-auto rounded-2xl no-scrollbar">
                <table className="w-full text-xs">
                  <caption className="sr-only">Amount spent each day, against the previous period</caption>
                  <thead className="sticky top-0 bg-[var(--glass-fill-chrome)] backdrop-blur text-foreground-muted">
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
                              diff > 0 ? "text-[#DC2626] dark:text-red-400" : diff < 0 ? "text-[#059669] dark:text-emerald-400" : "text-foreground-muted"
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

          {/* Monthly spending */}
          <Card
            className="lg:col-span-4"
            title="Monthly spending"
            sub="Last 6 months"
          >
            <p className="mb-4 flex items-baseline gap-2">
              <b className="font-display font-medium text-2xl text-foreground tabular-nums">{fmt(monthAvg)}</b>
              <span className="text-xs text-foreground-muted">a month on average</span>
            </p>
            <div className="relative h-[180px]">
              <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between" aria-hidden="true">
                {[1, 0.5, 0].map((f) => (
                  <div key={f} className="relative border-t border-dashed border-foreground-muted/20">
                    <em className="absolute -top-2.5 right-0 not-italic text-[10px] text-foreground-muted bg-transparent">
                      {fmtShort(monthMax * f)}
                    </em>
                  </div>
                ))}
              </div>
              <ul className="relative flex h-full items-stretch gap-2 sm:gap-3 pr-9" aria-label="Spending per month">
                {months.map((m, i) => {
                  const current = i === months.length - 1;
                  return (
                    <li key={m.key} className="flex flex-1 flex-col items-center" aria-label={`${m.label}: ${fmt(m.total)}`}>
                      <div className="relative w-full flex-1 flex items-end justify-center pb-0">
                        <span
                          className={`w-full max-w-[34px] rounded-t-[10px] rounded-b-[4px] transition-[height] duration-500 ${
                            current ? "bg-primary" : "bg-primary/35"
                          }`}
                          style={{ height: `${(m.total / monthMax) * 100}%` }}
                          title={fmt(m.total)}
                        />
                      </div>
                      <span className={`mt-2 h-4 text-[11px] ${current ? "font-bold text-foreground" : "text-foreground-muted"}`}>
                        {m.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Card>

          {/* Budgets */}
          <Card
            className="lg:col-span-8"
            title="Budgets"
            sub={`Spent against each category's limit, ${MONTHS[today.getMonth()]} ${today.getFullYear()}`}
            tools={
              budgetRows.length > 0 && (
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    overBudget > 0
                      ? "bg-red-500/12 text-[#DC2626] dark:text-red-400"
                      : "bg-emerald-500/12 text-[#059669] dark:text-emerald-400"
                  }`}
                >
                  {overBudget > 0 ? `${overBudget} over budget` : "All within budget"}
                </span>
              )
            }
          >
            {budgetRows.length === 0 ? (
              <Empty>
                No budgets set yet.{" "}
                <Link href="/dashboard/expenses" className="font-semibold text-primary underline">
                  Set one on the Expenses page
                </Link>
              </Empty>
            ) : (
              <>
                <ul className="mb-3 flex flex-wrap gap-4 text-[11px] text-foreground-muted" aria-label="Legend">
                  <li className="flex items-center gap-1.5"><i className="h-2 w-4 rounded-full bg-primary" />Spent</li>
                  <li className="flex items-center gap-1.5"><i className="h-3 w-0.5 rounded-full bg-foreground" />Limit</li>
                  <li className="flex items-center gap-1.5"><i className="h-2 w-4 rounded-full bg-[#EF4444]" />Over limit</li>
                </ul>
                <ul className="divide-y divide-border/50">
                  {budgetRows.map((b) => {
                    const over = b.spent > b.limit;
                    return (
                      <li key={b.category} className="grid grid-cols-[minmax(0,7.5rem)_1fr_auto] items-center gap-3 py-2.5">
                        <span className="flex items-center gap-2 min-w-0">
                          <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: CATEGORY_HEX[b.category] }} />
                          <b className="truncate text-[13px] font-semibold text-foreground">{b.category}</b>
                        </span>
                        <span
                          className="relative h-2.5 rounded-full bg-surface-muted/80"
                          role="meter"
                          aria-valuemin={0}
                          aria-valuemax={b.limit}
                          aria-valuenow={Math.round(b.spent)}
                          aria-label={`${b.category}: ${fmt(b.spent)} of ${fmt(b.limit)}`}
                        >
                          <i
                            className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ${over ? "bg-[#EF4444]" : "bg-primary"}`}
                            style={{ width: `${(b.spent / budgetScale) * 100}%` }}
                          />
                          <i
                            className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-foreground"
                            style={{ left: `${(b.limit / budgetScale) * 100}%` }}
                            title={`Limit ${fmt(b.limit)}`}
                          />
                        </span>
                        <span className="text-right tabular-nums text-xs whitespace-nowrap">
                          <b className={over ? "text-[#DC2626] dark:text-red-400" : "text-foreground"}>{fmt(b.spent)}</b>
                          <small className="text-foreground-muted"> / {fmt(b.limit)}</small>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </Card>

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
                    <b className="font-display font-medium text-5xl text-foreground tabular-nums">{settledPct}</b>
                    <span className="font-display text-2xl text-foreground">%</span>
                    <span className="text-xs text-foreground-muted">of the amount is settled</span>
                  </p>
                  <div
                    className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full"
                    role="img"
                    aria-label={`${fmt(khataStats.settled)} settled, ${fmt(khataStats.pending)} pending`}
                  >
                    <i className="h-full rounded-full bg-primary" style={{ width: `${settledPct}%` }} />
                    <i className="h-full flex-1 rounded-full bg-[#F59E0B]" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-foreground-sub">
                    <span className="flex items-center gap-1.5">
                      <i className="h-2 w-2 rounded-full bg-primary" />
                      <b className="tabular-nums text-foreground">{fmt(khataStats.settled)}</b> settled
                    </span>
                    <span className="flex items-center gap-1.5">
                      <i className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                      <b className="tabular-nums text-foreground">{fmt(khataStats.pending)}</b> pending
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-[13px] font-semibold text-foreground">Oldest dues owed to you</h3>
                  {khataStats.oldest.length === 0 ? (
                    <Empty>Nobody owes you anything right now.</Empty>
                  ) : (
                    <ul className="divide-y divide-border/50">
                      {khataStats.oldest.map((k) => {
                        const initials = k.personName
                          .split(" ")
                          .map((w) => w[0])
                          .filter(Boolean)
                          .slice(0, 2)
                          .join("")
                          .toUpperCase();
                        return (
                          <li key={k.id}>
                            <Link
                              href="/dashboard/khata"
                              className="flex items-center gap-3 rounded-2xl px-1 py-2.5 transition hover:bg-surface-muted/50"
                            >
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold text-white">
                                {initials || "?"}
                              </span>
                              <span className="min-w-0 flex-1">
                                <b className="block truncate text-[13px] font-semibold text-foreground">{k.personName}</b>
                                <small className="block truncate text-[11px] text-foreground-muted">
                                  {fmt(k.amount)}
                                  {k.notes ? ` · ${k.notes}` : ""}
                                </small>
                              </span>
                              <span className="text-right">
                                <b className="block tabular-nums text-sm text-foreground">{daysAgo(k.date, today)}d</b>
                                <small className="block text-[10px] text-foreground-muted">pending</small>
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
