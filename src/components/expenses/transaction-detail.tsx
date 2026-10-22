"use client";

import { useState } from "react";
import { useCountUp } from "@/components/ui/drawer";
import { CategoryTile } from "@/components/ui/category-icon";
import { CATEGORIES } from "@/lib/finance";
import { useUpdateTransactionMutation } from "@/store/api/transactionsApi";
import type { CategoryName, PaymentMethod, Transaction, TransactionScope } from "@/store/types";

const METHODS: PaymentMethod[] = ["UPI", "Credit Card", "Debit Card", "Cash", "Net Banking"];
const SCOPES: TransactionScope[] = ["Personal", "Work", "Family"];

const inr = (v: number) => `₹${Math.abs(v).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

function longDate(date: string) {
  const [y, m, d] = (date || "").slice(0, 10).split("-").map(Number);
  if (!y) return date;
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/**
 * Body of the transaction drawer: header, big amount (counts up), detail rows where
 * category / payment method / scope save on change, and a note that saves on blur.
 */
export function TransactionDetail({
  tx,
  onUpdated,
}: {
  tx: Transaction;
  onUpdated: (tx: Transaction) => void;
}) {
  const [update] = useUpdateTransactionMutation();
  const [note, setNote] = useState(tx.notes ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const isIncome = tx.type === "income";
  const counted = useCountUp(tx.amount, tx.id);

  const save = async (data: Partial<Omit<Transaction, "id">>, label: string) => {
    setStatus("Saving…");
    try {
      const updated = await update({ id: tx.id, data }).unwrap();
      onUpdated(updated);
      setStatus(`Saved · ${label}`);
    } catch {
      setStatus("Couldn't save. Try again.");
    }
    setTimeout(() => setStatus(null), 2200);
  };

  return (
    <>
      <div className="flex items-start gap-3.5 pr-12">
        <CategoryTile name={tx.category} size={44} />
        <div className="min-w-0">
          <p className="text-[14px] font-[650] text-foreground-muted">{longDate(tx.date)}</p>
          <h2 className="text-[24px] font-extrabold tracking-[-0.03em] leading-tight text-foreground break-words">{tx.title}</h2>
        </div>
      </div>

      <div className="d-big">
        <small>{isIncome ? "Received" : "Paid"}</small>
        <b className={`num ${isIncome ? "up" : ""}`}>
          {isIncome ? "+" : "−"}
          {inr(Math.round(counted * 100) / 100)}
        </b>
        <small>
          via {tx.paymentMethod || "—"}
          {tx.scope ? ` · ${tx.scope}` : ""}
        </small>
      </div>

      <div className="d-rows">
        <div className="d-row">
          <span>{isIncome ? "From" : "Paid to"}</span>
          <span className="truncate">{tx.merchant || "—"}</span>
        </div>
        <label className="d-row">
          <span>Category</span>
          <select
            value={tx.category}
            onChange={(e) => save({ category: e.target.value as CategoryName }, e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="d-row">
          <span>Paid with</span>
          <select
            value={tx.paymentMethod || "UPI"}
            onChange={(e) => save({ paymentMethod: e.target.value as PaymentMethod }, e.target.value)}
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="d-row">
          <span>Scope</span>
          <select
            value={tx.scope || "Personal"}
            onChange={(e) => save({ scope: e.target.value as TransactionScope }, e.target.value)}
          >
            {SCOPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-1.5">
        <span className="text-[14px] font-bold text-foreground-muted">Note</span>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => {
            if ((tx.notes ?? "") !== note.trim()) save({ notes: note.trim() || undefined }, "note");
          }}
          placeholder="Anything worth remembering about this payment"
          className="min-h-[44px] w-full rounded-[12px] border border-[var(--line-2)] bg-surface px-[13px] py-2.5 text-[15px] text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-foreground"
        />
      </label>

      <p role="status" aria-live="polite" className="min-h-[1.25rem] text-[13px] font-bold text-foreground-muted">
        {status}
      </p>
    </>
  );
}
