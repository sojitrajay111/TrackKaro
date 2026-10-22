"use client";

import { useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorMessage, fmtINR, inputCls } from "@/lib/form";
import { useConfirmGroupExpenseMutation, useGetPendingGroupConfirmationsQuery } from "@/store/api/groupsApi";
import type { CategoryName, PendingGroupConfirmation } from "@/store/types";

const CATEGORIES: CategoryName[] = [
  "Food", "Shopping", "Groceries", "Bills", "Travel", "Fuel", "Entertainment",
  "Health", "Subscriptions", "Rent", "EMI", "Education", "Other",
];

function ConfirmCard({ item }: { item: PendingGroupConfirmation }) {
  const [category, setCategory] = useState<CategoryName>(item.suggestedCategory);
  const [confirm, { isLoading }] = useConfirmGroupExpenseMutation();
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    try {
      await confirm({ groupId: item.groupId, expenseId: item.expenseId, category }).unwrap();
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't add it to your expenses."));
    }
  };

  return (
    <li className="glass glass--card glass-specular rounded-[24px] p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted">{item.groupName}</p>
          <h3 className="font-display text-lg font-medium text-foreground truncate">{item.title}</h3>
          <p className="text-xs text-foreground-muted">
            {item.date} · Paid by {item.isPayer ? "you" : item.paidBy}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase text-foreground-muted">Your share</p>
          <b className="font-display text-xl text-foreground tabular-nums">{fmtINR(item.amount)}</b>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CategoryName)}
          className={inputCls}
          aria-label={`Category for ${item.title}`}
        >
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={submit}
          disabled={isLoading}
          className="h-9 shrink-0 rounded-full bg-primary px-5 text-xs font-bold text-white disabled:opacity-50 dark:text-emerald-950"
        >
          {isLoading ? "Adding…" : "Confirm & add to expenses"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </li>
  );
}

export default function GroupConfirmationsPage() {
  const { data: pending = [], isLoading } = useGetPendingGroupConfirmationsQuery();

  return (
    <div className="space-y-6 pb-16">
      <div>
        <Link href="/dashboard/groups" className="text-xs font-semibold text-foreground-muted hover:text-foreground">
          ← All groups
        </Link>
        <h1 className="mt-1 font-display font-normal text-[26px] sm:text-[32px] tracking-[-0.02em] text-foreground leading-tight">
          Confirm group expenses
        </h1>
        <p className="text-xs sm:text-sm text-foreground-muted">
          Your share of each group bill, ready to add to your own spending and budgets.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-40 rounded-[24px]" />
      ) : pending.length === 0 ? (
        <p className="glass glass--card rounded-[24px] px-4 py-12 text-center text-sm text-foreground-muted">
          All caught up. Nothing waiting for confirmation.
        </p>
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pending.map((p) => (
            <ConfirmCard key={`${p.groupId}-${p.expenseId}`} item={p} />
          ))}
        </ul>
      )}
    </div>
  );
}
