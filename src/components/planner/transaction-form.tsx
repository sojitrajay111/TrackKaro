"use client";

import { useState, type FormEvent } from "react";
import { ModalField, ModalFooter } from "@/components/ui/modal";
import { Segmented } from "@/components/ui/segmented";
import { apiErrorMessage, inputCls, textareaCls, todayKey } from "@/lib/form";
import { CATEGORIES, CATEGORY_ICON } from "@/lib/finance";
import { useAddTransactionMutation } from "@/store/api/transactionsApi";
import type { CategoryName, PaymentMethod, TransactionType } from "@/store/types";

const METHODS: PaymentMethod[] = ["UPI", "Credit Card", "Debit Card", "Cash", "Net Banking"];

export interface TransactionDraft {
  title?: string;
  merchant?: string;
  amount?: number;
  type?: TransactionType;
  category?: CategoryName;
  date?: string;
  notes?: string;
}

/** Compact add-transaction form, prefilled from a calendar day, a scanned bill or AI parsing. */
export function TransactionForm({ draft, onClose }: { draft?: TransactionDraft; onClose: () => void }) {
  const [type, setType] = useState<TransactionType>(draft?.type ?? "expense");
  const [title, setTitle] = useState(draft?.title ?? "");
  const [merchant, setMerchant] = useState(draft?.merchant ?? "");
  const [amount, setAmount] = useState(draft?.amount ? String(draft.amount) : "");
  const [category, setCategory] = useState<CategoryName>(draft?.category ?? "Food");
  const [method, setMethod] = useState<PaymentMethod>("UPI");
  const [date, setDate] = useState(draft?.date ?? todayKey());
  const [notes, setNotes] = useState(draft?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [add, { isLoading }] = useAddTransactionMutation();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const value = parseFloat(amount);
    if (!title.trim()) return setError("Add a short description.");
    if (!(value > 0)) return setError("Enter the amount.");
    try {
      await add({
        title: title.trim(),
        merchant: merchant.trim() || title.trim(),
        amount: value,
        type,
        category,
        paymentMethod: method,
        date,
        scope: "Personal",
        notes: notes.trim() || undefined,
      }).unwrap();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't save it."));
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Segmented
        label="Type"
        value={type}
        onChange={setType}
        options={[
          { value: "expense", label: "Expense" },
          { value: "income", label: "Income" },
        ]}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ModalField label="Description">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Groceries" className={inputCls} />
        </ModalField>
        <ModalField label="Amount (₹)">
          <input type="number" min="0.01" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
        </ModalField>
        <ModalField label="Merchant (optional)">
          <input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="e.g. DMart" className={inputCls} />
        </ModalField>
        <ModalField label="Date">
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </ModalField>
        <ModalField label="Category">
          <select value={category} onChange={(e) => setCategory(e.target.value as CategoryName)} className={inputCls}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_ICON[c]} {c}
              </option>
            ))}
          </select>
        </ModalField>
        <ModalField label="Paid with">
          <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className={inputCls}>
            {METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </ModalField>
      </div>
      <ModalField label="Notes (optional)">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={textareaCls} />
      </ModalField>
      {error && <p role="alert" className="rounded-[12px] border border-[color-mix(in_srgb,var(--bad)_30%,transparent)] bg-[color-mix(in_srgb,var(--bad)_8%,transparent)] px-3 py-2.5 text-[14px] font-semibold text-[var(--bad)]">{error}</p>}
      <ModalFooter onCancel={onClose} confirmLabel="Save" isSubmitting={isLoading} />
    </form>
  );
}
