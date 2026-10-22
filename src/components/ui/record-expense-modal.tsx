"use client";

import { useState } from "react";
import { Modal, ModalField, ModalFooter, ModalSegmentedPicker } from "@/components/ui/modal";
import { CategoryTile } from "@/components/ui/category-icon";
import { inputCls } from "@/lib/form";
import { useAddTransactionMutation } from "@/store/api/transactionsApi";
import type { CategoryName, PaymentMethod, TransactionType } from "@/store/types";

interface RecordExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
}

const CATEGORIES: CategoryName[] = [
  "Food",
  "Groceries",
  "Shopping",
  "Travel",
  "Fuel",
  "Bills",
  "Rent",
  "EMI",
  "Subscriptions",
  "Entertainment",
  "Health",
  "Education",
  "Other",
];

const PAYMENT_METHODS: PaymentMethod[] = ["UPI", "Debit Card", "Credit Card", "Net Banking", "Cash"];

/** Selectable chip (category / payment method), Kesta 34px chip with an emerald selected ring. */
const chipCls = (on: boolean) =>
  `inline-flex h-[38px] shrink-0 items-center gap-2 rounded-[12px] border px-2.5 text-[14px] font-bold transition select-none ${
    on
      ? "border-[var(--primary)] bg-[var(--primary-soft)] text-foreground shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_14%,transparent)]"
      : "border-border bg-surface text-foreground-muted hover:border-[var(--line-2)] hover:text-foreground"
  }`;

export function RecordExpenseModal({ isOpen, onClose, defaultType = "expense" }: RecordExpenseModalProps) {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [title, setTitle] = useState("");
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryName>("Food");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [error, setError] = useState<string | null>(null);

  const [addTransaction, { isLoading }] = useAddTransactionMutation();

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

  const isExpense = type === "expense";
  const tone = isExpense ? "var(--coral)" : "var(--pine)";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isExpense ? "Record an expense" : "Record income"}
      description={isExpense ? "A payment out of your accounts. Automatically tracks your budget." : "Money coming into your operating or savings balance."}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <ModalSegmentedPicker
          options={[
            { value: "expense" as const, label: "Expense · money out" },
            { value: "income" as const, label: "Income · money in" },
          ]}
          selected={type}
          onChange={setType}
        />

        {/* Amount: the main figure, large and tinted by direction */}
        <div
          className="rounded-[18px] border px-4 py-3.5 transition-colors"
          style={{
            borderColor: `color-mix(in srgb, ${tone} 28%, var(--line))`,
            background: `color-mix(in srgb, ${tone} 7%, var(--surface))`,
          }}
        >
          <label htmlFor="rx-amount" className="block text-[14px] font-bold text-foreground-muted">
            Amount
          </label>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="shrink-0 whitespace-nowrap text-[30px] font-extrabold leading-none" style={{ color: tone }} aria-hidden="true">
              {isExpense ? "−₹" : "+₹"}
            </span>
            <input
              id="rx-amount"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              autoFocus
              className="tk-compact tk-bare w-full min-w-0 border-0 bg-transparent p-0 text-[34px] font-extrabold leading-none tracking-[-0.03em] text-foreground num outline-none placeholder:text-[var(--line-2)] focus:ring-0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <ModalField label="Description">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Coffee, Grocery run, Rent"
              className={inputCls}
            />
          </ModalField>
          <ModalField label={isExpense ? "Paid to" : "Received from"}>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder={isExpense ? "e.g. Swiggy, Amazon" : "e.g. Employer, Client"}
              className={inputCls}
            />
          </ModalField>
        </div>

        <ModalField label="Category">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Category">
            {CATEGORIES.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={category === c} onClick={() => setCategory(c)} className={chipCls(category === c)}>
                <CategoryTile name={c} size={24} />
                {c}
              </button>
            ))}
          </div>
        </ModalField>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[minmax(0,1fr)_170px]">
          <ModalField label={isExpense ? "Paid with" : "Received via"}>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Payment method">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm}
                  type="button"
                  role="radio"
                  aria-checked={paymentMethod === pm}
                  onClick={() => setPaymentMethod(pm)}
                  className={`${chipCls(paymentMethod === pm)} px-3`}
                >
                  {pm}
                </button>
              ))}
            </div>
          </ModalField>
          <ModalField label="Date">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputCls} num`} />
          </ModalField>
        </div>

        {error && (
          <p role="alert" className="rounded-[12px] border border-[color-mix(in_srgb,var(--bad)_30%,transparent)] bg-[color-mix(in_srgb,var(--bad)_8%,transparent)] px-3 py-2.5 text-[14px] font-semibold text-[var(--bad)]">
            {error}
          </p>
        )}

        <ModalFooter
          onCancel={onClose}
          isSubmitting={isLoading}
          confirmLabel={isLoading ? "Saving…" : isExpense ? "Record expense" : "Record income"}
        />
      </form>
    </Modal>
  );
}
