"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BentoCard } from "@/components/ui/bento-card";
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
import { useGetSubscriptionsQuery } from "@/store/api/subscriptionsApi";
import { useGetTasksQuery, useUpdateTaskMutation } from "@/store/api/tasksApi";
import { useRecordDealClickMutation, useSearchDealsQuery } from "@/store/api/dealsApi";
import { CATEGORY_DEAL_SEARCH, DEAL_CATEGORIES, mapSearchResponseToDeals, type DealCategory } from "@/lib/deal-search";
import { resolveDealProductImage } from "@/lib/deal-images";
import { Illustration } from "@/components/ui/illustration";

interface CustomerSummary {
  id: string;
  name: string;
  phone?: string;
  net: number;
  note?: string;
}

/** Items shown in "Next two weeks" before the "more in calendar" button. */
const UPCOMING_SHOWN = 4;

const UPCOMING_META = {
  bill: { label: "Bill", color: "var(--amber)" },
  sub: { label: "Renewal", color: "var(--rose)" },
  task: { label: "Task", color: "var(--violet)" },
  "khata-in": { label: "Khata · owed to you", color: "var(--good)" },
  "khata-out": { label: "Khata · you owe", color: "var(--bad)" },
} as const;

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
  // Live deals by category (same searches as the Deals page's category chips).
  const [dealCategory, setDealCategory] = useState<DealCategory>("Electronics");
  const dealQuery = CATEGORY_DEAL_SEARCH[dealCategory];
  const { currentData: dealSearch, isFetching: dealsLoading } = useSearchDealsQuery(dealQuery);
  const deals = useMemo(() => (dealSearch ? mapSearchResponseToDeals(dealSearch, dealQuery) : []), [dealSearch, dealQuery]);
  const [recordDealClick] = useRecordDealClickMutation();
  const [updateReminder] = useUpdateReminderMutation();
  const { data: subscriptions = [] } = useGetSubscriptionsQuery();
  // Tasks from 30 days back (overdue ones still show) to two weeks ahead.
  const taskRange = useMemo(() => {
    const d = new Date();
    const k = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
    return { from: k(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 30)), to: k(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 14)) };
  }, []);
  const { data: tasks = [] } = useGetTasksQuery(taskRange);
  const [updateTask] = useUpdateTaskMutation();

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
  const { monthSeries } = useMemo(() => {
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

    return { monthSeries: series };
  }, [transactions]);


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

  // 6b. Everything coming up in the next 14 days (overdue included): bills, renewals, tasks and
  // khata repayments, soonest first. Feeds the "Next two weeks" card.
  type UpcomingKind = "bill" | "sub" | "task" | "khata-in" | "khata-out";
  const upcoming = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const horizon = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14).getTime();
    const at = (s: string) => {
      const [y, m, d] = s.slice(0, 10).split("-").map(Number);
      return new Date(y, m - 1, d).getTime();
    };
    const items: { key: string; kind: UpcomingKind; time: number; title: string; amount?: number; refId: string }[] = [];
    for (const r of reminders) if (r.status === "pending" && r.dueDate && at(r.dueDate) <= horizon) items.push({ key: `b-${r.id}`, kind: "bill", time: at(r.dueDate), title: r.title, amount: r.amount, refId: r.id });
    for (const s of subscriptions) {
      if (!s.nextBillingDate) continue;
      const t = at(s.nextBillingDate);
      if (t >= today.getTime() && t <= horizon) items.push({ key: `s-${s.id}`, kind: "sub", time: t, title: s.name, amount: s.amount, refId: s.id });
    }
    for (const t of tasks) if (t.status !== "done" && at(t.dueDate) <= horizon) items.push({ key: `t-${t.id}`, kind: "task", time: at(t.dueDate), title: t.title, refId: t.id });
    for (const k of khataEntries) {
      if (k.status !== "pending" || !k.dueDate || at(k.dueDate) > horizon) continue;
      const gave = k.type === "gave";
      items.push({ key: `k-${k.id}`, kind: gave ? "khata-in" : "khata-out", time: at(k.dueDate), title: gave ? `Collect from ${k.personName}` : `Pay back ${k.personName}`, amount: k.amount, refId: k.personName });
    }
    return items.sort((a, b) => a.time - b.time).map((it) => {
      const days = Math.round((it.time - today.getTime()) / 86_400_000);
      const d = new Date(it.time);
      return { ...it, day: d.getDate(), month: d.toLocaleDateString("en-US", { month: "short" }), days };
    });
  }, [reminders, subscriptions, tasks, khataEntries]);

  // 7. This month by category (real), replacing the old invented "wallets" breakdown.
  const monthCategories = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return buildCategorySplit(transactions.filter((t) => t.date?.startsWith(ym)), 4);
  }, [transactions]);

  // Featured Deal
  // Best 3 by discount for the Overview card.
  const topDeals = useMemo(() => [...deals].sort((a, b) => b.discountPercent - a.discountPercent).slice(0, 3), [deals]);

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
            className="inline-flex items-center justify-center gap-2 h-11 px-[18px] rounded-[14px] font-bold text-[16px] bg-[var(--primary)] hover:bg-[var(--primary-strong)] text-[var(--on-primary)] shadow-xs transition-all cursor-pointer select-none leading-none"
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
                  <Link
                    key={b.category}
                    href={`/dashboard/expenses?category=${encodeURIComponent(b.category)}`}
                    title={`See ${b.category} payments this month`}
                    className="-mx-2 block space-y-2 rounded-[12px] px-2 py-1.5 transition hover:bg-[var(--surface-2)]"
                  >
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
                  </Link>
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
          className="col-span-12 md:col-span-6"
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
              <div className="flex flex-col items-center gap-2 rounded-[16px] bg-[var(--surface-2)] px-4 py-6 text-center">
                <Illustration name="person-empty-desk" height={80} />
                <p className="text-[14px] text-foreground-muted">No spending recorded this month yet.</p>
              </div>
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

        {/* ROW 2 CARD 2: Next two weeks — bills, renewals, tasks and khata dues */}
        <BentoCard
          className="col-span-12 flex flex-col md:col-span-6"
          title="Next two weeks"
          subtitle={upcoming.length ? `${upcoming.length} coming up${upcoming.some((u) => u.days < 0) ? ` · ${upcoming.filter((u) => u.days < 0).length} overdue` : ""}` : "Bills, renewals, tasks and khata dues"}
          actionHref="/dashboard/calendar"
          actionLabel="Calendar"
        >
          {upcoming.length > 0 ? (
            <>
              <ul className="mb-3 space-y-2">
                {upcoming.slice(0, UPCOMING_SHOWN).map((u, i) => {
                  const meta = UPCOMING_META[u.kind];
                  const when = u.days < 0 ? `${-u.days}d overdue` : u.days === 0 ? "Today" : u.days === 1 ? "Tomorrow" : `In ${u.days} days`;
                  return (
                    <li
                      key={u.key}
                      className="tk-cal-agenda flex min-w-0 items-center gap-3 rounded-[14px] border border-border bg-[var(--surface-2)] p-2.5 text-[14px]"
                      style={{ animationDelay: `${i * 0.04}s` }}
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] border border-border bg-surface leading-none text-foreground">
                        <span className="text-[14px] font-extrabold num">{u.day}</span>
                        <span className="text-[11px] font-bold uppercase text-foreground-muted">{u.month}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <b className="block truncate text-[15px] font-bold text-foreground">{u.title}</b>
                        <span className="flex min-w-0 items-center gap-1.5 text-[13px] text-foreground-muted">
                          <i className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: meta.color }} />
                          <span className="truncate">
                            {meta.label} · <span className={u.days < 0 ? "font-bold text-[var(--bad)]" : u.days <= 2 ? "font-bold text-[var(--warn)]" : ""}>{when}</span>
                          </span>
                        </span>
                      </span>
                      {u.amount != null && (
                        <span className={`shrink-0 font-extrabold num ${u.kind === "khata-in" ? "text-[var(--good)]" : "text-foreground"}`}>
                          {u.kind === "khata-in" ? "+" : "−"}₹{Math.round(u.amount).toLocaleString("en-IN")}
                        </span>
                      )}
                      {u.kind === "bill" ? (
                        <button
                          type="button"
                          onClick={() => updateReminder({ id: u.refId, patch: { status: "paid" } }).unwrap().catch(() => {})}
                          className="inline-flex h-8 shrink-0 items-center rounded-[10px] bg-[var(--good)] px-2.5 text-[13px] font-bold text-white transition hover:brightness-110"
                        >
                          Pay
                        </button>
                      ) : u.kind === "task" ? (
                        <button
                          type="button"
                          onClick={() => updateTask({ id: u.refId, patch: { status: "done" } })}
                          className="inline-flex h-8 shrink-0 items-center rounded-[10px] bg-[var(--violet)] px-2.5 text-[13px] font-bold text-white transition hover:brightness-110"
                        >
                          Done
                        </button>
                      ) : (
                        <Link
                          href={u.kind === "sub" ? "/dashboard/subscriptions" : `/dashboard/khata?person=${encodeURIComponent(u.refId)}`}
                          aria-label={`Open ${u.title}`}
                          className="inline-grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-foreground-muted transition hover:bg-surface hover:text-foreground"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="m9.5 6 6 6-6 6" />
                          </svg>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
              {upcoming.length > UPCOMING_SHOWN && (
                <Link
                  href="/dashboard/calendar"
                  className="mt-auto inline-flex h-11 w-full items-center justify-center gap-2 rounded-[14px] border border-border bg-surface text-[15px] font-bold text-foreground transition hover:bg-[var(--surface-2)]"
                >
                  <span className="grid h-6 min-w-6 place-items-center rounded-full bg-[var(--primary-soft)] px-1.5 text-[13px] font-extrabold text-[var(--primary)] num">
                    +{upcoming.length - UPCOMING_SHOWN}
                  </span>
                  more in calendar
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              )}
            </>
          ) : (
            // Fills the card's height (the row's tallest card sets it), content centred.
            <div className="flex min-h-[200px] flex-1 flex-col items-center justify-center gap-3 rounded-[16px] bg-[var(--surface-2)] px-4 py-6 text-center">
              <Illustration name="person-paid-receipt" height={110} />
              <div>
                <p className="text-[15px] font-bold text-foreground">You&apos;re all clear</p>
                <p className="text-[14px] text-foreground-muted">No bills, renewals, tasks or khata dues in the next 14 days.</p>
              </div>
              <Link href="/dashboard/calendar" className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-border bg-surface px-3 text-[14px] font-bold text-foreground transition hover:bg-surface-muted">
                Open calendar
              </Link>
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
          actionHref={`/dashboard/deals?q=${encodeURIComponent(dealQuery)}`}
          actionLabel="All Deals"
        >
          <div className="-mt-1 mb-3 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar" role="group" aria-label="Deal category">
            {DEAL_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setDealCategory(c)}
                aria-pressed={dealCategory === c}
                className={`inline-flex h-[30px] shrink-0 items-center rounded-full px-3 text-[13px] font-bold transition ${
                  dealCategory === c ? "bg-[var(--primary)] text-[var(--on-primary)]" : "border border-border bg-surface text-foreground-muted hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          {dealsLoading && topDeals.length === 0 ? (
            <div className="grid gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[72px] animate-pulse rounded-[14px] bg-[var(--surface-2)]" />
              ))}
            </div>
          ) : topDeals.length > 0 ? (
            <ul className="grid gap-2">
              {topDeals.map((d, i) => {
                const price = d.finalPrice || d.currentPrice;
                const url = d.dealUrl || d.sourceUrl;
                return (
                  <li key={d.id} className="tk-cal-agenda" style={{ animationDelay: `${i * 0.05}s` }}>
                    <a
                      href={url || "/dashboard/deals"}
                      target={url ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      onClick={() => {
                        if (d.sourceEngine === "provider") recordDealClick(d.id).catch(() => {});
                      }}
                      className="flex min-w-0 items-center gap-3 rounded-[14px] border border-border bg-[var(--surface-2)] p-2 transition hover:border-[var(--line-2)] hover:bg-surface"
                    >
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] border border-border bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element -- merchant CDN images */}
                        <img
                          src={resolveDealProductImage(d.title, d.category, d.imageUrl)}
                          alt=""
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-contain p-1"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <b className="line-clamp-1 text-[14px] font-bold text-foreground" title={d.title}>
                          {d.title}
                        </b>
                        <span className="mt-0.5 flex items-baseline gap-2 text-[13px]">
                          <b className="text-[15px] font-extrabold text-foreground num">₹{Math.round(price).toLocaleString("en-IN")}</b>
                          {d.originalPrice > price && <span className="text-foreground-muted line-through num">₹{Math.round(d.originalPrice).toLocaleString("en-IN")}</span>}
                          <span className="truncate text-foreground-muted">{d.platform}</span>
                        </span>
                      </span>
                      {d.discountPercent > 0 && (
                        <span className="shrink-0 rounded-full bg-[var(--primary)] px-2 py-0.5 text-[12px] font-extrabold text-[var(--on-primary)]">{d.discountPercent}% OFF</span>
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-[16px] bg-[var(--surface-2)] px-4 py-6 text-center">
              <Illustration name="person-searching-torch" height={80} />
              <p className="text-[14px] text-foreground-muted">No live deals right now. Search for a product on the Deals page.</p>
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
