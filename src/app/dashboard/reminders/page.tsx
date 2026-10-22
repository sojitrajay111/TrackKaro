"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CategoryTile } from "@/components/ui/category-icon";
import { PageHeader, StatTile, btnPrimary, btnSmall } from "@/components/ui/page-header";
import { fmtINR } from "@/lib/form";
import { daysUntil, dueLabel, shortDate } from "@/lib/finance";
import {
  useDeleteReminderMutation,
  useGetReminderStatsQuery,
  useGetRemindersQuery,
  useUndoReminderPaymentMutation,
  useUpdateReminderMutation,
} from "@/store/api/remindersApi";
import type { BillReminder } from "@/store/types";
import { paidRows, type PaidRow } from "@/lib/reminders";
import { ReminderForm } from "@/components/planner/reminder-form";

type Tab = "pending" | "urgent" | "paid";
type Sort = "due" | "amount" | "title";
type Row = BillReminder & Partial<PaidRow>;

export default function RemindersPage() {
  const { data: reminders = [], isLoading } = useGetRemindersQuery();
  const { data: stats } = useGetReminderStatsQuery();
  const [updateReminder] = useUpdateReminderMutation();
  const [undoPayment] = useUndoReminderPaymentMutation();
  const [deleteReminder, { isLoading: deleting }] = useDeleteReminderMutation();

  const [tab, setTab] = useState<Tab>("pending");
  const [sort, setSort] = useState<Sort>("due");
  const [form, setForm] = useState<{ open: boolean; reminder?: BillReminder }>({ open: false });
  const [toDelete, setToDelete] = useState<BillReminder | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const pending = useMemo(() => reminders.filter((r) => r.status === "pending"), [reminders]);
  // Each settled period of a recurring bill, plus paid one-time bills.
  const paid = useMemo(() => paidRows(reminders), [reminders]);
  const urgent = useMemo(() => pending.filter((r) => daysUntil(r.dueDate) <= 3), [pending]);
  const totalDue = pending.reduce((s, r) => s + r.amount, 0);
  const urgentAmount = urgent.reduce((s, r) => s + r.amount, 0);
  const monthlyEstimate = Math.round(
    reminders.reduce((s, r) => s + (r.frequency === "Yearly" ? r.amount / 12 : r.frequency === "Quarterly" ? r.amount / 3 : r.amount), 0)
  );
  const upcoming = [...pending].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 6);

  const list = useMemo<Row[]>(() => {
    const base: Row[] = tab === "pending" ? pending : tab === "urgent" ? urgent : paid;
    return [...base].sort((a, b) =>
      sort === "amount" ? b.amount - a.amount : sort === "title" ? a.title.localeCompare(b.title) : tab === "paid" ? b.dueDate.localeCompare(a.dueDate) : a.dueDate.localeCompare(b.dueDate)
    );
  }, [tab, sort, pending, urgent, paid]);

  const tabs: [Tab, string, number][] = [
    ["pending", "Pending", pending.length],
    ["urgent", "Urgent", urgent.length],
    ["paid", "Paid", paid.length],
  ];

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        section="Studio"
        title="Bills"
        summary={
          pending.length ? (
            <>
              <strong className="font-bold text-foreground">{pending.length}</strong> unpaid · <strong className="font-bold text-foreground num">{fmtINR(totalDue)}</strong> due
              {urgent.length > 0 && (
                <>
                  {" "}
                  · <strong className="font-bold text-[var(--bad)]">{urgent.length} due within 3 days</strong>
                </>
              )}
            </>
          ) : (
            "Rent, utilities, EMIs and anything else with a due date."
          )
        }
        actions={
          <button type="button" onClick={() => setForm({ open: true })} className={btnPrimary}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add bill
          </button>
        }
      />

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile index={0} label="Total pending" value={isLoading ? "…" : fmtINR(totalDue)} note={`${pending.length} bills`} />
        <StatTile index={1} label="Due in ≤ 3 days" value={isLoading ? "…" : urgent.length} tone={urgent.length ? "bad" : undefined} note={urgent.length ? fmtINR(urgentAmount) : "Nothing urgent"} />
        <StatTile index={2} label="Monthly estimate" value={isLoading ? "…" : fmtINR(monthlyEstimate)} note="Yearly and quarterly spread out" />
        <StatTile index={3} label="On-time score" value={stats?.onTimeRate == null ? "—" : `${stats.onTimeRate}%`} tone={stats?.onTimeRate != null && stats.onTimeRate >= 80 ? "good" : undefined} note="Paid on or before the due date" />
      </dl>

      {!isLoading && pending.length > 0 && (
        <div
          role="status"
          className="tk-pop flex flex-col gap-3 rounded-[16px] border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          style={{
            borderColor: `color-mix(in srgb, ${urgent.length ? "var(--bad)" : "var(--good)"} 35%, transparent)`,
            background: `color-mix(in srgb, ${urgent.length ? "var(--bad)" : "var(--good)"} 8%, transparent)`,
          }}
        >
          <div className="flex items-start gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={urgent.length ? "var(--bad)" : "var(--good)"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden="true">
              <path d={urgent.length ? "M12 3 2.5 20h19zM12 10v4.5M12 17.5h.01" : "m5 12.5 4.5 4.5L19 7.5"} />
            </svg>
            <div>
              <p className="text-[15px] font-extrabold" style={{ color: urgent.length ? "var(--bad)" : "var(--good)" }}>
                {urgent.length ? "Pay these soon to avoid late fees" : "No late fees ahead"}
              </p>
              <p className="text-[14px] text-foreground">
                {urgent.length
                  ? `${urgent.length} bill${urgent.length > 1 ? "s" : ""} (${fmtINR(urgentAmount)}) due in the next 3 days or overdue.`
                  : "Every unpaid bill is more than 3 days away."}
              </p>
            </div>
          </div>
          {urgent.length > 0 && tab !== "urgent" && (
            <button type="button" onClick={() => setTab("urgent")} className={`${btnSmall} self-start border border-[color-mix(in_srgb,var(--bad)_35%,transparent)] text-[var(--bad)] hover:bg-[color-mix(in_srgb,var(--bad)_10%,transparent)] sm:self-auto`}>
              Review urgent
            </button>
          )}
        </div>
      )}

      {upcoming.length > 0 && (
        <section aria-label="Coming up">
          <h2 className="mb-2 text-[13px] font-extrabold uppercase tracking-[0.06em] text-foreground-muted">Coming up</h2>
          <ul className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {upcoming.map((r, i) => {
              const soon = daysUntil(r.dueDate) <= 3;
              return (
                <li key={r.id} className="tk-pop w-[190px] shrink-0 rounded-[18px] border border-border bg-surface p-4 shadow-xs" style={{ animationDelay: `${0.1 + i * 0.05}s` }}>
                  <CategoryTile name={r.category} size={34} />
                  <b className="mt-2 block truncate text-[15px] font-bold text-foreground">{r.title}</b>
                  <span className="block text-[20px] font-extrabold tracking-[-0.02em] text-foreground num">{fmtINR(r.amount)}</span>
                  <small className={`text-[13px] font-bold ${soon ? "text-[var(--bad)]" : "text-foreground-muted"}`}>{dueLabel(r.dueDate)}</small>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="rounded-[22px] border border-border bg-surface p-4 shadow-xs sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-[12px] bg-[var(--well)] p-[3px]" role="group" aria-label="Show">
            {tabs.map(([v, l, n]) => (
              <button
                key={v}
                type="button"
                onClick={() => setTab(v)}
                aria-pressed={tab === v}
                className={`rounded-[9px] px-3.5 py-1.5 text-[14px] font-bold transition ${tab === v ? "bg-[var(--raised)] text-foreground shadow-xs" : "text-foreground-muted hover:text-foreground"}`}
              >
                {l} <span className="opacity-60 num">{n}</span>
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-[14px] font-semibold text-foreground-muted">
            Sort
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-9 rounded-[10px] border border-border bg-surface px-2.5 text-[14px] font-bold text-foreground">
              <option value="due">Due date</option>
              <option value="amount">Amount</option>
              <option value="title">Name</option>
            </select>
          </label>
        </div>

        {isLoading ? (
          <Skeleton className="h-48 rounded-[16px]" />
        ) : list.length === 0 ? (
          <p className="rounded-[16px] bg-[var(--surface-2)] px-4 py-10 text-center text-[15px] text-foreground-muted">
            {tab === "paid" ? "No paid bills yet." : tab === "urgent" ? "Nothing urgent. 🎉" : "No unpaid bills. Add one to get reminded before it's due."}
          </p>
        ) : (
          <ul key={tab}>
            {list.map((r, i) => {
              const isPaid = r.status === "paid";
              const days = daysUntil(r.dueDate);
              // Edit/delete always act on the live reminder, not a past period's row.
              const live = reminders.find((x) => x.id === r.id) ?? r;
              const isHistory = isPaid && r.rowKey !== undefined && r.rowKey !== r.id;
              return (
                <li
                  key={r.rowKey ?? r.id}
                  className="tk-cal-agenda flex flex-wrap items-center gap-3 border-b border-border px-1 py-3 last:border-b-0 sm:flex-nowrap"
                  style={{ animationDelay: `${Math.min(i, 10) * 0.03}s` }}
                >
                  <CategoryTile name={r.category} size={40} />
                  <span className="min-w-0 flex-1">
                    <b className={`block truncate text-[16px] font-bold ${isPaid ? "text-foreground-muted line-through" : "text-foreground"}`}>{r.title}</b>
                    <small className="block truncate text-[14px] text-foreground-muted">
                      {r.frequency} · due {shortDate(r.dueDate)}
                      {isPaid && r.paidAt ? ` · paid ${shortDate(r.paidAt.slice(0, 10))}` : ""}
                      {!isPaid && live.payments?.length ? ` · last paid ${shortDate(live.payments[live.payments.length - 1].dueDate)}` : ""}
                    </small>
                  </span>
                  {!isPaid && (
                    <span className={`pill ${days < 0 ? "pill--bad" : days <= 3 ? "pill--amber" : "pill--faint"}`}>
                      <i />
                      {dueLabel(r.dueDate)}
                    </span>
                  )}
                  <b className="w-[92px] shrink-0 text-right text-[16px] font-extrabold text-foreground num">{fmtINR(r.amount)}</b>
                  <span className="flex shrink-0 items-center gap-1">
                    {/* Recurring bills roll to the next due date when paid; only the latest payment can be undone. */}
                    {!isPaid && (
                      <button
                        type="button"
                        onClick={() => updateReminder({ id: r.id, patch: { status: "paid" } })}
                        title={r.frequency !== "One-time" ? "Records this payment and moves the bill to its next due date" : undefined}
                        className={`${btnSmall} bg-[var(--good)] text-white hover:brightness-110`}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="m5 12.5 4.5 4.5L19 7.5" />
                        </svg>
                        Mark paid
                      </button>
                    )}
                    {isPaid && r.canUndo && (
                      <button type="button" onClick={() => undoPayment(r.id)} className={`${btnSmall} border border-border bg-surface text-foreground hover:bg-surface-muted`}>
                        Undo payment
                      </button>
                    )}
                    {!isHistory && (
                      <>
                        <button type="button" onClick={() => setForm({ open: true, reminder: live })} aria-label={`Edit ${r.title}`} title="Edit" className="inline-grid h-8 w-8 place-items-center rounded-[10px] text-foreground-muted transition hover:bg-[var(--surface-2)] hover:text-foreground">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(null);
                            setToDelete(live);
                          }}
                          aria-label={`Delete ${r.title}`}
                          title="Delete"
                          className="inline-grid h-8 w-8 place-items-center rounded-[10px] text-foreground-muted transition hover:bg-[color-mix(in_srgb,var(--rose)_14%,transparent)] hover:text-[var(--bad)]"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />
                          </svg>
                        </button>
                      </>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Modal isOpen={form.open} onClose={() => setForm({ open: false })} title={form.reminder ? "Edit bill" : "Add bill"} maxWidth="xl">
        {form.open && <ReminderForm key={form.reminder?.id ?? "new"} reminder={form.reminder} onClose={() => setForm({ open: false })} />}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(toDelete)}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await deleteReminder(toDelete.id).unwrap();
            setToDelete(null);
          } catch {
            setDeleteError("Couldn't delete it. Try again.");
          }
        }}
        title="Delete this bill?"
        description="Its reminders and payment history go with it. This can't be undone."
        isWorking={deleting}
        error={deleteError}
      >
        {toDelete && (
          <div className="flex items-center gap-3 rounded-[16px] border border-border bg-[var(--surface-2)] p-3">
            <CategoryTile name={toDelete.category} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-extrabold text-foreground">{toDelete.title}</p>
              <p className="truncate text-[14px] text-foreground-muted">
                {toDelete.frequency} · due {shortDate(toDelete.dueDate)}
              </p>
            </div>
            <b className="shrink-0 text-[17px] font-extrabold text-foreground num">{fmtINR(toDelete.amount)}</b>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
