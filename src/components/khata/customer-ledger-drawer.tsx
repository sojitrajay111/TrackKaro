import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import type { KhataEntry, KhataType } from "@/store/types";
import {
  useToggleKhataStatusMutation,
  useDeleteKhataEntryMutation,
  useAddKhataEntryMutation,
} from "@/store/api/khataApi";

interface CustomerLedgerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string | null;
  entries: KhataEntry[];
  onAddNewEntry?: (type: KhataType, prefilledName: string) => void;
}

export function CustomerLedgerDrawer({
  isOpen,
  onClose,
  customerName,
  entries,
  onAddNewEntry,
}: CustomerLedgerDrawerProps) {
  const [toggleKhataStatus, { isLoading: isToggling }] = useToggleKhataStatusMutation();
  const [deleteKhataEntry] = useDeleteKhataEntryMutation();
  const [addKhataEntry, { isLoading: isAdding }] = useAddKhataEntryMutation();

  const [copiedPhone, setCopiedPhone] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "settled">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Inline Quick-Add form state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAmount, setQuickAmount] = useState("");
  const [quickType, setQuickType] = useState<KhataType>("gave");
  const [quickNotes, setQuickNotes] = useState("");
  const [quickDate, setQuickDate] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll on open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Currency formatter
  const fmt = (n: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Math.abs(n));
  };

  // Filter entries for this customer
  const customerEntries = useMemo(() => {
    if (!customerName) return [];
    const target = customerName.toLowerCase().trim();
    return entries.filter(
      (e) => (e.personName || "").toLowerCase().trim() === target
    );
  }, [customerName, entries]);

  // Derive summary metrics
  const summary = useMemo(() => {
    let phone: string | undefined;
    let totalGave = 0; // Money you gave (Udhar Diya)
    let totalTook = 0; // Money you took / received (Udhar Liya)
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

    // netBalance: totalGave - totalTook
    // If gave > took: netBalance > 0 => You Will Get
    // If took > gave: netBalance < 0 => You Will Give
    const netBalance = totalGave - totalTook;

    return {
      phone,
      totalGave,
      totalTook,
      netBalance,
      pendingCount,
      settledCount,
      totalCount: customerEntries.length,
    };
  }, [customerEntries]);

  // Filtered entries according to tab
  const displayEntries = useMemo(() => {
    return customerEntries.filter((e) => {
      if (filter === "pending") return e.status === "pending";
      if (filter === "settled") return e.status === "settled";
      return true;
    });
  }, [customerEntries, filter]);

  if (!isOpen || !customerName || !mounted) return null;

  // WhatsApp Reminder Sender
  const handleSendWhatsApp = () => {
    const formattedAmount = fmt(summary.netBalance);
    let message = "";
    if (summary.netBalance > 0) {
      message = `Hi ${customerName}, gentle reminder that a balance of ${formattedAmount} is pending for your account on TrackKaro Khata. Please settle via UPI when free. Thank you!`;
    } else if (summary.netBalance < 0) {
      message = `Hi ${customerName}, checking in regarding the pending balance of ${formattedAmount} I owe you on TrackKaro Khata. Please share your UPI ID so I can settle up!`;
    } else {
      message = `Hi ${customerName}, our account on TrackKaro Khata is fully settled up! Thank you.`;
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
    if (isNaN(amt) || amt <= 0 || !customerName) return;

    try {
      await addKhataEntry({
        personName: customerName,
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
  const isSettled = summary.netBalance === 0;

  // Circular ring percentage calculation (Gave vs Total)
  const totalVolume = summary.totalGave + summary.totalTook;
  const gavePercentage = totalVolume > 0 ? Math.round((summary.totalGave / totalVolume) * 100) : 50;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] flex items-center justify-end p-3 sm:p-6 sm:pr-8 animate-in fade-in duration-200"
    >
      {/* Crisp Backdrop Scrim (No background blur, matching Pane) */}
      <div
        className="fixed inset-0 bg-black/15 dark:bg-black/30 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Floating Modal Card Anchored to the Right (Pane Spec matching Nia Okoro profile) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-[480px] h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] overflow-y-auto no-scrollbar rounded-[32px] bg-white/95 dark:bg-[#121c16]/95 backdrop-blur-2xl text-foreground p-5 sm:p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] border border-white/60 dark:border-white/10 animate-in slide-in-from-right duration-250 space-y-4"
      >
        {/* Floating Close Button in Top-Right */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 h-9 w-9 rounded-full flex items-center justify-center bg-white/70 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-foreground-muted hover:text-foreground transition z-20 shadow-xs border border-white/50 dark:border-white/10"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {/* 1. Top Hero Card (Tinted Glass Container matching Pane profile card) */}
        <div
          className={`p-5 rounded-[26px] border transition-all ${
            isNetNegative
              ? "bg-gradient-to-br from-rose-500/12 via-pink-500/8 to-rose-500/5 dark:from-rose-950/40 dark:via-pink-950/20 dark:to-rose-950/20 border-rose-500/20"
              : isNetPositive
              ? "bg-gradient-to-br from-emerald-500/12 via-teal-500/8 to-emerald-500/5 dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-emerald-950/20 border-emerald-500/20"
              : "bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-teal-500/5 dark:from-teal-950/30 dark:to-emerald-950/20 border-teal-500/20"
          }`}
        >
          <div className="flex items-center gap-4">
            {/* Avatar Circle with Presence Dot */}
            <div className="relative shrink-0">
              <div
                className={`h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-md ${
                  isNetNegative
                    ? "bg-gradient-to-tr from-rose-500 to-pink-500 shadow-rose-500/30"
                    : "bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-emerald-500/30"
                }`}
              >
                {customerName[0]?.toUpperCase() || "K"}
              </div>
              <span
                className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white dark:border-[#121c16] ${
                  isNetNegative
                    ? "bg-rose-500"
                    : isNetPositive
                    ? "bg-emerald-500"
                    : "bg-teal-400"
                }`}
                title={isNetNegative ? "Pending Debit" : isNetPositive ? "Pending Credit" : "Settled"}
              />
            </div>

            {/* Name + Subtitle + Status Pills */}
            <div className="min-w-0 pr-8">
              <h2 className="font-display font-bold text-2xl text-foreground truncate tracking-tight">
                {customerName}
              </h2>
              <p className="text-xs text-foreground-muted font-medium mt-0.5">
                Khata Ledger Contact
              </p>

              {/* Status Chips Row (Matching Pane's ● Design  ● In focus) */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isNetNegative
                      ? "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                      : isNetPositive
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-teal-500/20 text-teal-600 dark:text-teal-400"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isNetNegative ? "bg-rose-500" : isNetPositive ? "bg-emerald-500" : "bg-teal-400"
                    }`}
                  />
                  <span>
                    {isNetNegative
                      ? `You Will Give ${fmt(summary.netBalance)}`
                      : isNetPositive
                      ? `You Will Get ${fmt(summary.netBalance)}`
                      : "Fully Settled"}
                  </span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-black/5 dark:bg-white/10 text-foreground-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground-muted" />
                  <span>{summary.pendingCount} pending</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Two Compact Info Tiles Side-by-Side (Email / Local Time style) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Phone Tile */}
          <div className="p-3.5 rounded-[20px] bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/10 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-foreground-muted">Phone</span>
            <div className="mt-1 flex items-center justify-between gap-1">
              {summary.phone ? (
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary transition font-mono truncate"
                  title="Click to copy phone number"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span className="truncate">{summary.phone}</span>
                </button>
              ) : (
                <span className="text-xs text-foreground-muted italic">Not saved</span>
              )}
              {copiedPhone && (
                <span className="text-[10px] text-emerald-500 font-bold shrink-0">Copied</span>
              )}
            </div>
          </div>

          {/* Account Net Balance Tile */}
          <div className="p-3.5 rounded-[20px] bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/10 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-foreground-muted">Net Account Status</span>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold truncate">
              <span className="text-sm">
                {isNetNegative ? "🔴" : isNetPositive ? "🟢" : "⚪"}
              </span>
              <span
                className={`truncate ${
                  isNetNegative
                    ? "text-rose-600 dark:text-rose-400"
                    : isNetPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-foreground-muted"
                }`}
              >
                {isNetNegative ? "You Owe" : isNetPositive ? "They Owe" : "Settled"}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Metric Breakdown Card (Matching Pane's Workload Ring Card) */}
        <div className="p-4 rounded-[22px] bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/10 flex items-center gap-4">
          {/* Circular Donut Meter */}
          <div className="relative h-18 w-18 shrink-0 flex items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
              {/* Background circle */}
              <path
                className="text-black/10 dark:text-white/10"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {/* Foreground stroke */}
              <path
                className={isNetNegative ? "text-rose-500" : "text-emerald-500"}
                strokeDasharray={`${gavePercentage}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold font-display text-foreground leading-none">
                {gavePercentage}%
              </span>
              <span className="text-[9px] text-foreground-muted uppercase tracking-tight mt-0.5">
                Gave
              </span>
            </div>
          </div>

          {/* Breakdown Stats */}
          <div className="flex-1 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-foreground-muted">You Gave (Udhar Diya)</span>
              <span className="font-semibold text-foreground font-mono">{fmt(summary.totalGave)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground-muted">You Took (Udhar Liya)</span>
              <span className="font-semibold text-foreground font-mono">{fmt(summary.totalTook)}</span>
            </div>
            <div className="pt-1 border-t border-black/[0.05] dark:border-white/10 flex items-center justify-between">
              <span className="font-bold text-foreground">Net Remaining</span>
              <span
                className={`font-bold font-mono ${
                  isNetNegative
                    ? "text-rose-600 dark:text-rose-400"
                    : isNetPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-foreground"
                }`}
              >
                {isNetNegative ? `Give ${fmt(summary.netBalance)}` : isNetPositive ? `Get ${fmt(summary.netBalance)}` : "₹0"}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="h-10 rounded-full px-4 text-xs font-bold bg-[#059669] hover:bg-emerald-700 text-white transition flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/25 active:scale-[0.98]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>WhatsApp Reminder</span>
          </button>

          <button
            type="button"
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className={`h-10 rounded-full px-4 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] ${
              showQuickAdd
                ? "bg-black/10 dark:bg-white/10 text-foreground"
                : "bg-foreground text-background hover:opacity-90 dark:bg-emerald-400 dark:text-emerald-950"
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d={showQuickAdd ? "M18 6 6 18M6 6l12 12" : "M12 5v14M5 12h14"} />
            </svg>
            <span>{showQuickAdd ? "Cancel" : "+ Add Entry"}</span>
          </button>
        </div>

        {/* 4b. Inline Quick-Add Form Box (Expands right inside the card!) */}
        {showQuickAdd && (
          <form
            onSubmit={handleQuickAddSubmit}
            className="p-4 rounded-[24px] bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/10 space-y-3 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Record Entry for {customerName}</span>
              <button
                type="button"
                onClick={() => setShowQuickAdd(false)}
                className="text-foreground-muted hover:text-foreground text-[11px] font-medium"
              >
                ✕
              </button>
            </div>

            {/* Type Switcher */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setQuickType("gave")}
                className={`h-9 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  quickType === "gave"
                    ? "bg-rose-500 text-white shadow-xs"
                    : "bg-black/[0.03] dark:bg-white/[0.04] text-foreground-muted hover:text-foreground border border-black/[0.04] dark:border-white/10"
                }`}
              >
                <span>↑ You Gave (Diya)</span>
              </button>
              <button
                type="button"
                onClick={() => setQuickType("took")}
                className={`h-9 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  quickType === "took"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-black/[0.03] dark:bg-white/[0.04] text-foreground-muted hover:text-foreground border border-black/[0.04] dark:border-white/10"
                }`}
              >
                <span>↓ You Took (Liya)</span>
              </button>
            </div>

            {/* Amount & Date */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-foreground-muted uppercase">Amount (₹)</label>
                <input
                  type="number"
                  step="any"
                  required
                  autoFocus
                  placeholder="e.g. 500"
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl bg-white dark:bg-white/5 px-3 text-xs font-bold border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-foreground"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-foreground-muted uppercase">Date</label>
                <input
                  type="date"
                  required
                  value={quickDate}
                  onChange={(e) => setQuickDate(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl bg-white dark:bg-white/5 px-2.5 text-xs border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-foreground"
                />
              </div>
            </div>

            {/* Item / Note Details */}
            <div>
              <label className="text-[10px] font-semibold text-foreground-muted uppercase">Item / Note Description</label>
              <input
                type="text"
                placeholder="e.g. Chai, Lunch, UPI transfer"
                value={quickNotes}
                onChange={(e) => setQuickNotes(e.target.value)}
                className="mt-1 h-9 w-full rounded-xl bg-white dark:bg-white/5 px-3 text-xs border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-foreground"
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowQuickAdd(false)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-foreground-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAdding}
                className="px-4 py-1.5 rounded-full text-xs font-bold bg-foreground text-background dark:bg-emerald-400 dark:text-emerald-950 hover:opacity-90 transition shadow-sm inline-flex items-center gap-1.5"
              >
                {isAdding && <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />}
                <span>{isAdding ? "Saving..." : quickType === "gave" ? "Save Udhar" : "Save Received"}</span>
              </button>
            </div>
          </form>
        )}

        {/* 5. Ledger Entries Section (Matching Pane's Open Tasks list) */}
        <div className="pt-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-sm text-foreground">
                Ledger Entries
              </h3>
              <span className="h-5 w-5 rounded-full bg-black/5 dark:bg-white/10 text-foreground-muted font-bold text-[11px] flex items-center justify-center">
                {customerEntries.length}
              </span>
            </div>

            {/* Filter Pills */}
            <div className="inline-flex items-center p-0.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-2.5 py-0.5 rounded-full transition ${
                  filter === "all"
                    ? "bg-foreground text-background dark:bg-white dark:text-black shadow-xs font-bold"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilter("pending")}
                className={`px-2.5 py-0.5 rounded-full transition ${
                  filter === "pending"
                    ? "bg-amber-500 text-white shadow-xs font-bold"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setFilter("settled")}
                className={`px-2.5 py-0.5 rounded-full transition ${
                  filter === "settled"
                    ? "bg-emerald-600 text-white shadow-xs font-bold"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                Settled
              </button>
            </div>
          </div>

          {/* List of Entries matching Image 2's task item style */}
          {displayEntries.length === 0 ? (
            <div className="p-6 rounded-[20px] bg-black/[0.02] dark:bg-white/[0.02] text-center text-xs text-foreground-muted space-y-1">
              <p className="text-lg">📋</p>
              <p>No {filter !== "all" ? filter : ""} entries recorded.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayEntries.map((entry) => {
                const isGave = entry.type === "gave";
                const isEntrySettled = entry.status === "settled";

                return (
                  <div
                    key={entry.id}
                    className="p-3 rounded-[18px] bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/10 hover:border-emerald-500/30 transition flex items-center justify-between gap-3 group"
                  >
                    {/* Left: Icon square + Title + Subtitle */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`h-10 w-10 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0 ${
                          isGave
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {isGave ? "↑" : "↓"}
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-display font-semibold text-xs sm:text-sm text-foreground truncate leading-tight">
                          {entry.notes || (isGave ? "Cash Given (Udhar)" : "Cash Received")}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10.5px] text-foreground-muted truncate">
                          <span>{entry.date}</span>
                          <span>•</span>
                          <span className={isGave ? "text-rose-500" : "text-emerald-500"}>
                            {isGave ? "You Gave (Diya)" : "You Took (Liya)"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount + Clickable Status Pill + Delete */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="font-display font-bold text-sm sm:text-base tabular-nums text-foreground">
                        {fmt(entry.amount)}
                      </span>

                      {/* Interactive Status Button */}
                      <button
                        type="button"
                        onClick={() => handleToggle(entry.id)}
                        disabled={isToggling}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1 active:scale-95 ${
                          isEntrySettled
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
                        }`}
                        title="Click to toggle status"
                      >
                        <span>{isEntrySettled ? "✓ Settled" : "⏳ Pending"}</span>
                      </button>

                      {/* Delete */}
                      {deletingId === entry.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(entry.id)}
                            className="text-[10px] font-bold text-red-500 hover:underline px-0.5"
                          >
                            Del
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(null)}
                            className="text-[10px] text-foreground-muted px-0.5"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingId(entry.id)}
                          className="p-1 rounded-full text-foreground-muted hover:text-red-500 transition opacity-60 sm:opacity-0 group-hover:opacity-100"
                          title="Delete entry"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
