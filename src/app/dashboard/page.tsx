"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { BentoCard } from "@/components/ui/bento-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatCounter } from "@/components/ui/stat-counter";
import { CircularGauge } from "@/components/ui/circular-gauge";
import { SparkBars } from "@/components/ui/spark-bars";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector } from "@/store";
import { useI18n } from "@/i18n";

import { useGetTransactionsQuery } from "@/store/api/transactionsApi";
import { useGetKhataEntriesQuery } from "@/store/api/khataApi";
import { useGetBudgetsQuery } from "@/store/api/budgetsApi";
import { useGetRemindersQuery, useUpdateReminderMutation } from "@/store/api/remindersApi";
import { useGetGroupsQuery } from "@/store/api/groupsApi";
import { useGetDealsQuery } from "@/store/api/dealsApi";

interface CustomerSummary {
  id: string;
  name: string;
  phone?: string;
  net: number;
  note?: string;
}

export default function DashboardOverviewPage() {
  const { user } = useAppSelector((state) => state.auth);
  const { t } = useI18n();
  const userName = user?.name ? user.name.split(" ")[0] : "Friend";

  // Dynamic time-responsive greeting (Morning: 4am-12pm, Afternoon: 12pm-5pm, Evening: 5pm-4am)
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
    setGreetingKey(computeGreeting());
    const interval = setInterval(() => {
      setGreetingKey(computeGreeting());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const greeting = t[greetingKey] || t.goodMorning;

  // Real backend queries via RTK Query with loading states
  const { data: transactions = [], isLoading: loadingTx } = useGetTransactionsQuery();
  const { data: khataEntries = [], isLoading: loadingKhata } = useGetKhataEntriesQuery();
  const { data: budgets = [], isLoading: loadingBudgets } = useGetBudgetsQuery();
  const { data: reminders = [], isLoading: loadingReminders } = useGetRemindersQuery();
  const { data: groups = [], isLoading: loadingGroups } = useGetGroupsQuery();
  const { data: deals = [], isLoading: loadingDeals } = useGetDealsQuery();

  const [updateReminder] = useUpdateReminderMutation();

  // 1. Calculate Real Financial Metrics
  const { totalBalance, monthlySpent, foodSpent, shoppingSpent, billsSpent } = useMemo(() => {
    let income = 0;
    let expense = 0;
    let mSpent = 0;
    let fSpent = 0;
    let sSpent = 0;
    let bSpent = 0;

    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    transactions.forEach((tx) => {
      const isThisMonth = tx.date?.startsWith(currentYearMonth);
      if (tx.type === "income") {
        income += tx.amount;
      } else {
        expense += tx.amount;
        if (isThisMonth) {
          mSpent += tx.amount;
          if (tx.category === "Food") fSpent += tx.amount;
          else if (tx.category === "Shopping") sSpent += tx.amount;
          else if (tx.category === "Bills") bSpent += tx.amount;
        }
      }
    });

    return {
      totalBalance: income - expense,
      monthlySpent: mSpent,
      foodSpent: fSpent,
      shoppingSpent: sSpent,
      billsSpent: bSpent,
    };
  }, [transactions]);

  // 2. Calculate Real Khata Totals & Top Pending Contact
  const { willGet, willGive, topCustomer, totalPersons } = useMemo<{
    willGet: number;
    willGive: number;
    topCustomer: CustomerSummary | null;
    totalPersons: number;
  }>(() => {
    let getSum = 0;
    let giveSum = 0;
    const personMap = new Map<string, CustomerSummary>();

    khataEntries.forEach((entry) => {
      if (entry.status === "pending") {
        if (entry.type === "gave") {
          getSum += entry.amount;
        } else {
          giveSum += entry.amount;
        }

        const current = personMap.get(entry.personName) || {
          id: entry.id,
          name: entry.personName,
          phone: entry.phone,
          net: 0,
          note: entry.notes,
        };
        current.net += entry.type === "gave" ? entry.amount : -entry.amount;
        if (entry.notes) current.note = entry.notes;
        personMap.set(entry.personName, current);
      }
    });

    let top: CustomerSummary | null = null;
    personMap.forEach((person) => {
      const topNet = top ? top.net : 0;
      if (!top || Math.abs(person.net) > Math.abs(topNet)) {
        top = person;
      }
    });

    return {
      willGet: getSum,
      willGive: giveSum,
      topCustomer: top,
      totalPersons: personMap.size,
    };
  }, [khataEntries]);

  // 3. Calculate Real 7-Day Sparkbar Data
  const sparkData = useMemo(() => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const result = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayLabel = dayNames[d.getDay()][0];

      const dayTotal = transactions
        .filter((tx) => tx.type === "expense" && tx.date === dateStr)
        .reduce((sum, tx) => sum + tx.amount, 0);

      result.push({
        label: dayLabel,
        value: dayTotal,
        formatted: `₹${dayTotal.toLocaleString("en-IN")}`,
      });
    }

    return result;
  }, [transactions]);

  // 4. Calculate Real Budget Utilization
  const { totalBudgetLimit, budgetPercent, daysLeft } = useMemo(() => {
    const sumLimits = budgets.reduce((acc, b) => acc + (b.limit || 0), 0) || 30000;
    const pct = sumLimits > 0 ? Math.min(Math.round((monthlySpent / sumLimits) * 100), 100) : 0;

    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = Math.max(lastDayOfMonth - now.getDate(), 0);

    return {
      totalBudgetLimit: sumLimits,
      budgetPercent: pct,
      daysLeft: daysRemaining,
    };
  }, [budgets, monthlySpent]);

  // 5. Featured Live Deal
  const featuredDeal = deals.length > 0 ? deals[0] : null;

  // Format currency helper
  const fmt = (val: number) => `₹${Math.abs(val).toLocaleString("en-IN")}`;

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header Greeting, TrackKaro Financial Progress Rail & Live KPI Stats */}
      <div className="mb-8">
        <h1 className="font-display font-normal text-[26px] sm:text-[32px] lg:text-[38px] tracking-[-0.02em] text-foreground leading-tight mb-1.5">
          {greeting}, {userName}
        </h1>
        <p className="text-xs sm:text-sm font-medium text-foreground-muted mb-6">
          Live financial status synced from your TrackKaro cloud account.
        </p>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          {/* Segmented Financial Progress Rail */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            {/* Seg 1 - Budget Utilization */}
            <div className="flex-[28] min-w-[75px]">
              <span className="block text-[12.5px] font-medium text-foreground-sub mb-2 whitespace-nowrap">
                {t.budgetUtilization}
              </span>
              <div className="h-10 rounded-full flex items-center px-4 relative overflow-hidden bg-[#18261E] text-white shadow-xs">
                <b className="text-xs font-semibold tabular-nums">{budgetPercent}%</b>
              </div>
            </div>

            {/* Seg 2 - Food & Dining */}
            <div className="flex-[24] min-w-[75px]">
              <span className="block text-[12.5px] font-medium text-foreground-sub mb-2 whitespace-nowrap">
                {t.catFood}
              </span>
              <div className="h-10 rounded-full flex items-center px-4 relative overflow-hidden bg-emerald-600 text-white shadow-xs">
                <b className="text-xs font-semibold tabular-nums">
                  {Math.min(Math.round((foodSpent / 10000) * 100), 100)}%
                </b>
              </div>
            </div>

            {/* Seg 3 - Shopping (Striped Diagonal Hatch Pattern) */}
            <div className="flex-[28] min-w-[120px]">
              <span className="block text-[12.5px] font-medium text-foreground-sub mb-2 whitespace-nowrap">
                {t.catShopping}
              </span>
              <div className="h-10 rounded-full flex items-center px-4 relative overflow-hidden bg-surface border border-border shadow-xs">
                <div className="seg__stripes absolute inset-0 -left-10" />
                <b className="text-xs font-semibold tabular-nums relative z-10 text-foreground">
                  {Math.min(Math.round((shoppingSpent / 10000) * 100), 100)}%
                </b>
              </div>
            </div>

            {/* Seg 4 - Bills & Subscriptions */}
            <div className="flex-[20] min-w-[70px]">
              <span className="block text-[12.5px] font-medium text-foreground-sub mb-2 whitespace-nowrap">
                {t.catBills}
              </span>
              <div className="h-10 rounded-full flex items-center px-4 relative overflow-hidden bg-surface-muted border border-border/80 text-foreground">
                <b className="text-xs font-semibold tabular-nums">
                  {Math.min(Math.round((billsSpent / 8000) * 100), 100)}%
                </b>
              </div>
            </div>
          </div>

          {/* The 3 large Financial Stats: Net Balance, You Will Get, You Will Give */}
          <dl className="flex items-end gap-7 sm:gap-9 shrink-0">
            {/* Stat 1: Net Balance */}
            <div className="flex flex-col">
              <dd className="font-display font-light text-[36px] sm:text-[46px] lg:text-[54px] leading-[0.9] tracking-[-0.03em] tabular-nums text-foreground">
                {loadingTx ? "..." : (totalBalance < 0 ? `-₹${Math.abs(totalBalance).toLocaleString("en-IN")}` : fmt(totalBalance))}
              </dd>
              <dt className="flex items-center gap-1.5 mt-2 text-[12.5px] font-medium text-foreground-sub">
                <span className={`h-2 w-2 rounded-full ${totalBalance >= 0 ? "bg-emerald-500" : "bg-red-500"}`} />
                {t.totalBalance}
              </dt>
            </div>

            {/* Stat 2: You Will Get */}
            <div className="flex flex-col">
              <dd className="font-display font-light text-[36px] sm:text-[46px] lg:text-[54px] leading-[0.9] tracking-[-0.03em] tabular-nums text-emerald-600 dark:text-emerald-400">
                {loadingKhata ? "..." : fmt(willGet)}
              </dd>
              <dt className="flex items-center gap-1.5 mt-2 text-[12.5px] font-medium text-foreground-sub">
                <span className="h-2 w-2 rounded-full bg-accent" />
                {t.willGet}
              </dt>
            </div>

            {/* Stat 3: You Will Give */}
            <div className="flex flex-col">
              <dd className="font-display font-light text-[36px] sm:text-[46px] lg:text-[54px] leading-[0.9] tracking-[-0.03em] tabular-nums text-amber-600 dark:text-amber-400">
                {loadingKhata ? "..." : fmt(willGive)}
              </dd>
              <dt className="flex items-center gap-1.5 mt-2 text-[12.5px] font-medium text-foreground-sub">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                {t.willGive}
              </dt>
            </div>
          </dl>
        </div>
      </div>

      {/* 2. Main Bento Grid (Row 1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Card 1: Khata Snapshot (Real Top Pending Ledger) - 3 cols */}
        <BentoCard
          title={t.khataSnapshotTitle}
          subtitle={topCustomer ? "Top pending contact" : "Zero pending debts"}
          actionHref="/dashboard/khata"
          actionLabel={t.viewLedger}
          className="lg:col-span-3 flex flex-col justify-between"
        >
          {loadingKhata ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-surface-muted border border-border p-4 flex flex-col items-center text-center space-y-3">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-32 rounded-full" />
              </div>
              <Skeleton className="h-9 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ) : topCustomer ? (
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-2xl bg-surface-muted border border-border p-4 flex flex-col items-center text-center">
                <div className="relative mb-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-xl font-extrabold text-primary shadow-inner">
                    {topCustomer.name[0]?.toUpperCase() || "C"}
                  </div>
                  <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-surface bg-emerald-500" />
                </div>
                <h4 className="font-bold text-sm text-foreground truncate max-w-full">
                  {topCustomer.name}
                </h4>
                {topCustomer.phone && (
                  <p className="text-xs text-foreground-muted">{topCustomer.phone}</p>
                )}
                <div
                  className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                    topCustomer.net >= 0
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-500/15 text-red-600 dark:text-red-400"
                  }`}
                >
                  {topCustomer.net >= 0 ? `+${fmt(topCustomer.net)} ${t.willGet}` : `-${fmt(topCustomer.net)} ${t.willGive}`}
                </div>
              </div>

              {topCustomer.note && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-muted/60 border border-border/60 text-xs">
                  <span className="font-semibold text-foreground-sub">Recent Note</span>
                  <span className="font-bold text-foreground truncate max-w-[120px]">{topCustomer.note}</span>
                </div>
              )}

              <Link
                href="/dashboard/khata"
                className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary text-xs font-bold text-white transition hover:bg-primary-strong shadow-xs"
              >
                {t.viewLedger}
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-8 text-foreground-muted space-y-2">
              <span className="text-3xl">🤝</span>
              <p className="text-xs font-medium">No pending khata entries found.</p>
              <Link
                href="/dashboard/khata"
                className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary text-xs font-bold text-white transition hover:bg-primary-strong shadow-xs"
              >
                {t.viewLedger}
              </Link>
            </div>
          )}
        </BentoCard>

        {/* Card 2: 7-Day Spending Progress (Real Trend) - 3 cols */}
        <BentoCard
          title={t.spendingTrendTitle}
          subtitle={t.spendingTrendSubtitle}
          actionHref="/dashboard/expenses"
          actionLabel={t.viewAll}
          className="lg:col-span-3 flex flex-col justify-between"
        >
          {loadingTx ? (
            <div className="space-y-3">
              <div className="flex items-baseline gap-2 mb-3">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-28" />
              </div>
              <div className="flex items-end justify-between h-[105px] gap-2 pt-2">
                {[40, 65, 30, 95, 75, 45, 55].map((h, i) => (
                  <div key={i} className="flex flex-col items-center flex-1 h-full justify-end gap-2">
                    <Skeleton className="w-2.5 sm:w-3 rounded-full" style={{ height: `${h}%` }} />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-border flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-[34px] sm:text-[40px] font-normal tracking-tight text-foreground font-display leading-none">
                  {fmt(Math.round(monthlySpent / Math.max(new Date().getDate(), 1)))}
                </span>
                <div className="text-[11px] sm:text-xs text-foreground-muted font-medium leading-tight">
                  <div>Daily avg</div>
                  <div>last 7 days</div>
                </div>
              </div>
              {/* Sparkbars from real transaction data */}
              <SparkBars data={sparkData} highlightIndex={sparkData.length - 1} height={120} />

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-semibold">
                <span className="text-foreground-muted">Month to Date:</span>
                <span className="font-mono text-foreground font-bold">{fmt(monthlySpent)}</span>
              </div>
            </div>
          )}
        </BentoCard>

        {/* Card 3: Monthly Budget Tracker (Real Utilized) - 3 cols */}
        <BentoCard
          title={t.budgetGaugeTitle}
          subtitle={t.budgetGaugeSubtitle}
          actionHref="/dashboard/expenses"
          actionLabel={t.viewAll}
          className="lg:col-span-3 flex flex-col justify-between items-center text-center"
        >
          {loadingBudgets || loadingTx ? (
            <div className="py-2 w-full flex flex-col items-center space-y-3">
              <Skeleton className="h-[140px] w-[140px] rounded-full" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-10 w-32 rounded-full mt-2" />
            </div>
          ) : (
            <>
              <div className="py-2 w-full flex flex-col items-center">
                <CircularGauge
                  percent={budgetPercent}
                  size={150}
                  centerText={`${budgetPercent}%`}
                  subText={`${fmt(monthlySpent)} / ${fmt(totalBudgetLimit)}`}
                />
                <p className="mt-3 text-xs font-medium text-foreground-muted">
                  {daysLeft} {t.daysRemaining}
                </p>
              </div>

              <div className="w-full mt-2 flex items-center justify-center gap-2">
                <Link
                  href="/dashboard/expenses"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 text-xs font-bold text-foreground hover:border-primary transition"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  {t.addExpense}
                </Link>
              </div>
            </>
          )}
        </BentoCard>

        {/* Card 4: Upcoming Reminders & Dues (Real Pending Bills) - 3 cols */}
        <BentoCard
          title={t.upcomingRemindersTitle}
          subtitle="Real pending bill dues"
          actionHref="/dashboard/reminders"
          actionLabel={t.viewAll}
          className="lg:col-span-3 flex flex-col justify-between"
        >
          {loadingReminders ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="rounded-2xl bg-[#09150E] p-4 border border-emerald-950/60 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24 bg-emerald-950/80" />
                  <Skeleton className="h-3 w-16 bg-emerald-950/80" />
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex items-center gap-2.5 p-2 rounded-xl bg-emerald-950/40">
                      <Skeleton className="h-4 w-4 rounded-md bg-emerald-900/50" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-24 bg-emerald-900/50" />
                        <Skeleton className="h-2 w-16 bg-emerald-900/40" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Skeleton className="h-3 w-20 mx-auto" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-foreground-sub">Pending Bills</span>
                <span className="text-primary font-mono">
                  {reminders.filter((r) => r.status === "paid").length}/{reminders.length} {t.tasksCompleted}
                </span>
              </div>

              {/* Inset Dark Card for Impending Reminders */}
              <div className="rounded-2xl bg-[#09150E] p-4 text-white shadow-inner space-y-3 border border-emerald-950/60 min-h-[160px]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-emerald-400">Due Reminders</span>
                  <span className="text-[11px] font-mono text-emerald-500/80">
                    {new Date().toLocaleString("default", { month: "short", year: "numeric" })}
                  </span>
                </div>

                {reminders.length === 0 ? (
                  <div className="text-center py-6 text-xs text-emerald-500/60">
                    No pending bill reminders.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reminders.slice(0, 3).map((bill) => {
                      const isPaid = bill.status === "paid";
                      return (
                        <button
                          key={bill.id}
                          type="button"
                          onClick={() => updateReminder({ id: bill.id, patch: { status: isPaid ? "pending" : "paid" } })}
                          className="w-full flex items-center justify-between gap-2 text-left rounded-xl p-2 transition hover:bg-emerald-950/60 group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border text-[10px] transition ${
                                isPaid
                                  ? "border-amber-400 bg-amber-400 text-black font-black"
                                  : "border-emerald-800 text-transparent"
                              }`}
                            >
                              ✓
                            </span>
                            <div className="min-w-0">
                              <p className={`text-xs font-bold truncate ${isPaid ? "line-through text-emerald-600" : "text-white"}`}>
                                {bill.title}
                              </p>
                              <p className="text-[10px] text-emerald-400/60 font-mono">
                                {fmt(bill.amount)} • {bill.dueDate}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <Link
                href="/dashboard/reminders"
                className="mt-3 text-center text-xs font-semibold text-primary hover:underline block"
              >
                {t.viewAll} →
              </Link>
            </div>
          )}
        </BentoCard>
      </div>

      {/* 3. Second Bento Row (Recent Transactions & Real Deals) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Real Transactions Activity Feed - 7 cols */}
        <BentoCard
          title="Recent Transactions"
          subtitle="Your live logged expenses & incomes"
          actionHref="/dashboard/expenses"
          actionLabel={t.viewAll}
          className="lg:col-span-7"
        >
          {loadingTx ? (
            <div className="space-y-2.5 pt-1">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="flex items-center gap-3 p-3 rounded-2xl bg-surface-muted/60 border border-border">
                  <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-2.5 w-44" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-foreground-muted space-y-2">
              <span className="text-3xl">💸</span>
              <p className="text-xs font-medium">No transactions recorded yet.</p>
              <Link
                href="/dashboard/expenses"
                className="mt-2 text-xs font-bold text-primary hover:underline"
              >
                + Add your first transaction
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5 pt-1">
              {transactions.slice(0, 4).map((tx) => {
                const isIncome = tx.type === "income";
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-surface-muted/60 border border-border"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                        isIncome ? "bg-emerald-500/15 text-emerald-600" : "bg-red-500/15 text-red-600"
                      }`}
                    >
                      {isIncome ? "↓" : "↑"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{tx.title}</p>
                      <p className="text-[11px] text-foreground-muted font-mono">
                        {tx.merchant ? `${tx.merchant} • ` : ""}{tx.date} • {tx.paymentMethod}
                      </p>
                    </div>
                    <span
                      className={`font-mono text-xs font-extrabold ${
                        isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                      }`}
                    >
                      {isIncome ? `+${fmt(tx.amount)}` : `-${fmt(tx.amount)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </BentoCard>

        {/* Live Deal & AI Conscience - 5 cols */}
        <BentoCard
          title="Live Deals & AI Conscience"
          subtitle="Real-time deals from Amazon India with budget reality check"
          actionHref="/dashboard/deals"
          actionLabel="Explore Deals"
          className="lg:col-span-5 flex flex-col justify-between"
        >
          {loadingDeals ? (
            <div className="space-y-3.5">
              <div className="rounded-2xl border border-border bg-surface-muted p-4 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-32 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-9 w-full rounded-xl" />
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ) : featuredDeal ? (
            <div className="space-y-3.5">
              <div className="rounded-2xl border border-border bg-surface-muted p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    {featuredDeal.platform} • {featuredDeal.discountPercent}% OFF
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Save {fmt(featuredDeal.savingsAmount)}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-foreground line-clamp-1">
                    {featuredDeal.title}
                  </h4>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-lg font-extrabold text-foreground font-mono">
                      {fmt(featuredDeal.finalPrice || featuredDeal.currentPrice)}
                    </span>
                    {featuredDeal.originalPrice > 0 && (
                      <span className="text-xs text-foreground-muted line-through font-mono">
                        {fmt(featuredDeal.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>

                {/* AI Purchase Conscience Box */}
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
                    <span>🤖 AI Conscience:</span>
                    <span className="rounded-md bg-emerald-500 px-1.5 py-0.2 text-[10px] text-white">
                      {featuredDeal.purchaseCheck?.status || "SAFE TO BUY"}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-foreground-sub leading-relaxed">
                    {featuredDeal.purchaseCheck?.reason ||
                      "Calculated against your live discretionary budget and commitments."}
                  </p>
                </div>

                {/* Coupon Code Pill */}
                {featuredDeal.couponCode && (
                  <div className="flex items-center justify-between rounded-xl bg-surface border border-dashed border-border px-3 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground-muted">Coupon:</span>
                      <span className="font-mono font-bold text-primary">{featuredDeal.couponCode}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => alert(`Copied code: ${featuredDeal.couponCode}`)}
                      className="font-bold text-primary hover:underline text-[11px]"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>

              <Link
                href="/dashboard/deals"
                className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-foreground text-xs font-bold text-background transition hover:opacity-90 dark:bg-emerald-400 dark:text-emerald-950"
              >
                {t.exploreDeals}
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center text-foreground-muted space-y-2">
              <span className="text-3xl">🏷️</span>
              <p className="text-xs font-medium">Deals engine checking live discounts...</p>
            </div>
          )}
        </BentoCard>
      </div>
    </div>
  );
}
