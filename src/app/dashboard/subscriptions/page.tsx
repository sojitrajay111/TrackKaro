"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtINR } from "@/lib/form";
import { daysUntil, shortDate } from "@/lib/finance";
import {
  useDeleteSubscriptionMutation,
  useGetSubscriptionStatsQuery,
  useGetSubscriptionsQuery,
} from "@/store/api/subscriptionsApi";
import type { Subscription } from "@/store/types";
import { SubscriptionForm } from "@/components/planner/subscription-form";

function renewLabel(date: string) {
  const n = daysUntil(date);
  if (n < 0) return `Renewed ${-n}d ago`;
  if (n === 0) return "Renews today";
  if (n === 1) return "Renews tomorrow";
  return `Renews in ${n}d`;
}

export default function SubscriptionsPage() {
  const { data: subs = [], isLoading } = useGetSubscriptionsQuery();
  const { data: stats } = useGetSubscriptionStatsQuery();
  const [remove, { isLoading: deleting }] = useDeleteSubscriptionMutation();
  const [form, setForm] = useState<{ open: boolean; sub?: Subscription }>({ open: false });
  const [toDelete, setToDelete] = useState<Subscription | null>(null);

  const sorted = useMemo(() => [...subs].sort((a, b) => a.nextBillingDate.localeCompare(b.nextBillingDate)), [subs]);
  const redundant = subs.filter((s) => s.isRedundant);
  const monthly = subs.reduce((s, x) => s + (x.billingCycle === "Yearly" ? x.amount / 12 : x.amount), 0);
  const yearly = subs.reduce((s, x) => s + (x.annualCost || (x.billingCycle === "Yearly" ? x.amount : x.amount * 12)), 0);
  const redundantYearly = redundant.reduce((s, x) => s + (x.annualCost || x.amount * 12), 0);
  const change = stats?.monthlyChangePercent;

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="font-display font-normal text-[26px] sm:text-[32px] lg:text-[38px] tracking-[-0.02em] text-foreground leading-tight mb-1.5">
            Subscriptions
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted">Track recurring services and cut the ones you don&apos;t use.</p>
        </div>
        <button
          type="button"
          onClick={() => setForm({ open: true })}
          className="h-10 self-start rounded-full bg-primary px-5 text-xs font-bold text-white hover:bg-primary-strong dark:text-emerald-950 lg:self-auto"
        >
          + Add subscription
        </button>
      </div>

      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Active", value: String(subs.length) },
          { label: "Per month", value: fmtINR(Math.round(monthly)), extra: change != null ? `${change > 0 ? "+" : ""}${change}% vs last month` : undefined },
          { label: "Per year", value: fmtINR(Math.round(yearly)) },
          { label: "Could save / yr", value: fmtINR(Math.round(redundantYearly)), good: redundantYearly > 0 },
        ].map((s) => (
          <div key={s.label} className="glass glass--card rounded-[22px] px-4 py-3.5">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">{s.label}</dt>
            <dd className={`mt-1 font-display text-2xl font-medium tabular-nums ${s.good ? "text-[#059669] dark:text-emerald-400" : "text-foreground"}`}>
              {isLoading ? "…" : s.value}
            </dd>
            {s.extra && <small className="text-[11px] text-foreground-muted">{s.extra}</small>}
          </div>
        ))}
      </dl>

      {redundant.length > 0 && (
        <section className="rounded-[22px] border border-amber-500/30 bg-amber-500/8 px-5 py-4">
          <b className="block text-sm text-foreground">AI found {redundant.length} subscription{redundant.length > 1 ? "s" : ""} that look duplicate or unused</b>
          <ul className="mt-2 space-y-1 text-xs text-foreground-sub">
            {redundant.map((s) => (
              <li key={s.id}>
                <b>
                  {s.icon} {s.name}
                </b>
                {s.redundancyReason ? `: ${s.redundancyReason}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="glass glass--card rounded-[28px] p-5 sm:p-6">
        {isLoading ? (
          <Skeleton className="h-48" />
        ) : sorted.length === 0 ? (
          <p className="rounded-[18px] bg-surface-muted/40 px-4 py-10 text-center text-xs text-foreground-muted">
            No subscriptions yet. Add Netflix, Spotify, cloud storage and the like.
          </p>
        ) : (
          <ul className="divide-y divide-border/50">
            {sorted.map((s) => {
              const days = daysUntil(s.nextBillingDate);
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg" aria-hidden="true">
                    {s.icon || "🔄"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-sm font-semibold text-foreground">
                      {s.name}
                      {s.isRedundant && <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">Review</span>}
                    </b>
                    <small className="block text-[11px] text-foreground-muted">
                      {s.category} · {shortDate(s.nextBillingDate)} ·{" "}
                      <span className={days >= 0 && days <= 3 ? "font-semibold text-[#DC2626] dark:text-red-400" : ""}>{renewLabel(s.nextBillingDate)}</span>
                    </small>
                  </span>
                  <span className="text-right">
                    <b className="block tabular-nums text-sm text-foreground">{fmtINR(s.amount)}</b>
                    <small className="text-[10px] text-foreground-muted">/{s.billingCycle === "Yearly" ? "yr" : "mo"}</small>
                  </span>
                  <span className="flex items-center gap-1">
                    <button type="button" onClick={() => setForm({ open: true, sub: s })} className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-foreground-sub hover:bg-surface-muted">
                      Edit
                    </button>
                    <button type="button" onClick={() => setToDelete(s)} className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-red-500 hover:bg-red-500/10">
                      Delete
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Modal isOpen={form.open} onClose={() => setForm({ open: false })} title={form.sub ? "Edit subscription" : "Add subscription"} maxWidth="lg">
        {form.open && <SubscriptionForm key={form.sub?.id ?? "new"} sub={form.sub} onClose={() => setForm({ open: false })} />}
      </Modal>

      <Modal isOpen={Boolean(toDelete)} onClose={() => setToDelete(null)} title="Delete this subscription?" description={toDelete?.name} maxWidth="sm">
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setToDelete(null)} className="px-4 py-2 text-xs font-semibold text-foreground-muted">
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={async () => {
              if (toDelete) await remove(toDelete.id).unwrap().catch(() => {});
              setToDelete(null);
            }}
            className="rounded-full bg-red-600 px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
