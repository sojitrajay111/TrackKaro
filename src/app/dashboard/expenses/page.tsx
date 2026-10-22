"use client";

import { Fragment, useState, useMemo, type FormEvent } from "react";
import { OnQueryParam } from "@/components/ui/query-param";
import { CategoryIcon, CategoryTile, CATEGORY_TINT } from "@/components/ui/category-icon";
import { Drawer } from "@/components/ui/drawer";
import { TransactionDetail } from "@/components/expenses/transaction-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal, ModalField, ModalFooter } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  useGetTransactionsQuery,
  useAddTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
} from "@/store/api/transactionsApi";
import { useGetBudgetsQuery } from "@/store/api/budgetsApi";
import { BudgetLimitModal } from "@/components/expenses/budget-limit-modal";
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

const CATEGORY_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  Food: { bg: "bg-amber-500/15", text: "text-amber-700 dark:text-amber-300", bar: "bg-amber-500" },
  Shopping: { bg: "bg-pink-500/15", text: "text-pink-700 dark:text-pink-300", bar: "bg-pink-500" },
  Groceries: { bg: "bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-300", bar: "bg-emerald-600" },
  Bills: { bg: "bg-purple-500/15", text: "text-purple-700 dark:text-purple-300", bar: "bg-purple-600" },
  Travel: { bg: "bg-blue-500/15", text: "text-blue-700 dark:text-blue-300", bar: "bg-blue-600" },
  Fuel: { bg: "bg-rose-500/15", text: "text-rose-700 dark:text-rose-300", bar: "bg-rose-600" },
  Entertainment: { bg: "bg-indigo-500/15", text: "text-indigo-700 dark:text-indigo-300", bar: "bg-indigo-600" },
  Health: { bg: "bg-teal-500/15", text: "text-teal-700 dark:text-teal-300", bar: "bg-teal-600" },
  Subscriptions: { bg: "bg-purple-500/15", text: "text-purple-700 dark:text-purple-300", bar: "bg-purple-600" },
  Rent: { bg: "bg-rose-500/15", text: "text-rose-700 dark:text-rose-300", bar: "bg-rose-600" },
  EMI: { bg: "bg-amber-500/15", text: "text-amber-700 dark:text-amber-300", bar: "bg-amber-600" },
  Education: { bg: "bg-cyan-500/15", text: "text-cyan-700 dark:text-cyan-300", bar: "bg-cyan-600" },
  Other: { bg: "bg-slate-500/15", text: "text-slate-700 dark:text-slate-300", bar: "bg-slate-600" },
};

export default function ExpensesPage() {
  // Queries & Mutations
  const { data: transactions = [], isLoading: loadingTx } = useGetTransactionsQuery();
  const { data: budgets = [] } = useGetBudgetsQuery();
  const [addTransaction, { isLoading: isAddingTx }] = useAddTransactionMutation();
  const [updateTransaction, { isLoading: isUpdatingTx }] = useUpdateTransactionMutation();
  const [deleteTransaction, { isLoading: isDeletingTx }] = useDeleteTransactionMutation();

  // Tab State
  const [activeTab, setActiveTab] = useState<SpendingTab>("activity");

  // Period: "all" or a YYYY-MM month
  const thisMonthKey = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();
  const [period, setPeriod] = useState<string>(thisMonthKey);
  const isAllTime = period === "all";
  const [visibleCount, setVisibleCount] = useState(40);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<"all" | "expense" | "income">("all");

  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditBudgetModal, setShowEditBudgetModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryName>("Food");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [viewingTx, setViewingTx] = useState<Transaction | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Edit Transaction State
  const [isEditingTx, setIsEditingTx] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editMerchant, setEditMerchant] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editType, setEditType] = useState<"expense" | "income">("expense");
  const [editCategory, setEditCategory] = useState<CategoryName>("Food");
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>("UPI");
  const [editScope, setEditScope] = useState<TransactionScope>("Personal");
  const [editDate, setEditDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [editNotes, setEditNotes] = useState("");

  // New Transaction Form State
  const [txTitle, setTxTitle] = useState("");
  const [txMerchant, setTxMerchant] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txType, setTxType] = useState<"expense" | "income">("expense");
  const [txCategory, setTxCategory] = useState<CategoryName>("Food");
  const [txPaymentMethod, setTxPaymentMethod] = useState<PaymentMethod>("UPI");
  const [txScope] = useState<TransactionScope>("Personal");
  const [txDate, setTxDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [txNotes, setTxNotes] = useState("");

  // Month Formatters
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  // Budgets and analytics are monthly; with "All time" selected they show the current month.
  const currentYearMonth = isAllTime ? thisMonthKey : period;
  const [cyY, cyM] = currentYearMonth.split("-").map(Number);
  const selectedDate = new Date(cyY, cyM - 1, 1);
  const currentMonthLabel = `${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  const periodOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    return {
      value: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`,
      label: i === 0 ? "This month" : `${monthNames[m.getMonth()]} ${m.getFullYear()}`,
    };
  });

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
  const { monthExpenses, totalBudgetLimit, budgetPercent, dailyAvg } = useMemo(() => {
    const monthTx = transactions.filter((t) => t.date?.startsWith(currentYearMonth));
    const exp = monthTx.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    const inc = monthTx.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const totalBudget = budgets.reduce((sum, b) => sum + (b.limit || 0), 0);
    const pct = totalBudget > 0 ? Math.min(Math.round((exp / totalBudget) * 100), 100) : 0;

    const [y, m] = currentYearMonth.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const passedDays = currentYearMonth === thisMonthKey ? new Date().getDate() : daysInMonth;
    const avg = passedDays > 0 ? Math.round(exp / passedDays) : 0;

    return {
      monthExpenses: exp,
      monthIncome: inc,
      monthBudget: totalBudget,
      totalBudgetLimit: totalBudget,
      budgetPercent: pct,
      dailyAvg: avg,
    };
  }, [transactions, budgets, currentYearMonth, thisMonthKey]);

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

  // Delete Action
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setDeleteError(null);
    try {
      await deleteTransaction(deleteTargetId).unwrap();
      setDeleteTargetId(null);
    } catch {
      setDeleteError("Couldn't delete it. Check your connection and try again.");
    }
  };
  // Keep the last target visible while the dialog animates closed.
  const [deletePreview, setDeletePreview] = useState<Transaction | null>(null);
  const deleteTarget = transactions.find((t) => t.id === deleteTargetId) ?? null;
  if (deleteTarget && deleteTarget !== deletePreview) setDeletePreview(deleteTarget);

  // Transaction Edit Handlers
  const handleStartEdit = (tx: Transaction) => {
    setEditTitle(tx.title);
    setEditMerchant(tx.merchant || tx.title);
    setEditAmount(String(tx.amount));
    setEditType(tx.type);
    setEditCategory(tx.category);
    setEditPaymentMethod(tx.paymentMethod || "UPI");
    setEditScope(tx.scope || "Personal");
    setEditDate(tx.date);
    setEditNotes(tx.notes || "");
    setIsEditingTx(true);
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!viewingTx || !editTitle.trim() || !editAmount) return;

    try {
      const updated = await updateTransaction({
        id: viewingTx.id,
        data: {
          title: editTitle.trim(),
          merchant: editMerchant.trim() || editTitle.trim(),
          amount: parseFloat(editAmount),
          type: editType,
          category: editCategory,
          paymentMethod: editPaymentMethod,
          scope: editScope,
          date: editDate,
          notes: editNotes.trim() || undefined,
        },
      }).unwrap();

      setViewingTx(updated);
      setIsEditingTx(false);
    } catch {
      // Error handled
    }
  };

  const openTx = (tx: Transaction) => {
    setViewingTx(tx);
    setIsEditingTx(false);
    setDrawerOpen(true);
  };

  // viewingTx stays set while the drawer's close animation plays.
  const handleCloseViewingTx = () => {
    setDrawerOpen(false);
    setIsEditingTx(false);
  };

  // Duplicate: open "Record expense" prefilled with this payment, dated today.
  const handleDuplicate = (tx: Transaction) => {
    setTxTitle(tx.title);
    setTxMerchant(tx.merchant || "");
    setTxAmount(String(tx.amount));
    setTxType(tx.type);
    setTxCategory(tx.category);
    setTxPaymentMethod(tx.paymentMethod || "UPI");
    setTxNotes(tx.notes || "");
    setTxDate(new Date().toISOString().split("T")[0]);
    handleCloseViewingTx();
    setTimeout(() => setShowAddModal(true), 260);
  };

  const drawerBtn =
    "inline-flex h-[38px] items-center gap-2 rounded-[12px] border border-border bg-surface px-3.5 text-[14px] font-bold text-foreground transition hover:bg-surface-muted";

  // Ledger: filtered rows, newest first, grouped by day
  const ledgerDays = useMemo(() => {
    const sorted = [...filteredTransactions].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    const shown = sorted.slice(0, visibleCount);
    const groups: { date: string; rows: Transaction[]; net: number }[] = [];
    for (const tx of shown) {
      const last = groups[groups.length - 1];
      const signed = tx.type === "income" ? tx.amount : -tx.amount;
      if (last && last.date === tx.date) {
        last.rows.push(tx);
        last.net += signed;
      } else {
        groups.push({ date: tx.date, rows: [tx], net: signed });
      }
    }
    return groups;
  }, [filteredTransactions, visibleCount]);

  const summary = useMemo(() => {
    const moneyIn = filteredTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const moneyOut = filteredTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { count: filteredTransactions.length, moneyIn, moneyOut, net: moneyIn - moneyOut };
  }, [filteredTransactions]);

  const overBudgetCount = categoryBreakdown.filter((c) => c.isOver).length;
  const periodLabel = isAllTime ? "all time" : currentMonthLabel;

  const dayLabel = (date: string) => {
    const [y, m, d] = (date || "").split("-").map(Number);
    if (!y) return date;
    return new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  };

  const handleExportCsv = () => {
    const esc = (v: string | number | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [
      ["Date", "Title", "Merchant", "Type", "Category", "Payment method", "Amount", "Notes"],
      ...[...filteredTransactions]
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
        .map((t) => [t.date, t.title, t.merchant, t.type, t.category, t.paymentMethod, t.amount, t.notes]),
    ];
    const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TrackKaro-expenses-${isAllTime ? "all-time" : period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasFilters = Boolean(searchQuery.trim()) || selectedType !== "all" || selectedCategory !== "All";
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedType("all");
    setSelectedCategory("All");
  };

  const btnGhost =
    "inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-border bg-surface px-[18px] text-[16px] font-bold text-foreground shadow-xs transition hover:bg-surface-muted disabled:opacity-50";
  const btnDark =
    "inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[var(--primary)] px-[18px] text-[16px] font-bold text-[var(--on-primary)] shadow-xs transition hover:bg-[var(--primary-strong)]";
  const selectCls =
    "h-[42px] rounded-[12px] border border-[var(--line-2)] bg-surface px-3 text-[15px] font-[650] text-foreground focus:outline-none focus:border-foreground";
  const chipCls = (on: boolean) =>
    `inline-flex h-[34px] items-center rounded-full border px-[13px] text-[14px] font-bold transition ${
      on ? "border-transparent bg-foreground text-background" : "border-border bg-surface text-foreground hover:border-[var(--line-2)]"
    }`;
  const card = "rounded-[22px] border border-border bg-surface p-5 shadow-xs";

  const TABS: { id: SpendingTab; label: string; badge?: number }[] = [
    { id: "activity", label: "Transactions" },
    { id: "budgets", label: "Budgets", badge: overBudgetCount || undefined },
    { id: "analytics", label: "Analytics" },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* From the search palette: /dashboard/expenses?q=… */}
      <OnQueryParam name="q" onValue={setSearchQuery} />
      {/* Header: breadcrumb, title, summary line, actions */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-x-6 gap-y-4">
        <div className="flex flex-col gap-1.5 min-w-0">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[14px] font-[650] text-foreground-muted">
            <span>Money</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9.5 6 6 6-6 6" />
            </svg>
            <span className="text-foreground">Expenses</span>
          </nav>
          <h1 className="text-[30px] lg:text-[clamp(1.875rem,2.5vw,2.375rem)] font-extrabold tracking-[-0.04em] leading-[1.08] text-foreground">
            Expenses
          </h1>
          <p className="text-[16px] font-medium text-foreground-muted">
            <b className="font-bold text-foreground">{summary.count}</b> {summary.count === 1 ? "transaction" : "transactions"} in {periodLabel}
            {overBudgetCount > 0 && (
              <>
                {" "}· <b className="font-bold text-foreground">{overBudgetCount}</b> {overBudgetCount === 1 ? "category" : "categories"} over budget
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button type="button" onClick={handleExportCsv} disabled={filteredTransactions.length === 0} className={btnGhost}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 4v11.5M7 10.5l5 5 5-5M5 20h14" />
            </svg>
            Export CSV
          </button>
          <button type="button" onClick={() => setShowAddModal(true)} className={btnDark}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Record expense
          </button>
        </div>
      </header>

      {/* Underlined tabs */}
      <div role="tablist" aria-label="Expenses views" className="flex gap-1 border-b border-border">
        {TABS.map((t) => {
          const on = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActiveTab(t.id)}
              className={`relative inline-flex items-center gap-[7px] rounded-t-[10px] px-3.5 pt-2.5 pb-3 text-[16px] font-bold transition ${
                on ? "text-foreground" : "text-foreground-muted hover:text-foreground"
              }`}
            >
              {t.label}
              {t.badge !== undefined && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--rose)_16%,transparent)] px-1.5 text-[12px] font-extrabold text-[var(--bad)]">
                  {t.badge}
                </span>
              )}
              {on && <span className="absolute inset-x-2 -bottom-px h-[3px] rounded-t-[3px] bg-foreground" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      {/* TAB: TRANSACTIONS */}
      {activeTab === "activity" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="relative flex-1 min-w-[220px] max-w-[320px]">
              <span className="sr-only">Search transactions</span>
              <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>
              <input
                type="search"
                placeholder="Search payee, notes…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-[42px] w-full rounded-[12px] border border-border bg-surface pl-10 pr-3 text-[15px] text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-foreground"
              />
            </label>
            <div className="flex items-center gap-2" role="group" aria-label="Direction">
              {([
                ["all", "All"],
                ["income", "Money in"],
                ["expense", "Money out"],
              ] as const).map(([v, label]) => (
                <button key={v} type="button" aria-pressed={selectedType === v} onClick={() => setSelectedType(v)} className={chipCls(selectedType === v)}>
                  {label}
                </button>
              ))}
            </div>
            <select aria-label="Category" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className={selectCls}>
              <option value="All">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              aria-label="Period"
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                setVisibleCount(40);
              }}
              className={selectCls}
            >
              {periodOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
              <option value="all">All time</option>
            </select>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="h-[34px] rounded-[10px] px-2.5 text-[14px] font-bold text-foreground-muted hover:text-foreground">
                Clear
              </button>
            )}
          </div>

          {/* Summary tiles */}
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Payments", value: String(summary.count), tone: "text-foreground" },
              { label: "Money in", value: fmt(summary.moneyIn), tone: "text-[var(--good)]" },
              { label: "Money out", value: fmt(summary.moneyOut), tone: "text-foreground" },
              {
                label: "Net",
                value: `${summary.net < 0 ? "−" : summary.net > 0 ? "+" : ""}${fmt(summary.net)}`,
                tone: summary.net < 0 ? "text-[var(--bad)]" : summary.net > 0 ? "text-[var(--good)]" : "text-foreground",
              },
            ].map((t) => (
              <div key={t.label} className="min-w-0 rounded-[16px] border border-border bg-surface px-4 py-3">
                <dt className="text-[14px] font-bold text-foreground-muted">{t.label}</dt>
                <dd className={`truncate text-[20px] lg:text-[24px] font-extrabold tracking-[-0.035em] num ${t.tone}`}>
                  {loadingTx ? <Skeleton className="mt-1 h-7 w-24" /> : t.value}
                </dd>
              </div>
            ))}
          </dl>

          {/* Ledger */}
          <section className={card} aria-labelledby="ledger-title">
            <header className="mb-2 flex items-start justify-between gap-3">
              <div>
                <h2 id="ledger-title" className="text-[17px] font-extrabold tracking-[-0.015em] text-foreground">
                  Ledger
                </h2>
                <p className="mt-0.5 text-[14px] font-medium text-foreground-muted">Every payment in {periodLabel}, newest first</p>
              </div>
            </header>

            {loadingTx ? (
              <div className="space-y-3 py-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 px-4 py-9 text-center text-foreground-muted">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="m16 16 4 4" />
                </svg>
                <p className="font-bold text-foreground">{hasFilters ? "No payments match" : "No payments yet"}</p>
                <p className="text-[15px]">
                  {hasFilters ? "Try a different search, or clear the filters." : `Nothing recorded in ${periodLabel}.`}
                </p>
                <button type="button" onClick={hasFilters ? clearFilters : () => setShowAddModal(true)} className="mt-2 inline-flex h-[38px] items-center rounded-[12px] border border-border bg-surface px-3.5 text-[14px] font-bold text-foreground hover:bg-surface-muted">
                  {hasFilters ? "Clear filters" : "Record expense"}
                </button>
              </div>
            ) : (
              <>
                <table className="w-full border-separate border-spacing-0 text-[15px]">
                  <thead className="hidden md:table-header-group">
                    <tr className="text-left text-[13px] font-[750] tracking-[0.04em] text-foreground-muted">
                      <th scope="col" className="border-b border-border px-3 py-2.5">Payee</th>
                      <th scope="col" className="border-b border-border px-3 py-2.5">Category</th>
                      <th scope="col" className="border-b border-border px-3 py-2.5">Paid with</th>
                      <th scope="col" className="border-b border-border px-3 py-2.5 text-right">Amount</th>
                      <th scope="col" className="w-10 border-b border-border px-1 py-2.5"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerDays.map((day) => (
                      <Fragment key={day.date}>
                        <tr>
                          <td colSpan={5} className="border-b border-border px-3 pt-4 pb-1.5 text-[14px] font-extrabold text-foreground-muted">
                            <span className="text-[13px] uppercase tracking-[0.06em]">{dayLabel(day.date)}</span>
                            <em className={`float-right not-italic num ${day.net > 0 ? "text-[var(--good)]" : ""}`}>
                              {day.net > 0 ? "+" : day.net < 0 ? "−" : ""}
                              {fmt(day.net)}
                            </em>
                          </td>
                        </tr>
                        {day.rows.map((tx) => {
                          const isIncome = tx.type === "income";
                          const tint = CATEGORY_TINT[tx.category] ?? CATEGORY_TINT.Other;
                          return (
                            <tr key={tx.id} onClick={() => openTx(tx)} className="group cursor-pointer hover:bg-[var(--surface-2)]">
                              <td className="border-b border-border px-3 py-[11px]">
                                <span className="flex items-center gap-3 min-w-0">
                                  <CategoryTile name={tx.category} size={36} />
                                  <span className="min-w-0">
                                    <b className="block max-w-[300px] truncate font-bold text-foreground">{tx.title}</b>
                                    <small className="block truncate text-[14px] text-foreground-muted">
                                      {tx.merchant && tx.merchant !== tx.title ? tx.merchant : tx.notes || tx.paymentMethod}
                                      <span className="md:hidden"> · {tx.category}</span>
                                    </small>
                                  </span>
                                </span>
                              </td>
                              <td className="hidden md:table-cell border-b border-border px-3 py-[11px]">
                                <span className="inline-flex items-center gap-[7px] whitespace-nowrap font-[650] text-foreground">
                                  <i className="h-2 w-2 rounded-[3px]" style={{ background: tint.dot }} aria-hidden="true" />
                                  {tx.category}
                                </span>
                              </td>
                              <td className="hidden md:table-cell border-b border-border px-3 py-[11px] whitespace-nowrap font-[650] text-foreground-sub">
                                {tx.paymentMethod || "—"}
                              </td>
                              <td className={`border-b border-border px-3 py-[11px] text-right font-extrabold whitespace-nowrap num ${isIncome ? "text-[var(--good)]" : "text-foreground"}`}>
                                {isIncome ? "+" : "−"}
                                {fmt(tx.amount)}
                              </td>
                              <td className="border-b border-border px-1 py-[11px] text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteTargetId(tx.id);
                                  }}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] text-foreground-muted opacity-0 transition hover:bg-[color-mix(in_srgb,var(--rose)_14%,transparent)] hover:text-[var(--bad)] focus:opacity-100 group-hover:opacity-100"
                                  aria-label={`Delete ${tx.title}`}
                                  title="Delete"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
                {filteredTransactions.length > visibleCount && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((n) => n + 40)}
                    className="mx-auto mt-3.5 flex h-[38px] items-center rounded-[12px] border border-border bg-surface px-3.5 text-[14px] font-bold text-foreground hover:bg-surface-muted"
                  >
                    Show {Math.min(40, filteredTransactions.length - visibleCount)} more
                  </button>
                )}
              </>
            )}
          </section>
        </div>
      )}

      {/* TAB: BUDGETS */}
      {activeTab === "budgets" && (
        <div className="space-y-4">
          <section className={`${card} flex flex-col md:flex-row md:items-center justify-between gap-5`}>
            <div>
              <p className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-foreground-muted">{currentMonthLabel}</p>
              {totalBudgetLimit > 0 ? (
                <>
                  <p className="mt-1 text-[28px] font-extrabold tracking-[-0.04em] leading-[1.1] text-foreground">
                    {budgetPercent}% <span className="text-[17px] font-bold text-foreground-muted">of your budget spent</span>
                  </p>
                  <p className="mt-1 text-[14px] font-[650] text-foreground-muted">
                    {fmt(monthExpenses)} of {fmt(totalBudgetLimit)} · {fmt(Math.max(0, totalBudgetLimit - monthExpenses))} left · {fmt(dailyAvg)}/day
                  </p>
                </>
              ) : (
                <p className="mt-1 text-[17px] font-bold text-foreground">No limits set yet. Set one for any category below.</p>
              )}
            </div>
            {totalBudgetLimit > 0 && (
              <div className="w-full md:w-80">
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--well)]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(budgetPercent, 100)}%`, background: budgetPercent >= 100 ? "var(--bad)" : budgetPercent >= 80 ? "var(--amber)" : "var(--pine)" }}
                  />
                </div>
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryBreakdown.map((item) => {
              const color = item.isOver ? "var(--bad)" : item.percent >= 80 ? "var(--amber)" : (CATEGORY_TINT[item.category] ?? CATEGORY_TINT.Other).dot;
              return (
                <div key={item.category} className={`${card} space-y-4`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <CategoryTile name={item.category} size={36} />
                      <div className="min-w-0">
                        <h3 className="truncate text-[15px] font-extrabold text-foreground">{item.category}</h3>
                        <p className="text-[13px] font-semibold text-foreground-muted">
                          {item.limit > 0 ? `Limit ${fmt(item.limit)}` : "No limit set"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(item.category);
                        setShowEditBudgetModal(true);
                      }}
                      className="inline-flex h-8 shrink-0 items-center rounded-[10px] border border-border bg-surface px-[11px] text-[14px] font-bold text-foreground hover:bg-surface-muted"
                    >
                      {item.limit > 0 ? "Edit limit" : "Set limit"}
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[14px] font-bold">
                      <span className="text-foreground num">{fmt(item.spent)} spent</span>
                      <span className="num" style={{ color: item.limit > 0 ? color : undefined }}>
                        {item.limit > 0 ? (item.isOver ? `${fmt(item.spent - item.limit)} over` : `${item.percent}%`) : "—"}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--well)]">
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${item.limit > 0 ? Math.min(item.percent, 100) : 0}%`, background: color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <section className={`${card} lg:col-span-7`}>
            <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-foreground">Top categories</h2>
            <p className="mt-0.5 mb-4 text-[14px] font-medium text-foreground-muted">Where the money went in {currentMonthLabel}</p>
            <ul className="space-y-3.5">
              {categoryBreakdown
                .filter((c) => c.spent > 0)
                .map((cat) => {
                  const pctOfTotal = monthExpenses > 0 ? Math.round((cat.spent / monthExpenses) * 100) : 0;
                  return (
                    <li key={cat.category} className="flex items-center gap-3">
                      <CategoryTile name={cat.category} size={32} />
                      <span className="flex-1 min-w-0 space-y-1">
                        <span className="flex justify-between text-[14px] font-bold">
                          <span className="text-foreground">{cat.category}</span>
                          <span className="text-foreground num">
                            {fmt(cat.spent)} <span className="font-semibold text-foreground-muted">· {pctOfTotal}%</span>
                          </span>
                        </span>
                        <span className="block h-[5px] w-full overflow-hidden rounded-full bg-[var(--well)]">
                          <span className="block h-full rounded-full" style={{ width: `${Math.min(pctOfTotal, 100)}%`, background: (CATEGORY_TINT[cat.category] ?? CATEGORY_TINT.Other).dot }} />
                        </span>
                      </span>
                    </li>
                  );
                })}
              {categoryBreakdown.filter((c) => c.spent > 0).length === 0 && (
                <li className="py-8 text-center text-[15px] text-foreground-muted">No spending recorded in {currentMonthLabel}.</li>
              )}
            </ul>
          </section>

          <section className={`${card} lg:col-span-5`}>
            <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-foreground">Paid with</h2>
            <p className="mt-0.5 mb-4 text-[14px] font-medium text-foreground-muted">Spending by payment method in {currentMonthLabel}</p>
            <ul className="space-y-3">
              {PAYMENT_METHODS.map((pm) => {
                const total = transactions
                  .filter((t) => t.type === "expense" && t.date?.startsWith(currentYearMonth) && t.paymentMethod === pm)
                  .reduce((sum, t) => sum + t.amount, 0);
                const pct = monthExpenses > 0 ? Math.round((total / monthExpenses) * 100) : 0;
                return (
                  <li key={pm} className="space-y-1">
                    <span className="flex justify-between text-[14px] font-bold">
                      <span className="text-foreground">{pm}</span>
                      <span className="text-foreground num">
                        {fmt(total)} <span className="font-semibold text-foreground-muted">· {pct}%</span>
                      </span>
                    </span>
                    <span className="block h-[5px] w-full overflow-hidden rounded-full bg-[var(--well)]">
                      <span className="block h-full rounded-full bg-foreground" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
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
                    <CategoryIcon name={cat} size={13} />
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
                    {cat}
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

      {/* MODAL 2: SET / EDIT BUDGET LIMIT (shared, shows real errors) */}
      <BudgetLimitModal
        isOpen={showEditBudgetModal}
        onClose={() => setShowEditBudgetModal(false)}
        category={editingCategory}
        currentLimit={categoryBreakdown.find((c) => c.category === editingCategory)?.limit ?? 0}
        spent={categoryBreakdown.find((c) => c.category === editingCategory)?.spent}
      />

      {/* MODAL 3: DELETE CONFIRMATION (shows exactly what will be removed) */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onCancel={() => {
          setDeleteTargetId(null);
          setDeleteError(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete this transaction?"
        description="It's removed from your spending, budgets and reports. This can't be undone."
        confirmLabel="Delete"
        isWorking={isDeletingTx}
        error={deleteError}
      >
        {deletePreview && (
          <div className="tk-pop flex items-center gap-3 rounded-[16px] border border-border bg-[var(--surface-2)] p-3">
            <CategoryTile name={deletePreview.category} size={42} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-extrabold text-foreground">{deletePreview.title}</p>
              <p className="truncate text-[14px] text-foreground-muted">
                {deletePreview.category} · {new Date(deletePreview.date.slice(0, 10) + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                {deletePreview.paymentMethod ? ` · ${deletePreview.paymentMethod}` : ""}
              </p>
            </div>
            <b className={`shrink-0 text-[18px] font-extrabold tracking-[-0.02em] num ${deletePreview.type === "income" ? "text-[var(--good)]" : "text-foreground"}`}>
              {deletePreview.type === "income" ? "+" : "−"}₹{deletePreview.amount.toLocaleString("en-IN")}
            </b>
          </div>
        )}
      </ConfirmDialog>
      {/* DRAWER: VIEW / EDIT TRANSACTION (Kesta-style animated side panel) */}
      <Drawer
        open={drawerOpen}
        onClose={handleCloseViewingTx}
        label={viewingTx?.title || "Transaction"}
        footer={
          viewingTx &&
          (isEditingTx ? (
            <>
              <button type="button" onClick={() => setIsEditingTx(false)} className={drawerBtn}>
                Cancel
              </button>
              <button
                type="submit"
                form="tx-edit-form"
                disabled={isUpdatingTx}
                className="ml-auto inline-flex h-[38px] items-center gap-2 rounded-[12px] bg-[var(--primary)] px-3.5 text-[14px] font-bold text-[var(--on-primary)] transition hover:bg-[var(--primary-strong)] disabled:opacity-50"
              >
                {isUpdatingTx ? "Saving…" : "Save changes"}
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => handleStartEdit(viewingTx)} className={drawerBtn}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />
                </svg>
                Edit
              </button>
              <button type="button" onClick={() => handleDuplicate(viewingTx)} className={drawerBtn}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="8" y="8" width="12" height="12" rx="2.5" />
                  <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                </svg>
                Duplicate
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = viewingTx.id;
                  handleCloseViewingTx();
                  setDeleteTargetId(id);
                }}
                className={`${drawerBtn} text-[var(--bad)]`}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />
                </svg>
                Delete
              </button>
            </>
          ))
        }
      >
        {viewingTx && !isEditingTx && <TransactionDetail key={viewingTx.id} tx={viewingTx} onUpdated={setViewingTx} />}
        {viewingTx && isEditingTx && (
          <>
            <div className="pr-12">
              <p className="text-[14px] font-[650] text-foreground-muted">Edit payment</p>
              <h2 className="text-[24px] font-extrabold tracking-[-0.03em] leading-tight text-foreground">{viewingTx.title}</h2>
            </div>
            <form id="tx-edit-form" onSubmit={handleEditSubmit} className="space-y-3">
              {/* Type Switcher: Expense vs Income */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditType("expense")}
                  className={`h-8 rounded-[10px] text-xs font-medium transition-all flex items-center justify-center gap-1.5 select-none ${
                    editType === "expense"
                      ? "bg-[#EF4444] text-white font-bold shadow-sm shadow-red-500/25"
                      : "bg-[#EAF3EE] dark:bg-[#14291F] text-[#3E5A4A] dark:text-[#A9C4B6] hover:text-[#EF4444]"
                  }`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m18 15-6-6-6 6" />
                  </svg>
                  <span>Expense</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditType("income")}
                  className={`h-8 rounded-[10px] text-xs font-medium transition-all flex items-center justify-center gap-1.5 select-none ${
                    editType === "income"
                      ? "bg-[#059669] text-white font-bold shadow-sm shadow-emerald-500/25"
                      : "bg-[#EAF3EE] dark:bg-[#14291F] text-[#3E5A4A] dark:text-[#A9C4B6] hover:text-[#059669]"
                  }`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                  <span>Income</span>
                </button>
              </div>

              {/* Title / Description */}
              <div>
                <label className="block text-[14px] font-bold text-foreground-muted mb-1.5">Title / Description</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="h-11 w-full rounded-[12px] border border-[var(--line-2)] bg-surface px-[13px] text-[15px] font-medium text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-foreground"
                />
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[14px] font-bold text-foreground-muted mb-1.5">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="h-11 w-full rounded-[12px] border border-[var(--line-2)] bg-surface px-[13px] text-[15px] font-medium text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-bold text-foreground-muted mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="h-11 w-full rounded-[12px] border border-[var(--line-2)] bg-surface px-[13px] text-[15px] font-medium text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-foreground"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[14px] font-bold text-foreground-muted mb-1.5">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as CategoryName)}
                  className="h-11 w-full rounded-[12px] border border-[var(--line-2)] bg-surface px-[13px] text-[15px] font-medium text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-foreground"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Method & Scope */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[14px] font-bold text-foreground-muted mb-1.5">Payment Method</label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value as PaymentMethod)}
                    className="h-11 w-full rounded-[12px] border border-[var(--line-2)] bg-surface px-[13px] text-[15px] font-medium text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-foreground"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[14px] font-bold text-foreground-muted mb-1.5">Scope</label>
                  <select
                    value={editScope}
                    onChange={(e) => setEditScope(e.target.value as TransactionScope)}
                    className="h-11 w-full rounded-[12px] border border-[var(--line-2)] bg-surface px-[13px] text-[15px] font-medium text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-foreground"
                  >
                    <option value="Personal">Personal</option>
                    <option value="Work">Work</option>
                    <option value="Family">Family</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[14px] font-bold text-foreground-muted mb-1.5">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Dinner with team"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="h-11 w-full rounded-[12px] border border-[var(--line-2)] bg-surface px-[13px] text-[15px] font-medium text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-foreground"
                />
              </div>
            </form>
          </>
        )}
      </Drawer>
    </div>
  );
}
