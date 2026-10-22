"use client";

import { useState } from "react";
import { useAddTransactionMutation } from "@/store/api/transactionsApi";
import type { CategoryName, PaymentMethod, TransactionType } from "@/store/types";

interface RecordExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
}

const CATEGORIES: CategoryName[] = [
  "Food",
  "Shopping",
  "Travel",
  "Bills",
  "Entertainment",
  "Health",
  "Rent",
  "EMI",
  "Fuel",
  "Groceries",
  "Subscriptions",
  "Education",
  "Other",
];

const PAYMENT_METHODS: PaymentMethod[] = [
  "UPI",
  "Debit Card",
  "Credit Card",
  "Net Banking",
  "Cash",
];

export function RecordExpenseModal({
  isOpen,
  onClose,
  defaultType = "expense",
}: RecordExpenseModalProps) {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [title, setTitle] = useState("");
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryName>("Food");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [error, setError] = useState<string | null>(null);

  const [addTransaction, { isLoading }] = useAddTransactionMutation();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!title.trim()) {
      setError("Please enter a description");
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    try {
      setError(null);
      await addTransaction({
        title: title.trim(),
        merchant: merchant.trim() || title.trim(),
        amount: numAmount,
        type,
        category,
        paymentMethod,
        date,
      }).unwrap();

      // Reset and close
      setTitle("");
      setMerchant("");
      setAmount("");
      onClose();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      setError(e?.data?.message || "Failed to save transaction");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-3xl glass glass--card glass-specular p-6 sm:p-7 shadow-2xl border border-border/80 text-foreground animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-border/50">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-foreground">
              {type === "expense" ? "Record an expense" : "Record income"}
            </h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              {type === "expense"
                ? "A payment out of your accounts. Automatically tracks your budget."
                : "Money coming into your operating or savings balance."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-foreground-muted hover:text-foreground hover:bg-surface-muted transition"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Type toggle pill */}
        <div className="flex justify-center my-4">
          <div className="seg-kesta p-1">
            <button
              type="button"
              onClick={() => setType("expense")}
              aria-pressed={type === "expense"}
              className={type === "expense" ? "text-coral font-bold" : ""}
            >
              Expense (Out)
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              aria-pressed={type === "income"}
              className={type === "income" ? "text-pine font-bold" : ""}
            >
              Income (In)
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-foreground-sub uppercase tracking-wider mb-1">
              Description
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Blue Tokai Coffee, Grocery run, Rent"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-muted/60 border border-border/80 text-foreground text-sm placeholder:text-foreground-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-foreground-sub uppercase tracking-wider mb-1">
                Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-foreground-muted text-sm font-bold num">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-surface-muted/60 border border-border/80 text-foreground text-sm num font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-foreground-sub uppercase tracking-wider mb-1">
                Paid to / Merchant
              </label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="e.g. Swiggy, Amazon"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-muted/60 border border-border/80 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-foreground-sub uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryName)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-muted/60 border border-border/80 text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-foreground-sub uppercase tracking-wider mb-1">
                Account / Mode
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-muted/60 border border-border/80 text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-foreground-sub uppercase tracking-wider mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-muted/60 border border-border/80 text-foreground text-xs num font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs font-medium text-coral bg-coral-soft/50 p-2.5 rounded-lg border border-coral/30">
              {error}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/50">
            <button
              type="button"
              onClick={onClose}
              className="btn-kesta btn-kesta--ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-kesta btn-kesta--primary"
            >
              {isLoading
                ? "Saving…"
                : type === "expense"
                ? "Record expense"
                : "Record income"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
