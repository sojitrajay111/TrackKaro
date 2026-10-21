"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { BentoCard } from "@/components/ui/bento-card";
import { SparkBars } from "@/components/ui/spark-bars";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CategoryDonut,
  CategoryLegend,
  DailyChart,
  Delta,
  buildCategorySplit,
  buildPeriod,
  fmt as fmtInsight,
  pctChange,
} from "@/components/insights/spending-charts";
import { useAppSelector } from "@/store";
import { useI18n } from "@/i18n";

import { useGetTransactionsQuery } from "@/store/api/transactionsApi";
import { useGetKhataEntriesQuery } from "@/store/api/khataApi";
import { useGetBudgetsQuery } from "@/store/api/budgetsApi";
import { useGetRemindersQuery, useUpdateReminderMutation } from "@/store/api/remindersApi";
import { useGetGroupsQuery } from "@/store/api/groupsApi";
import { useGetDealsQuery } from "@/store/api/dealsApi";
import { CustomerLedgerDrawer } from "@/components/khata/customer-ledger-drawer";

interface CustomerSummary {
  id: string;
  name: string;
  phone?: string;
  net: number;
  note?: string;
}

const getCategoryIcon = (category?: string) => {
  if (category === "Travel") return "✈️";
  if (category === "Home & Utilities") return "🏠";
  if (category === "Event & Party") return "🎉";
  if (category === "Office & Work") return "💼";
  return "👥";
};

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
    const interval = setInterval(() => {
      setGreetingKey(computeGreeting());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const greeting = t[greetingKey] || t.goodMorning;

  // Real backend queries via RTK Query with loading states
  const { data: transactions = [], isLoading: loadingTx } = useGetTransactionsQuery();
  const { data: khataEntries = [], isLoading: loadingKhata } = useGetKhataEntriesQuery();
  const { data: budgets = [] } = useGetBudgetsQuery();
  const { data: reminders = [], isLoading: loadingReminders } = useGetRemindersQuery();
  const { data: groups = [], isLoading: loadingGroups } = useGetGroupsQuery();
  const { data: deals = [], isLoading: loadingDeals } = useGetDealsQuery();

  const [ledgerTab, setLedgerTab] = useState<"all" | "khata" | "groups">("all");
  const [selectedKhataCustomer, setSelectedKhataCustomer] = useState<string | null>(null);

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

    const customers = Array.from(personMap.values()).sort(
      (a, b) => Math.abs(b.net) - Math.abs(a.net)
    );

    return {
      willGet: getSum,
      willGive: giveSum,
      pendingCustomers: customers,
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
  const { budgetPercent } = useMemo(() => {
    const sumLimits = budgets.reduce((acc, b) => acc + (b.limit || 0), 0) || 30000;
    const pct = sumLimits > 0 ? Math.min(Math.round((monthlySpent / sumLimits) * 100), 100) : 0;
    return { budgetPercent: pct };
  }, [budgets, monthlySpent]);

  // 5. Last-30-day spending insights (shared with the Spending page)
  const insights = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const period = buildPeriod(transactions, 30, today);
    return { period, categories: buildCategorySplit(period.inRange) };
  }, [transactions]);

  // 6. Featured Live Deal
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
        {/* Card 1: Khata & Groups (Real Personal Ledger & Split Groups) - 4 cols */}
        <BentoCard
          title="Khata & Groups"
          subtitle={
            ledgerTab === "khata"
              ? pendingCustomers.length > 0
                ? `${pendingCustomers.length} pending contact${pendingCustomers.length > 1 ? "s" : ""}`
                : "Zero pending debts"
              : ledgerTab === "groups"
              ? groups.length > 0
                ? `${groups.length} active split group${groups.length > 1 ? "s" : ""}`
                : "No split groups yet"
              : `${pendingCustomers.length} khata • ${groups.length} group${groups.length !== 1 ? "s" : ""}`
          }
          actionHref={ledgerTab === "groups" ? "/dashboard/groups" : "/dashboard/khata"}
          actionLabel={ledgerTab === "groups" ? "Manage Groups" : "Full Ledger"}
          className="lg:col-span-4 flex flex-col justify-between lg:h-[370px]"
        >
          {/* Liquid Glass View Segmented Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 mb-2.5 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setLedgerTab("all")}
              className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-semibold transition-all text-center ${
                ledgerTab === "all"
                  ? "bg-white dark:bg-white/15 text-foreground shadow-xs font-bold"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setLedgerTab("khata")}
              className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-semibold transition-all text-center flex items-center justify-center gap-1 ${
                ledgerTab === "khata"
                  ? "bg-white dark:bg-white/15 text-foreground shadow-xs font-bold"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              <span>Khata</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                {pendingCustomers.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setLedgerTab("groups")}
              className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-semibold transition-all text-center flex items-center justify-center gap-1 ${
                ledgerTab === "groups"
                  ? "bg-white dark:bg-white/15 text-foreground shadow-xs font-bold"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              <span>Groups</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-primary/15 text-primary">
                {groups.length}
              </span>
            </button>
          </div>

          {/* VIEW 1: Dual Overview (Compact Top Items) */}
          {ledgerTab === "all" && (
            <div className="space-y-2 flex-1 flex flex-col justify-between min-h-0">
              {/* Khata Compact Tile */}
              <div className="rounded-2xl bg-white/40 dark:bg-white/5 border border-white/25 dark:border-white/10 p-2.5 shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Personal Khata
                  </span>
                  <button
                    type="button"
                    onClick={() => setLedgerTab("khata")}
                    className="text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>{pendingCustomers.length} pending</span>
                    <span>→</span>
                  </button>
                </div>

                {loadingKhata ? (
                  <Skeleton className="h-8 w-full rounded-xl" />
                ) : pendingCustomers.length > 0 ? (
                  <div
                    onClick={() => setSelectedKhataCustomer(pendingCustomers[0].name)}
                    className="flex items-center justify-between gap-2 cursor-pointer hover:bg-white/40 dark:hover:bg-white/10 p-1 -m-1 rounded-xl transition group"
                    title={`Click to view ${pendingCustomers[0].name}'s Ledger`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-xs font-bold text-white shadow-xs group-hover:scale-105 transition-transform">
                        {pendingCustomers[0].name[0]?.toUpperCase() || "C"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-display font-bold text-xs text-foreground truncate leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                          {pendingCustomers[0].name}
                        </h4>
                        <p className="text-[10px] text-foreground-muted truncate">
                          {pendingCustomers[0].phone || (pendingCustomers[0].note ? `Note: ${pendingCustomers[0].note}` : "Top contact")}
                          {pendingCustomers.length > 1 && ` • +${pendingCustomers.length - 1} more`}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold border shadow-xs ${
                        pendingCustomers[0].net >= 0
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                          : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25"
                      }`}
                    >
                      {pendingCustomers[0].net >= 0 ? `+${fmt(pendingCustomers[0].net)} Get` : `-${fmt(Math.abs(pendingCustomers[0].net))} Give`}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-1 text-xs text-foreground-muted">
                    <span>🤝 Zero pending debts</span>
                    <Link href="/dashboard/khata" className="text-emerald-500 font-semibold text-[11px]">+ Record</Link>
                  </div>
                )}
              </div>

              {/* Split Groups Compact Tile */}
              <div className="rounded-2xl bg-white/40 dark:bg-white/5 border border-white/25 dark:border-white/10 p-2.5 shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Split Groups
                  </span>
                  <button
                    type="button"
                    onClick={() => setLedgerTab("groups")}
                    className="text-[10.5px] font-semibold text-primary hover:underline flex items-center gap-0.5"
                  >
                    <span>{groups.length} active</span>
                    <span>→</span>
                  </button>
                </div>

                {loadingGroups ? (
                  <Skeleton className="h-8 w-full rounded-xl" />
                ) : groups.length > 0 ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary text-sm font-bold">
                        {getCategoryIcon(groups[0]?.category)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-display font-bold text-xs text-foreground truncate leading-tight">
                          {groups[0]?.name}
                        </h4>
                        <p className="text-[10px] text-foreground-muted truncate">
                          {groups[0]?.members?.length || 0} members
                          {groups.length > 1 && ` • +${groups.length - 1} more`}
                        </p>
                      </div>
                    </div>

                    {groups[0]?.inviteCode ? (
                      <span className="shrink-0 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/60 dark:bg-white/10 text-foreground border border-white/20">
                        {groups[0]?.inviteCode}
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] text-foreground-sub font-medium">
                        Active
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-1 text-xs text-foreground-muted">
                    <span>👥 No split groups yet</span>
                    <Link href="/dashboard/groups" className="text-primary font-semibold text-[11px]">+ Create</Link>
                  </div>
                )}
              </div>

              {/* Quick links */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <Link
                  href="/dashboard/khata"
                  className="inline-flex h-8 items-center justify-center gap-1 rounded-xl bg-white/50 dark:bg-white/5 border border-white/25 dark:border-white/10 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                >
                  <span>Khata Ledger</span>
                  <span className="text-xs">→</span>
                </Link>
                <Link
                  href="/dashboard/groups"
                  className="inline-flex h-8 items-center justify-center gap-1 rounded-xl bg-white/50 dark:bg-white/5 border border-white/25 dark:border-white/10 text-[11px] font-bold text-primary hover:bg-primary/10 transition-all"
                >
                  <span>Split Groups</span>
                  <span className="text-xs">→</span>
                </Link>
              </div>
            </div>
          )}

          {/* VIEW 2: Detailed Khata View */}
          {ledgerTab === "khata" && (
            loadingKhata ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full rounded-2xl" />
                <Skeleton className="h-12 w-full rounded-2xl" />
                <Skeleton className="h-8 w-full rounded-xl" />
              </div>
            ) : pendingCustomers.length > 0 ? (
              <div className="space-y-2 flex-1 flex flex-col justify-between min-h-0">
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto no-scrollbar pr-0.5">
                  {pendingCustomers.map((cust) => (
                    <div
                      key={cust.id}
                      onClick={() => setSelectedKhataCustomer(cust.name)}
                      className="rounded-2xl bg-white/40 dark:bg-white/5 border border-white/25 dark:border-white/10 p-2.5 flex items-center justify-between gap-2 shadow-xs hover:border-emerald-500/40 hover:bg-white/60 dark:hover:bg-white/10 transition cursor-pointer group"
                      title={`Click to view ${cust.name}'s Ledger`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative shrink-0">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-xs font-bold text-white shadow-xs group-hover:scale-105 transition-transform">
                            {cust.name[0]?.toUpperCase() || "C"}
                          </div>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-background ${
                              cust.net >= 0 ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-display font-bold text-xs text-foreground truncate leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                            {cust.name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-foreground-muted truncate">
                            {cust.phone && <span className="font-mono">{cust.phone}</span>}
                            {cust.phone && cust.note && <span>•</span>}
                            {cust.note && <span className="truncate">Note: {cust.note}</span>}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold border shadow-xs ${
                          cust.net >= 0
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                            : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25"
                        }`}
                      >
                        {cust.net >= 0 ? `+${fmt(cust.net)} Get` : `-${fmt(Math.abs(cust.net))} Give`}
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  href="/dashboard/khata"
                  className="mt-1 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 hover:shadow-emerald-500/30 transition-all shrink-0"
                >
                  <span>Full Ledger ({khataEntries.length} entries)</span>
                  <span className="text-sm">→</span>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-6 text-foreground-muted space-y-2 flex-1">
                <span className="text-3xl">🤝</span>
                <p className="text-xs font-medium">No pending khata entries found.</p>
                <Link
                  href="/dashboard/khata"
                  className="mt-2 inline-flex h-8 w-full items-center justify-center rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition-all"
                >
                  Full Ledger →
                </Link>
              </div>
            )
          )}

          {/* VIEW 3: Detailed Split Groups View */}
          {ledgerTab === "groups" && (
            loadingGroups ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full rounded-2xl" />
                <Skeleton className="h-12 w-full rounded-2xl" />
                <Skeleton className="h-8 w-full rounded-xl" />
              </div>
            ) : groups.length > 0 ? (
              <div className="space-y-2 flex-1 flex flex-col justify-between min-h-0">
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto no-scrollbar pr-0.5">
                  {groups.map((grp) => (
                    <div
                      key={grp.id}
                      className="rounded-2xl bg-white/40 dark:bg-white/5 border border-white/25 dark:border-white/10 p-2.5 flex items-center justify-between gap-2 shadow-xs hover:border-primary/30 transition"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm shrink-0">
                          {getCategoryIcon(grp.category)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-display font-bold text-xs text-foreground truncate">
                            {grp.name}
                          </h4>
                          <p className="text-[10px] text-foreground-muted flex items-center gap-1.5 mt-0.5">
                            <span>{grp.category || "General"}</span>
                            <span>•</span>
                            <span>{grp.members?.length || 0} members</span>
                          </p>
                        </div>
                      </div>

                      {grp.inviteCode && (
                        <span className="px-1.5 py-0.5 rounded-md font-mono text-[10px] font-bold bg-white/60 dark:bg-white/10 text-foreground border border-white/20 shrink-0">
                          {grp.inviteCode}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <Link
                  href="/dashboard/groups"
                  className="mt-1 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-xs font-bold text-white shadow-md shadow-primary/20 hover:bg-primary-strong transition-all shrink-0"
                >
                  <span>Manage Groups ({groups.length})</span>
                  <span className="text-sm">→</span>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-6 text-foreground-muted space-y-2 flex-1">
                <span className="text-3xl">👥</span>
                <p className="text-xs font-bold text-foreground">No Split Groups Yet</p>
                <p className="text-[11px] text-foreground-muted max-w-[220px]">
                  Create a group to split trip expenses, apartment rent, or office dinners with friends.
                </p>
                <Link
                  href="/dashboard/groups"
                  className="mt-2 inline-flex h-8 w-full items-center justify-center rounded-xl bg-primary text-xs font-bold text-white shadow-md hover:bg-primary-strong transition-all"
                >
                  + Create or Join Group
                </Link>
              </div>
            )
          )}
        </BentoCard>

        {/* Card 2: 7-Day Spending Progress (Real Trend) - 4 cols */}
        <BentoCard
          title={t.spendingTrendTitle || "7-Day Spending"}
          subtitle={t.spendingTrendSubtitle || "Daily expense trend"}
          actionHref="/dashboard/expenses"
          actionLabel={t.viewAll}
          className="lg:col-span-4 flex flex-col justify-between lg:h-[370px]"
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
            <div className="flex-1 flex flex-col justify-between min-h-0">
              <div>
                <div className="flex items-baseline gap-2.5 mb-3">
                  <span className="text-[34px] sm:text-[38px] font-normal tracking-tight text-foreground font-display tabular-nums leading-none">
                    {fmt(Math.round(monthlySpent / Math.max(new Date().getDate(), 1)))}
                  </span>
                  <div className="text-[11px] text-foreground-muted font-medium leading-tight">
                    <div>Daily avg</div>
                    <span className="text-emerald-500 font-semibold">last 7 days</span>
                  </div>
                </div>

                {/* Sparkbars from real transaction data */}
                <SparkBars data={sparkData} highlightIndex={sparkData.length - 1} height={115} />
              </div>

              <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between text-xs font-semibold">
                <span className="text-foreground-muted">Month to Date:</span>
                <span className="font-mono text-foreground font-bold">{fmt(monthlySpent)}</span>
              </div>
            </div>
          )}
        </BentoCard>

        {/* Card 3: Upcoming Reminders & Dues (Real Pending Bills) - 4 cols */}
        <BentoCard
          title={t.upcomingRemindersTitle || "Impending Dues & Tasks"}
          subtitle="Real pending bill dues"
          actionHref="/dashboard/expenses"
          actionLabel={t.viewAll}
          className="lg:col-span-4 flex flex-col justify-between lg:h-[370px]"
        >
          {loadingReminders ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="rounded-2xl bg-white/40 dark:bg-white/5 p-4 border border-white/20 space-y-3">
                <Skeleton className="h-3 w-24" />
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 flex-1 flex flex-col justify-between min-h-0">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-foreground-muted">Pending Bills</span>
                <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-primary/15 text-primary border border-primary/20">
                  {reminders.filter((r) => r.status === "paid").length}/{reminders.length} completed
                </span>
              </div>

              {/* Inset Liquid Glass Card for Due Reminders */}
              <div className="rounded-2xl bg-white/40 dark:bg-white/5 p-3 shadow-xs space-y-2 border border-white/25 dark:border-white/10 flex-1 flex flex-col justify-between min-h-0">
                <div className="flex items-center justify-between text-xs pb-1 border-b border-border/30">
                  <span className="font-bold text-foreground">Due Reminders</span>
                  <span className="text-[11px] font-mono text-foreground-muted">
                    {new Date().toLocaleString("default", { month: "short", year: "numeric" })}
                  </span>
                </div>

                {reminders.length === 0 ? (
                  <div className="text-center py-4 text-xs text-foreground-muted">
                    No pending bill reminders.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[110px] overflow-y-auto no-scrollbar pr-0.5">
                    {reminders.slice(0, 4).map((bill) => {
                      const isPaid = bill.status === "paid";
                      return (
                        <button
                          key={bill.id}
                          type="button"
                          onClick={() => updateReminder({ id: bill.id, patch: { status: isPaid ? "pending" : "paid" } })}
                          className="w-full flex items-center justify-between gap-2 text-left rounded-xl p-1.5 transition hover:bg-white/40 dark:hover:bg-white/10 group border border-transparent hover:border-white/20"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border text-[10px] transition font-bold ${
                                isPaid
                                  ? "border-emerald-500 bg-emerald-500 text-white"
                                  : "border-border text-transparent group-hover:border-primary"
                              }`}
                            >
                              ✓
                            </span>
                            <div className="min-w-0">
                              <p className={`text-xs font-semibold truncate ${isPaid ? "line-through text-foreground-muted" : "text-foreground"}`}>
                                {bill.title}
                              </p>
                              <p className="text-[10px] text-foreground-muted font-mono">
                                {fmt(bill.amount)} • {bill.dueDate}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              isPaid
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {isPaid ? "Paid" : "Due"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <Link
                href="/dashboard/expenses"
                className="mt-1 text-center text-xs font-semibold text-primary hover:underline block"
              >
                View all →
              </Link>
            </div>
          )}
        </BentoCard>
      </div>

      {/* 3. Spending Insights Row (last 30 days, same charts as the Spending page) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        <BentoCard
          title="Daily spending"
          subtitle="Last 30 days against the 30 before"
          actionHref="/dashboard/spending"
          actionLabel="Open spending insights"
          className="lg:col-span-8"
        >
          {loadingTx ? (
            <Skeleton className="h-[260px] w-full rounded-2xl" />
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="flex flex-wrap items-baseline gap-2">
                  <b className="font-display font-medium text-2xl text-foreground tabular-nums">
                    {fmtInsight(insights.period.spent)}
                  </b>
                  <span className="text-xs text-foreground-muted">spent</span>
                  <Delta
                    value={pctChange(insights.period.spent, insights.period.prevSpent)}
                    goodWhenUp={false}
                    suffix=" vs previous 30 days"
                  />
                </p>
                <ul className="flex items-center gap-4 text-[11px] text-foreground-muted" aria-label="Legend">
                  <li className="flex items-center gap-1.5">
                    <i className="h-0.5 w-4 rounded-full bg-primary" />
                    Last 30 days
                  </li>
                  <li className="flex items-center gap-1.5">
                    <i className="w-4 border-t-2 border-dashed border-foreground-muted/60" />
                    Previous 30 days
                  </li>
                </ul>
              </div>
              <DailyChart days={insights.period.days} />
            </>
          )}
        </BentoCard>

        <BentoCard
          title="By category"
          subtitle="Where the money went, last 30 days"
          actionHref="/dashboard/spending"
          actionLabel="Open spending insights"
          className="lg:col-span-4"
        >
          {loadingTx ? (
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-[140px] w-[140px] rounded-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : insights.categories.length === 0 ? (
            <p className="rounded-[18px] bg-surface-muted/40 px-4 py-8 text-center text-xs text-foreground-muted">
              No expenses in the last 30 days.
            </p>
          ) : (
            <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-5">
              <CategoryDonut slices={insights.categories} size={140} />
              <CategoryLegend slices={insights.categories} />
            </div>
          )}
        </BentoCard>
      </div>

      {/* 4. Second Bento Row (Recent Transactions & Real Deals) */}
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

      {/* Liquid Glass Customer Ledger Drawer (Pane style) */}
      <CustomerLedgerDrawer
        isOpen={Boolean(selectedKhataCustomer)}
        onClose={() => setSelectedKhataCustomer(null)}
        customerName={selectedKhataCustomer}
        entries={khataEntries}
        onAddNewEntry={(_type, _name) => {
          window.location.href = "/dashboard/khata";
        }}
      />
    </div>
  );
}
