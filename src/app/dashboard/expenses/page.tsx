"use client";

import { useState, useMemo, type FormEvent } from "react";
import { BentoCard } from "@/components/ui/bento-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal, ModalField, ModalFooter } from "@/components/ui/modal";
import { useI18n } from "@/i18n";
import {
  useGetTransactionsQuery,
  useAddTransactionMutation,
  useDeleteTransactionMutation,
} from "@/store/api/transactionsApi";
import {
  useGetBudgetsQuery,
  useSetBudgetMutation,
} from "@/store/api/budgetsApi";
import type { CategoryName, PaymentMethod, Transaction, TransactionScope } from "@/store/types";

type SpendingTab = "activity" | "budgets" | "analytics";

const CATEGORIES: CategoryName[] = [
  "Food",
  "Shopping",
  "Groceries",
  "Bills",
  "Travel",
  "Fuel",
  "Entertainment",
  "Health",
  "Subscriptions",
  "Rent",
  "EMI",
  "Education",
  "Other",
];

const PAYMENT_METHODS: PaymentMethod[] = ["UPI", "Credit Card", "Debit Card", "Cash", "Net Banking"];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; bar: string; icon: string }> = {
  Food: { bg: "bg-amber-500/15", text: "text-amber-700 dark:text-amber-300", bar: "bg-amber-500", icon: "🍔" },
  Shopping: { bg: "bg-pink-500/15", text: "text-pink-700 dark:text-pink-300", bar: "bg-pink-500", icon: "🛍️" },
  Groceries: { bg: "bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-300", bar: "bg-emerald-600", icon: "🥦" },
  Bills: { bg: "bg-purple-500/15", text: "text-purple-700 dark:text-purple-300", bar: "bg-purple-600", icon: "📄" },
  Travel: { bg: "bg-blue-500/15", text: "text-blue-700 dark:text-blue-300", bar: "bg-blue-600", icon: "✈️" },
  Fuel: { bg: "bg-rose-500/15", text: "text-rose-700 dark:text-rose-300", bar: "bg-rose-600", icon: "⛽" },
  Entertainment: { bg: "bg-indigo-500/15", text: "text-indigo-700 dark:text-indigo-300", bar: "bg-indigo-600", icon: "🎬" },
  Health: { bg: "bg-teal-500/15", text: "text-teal-700 dark:text-teal-300", bar: "bg-teal-600", icon: "🏥" },
  Subscriptions: { bg: "bg-purple-500/15", text: "text-purple-700 dark:text-purple-300", bar: "bg-purple-600", icon: "🔄" },
  Rent: { bg: "bg-rose-500/15", text: "text-rose-700 dark:text-rose-300", bar: "bg-rose-600", icon: "🏠" },
  EMI: { bg: "bg-amber-500/15", text: "text-amber-700 dark:text-amber-300", bar: "bg-amber-600", icon: "💳" },
  Education: { bg: "bg-cyan-500/15", text: "text-cyan-700 dark:text-cyan-300", bar: "bg-cyan-600", icon: "🎓" },
  Other: { bg: "bg-slate-500/15", text: "text-slate-700 dark:text-slate-300", bar: "bg-slate-600", icon: "📦" },
};

export default function ExpensesPage() {
  const { t } = useI18n();

  // Queries & Mutations
  const { data: transactions = [], isLoading: loadingTx } = useGetTransactionsQuery();
  const { data: budgets = [], isLoading: loadingBudgets } = useGetBudgetsQuery();
  const [addTransaction, { isLoading: isAddingTx }] = useAddTransactionMutation();
  const [deleteTransaction, { isLoading: isDeletingTx }] = useDeleteTransactionMutation();
  const [setBudget, { isLoading: isUpdatingBudget }] = useSetBudgetMutation();

  // Tab State
  const [activeTab, setActiveTab] = useState<SpendingTab>("activity");

  // Selected Month State
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [isAllTime, setIsAllTime] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<"all" | "expense" | "income">("all");

  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditBudgetModal, setShowEditBudgetModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryName>("Food");
  const [newBudgetLimit, setNewBudgetLimit] = useState<string>("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [viewingTx, setViewingTx] = useState<Transaction | null>(null);

  // New Transaction Form State
  const [txTitle, setTxTitle] = useState("");
  const [txMerchant, setTxMerchant] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txType, setTxType] = useState<"expense" | "income">("expense");
  const [txCategory, setTxCategory] = useState<CategoryName>("Food");
  const [txPaymentMethod, setTxPaymentMethod] = useState<PaymentMethod>("UPI");
  const [txScope, setTxScope] = useState<TransactionScope>("Personal");
  const [txDate, setTxDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [txNotes, setTxNotes] = useState("");

  // Month Formatters
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonthLabel = `${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  const currentYearMonth = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}`;

  const handlePrevMonth = () => {
    setIsAllTime(false);
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setIsAllTime(false);
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Month match
      if (!isAllTime) {
        if (!tx.date?.startsWith(currentYearMonth)) return false;
      }
      // Type match
      if (selectedType !== "all" && tx.type !== selectedType) return false;
      // Category match
      if (selectedCategory !== "All" && tx.category !== selectedCategory) return false;
      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = tx.title?.toLowerCase().includes(q);
        const matchesMerchant = tx.merchant?.toLowerCase().includes(q);
        const matchesCategory = tx.category?.toLowerCase().includes(q);
        const matchesNotes = tx.notes?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMerchant && !matchesCategory && !matchesNotes) return false;
      }
      return true;
    });
  }, [transactions, isAllTime, currentYearMonth, selectedType, selectedCategory, searchQuery]);

  // Overall Monthly Metrics
  const { monthExpenses, monthIncome, monthBudget, totalBudgetLimit, budgetPercent, dailyAvg } = useMemo(() => {
    const monthTx = transactions.filter((t) => t.date?.startsWith(currentYearMonth));
    const exp = monthTx.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    const inc = monthTx.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const totalBudget = budgets.reduce((sum, b) => sum + (b.limit || 0), 0) || 30000;
    const pct = totalBudget > 0 ? Math.min(Math.round((exp / totalBudget) * 100), 100) : 0;

    const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
    const passedDays = selectedDate.getMonth() === new Date().getMonth() ? new Date().getDate() : daysInMonth;
    const avg = passedDays > 0 ? Math.round(exp / passedDays) : 0;

    return {
      monthExpenses: exp,
      monthIncome: inc,
      monthBudget: totalBudget,
      totalBudgetLimit: totalBudget,
      budgetPercent: pct,
      dailyAvg: avg,
    };
  }, [transactions, budgets, currentYearMonth, selectedDate]);

  // Category-wise Breakdown
  const categoryBreakdown = useMemo(() => {
    const monthTx = transactions.filter((t) => t.date?.startsWith(currentYearMonth) && t.type === "expense");
    const map = new Map<CategoryName, number>();

    CATEGORIES.forEach((cat) => map.set(cat, 0));
    monthTx.forEach((tx) => {
      const current = map.get(tx.category) || 0;
      map.set(tx.category, current + tx.amount);
    });

    return Array.from(map.entries())
      .map(([category, spent]) => {
        const budgetObj = budgets.find((b) => b.category === category);
        const limit = budgetObj?.limit || 0;
        const percent = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;
        const isOver = limit > 0 && spent > limit;
        return { category, spent, limit, percent, isOver };
      })
      .sort((a, b) => b.spent - a.spent);
  }, [transactions, budgets, currentYearMonth]);

  // Format currency
  const fmt = (val: number) => `₹${Math.abs(val).toLocaleString("en-IN")}`;

  // Form Submit Handler
  const handleAddSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!txTitle.trim() || !txAmount) return;

    try {
      await addTransaction({
        title: txTitle.trim(),
        merchant: txMerchant.trim() || txTitle.trim(),
        amount: parseFloat(txAmount),
        type: txType,
        category: txCategory,
        paymentMethod: txPaymentMethod,
        scope: txScope,
        date: txDate,
        notes: txNotes.trim() || undefined,
      }).unwrap();

      // Reset Form & Close Modal
      setTxTitle("");
      setTxMerchant("");
      setTxAmount("");
      setTxNotes("");
      setShowAddModal(false);
    } catch {
      // Error handled by RTK
    }
  };

  // Edit Budget Submit
  const handleBudgetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(newBudgetLimit);
    if (isNaN(limit) || limit < 0) return;

    try {
      await setBudget({
        category: editingCategory,
        limit,
      }).unwrap();
      setShowEditBudgetModal(false);
    } catch {
      // Error handled
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteTransaction(deleteTargetId).unwrap();
      setDeleteTargetId(null);
    } catch {
      // Error handled
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header Row (Matching Coterie Styling & Outfit Font) */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="font-display font-normal text-[26px] sm:text-[32px] lg:text-[38px] tracking-[-0.02em] text-foreground leading-tight mb-1.5">
            Spending & Budgets
          </h1>
          <p className="text-xs sm:text-sm font-medium text-foreground-muted">
            Live ledger of expenses, custom category limits, and cash flow analytics.
          </p>
        </div>

        {/* Action Button & Segmented Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented Mode Switcher */}
          <div className="flex items-center rounded-full border border-border bg-surface p-1 shadow-xs backdrop-blur-md">
            <button
              type="button"
              onClick={() => setActiveTab("activity")}
              className={`rounded-full px-4 sm:px-5 py-2 text-xs sm:text-[13px] font-medium transition-all ${
                activeTab === "activity"
                  ? "bg-[#18261E] text-white shadow-xs dark:bg-emerald-400 dark:text-emerald-950"
                  : "text-foreground-sub hover:text-foreground"
              }`}
            >
              Transactions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("budgets")}
              className={`rounded-full px-4 sm:px-5 py-2 text-xs sm:text-[13px] font-medium transition-all ${
                activeTab === "budgets"
                  ? "bg-[#18261E] text-white shadow-xs dark:bg-emerald-400 dark:text-emerald-950"
                  : "text-foreground-sub hover:text-foreground"
              }`}
            >
              Budgets
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("analytics")}
              className={`rounded-full px-4 sm:px-5 py-2 text-xs sm:text-[13px] font-medium transition-all ${
                activeTab === "analytics"
                  ? "bg-[#18261E] text-white shadow-xs dark:bg-emerald-400 dark:text-emerald-950"
                  : "text-foreground-sub hover:text-foreground"
              }`}
            >
              Analytics
            </button>
          </div>

          {/* Add Expense Pill Button */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-full bg-primary hover:bg-primary-strong text-white px-5 py-2.5 text-xs sm:text-[13px] font-bold shadow-xs transition hover:scale-[1.02]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Row & Month Selector */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-5 rounded-[28px] bg-surface/90 border border-border/80 card-shadow backdrop-blur-md">
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            disabled={isAllTime}
            className="h-9 w-9 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-surface-muted transition disabled:opacity-40"
            title="Previous month"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <span className="font-display font-medium text-sm sm:text-base px-2 text-foreground">
            {isAllTime ? "All Time" : currentMonthLabel}
          </span>

          <button
            type="button"
            onClick={handleNextMonth}
            disabled={isAllTime}
            className="h-9 w-9 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-surface-muted transition disabled:opacity-40"
            title="Next month"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setIsAllTime(!isAllTime)}
            className={`ml-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              isAllTime
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-foreground-sub hover:text-foreground hover:bg-surface-muted"
            }`}
          >
            {isAllTime ? "Viewing All Time" : "All Time"}
          </button>
        </div>

        {/* 4 Summary Stats */}
        <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-2 md:pt-0 border-t md:border-t-0 border-border">
          <div>
            <div className="text-[11px] font-medium text-foreground-muted uppercase tracking-wider">Spent</div>
            <div className="font-display font-light text-xl sm:text-2xl text-[#EF4444] dark:text-red-400">
              {loadingTx ? <Skeleton className="h-6 w-16" /> : fmt(monthExpenses)}
            </div>
          </div>

          <div className="h-8 w-[1px] bg-border hidden sm:block" />

          <div>
            <div className="text-[11px] font-medium text-foreground-muted uppercase tracking-wider">Income</div>
            <div className="font-display font-light text-xl sm:text-2xl text-[#059669] dark:text-emerald-400">
              {loadingTx ? <Skeleton className="h-6 w-16" /> : fmt(monthIncome)}
            </div>
          </div>

          <div className="h-8 w-[1px] bg-border hidden sm:block" />

          <div>
            <div className="text-[11px] font-medium text-foreground-muted uppercase tracking-wider">Daily Avg</div>
            <div className="font-display font-light text-xl sm:text-2xl text-foreground">
              {loadingTx ? <Skeleton className="h-6 w-16" /> : fmt(dailyAvg)}
            </div>
          </div>

          <div className="h-8 w-[1px] bg-border hidden sm:block" />

          <div>
            <div className="text-[11px] font-medium text-foreground-muted uppercase tracking-wider">Budget Left</div>
            <div className="font-display font-light text-xl sm:text-2xl text-foreground">
              {loadingBudgets ? <Skeleton className="h-6 w-16" /> : fmt(Math.max(0, totalBudgetLimit - monthExpenses))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. TAB 1: ALL TRANSACTIONS */}
      {activeTab === "activity" && (
        <div className="space-y-6">
          {/* Search & Category Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by title, merchant, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-border bg-surface px-4 py-2.5 pl-10 text-xs sm:text-[13px] text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <svg
                className="absolute left-3.5 top-3 text-foreground-muted"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-2.5 text-xs text-foreground-muted hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Type Filter Pills */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              {(["all", "expense", "income"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition ${
                    selectedType === type
                      ? "bg-[#18261E] text-white shadow-xs dark:bg-emerald-400 dark:text-emerald-950"
                      : "border border-border text-foreground-sub hover:bg-surface-muted"
                  }`}
                >
                  {type === "all" ? "All Types" : type}
                </button>
              ))}
            </div>
          </div>

          {/* Category Horizontal Filter Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory("All")}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                selectedCategory === "All"
                  ? "bg-primary text-white"
                  : "border border-border bg-surface text-foreground-sub hover:bg-surface-muted"
              }`}
            >
              All Categories
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  selectedCategory === cat
                    ? "bg-primary text-white"
                    : "border border-border bg-surface text-foreground-sub hover:bg-surface-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Transactions List */}
          <div className="rounded-[28px] bg-surface/90 border border-border/80 card-shadow backdrop-blur-md overflow-hidden">
            {loadingTx ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 py-2">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-20" />
                  </div>
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <h3 className="font-display font-medium text-lg text-foreground">No transactions found</h3>
                <p className="text-xs sm:text-sm text-foreground-muted max-w-sm mx-auto">
                  {searchQuery || selectedCategory !== "All"
                    ? "Try adjusting your search query or category filters."
                    : "No transactions recorded for this period yet. Click Add Expense to record one."}
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary text-white px-5 py-2 text-xs font-bold shadow-xs hover:bg-primary-strong transition"
                >
                  + Add First Transaction
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredTransactions.map((tx) => {
                  const style = CATEGORY_COLORS[tx.category] || CATEGORY_COLORS.Other;
                  const isExpense = tx.type === "expense";

                  return (
                    <div
                      key={tx.id}
                      onClick={() => setViewingTx(tx)}
                      className="flex items-center justify-between p-4 sm:p-5 hover:bg-surface-muted/60 transition group cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Category Icon Capsule */}
                        <div
                          className={`h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center text-lg ${style.bg} ${style.text}`}
                        >
                          {style.icon || (tx.category ? tx.category[0] : "O")}
                        </div>

                        {/* Title, Merchant, Notes, Scope */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-display font-medium text-sm sm:text-base text-foreground truncate group-hover:text-primary transition">
                              {tx.title}
                            </span>
                            {tx.scope && (
                              <span className="rounded-full bg-border/60 px-2 py-0.5 text-[10px] font-semibold text-foreground-sub">
                                {tx.scope}
                              </span>
                            )}
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.bg} ${style.text}`}>
                              <span>{style.icon}</span>
                              <span>{tx.category}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-foreground-muted mt-0.5 flex-wrap">
                            <span>{tx.date}</span>
                            <span>•</span>
                            <span>{tx.paymentMethod}</span>
                            {tx.notes && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[200px] text-foreground-sub italic">
                                  {tx.notes}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Amount & Delete Action */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`font-display text-base sm:text-lg tabular-nums ${
                            isExpense
                              ? "text-[#EF4444] dark:text-red-400 font-semibold"
                              : "text-[#059669] dark:text-emerald-400 font-bold"
                          }`}
                        >
                          {isExpense ? `-${fmt(tx.amount)}` : `+${fmt(tx.amount)}`}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTargetId(tx.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition p-1.5 rounded-full hover:bg-red-500/10 text-foreground-muted hover:text-red-500"
                          title="Delete transaction"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. TAB 2: CATEGORY BUDGETS */}
      {activeTab === "budgets" && (
        <div className="space-y-6">
          {/* Master Budget Alert Banner */}
          <div className="p-6 rounded-[28px] bg-surface/90 border border-border/80 card-shadow backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Monthly Limit Safety</span>
              <h3 className="font-display font-light text-2xl sm:text-3xl text-foreground">
                {budgetPercent}% of monthly budget spent
              </h3>
              <p className="text-xs sm:text-sm text-foreground-muted">
                {fmt(monthExpenses)} utilized out of {fmt(totalBudgetLimit)} safe ceiling.
              </p>
            </div>

            {/* Quick Limit Bar */}
            <div className="w-full md:w-80 space-y-2">
              <div className="h-3 w-full rounded-full bg-border overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    budgetPercent >= 100
                      ? "bg-red-500"
                      : budgetPercent >= 80
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-semibold text-foreground-sub">
                <span>0%</span>
                <span>{fmt(Math.max(0, totalBudgetLimit - monthExpenses))} remaining</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Grid of Category Budgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categoryBreakdown.map((item) => {
              const style = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other;

              return (
                <div
                  key={item.category}
                  className="p-5 rounded-[28px] bg-surface/90 border border-border/80 card-shadow backdrop-blur-md space-y-4 hover:border-primary/40 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`h-9 w-9 rounded-xl flex items-center justify-center font-display font-bold text-xs ${style.bg} ${style.text}`}
                      >
                        {item.category[0]}
                      </div>
                      <div>
                        <h4 className="font-display font-medium text-base text-foreground">{item.category}</h4>
                        <span className="text-xs text-foreground-muted">
                          {item.limit > 0 ? `Cap: ${fmt(item.limit)}` : "No limit set"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(item.category);
                        setNewBudgetLimit(item.limit > 0 ? String(item.limit) : "");
                        setShowEditBudgetModal(true);
                      }}
                      className="px-3 py-1 rounded-full border border-border text-xs font-semibold text-foreground-sub hover:text-foreground hover:bg-surface-muted transition"
                    >
                      Edit Limit
                    </button>
                  </div>

                  {/* Progress and Numbers */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-foreground">Spent: {fmt(item.spent)}</span>
                      <span
                        className={
                          item.isOver
                            ? "text-red-500 font-bold"
                            : item.percent >= 80
                            ? "text-amber-500 font-bold"
                            : "text-foreground-muted"
                        }
                      >
                        {item.limit > 0 ? `${item.percent}%` : "Tracked"}
                      </span>
                    </div>

                    <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          item.isOver ? "bg-red-500" : style.bar
                        }`}
                        style={{ width: `${item.limit > 0 ? Math.min(item.percent, 100) : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. TAB 3: ANALYTICS & BREAKDOWN */}
      {activeTab === "analytics" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Category Distribution Leaderboard - 7 cols */}
          <div className="lg:col-span-7 p-6 rounded-[28px] bg-surface/90 border border-border/80 card-shadow backdrop-blur-md space-y-5">
            <h3 className="font-display font-medium text-xl text-foreground">Top Expense Categories</h3>
            <div className="space-y-4">
              {categoryBreakdown
                .filter((c) => c.spent > 0)
                .map((cat, idx) => {
                  const pctOfTotal = monthExpenses > 0 ? Math.round((cat.spent / monthExpenses) * 100) : 0;
                  const style = CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.Other;

                  return (
                    <div key={cat.category} className="space-y-1.5">
                      <div className="flex justify-between text-xs sm:text-sm font-semibold">
                        <span className="flex items-center gap-2 text-foreground">
                          <span className="text-foreground-muted text-xs">#{idx + 1}</span>
                          {cat.category}
                        </span>
                        <span className="text-foreground tabular-nums">
                          {fmt(cat.spent)} <span className="text-foreground-muted font-normal">({pctOfTotal}%)</span>
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-border overflow-hidden">
                        <div
                          className={`h-full rounded-full ${style.bar}`}
                          style={{ width: `${Math.min(pctOfTotal, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              {categoryBreakdown.filter((c) => c.spent > 0).length === 0 && (
                <div className="py-8 text-center text-foreground-muted text-sm">
                  No expense records found for this period.
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Distribution - 5 cols */}
          <div className="lg:col-span-5 p-6 rounded-[28px] bg-surface/90 border border-border/80 card-shadow backdrop-blur-md space-y-5">
            <h3 className="font-display font-medium text-xl text-foreground">Payment Methods</h3>
            <div className="space-y-4">
              {PAYMENT_METHODS.map((pm) => {
                const total = transactions
                  .filter((t) => t.date?.startsWith(currentYearMonth) && t.paymentMethod === pm)
                  .reduce((sum, t) => sum + t.amount, 0);
                const pct = monthExpenses > 0 ? Math.round((total / monthExpenses) * 100) : 0;

                return (
                  <div key={pm} className="p-3.5 rounded-2xl bg-surface-muted/60 border border-border space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm font-semibold">
                      <span className="text-foreground">{pm}</span>
                      <span className="text-foreground tabular-nums">{fmt(total)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD TRANSACTION */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Transaction"
        description="Record a new expense or income to your live cloud ledger."
        maxWidth="lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-3">
          {/* Type Switcher: Expense vs Income (with App Green & Red semantics) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTxType("expense")}
              className={`h-9 rounded-[10px] text-xs sm:text-[13px] font-medium transition-all flex items-center justify-center gap-1.5 select-none ${
                txType === "expense"
                  ? "bg-[#EF4444] text-white font-bold shadow-sm shadow-red-500/25"
                  : "bg-[#EAF3EE] dark:bg-[#14291F] text-[#3E5A4A] dark:text-[#A9C4B6] shadow-[inset_0_0_0_1px_rgba(18,60,38,0.1)] hover:text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-950/20"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m18 15-6-6-6 6" />
              </svg>
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => setTxType("income")}
              className={`h-9 rounded-[10px] text-xs sm:text-[13px] font-medium transition-all flex items-center justify-center gap-1.5 select-none ${
                txType === "income"
                  ? "bg-[#059669] text-white font-bold shadow-sm shadow-emerald-500/25"
                  : "bg-[#EAF3EE] dark:bg-[#14291F] text-[#3E5A4A] dark:text-[#A9C4B6] shadow-[inset_0_0_0_1px_rgba(18,60,38,0.1)] hover:text-[#059669] hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m6 9 6 6 6-6" />
              </svg>
              <span>Income</span>
            </button>
          </div>

          {/* Quick Category Chips */}
          <div className="space-y-1">
            <span className="block text-[11px] font-medium text-foreground-muted">Top Categories</span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {(["Food", "Shopping", "Groceries", "Bills", "Fuel", "Travel"] as CategoryName[]).map((cat) => {
                const active = txCategory === cat;
                const catInfo = CATEGORY_COLORS[cat] || CATEGORY_COLORS.Other;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setTxCategory(cat)}
                    className={`h-7 px-2.5 rounded-full text-[11px] font-semibold transition shrink-0 flex items-center gap-1 ${
                      active
                        ? `${catInfo.bg} ${catInfo.text} ring-1.5 ring-current font-bold`
                        : "bg-[#EAF3EE] dark:bg-[#14291F] text-[#4B6858] hover:text-[#102117]"
                    }`}
                  >
                    <span>{catInfo.icon}</span>
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title / Description */}
          <ModalField label="Title / Description" description="Used in recent activity and category insights.">
            <input
              type="text"
              required
              placeholder="e.g. Swiggy, DMart, Rent"
              value={txTitle}
              onChange={(e) => setTxTitle(e.target.value)}
              className="h-9 w-full rounded-[10px] bg-[#EAF3EE] dark:bg-[#14291F] text-[#14231A] dark:text-[#F1FBF6] placeholder:text-[#6B8B79]/60 px-3 text-xs sm:text-[13px] font-medium border-0 shadow-[inset_0_0_0_1px_rgba(18,60,38,0.12)] focus:outline-none focus:shadow-[inset_0_0_0_2px_#059669] transition"
            />
          </ModalField>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ModalField label="Amount (₹)">
              <input
                type="number"
                step="any"
                required
                placeholder="e.g. 450"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                className="h-9 w-full rounded-[10px] bg-[#EAF3EE] dark:bg-[#14291F] text-[#14231A] dark:text-[#F1FBF6] placeholder:text-[#6B8B79]/60 px-3 text-xs sm:text-[13px] font-medium border-0 shadow-[inset_0_0_0_1px_rgba(18,60,38,0.12)] focus:outline-none focus:shadow-[inset_0_0_0_2px_#059669] transition"
              />
            </ModalField>
            <ModalField label="Date">
              <input
                type="date"
                required
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="h-9 w-full rounded-[10px] bg-[#EAF3EE] dark:bg-[#14291F] text-[#14231A] dark:text-[#F1FBF6] px-3 text-xs sm:text-[13px] font-medium border-0 shadow-[inset_0_0_0_1px_rgba(18,60,38,0.12)] focus:outline-none focus:shadow-[inset_0_0_0_2px_#059669] transition"
              />
            </ModalField>
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ModalField label="Category">
              <select
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value as CategoryName)}
                className="h-9 w-full rounded-[10px] bg-[#EAF3EE] dark:bg-[#14291F] text-[#14231A] dark:text-[#F1FBF6] px-3 text-xs sm:text-[13px] font-medium border-0 shadow-[inset_0_0_0_1px_rgba(18,60,38,0.12)] focus:outline-none focus:shadow-[inset_0_0_0_2px_#059669] transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_COLORS[cat]?.icon} {cat}
                  </option>
                ))}
              </select>
            </ModalField>
            <ModalField label="Payment Method">
              <select
                value={txPaymentMethod}
                onChange={(e) => setTxPaymentMethod(e.target.value as PaymentMethod)}
                className="h-9 w-full rounded-[10px] bg-[#EAF3EE] dark:bg-[#14291F] text-[#14231A] dark:text-[#F1FBF6] px-3 text-xs sm:text-[13px] font-medium border-0 shadow-[inset_0_0_0_1px_rgba(18,60,38,0.12)] focus:outline-none focus:shadow-[inset_0_0_0_2px_#059669] transition"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </ModalField>
          </div>

          {/* Notes */}
          <ModalField label="Notes (Optional)">
            <input
              type="text"
              placeholder="e.g. Dinner with team"
              value={txNotes}
              onChange={(e) => setTxNotes(e.target.value)}
              className="h-9 w-full rounded-[10px] bg-[#EAF3EE] dark:bg-[#14291F] text-[#14231A] dark:text-[#F1FBF6] placeholder:text-[#6B8B79]/60 px-3 text-xs sm:text-[13px] font-medium border-0 shadow-[inset_0_0_0_1px_rgba(18,60,38,0.12)] focus:outline-none focus:shadow-[inset_0_0_0_2px_#059669] transition"
            />
          </ModalField>

          {/* Submit Footer */}
          <ModalFooter
            onCancel={() => setShowAddModal(false)}
            confirmLabel={txType === "expense" ? "Save Expense" : "Save Income"}
            isSubmitting={isAddingTx}
          />
        </form>
      </Modal>

      {/* MODAL 2: EDIT BUDGET LIMIT */}
      <Modal
        isOpen={showEditBudgetModal}
        onClose={() => setShowEditBudgetModal(false)}
        title={`Set Budget: ${editingCategory}`}
        description="Configure your monthly target ceiling to receive proactive alerts."
        maxWidth="md"
      >
        <form onSubmit={handleBudgetSubmit} className="space-y-3">
          <ModalField
            label="Monthly Ceiling Limit (₹)"
            description={`You will receive alert badges when expenses in ${editingCategory} cross 75% and 100% of this limit.`}
          >
            <input
              type="number"
              step="any"
              required
              placeholder="e.g. 8000"
              value={newBudgetLimit}
              onChange={(e) => setNewBudgetLimit(e.target.value)}
              className="h-9 w-full rounded-[10px] bg-[#EAF3EE] dark:bg-[#14291F] text-[#14231A] dark:text-[#F1FBF6] placeholder:text-[#6B8B79]/60 px-3 text-xs sm:text-[13px] font-medium border-0 shadow-[inset_0_0_0_1px_rgba(18,60,38,0.12)] focus:outline-none focus:shadow-[inset_0_0_0_2px_#059669] transition"
            />
          </ModalField>

          <ModalFooter
            onCancel={() => setShowEditBudgetModal(false)}
            confirmLabel="Save Budget"
            isSubmitting={isUpdatingBudget}
          />
        </form>
      </Modal>

      {/* MODAL 3: DELETE CONFIRMATION */}
      <Modal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        title="Delete Transaction?"
        description="Are you sure you want to remove this record? This action cannot be undone."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDeleteTargetId(null)}
              className="rounded-full px-5 py-2.5 text-xs sm:text-[13px] font-semibold border border-border bg-surface text-foreground hover:bg-surface-muted transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={isDeletingTx}
              className="rounded-full px-6 py-2.5 text-xs sm:text-[13px] font-bold bg-red-600 hover:bg-red-700 text-white transition shadow-xs disabled:opacity-50 inline-flex items-center gap-2"
            >
              {isDeletingTx && (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              )}
              <span>Delete</span>
            </button>
          </div>
        </div>
      </Modal>
      {/* MODAL: VIEW TRANSACTION DETAILS */}
      <Modal
        isOpen={Boolean(viewingTx)}
        onClose={() => setViewingTx(null)}
        title={viewingTx?.title || "Transaction Details"}
        description={viewingTx?.merchant ? `Merchant: ${viewingTx.merchant}` : "Recorded transaction details"}
        maxWidth="md"
      >
        {viewingTx && (
          <div className="space-y-4">
            {/* Amount Banner */}
            <div
              className={`p-4 rounded-2xl flex items-center justify-between ${
                viewingTx.type === "expense"
                  ? "bg-rose-500/10 border border-rose-500/25"
                  : "bg-emerald-500/10 border border-emerald-500/25"
              }`}
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted">
                  {viewingTx.type === "expense" ? "Expense Amount" : "Income Amount"}
                </span>
                <div
                  className={`font-display font-medium text-2xl sm:text-3xl mt-0.5 ${
                    viewingTx.type === "expense" ? "text-[#EF4444]" : "text-[#059669] dark:text-emerald-400"
                  }`}
                >
                  {viewingTx.type === "expense" ? `-${fmt(viewingTx.amount)}` : `+${fmt(viewingTx.amount)}`}
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  viewingTx.type === "expense" ? "bg-[#EF4444] text-white" : "bg-[#059669] text-white"
                }`}
              >
                {viewingTx.type === "expense" ? "↑ Expense" : "↓ Income"}
              </span>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-muted border border-border">
                <span className="text-foreground-muted block text-[10px] uppercase font-bold">Category</span>
                <span className="font-semibold text-foreground text-sm flex items-center gap-1.5 mt-0.5">
                  <span>{CATEGORY_COLORS[viewingTx.category]?.icon}</span>
                  <span>{viewingTx.category}</span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-muted border border-border">
                <span className="text-foreground-muted block text-[10px] uppercase font-bold">Date</span>
                <span className="font-semibold text-foreground text-sm font-mono mt-0.5 block">
                  {viewingTx.date}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-muted border border-border">
                <span className="text-foreground-muted block text-[10px] uppercase font-bold">Payment Method</span>
                <span className="font-semibold text-foreground text-sm mt-0.5 block">
                  {viewingTx.paymentMethod || "UPI"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-muted border border-border">
                <span className="text-foreground-muted block text-[10px] uppercase font-bold">Scope</span>
                <span className="font-semibold text-foreground text-sm mt-0.5 block">
                  {viewingTx.scope || "Personal"}
                </span>
              </div>
            </div>

            {viewingTx.notes && (
              <div className="p-3 rounded-xl bg-surface-muted border border-border text-xs">
                <span className="text-foreground-muted block text-[10px] uppercase font-bold">Notes</span>
                <p className="text-foreground font-medium mt-0.5 italic">{viewingTx.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  const id = viewingTx.id;
                  setViewingTx(null);
                  setDeleteTargetId(id);
                }}
                className="rounded-full px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 transition"
              >
                Delete Transaction
              </button>
              <button
                type="button"
                onClick={() => setViewingTx(null)}
                className="rounded-full px-5 py-2 text-xs font-bold bg-[#0E1F16] text-white hover:bg-black transition shadow-xs dark:bg-emerald-400 dark:text-emerald-950"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
