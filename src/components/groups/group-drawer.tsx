"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Drawer, useCountUp } from "@/components/ui/drawer";
import { avatarTint, initialsOf } from "@/lib/avatar";
import type { ExpenseGroup } from "@/store/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const inr = (v: number) => `₹${Math.abs(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function shortDate(d: string) {
  const [y, m, day] = (d || "").slice(0, 10).split("-").map(Number);
  if (!y) return d || "—";
  return new Date(y, m - 1, day).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** What the current user is owed (+) or owes (−) in a group, from its expenses. */
function myNet(group: ExpenseGroup) {
  const me = group.currentMemberName ?? group.members.find((m) => m.isCurrentUser)?.name ?? "You";
  let net = 0;
  for (const e of group.expenses ?? []) {
    if (e.paidBy === me) net += e.totalAmount;
    for (const s of e.splits) if (s.memberName === me) net -= s.amount;
  }
  return Math.round(net * 100) / 100;
}

const btnSm =
  "inline-flex h-[38px] items-center justify-center gap-2 rounded-[12px] px-3.5 text-[14px] font-bold transition active:brightness-[0.93]";

/**
 * Kesta contact-style drawer for one shared group: members, total spent (counts up),
 * 12 monthly bars, invite code, latest expenses, and Open / Copy invite / Delete.
 */
export function GroupDrawer({
  group,
  open,
  onClose,
  onCopyCode,
  copiedCode,
  onDelete,
}: {
  group: ExpenseGroup | null;
  open: boolean;
  onClose: () => void;
  onCopyCode: (code: string) => void;
  copiedCode: string | null;
  onDelete?: (groupId: string) => void;
}) {
  // Keep showing the last group while the drawer animates closed.
  const [last, setLast] = useState(group);
  if (group && group !== last) setLast(group);
  const g = group ?? last;

  const expenses = useMemo(() => (g?.expenses ?? []).filter((e) => !e.isSettlement), [g]);
  const totalSpent = expenses.reduce((s, e) => s + e.totalAmount, 0);
  const counted = useCountUp(totalSpent, g?.id);

  const months = useMemo(() => {
    const now = new Date();
    const list = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: MONTHS[d.getMonth()], total: 0 };
    });
    expenses.forEach((e) => {
      const m = list.find((x) => e.date?.startsWith(x.key));
      if (m) m.total += e.totalAmount;
    });
    return list;
  }, [expenses]);
  const monthMax = Math.max(1, ...months.map((m) => m.total));

  if (!g) return null;

  const code = g.inviteCode || "TK-" + g.id.slice(0, 4).toUpperCase();
  const net = myNet(g);
  const latest = [...(g.expenses ?? [])].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 6);
  const members = g.members?.length ? g.members : [{ id: "you", name: "You" }];
  const canDelete = Boolean(onDelete) && g.isOwner !== false;

  return (
    <Drawer
      open={open && Boolean(group)}
      onClose={onClose}
      label={g.name}
      footer={
        <>
          <Link href={`/dashboard/groups/${g.id}`} className={`${btnSm} bg-[var(--primary)] text-[var(--on-primary)] hover:bg-[var(--primary-strong)]`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 17 17 7M8.5 7H17v8.5" />
            </svg>
            Open group
          </Link>
          <button type="button" onClick={() => onCopyCode(code)} className={`${btnSm} border border-border bg-surface text-foreground hover:bg-surface-muted`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="8" y="8" width="12" height="12" rx="2.5" />
              <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
            </svg>
            {copiedCode === code ? "Copied!" : "Copy invite"}
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete?.(g.id)}
              className={`${btnSm} border border-border bg-surface text-[var(--bad)] hover:bg-[color-mix(in_srgb,var(--rose)_10%,transparent)]`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />
              </svg>
              Delete
            </button>
          )}
        </>
      }
    >
      {/* 1. Hero: member stack, name, tags */}
      <div className="flex items-center gap-4 pr-12">
        <span className="tk-pop flex shrink-0 items-center" aria-hidden="true">
          {members.slice(0, 3).map((m, i) => (
            <span
              key={m.id || m.name}
              className={`inline-grid h-14 w-14 place-items-center rounded-full text-[19px] font-extrabold text-[#1e1724] shadow-[0_0_0_3px_var(--raised)] ${i > 0 ? "-ml-4" : ""}`}
              style={{ background: avatarTint(m.name) }}
            >
              {initialsOf(m.name)}
            </span>
          ))}
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-[24px] font-extrabold tracking-[-0.03em] leading-tight text-foreground">{g.name}</h2>
          <p className="text-[15px] text-foreground-muted">
            {members.length} {members.length === 1 ? "member" : "members"} · {g.expenses?.length ?? 0} entries
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="pill pill--teal">
              <i />
              {g.category || "General"}
            </span>
            <span className={`pill ${net > 0 ? "pill--good" : net < 0 ? "pill--bad" : "pill--faint"}`}>
              <i />
              {net > 0 ? `You get ${inr(net)}` : net < 0 ? `You owe ${inr(net)}` : "Settled up"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Total spent (counts up) */}
      <div className="d-big">
        <small>Spent together</small>
        <b className="num">{inr(Math.round(counted * 100) / 100)}</b>
        <small>
          {expenses.length} {expenses.length === 1 ? "expense" : "expenses"}
          {g.createdAt ? ` · since ${shortDate(g.createdAt)}` : ""}
        </small>
      </div>

      {/* 3. Last 12 months */}
      <div className="flex h-24 items-end gap-1.5" role="img" aria-label="Group spending each month, last 12 months">
        {months.map((m, i) => (
          <span key={m.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${m.label}: ${inr(m.total)}`}>
            <span
              className="tk-bar w-full rounded-[5px_5px_2px_2px]"
              style={{
                height: `${Math.max(2, (m.total / monthMax) * 100)}%`,
                background: m.total > 0 ? "var(--teal)" : "var(--line-2)",
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
          <span>Invite code</span>
          <button type="button" onClick={() => onCopyCode(code)} className="inline-flex items-center gap-1.5 font-mono font-bold text-foreground hover:underline">
            {copiedCode === code ? "Copied" : code}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="8" y="8" width="12" height="12" rx="2.5" />
              <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
            </svg>
          </button>
        </div>
        <div className="d-row">
          <span>Your balance</span>
          <span className="num" style={{ color: net > 0 ? "var(--good)" : net < 0 ? "var(--bad)" : undefined }}>
            {net > 0 ? `Get ${inr(net)}` : net < 0 ? `Owe ${inr(net)}` : "₹0"}
          </span>
        </div>
      </div>

      {/* 5. Members */}
      <div>
        <p className="mb-1 font-extrabold text-foreground">
          Members <span className="font-bold text-foreground-muted">· {members.length}</span>
        </p>
        <div className="grid">
          {members.map((m) => (
            <div key={m.id || m.name} className="flex items-center gap-3 border-b border-border px-0.5 py-2.5 last:border-b-0">
              <span
                className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-extrabold text-[#1e1724]"
                style={{ background: avatarTint(m.name) }}
                aria-hidden="true"
              >
                {initialsOf(m.name)}
              </span>
              <span className="min-w-0 flex-1">
                <b className="block truncate font-bold text-foreground">{m.name}</b>
                <small className="block truncate text-[14px] text-foreground-muted">{"phone" in m && m.phone ? m.phone : "No phone saved"}</small>
              </span>
              <span className="pill pill--faint !text-[13px]">
                <i />
                {"linkedUserId" in m && m.linkedUserId ? "Joined" : m.name.toLowerCase() === "you" ? "You" : "Invited"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Latest activity */}
      <div>
        <p className="mb-1 font-extrabold text-foreground">Latest</p>
        {latest.length === 0 ? (
          <p className="text-[15px] text-foreground-muted">No expenses yet. Open the group to add the first one.</p>
        ) : (
          <div className="grid">
            {latest.map((e) => (
              <div key={e.id} className="flex min-w-0 items-center gap-3 border-b border-border px-0.5 py-2.5 last:border-b-0">
                <span
                  className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-[11px]"
                  style={{
                    background: `color-mix(in srgb, ${e.isSettlement ? "var(--good)" : "var(--teal)"} 14%, transparent)`,
                    color: e.isSettlement ? "var(--good)" : "var(--teal)",
                  }}
                  aria-hidden="true"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={e.isSettlement ? "m5 12.5 4.5 4.5L19 7.5" : "M7 3h10a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1zM9 8h6M9 12h6"} />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate font-bold text-foreground">
                    {e.isSettlement ? `${e.settlementFrom ?? e.paidBy} paid ${e.settlementTo ?? e.splits[0]?.memberName ?? ""}` : e.title}
                  </b>
                  <small className="block truncate text-[14px] text-foreground-muted">
                    {shortDate(e.date)} · {e.isSettlement ? "Settlement" : `Paid by ${e.paidBy}`}
                  </small>
                </span>
                <b className="shrink-0 font-extrabold text-foreground num">{inr(e.totalAmount)}</b>
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
}
