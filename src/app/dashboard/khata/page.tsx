"use client";

import { Suspense, useEffect, useRef, useState, useMemo, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Modal, ModalField, ModalFooter } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomerLedgerDrawer } from "@/components/khata/customer-ledger-drawer";
import { GroupDrawer } from "@/components/groups/group-drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { avatarTint, initialsOf } from "@/lib/avatar";
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

/** Opens the add-entry form when arriving from the header's "+ New → Khata entry" (?new=gave). */
function OpenNewFromQuery({ onOpen }: { onOpen: (type: KhataType) => void }) {
  const params = useSearchParams();
  const router = useRouter();
  const want = params.get("new");
  // Open once per arrival; re-renders before the URL is cleaned must not reset the form.
  const handled = useRef(false);
  useEffect(() => {
    if (want !== "gave" && want !== "took") {
      handled.current = false;
      return;
    }
    if (handled.current) return;
    handled.current = true;
    onOpen(want);
    router.replace("/dashboard/khata", { scroll: false });
  }, [want, onOpen, router]);
  return null;
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
        members: [],
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

  const shortDate = (d: string) => {
    const [y, m, day] = (d || "").slice(0, 10).split("-").map(Number);
    if (!y) return d || "—";
    return new Date(y, m - 1, day).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const openCount = customerSummaries.filter((c) => c.pendingCount > 0).length;
  const ownedGroups = expenseGroups.filter((g) => g.isOwner !== false).length;
  const memberTotal = expenseGroups.reduce((acc, g) => acc + (g.members?.length || 0), 0);

  const btnGhost =
    "inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-border bg-surface px-[18px] text-[16px] font-bold text-foreground shadow-xs transition hover:bg-surface-muted active:brightness-[0.93]";
  const btnDark =
    "inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[var(--primary)] px-[18px] text-[16px] font-bold text-[var(--on-primary)] shadow-xs transition hover:bg-[var(--primary-strong)] active:brightness-[0.93]";
  const btnXs =
    "inline-flex h-8 items-center justify-center gap-1.5 rounded-[10px] border border-border bg-surface px-[11px] text-[14px] font-bold text-foreground transition hover:bg-surface-muted";
  const chipCls = (on: boolean) =>
    `inline-flex h-[34px] items-center whitespace-nowrap rounded-full border px-[13px] text-[14px] font-bold transition ${
      on ? "border-transparent bg-foreground text-background" : "border-border bg-surface text-foreground hover:border-[var(--line-2)]"
    }`;
  const card = "rounded-[22px] border border-border bg-surface p-5 shadow-xs";
  const tile = "min-w-0 rounded-[16px] border border-border bg-surface px-4 py-3";
  const tileLabel = "text-[14px] font-bold text-foreground-muted";
  const tileValue = "truncate text-[20px] lg:text-[24px] font-extrabold tracking-[-0.035em] num";

  const TABS: { id: KhataSubTab; label: string; n: number }[] = [
    { id: "personal", label: "People", n: customerSummaries.length },
    { id: "groups", label: "Shared groups", n: expenseGroups.length },
  ];

  return (
    <div className="space-y-6 pb-16">
      <Suspense fallback={null}>
        <OpenNewFromQuery onOpen={handleOpenAdd} />
      </Suspense>
      {/* Header: breadcrumb, title, summary line, actions */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[14px] font-[650] text-foreground-muted">
            <span>Money</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9.5 6 6 6-6 6" />
            </svg>
            <span className="text-foreground">Khata Ledger</span>
          </nav>
          <h1 className="text-[30px] lg:text-[clamp(1.875rem,2.5vw,2.375rem)] font-extrabold tracking-[-0.04em] leading-[1.08] text-foreground">
            Khata Ledger
          </h1>
          <p className="text-[16px] font-medium text-foreground-muted">
            {subTab === "personal" ? (
              <>
                <b className="font-bold text-foreground">{customerSummaries.length}</b> {customerSummaries.length === 1 ? "person" : "people"} ·{" "}
                <b className="font-bold text-[var(--good)]">{fmt(totalYouWillGet)}</b> to receive ·{" "}
                <b className="font-bold text-[var(--bad)]">{fmt(totalYouWillGive)}</b> to pay
              </>
            ) : (
              <>
                <b className="font-bold text-foreground">{expenseGroups.length}</b> shared {expenseGroups.length === 1 ? "group" : "groups"} with{" "}
                <b className="font-bold text-foreground">{memberTotal}</b> members
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {subTab === "personal" ? (
            <>
              <button type="button" onClick={() => handleOpenAdd("took")} className={btnGhost} title="Record money you took or received">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--good)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 5v14M6 13l6 6 6-6" />
                </svg>
                You got
              </button>
              <button type="button" onClick={() => handleOpenAdd("gave")} className={btnGhost} title="Record money you gave to someone">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--bad)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 19V5M6 11l6-6 6 6" />
                </svg>
                You gave
              </button>
              <button type="button" onClick={() => handleOpenAdd("gave")} className={btnDark}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New entry
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setShowJoinGroupModal(true)} className={btnGhost}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
                </svg>
                Join with code
              </button>
              <button type="button" onClick={() => setShowCreateGroupModal(true)} className={btnDark}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New group
              </button>
            </>
          )}
        </div>
      </header>

      {/* Underlined tabs with counts */}
      <div role="tablist" aria-label="Khata views" className="flex gap-1 border-b border-border">
        {TABS.map((tab) => {
          const on = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setSubTab(tab.id)}
              className={`relative inline-flex items-center gap-[7px] rounded-t-[10px] px-3.5 pt-2.5 pb-3 text-[16px] font-bold transition ${
                on ? "text-foreground" : "text-foreground-muted hover:text-foreground"
              }`}
            >
              {tab.label} · {tab.n}
              {on && <span className="absolute inset-x-2 -bottom-px h-[3px] rounded-t-[3px] bg-foreground" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* PEOPLE TAB */}
      {/* ============================================================== */}
      {subTab === "personal" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="relative min-w-[220px] max-w-[380px] flex-[1_1_260px]">
              <span className="sr-only">Search people</span>
              <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>
              <input
                type="search"
                placeholder="Name, phone or note"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-[42px] w-full rounded-[12px] border border-border bg-surface pl-10 pr-3 text-[15px] text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-foreground"
              />
            </label>
            <span className="flex-1" />
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar" role="group" aria-label="Show">
              {(
                [
                  { id: "all", label: "Everyone" },
                  { id: "gave", label: "You will get" },
                  { id: "took", label: "You will give" },
                  { id: "settled", label: "Settled" },
                ] as const
              ).map((f) => (
                <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)} className={chipCls(filter === f.id)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary tiles */}
          <dl className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <div className={tile}>
              <dt className={tileLabel}>You will get</dt>
              <dd className={`${tileValue} text-[var(--good)]`}>{loadingKhata ? <Skeleton className="mt-1 h-7 w-24" /> : fmt(totalYouWillGet)}</dd>
            </div>
            <div className={tile}>
              <dt className={tileLabel}>You will give</dt>
              <dd className={`${tileValue} text-[var(--bad)]`}>{loadingKhata ? <Skeleton className="mt-1 h-7 w-24" /> : fmt(totalYouWillGive)}</dd>
            </div>
            <div className={`${tile} col-span-2 lg:col-span-1`}>
              <dt className={tileLabel}>Net · {openCount} open</dt>
              <dd
                className={`${tileValue} ${
                  netOverallBalance > 0 ? "text-[var(--good)]" : netOverallBalance < 0 ? "text-[var(--bad)]" : "text-foreground"
                }`}
              >
                {loadingKhata ? <Skeleton className="mt-1 h-7 w-24" /> : `${netOverallBalance > 0 ? "+" : netOverallBalance < 0 ? "−" : ""}${fmt(netOverallBalance)}`}
              </dd>
            </div>
          </dl>

          {/* People table */}
          <section className={card} aria-labelledby="khata-people-title">
            <header className="mb-2">
              <h2 id="khata-people-title" className="text-[17px] font-extrabold tracking-[-0.015em] text-foreground">
                People
              </h2>
              <p className="mt-0.5 text-[14px] font-medium text-foreground-muted">Most recent first · open a row for the full ledger</p>
            </header>

            {loadingKhata ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 px-4 py-9 text-center text-foreground-muted">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="9" cy="8.5" r="3.5" />
                  <path d="M3 19.5c.6-3.2 3-5 6-5s5.4 1.8 6 5M15.5 5.2a3.5 3.5 0 0 1 0 6.6M17.5 14.8c1.8.6 3 2.2 3.5 4.7" />
                </svg>
                <p className="font-bold text-foreground">{searchQuery || filter !== "all" ? "No one matches" : "No khata entries yet"}</p>
                <p className="text-[15px]">
                  {searchQuery || filter !== "all"
                    ? "Try a different name or phone, or switch the filter."
                    : "Record money you gave or got, and each person shows up here."}
                </p>
                <button type="button" onClick={() => handleOpenAdd("gave")} className="mt-2 inline-flex h-[38px] items-center rounded-[12px] border border-border bg-surface px-3.5 text-[14px] font-bold text-foreground hover:bg-surface-muted">
                  New entry
                </button>
              </div>
            ) : (
              <table className="w-full border-separate border-spacing-0 text-[15px]">
                <thead className="hidden md:table-header-group">
                  <tr className="text-left text-[13px] font-[750] tracking-[0.04em] text-foreground-muted">
                    <th scope="col" className="border-b border-border px-3 py-2.5">Name</th>
                    <th scope="col" className="hidden lg:table-cell border-b border-border px-3 py-2.5">Status</th>
                    <th scope="col" className="hidden lg:table-cell border-b border-border px-3 py-2.5">Entries</th>
                    <th scope="col" className="border-b border-border px-3 py-2.5 text-right">Balance</th>
                    <th scope="col" className="hidden md:table-cell border-b border-border px-3 py-2.5 text-right">Last entry</th>
                    <th scope="col" className="border-b border-border px-1 py-2.5">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((cust) => {
                    const isPositive = cust.netBalance > 0;
                    const isNegative = cust.netBalance < 0;
                    const statusLabel = isPositive ? "You will get" : isNegative ? "You will give" : "Settled";
                    const pillTone = isPositive ? "pill--good" : isNegative ? "pill--bad" : "pill--faint";
                    return (
                      <tr
                        key={cust.personName}
                        tabIndex={0}
                        onClick={() => setSelectedCustomer(cust.personName)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") setSelectedCustomer(cust.personName);
                        }}
                        className="group cursor-pointer hover:bg-[var(--surface-2)] focus:outline-none focus-visible:bg-[var(--surface-2)]"
                      >
                        {/* w-full + max-w-0: the name column takes the leftover width and truncates,
                            instead of its full text pushing the table past the card edge. */}
                        <td className="w-full max-w-0 border-b border-border px-3 py-[11px]">
                          <span className="flex min-w-0 items-center gap-3">
                            <span
                              className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-full text-[14px] font-extrabold tracking-[0.02em] text-[#1e1724]"
                              style={{ background: avatarTint(cust.personName) }}
                              aria-hidden="true"
                            >
                              {initialsOf(cust.personName)}
                            </span>
                            <span className="min-w-0 flex-1">
                              <b className="block truncate font-bold text-foreground">{cust.personName}</b>
                              <small className="block truncate text-[14px] text-foreground-muted">
                                {cust.phone || "No phone saved"}
                                {cust.latestNote ? ` · ${cust.latestNote}` : ""}
                              </small>
                            </span>
                          </span>
                        </td>
                        <td className="hidden lg:table-cell border-b border-border px-3 py-[11px]">
                          <span className={`pill ${pillTone}`}>
                            <i />
                            {statusLabel}
                          </span>
                        </td>
                        <td className="hidden lg:table-cell border-b border-border px-3 py-[11px] whitespace-nowrap font-[650] text-foreground-sub">
                          {cust.pendingCount} pending · {cust.totalCount} total
                        </td>
                        <td
                          className={`border-b border-border px-3 py-[11px] text-right font-extrabold whitespace-nowrap num ${
                            isPositive ? "text-[var(--good)]" : isNegative ? "text-[var(--bad)]" : "text-foreground-muted"
                          }`}
                        >
                          {isPositive ? "+" : isNegative ? "−" : ""}
                          {fmt(cust.netBalance)}
                        </td>
                        <td className="hidden md:table-cell border-b border-border px-3 py-[11px] text-right whitespace-nowrap text-foreground-muted">
                          {shortDate(cust.lastDate)}
                        </td>
                        <td className="border-b border-border px-1 py-[11px] whitespace-nowrap">
                          <span className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendWhatsApp(cust);
                              }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] text-foreground-muted transition hover:bg-[color-mix(in_srgb,var(--good)_14%,transparent)] hover:text-[var(--good)]"
                              title="Send WhatsApp reminder"
                              aria-label={`Send WhatsApp reminder to ${cust.personName}`}
                            >
                              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M4.5 19.5 5.6 16A8 8 0 1 1 8.4 18.6z" />
                                <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-1.8-1-1 .7a3.6 3.6 0 0 1-1.9-1.9l.7-1-1-1.8z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAdd("gave", cust.personName);
                              }}
                              className={btnXs}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                                <path d="M12 5v14M5 12h14" />
                              </svg>
                              Record
                            </button>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}

      {/* ============================================================== */}
      {/* SHARED GROUPS TAB */}
      {/* ============================================================== */}
      {subTab === "groups" && (
        <div className="space-y-4">
          <dl className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <div className={tile}>
              <dt className={tileLabel}>Groups</dt>
              <dd className={`${tileValue} text-foreground`}>{loadingGroups ? <Skeleton className="mt-1 h-7 w-12" /> : expenseGroups.length}</dd>
            </div>
            <div className={tile}>
              <dt className={tileLabel}>Members</dt>
              <dd className={`${tileValue} text-foreground`}>{loadingGroups ? <Skeleton className="mt-1 h-7 w-12" /> : memberTotal}</dd>
            </div>
            <div className={`${tile} col-span-2 lg:col-span-1`}>
              <dt className={tileLabel}>Created by you</dt>
              <dd className={`${tileValue} text-foreground`}>{loadingGroups ? <Skeleton className="mt-1 h-7 w-12" /> : ownedGroups}</dd>
            </div>
          </dl>

          {loadingGroups ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-44 rounded-[22px]" />
              ))}
            </div>
          ) : expenseGroups.length === 0 ? (
            <section className={`${card} flex flex-col items-center gap-1.5 px-4 py-9 text-center text-foreground-muted`}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="8.5" r="3.5" />
                <path d="M3 19.5c.6-3.2 3-5 6-5s5.4 1.8 6 5M15.5 5.2a3.5 3.5 0 0 1 0 6.6M17.5 14.8c1.8.6 3 2.2 3.5 4.7" />
              </svg>
              <p className="font-bold text-foreground">No shared groups yet</p>
              <p className="text-[15px]">Create a group for your flat, a trip or office lunches, then invite friends with the code.</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => setShowJoinGroupModal(true)} className="inline-flex h-[38px] items-center rounded-[12px] border border-border bg-surface px-3.5 text-[14px] font-bold text-foreground hover:bg-surface-muted">
                  Join with code
                </button>
                <button type="button" onClick={() => setShowCreateGroupModal(true)} className="inline-flex h-[38px] items-center rounded-[12px] bg-[var(--primary)] px-3.5 text-[14px] font-bold text-[var(--on-primary)]">
                  New group
                </button>
              </div>
            </section>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expenseGroups.map((group) => {
                const code = group.inviteCode || "TK-" + group.id.slice(0, 4).toUpperCase();
                return (
                  <article
                    key={group.id}
                    tabIndex={0}
                    onClick={() => setSelectedGroup(group)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setSelectedGroup(group);
                    }}
                    className={`${card} group flex cursor-pointer flex-col justify-between gap-4 transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="pill pill--teal">
                            <i />
                            {group.category || "General"}
                          </span>
                          <h3 className="mt-2 truncate text-[17px] font-extrabold tracking-[-0.015em] text-foreground">{group.name}</h3>
                          <p className="text-[14px] font-medium text-foreground-muted">
                            {group.members?.length || 1} {(group.members?.length || 1) === 1 ? "member" : "members"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setGroupToDeleteId(group.id);
                          }}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-foreground-muted transition hover:bg-[color-mix(in_srgb,var(--rose)_14%,transparent)] hover:text-[var(--bad)]"
                          title="Delete group"
                          aria-label={`Delete ${group.name}`}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />
                          </svg>
                        </button>
                      </div>

                      {/* Member avatars (Kesta avatar stack) */}
                      <div className="mt-3 flex items-center">
                        {(group.members?.length ? group.members : [{ id: "you", name: "You" }]).slice(0, 6).map((m, i) => (
                          <span
                            key={m.id || m.name}
                            title={m.name}
                            className={`inline-grid h-8 w-8 place-items-center rounded-full text-[12px] font-extrabold text-[#1e1724] shadow-[0_0_0_2px_var(--surface)] ${i > 0 ? "-ml-2" : ""}`}
                            style={{ background: avatarTint(m.name) }}
                          >
                            {initialsOf(m.name)}
                          </span>
                        ))}
                        {(group.members?.length || 0) > 6 && (
                          <span className="-ml-2 inline-grid h-8 w-8 place-items-center rounded-full bg-[var(--well)] text-[12px] font-extrabold text-foreground shadow-[0_0_0_2px_var(--surface)]">
                            +{group.members.length - 6}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                      <span className="flex items-center gap-2 text-[14px] text-foreground-muted">
                        Code
                        <code className="rounded-[8px] bg-[var(--well)] px-2 py-0.5 font-mono text-[13px] font-bold text-foreground">{code}</code>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyCode(code);
                        }}
                        className={btnXs}
                      >
                        {copiedCode === code ? "Copied!" : "Copy invite"}
                      </button>
                    </div>
                  </article>
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
              className={`h-9.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all flex items-center justify-center gap-1.5 select-none ${
                khataType === "gave"
                  ? "bg-rose-500 text-white shadow-xs"
                  : "bg-black/[0.03] dark:bg-white/[0.04] text-foreground-muted hover:text-foreground border border-black/[0.04] dark:border-white/10"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m18 15-6-6-6 6" />
              </svg>
              <span>↑ You Gave (Udhar Diya)</span>
            </button>

            <button
              type="button"
              onClick={() => setKhataType("took")}
              className={`h-9.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all flex items-center justify-center gap-1.5 select-none ${
                khataType === "took"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-black/[0.03] dark:bg-white/[0.04] text-foreground-muted hover:text-foreground border border-black/[0.04] dark:border-white/10"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m6 9 6 6 6-6" />
              </svg>
              <span>↓ You Got (Udhar Liya)</span>
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
                    className={`h-7 px-3 rounded-full text-[11px] font-semibold transition shrink-0 ${
                      khataPersonName.toLowerCase() === c.personName.toLowerCase()
                        ? "bg-foreground text-background dark:bg-emerald-400 dark:text-emerald-950 font-bold shadow-xs"
                        : "bg-black/[0.03] dark:bg-white/[0.04] text-foreground-muted hover:text-foreground border border-black/[0.04] dark:border-white/10"
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
                className="h-9.5 w-full rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-foreground placeholder:text-foreground-muted/50 px-3 text-xs sm:text-[13px] font-medium border border-black/[0.06] dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
              />
            </ModalField>

            <ModalField label="Phone Number (Optional)">
              <input
                type="tel"
                placeholder="e.g. +91 9876543210"
                value={khataPhone}
                onChange={(e) => setKhataPhone(e.target.value)}
                className="h-9.5 w-full rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-foreground placeholder:text-foreground-muted/50 px-3 text-xs sm:text-[13px] font-medium border border-black/[0.06] dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
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
                className="h-9.5 w-full rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-foreground placeholder:text-foreground-muted/50 px-3 text-xs sm:text-[13px] font-bold border border-black/[0.06] dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
              />
            </ModalField>

            <ModalField label="Date">
              <input
                type="date"
                required
                value={khataDate}
                onChange={(e) => setKhataDate(e.target.value)}
                className="h-9.5 w-full rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-foreground px-3 text-xs sm:text-[13px] font-medium border border-black/[0.06] dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
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
                className="h-9.5 w-full rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-foreground px-3 text-xs sm:text-[13px] font-medium border border-black/[0.06] dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
              />
            </ModalField>

            <ModalField label="Notes / Item Details">
              <input
                type="text"
                placeholder="e.g. Dinner bill, Grocery advance"
                value={khataNotes}
                onChange={(e) => setKhataNotes(e.target.value)}
                className="h-9.5 w-full rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-foreground placeholder:text-foreground-muted/50 px-3 text-xs sm:text-[13px] font-medium border border-black/[0.06] dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
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
      {/* DRAWER: LIQUID GLASS CUSTOMER LEDGER (PANE SPEC) */}
      {/* ============================================================== */}
      <CustomerLedgerDrawer
        isOpen={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        customerName={selectedCustomer}
        entries={khataEntries}
        onAddNewEntry={(type, name) => handleOpenAdd(type, name)}
      />

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
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        isWorking={isDeletingKhata}
        title="Delete this khata entry?"
        description="It's removed from this person's ledger for good."
      />

      {/* ============================================================== */}
      {/* MODAL 6: DELETE GROUP CONFIRMATION */}
      {/* ============================================================== */}
      <ConfirmDialog
        isOpen={Boolean(groupToDeleteId)}
        onCancel={() => setGroupToDeleteId(null)}
        onConfirm={handleDeleteGroupConfirm}
        isWorking={isDeletingGroup}
        title="Delete this shared group?"
        description="All expenses and settlements in it are deleted too. This can't be undone."
        confirmLabel="Delete group"
      />
      {/* DRAWER: GROUP DETAILS (Kesta contact-style, animated) */}
      <GroupDrawer
        group={selectedGroup}
        open={Boolean(selectedGroup)}
        onClose={() => setSelectedGroup(null)}
        onCopyCode={handleCopyCode}
        copiedCode={copiedCode}
        onDelete={(id) => {
          setSelectedGroup(null);
          setGroupToDeleteId(id);
        }}
      />
    </div>
  );
}
