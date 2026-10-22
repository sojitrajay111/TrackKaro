"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { Modal } from "@/components/ui/modal";
import { ReminderForm } from "@/components/planner/reminder-form";
import { SubscriptionForm } from "@/components/planner/subscription-form";
import { TaskForm } from "@/components/planner/task-form";
import { TransactionForm } from "@/components/planner/transaction-form";
import { fmtINR, todayKey } from "@/lib/form";
import { useGetTransactionsQuery } from "@/store/api/transactionsApi";
import { useGetTasksQuery, useUpdateTaskMutation } from "@/store/api/tasksApi";
import { useGetRemindersQuery, useUndoReminderPaymentMutation, useUpdateReminderMutation } from "@/store/api/remindersApi";
import { paidRows, upcomingRepeats } from "@/lib/reminders";
import { useGetSubscriptionsQuery } from "@/store/api/subscriptionsApi";
import type { BillReminder, PlannerTask, Subscription } from "@/store/types";

type Kind = "spend" | "task" | "bill" | "sub";
type Filter = "all" | Kind;

interface CalEvent {
  id: string;
  kind: Kind;
  date: string;
  title: string;
  amount?: number;
  done?: boolean;
  income?: boolean;
  /** Bills: a future repeat of a recurring bill (display only, not yet its due date). */
  upcoming?: boolean;
  /** Bills: this paid occurrence is the latest payment, so it can be undone. */
  canUndo?: boolean;
  task?: PlannerTask;
  bill?: BillReminder;
  sub?: Subscription;
}

/** Colour + line icon per item type (Kesta tokens, so they read in light and dark). */
const KIND_META: Record<Kind, { label: string; one: string; color: string; icon: string }> = {
  spend: { label: "Spending", one: "Payment", color: "var(--pine)", icon: "M4 7.5h16v11H4zM4 11h16M15.5 15h2" },
  task: { label: "Tasks", one: "Task", color: "var(--violet)", icon: "M5 5h14v14H5zM8.5 12l2.5 2.5 4.5-5" },
  bill: { label: "Bills", one: "Bill", color: "var(--amber)", icon: "M7 3h10a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1zM9 8h6M9 12h6" },
  sub: {
    label: "Subscriptions",
    one: "Renewal",
    color: "var(--rose)",
    icon: "M20 12a8 8 0 0 1-14.3 4.9M4 12a8 8 0 0 1 14.3-4.9M18 3v4.5h-4.5M6 21v-4.5h4.5",
  },
};
const KINDS: Kind[] = ["spend", "bill", "sub", "task"];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const pad = (n: number) => String(n).padStart(2, "0");
const key = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

type AddKind = "spend" | "task" | "bill" | "sub";

function KindIcon({ kind, size = 36 }: { kind: Kind; size?: number }) {
  const meta = KIND_META[kind];
  return (
    <span
      className="inline-grid shrink-0 place-items-center"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background: `color-mix(in srgb, ${meta.color} 15%, transparent)`,
        color: meta.color,
      }}
      aria-hidden="true"
    >
      <svg width={size * 0.48} height={size * 0.48} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={meta.icon} />
      </svg>
    </span>
  );
}

export default function CalendarPage() {
  const now = new Date();
  const [month, setMonth] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelected] = useState(todayKey());
  const [filter, setFilter] = useState<Filter>("all");
  const [adding, setAdding] = useState<AddKind | "pick" | null>(null);
  const [editTask, setEditTask] = useState<PlannerTask | null>(null);
  const [editBill, setEditBill] = useState<BillReminder | null>(null);
  const [editSub, setEditSub] = useState<Subscription | null>(null);
  // Which way the month grid slides when it changes.
  const [slide, setSlide] = useState<"next" | "prev" | null>(null);

  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const from = useMemo(() => key(month.y, month.m, 1), [month.y, month.m]);
  const to = useMemo(() => key(month.y, month.m, daysInMonth), [month.y, month.m, daysInMonth]);

  const { data: transactions = [] } = useGetTransactionsQuery();
  const { data: tasks = [] } = useGetTasksQuery({ from, to });
  const { data: bills = [] } = useGetRemindersQuery();
  const [updateReminder] = useUpdateReminderMutation();
  const [undoPayment] = useUndoReminderPaymentMutation();
  const { data: subs = [] } = useGetSubscriptionsQuery();
  const [updateTask] = useUpdateTaskMutation();

  const events = useMemo(() => {
    const list: CalEvent[] = [];
    const inMonth = (d: string) => d >= from && d <= to;
    for (const t of transactions) {
      if (inMonth(t.date)) list.push({ id: `t-${t.id}`, kind: "spend", date: t.date, title: t.title, amount: t.amount, income: t.type === "income" });
    }
    for (const t of tasks) {
      const d = t.dueDate.slice(0, 10);
      if (inMonth(d)) list.push({ id: `k-${t.id}`, kind: "task", date: d, title: t.title, done: t.status === "done", task: t });
    }
    // Bills: the current due date (unpaid), each settled period (paid), and later repeats.
    for (const b of bills) {
      const d = b.dueDate.slice(0, 10);
      if (b.status === "pending" && inMonth(d)) list.push({ id: `b-${b.id}`, kind: "bill", date: d, title: b.title, amount: b.amount, bill: b });
      for (const day of upcomingRepeats(b, to)) {
        if (inMonth(day)) list.push({ id: `b-${b.id}-${day}`, kind: "bill", date: day, title: b.title, amount: b.amount, bill: b, upcoming: true });
      }
    }
    for (const p of paidRows(bills)) {
      if (inMonth(p.dueDate)) list.push({ id: `b-${p.rowKey}`, kind: "bill", date: p.dueDate, title: p.title, amount: p.amount, done: true, canUndo: p.canUndo, bill: p });
    }
    for (const s of subs) {
      const d = s.nextBillingDate.slice(0, 10);
      if (inMonth(d)) list.push({ id: `s-${s.id}`, kind: "sub", date: d, title: s.name, amount: s.amount, sub: s });
    }
    return list;
  }, [transactions, tasks, bills, subs, from, to]);

  // Month totals for the tiles (always across every item type).
  const totals = useMemo(() => {
    const t = { spent: 0, income: 0, billsDue: 0, billsDueAmt: 0, renewals: 0, renewalsAmt: 0, openTasks: 0 };
    const counts: Record<Kind, number> = { spend: 0, task: 0, bill: 0, sub: 0 };
    for (const e of events) {
      counts[e.kind]++;
      if (e.kind === "spend") {
        if (e.income) t.income += e.amount ?? 0;
        else t.spent += e.amount ?? 0;
      } else if (e.kind === "bill" && !e.done && !e.upcoming) {
        t.billsDue++;
        t.billsDueAmt += e.amount ?? 0;
      } else if (e.kind === "sub") {
        t.renewals++;
        t.renewalsAmt += e.amount ?? 0;
      } else if (e.kind === "task" && !e.done) {
        t.openTasks++;
      }
    }
    return { ...t, counts };
  }, [events]);

  const visible = filter === "all" ? events : events.filter((e) => e.kind === filter);
  const byDay = useMemo(() => {
    const m = new Map<string, CalEvent[]>();
    for (const e of visible) m.set(e.date, [...(m.get(e.date) ?? []), e]);
    return m;
  }, [visible]);

  const firstWeekday = (new Date(month.y, month.m, 1).getDay() + 6) % 7; // Monday first
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  const today = todayKey();
  const dayEvents = byDay.get(selected) ?? [];
  const daySpent = dayEvents.filter((e) => e.kind === "spend" && !e.income).reduce((s, e) => s + (e.amount ?? 0), 0);
  const dayIncome = dayEvents.filter((e) => e.kind === "spend" && e.income).reduce((s, e) => s + (e.amount ?? 0), 0);
  const monthLabel = new Date(month.y, month.m, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const monthShort = new Date(month.y, month.m, 1).toLocaleDateString("en-IN", { month: "long" });
  const selectedLabel = new Date(selected + "T00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const isCurrentMonth = month.y === now.getFullYear() && month.m === now.getMonth();

  const shiftMonth = (delta: number) => {
    setSlide(delta > 0 ? "next" : "prev");
    setMonth(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };
  const goToday = () => {
    if (!isCurrentMonth) setSlide(month.y * 12 + month.m < now.getFullYear() * 12 + now.getMonth() ? "next" : "prev");
    setMonth({ y: now.getFullYear(), m: now.getMonth() });
    setSelected(today);
  };

  const startAdd = () => setAdding(filter === "all" ? "pick" : filter);
  const close = () => setAdding(null);
  const openEvent = (e: CalEvent) => {
    if (e.task) setEditTask(e.task);
    // Paid/upcoming rows carry that period's date; always edit the live reminder.
    if (e.bill) setEditBill(bills.find((b) => b.id === e.bill?.id) ?? e.bill);
    if (e.sub) setEditSub(e.sub);
  };

  const btnGhost =
    "inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-border bg-surface px-[18px] text-[16px] font-bold text-foreground shadow-xs transition hover:bg-surface-muted active:brightness-[0.93]";
  const btnDark =
    "inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[#161614] px-[18px] text-[16px] font-bold text-white shadow-xs transition hover:bg-black active:brightness-[0.93] dark:bg-[#f0c35a] dark:text-[#161614] dark:hover:bg-[#e0b445]";
  const card = "rounded-[22px] border border-border bg-surface p-5 shadow-xs";
  const tile = "min-w-0 rounded-[16px] border border-border bg-surface px-4 py-3";
  const chipCls = (on: boolean) =>
    `inline-flex h-[34px] shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-[13px] text-[14px] font-bold transition ${
      on ? "border-transparent bg-foreground text-background" : "border-border bg-surface text-foreground hover:border-[var(--line-2)]"
    }`;

  // Agenda groups in a fixed order.
  const agendaGroups = KINDS.map((k) => ({ kind: k, items: dayEvents.filter((e) => e.kind === k) })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[14px] font-[650] text-foreground-muted">
            <span>Money</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9.5 6 6 6-6 6" />
            </svg>
            <span className="text-foreground">Bills &amp; Calendar</span>
          </nav>
          <h1 className="text-[30px] lg:text-[clamp(1.875rem,2.5vw,2.375rem)] font-extrabold tracking-[-0.04em] leading-[1.08] text-foreground">Calendar</h1>
          <p className="text-[16px] font-medium text-foreground-muted">
            {monthShort}: <b className="font-bold text-foreground">{fmtINR(totals.spent)}</b> spent ·{" "}
            <b className="font-bold text-foreground">{totals.billsDue}</b> {totals.billsDue === 1 ? "bill" : "bills"} due ·{" "}
            <b className="font-bold text-foreground">{totals.openTasks}</b> open {totals.openTasks === 1 ? "task" : "tasks"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button type="button" onClick={goToday} className={btnGhost}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" />
              <path d="M3.5 10h17M8 3v4M16 3v4" />
              <circle cx="12" cy="15" r="1.4" fill="currentColor" stroke="none" />
            </svg>
            Today
          </button>
          <button type="button" onClick={startAdd} className={btnDark}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add
          </button>
        </div>
      </header>

      {/* Month tiles */}
      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={tile}>
          <dt className="text-[14px] font-bold text-foreground-muted">Spent in {monthShort}</dt>
          <dd className="truncate text-[20px] lg:text-[24px] font-extrabold tracking-[-0.035em] num text-foreground">{fmtINR(totals.spent)}</dd>
          {totals.income > 0 && <small className="text-[13px] font-semibold text-[var(--good)]">+{fmtINR(totals.income)} in</small>}
        </div>
        <div className={tile}>
          <dt className="text-[14px] font-bold text-foreground-muted">Bills due</dt>
          <dd className="truncate text-[20px] lg:text-[24px] font-extrabold tracking-[-0.035em] num text-foreground">{totals.billsDue}</dd>
          <small className="text-[13px] font-semibold text-foreground-muted">{fmtINR(totals.billsDueAmt)} unpaid</small>
        </div>
        <div className={tile}>
          <dt className="text-[14px] font-bold text-foreground-muted">Renewals</dt>
          <dd className="truncate text-[20px] lg:text-[24px] font-extrabold tracking-[-0.035em] num text-foreground">{totals.renewals}</dd>
          <small className="text-[13px] font-semibold text-foreground-muted">{fmtINR(totals.renewalsAmt)} this month</small>
        </div>
        <div className={tile}>
          <dt className="text-[14px] font-bold text-foreground-muted">Open tasks</dt>
          <dd className="truncate text-[20px] lg:text-[24px] font-extrabold tracking-[-0.035em] num text-foreground">{totals.openTasks}</dd>
          <small className="text-[13px] font-semibold text-foreground-muted">{totals.counts.task - totals.openTasks} done</small>
        </div>
      </dl>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar" role="group" aria-label="Show">
        <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")} className={chipCls(filter === "all")}>
          Everything <span className="opacity-70 num">{events.length}</span>
        </button>
        {KINDS.map((k) => (
          <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)} className={chipCls(filter === k)}>
            <i className="h-2 w-2 rounded-full" style={{ background: KIND_META[k].color }} aria-hidden="true" />
            {KIND_META[k].label} <span className="opacity-70 num">{totals.counts[k]}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-4 items-start">
        {/* Month grid */}
        <section className={`${card} !p-3 sm:!p-5 overflow-hidden`} aria-label={monthLabel}>
          <div className="mb-3 flex items-center justify-between gap-2 px-1">
            <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-foreground">{monthLabel}</h2>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                aria-label="Previous month"
                className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-border bg-surface text-foreground transition hover:bg-surface-muted"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m14.5 6-6 6 6 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label="Next month"
                className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-border bg-surface text-foreground transition hover:bg-surface-muted"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m9.5 6 6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 pb-1.5 text-center text-[12px] sm:text-[13px] font-extrabold uppercase tracking-[0.06em] text-foreground-muted">
            {WEEKDAYS.map((d, i) => (
              <div key={d} className={i >= 5 ? "opacity-70" : ""}>
                <span className="sm:hidden">{d[0]}</span>
                <span className="hidden sm:inline">{d}</span>
              </div>
            ))}
          </div>

          {/* Re-keyed per month so the slide replays */}
          <div
            key={from}
            className={`grid grid-cols-7 gap-1 sm:gap-1.5 ${slide === "next" ? "tk-cal-next" : slide === "prev" ? "tk-cal-prev" : ""}`}
            role="grid"
            aria-label={monthLabel}
          >
            {cells.map((d, i) => {
              if (d === null) return <div key={`e${i}`} className="hidden sm:block rounded-[12px] bg-[var(--surface-2)] opacity-40" aria-hidden="true" />;
              const k = key(month.y, month.m, d);
              const items = byDay.get(k) ?? [];
              const isSel = k === selected;
              const isToday = k === today;
              const spent = items.filter((e) => e.kind === "spend" && !e.income).reduce((s, e) => s + (e.amount ?? 0), 0);
              const shown = items.slice(0, 2);
              const more = items.length - shown.length;
              const weekend = i % 7 >= 5;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSelected(k)}
                  aria-pressed={isSel}
                  aria-label={`${new Date(k + "T00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}, ${items.length} item${items.length === 1 ? "" : "s"}`}
                  className={`group relative flex min-h-[52px] sm:min-h-[104px] flex-col items-stretch gap-1 rounded-[12px] border p-1.5 sm:p-2 text-left transition ${
                    isSel
                      ? "border-transparent bg-foreground text-background shadow-[var(--shadow-pop)]"
                      : `border-border hover:border-[var(--line-2)] ${weekend ? "bg-[var(--surface-2)]" : "bg-surface"} text-foreground`
                  }`}
                >
                  <span className="flex items-center justify-between">
                    <span
                      className={`inline-grid h-6 min-w-6 place-items-center rounded-full px-1 text-[13px] sm:text-[14px] font-extrabold num ${
                        isToday && !isSel ? "bg-[var(--accent)] text-[#1f1606]" : ""
                      }`}
                    >
                      {d}
                    </span>
                    {spent > 0 && (
                      <span className={`hidden sm:inline text-[12px] font-bold num ${isSel ? "opacity-80" : "text-foreground-muted"}`}>
                        {fmtINR(Math.round(spent))}
                      </span>
                    )}
                  </span>

                  {/* Desktop: first two items as labels */}
                  <span className="hidden sm:grid gap-1">
                    {shown.map((e) => (
                      <span
                        key={e.id}
                        className={`flex min-w-0 items-center gap-1.5 rounded-[7px] px-1.5 py-[3px] text-[12px] font-bold leading-tight ${e.done ? "line-through opacity-60" : e.upcoming ? "opacity-55" : ""}`}
                        style={{
                          background: isSel ? "color-mix(in srgb, var(--bg) 18%, transparent)" : `color-mix(in srgb, ${KIND_META[e.kind].color} 14%, transparent)`,
                        }}
                      >
                        <i className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: KIND_META[e.kind].color }} aria-hidden="true" />
                        <span className="truncate">{e.title}</span>
                      </span>
                    ))}
                    {more > 0 && <span className={`px-1 text-[12px] font-bold ${isSel ? "opacity-80" : "text-foreground-muted"}`}>+{more} more</span>}
                  </span>

                  {/* Phone: dots only */}
                  <span className="flex flex-wrap justify-center gap-0.5 sm:hidden">
                    {[...new Set(items.map((e) => e.kind))].map((kd) => (
                      <i key={kd} className="h-1.5 w-1.5 rounded-full" style={{ background: KIND_META[kd].color }} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Day agenda */}
        <section className={`${card} lg:sticky lg:top-24`} aria-live="polite">
          <header className="mb-1 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-foreground-muted">{selected === today ? "Today" : "Selected day"}</p>
              <h2 className="text-[20px] font-extrabold tracking-[-0.02em] leading-tight text-foreground">{selectedLabel}</h2>
              {(daySpent > 0 || dayIncome > 0) && (
                <p className="mt-0.5 text-[14px] font-semibold text-foreground-muted">
                  {daySpent > 0 && <>{fmtINR(daySpent)} spent</>}
                  {daySpent > 0 && dayIncome > 0 && " · "}
                  {dayIncome > 0 && <span className="text-[var(--good)]">+{fmtINR(dayIncome)} in</span>}
                </p>
              )}
            </div>
            <span className="pill pill--faint shrink-0">
              <i />
              {dayEvents.length} {dayEvents.length === 1 ? "item" : "items"}
            </span>
          </header>

          {dayEvents.length === 0 ? (
            <div className="my-3 flex flex-col items-center gap-1.5 rounded-[16px] bg-[var(--surface-2)] px-4 py-8 text-center">
              <svg className="text-foreground-muted" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" />
                <path d="M3.5 10h17M8 3v4M16 3v4" />
              </svg>
              <p className="font-bold text-foreground">Nothing planned</p>
              <p className="text-[14px] text-foreground-muted">Add a payment, bill, renewal or task for this day.</p>
            </div>
          ) : (
            <div key={selected} className="tk-cal-agenda mt-2 grid gap-3">
              {agendaGroups.map((g) => (
                <div key={g.kind}>
                  <p className="mb-0.5 flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-[0.06em] text-foreground-muted">
                    <i className="h-2 w-2 rounded-full" style={{ background: KIND_META[g.kind].color }} aria-hidden="true" />
                    {KIND_META[g.kind].label}
                  </p>
                  <div className="grid">
                    {g.items.map((e) => (
                      <div key={e.id} className="flex items-center gap-3 border-b border-border px-0.5 py-2.5 last:border-b-0">
                        {e.kind === "task" || (e.kind === "bill" && !e.upcoming) ? (
                          // Tasks: done / to do. Bills: paid / unpaid; only the latest payment can be undone.
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={Boolean(e.done)}
                            aria-label={e.kind === "bill" ? `Paid: ${e.title}` : `Done: ${e.title}`}
                            disabled={e.kind === "bill" && e.done && !e.canUndo}
                            title={
                              e.kind === "bill"
                                ? e.done
                                  ? e.canUndo
                                    ? "Mark unpaid"
                                    : "Only the latest payment can be undone"
                                  : e.bill?.frequency === "One-time"
                                    ? "Mark paid"
                                    : "Mark paid (moves to the next due date)"
                                : e.done
                                  ? "Mark to do"
                                  : "Mark done"
                            }
                            onClick={() => {
                              if (e.task) updateTask({ id: e.task.id, patch: { status: e.done ? "todo" : "done" } });
                              if (e.bill) {
                                if (e.done) undoPayment(e.bill.id);
                                else updateReminder({ id: e.bill.id, patch: { status: "paid" } });
                              }
                            }}
                            className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-[11px] border-2 transition disabled:cursor-not-allowed disabled:opacity-60"
                            style={
                              e.done
                                ? { background: KIND_META[e.kind].color, borderColor: "transparent", color: "#fff" }
                                : { borderColor: "var(--line-2)", color: "transparent" }
                            }
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="m5 12.5 4.5 4.5L19 7.5" />
                            </svg>
                          </button>
                        ) : (
                          <KindIcon kind={e.kind} />
                        )}
                        <button
                          type="button"
                          disabled={e.kind === "spend"}
                          onClick={() => openEvent(e)}
                          className="min-w-0 flex-1 rounded-[8px] text-left disabled:cursor-default enabled:hover:opacity-80"
                        >
                          <b className={`block truncate font-bold ${e.done ? "text-foreground-muted line-through" : "text-foreground"}`}>{e.title}</b>
                          <small className="block truncate text-[14px] text-foreground-muted">
                            {e.kind === "spend" ? (e.income ? "Money in" : "Money out") : KIND_META[e.kind].one}
                            {e.kind === "bill" ? (e.done ? " · paid" : e.upcoming ? ` · repeats ${e.bill?.frequency.toLowerCase()}` : " · unpaid") : ""}
                            {e.kind !== "spend" ? " · tap to edit" : ""}
                          </small>
                        </button>
                        {e.amount != null && (
                          <b className={`shrink-0 font-extrabold num ${e.income ? "text-[var(--good)]" : "text-foreground"}`}>
                            {e.income ? "+" : ""}
                            {fmtINR(e.amount)}
                          </b>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button type="button" onClick={startAdd} className={`${btnDark} mt-3 w-full`}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add to this day
          </button>
        </section>
      </div>

      <Modal isOpen={adding === "pick"} onClose={close} title="Add to this day" description={selectedLabel} maxWidth="md">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {(
            [
              ["spend", "Payment", "Money out or money in"],
              ["bill", "Bill reminder", "Due date and an alert"],
              ["sub", "Subscription", "A recurring renewal"],
              ["task", "Task", "A to-do with a due date"],
            ] as const
          ).map(([k, label, sub], i) => (
            <button
              key={k}
              type="button"
              onClick={() => setAdding(k)}
              style={{ animationDelay: `${0.05 + i * 0.04}s` } as CSSProperties}
              className="tk-cal-agenda flex items-center gap-3 rounded-[16px] border border-border bg-surface p-3 text-left transition hover:border-[var(--line-2)] hover:bg-[var(--surface-2)] active:brightness-[0.95]"
            >
              <KindIcon kind={k} size={40} />
              <span className="min-w-0">
                <b className="block font-extrabold text-foreground">{label}</b>
                <small className="block text-[14px] text-foreground-muted">{sub}</small>
              </span>
            </button>
          ))}
        </div>
      </Modal>
      <Modal isOpen={adding === "spend"} onClose={close} title="Add payment" description={selectedLabel} maxWidth="lg">
        {adding === "spend" && <TransactionForm draft={{ date: selected }} onClose={close} />}
      </Modal>
      <Modal isOpen={adding === "task" || Boolean(editTask)} onClose={() => { close(); setEditTask(null); }} title={editTask ? "Edit task" : "Add task"} maxWidth="md">
        {(adding === "task" || editTask) && (
          <TaskForm key={editTask?.id ?? selected} task={editTask ?? undefined} initialDate={selected} onClose={() => { close(); setEditTask(null); }} />
        )}
      </Modal>
      <Modal isOpen={adding === "bill" || Boolean(editBill)} onClose={() => { close(); setEditBill(null); }} title={editBill ? "Edit bill reminder" : "Add bill reminder"} maxWidth="xl">
        {(adding === "bill" || editBill) && (
          <ReminderForm key={editBill?.id ?? selected} reminder={editBill ?? undefined} initialDueDate={selected} onClose={() => { close(); setEditBill(null); }} />
        )}
      </Modal>
      <Modal isOpen={adding === "sub" || Boolean(editSub)} onClose={() => { close(); setEditSub(null); }} title={editSub ? "Edit subscription" : "Add subscription"} maxWidth="lg">
        {(adding === "sub" || editSub) && (
          <SubscriptionForm key={editSub?.id ?? selected} sub={editSub ?? undefined} initialDate={selected} onClose={() => { close(); setEditSub(null); }} />
        )}
      </Modal>
    </div>
  );
}
