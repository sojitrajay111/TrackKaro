"use client";

import { useState, useMemo } from "react";
import type { KhataEntry, KhataType } from "@/store/types";
import {
  useToggleKhataStatusMutation,
  useDeleteKhataEntryMutation,
  useAddKhataEntryMutation,
  useSettleAllKhataForPersonMutation,
  useUpdateKhataEntryMutation,
} from "@/store/api/khataApi";
import { Modal, ModalField, ModalFooter, ModalSegmentedPicker } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Drawer, useCountUp } from "@/components/ui/drawer";
import { avatarTint, initialsOf } from "@/lib/avatar";
import { apiErrorMessage, todayKey } from "@/lib/form";

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
  const [settleAll, { isLoading: isSettling }] = useSettleAllKhataForPersonMutation();
  const [confirmSettle, setConfirmSettle] = useState(false);
  const [settleError, setSettleError] = useState<string | null>(null);
  /** Failed settle/unsettle, delete or quick-add, shown above the entries. */
  const [actionError, setActionError] = useState<string | null>(null);
  const [statementMsg, setStatementMsg] = useState<string | null>(null);

  const [copiedPhone, setCopiedPhone] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "settled">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<KhataEntry | null>(null);

  // Inline Quick-Add form state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAmount, setQuickAmount] = useState("");
  const [quickType, setQuickType] = useState<KhataType>("gave");
  const [quickNotes, setQuickNotes] = useState("");
  const [quickDate, setQuickDate] = useState(() => todayKey());

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

  // Plain-text statement (same content the app shares): balance, then every entry, newest first.
  const statementText = () => {
    const lines = [...customerEntries]
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      .map((e) => `${shortDate(e.date)}  ${e.type === "gave" ? "You gave" : "You got"}  ${fmt(e.amount)}${e.status === "settled" ? "  (settled)" : ""}${e.notes ? `  · ${e.notes}` : ""}`);
    const head =
      summary.netBalance > 0
        ? `${name} owes ${fmt(summary.netBalance)}`
        : summary.netBalance < 0
          ? `I owe ${name} ${fmt(summary.netBalance)}`
          : `All settled with ${name}`;
    return [`TrackKaro Khata statement — ${name}`, `As of ${shortDate(new Date().toISOString())}`, head, "", ...lines].join("\n");
  };

  const flash = (m: string) => {
    setStatementMsg(m);
    setTimeout(() => setStatementMsg(null), 2200);
  };

  const handleCopyStatement = async () => {
    try {
      await navigator.clipboard.writeText(statementText());
      flash("Statement copied");
    } catch {
      flash("Couldn't copy. Try again.");
    }
  };

  const handleWhatsAppStatement = () => {
    const cleanPhone = summary.phone ? summary.phone.replace(/[^\d]/g, "") : "";
    const text = encodeURIComponent(statementText());
    window.open(cleanPhone ? `https://wa.me/${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`, "_blank", "noopener");
  };

  // PDF: a clean printable statement in a new window; the browser's print dialog saves it as PDF.
  const handlePdfStatement = () => {
    const esc = (v: string) => v.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
    const rows = [...customerEntries]
      .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
      .map(
        (e) =>
          `<tr><td>${esc(shortDate(e.date))}</td><td>${e.type === "gave" ? "You gave" : "You got"}</td><td>${esc(e.notes || "")}</td><td>${e.status}</td><td class="r">${esc(fmt(e.amount))}</td></tr>`
      )
      .join("");
    const w = window.open("", "_blank");
    if (!w) {
      flash("Allow pop-ups to save the PDF");
      return;
    }
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Khata statement - ${esc(name)}</title>
<style>body{font:14px/1.5 system-ui,sans-serif;color:#0c1f17;margin:32px}h1{margin:0 0 4px;font-size:22px}p{margin:0 0 16px;color:#45594f}
.bal{font-size:20px;font-weight:800;margin:8px 0 20px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border-bottom:1px solid #dbe7df;text-align:left}
th{font-size:12px;text-transform:uppercase;color:#62766c}.r{text-align:right}footer{margin-top:24px;font-size:12px;color:#62766c}</style></head>
<body><h1>Khata statement · ${esc(name)}</h1><p>${summary.phone ? esc(summary.phone) + " · " : ""}As of ${esc(shortDate(new Date().toISOString()))}</p>
<div class="bal">${summary.netBalance > 0 ? `${esc(name)} owes you ${esc(fmt(summary.netBalance))}` : summary.netBalance < 0 ? `You owe ${esc(name)} ${esc(fmt(summary.netBalance))}` : "All settled"}</div>
<table><thead><tr><th>Date</th><th>Type</th><th>Note</th><th>Status</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table>
<footer>Generated by TrackKaro</footer><script>window.onload=function(){window.print()}</script></body></html>`);
    w.document.close();
  };

  const handleSettleAll = async () => {
    setSettleError(null);
    try {
      await settleAll(name).unwrap();
      setConfirmSettle(false);
      flash(`Everything with ${name} is settled`);
    } catch {
      setSettleError("Couldn't settle. Check your connection and try again.");
    }
  };

  const handleCopyPhone = () => {
    if (!summary.phone) return;
    navigator.clipboard.writeText(summary.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleToggle = async (id: string) => {
    try {
      setActionError(null);
      await toggleKhataStatus(id).unwrap();
    } catch (err) {
      setActionError(apiErrorMessage(err, "Couldn't update this entry. Please try again."));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setActionError(null);
      await deleteKhataEntry(id).unwrap();
      setDeletingId(null);
    } catch (err) {
      setActionError(apiErrorMessage(err, "Couldn't delete this entry. Please try again."));
    }
  };

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(quickAmount);
    if (!name) return;
    if (isNaN(amt) || amt <= 0) {
      setActionError("Enter an amount above ₹0.");
      return;
    }
    setActionError(null);
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
      setActionError(apiErrorMessage(err, "Couldn't save this entry. Check your connection and try again."));
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

      {/* Actions: call, statement (copy / WhatsApp / PDF), settle all */}
      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2">
          {summary.phone && (
            <a href={`tel:${summary.phone.replace(/[^\d+]/g, "")}`} className={`${btnSm} border border-border bg-surface text-foreground hover:bg-surface-muted`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z" />
              </svg>
              Call
            </a>
          )}
          <button type="button" onClick={handleCopyStatement} className={`${btnSm} border border-border bg-surface text-foreground hover:bg-surface-muted`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 9h10v10H9zM5 15V5h10" />
            </svg>
            Copy statement
          </button>
          <button type="button" onClick={handleWhatsAppStatement} className={`${btnSm} border border-border bg-surface text-foreground hover:bg-surface-muted`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4.5 19.5 5.6 16A8 8 0 1 1 8.4 18.6z" />
            </svg>
            Send statement
          </button>
          <button type="button" onClick={handlePdfStatement} className={`${btnSm} border border-border bg-surface text-foreground hover:bg-surface-muted`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 3.5h7l4.5 4.5v12.5h-11.5zM12 11v6M9.5 14.5 12 17l2.5-2.5" />
            </svg>
            PDF
          </button>
          {summary.pendingCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setSettleError(null);
                setConfirmSettle(true);
              }}
              className={`${btnSm} border border-[color-mix(in_srgb,var(--good)_35%,transparent)] bg-[color-mix(in_srgb,var(--good)_10%,transparent)] text-[var(--good)] hover:brightness-95`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m5 12.5 4.5 4.5L19 7.5" />
              </svg>
              Settle all
            </button>
          )}
        </div>
        {statementMsg && <p className="text-[14px] font-bold text-[var(--good)]" aria-live="polite">{statementMsg}</p>}
      </div>

      <ConfirmDialog
        isOpen={confirmSettle}
        onCancel={() => setConfirmSettle(false)}
        onConfirm={handleSettleAll}
        title={`Settle everything with ${name}?`}
        description={`Marks all ${summary.pendingCount} pending ${summary.pendingCount === 1 ? "entry" : "entries"} as settled. You can still re-open any entry later.`}
        confirmLabel="Settle all"
        isWorking={isSettling}
        error={settleError}
      />

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

      {actionError && (
        <p role="alert" className="text-[15px] font-[650] text-[var(--bad)]">
          {actionError}
        </p>
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
                  <button
                    type="button"
                    onClick={() => setEditing(entry)}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-foreground-muted opacity-60 transition hover:bg-[var(--surface-2)] hover:text-foreground group-hover:opacity-100 sm:opacity-0 focus:opacity-100"
                    title="Edit entry"
                    aria-label="Edit entry"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />
                    </svg>
                  </button>
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

      <Modal isOpen={Boolean(editing)} onClose={() => setEditing(null)} title="Edit entry" description={name} maxWidth="md">
        {editing && <EditEntryForm key={editing.id} entry={editing} onClose={() => setEditing(null)} />}
      </Modal>
    </Drawer>
  );
}

/** Edit one khata entry: direction, amount, dates and note (PATCH /khata/:id). */
function EditEntryForm({ entry, onClose }: { entry: KhataEntry; onClose: () => void }) {
  const [update, { isLoading }] = useUpdateKhataEntryMutation();
  const [type, setType] = useState<KhataType>(entry.type);
  const [amount, setAmount] = useState(String(entry.amount));
  const [date, setDate] = useState((entry.date || "").slice(0, 10));
  const [dueDate, setDueDate] = useState((entry.dueDate || "").slice(0, 10));
  const [notes, setNotes] = useState(entry.notes || "");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!(value > 0)) {
      setError("Enter an amount above ₹0.");
      return;
    }
    setError(null);
    try {
      await update({ id: entry.id, patch: { type, amount: value, date, dueDate: dueDate || undefined, notes: notes.trim() || undefined } }).unwrap();
      onClose();
    } catch {
      setError("Couldn't save. Check your connection and try again.");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <ModalSegmentedPicker
        options={[
          { value: "gave" as const, label: "You gave" },
          { value: "took" as const, label: "You got" },
        ]}
        selected={type}
        onChange={setType}
      />
      <ModalField label="Amount (₹)">
        <input type="number" min="0.01" step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={fieldCls} />
      </ModalField>
      <div className="grid grid-cols-2 gap-3">
        <ModalField label="Date">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldCls} />
        </ModalField>
        <ModalField label="Due date (optional)">
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={fieldCls} />
        </ModalField>
      </div>
      <ModalField label="Note">
        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Dinner split" className={fieldCls} />
      </ModalField>
      {error && <p role="alert" className="text-[14px] font-semibold text-[var(--bad)]">{error}</p>}
      <ModalFooter onCancel={onClose} isSubmitting={isLoading} confirmLabel="Save changes" />
    </form>
  );
}
