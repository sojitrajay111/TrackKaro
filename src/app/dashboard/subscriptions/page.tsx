"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CategoryTile } from "@/components/ui/category-icon";
import { PageHeader, StatTile, btnPrimary } from "@/components/ui/page-header";
import { fmtINR } from "@/lib/form";
import { daysUntil, shortDate } from "@/lib/finance";
import { useDeleteSubscriptionMutation, useGetSubscriptionStatsQuery, useGetSubscriptionsQuery } from "@/store/api/subscriptionsApi";
import type { Subscription } from "@/store/types";
import { SubscriptionForm } from "@/components/planner/subscription-form";
import { Illustration } from "@/components/ui/illustration";

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
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sorted = useMemo(() => [...subs].sort((a, b) => a.nextBillingDate.localeCompare(b.nextBillingDate)), [subs]);
  const redundant = subs.filter((s) => s.isRedundant);
  const monthly = subs.reduce((s, x) => s + (x.billingCycle === "Yearly" ? x.amount / 12 : x.amount), 0);
  const yearly = subs.reduce((s, x) => s + (x.annualCost || (x.billingCycle === "Yearly" ? x.amount : x.amount * 12)), 0);
  const redundantYearly = redundant.reduce((s, x) => s + (x.annualCost || x.amount * 12), 0);
  const change = stats?.monthlyChangePercent;
  const nextUp = sorted.find((s) => daysUntil(s.nextBillingDate) >= 0);

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        section="Studio"
        title="Subscriptions"
        summary={
          subs.length ? (
            <>
              <strong className="font-bold text-foreground">{subs.length}</strong> active · <strong className="font-bold text-foreground num">{fmtINR(Math.round(monthly))}</strong> a month
              {nextUp && (
                <>
                  {" "}
                  · next: <strong className="font-bold text-foreground">{nextUp.name}</strong> {renewLabel(nextUp.nextBillingDate).toLowerCase()}
                </>
              )}
            </>
          ) : (
            "Track recurring services and cut the ones you don't use."
          )
        }
        actions={
          <button type="button" onClick={() => setForm({ open: true })} className={btnPrimary}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add subscription
          </button>
        }
      />

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile index={0} label="Active" value={isLoading ? "…" : subs.length} note={redundant.length ? `${redundant.length} to review` : "All in use"} />
        <StatTile
          index={1}
          label="Per month"
          value={isLoading ? "…" : fmtINR(Math.round(monthly))}
          note={change != null ? `${change > 0 ? "+" : ""}${change}% vs last month` : "Yearly plans spread out"}
          tone={change != null && change > 0 ? "warn" : undefined}
        />
        <StatTile index={2} label="Per year" value={isLoading ? "…" : fmtINR(Math.round(yearly))} />
        <StatTile index={3} label="Could save / yr" value={isLoading ? "…" : fmtINR(Math.round(redundantYearly))} tone={redundantYearly > 0 ? "good" : undefined} note="By cancelling flagged ones" />
      </dl>

      {redundant.length > 0 && (
        <section
          className="tk-pop rounded-[16px] border px-4 py-3"
          style={{ borderColor: "color-mix(in srgb, var(--amber) 40%, transparent)", background: "color-mix(in srgb, var(--amber) 9%, transparent)" }}
        >
          <p className="flex items-center gap-2 text-[15px] font-extrabold" style={{ color: "var(--warn)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3 2.5 20h19zM12 10v4.5M12 17.5h.01" />
            </svg>
            {redundant.length} subscription{redundant.length > 1 ? "s look" : " looks"} duplicate or unused
          </p>
          <ul className="mt-1.5 space-y-1 text-[14px] text-foreground">
            {redundant.map((s) => (
              <li key={s.id}>
                <b className="font-bold">{s.name}</b>
                {s.redundancyReason ? <span className="text-foreground-muted"> — {s.redundancyReason}</span> : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-[22px] border border-border bg-surface p-4 shadow-xs sm:p-5">
        <h2 className="mb-1 px-1 text-[17px] font-extrabold tracking-[-0.015em] text-foreground">Upcoming renewals</h2>
        <p className="mb-3 px-1 text-[14px] font-medium text-foreground-muted">Soonest first</p>
        {isLoading ? (
          <Skeleton className="h-48 rounded-[16px]" />
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-[16px] bg-[var(--surface-2)] px-4 py-8 text-center">
            <Illustration name="person-subscribing" height={110} />
            <p className="text-[15px] text-foreground-muted">No subscriptions yet. Add Netflix, Spotify, cloud storage and the like.</p>
          </div>
        ) : (
          <ul>
            {sorted.map((s, i) => {
              const days = daysUntil(s.nextBillingDate);
              return (
                <li key={s.id} className="tk-cal-agenda flex items-center gap-3 border-b border-border px-1 py-3 last:border-b-0" style={{ animationDelay: `${Math.min(i, 10) * 0.03}s` }}>
                  <CategoryTile name={s.category} size={40} />
                  <span className="min-w-0 flex-1">
                    <b className="flex min-w-0 items-center gap-2 text-[16px] font-bold text-foreground">
                      <span className="truncate">{s.name}</span>
                      {s.isRedundant && (
                        <span className="pill pill--amber shrink-0">
                          <i />
                          Review
                        </span>
                      )}
                    </b>
                    <small className="block truncate text-[14px] text-foreground-muted">
                      {s.category} · {shortDate(s.nextBillingDate)} ·{" "}
                      <span className={days >= 0 && days <= 3 ? "font-bold text-[var(--bad)]" : ""}>{renewLabel(s.nextBillingDate)}</span>
                    </small>
                  </span>
                  <span className="shrink-0 text-right">
                    <b className="block text-[16px] font-extrabold text-foreground num">{fmtINR(s.amount)}</b>
                    <small className="text-[13px] font-semibold text-foreground-muted">/{s.billingCycle === "Yearly" ? "year" : "month"}</small>
                  </span>
                  <span className="flex shrink-0 items-center gap-0.5">
                    <button type="button" onClick={() => setForm({ open: true, sub: s })} aria-label={`Edit ${s.name}`} title="Edit" className="inline-grid h-8 w-8 place-items-center rounded-[10px] text-foreground-muted transition hover:bg-[var(--surface-2)] hover:text-foreground">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setToDelete(s);
                      }}
                      aria-label={`Delete ${s.name}`}
                      title="Delete"
                      className="inline-grid h-8 w-8 place-items-center rounded-[10px] text-foreground-muted transition hover:bg-[color-mix(in_srgb,var(--rose)_14%,transparent)] hover:text-[var(--bad)]"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />
                      </svg>
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

      <ConfirmDialog
        isOpen={Boolean(toDelete)}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await remove(toDelete.id).unwrap();
            setToDelete(null);
          } catch {
            setDeleteError("Couldn't delete it. Try again.");
          }
        }}
        title="Delete this subscription?"
        description="It stops showing in your renewals and totals. This can't be undone."
        isWorking={deleting}
        error={deleteError}
      >
        {toDelete && (
          <div className="flex items-center gap-3 rounded-[16px] border border-border bg-[var(--surface-2)] p-3">
            <CategoryTile name={toDelete.category} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-extrabold text-foreground">{toDelete.name}</p>
              <p className="truncate text-[14px] text-foreground-muted">{renewLabel(toDelete.nextBillingDate)}</p>
            </div>
            <b className="shrink-0 text-[17px] font-extrabold text-foreground num">
              {fmtINR(toDelete.amount)}
              <small className="text-[13px] font-semibold text-foreground-muted">/{toDelete.billingCycle === "Yearly" ? "yr" : "mo"}</small>
            </b>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
