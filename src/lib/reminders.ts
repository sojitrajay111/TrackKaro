import type { BillReminder } from "@/store/types";

/**
 * Recurring bills (mirrors the backend's RemindersService): marking a Monthly / Quarterly /
 * Yearly bill paid records the payment in `payments` and rolls the bill to its next due date,
 * pending again. These helpers expand that into rows for lists and the calendar.
 */

const PERIOD_MONTHS = { Monthly: 1, Quarterly: 3, Yearly: 12 } as const;

export const isRecurring = (r: Pick<BillReminder, "frequency">) => r.frequency !== "One-time";

const pad = (n: number) => String(n).padStart(2, "0");
const parse = (s: string) => {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return { y, m: m - 1, d };
};

/** Shift a YYYY-MM-DD by whole months, pinned to `anchorDay` and clamped to the month's length. */
export function addMonthsKey(s: string, months: number, anchorDay = parse(s).d): string {
  const { y, m } = parse(s);
  const total = m + months;
  const year = y + Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12;
  const dim = new Date(year, month + 1, 0).getDate();
  return `${year}-${pad(month + 1)}-${pad(Math.min(anchorDay, dim))}`;
}

const addDaysKey = (s: string, days: number) => {
  const { y, m, d } = parse(s);
  const dt = new Date(y, m, d + days);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
};
const daysBetween = (a: string, b: string) => {
  const pa = parse(a);
  const pb = parse(b);
  return Math.round((Date.UTC(pb.y, pb.m, pb.d) - Date.UTC(pa.y, pa.m, pa.d)) / 86_400_000);
};

const anchorOf = (r: BillReminder) => parse(r.payments?.[0]?.dueDate ?? r.dueDate).d;

/** What the server will return after marking `r` paid — used for an instant (optimistic) update. */
export function applyPaid(r: BillReminder): BillReminder {
  if (!isRecurring(r)) return { ...r, status: "paid" };
  const months = PERIOD_MONTHS[r.frequency as keyof typeof PERIOD_MONTHS];
  const lead = Math.max(0, daysBetween(r.reminderDate, r.dueDate));
  const next = addMonthsKey(r.dueDate, months, anchorOf(r));
  return {
    ...r,
    status: "pending",
    dueDate: next,
    reminderDate: addDaysKey(next, -lead),
    payments: [...(r.payments ?? []), { dueDate: r.dueDate.slice(0, 10), paidAt: new Date().toISOString(), amount: r.amount }],
  };
}

/** What the server will return after undoing the latest payment. */
export function applyUndo(r: BillReminder): BillReminder {
  if (r.status === "paid") return { ...r, status: "pending" };
  const payments = r.payments ?? [];
  const last = payments.at(-1);
  if (!last) return r;
  const lead = Math.max(0, daysBetween(r.reminderDate, r.dueDate));
  return { ...r, dueDate: last.dueDate, reminderDate: addDaysKey(last.dueDate, -lead), payments: payments.slice(0, -1) };
}

/** One settled occurrence, shaped like a reminder so lists can render it the same way. */
export type PaidRow = BillReminder & { rowKey: string; paidAt?: string; canUndo: boolean };

/** Every paid occurrence: recurring payment history plus paid one-time bills. Newest first. */
export function paidRows(reminders: BillReminder[]): PaidRow[] {
  const rows: PaidRow[] = [];
  for (const r of reminders) {
    const payments = r.payments ?? [];
    payments.forEach((p, i) =>
      rows.push({
        ...r,
        rowKey: `${r.id}:${p.dueDate}:${i}`,
        status: "paid",
        dueDate: p.dueDate,
        amount: p.amount,
        paidAt: p.paidAt,
        // Only the latest payment can be undone while the bill is still pending.
        canUndo: r.status === "pending" && i === payments.length - 1,
      })
    );
    if (r.status === "paid") rows.push({ ...r, rowKey: r.id, canUndo: true });
  }
  return rows.sort((a, b) => b.dueDate.localeCompare(a.dueDate));
}

/** Future repeats of a pending recurring bill after its current due date, up to `until` (display only). */
export function upcomingRepeats(r: BillReminder, until: string): string[] {
  if (!isRecurring(r) || r.status !== "pending") return [];
  const months = PERIOD_MONTHS[r.frequency as keyof typeof PERIOD_MONTHS];
  const anchor = anchorOf(r);
  const out: string[] = [];
  for (let k = 1; k <= 60; k++) {
    const d = addMonthsKey(r.dueDate, months * k, anchor);
    if (d > until) break;
    out.push(d);
  }
  return out;
}
