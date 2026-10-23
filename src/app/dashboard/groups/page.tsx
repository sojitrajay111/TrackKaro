"use client";

import { useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { GroupFormModal, JoinGroupModal } from "@/components/groups/group-modals";
import { useGetGroupsQuery, useGetPendingGroupConfirmationsQuery } from "@/store/api/groupsApi";
import { fmtINR } from "@/lib/form";
import { avatarTint, initialsOf } from "@/lib/avatar";
import type { ExpenseGroup } from "@/store/types";
import { Illustration } from "@/components/ui/illustration";

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

export default function GroupsPage() {
  const { data: groups = [], isLoading } = useGetGroupsQuery();
  const { data: pending = [] } = useGetPendingGroupConfirmationsQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const totals = groups.reduce(
    (acc, g) => {
      const n = myNet(g);
      if (n > 0) acc.owed += n;
      else acc.owe += -n;
      return acc;
    },
    { owed: 0, owe: 0 }
  );

  const btnGhost =
    "inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-border bg-surface px-[18px] text-[16px] font-bold text-foreground shadow-xs transition hover:bg-surface-muted active:brightness-[0.93]";
  const btnDark =
    "inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[var(--primary)] px-[18px] text-[16px] font-bold text-[var(--on-primary)] shadow-xs transition hover:bg-[var(--primary-strong)] active:brightness-[0.93]";
  const tile = "min-w-0 rounded-[16px] border border-border bg-surface px-4 py-3";
  const card = "rounded-[22px] border border-border bg-surface p-5 shadow-xs";
  const memberTotal = groups.reduce((acc, g) => acc + (g.members?.length || 0), 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Header: breadcrumb, title, summary line, actions */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[14px] font-[650] text-foreground-muted">
            <span>Money</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9.5 6 6 6-6 6" />
            </svg>
            <span className="text-foreground">Split Groups</span>
          </nav>
          <h1 className="text-[30px] lg:text-[clamp(1.875rem,2.5vw,2.375rem)] font-extrabold tracking-[-0.04em] leading-[1.08] text-foreground">
            Split Groups
          </h1>
          <p className="text-[16px] font-medium text-foreground-muted">
            <b className="font-bold text-foreground">{groups.length}</b> {groups.length === 1 ? "group" : "groups"} with{" "}
            <b className="font-bold text-foreground">{memberTotal}</b> members
            {pending.length > 0 && (
              <>
                {" "}· <b className="font-bold text-foreground">{pending.length}</b> waiting to confirm
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button type="button" onClick={() => setShowJoin(true)} className={btnGhost}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
            </svg>
            Join with code
          </button>
          <button type="button" onClick={() => setShowCreate(true)} className={btnDark}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New group
          </button>
        </div>
      </header>

      {pending.length > 0 && (
        <Link
          href="/dashboard/groups/confirmations"
          className="flex items-center gap-3 rounded-[16px] border border-[color-mix(in_srgb,var(--amber)_45%,transparent)] bg-[color-mix(in_srgb,var(--amber)_9%,transparent)] px-4 py-3.5 transition hover:bg-[color-mix(in_srgb,var(--amber)_14%,transparent)]"
        >
          <svg className="shrink-0 text-[var(--warn)]" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 3h10a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1zM9 8h6M9 12h6" />
          </svg>
          <span className="min-w-0 flex-1">
            <b className="block font-bold text-foreground">
              {pending.length} group expense{pending.length > 1 ? "s" : ""} to confirm
            </b>
            <small className="block text-[14px] text-foreground-muted">Add your share to your own spending with the right category.</small>
          </span>
          <span className="inline-flex h-[38px] items-center rounded-[12px] bg-[var(--primary)] px-3.5 text-[14px] font-bold text-[var(--on-primary)]">Review</span>
        </Link>
      )}

      <dl className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className={tile}>
          <dt className="text-[14px] font-bold text-foreground-muted">Groups</dt>
          <dd className="truncate text-[20px] lg:text-[24px] font-extrabold tracking-[-0.035em] num text-foreground">{isLoading ? "…" : groups.length}</dd>
        </div>
        <div className={tile}>
          <dt className="text-[14px] font-bold text-foreground-muted">You are owed</dt>
          <dd className="truncate text-[20px] lg:text-[24px] font-extrabold tracking-[-0.035em] num text-[var(--good)]">{isLoading ? "…" : fmtINR(totals.owed)}</dd>
        </div>
        <div className={`${tile} col-span-2 lg:col-span-1`}>
          <dt className="text-[14px] font-bold text-foreground-muted">You owe</dt>
          <dd className="truncate text-[20px] lg:text-[24px] font-extrabold tracking-[-0.035em] num text-[var(--bad)]">{isLoading ? "…" : fmtINR(totals.owe)}</dd>
        </div>
      </dl>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-[22px]" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <section className={`${card} flex flex-col items-center gap-1.5 px-4 py-9 text-center text-foreground-muted`}>
          <Illustration name="buddy-pair" height={104} />
          <p className="font-bold text-foreground">No shared groups yet</p>
          <p className="text-[15px]">Create a group for your flat, a trip or office lunches, then invite friends with the code.</p>
        </section>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => {
            const net = myNet(g);
            const spend = (g.expenses ?? []).filter((e) => !e.isSettlement).reduce((s, e) => s + e.totalAmount, 0);
            const members = g.members?.length ? g.members : [{ id: "you", name: "You" }];
            return (
              <Link
                key={g.id}
                href={`/dashboard/groups/${g.id}`}
                className={`${card} flex flex-col justify-between gap-4 transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground`}
              >
                <div>
                  <span className="pill pill--teal">
                    <i />
                    {g.category}
                  </span>
                  <h3 className="mt-2 truncate text-[17px] font-extrabold tracking-[-0.015em] text-foreground">{g.name}</h3>
                  <p className="text-[14px] font-medium text-foreground-muted">
                    {members.length} {members.length === 1 ? "member" : "members"} · {fmtINR(spend)} spent
                  </p>
                  <div className="mt-3 flex items-center">
                    {members.slice(0, 6).map((m, i) => (
                      <span
                        key={m.id || m.name}
                        title={m.name}
                        className={`inline-grid h-8 w-8 place-items-center rounded-full text-[12px] font-extrabold text-[#1e1724] shadow-[0_0_0_2px_var(--surface)] ${i > 0 ? "-ml-2" : ""}`}
                        style={{ background: avatarTint(m.name) }}
                      >
                        {initialsOf(m.name)}
                      </span>
                    ))}
                    {members.length > 6 && (
                      <span className="-ml-2 inline-grid h-8 w-8 place-items-center rounded-full bg-[var(--well)] text-[12px] font-extrabold text-foreground shadow-[0_0_0_2px_var(--surface)]">
                        +{members.length - 6}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 text-[14px]">
                  <span className="font-semibold text-foreground-muted">Your balance</span>
                  <b className="font-extrabold num" style={{ color: net > 0 ? "var(--good)" : net < 0 ? "var(--bad)" : "var(--muted)" }}>
                    {net > 0 ? `You get ${fmtINR(net)}` : net < 0 ? `You owe ${fmtINR(net)}` : "Settled up"}
                  </b>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <GroupFormModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
      <JoinGroupModal isOpen={showJoin} onClose={() => setShowJoin(false)} />
    </div>
  );
}
