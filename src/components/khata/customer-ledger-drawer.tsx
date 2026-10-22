"use client";

import { useState, useMemo } from "react";
import type { KhataEntry, KhataType } from "@/store/types";
import {
  useToggleKhataStatusMutation,
  useDeleteKhataEntryMutation,
  useAddKhataEntryMutation,
} from "@/store/api/khataApi";
import { Drawer, useCountUp } from "@/components/ui/drawer";
import { avatarTint, initialsOf } from "@/lib/avatar";

interface CustomerLedgerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string | null;
  entries: KhataEntry[];
  onAddNewEntry?: (type: KhataType, prefilledName: string) => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const fieldCls =
  "h-11 w-full rounded-[12px] border border-[var(--line-2)] bg-surface px-[13px] text-[15px] font-medium text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-foreground focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--text)_12%,transparent)]";
const labelCls = "text-[14px] font-bold text-foreground-muted";
const btnSm =
  "inline-flex h-[38px] items-center justify-center gap-2 rounded-[12px] px-3.5 text-[14px] font-bold transition active:brightness-[0.93]";

function shortDate(d: string) {
  const [y, m, day] = (d || "").slice(0, 10).split("-").map(Number);
  if (!y) return d || "—";
  return new Date(y, m - 1, day).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Kesta contact-style drawer for one person's khata: balance, monthly bars, details, entries. */
export function CustomerLedgerDrawer({ isOpen, onClose, customerName, entries }: CustomerLedgerDrawerProps) {
  const [toggleKhataStatus, { isLoading: isToggling }] = useToggleKhataStatusMutation();
  const [deleteKhataEntry] = useDeleteKhataEntryMutation();
  const [addKhataEntry, { isLoading: isAdding }] = useAddKhataEntryMutation();

  const [copiedPhone, setCopiedPhone] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "settled">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Inline Quick-Add form state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAmount, setQuickAmount] = useState("");
  const [quickType, setQuickType] = useState<KhataType>("gave");
  const [quickNotes, setQuickNotes] = useState("");
  const [quickDate, setQuickDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Keep showing the last person while the drawer animates closed.
  const [lastName, setLastName] = useState(customerName);
  if (customerName && customerName !== lastName) setLastName(customerName);
  const name = customerName ?? lastName ?? "";

  // Currency formatter
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Math.abs(n));

  // Entries for this person
  const customerEntries = useMemo(() => {
    if (!name) return [];
    const target = name.toLowerCase().trim();
    return entries.filter((e) => (e.personName || "").toLowerCase().trim() === target);
  }, [name, entries]);

  // Summary metrics
  const summary = useMemo(() => {
    let phone: string | undefined;
    let totalGave = 0; // money you gave (udhar diya), still pending
    let totalTook = 0; // money you took / received (udhar liya), still pending
    let pendingCount = 0;
    let settledCount = 0;
    customerEntries.forEach((e) => {
      if (!phone && e.phone) phone = e.phone;
      if (e.status === "pending") {
        pendingCount++;
        if (e.type === "gave") totalGave += e.amount;
        else totalTook += e.amount;
      } else {
        settledCount++;
      }
    });
    return { phone, totalGave, totalTook, netBalance: totalGave - totalTook, pendingCount, settledCount, totalCount: customerEntries.length };
  }, [customerEntries]);

  // Last 12 months of entry amounts (all entries, both directions) for the bar strip.
  const months = useMemo(() => {
    const now = new Date();
    const list = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: MONTHS[d.getMonth()], total: 0 };
    });
    customerEntries.forEach((e) => {
      const m = list.find((x) => e.date?.startsWith(x.key));
      if (m) m.total += e.amount;
    });
    return list;
  }, [customerEntries]);
  const monthMax = Math.max(1, ...months.map((m) => m.total));

  // Filtered entries for the list, newest first
  const displayEntries = useMemo(
    () =>
      customerEntries
        .filter((e) => (filter === "pending" ? e.status === "pending" : filter === "settled" ? e.status === "settled" : true))
        .sort((a, b) => (b.date || "").localeCompare(a.date || "")),
    [customerEntries, filter]
  );

  const counted = useCountUp(Math.abs(summary.netBalance), name);

  const handleSendWhatsApp = () => {
    const formattedAmount = fmt(summary.netBalance);
    let message = "";
    if (summary.netBalance > 0) {
      message = `Hi ${name}, gentle reminder that a balance of ${formattedAmount} is pending for your account on TrackKaro Khata. Please settle via UPI when free. Thank you!`;
    } else if (summary.netBalance < 0) {
      message = `Hi ${name}, checking in regarding the pending balance of ${formattedAmount} I owe you on TrackKaro Khata. Please share your UPI ID so I can settle up!`;
    } else {
      message = `Hi ${name}, our account on TrackKaro Khata is fully settled up! Thank you.`;
    }
    const cleanPhone = summary.phone ? summary.phone.replace(/[^\d]/g, "") : "";
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handleCopyPhone = () => {
    if (!summary.phone) return;
    navigator.clipboard.writeText(summary.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleKhataStatus(id).unwrap();
    } catch (err) {
      console.error("Failed to toggle khata status:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteKhataEntry(id).unwrap();
      setDeletingId(null);
    } catch (err) {
      console.error("Failed to delete khata entry:", err);
    }
  };

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(quickAmount);
    if (isNaN(amt) || amt <= 0 || !name) return;
    try {
      await addKhataEntry({
        personName: name,
        phone: summary.phone,
        amount: amt,
        type: quickType,
        notes: quickNotes.trim() || undefined,
        date: quickDate,
        status: "pending",
      }).unwrap();
      setQuickAmount("");
      setQuickNotes("");
      setShowQuickAdd(false);
    } catch (err) {
      console.error("Failed to add entry:", err);
    }
  };

  const isNetPositive = summary.netBalance > 0;
  const isNetNegative = summary.netBalance < 0;
  const statusLabel = isNetPositive ? "They owe you" : isNetNegative ? "You owe them" : "All settled";
  const tone = isNetPositive ? "var(--good)" : isNetNegative ? "var(--bad)" : "var(--faint)";

  return (
    <Drawer
      open={isOpen && Boolean(customerName)}
      onClose={onClose}
      label={name ? `${name} khata` : "Khata"}
      footer={
        <>
          <button type="button" onClick={handleSendWhatsApp} className={`${btnSm} bg-[var(--primary)] text-[var(--on-primary)] hover:bg-[var(--primary-strong)]`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4.5 19.5 5.6 16A8 8 0 1 1 8.4 18.6z" />
              <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-1.8-1-1 .7a3.6 3.6 0 0 1-1.9-1.9l.7-1-1-1.8z" />
            </svg>
            WhatsApp reminder
          </button>
          <button
            type="button"
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            aria-expanded={showQuickAdd}
            className={`${btnSm} border border-border bg-surface text-foreground hover:bg-surface-muted`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d={showQuickAdd ? "M18 6 6 18M6 6l12 12" : "M12 5v14M5 12h14"} />
            </svg>
            {showQuickAdd ? "Cancel" : "Add entry"}
          </button>
        </>
      }
    >
      {/* 1. Hero: big letter avatar, name, tags */}
      <div className="flex items-center gap-4 pr-12">
        <span
          className="tk-pop inline-grid h-[84px] w-[84px] shrink-0 place-items-center rounded-full text-[30px] font-extrabold tracking-[0.02em] text-[#1e1724]"
          style={{ background: avatarTint(name) }}
          aria-hidden="true"
        >
          {initialsOf(name)}
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-[24px] font-extrabold tracking-[-0.03em] leading-tight text-foreground">{name}</h2>
          <p className="text-[15px] text-foreground-muted">Khata contact{summary.phone ? ` · ${summary.phone}` : ""}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`pill ${isNetPositive ? "pill--good" : isNetNegative ? "pill--bad" : "pill--faint"}`}>
              <i />
              {statusLabel}
            </span>
            <span className="pill pill--amber">
              <i />
              {summary.pendingCount} pending
            </span>
          </div>
        </div>
      </div>

      {/* 2. Big balance (counts up) */}
      <div className="d-big">
        <small>{isNetPositive ? "You will get" : isNetNegative ? "You will give" : "Net balance"}</small>
        <b className="num" style={{ color: summary.netBalance === 0 ? undefined : tone }}>
          {fmt(Math.round(counted))}
        </b>
        <small>
          {summary.totalCount} {summary.totalCount === 1 ? "entry" : "entries"} · {summary.settledCount} settled
        </small>
      </div>

      {/* 3. Last 12 months, bars grow up one after another */}
      <div className="flex h-24 items-end gap-1.5" role="img" aria-label="Amounts recorded each month, last 12 months">
        {months.map((m, i) => (
          <span key={m.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${m.label}: ${fmt(m.total)}`}>
            <span
              className="tk-bar w-full rounded-[5px_5px_2px_2px]"
              style={{
                height: `${Math.max(2, (m.total / monthMax) * 100)}%`,
                background: m.total > 0 ? tone : "var(--line-2)",
                animationDelay: `${0.2 + i * 0.03}s`,
              }}
            />
            <small className="text-[12px] font-bold text-foreground-muted">{m.label[0]}</small>
          </span>
        ))}
      </div>

      {/* 4. Details */}
      <div className="d-rows">
        <div className="d-row">
          <span>Phone</span>
          {summary.phone ? (
            <button type="button" onClick={handleCopyPhone} className="inline-flex items-center gap-1.5 font-bold text-foreground hover:underline">
              {copiedPhone ? "Copied" : summary.phone}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="8" y="8" width="12" height="12" rx="2.5" />
                <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
              </svg>
            </button>
          ) : (
            <span className="text-foreground-muted">Not saved</span>
          )}
        </div>
        <div className="d-row">
          <span>You gave · pending</span>
          <span className="num">{fmt(summary.totalGave)}</span>
        </div>
        <div className="d-row">
          <span>You took · pending</span>
          <span className="num">{fmt(summary.totalTook)}</span>
        </div>
        <div className="d-row">
          <span>Net remaining</span>
          <span className="num" style={{ color: summary.netBalance === 0 ? undefined : tone }}>
            {isNetNegative ? `Give ${fmt(summary.netBalance)}` : isNetPositive ? `Get ${fmt(summary.netBalance)}` : "₹0"}
          </span>
        </div>
      </div>

      {/* 5. Inline quick add */}
      {showQuickAdd && (
        <form onSubmit={handleQuickAddSubmit} className="tk-pop grid gap-3 rounded-[18px] border border-border bg-[var(--surface-2)] p-4">
          <p className="text-[15px] font-extrabold text-foreground">New entry for {name}</p>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Direction">
            {(
              [
                ["gave", "You gave", "var(--bad)", "M12 19V5M6 11l6-6 6 6"],
                ["took", "You got", "var(--good)", "M12 5v14M6 13l6 6 6-6"],
              ] as const
            ).map(([v, label, color, d]) => (
              <button
                key={v}
                type="button"
                aria-pressed={quickType === v}
                onClick={() => setQuickType(v)}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-[12px] border text-[15px] font-bold transition ${
                  quickType === v ? "border-transparent bg-foreground text-background" : "border-border bg-surface text-foreground"
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={quickType === v ? "currentColor" : color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={d} />
                </svg>
                {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1.5">
              <span className={labelCls}>Amount</span>
              <span className="relative block">
                <span className="pointer-events-none absolute inset-y-0 left-[13px] grid place-items-center font-extrabold text-foreground-muted">₹</span>
                <input
                  type="number"
                  step="any"
                  required
                  autoFocus
                  inputMode="decimal"
                  placeholder="500"
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  className={`${fieldCls} pl-[34px] text-[17px] font-[750]`}
                />
              </span>
            </label>
            <label className="grid gap-1.5">
              <span className={labelCls}>Date</span>
              <input type="date" required value={quickDate} onChange={(e) => setQuickDate(e.target.value)} className={fieldCls} />
            </label>
          </div>
          <label className="grid gap-1.5">
            <span className={labelCls}>Note</span>
            <input type="text" placeholder="Chai, lunch, UPI transfer…" value={quickNotes} onChange={(e) => setQuickNotes(e.target.value)} className={fieldCls} />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowQuickAdd(false)} className={`${btnSm} text-foreground-muted hover:text-foreground`}>
              Cancel
            </button>
            <button type="submit" disabled={isAdding} className={`${btnSm} bg-[var(--primary)] text-[var(--on-primary)] disabled:opacity-50`}>
              {isAdding ? "Saving…" : quickType === "gave" ? "Save udhar" : "Save received"}
            </button>
          </div>
        </form>
      )}

      {/* 6. Entries */}
      <div>
        <div className="mb-1 flex items-center justify-between gap-3">
          <p className="font-extrabold text-foreground">
            Entries <span className="font-bold text-foreground-muted">· {customerEntries.length}</span>
          </p>
          <div className="inline-flex rounded-[12px] bg-[var(--well)] p-[3px]" role="group" aria-label="Show entries">
            {(["all", "pending", "settled"] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={`rounded-[9px] px-[13px] py-1.5 text-[14px] font-bold capitalize transition ${
                  filter === f ? "bg-[var(--raised)] text-foreground shadow-[0_1px_4px_#12322a24]" : "text-foreground-muted hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {displayEntries.length === 0 ? (
          <p className="py-6 text-center text-[15px] text-foreground-muted">No {filter !== "all" ? filter : ""} entries yet.</p>
        ) : (
          <div className="grid">
            {displayEntries.map((entry) => {
              const isGave = entry.type === "gave";
              const isEntrySettled = entry.status === "settled";
              return (
                <div key={entry.id} className="group flex min-w-0 items-center gap-3 border-b border-border px-0.5 py-2.5 last:border-b-0">
                  <span
                    className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-[11px]"
                    style={{
                      background: `color-mix(in srgb, ${isGave ? "var(--bad)" : "var(--good)"} 14%, transparent)`,
                      color: isGave ? "var(--bad)" : "var(--good)",
                    }}
                    aria-hidden="true"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d={isGave ? "M12 19V5M6 11l6-6 6 6" : "M12 5v14M6 13l6 6 6-6"} />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className={`block truncate font-bold ${isEntrySettled ? "text-foreground-muted line-through" : "text-foreground"}`}>
                      {entry.notes || (isGave ? "Cash given (udhar)" : "Cash received")}
                    </b>
                    <small className="block truncate text-[14px] text-foreground-muted">
                      {shortDate(entry.date)} · {isGave ? "You gave" : "You got"}
                      {entry.dueDate ? ` · due ${shortDate(entry.dueDate)}` : ""}
                    </small>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <b className="font-extrabold text-foreground num">{fmt(entry.amount)}</b>
                    <button
                      type="button"
                      onClick={() => handleToggle(entry.id)}
                      disabled={isToggling}
                      className={`pill ${isEntrySettled ? "pill--good" : "pill--amber"} !text-[13px] !py-px transition hover:brightness-95`}
                      title={isEntrySettled ? "Mark as pending" : "Mark as settled"}
                    >
                      <i />
                      {isEntrySettled ? "Settled" : "Pending"}
                    </button>
                  </span>
                  {deletingId === entry.id ? (
                    <span className="flex shrink-0 items-center gap-1">
                      <button type="button" onClick={() => handleDelete(entry.id)} className="rounded-[8px] px-2 py-1 text-[13px] font-bold text-[var(--bad)] hover:bg-[color-mix(in_srgb,var(--rose)_14%,transparent)]">
                        Delete
                      </button>
                      <button type="button" onClick={() => setDeletingId(null)} className="rounded-[8px] px-1.5 py-1 text-[13px] font-bold text-foreground-muted" aria-label="Cancel delete">
                        ✕
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeletingId(entry.id)}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-foreground-muted opacity-60 transition hover:bg-[color-mix(in_srgb,var(--rose)_14%,transparent)] hover:text-[var(--bad)] group-hover:opacity-100 sm:opacity-0 focus:opacity-100"
                      title="Delete entry"
                      aria-label="Delete entry"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Drawer>
  );
}
