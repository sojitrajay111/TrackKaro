"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Segmented } from "@/components/ui/segmented";
import { fmtINR, inputCls } from "@/lib/form";
import { CATEGORY_ICON, daysUntil, dueLabel, shortDate } from "@/lib/finance";
import {
  useDeleteReminderMutation,
  useGetReminderStatsQuery,
  useGetRemindersQuery,
  useUpdateReminderMutation,
} from "@/store/api/remindersApi";
import type { BillReminder } from "@/store/types";
import { ReminderForm } from "@/components/planner/reminder-form";

type Tab = "pending" | "urgent" | "paid";
type Sort = "due" | "amount" | "title";

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function RemindersPage() {
  const { data: reminders = [], isLoading } = useGetRemindersQuery();
  const { data: stats } = useGetReminderStatsQuery();
  const [updateReminder] = useUpdateReminderMutation();
  const [deleteReminder, { isLoading: deleting }] = useDeleteReminderMutation();

  const [tab, setTab] = useState<Tab>("pending");
  const [sort, setSort] = useState<Sort>("due");
  const [form, setForm] = useState<{ open: boolean; reminder?: BillReminder }>({ open: false });
  const [toDelete, setToDelete] = useState<BillReminder | null>(null);

  const pending = useMemo(() => reminders.filter((r) => r.status === "pending"), [reminders]);
  const paid = useMemo(() => reminders.filter((r) => r.status === "paid"), [reminders]);
  const urgent = useMemo(() => pending.filter((r) => daysUntil(r.dueDate) <= 3), [pending]);
  const totalDue = pending.reduce((s, r) => s + r.amount, 0);
  const urgentAmount = urgent.reduce((s, r) => s + r.amount, 0);
  const monthlyEstimate = Math.round(
    reminders.reduce((s, r) => s + (r.frequency === "Yearly" ? r.amount / 12 : r.frequency === "Quarterly" ? r.amount / 3 : r.amount), 0)
  );
  const upcoming = [...pending].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 6);

  const list = useMemo(() => {
    const base = tab === "pending" ? pending : tab === "urgent" ? urgent : paid;
    return [...base].sort((a, b) =>
      sort === "amount" ? b.amount - a.amount : sort === "title" ? a.title.localeCompare(b.title) : a.dueDate.localeCompare(b.dueDate)
    );
  }, [tab, sort, pending, urgent, paid]);

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="font-display font-normal text-[26px] sm:text-[32px] lg:text-[38px] tracking-[-0.02em] text-foreground leading-tight mb-1.5">
            Bill reminders
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted">Rent, utilities, EMIs and anything else with a due date.</p>
        </div>
        <button
          type="button"
          onClick={() => setForm({ open: true })}
          className="h-10 self-start rounded-full bg-primary px-5 text-xs font-bold text-white hover:bg-primary-strong dark:text-emerald-950 lg:self-auto"
        >
          + Add reminder
        </button>
      </div>

      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total pending", value: fmtINR(totalDue) },
          { label: "Due in ≤ 3 days", value: String(urgent.length), alert: urgent.length > 0 },
          { label: "Monthly estimate", value: fmtINR(monthlyEstimate) },
          { label: "On-time score", value: stats?.onTimeRate == null ? "—" : `${stats.onTimeRate}%` },
        ].map((s) => (
          <div key={s.label} className="glass glass--card rounded-[22px] px-4 py-3.5">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">{s.label}</dt>
            <dd className={`mt-1 font-display text-2xl font-medium tabular-nums ${s.alert ? "text-[#DC2626] dark:text-red-400" : "text-foreground"}`}>
              {isLoading ? "…" : s.value}
            </dd>
          </div>
        ))}
      </dl>

      {!isLoading && (
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[22px] border px-5 py-4 ${
            urgent.length
              ? "border-red-500/25 bg-red-500/8"
              : "border-emerald-500/25 bg-emerald-500/8"
          }`}
        >
          <div>
            <b className="block text-sm text-foreground">{urgent.length ? "Pay these soon to avoid late fees" : "No late fees ahead"}</b>
            <small className="text-xs text-foreground-sub">
              {urgent.length
                ? `${urgent.length} bill${urgent.length > 1 ? "s" : ""} (${fmtINR(urgentAmount)}) due in the next 3 days or overdue.`
                : "Every pending bill is more than 3 days away."}
            </small>
          </div>
          {urgent.length > 0 && (
            <button type="button" onClick={() => setTab("urgent")} className="rounded-full bg-red-500/15 px-4 py-1.5 text-xs font-bold text-[#DC2626] dark:text-red-400">
              Review urgent
            </button>
          )}
        </div>
      )}

      {upcoming.length > 0 && (
        <section aria-label="Upcoming bills">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground-muted">Coming up</h2>
          <ul className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {upcoming.map((r) => (
              <li key={r.id} className="glass glass--card min-w-[180px] rounded-[20px] p-4">
                <span className="text-lg" aria-hidden="true">{CATEGORY_ICON[r.category] ?? "📄"}</span>
                <b className="mt-1 block truncate text-sm text-foreground">{r.title}</b>
                <span className="block font-display text-lg tabular-nums text-foreground">{fmtINR(r.amount)}</span>
                <small className={`text-[11px] font-semibold ${daysUntil(r.dueDate) <= 3 ? "text-[#DC2626] dark:text-red-400" : "text-foreground-muted"}`}>
                  {dueLabel(r.dueDate)}
                </small>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="glass glass--card rounded-[28px] p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Segmented
            label="Show"
            value={tab}
            onChange={setTab}
            options={[
              { value: "pending", label: `Pending (${pending.length})` },
              { value: "urgent", label: `Urgent (${urgent.length})` },
              { value: "paid", label: `Paid (${paid.length})` },
            ]}
          />
          <label className="flex items-center gap-2 text-xs text-foreground-muted">
            Sort
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={`${inputCls} w-36`}>
              <option value="due">Due date</option>
              <option value="amount">Amount</option>
              <option value="title">Name</option>
            </select>
          </label>
        </div>

        {isLoading ? (
          <Skeleton className="h-48" />
        ) : list.length === 0 ? (
          <p className="rounded-[18px] bg-surface-muted/40 px-4 py-10 text-center text-xs text-foreground-muted">
            {tab === "paid" ? "No paid bills yet." : tab === "urgent" ? "Nothing urgent." : "No pending bills. Add one to get reminded."}
          </p>
        ) : (
          <ul className="divide-y divide-border/50">
            {list.map((r) => {
              const isPaid = r.status === "paid";
              const days = daysUntil(r.dueDate);
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg" aria-hidden="true">
                    {CATEGORY_ICON[r.category] ?? "📄"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className={`block truncate text-sm font-semibold ${isPaid ? "text-foreground-muted line-through" : "text-foreground"}`}>{r.title}</b>
                    <small className="block text-[11px] text-foreground-muted">
                      {r.frequency} · due {shortDate(r.dueDate)}
                      {!isPaid && (
                        <span className={days <= 3 ? " font-semibold text-[#DC2626] dark:text-red-400" : ""}> · {dueLabel(r.dueDate)}</span>
                      )}
                    </small>
                  </span>
                  <b className="tabular-nums text-sm text-foreground">{fmtINR(r.amount)}</b>
                  <span className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateReminder({ id: r.id, patch: { status: isPaid ? "pending" : "paid" } })}
                      className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                        isPaid ? "bg-surface-muted text-foreground-sub" : "bg-emerald-500/12 text-[#059669] dark:text-emerald-400"
                      }`}
                    >
                      {isPaid ? "Mark pending" : "Mark paid"}
                    </button>
                    <button type="button" onClick={() => setForm({ open: true, reminder: r })} className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-foreground-sub hover:bg-surface-muted">
                      Edit
                    </button>
                    <button type="button" onClick={() => setToDelete(r)} className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-red-500 hover:bg-red-500/10">
                      Delete
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Modal
        isOpen={form.open}
        onClose={() => setForm({ open: false })}
        title={form.reminder ? "Edit bill reminder" : "Add bill reminder"}
        maxWidth="xl"
      >
        {form.open && <ReminderForm key={form.reminder?.id ?? "new"} reminder={form.reminder} onClose={() => setForm({ open: false })} />}
      </Modal>

      <Modal isOpen={Boolean(toDelete)} onClose={() => setToDelete(null)} title="Delete this reminder?" description={toDelete?.title} maxWidth="sm">
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setToDelete(null)} className="px-4 py-2 text-xs font-semibold text-foreground-muted">
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={async () => {
              if (toDelete) await deleteReminder(toDelete.id).unwrap().catch(() => {});
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
