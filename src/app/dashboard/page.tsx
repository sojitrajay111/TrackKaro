"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BentoCard } from "@/components/ui/bento-card";
import { RunwayDial } from "@/components/ui/runway-dial";
import { CashBridgeChart, type MonthData } from "@/components/ui/cash-bridge-chart";
import { CategoryDonut, CategoryLegend, buildCategorySplit } from "@/components/insights/spending-charts";
import { RecordExpenseModal } from "@/components/ui/record-expense-modal";
import { CustomerLedgerDrawer } from "@/components/khata/customer-ledger-drawer";
import { useAppSelector } from "@/store";
import { useI18n } from "@/i18n";

import { useGetTransactionsQuery } from "@/store/api/transactionsApi";
import { useGetKhataEntriesQuery } from "@/store/api/khataApi";
import { useGetBudgetsQuery } from "@/store/api/budgetsApi";
import { useGetRemindersQuery, useUpdateReminderMutation } from "@/store/api/remindersApi";
import { useGetDealsQuery } from "@/store/api/dealsApi";

interface CustomerSummary {
  id: string;
  name: string;
  phone?: string;
  net: number;
  note?: string;
}

export default function DashboardOverviewPage() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const { t } = useI18n();
  const userName = user?.name ? user.name.split(" ")[0] : "Friend";

  const [bridgeRange, setBridgeRange] = useState<"6M" | "12M">("12M");
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedKhataCustomer, setSelectedKhataCustomer] = useState<string | null>(null);

  // Dynamic time-responsive greeting
  const [greetingKey, setGreetingKey] = useState<"goodMorning" | "goodAfternoon" | "goodEvening">(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return "goodMorning";
    if (hour >= 12 && hour < 17) return "goodAfternoon";
    return "goodEvening";
  });

  useEffect(() => {
    const computeGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 4 && hour < 12) return "goodMorning";
      if (hour >= 12 && hour < 17) return "goodAfternoon";
      return "goodEvening";
    };
    const interval = setInterval(() => {
      setGreetingKey(computeGreeting());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const greeting = t[greetingKey] || t.goodMorning;

  // Real backend queries via RTK Query
  const { data: transactions = [] } = useGetTransactionsQuery();
  const { data: khataEntries = [] } = useGetKhataEntriesQuery();
  const { data: budgets = [] } = useGetBudgetsQuery();
  const { data: reminders = [] } = useGetRemindersQuery();
  const { data: deals = [] } = useGetDealsQuery();
  const [updateReminder] = useUpdateReminderMutation();

  // 1. Calculate Real Financial Metrics
  const { totalBalance, monthlySpent, monthlyIncome, categoryTotals } = useMemo(() => {
    let income = 0;
    let expense = 0;
    let mSpent = 0;
    let mIncome = 0;
    const catMap = new Map<string, number>();

    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    transactions.forEach((tx) => {
      const isThisMonth = tx.date?.startsWith(currentYearMonth);
      const amt = Number(tx.amount || 0);
      if (tx.type === "income") {
        income += amt;
        if (isThisMonth) mIncome += amt;
      } else {
        expense += amt;
        if (isThisMonth) {
          mSpent += amt;
          const prev = catMap.get(tx.category) || 0;
          catMap.set(tx.category, prev + amt);
        }
      }
    });

    return {
      totalBalance: income - expense,
      monthlySpent: mSpent,
      monthlyIncome: mIncome,
      categoryTotals: catMap,
    };
  }, [transactions]);

  // 2. Calculate Real Khata Totals & Top Pending Contacts
  const { willGet, willGive, pendingCustomers } = useMemo<{
    willGet: number;
    willGive: number;
    pendingCustomers: CustomerSummary[];
  }>(() => {
    let getSum = 0;
    let giveSum = 0;
    const personMap = new Map<string, CustomerSummary>();

    khataEntries.forEach((entry) => {
      if (entry.status === "pending") {
        const amt = Number(entry.amount || 0);
        if (entry.type === "gave") {
          getSum += amt;
        } else {
          giveSum += amt;
        }

        const current = personMap.get(entry.personName) || {
          id: entry.id,
          name: entry.personName,
          phone: entry.phone,
          net: 0,
          note: entry.notes,
        };
        current.net += entry.type === "gave" ? amt : -amt;
        if (entry.notes) current.note = entry.notes;
        personMap.set(entry.personName, current);
      }
    });

    const customers = Array.from(personMap.values()).sort(
      (a, b) => Math.abs(b.net) - Math.abs(a.net)
    );

    return {
      willGet: getSum,
      willGive: giveSum,
      pendingCustomers: customers,
    };
  }, [khataEntries]);

  // 3. Cash bridge: real month-by-month balance from recorded transactions.
  // Balance = everything recorded before the 12-month window, then each month's in/out on top.
  const { monthSeries, avgMonthlySpend } = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const windowStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const windowStartKey = `${windowStart.getFullYear()}-${String(windowStart.getMonth() + 1).padStart(2, "0")}`;

    const txByMonth = new Map<string, { in: number; out: number }>();
    let runningBalance = 0;
    transactions.forEach((tx) => {
      if (!tx.date) return;
      const amt = Number(tx.amount || 0);
      const signed = tx.type === "income" ? amt : -amt;
      const ym = tx.date.slice(0, 7);
      if (ym < windowStartKey) {
        runningBalance += signed;
        return;
      }
      const current = txByMonth.get(ym) || { in: 0, out: 0 };
      if (tx.type === "income") current.in += amt;
      else current.out += amt;
      txByMonth.set(ym, current);
    });

    const series: MonthData[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const { in: inflow, out: outflow } = txByMonth.get(ym) || { in: 0, out: 0 };
      const open = runningBalance;
      const close = open + inflow - outflow;
      runningBalance = close;
      series.push({ month: monthNames[d.getMonth()], year: d.getFullYear(), open, inflow, outflow, net: inflow - outflow, close });
    }

    // Average spend over the last three full months (the current month is still in progress).
    const lastThree = series.slice(-4, -1);
    const avg = lastThree.reduce((acc, m) => acc + m.outflow, 0) / Math.max(1, lastThree.length);

    return { monthSeries: series, avgMonthlySpend: Math.round(avg) };
  }, [transactions]);

  // 4. Runway: how many months the recorded balance lasts at the average spend.
  const runwayMonths = avgMonthlySpend > 0 && totalBalance > 0 ? totalBalance / avgMonthlySpend : 0;
  // Kesta's "+ Reserve" equivalent: also count money people owe you (pending khata you gave).
  const runwayWithOwed = avgMonthlySpend > 0 && totalBalance + willGet > 0 ? (totalBalance + willGet) / avgMonthlySpend : 0;
  const [runwayMode, setRunwayMode] = useState<"cash" | "owed">("cash");

  // 5. Budgets: only categories you actually set a limit for, against what you actually spent.
  const budgetList = useMemo(() => {
    return budgets
      .filter((b) => (b.limit || 0) > 0)
      .map((b) => {
        const spent = categoryTotals.get(b.category) || 0;
        const limit = b.limit;
        const pct = Math.round((spent / limit) * 100);
        let status = { label: "On Track", pillClass: "pill--pine", barTint: "tint-bg--pine" };
        if (pct >= 90) status = { label: pct > 100 ? "Over" : "Warning", pillClass: "pill--coral", barTint: "tint-bg--coral" };
        else if (pct >= 70) status = { label: "Attention", pillClass: "pill--amber", barTint: "tint-bg--amber" };
        return { category: b.category, spent, limit, pct: Math.min(100, pct), status };
      });
  }, [budgets, categoryTotals]);

  // 6. Upcoming: pending bills due in the next two weeks (overdue ones included), soonest first.
  const { upcomingReminders, dueThisWeekCount } = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const horizon = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14);
    const list = reminders
      .filter((r) => r.status === "pending" && r.dueDate)
      .map((r) => {
        const [y, m, d] = r.dueDate.slice(0, 10).split("-").map(Number);
        return { r, due: new Date(y, m - 1, d) };
      })
      .filter(({ due }) => due <= horizon)
      .sort((a, b) => a.due.getTime() - b.due.getTime())
      .slice(0, 5)
      .map(({ r, due }) => ({
        id: r.id,
        day: due.getDate(),
        month: due.toLocaleDateString("en-US", { month: "short" }),
        dueTime: due.getTime(),
        title: r.title,
        merchant: r.category || "Bill",
        amount: Number(r.amount || 0),
        status: r.status,
      }));
    const weekAhead = today.getTime() + 7 * 86_400_000;
    return { upcomingReminders: list, dueThisWeekCount: list.filter((r) => r.dueTime <= weekAhead).length };
  }, [reminders]);

  // 7. This month by category (real), replacing the old invented "wallets" breakdown.
  const monthCategories = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return buildCategorySplit(transactions.filter((t) => t.date?.startsWith(ym)), 4);
  }, [transactions]);

  // Featured Deal
  const featuredDeal = deals.length > 0 ? deals[0] : null;

  const topSpentBudget = useMemo(() => {
    if (budgetList.length === 0) return null;
    return [...budgetList].sort((a, b) => b.pct - a.pct)[0];
  }, [budgetList]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Kesta Hero Header (`header.head`) */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
        <div>
          <h1 className="text-[30px] lg:text-[clamp(1.875rem,2.5vw,2.375rem)] font-extrabold tracking-[-0.04em] text-foreground leading-[1.08]">
            {greeting}, {userName}
          </h1>
          <p className="mt-1.5 text-[16px] font-medium text-foreground-muted">
            {willGet > 0 ? (
              <>
                <strong className="text-foreground font-bold">
                  ₹{willGet.toLocaleString("en-IN")}
                </strong>{" "}
                to receive from {pendingCustomers[0]?.name ? `${pendingCustomers[0].name}${pendingCustomers.length > 1 ? ` +${pendingCustomers.length - 1} more` : ""}` : "Khata customers"} ·{" "}
              </>
            ) : monthlyIncome > 0 ? (
              <>
                <strong className="text-foreground font-bold">
                  ₹{monthlyIncome.toLocaleString("en-IN")}
                </strong>{" "}
                income tracked this month ·{" "}
              </>
            ) : (
              <>
                <strong className="text-foreground font-bold">
                  ₹{totalBalance.toLocaleString("en-IN")}
                </strong>{" "}
                available balance ·{" "}
              </>
            )}
            {dueThisWeekCount > 0 ? (
              <>
                <strong className="text-foreground font-bold">{dueThisWeekCount}</strong>{" "}
                {dueThisWeekCount === 1 ? "payment" : "payments"} due this week
              </>
            ) : (
              "Nothing due this week"
            )}{" "}
            ·{" "}
            {topSpentBudget ? (
              <>
                {topSpentBudget.category} is{" "}
                <strong className="text-foreground font-bold">{topSpentBudget.pct}%</strong> spent
              </>
            ) : (
              "No budgets set yet"
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/dashboard/khata"
            className="inline-flex items-center justify-center gap-2 h-11 px-[18px] rounded-[14px] font-bold text-[16px] bg-surface hover:bg-surface-muted text-foreground border border-border shadow-xs transition-all cursor-pointer select-none leading-none"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="shrink-0">
              <path d="M4 8.5h14M14.5 5 18 8.5 14.5 12M20 15.5H6M9.5 12 6 15.5 9.5 19" />
            </svg>
            <span>Transfer</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowRecordModal(true)}
            className="inline-flex items-center justify-center gap-2 h-11 px-[18px] rounded-[14px] font-bold text-[16px] bg-[#161614] hover:bg-black text-white dark:bg-[#f0c35a] dark:hover:bg-[#e0b445] dark:text-[#161614] shadow-xs transition-all cursor-pointer select-none leading-none"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Record expense</span>
          </button>
        </div>
      </header>

      {/* 2. Main Bento Grid (`grid.ov-grid`) */}
      <div className="grid grid-cols-12 gap-5">
        {/* ROW 1 LEFT: Cash bridge (`ov-flow` - 8 cols) */}
        <div className="col-span-12 lg:col-span-8 rounded-[22px] bg-surface border border-border p-5 shadow-xs">
          <CashBridgeChart
            months={monthSeries}
            range={bridgeRange}
            onRangeChange={setBridgeRange}
            currencySymbol="₹"
          />
        </div>

        {/* ROW 1 RIGHT: Budgets (`ov-prod` - 4 cols) */}
        <div className="col-span-12 lg:col-span-4 rounded-[22px] bg-surface border border-border p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-foreground">
                  Budgets
                </h2>
                <p className="text-[14px] font-medium text-foreground-muted mt-0.5">
                  Spent against limits · in INR (₹)
                </p>
              </div>
              <Link
                href="/dashboard/spending"
                className="inline-flex items-center gap-1 text-[14px] font-bold text-foreground hover:opacity-80 transition-opacity"
              >
                <span>All</span>
                <span>→</span>
              </Link>
            </div>

            <div className="space-y-4">
              {budgetList.length === 0 && (
                <p className="rounded-[16px] bg-surface-muted/40 px-4 py-8 text-center text-[14px] text-foreground-muted">
                  No budgets set yet.{" "}
                  <Link href="/dashboard/expenses" className="font-bold text-foreground underline">
                    Set a limit
                  </Link>
                </p>
              )}
              {[...budgetList].sort((x, y) => y.pct - x.pct).slice(0, 3).map((b) => {
                const isOver = b.pct >= 90;
                const isWarn = b.pct >= 70 && b.pct < 90;
                const pillBg = isOver
                  ? "bg-[#fae6e4] dark:bg-[#331518] text-[#d1495b] dark:text-[#ff9670]"
                  : isWarn
                  ? "bg-[#faeed7] dark:bg-[#332711] text-[#845b16] dark:text-[#f0c35a]"
                  : "bg-[#e1f3ed] dark:bg-[#132d24] text-[#1f8366] dark:text-[#6cc7a2]";
                const dotBg = isOver ? "bg-[#d1495b]" : isWarn ? "bg-[#cc8e2a]" : "bg-[#1f8366]";
                const barFill = isOver ? "bg-[#e2683f]" : isWarn ? "bg-[#cb9233]" : "bg-[#1f8366]";

                return (
                  <div key={b.category} className="space-y-2">
                    <div className="flex items-center justify-between text-[14px]">
                      <span className="font-extrabold text-foreground">{b.category}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[14px] font-bold flex items-center gap-1.5 ${pillBg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dotBg}`} />
                        {b.status.label}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#e8e2d1] dark:bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barFill}`}
                        style={{ width: `${b.pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[14px] font-medium text-foreground-muted num">
                      <span>
                        ₹{b.spent.toLocaleString("en-IN")} of ₹{b.limit.toLocaleString("en-IN")}
                      </span>
                      <span className="font-bold text-foreground">{b.pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery / milestone callout banner at bottom */}
          {upcomingReminders.length > 0 ? (
            <div className="mt-5 p-3 rounded-2xl bg-surface-muted border border-border flex items-center justify-between text-[14px]">
              <div className="flex items-center gap-2 truncate">
                <span className="text-base shrink-0">📅</span>
                <span className="font-semibold text-foreground truncate">
                  Next due: {upcomingReminders[0].title} (₹{upcomingReminders[0].amount.toLocaleString("en-IN")})
                </span>
              </div>
              <Link href="/dashboard/calendar" className="font-bold text-foreground hover:underline shrink-0 ml-2">
                Details →
              </Link>
            </div>
          ) : (
            <div className="mt-5 p-3 rounded-2xl bg-surface-muted border border-border flex items-center justify-between text-[14px]">
              <div className="flex items-center gap-2">
                <span className="text-base">✨</span>
                <span className="font-semibold text-foreground">All budgets within limit</span>
              </div>
              <Link href="/dashboard/spending" className="font-bold text-foreground hover:underline">
                Manage →
              </Link>
            </div>
          )}
        </div>

        {/* ROW 2 CARD 1: This month, by category (from recorded transactions) */}
        <BentoCard
          className="col-span-12 lg:col-span-4"
          title="This month"
          subtitle="Where your spending went"
          actionHref="/dashboard/spending"
          actionLabel="Spending insights"
        >
          <div className="space-y-4">
            <div className="flex items-baseline justify-between pb-3 border-b border-border/50">
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-foreground num">
                  ₹{monthlySpent.toLocaleString("en-IN")}
                </div>
                <div className="text-[13px] font-medium text-foreground-muted mt-0.5">
                  spent · ₹{monthlyIncome.toLocaleString("en-IN")} in
                </div>
              </div>
            </div>
            {monthCategories.length === 0 ? (
              <p className="rounded-[16px] bg-surface-muted/40 px-4 py-8 text-center text-[14px] text-foreground-muted">
                No spending recorded this month yet.
              </p>
            ) : (
              // Container query: side by side only when the card itself is wide enough.
              <div className="@container pt-1">
                <div className="flex flex-col items-center gap-4 @[19rem]:flex-row @[19rem]:gap-5">
                  <CategoryDonut slices={monthCategories} size={112} />
                  <div className="w-full min-w-0 @[19rem]:flex-1">
                    <CategoryLegend slices={monthCategories} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </BentoCard>

        {/* ROW 2 CARD 2: Runway (Kesta ov-run: dial + two facts, Cash / + Owed toggle) */}
        <BentoCard
          className="col-span-12 md:col-span-6 lg:col-span-4"
          title="Runway"
          subtitle="At the last three months' average spend"
          headerTools={
            <div className="seg" role="group" aria-label="Count">
              {(
                [
                  ["cash", "Cash"],
                  ["owed", "+ Owed"],
                ] as const
              ).map(([v, label]) => (
                <button key={v} type="button" className="seg__btn" aria-pressed={runwayMode === v} onClick={() => setRunwayMode(v)}>
                  {label}
                </button>
              ))}
            </div>
          }
        >
          {avgMonthlySpend > 0 ? (
            <>
              <RunwayDial value={runwayMode === "cash" ? runwayMonths : runwayWithOwed} max={12} />
              <dl className="mt-3.5 grid grid-cols-2 gap-2.5">
                <div className="min-w-0 rounded-[14px] border border-border bg-[var(--surface-2)] px-3 py-2.5">
                  <dt className="text-[13px] font-bold text-foreground-muted">Monthly burn</dt>
                  <dd className="truncate text-[17px] font-extrabold tracking-[-0.02em] text-foreground num">₹{avgMonthlySpend.toLocaleString("en-IN")}</dd>
                </div>
                <div className="min-w-0 rounded-[14px] border border-border bg-[var(--surface-2)] px-3 py-2.5">
                  <dt className="text-[13px] font-bold text-foreground-muted">{runwayMode === "cash" ? "With money owed" : "Cash only"}</dt>
                  <dd className="truncate text-[17px] font-extrabold tracking-[-0.02em] text-foreground num">
                    {(runwayMode === "cash" ? runwayWithOwed : runwayMonths).toFixed(1)} mo
                  </dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="rounded-[16px] bg-[var(--surface-2)] px-4 py-10 text-center text-[15px] text-foreground-muted">
              Runway needs spending from at least one full month. Record expenses and it appears here.
            </p>
          )}
        </BentoCard>

        {/* ROW 2 CARD 3: Next Two Weeks (`ov-up` - 4 cols) */}
        <BentoCard
          className="col-span-12 md:col-span-6 lg:col-span-4"
          title="Next two weeks"
          subtitle={`${upcomingReminders.length} upcoming payments`}
          actionHref="/dashboard/calendar"
          actionLabel="Calendar"
        >
          {upcomingReminders.length > 0 ? (
            <ul className="space-y-2.5">
              {upcomingReminders.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-surface-muted/40 hover:bg-surface-muted/70 transition border border-border/40 text-[14px]"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {/* Date badge */}
                    <div className="flex flex-col items-center justify-center w-8 h-8 rounded-lg bg-surface border border-border/60 text-foreground shrink-0 leading-none">
                      <span className="text-[13px] font-extrabold num">{r.day}</span>
                      <span className="text-[12px] font-bold uppercase text-foreground-muted">
                        {r.month}
                      </span>
                    </div>

                    <div className="truncate">
                      <div className="font-bold text-foreground truncate">{r.title}</div>
                      <div className="text-[12px] text-foreground-muted truncate">
                        {r.merchant}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="font-bold text-coral num">
                      −₹{r.amount.toLocaleString("en-IN")}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await updateReminder({ id: r.id, patch: { status: "paid" } }).unwrap();
                        } catch {}
                      }}
                      className="inline-flex items-center justify-center px-3 py-1 rounded-full text-[14px] font-bold bg-[#2822120f] dark:bg-white/10 hover:bg-surface border border-border text-foreground transition-all cursor-pointer select-none"
                    >
                      Pay
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-foreground-muted text-[14px]">
              No bills due in the next 14 days.
            </div>
          )}
        </BentoCard>

        {/* Card 6: Khata Ledger Glance */}
        <BentoCard
          className="col-span-12 lg:col-span-6"
          title="Khata Ledger"
          subtitle="Customer receivables & payables"
          actionHref="/dashboard/khata"
          actionLabel="Open Ledger"
        >
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-pine/10 border border-pine/20">
              <div className="text-[13px] font-medium text-pine">You Will Get</div>
              <div className="text-xl font-extrabold text-pine num mt-0.5">
                +₹{willGet.toLocaleString("en-IN")}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-coral/10 border border-coral/20">
              <div className="text-[13px] font-medium text-coral">You Will Give</div>
              <div className="text-xl font-extrabold text-coral num mt-0.5">
                −₹{willGive.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {pendingCustomers.slice(0, 3).map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedKhataCustomer(c.name)}
                className="flex items-center justify-between p-2 rounded-xl bg-surface-muted/40 hover:bg-surface-muted/80 cursor-pointer transition border border-border/40 text-[14px]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-surface-muted font-bold text-[13px] flex items-center justify-center text-foreground-sub">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{c.name}</div>
                    {c.note && (
                      <div className="text-[12px] text-foreground-muted truncate max-w-[160px]">
                        {c.note}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className={`font-bold num ${
                    c.net >= 0 ? "text-pine" : "text-coral"
                  }`}
                >
                  {c.net >= 0 ? "+" : "−"}₹{Math.abs(c.net).toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>
        </BentoCard>

        {/* Card 7: Curated Live Deals */}
        <BentoCard
          className="col-span-12 lg:col-span-6"
          title="Deals & Offers"
          subtitle="Cashback & savings discounts"
          actionHref="/dashboard/deals"
          actionLabel="All Deals"
        >
          {featuredDeal ? (
            <div className="p-4 rounded-2xl bg-surface-muted/50 border border-border/50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="pill pill--amber text-[12px] uppercase font-bold">
                    {featuredDeal.category || "Featured Deal"}
                  </span>
                  <h3 className="text-base font-bold text-foreground mt-1.5">
                    {featuredDeal.title}
                  </h3>
                  <p className="text-[14px] text-foreground-muted mt-0.5">
                    {featuredDeal.platform} · {featuredDeal.category}
                  </p>
                </div>
                <div className="text-2xl">🏷️</div>
              </div>

              {featuredDeal.couponCode && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border font-mono text-[14px] font-bold text-foreground">
                  <span>Code: {featuredDeal.couponCode}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-[14px] text-foreground-muted">
              Live deals synced from merchant partners.
            </div>
          )}
        </BentoCard>
      </div>

      {/* Record Expense Modal */}
      <RecordExpenseModal
        isOpen={showRecordModal}
        onClose={() => setShowRecordModal(false)}
      />

      {/* Slide-out Customer Ledger Drawer */}
      <CustomerLedgerDrawer
        isOpen={Boolean(selectedKhataCustomer)}
        onClose={() => setSelectedKhataCustomer(null)}
        customerName={selectedKhataCustomer}
        entries={khataEntries}
        onAddNewEntry={() => {
          router.push("/dashboard/khata");
        }}
      />
    </div>
  );
}
