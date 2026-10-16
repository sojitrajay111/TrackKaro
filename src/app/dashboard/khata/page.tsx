"use client";

import { useState, useMemo, type FormEvent } from "react";
import Link from "next/link";
import { Modal, ModalField, ModalFooter } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n";
import {
  useGetKhataEntriesQuery,
  useAddKhataEntryMutation,
  useToggleKhataStatusMutation,
  useDeleteKhataEntryMutation,
} from "@/store/api/khataApi";
import {
  useGetGroupsQuery,
  useCreateGroupMutation,
  useDeleteGroupMutation,
  useJoinGroupMutation,
} from "@/store/api/groupsApi";
import type { ExpenseGroup, KhataEntry, KhataType } from "@/store/types";

type KhataSubTab = "personal" | "groups";
type KhataFilter = "all" | "gave" | "took" | "settled";

interface CustomerSummary {
  personName: string;
  phone?: string;
  totalGave: number; // You gave (pending)
  totalTook: number; // You took (pending)
  netBalance: number; // totalGave - totalTook (>0 => You Will Get, <0 => You Will Give)
  pendingCount: number;
  settledCount: number;
  totalCount: number;
  lastDate: string;
  latestNote?: string;
}

export default function KhataPage() {
  const { t } = useI18n();

  // Queries & Mutations
  const {
    data: khataEntries = [],
    isLoading: loadingKhata,
    refetch: refetchKhata,
  } = useGetKhataEntriesQuery();
  const {
    data: expenseGroups = [],
    isLoading: loadingGroups,
    refetch: refetchGroups,
  } = useGetGroupsQuery();

  const [addKhataEntry, { isLoading: isAddingKhata }] = useAddKhataEntryMutation();
  const [toggleKhataStatus, { isLoading: isToggling }] = useToggleKhataStatusMutation();
  const [deleteKhataEntry, { isLoading: isDeletingKhata }] = useDeleteKhataEntryMutation();

  const [createGroup, { isLoading: isCreatingGroup }] = useCreateGroupMutation();
  const [deleteGroup, { isLoading: isDeletingGroup }] = useDeleteGroupMutation();
  const [joinGroup, { isLoading: isJoiningGroup }] = useJoinGroupMutation();

  // Sub-Tab Switcher: Personal vs Shared Groups
  const [subTab, setSubTab] = useState<KhataSubTab>("personal");

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<KhataFilter>("all");

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Groups Modals
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const [groupToDeleteId, setGroupToDeleteId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<ExpenseGroup | null>(null);

  // Form State for Adding Khata Entry
  const [khataPersonName, setKhataPersonName] = useState("");
  const [khataPhone, setKhataPhone] = useState("");
  const [khataAmount, setKhataAmount] = useState("");
  const [khataType, setKhataType] = useState<KhataType>("gave");
  const [khataDate, setKhataDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [khataDueDate, setKhataDueDate] = useState("");
  const [khataNotes, setKhataNotes] = useState("");

  // Form State for Create Group
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupCategory, setNewGroupCategory] = useState<ExpenseGroup["category"]>("Home & Utilities");

  // Form State for Join Group
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Currency Formatter
  const fmt = (n: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Math.abs(n));
  };

  // 1. Overall Balance Metrics
  const { totalYouWillGet, totalYouWillGive, netOverallBalance } = useMemo(() => {
    let willGet = 0;
    let willGive = 0;
    khataEntries.forEach((entry) => {
      if (entry.status === "pending") {
        if (entry.type === "gave") willGet += entry.amount;
        if (entry.type === "took") willGive += entry.amount;
      }
    });
    return {
      totalYouWillGet: willGet,
      totalYouWillGive: willGive,
      netOverallBalance: willGet - willGive,
    };
  }, [khataEntries]);

  // 2. Aggregate Khata Entries by Customer
  const customerSummaries = useMemo(() => {
    const map = new Map<string, CustomerSummary>();

    khataEntries.forEach((entry) => {
      const trimmedName = entry.personName?.trim() || "Anonymous";
      const key = trimmedName.toLowerCase();
      let summary = map.get(key);

      if (!summary) {
        summary = {
          personName: trimmedName,
          phone: entry.phone,
          totalGave: 0,
          totalTook: 0,
          netBalance: 0,
          pendingCount: 0,
          settledCount: 0,
          totalCount: 0,
          lastDate: entry.date,
          latestNote: entry.notes,
        };
        map.set(key, summary);
      }

      if (!summary.phone && entry.phone) {
        summary.phone = entry.phone;
      }

      summary.totalCount += 1;

      if (entry.status === "pending") {
        summary.pendingCount += 1;
        if (entry.type === "gave") {
          summary.totalGave += entry.amount;
        } else {
          summary.totalTook += entry.amount;
        }
      } else {
        summary.settledCount += 1;
      }

      if (entry.date >= summary.lastDate) {
        summary.lastDate = entry.date;
        if (entry.notes) {
          summary.latestNote = entry.notes;
        }
      }
    });

    return Array.from(map.values())
      .map((s) => ({
        ...s,
        netBalance: s.totalGave - s.totalTook,
      }))
      .sort((a, b) => b.lastDate.localeCompare(a.lastDate));
  }, [khataEntries]);

  // 3. Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customerSummaries.filter((cust) => {
      if (filter === "gave" && cust.netBalance <= 0) return false;
      if (filter === "took" && cust.netBalance >= 0) return false;
      if (filter === "settled" && cust.pendingCount > 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = cust.personName.toLowerCase().includes(q);
        const matchesPhone = cust.phone ? cust.phone.includes(q) : false;
        const matchesNote = cust.latestNote ? cust.latestNote.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesPhone && !matchesNote) return false;
      }

      return true;
    });
  }, [customerSummaries, filter, searchQuery]);

  // Entries for the Currently Selected Customer (for statement modal)
  const activeCustomerEntries = useMemo(() => {
    if (!selectedCustomer) return [];
    return khataEntries.filter(
      (k) => k.personName.toLowerCase() === selectedCustomer.toLowerCase()
    );
  }, [khataEntries, selectedCustomer]);

  const activeCustomerSummary = useMemo(() => {
    if (!selectedCustomer) return null;
    return (
      customerSummaries.find(
        (c) => c.personName.toLowerCase() === selectedCustomer.toLowerCase()
      ) || null
    );
  }, [customerSummaries, selectedCustomer]);

  // Handlers
  const handleOpenAdd = (type: KhataType, prefilledName = "") => {
    setKhataType(type);
    if (prefilledName) {
      setKhataPersonName(prefilledName);
      const existing = customerSummaries.find(
        (c) => c.personName.toLowerCase() === prefilledName.toLowerCase()
      );
      if (existing?.phone) setKhataPhone(existing.phone);
    } else {
      setKhataPersonName("");
      setKhataPhone("");
    }
    setKhataAmount("");
    setKhataNotes("");
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(khataAmount);
    if (isNaN(amt) || amt <= 0 || !khataPersonName.trim()) return;

    try {
      await addKhataEntry({
        personName: khataPersonName.trim(),
        phone: khataPhone.trim() || undefined,
        amount: amt,
        type: khataType,
        date: khataDate,
        dueDate: khataDueDate.trim() || undefined,
        notes: khataNotes.trim() || undefined,
        status: "pending",
      }).unwrap();

      setShowAddModal(false);
      setKhataAmount("");
      setKhataNotes("");
    } catch (err) {
      console.error("Failed to add khata entry:", err);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleKhataStatus(id).unwrap();
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteKhataEntry(deleteTargetId).unwrap();
      setDeleteTargetId(null);
    } catch (err) {
      console.error("Failed to delete khata entry:", err);
    }
  };

  const handleCreateGroupSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      await createGroup({
        name: newGroupName.trim(),
        category: newGroupCategory,
      }).unwrap();
      setShowCreateGroupModal(false);
      setNewGroupName("");
    } catch (err) {
      console.error("Failed to create group:", err);
    }
  };

  const handleJoinGroupSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;
    try {
      await joinGroup({ inviteCode: inviteCodeInput.trim().toUpperCase() }).unwrap();
      setShowJoinGroupModal(false);
      setInviteCodeInput("");
    } catch (err) {
      console.error("Failed to join group:", err);
    }
  };

  const handleDeleteGroupConfirm = async () => {
    if (!groupToDeleteId) return;
    try {
      await deleteGroup(groupToDeleteId).unwrap();
      setGroupToDeleteId(null);
    } catch (err) {
      console.error("Failed to delete group:", err);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Send WhatsApp Reminder
  const handleSendWhatsApp = (cust: CustomerSummary) => {
    const formattedAmount = fmt(cust.netBalance);
    let message = "";
    if (cust.netBalance > 0) {
      message = `Hi ${cust.personName}, gentle reminder that a payment of ${formattedAmount} is pending for your account on TrackKaro Khata. Please settle via UPI when free. Thank you!`;
    } else if (cust.netBalance < 0) {
      message = `Hi ${cust.personName}, just checking in regarding the pending balance of ${formattedAmount} I owe you on TrackKaro Khata. Let me know your UPI ID to settle up!`;
    } else {
      message = `Hi ${cust.personName}, our account on TrackKaro Khata is fully settled up! Thank you.`;
    }

    const cleanPhone = cust.phone ? cust.phone.replace(/[^\d]/g, "") : "";
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header Row (Matching Coterie Styling & Outfit Font) */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="font-display font-normal text-[26px] sm:text-[32px] lg:text-[38px] tracking-[-0.02em] text-foreground leading-tight mb-1.5">
            Bahi Khata & Ledger
          </h1>
          <p className="text-xs sm:text-sm font-medium text-foreground-muted">
            Personal 1-on-1 digital ledger, udhar tracking & customer balances.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {subTab === "personal" ? (
            <>
              {/* You Gave Shortcut (Maine Diye - Red) */}
              <button
                type="button"
                onClick={() => handleOpenAdd("gave")}
                className="flex items-center gap-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-[#EF4444] border border-rose-500/30 px-3.5 py-2 text-xs font-bold transition hover:scale-[1.02]"
                title="Record money you gave to someone"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m18 15-6-6-6 6" />
                </svg>
                <span>You Gave</span>
              </button>

              {/* You Got Shortcut (Maine Liye - Green) */}
              <button
                type="button"
                onClick={() => handleOpenAdd("took")}
                className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-[#059669] dark:text-emerald-400 border border-emerald-500/30 px-3.5 py-2 text-xs font-bold transition hover:scale-[1.02]"
                title="Record money you took or received"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m6 9 6 6 6-6" />
                </svg>
                <span>You Got</span>
              </button>

              {/* Add Entry Pill Button */}
              <button
                type="button"
                onClick={() => handleOpenAdd("gave")}
                className="flex items-center gap-2 rounded-full bg-primary hover:bg-primary-strong text-white px-5 py-2 text-xs sm:text-[13px] font-bold shadow-xs transition hover:scale-[1.02]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span>+ Add Entry</span>
              </button>
            </>
          ) : (
            <>
              {/* Join with Code */}
              <button
                type="button"
                onClick={() => setShowJoinGroupModal(true)}
                className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface-muted transition"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m21 2-2 2m-1.5 1.5L14 9l-1.5-1.5 3.5-3.5M3 21l9-9m3.5-3.5L14 7" />
                </svg>
                <span>Join with Code</span>
              </button>

              {/* Create Group */}
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(true)}
                className="flex items-center gap-2 rounded-full bg-primary hover:bg-primary-strong text-white px-5 py-2 text-xs sm:text-[13px] font-bold shadow-xs transition hover:scale-[1.02]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span>+ Create Group</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Sub-Tab Switcher: Personal Khata vs Shared Groups */}
      <div className="flex items-center gap-2 p-1.5 rounded-full border border-border/80 bg-surface/90 w-fit card-shadow">
        <button
          type="button"
          onClick={() => setSubTab("personal")}
          className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs sm:text-[13px] font-bold transition select-none ${
            subTab === "personal"
              ? "bg-[#0E1F16] text-white shadow-xs dark:bg-emerald-400 dark:text-emerald-950"
              : "text-foreground-sub hover:text-foreground"
          }`}
        >
          <span>Personal Khata</span>
          <span className="rounded-full bg-white/20 dark:bg-black/20 px-2 py-0.5 text-[10px]">
            {customerSummaries.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("groups")}
          className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs sm:text-[13px] font-bold transition select-none ${
            subTab === "groups"
              ? "bg-[#0E1F16] text-white shadow-xs dark:bg-emerald-400 dark:text-emerald-950"
              : "text-foreground-sub hover:text-foreground"
          }`}
        >
          <span>Shared Groups</span>
          <span className="rounded-full bg-white/20 dark:bg-black/20 px-2 py-0.5 text-[10px]">
            {expenseGroups.length}
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* PERSONAL KHATA TAB CONTENT */}
      {/* ============================================================== */}
      {subTab === "personal" && (
        <div className="space-y-6">
          {/* Top Summary KPI Cards (You Will Get vs You Will Give) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* You Will Get (Maine Diye - Green) */}
            <div className="p-5 rounded-[28px] bg-emerald-500/10 border border-emerald-500/25 card-shadow space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#059669] dark:text-emerald-400 tracking-wide uppercase">
                  You Will Get
                </span>
                <span className="h-7 w-7 rounded-full bg-[#059669] text-white flex items-center justify-center text-xs font-bold">
                  ↓
                </span>
              </div>
              <div className="font-display font-medium text-2xl sm:text-3xl text-[#059669] dark:text-emerald-400">
                {loadingKhata ? <Skeleton className="h-8 w-24" /> : fmt(totalYouWillGet)}
              </div>
              <p className="text-[11px] text-foreground-muted">
                Pending receivables you gave to friends / customers.
              </p>
            </div>

            {/* You Will Give (Maine Liye - Red) */}
            <div className="p-5 rounded-[28px] bg-rose-500/10 border border-rose-500/25 card-shadow space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#EF4444] tracking-wide uppercase">
                  You Will Give
                </span>
                <span className="h-7 w-7 rounded-full bg-[#EF4444] text-white flex items-center justify-center text-xs font-bold">
                  ↑
                </span>
              </div>
              <div className="font-display font-medium text-2xl sm:text-3xl text-[#EF4444]">
                {loadingKhata ? <Skeleton className="h-8 w-24" /> : fmt(totalYouWillGive)}
              </div>
              <p className="text-[11px] text-foreground-muted">
                Pending payables you took from friends or vendors.
              </p>
            </div>

            {/* Net Baaki (Surplus / Deficit) */}
            <div className="p-5 rounded-[28px] bg-surface/90 border border-border/80 card-shadow space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground-muted tracking-wide uppercase">
                  Net Ledger Balance
                </span>
                <span className="rounded-full bg-border/60 px-2.5 py-0.5 text-[10px] font-semibold text-foreground-sub">
                  {customerSummaries.filter((c) => c.pendingCount > 0).length} Open
                </span>
              </div>
              <div
                className={`font-display font-medium text-2xl sm:text-3xl ${
                  netOverallBalance > 0
                    ? "text-[#059669] dark:text-emerald-400"
                    : netOverallBalance < 0
                    ? "text-[#EF4444]"
                    : "text-foreground"
                }`}
              >
                {loadingKhata ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  `${netOverallBalance >= 0 ? "+" : "-"}${fmt(netOverallBalance)}`
                )}
              </div>
              <p className="text-[11px] text-foreground-muted">
                {netOverallBalance > 0
                  ? "Overall surplus: You are owed more than you owe."
                  : netOverallBalance < 0
                  ? "Overall debt: You owe more than you are owed."
                  : "All accounts are balanced & settled."}
              </p>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-[24px] bg-surface/90 border border-border/80 card-shadow">
            {/* Search Input */}
            <div className="relative flex-1">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search by customer name, phone, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-full border border-border/70 bg-surface-muted pl-10 pr-4 text-xs sm:text-sm font-medium text-foreground placeholder:text-foreground-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "gave", label: "You Will Get" },
                  { id: "took", label: "You Will Give" },
                  { id: "settled", label: "Settled" },
                ] as const
              ).map((f) => {
                const isActive = filter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilter(f.id)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                      isActive
                        ? "bg-[#0E1F16] text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-xs"
                        : "border border-border/70 text-foreground-sub hover:text-foreground hover:bg-surface-muted"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customer Cards Grid */}
          {loadingKhata ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-5 rounded-[28px] bg-surface/90 border border-border/80 card-shadow space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-11 w-11 rounded-2xl" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-32" />
                </div>
              ))}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="rounded-[28px] bg-surface/90 border border-border/80 card-shadow p-12 text-center space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto text-2xl font-bold">
                📖
              </div>
              <h3 className="font-display font-medium text-lg text-foreground">
                No Khata Entries Found
              </h3>
              <p className="text-xs text-foreground-muted max-w-sm mx-auto">
                {searchQuery || filter !== "all"
                  ? "Try clearing your search query or switching filters."
                  : "Start recording your daily credits, udhar given, and borrowings."}
              </p>
              <button
                type="button"
                onClick={() => handleOpenAdd("gave")}
                className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary text-white px-5 py-2 text-xs font-bold shadow-xs hover:bg-primary-strong transition"
              >
                + Record First Entry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map((cust) => {
                const isPositive = cust.netBalance > 0;
                const isNegative = cust.netBalance < 0;
                const isSettled = cust.netBalance === 0;

                const initials = cust.personName
                  .split(" ")
                  .map((w) => w[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                return (
                  <div
                    key={cust.personName}
                    onClick={() => setSelectedCustomer(cust.personName)}
                    className="p-5 rounded-[28px] bg-surface/90 border border-border/80 card-shadow hover:border-primary/40 transition flex flex-col justify-between gap-4 group cursor-pointer"
                  >
                    <div>
                      {/* Customer Head: Avatar, Name, Phone */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-11 w-11 rounded-2xl bg-emerald-500/15 text-[#059669] dark:text-emerald-400 font-display font-bold text-sm flex items-center justify-center shrink-0">
                            {initials || "👤"}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-display font-medium text-sm sm:text-base text-foreground truncate group-hover:text-primary transition">
                              {cust.personName}
                            </h4>
                            {cust.phone ? (
                              <p className="text-[11px] text-foreground-muted font-mono truncate">
                                {cust.phone}
                              </p>
                            ) : (
                              <p className="text-[11px] text-foreground-muted italic">
                                No phone saved
                              </p>
                            )}
                          </div>
                        </div>

                        {/* WhatsApp Action */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendWhatsApp(cust);
                          }}
                          className="h-8 w-8 rounded-full border border-border hover:border-emerald-500/50 bg-surface flex items-center justify-center text-foreground-muted hover:text-[#059669] transition shrink-0"
                          title="Send WhatsApp Reminder"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                        </button>
                      </div>

                      {/* Net Balance Status */}
                      <div className="mt-4 pt-3 border-t border-border/70 flex items-baseline justify-between">
                        <div>
                          <div className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider">
                            {isPositive
                              ? "You Will Get"
                              : isNegative
                              ? "You Will Give"
                              : "Settled"}
                          </div>
                          <div
                            className={`font-display font-medium text-xl sm:text-2xl mt-0.5 ${
                              isPositive
                                ? "text-[#059669] dark:text-emerald-400"
                                : isNegative
                                ? "text-[#EF4444]"
                                : "text-foreground-muted"
                            }`}
                          >
                            {fmt(cust.netBalance)}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-semibold text-foreground-muted block">
                            {cust.pendingCount} pending • {cust.totalCount} total
                          </span>
                          {cust.latestNote && (
                            <span className="text-[11px] text-foreground-sub truncate max-w-[130px] block italic mt-0.5">
                              &ldquo;{cust.latestNote}&rdquo;
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions: View Ledger & + Record */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/70">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomer(cust.personName);
                        }}
                        className="h-8 rounded-full border border-border bg-surface hover:bg-surface-muted text-foreground text-xs font-semibold transition flex items-center justify-center gap-1.5"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                        <span>Ledger</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAdd("gave", cust.personName);
                        }}
                        className="h-8 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition flex items-center justify-center gap-1"
                      >
                        <span>+ Record</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SHARED GROUPS TAB CONTENT */}
      {/* ============================================================== */}
      {subTab === "groups" && (
        <div className="space-y-6">
          {/* Groups KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-[28px] bg-surface/90 border border-border/80 card-shadow space-y-1">
              <span className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                Total Shared Groups
              </span>
              <div className="font-display font-medium text-2xl sm:text-3xl text-foreground">
                {expenseGroups.length}
              </div>
              <p className="text-[11px] text-foreground-muted">Roommates, trips, office teams.</p>
            </div>

            <div className="p-5 rounded-[28px] bg-surface/90 border border-border/80 card-shadow space-y-1">
              <span className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                Total Connected Friends
              </span>
              <div className="font-display font-medium text-2xl sm:text-3xl text-primary">
                {expenseGroups.reduce((acc, g) => acc + (g.members?.length || 0), 0)}
              </div>
              <p className="text-[11px] text-foreground-muted">Members split across all your groups.</p>
            </div>

            <div className="p-5 rounded-[28px] bg-surface/90 border border-border/80 card-shadow space-y-1">
              <span className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                Instant Settlement
              </span>
              <div className="font-display font-medium text-2xl sm:text-3xl text-emerald-600 dark:text-emerald-400">
                100% UPI Ready
              </div>
              <p className="text-[11px] text-foreground-muted">Zero math, automatic balance solver.</p>
            </div>
          </div>

          {/* Groups Cards Grid */}
          {loadingGroups ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-5 rounded-[28px] bg-surface/90 border border-border/80 card-shadow space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : expenseGroups.length === 0 ? (
            <div className="rounded-[28px] bg-surface/90 border border-border/80 card-shadow p-12 text-center space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto text-2xl font-bold">
                👥
              </div>
              <h3 className="font-display font-medium text-lg text-foreground">
                No Shared Groups Yet
              </h3>
              <p className="text-xs text-foreground-muted max-w-sm mx-auto">
                Create a group for your apartment, holiday trip, or office lunch and invite friends with a code.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinGroupModal(true)}
                  className="rounded-full border border-border bg-surface px-5 py-2 text-xs font-semibold text-foreground hover:bg-surface-muted transition"
                >
                  Join with Code
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(true)}
                  className="rounded-full bg-primary text-white px-5 py-2 text-xs font-bold shadow-xs hover:bg-primary-strong transition"
                >
                  + Create Group
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expenseGroups.map((group) => {
                return (
                  <div
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    className="p-5 rounded-[28px] bg-surface/90 border border-border/80 card-shadow hover:border-primary/40 transition flex flex-col justify-between gap-4 cursor-pointer group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[10px] font-bold">
                            {group.category || "General"}
                          </span>
                          <h4 className="font-display font-medium text-lg text-foreground mt-1.5 group-hover:text-primary transition">
                            {group.name}
                          </h4>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setGroupToDeleteId(group.id);
                          }}
                          className="p-1 rounded-full text-foreground-muted hover:text-red-500 hover:bg-red-500/10 transition"
                          title="Delete Group"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>

                      {/* Members Avatars */}
                      <div className="mt-4 flex items-center gap-1.5 flex-wrap">
                        {group.members && group.members.length > 0 ? (
                          group.members.map((m) => (
                            <span
                              key={m.id || m.name}
                              className="rounded-full bg-surface-muted border border-border px-2.5 py-0.5 text-[11px] font-semibold text-foreground-sub"
                            >
                              {m.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-foreground-muted italic">1 Member (You)</span>
                        )}
                      </div>
                    </div>

                    {/* Invite Code & Action */}
                    <div className="pt-3 border-t border-border/70 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-foreground-muted">Code:</span>
                        <code className="font-mono text-xs font-bold text-foreground px-2 py-0.5 rounded bg-surface-muted">
                          {group.inviteCode || "TK-" + group.id.slice(0, 4).toUpperCase()}
                        </code>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyCode(group.inviteCode || "TK-" + group.id.slice(0, 4).toUpperCase());
                        }}
                        className="rounded-full px-3 py-1 text-xs font-semibold bg-surface-muted hover:bg-border transition text-foreground"
                      >
                        {copiedCode === (group.inviteCode || "TK-" + group.id.slice(0, 4).toUpperCase())
                          ? "Copied!"
                          : "Copy Invite"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: ADD KHATA ENTRY (COTERIE SPEC) */}
      {/* ============================================================== */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Record Khata Entry"
        description="Track money given (udhar) or money received in your digital ledger."
        maxWidth="lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-3">
          {/* Switcher: You Gave vs You Got with App Semantic Colors */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setKhataType("gave")}
              className={`h-9 rounded-[10px] text-xs sm:text-[13px] font-medium transition-all flex items-center justify-center gap-1.5 select-none ${
                khataType === "gave"
                  ? "bg-[#EF4444] text-white font-bold shadow-sm shadow-red-500/25"
                  : "bg-[#EAF3EE] dark:bg-[#14291F] text-[#3E5A4A] dark:text-[#A9C4B6] shadow-[inset_0_0_0_1px_rgba(18,60,38,0.1)] hover:text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-950/20"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m18 15-6-6-6 6" />
              </svg>
              <span>You Gave (Udhar Diya)</span>
            </button>

            <button
              type="button"
              onClick={() => setKhataType("took")}
              className={`h-9 rounded-[10px] text-xs sm:text-[13px] font-medium transition-all flex items-center justify-center gap-1.5 select-none ${
                khataType === "took"
                  ? "bg-[#059669] text-white font-bold shadow-sm shadow-emerald-500/25"
                  : "bg-[#EAF3EE] dark:bg-[#14291F] text-[#3E5A4A] dark:text-[#A9C4B6] shadow-[inset_0_0_0_1px_rgba(18,60,38,0.1)] hover:text-[#059669] hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m6 9 6 6 6-6" />
              </svg>
              <span>You Got (Udhar Liya)</span>
            </button>
          </div>

          {/* Quick Customers Suggestions */}
          {customerSummaries.length > 0 && (
            <div className="space-y-1">
              <span className="block text-[11px] font-medium text-foreground-muted">Recent People</span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {customerSummaries.slice(0, 6).map((c) => (
                  <button
                    key={c.personName}
                    type="button"
                    onClick={() => {
                      setKhataPersonName(c.personName);
                      if (c.phone) setKhataPhone(c.phone);
                    }}
                    className={`h-7 px-2.5 rounded-full text-[11px] font-semibold transition shrink-0 ${
                      khataPersonName.toLowerCase() === c.personName.toLowerCase()
                        ? "bg-primary text-white font-bold"
                        : "bg-[#EAF3EE] dark:bg-[#14291F] text-[#4B6858] hover:text-[#102117]"
                    }`}
                  >
                    {c.personName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Person Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ModalField label="Person / Customer Name">
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={khataPersonName}
                onChange={(e) => setKhataPersonName(e.target.value)}
                className="h-9 w-full rounded-[10px] bg-[#EAF3EE] dark:bg-[#14291F] text-[#14231A] dark:text-[#F1FBF6] placeholder:text-[#6B8B79]/60 px-3 text-xs sm:text-[13px] font-medium border-0 shadow-[inset_0_0_0_1px_rgba(18,60,38,0.12)] focus:outline-none focus:shadow-[inset_0_0_0_2px_#059669] transition"
              />
            </ModalField>

            <ModalField label="Phone Number (Optional)">
              <input
                type="tel"
                placeholder="e.g. +91 9876543210"
                value={khataPhone}
                onChange={(e) => setKhataPhone(e.target.value)}
                className="h-9 w-full rounded-[10px] bg-[#EAF3EE] dark:bg-[#14291F] text-[#14231A] dark:text-[#F1FBF6] placeholder:text-[#6B8B79]/60 px-3 text-xs sm:text-[13px] font-medium border-0 shadow-[inset_0_0_0_1px_rgba(18,60,38,0.12)] focus:outline-none focus:shadow-[inset_0_0_0_2px_#059669] transition"
              />
            </ModalField>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ModalField label="Amount (₹)">
              <input
                type="number"
                step="any"
                required
                placeholder="e.g. 1200"
                value={khataAmount}
                onChange={(e) => setKhataAmount(e.target.value)}
                className="h-9 w-full rounded-[10px] bg-[#EAF3EE] dark:bg-[#14291F] text-[#14231A] dark:text-[#F1FBF6] placeholder:text-[#6B8B79]/60 px-3 text-xs sm:text-[13px] font-medium border-0 shadow-[inset_0_0_0_1px_rgba(18,60,38,0.12)] focus:outline-none focus:shadow-[inset_0_0_0_2px_#059669] transition"
              />
            </ModalField>

            <ModalField label="Date">
              <input
                type="date"
                required
                value={khataDate}
                onChange={(e) => setKhataDate(e.target.value)}
                className="h-9 w-full rounded-[10px] bg-[#EAF3EE] dark:bg-[#14291F] text-[#14231A] dark:text-[#F1FBF6] px-3 text-xs sm:text-[13px] font-medium border-0 shadow-[inset_0_0_0_1px_rgba(18,60,38,0.12)] focus:outline-none focus:shadow-[inset_0_0_0_2px_#059669] transition"
              />
            </ModalField>
          </div>

          {/* Due Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ModalField label="Repayment Due Date (Optional)">
              <input
                type="date"
                value={khataDueDate}
                onChange={(e) => setKhataDueDate(e.target.value)}
                className="h-9 w-full rounded-[10px] bg-[#EAF3EE] dark:bg-[#14291F] text-[#14231A] dark:text-[#F1FBF6] px-3 text-xs sm:text-[13px] font-medium border-0 shadow-[inset_0_0_0_1px_rgba(18,60,38,0.12)] focus:outline-none focus:shadow-[inset_0_0_0_2px_#059669] transition"
              />
            </ModalField>

            <ModalField label="Notes / Item Details">
              <input
                type="text"
                placeholder="e.g. Dinner bill, Grocery advance"
                value={khataNotes}
                onChange={(e) => setKhataNotes(e.target.value)}
                className="h-9 w-full rounded-[10px] bg-[#EAF3EE] dark:bg-[#14291F] text-[#14231A] dark:text-[#F1FBF6] placeholder:text-[#6B8B79]/60 px-3 text-xs sm:text-[13px] font-medium border-0 shadow-[inset_0_0_0_1px_rgba(18,60,38,0.12)] focus:outline-none focus:shadow-[inset_0_0_0_2px_#059669] transition"
              />
            </ModalField>
          </div>

          {/* Modal Footer */}
          <ModalFooter
            onCancel={() => setShowAddModal(false)}
            confirmLabel={khataType === "gave" ? "Save Udhar (Gave)" : "Save Payment (Got)"}
            isSubmitting={isAddingKhata}
          />
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 2: CUSTOMER LEDGER STATEMENT MODAL */}
      {/* ============================================================== */}
      <Modal
        isOpen={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer ? `${selectedCustomer}'s Ledger` : "Customer Ledger"}
        description={
          activeCustomerSummary?.phone
            ? `Phone: ${activeCustomerSummary.phone} • ${activeCustomerEntries.length} total entries recorded`
            : `${activeCustomerEntries.length} total entries recorded in cloud ledger`
        }
        maxWidth="xl"
      >
        <div className="space-y-4">
          {/* Summary Strip */}
          {activeCustomerSummary && (
            <div className="p-4 rounded-2xl bg-surface-muted flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-border">
              <div>
                <span className="text-[11px] font-bold text-foreground-muted uppercase">
                  Net Account Balance
                </span>
                <div
                  className={`font-display font-medium text-2xl mt-0.5 ${
                    activeCustomerSummary.netBalance > 0
                      ? "text-[#059669] dark:text-emerald-400"
                      : activeCustomerSummary.netBalance < 0
                      ? "text-[#EF4444]"
                      : "text-foreground"
                  }`}
                >
                  {activeCustomerSummary.netBalance > 0
                    ? `You Will Get ${fmt(activeCustomerSummary.netBalance)}`
                    : activeCustomerSummary.netBalance < 0
                    ? `You Will Give ${fmt(activeCustomerSummary.netBalance)}`
                    : "Account Settled (₹0)"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(activeCustomerSummary)}
                  className="rounded-full px-4 py-2 text-xs font-bold bg-[#059669] text-white hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-xs"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>WhatsApp Reminder</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleOpenAdd("gave", selectedCustomer || "");
                  }}
                  className="rounded-full px-4 py-2 text-xs font-bold bg-[#0E1F16] text-white hover:bg-black transition shadow-xs dark:bg-emerald-400 dark:text-emerald-950"
                >
                  + Add Entry
                </button>
              </div>
            </div>
          )}

          {/* List of Entries */}
          <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1 scrollbar-none divide-y divide-border/50">
            {activeCustomerEntries.length === 0 ? (
              <p className="text-xs text-foreground-muted text-center py-6">No entries recorded.</p>
            ) : (
              activeCustomerEntries.map((entry) => {
                const isGave = entry.type === "gave";
                const isSettled = entry.status === "settled";

                return (
                  <div
                    key={entry.id}
                    className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold ${
                            isGave ? "text-[#EF4444]" : "text-[#059669] dark:text-emerald-400"
                          }`}
                        >
                          {isGave ? "You Gave" : "You Got"}
                        </span>
                        <span className="text-foreground-muted font-mono">{entry.date}</span>
                        {entry.dueDate && (
                          <span className="text-[10px] text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded font-medium">
                            Due: {entry.dueDate}
                          </span>
                        )}
                      </div>
                      {entry.notes && (
                        <p className="text-foreground-sub truncate mt-0.5 italic">{entry.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`font-display font-medium text-sm sm:text-base tabular-nums ${
                          isGave ? "text-[#EF4444]" : "text-[#059669] dark:text-emerald-400"
                        }`}
                      >
                        {isGave ? `-${fmt(entry.amount)}` : `+${fmt(entry.amount)}`}
                      </span>

                      {/* Status Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(entry.id)}
                        disabled={isToggling}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                          isSettled
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
                        }`}
                        title="Click to toggle Pending / Settled status"
                      >
                        {isSettled ? "✓ Settled" : "⏳ Pending"}
                      </button>

                      {/* Delete Entry */}
                      <button
                        type="button"
                        onClick={() => setDeleteTargetId(entry.id)}
                        className="p-1 rounded-full text-foreground-muted hover:text-red-500 transition"
                        title="Delete entry"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 3: CREATE GROUP */}
      {/* ============================================================== */}
      <Modal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        title="Create Shared Group"
        description="Share & split expenses with roommates, trip buddies, or colleagues."
        maxWidth="md"
      >
        <form onSubmit={handleCreateGroupSubmit} className="space-y-3">
          <ModalField label="Group Name">
            <input
              type="text"
              required
              placeholder="e.g. Goa Trip 2026, Flat 402, Office Lunch"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="h-9 w-full rounded-[10px] bg-[#EAF3EE] dark:bg-[#14291F] text-[#14231A] dark:text-[#F1FBF6] placeholder:text-[#6B8B79]/60 px-3 text-xs sm:text-[13px] font-medium border-0 shadow-[inset_0_0_0_1px_rgba(18,60,38,0.12)] focus:outline-none focus:shadow-[inset_0_0_0_2px_#059669] transition"
            />
          </ModalField>

          <ModalField label="Category">
            <select
              value={newGroupCategory}
              onChange={(e) => setNewGroupCategory(e.target.value as ExpenseGroup["category"])}
              className="h-9 w-full rounded-[10px] bg-[#EAF3EE] dark:bg-[#14291F] text-[#14231A] dark:text-[#F1FBF6] px-3 text-xs sm:text-[13px] font-medium border-0 shadow-[inset_0_0_0_1px_rgba(18,60,38,0.12)] focus:outline-none focus:shadow-[inset_0_0_0_2px_#059669] transition"
            >
              <option value="Home & Utilities">🏠 Home & Utilities</option>
              <option value="Travel">✈️ Travel</option>
              <option value="Event & Party">🎉 Event & Party</option>
              <option value="Office & Work">💼 Office & Work</option>
              <option value="Other">📦 Other</option>
            </select>
          </ModalField>

          <ModalFooter
            onCancel={() => setShowCreateGroupModal(false)}
            confirmLabel="Create Group"
            isSubmitting={isCreatingGroup}
          />
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 4: JOIN GROUP WITH CODE */}
      {/* ============================================================== */}
      <Modal
        isOpen={showJoinGroupModal}
        onClose={() => setShowJoinGroupModal(false)}
        title="Join Group with Code"
        description="Enter the 6-character invite code shared by your friend."
        maxWidth="sm"
      >
        <form onSubmit={handleJoinGroupSubmit} className="space-y-3">
          <ModalField label="6-Digit Invite Code">
            <input
              type="text"
              required
              maxLength={8}
              placeholder="e.g. TK-GOA1"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
              className="h-10 w-full text-center uppercase tracking-widest font-mono font-bold text-base rounded-[10px] bg-[#EAF3EE] dark:bg-[#14291F] text-[#14231A] dark:text-[#F1FBF6] placeholder:text-[#6B8B79]/60 px-3 border-0 shadow-[inset_0_0_0_1px_rgba(18,60,38,0.12)] focus:outline-none focus:shadow-[inset_0_0_0_2px_#059669] transition"
            />
          </ModalField>

          <ModalFooter
            onCancel={() => setShowJoinGroupModal(false)}
            confirmLabel="Join Group"
            isSubmitting={isJoiningGroup}
          />
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 5: DELETE ENTRY CONFIRMATION */}
      {/* ============================================================== */}
      <Modal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        title="Delete Khata Record?"
        description="Are you sure you want to permanently remove this transaction from the ledger?"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDeleteTargetId(null)}
              className="rounded-full px-5 py-2 text-xs sm:text-[13px] font-semibold border border-border bg-surface text-foreground hover:bg-surface-muted transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={isDeletingKhata}
              className="rounded-full px-6 py-2 text-xs sm:text-[13px] font-bold bg-red-600 hover:bg-red-700 text-white transition shadow-xs disabled:opacity-50 inline-flex items-center gap-2"
            >
              {isDeletingKhata && (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              )}
              <span>Delete</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 6: DELETE GROUP CONFIRMATION */}
      {/* ============================================================== */}
      <Modal
        isOpen={Boolean(groupToDeleteId)}
        onClose={() => setGroupToDeleteId(null)}
        title="Delete Shared Group?"
        description="Are you sure you want to delete this group? All shared expenses inside this group will be deleted."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setGroupToDeleteId(null)}
              className="rounded-full px-5 py-2 text-xs sm:text-[13px] font-semibold border border-border bg-surface text-foreground hover:bg-surface-muted transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteGroupConfirm}
              disabled={isDeletingGroup}
              className="rounded-full px-6 py-2 text-xs sm:text-[13px] font-bold bg-red-600 hover:bg-red-700 text-white transition shadow-xs disabled:opacity-50 inline-flex items-center gap-2"
            >
              {isDeletingGroup && (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              )}
              <span>Delete Group</span>
            </button>
          </div>
        </div>
      </Modal>
      {/* MODAL 7: VIEW GROUP DETAILS */}
      <Modal
        isOpen={Boolean(selectedGroup)}
        onClose={() => setSelectedGroup(null)}
        title={selectedGroup?.name || "Group Details"}
        description={`Category: ${selectedGroup?.category || "General"} • ${selectedGroup?.members?.length || 1} members`}
        maxWidth="md"
      >
        {selectedGroup && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-surface-muted border border-border flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-foreground-muted uppercase">Invite Code</span>
                <div className="font-mono font-bold text-lg text-foreground mt-0.5">
                  {selectedGroup.inviteCode || "TK-" + selectedGroup.id.slice(0, 4).toUpperCase()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopyCode(selectedGroup.inviteCode || "TK-" + selectedGroup.id.slice(0, 4).toUpperCase())}
                className="rounded-full px-4 py-1.5 text-xs font-bold bg-[#0E1F16] text-white hover:bg-black transition shadow-xs dark:bg-emerald-400 dark:text-emerald-950"
              >
                {copiedCode === (selectedGroup.inviteCode || "TK-" + selectedGroup.id.slice(0, 4).toUpperCase()) ? "Copied!" : "Copy Code"}
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-foreground-muted uppercase">Group Members</span>
              <div className="divide-y divide-border/60 border border-border rounded-2xl p-2 bg-surface">
                {selectedGroup.members && selectedGroup.members.length > 0 ? (
                  selectedGroup.members.map((m) => (
                    <div key={m.id || m.name} className="py-2 px-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">{m.name}</span>
                      <span className="text-foreground-muted font-mono">{m.phone || "Joined"}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-2 px-2 text-xs text-foreground-muted italic">You are the only member. Share the invite code to add friends!</div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  const id = selectedGroup.id;
                  setSelectedGroup(null);
                  setGroupToDeleteId(id);
                }}
                className="text-xs font-semibold text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-full transition"
              >
                Delete Group
              </button>
              <button
                type="button"
                onClick={() => setSelectedGroup(null)}
                className="rounded-full px-5 py-2 text-xs font-bold bg-[#0E1F16] text-white hover:bg-black transition shadow-xs dark:bg-emerald-400 dark:text-emerald-950"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
