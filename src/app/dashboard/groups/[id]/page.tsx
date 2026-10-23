"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { avatarTint, initialsOf } from "@/lib/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { GroupExpenseModal, GroupFormModal, SettleModal } from "@/components/groups/group-modals";
import { apiErrorMessage, fmtINR, shareOrCopy } from "@/lib/form";
import {
  useDeleteGroupExpenseMutation,
  useDeleteGroupMutation,
  useGetGroupBalancesQuery,
  useGetGroupsQuery,
} from "@/store/api/groupsApi";
import type { ExpenseGroup, GroupExpense } from "@/store/types";
import { Illustration } from "@/components/ui/illustration";

type Tab = "activity" | "balances";

const dateLabel = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

function buildSummary(group: ExpenseGroup, balances?: { name: string; net: number }[], settlements?: { from: string; to: string; amount: number }[]) {
  const spend = group.expenses.filter((e) => !e.isSettlement).reduce((s, e) => s + e.totalAmount, 0);
  const lines = [`${group.name} · TrackKaro group summary`, `Total spent: ${fmtINR(spend)}`, ""];
  if (balances?.length) {
    lines.push("Balances:");
    balances.forEach((b) => lines.push(`• ${b.name}: ${b.net > 0 ? "gets" : b.net < 0 ? "owes" : "settled"} ${b.net ? fmtINR(b.net) : ""}`.trim()));
  }
  if (settlements?.length) {
    lines.push("", "To settle up:");
    settlements.forEach((s) => lines.push(`• ${s.from} pays ${s.to} ${fmtINR(s.amount)}`));
  }
  if (group.inviteCode) lines.push("", `Join with code ${group.inviteCode} on TrackKaro.`);
  return lines.join("\n");
}

/** Rounded icon tile for a group expense (receipt) or settlement (tick). */
function ExpenseIcon({ settlement }: { settlement?: boolean }) {
  return (
    <span
      className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-[11px]"
      style={{
        background: `color-mix(in srgb, ${settlement ? "var(--good)" : "var(--teal)"} 14%, transparent)`,
        color: settlement ? "var(--good)" : "var(--teal)",
      }}
      aria-hidden="true"
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={settlement ? "m5 12.5 4.5 4.5L19 7.5" : "M7 3h10a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1zM9 8h6M9 12h6"} />
      </svg>
    </span>
  );
}

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: groups = [], isLoading } = useGetGroupsQuery();
  const group = groups.find((g) => g.id === id);
  const { data: balancesRaw } = useGetGroupBalancesQuery(id, { skip: !group });
  const [deleteGroup, { isLoading: deletingGroup }] = useDeleteGroupMutation();
  const [deleteExpense, { isLoading: deletingExpense }] = useDeleteGroupExpenseMutation();

  const [tab, setTab] = useState<Tab>("activity");
  const [search, setSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState("");
  const [editingGroup, setEditingGroup] = useState(false);
  const [expenseModal, setExpenseModal] = useState<{ open: boolean; expense?: GroupExpense }>({ open: false });
  const [settle, setSettle] = useState<{ open: boolean; initial?: { from: string; to: string; amount: number } }>({ open: false });
  const [viewing, setViewing] = useState<GroupExpense | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<"group" | GroupExpense | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const balances = useMemo(
    () => balancesRaw?.members.map((m) => ({ name: m.name, net: m.netMinor / 100 })) ?? [],
    [balancesRaw]
  );
  const settlements = useMemo(
    () => balancesRaw?.settlements.map((s) => ({ from: s.from, to: s.to, amount: s.amountMinor / 100 })) ?? [],
    [balancesRaw]
  );

  const activity = useMemo(() => {
    if (!group) return [];
    const q = search.trim().toLowerCase();
    return [...group.expenses]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((e) => {
        if (memberFilter && e.paidBy !== memberFilter && !e.splits.some((s) => s.memberName === memberFilter)) return false;
        if (!q) return true;
        return [e.title, e.notes, e.paidBy, e.settlementFrom, e.settlementTo].some((v) => v?.toLowerCase().includes(q));
      });
  }, [group, search, memberFilter]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-[28px]" />
        <Skeleton className="h-80 rounded-[28px]" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="rounded-[22px] border border-border bg-surface p-12 text-center shadow-xs">
        <p className="text-[16px] font-bold text-foreground">This group doesn&apos;t exist or you&apos;re no longer a member.</p>
        <Link href="/dashboard/groups" className="mt-3 inline-flex h-[38px] items-center rounded-[12px] border border-border bg-surface px-3.5 text-[14px] font-bold text-foreground hover:bg-surface-muted">
          Back to groups
        </Link>
      </div>
    );
  }

  const spend = group.expenses.filter((e) => !e.isSettlement).reduce((s, e) => s + e.totalAmount, 0);
  const isOwner = group.isOwner !== false;

  const doDelete = async () => {
    if (!confirmDelete) return;
    setError(null);
    try {
      if (confirmDelete === "group") {
        await deleteGroup(group.id).unwrap();
        router.push("/dashboard/groups");
        return;
      }
      await deleteExpense({ groupId: group.id, expenseId: confirmDelete.id }).unwrap();
      setConfirmDelete(null);
      setViewing(null);
      flash(confirmDelete.isSettlement ? "Settlement removed" : "Expense deleted");
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't delete."));
    }
  };

  const share = async (text: string, okMsg: string) => {
    const r = await shareOrCopy(text, group.name);
    if (r === "copied") flash(okMsg);
    if (r === "failed") flash("Couldn't share. Try again.");
  };

  const me = group.currentMemberName ?? group.members.find((m) => m.isCurrentUser)?.name ?? "You";
  const myShare = group.expenses.filter((e) => !e.isSettlement).reduce((s, e) => s + (e.splits.find((x) => x.memberName === me)?.amount ?? 0), 0);
  const myNet = balances.find((b) => b.name === me)?.net ?? 0;

  const openExpense = (e: GroupExpense) => {
    setViewing(e);
    setViewOpen(true);
  };

  // Ledger rows grouped by day (newest first)
  const days: { date: string; rows: GroupExpense[]; total: number }[] = [];
  for (const e of activity) {
    const d = (e.date || "").slice(0, 10);
    const last = days[days.length - 1];
    if (last && last.date === d) {
      last.rows.push(e);
      if (!e.isSettlement) last.total += e.totalAmount;
    } else {
      days.push({ date: d, rows: [e], total: e.isSettlement ? 0 : e.totalAmount });
    }
  }
  const dayLabel = (d: string) => {
    const [y, m, day] = d.split("-").map(Number);
    if (!y) return d;
    return new Date(y, m - 1, day).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  };

  const btnGhost =
    "inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-border bg-surface px-[18px] text-[16px] font-bold text-foreground shadow-xs transition hover:bg-surface-muted active:brightness-[0.93]";
  const btnDark =
    "inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[var(--primary)] px-[18px] text-[16px] font-bold text-[var(--on-primary)] shadow-xs transition hover:bg-[var(--primary-strong)] active:brightness-[0.93]";
  const btnXs =
    "inline-flex h-8 items-center justify-center gap-1.5 rounded-[10px] border border-border bg-surface px-[11px] text-[14px] font-bold text-foreground transition hover:bg-surface-muted";
  const card = "rounded-[22px] border border-border bg-surface p-5 shadow-xs";
  const tile = "min-w-0 rounded-[16px] border border-border bg-surface px-4 py-3";
  const members = group.members.length ? group.members : [{ id: "you", name: "You" }];

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
            <Link href="/dashboard/groups" className="hover:text-foreground">
              Split Groups
            </Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9.5 6 6 6-6 6" />
            </svg>
            <span className="truncate text-foreground">{group.name}</span>
          </nav>
          <h1 className="truncate text-[30px] lg:text-[clamp(1.875rem,2.5vw,2.375rem)] font-extrabold tracking-[-0.04em] leading-[1.08] text-foreground">
            {group.name}
          </h1>
          <p className="text-[16px] font-medium text-foreground-muted">
            {group.category} · <b className="font-bold text-foreground">{members.length}</b> members · <b className="font-bold text-foreground">{fmtINR(spend)}</b> spent
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button type="button" onClick={() => setSettle({ open: true })} className={btnGhost}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 8.5h14M14.5 5 18 8.5 14.5 12M20 15.5H6M9.5 12 6 15.5 9.5 19" />
            </svg>
            Settle up
          </button>
          <button type="button" onClick={() => setExpenseModal({ open: true })} className={btnDark}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add expense
          </button>
        </div>
      </header>

      {/* Invite + group actions */}
      <section className={`${card} flex flex-col md:flex-row md:items-center justify-between gap-4 !py-4`}>
        <div className="flex items-center gap-4">
          <span className="flex shrink-0 items-center" aria-hidden="true">
            {members.slice(0, 4).map((m, i) => (
              <span
                key={m.id || m.name}
                className={`inline-grid h-10 w-10 place-items-center rounded-full text-[14px] font-extrabold text-[#1e1724] shadow-[0_0_0_2px_var(--surface)] ${i > 0 ? "-ml-2.5" : ""}`}
                style={{ background: avatarTint(m.name) }}
              >
                {initialsOf(m.name)}
              </span>
            ))}
          </span>
          <div>
            <p className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-foreground-muted">Invite code</p>
            <p className="font-mono text-[18px] font-bold text-foreground">{group.inviteCode ?? "—"}</p>
          </div>
          {group.inviteCode && (
            <button
              type="button"
              onClick={() => share(`Join "${group.name}" on TrackKaro to split expenses. Invite code: ${group.inviteCode}`, "Invite copied")}
              className={btnXs}
            >
              Share invite
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => share(buildSummary(group, balances, settlements), "Summary copied")} className={btnXs}>
            Share summary
          </button>
          {isOwner && (
            <>
              <button type="button" onClick={() => setEditingGroup(true)} className={btnXs}>
                Edit group
              </button>
              <button type="button" onClick={() => setConfirmDelete("group")} className={`${btnXs} !text-[var(--bad)]`}>
                Delete group
              </button>
            </>
          )}
        </div>
      </section>

      {/* Tiles */}
      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={tile}>
          <dt className="text-[14px] font-bold text-foreground-muted">Spent together</dt>
          <dd className="truncate text-[20px] lg:text-[24px] font-extrabold tracking-[-0.035em] num text-foreground">{fmtINR(spend)}</dd>
        </div>
        <div className={tile}>
          <dt className="text-[14px] font-bold text-foreground-muted">Your share</dt>
          <dd className="truncate text-[20px] lg:text-[24px] font-extrabold tracking-[-0.035em] num text-foreground">{fmtINR(myShare)}</dd>
        </div>
        <div className={tile}>
          <dt className="text-[14px] font-bold text-foreground-muted">Your balance</dt>
          <dd
            className="truncate text-[20px] lg:text-[24px] font-extrabold tracking-[-0.035em] num"
            style={{ color: myNet > 0.004 ? "var(--good)" : myNet < -0.004 ? "var(--bad)" : undefined }}
          >
            {myNet > 0.004 ? `+${fmtINR(myNet)}` : myNet < -0.004 ? `−${fmtINR(myNet)}` : "Settled"}
          </dd>
        </div>
        <div className={tile}>
          <dt className="text-[14px] font-bold text-foreground-muted">Entries</dt>
          <dd className="truncate text-[20px] lg:text-[24px] font-extrabold tracking-[-0.035em] num text-foreground">{group.expenses.length}</dd>
        </div>
      </dl>

      {/* Underlined tabs */}
      <div role="tablist" aria-label="Group views" className="flex gap-1 border-b border-border">
        {(
          [
            ["activity", `Activity · ${group.expenses.length}`],
            ["balances", "Balances"],
          ] as const
        ).map(([id, label]) => {
          const on = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(id)}
              className={`relative inline-flex items-center rounded-t-[10px] px-3.5 pt-2.5 pb-3 text-[16px] font-bold transition ${
                on ? "text-foreground" : "text-foreground-muted hover:text-foreground"
              }`}
            >
              {label}
              {on && <span className="absolute inset-x-2 -bottom-px h-[3px] rounded-t-[3px] bg-foreground" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      {tab === "activity" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="relative min-w-[220px] max-w-[380px] flex-[1_1_260px]">
              <span className="sr-only">Search group activity</span>
              <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Title, notes or who paid"
                className="h-[42px] w-full rounded-[12px] border border-border bg-surface pl-10 pr-3 text-[15px] text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-foreground"
              />
            </label>
            <span className="flex-1" />
            <select
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              aria-label="Filter by member"
              className="h-[42px] rounded-[12px] border border-[var(--line-2)] bg-surface px-3 text-[15px] font-[650] text-foreground focus:outline-none focus:border-foreground"
            >
              <option value="">Everyone</option>
              {group.members.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <section className={card} aria-labelledby="group-ledger-title">
            <header className="mb-2">
              <h2 id="group-ledger-title" className="text-[17px] font-extrabold tracking-[-0.015em] text-foreground">
                Ledger
              </h2>
              <p className="mt-0.5 text-[14px] font-medium text-foreground-muted">Every expense and settlement, newest first</p>
            </header>
            {activity.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 px-4 py-9 text-center text-foreground-muted">
                <Illustration name={group.expenses.length === 0 ? "team-celebrating" : "person-lost-map"} height={104} />
                <p className="font-bold text-foreground">{group.expenses.length === 0 ? "No expenses yet" : "Nothing matches"}</p>
                <p className="text-[15px]">{group.expenses.length === 0 ? "Add the first one to start splitting." : "Try a different search or member."}</p>
              </div>
            ) : (
              <table className="w-full border-separate border-spacing-0 text-[15px]">
                <thead className="hidden md:table-header-group">
                  <tr className="text-left text-[13px] font-[750] tracking-[0.04em] text-foreground-muted">
                    <th scope="col" className="border-b border-border px-3 py-2.5">Expense</th>
                    <th scope="col" className="hidden lg:table-cell border-b border-border px-3 py-2.5">Split</th>
                    <th scope="col" className="hidden md:table-cell border-b border-border px-3 py-2.5 text-right">Your share</th>
                    <th scope="col" className="border-b border-border px-3 py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => (
                    <Fragment key={day.date}>
                      <tr>
                        <td colSpan={4} className="border-b border-border px-3 pt-4 pb-1.5 text-[14px] font-extrabold text-foreground-muted">
                          <span className="text-[13px] uppercase tracking-[0.06em]">{dayLabel(day.date)}</span>
                          {day.total > 0 && <em className="float-right not-italic num">{fmtINR(day.total)}</em>}
                        </td>
                      </tr>
                      {day.rows.map((e) => {
                        const mine = e.isSettlement ? 0 : e.splits.find((x) => x.memberName === me)?.amount ?? 0;
                        return (
                          <tr
                            key={e.id}
                            tabIndex={0}
                            onClick={() => openExpense(e)}
                            onKeyDown={(ev) => {
                              if (ev.key === "Enter") openExpense(e);
                            }}
                            className="cursor-pointer hover:bg-[var(--surface-2)] focus:outline-none focus-visible:bg-[var(--surface-2)]"
                          >
                            <td className="border-b border-border px-3 py-[11px]">
                              <span className="flex min-w-0 items-center gap-3">
                                <ExpenseIcon settlement={e.isSettlement} />
                                <span className="min-w-0">
                                  <b className="block max-w-[320px] truncate font-bold text-foreground">
                                    {e.isSettlement ? `${e.settlementFrom ?? e.paidBy} paid ${e.settlementTo ?? e.splits[0]?.memberName ?? ""}` : e.title}
                                  </b>
                                  <small className="block truncate text-[14px] text-foreground-muted">
                                    {e.isSettlement ? "Settlement" : `Paid by ${e.paidBy}`}
                                    {e.notes ? ` · ${e.notes}` : ""}
                                  </small>
                                </span>
                              </span>
                            </td>
                            <td className="hidden lg:table-cell border-b border-border px-3 py-[11px]">
                              {e.isSettlement ? (
                                <span className="pill pill--good">
                                  <i />
                                  Settlement
                                </span>
                              ) : (
                                <span className="pill pill--teal">
                                  <i />
                                  {e.splitType ? `${e.splitType} · ` : ""}
                                  {e.splits.length} ways
                                </span>
                              )}
                            </td>
                            <td className="hidden md:table-cell border-b border-border px-3 py-[11px] text-right whitespace-nowrap font-[650] text-foreground-sub num">
                              {mine > 0 ? fmtINR(mine) : "—"}
                            </td>
                            <td className="border-b border-border px-3 py-[11px] text-right font-extrabold whitespace-nowrap num text-foreground">
                              {fmtINR(e.totalAmount)}
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className={card}>
            <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-foreground">Member standings</h2>
            <p className="mt-0.5 mb-3 text-[14px] font-medium text-foreground-muted">Who is owed and who owes, after every split</p>
            {balances.length === 0 ? (
              <Skeleton className="h-40" />
            ) : (
              <div className="grid">
                {balances.map((b) => (
                  <div key={b.name} className="flex items-center gap-3 border-b border-border px-0.5 py-2.5 last:border-b-0">
                    <span
                      className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-extrabold text-[#1e1724]"
                      style={{ background: avatarTint(b.name) }}
                      aria-hidden="true"
                    >
                      {initialsOf(b.name)}
                    </span>
                    <b className="min-w-0 flex-1 truncate font-bold text-foreground">{b.name}</b>
                    <b
                      className="font-extrabold num"
                      style={{ color: b.net > 0.004 ? "var(--good)" : b.net < -0.004 ? "var(--bad)" : "var(--muted)" }}
                    >
                      {b.net > 0.004 ? `gets ${fmtINR(b.net)}` : b.net < -0.004 ? `owes ${fmtINR(b.net)}` : "settled up"}
                    </b>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className={card}>
            <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-foreground">Suggested payments</h2>
            <p className="mt-0.5 mb-3 text-[14px] font-medium text-foreground-muted">The fewest payments that settle everyone</p>
            {settlements.length === 0 ? (
              <p className="py-8 text-center text-[15px] text-foreground-muted">Everyone is settled up.</p>
            ) : (
              <div className="grid">
                {settlements.map((s) => (
                  <div key={`${s.from}-${s.to}`} className="flex items-center gap-3 border-b border-border px-0.5 py-2.5 last:border-b-0">
                    <span className="min-w-0 flex-1 text-foreground">
                      <b className="font-bold">{s.from}</b> <span className="text-foreground-muted">pays</span> <b className="font-bold">{s.to}</b>
                    </span>
                    <b className="font-extrabold num text-foreground">{fmtINR(s.amount)}</b>
                    <button type="button" onClick={() => setSettle({ open: true, initial: s })} className={btnXs}>
                      Settle
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Expense / settlement detail (animated drawer) */}
      <Drawer
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        label={viewing?.title ?? "Expense"}
        footer={
          viewing && (
            <>
              {!viewing.isSettlement && (
                <button
                  type="button"
                  onClick={() => {
                    const e = viewing;
                    setViewOpen(false);
                    setTimeout(() => setExpenseModal({ open: true, expense: e }), 260);
                  }}
                  className="inline-flex h-[38px] items-center gap-2 rounded-[12px] border border-border bg-surface px-3.5 text-[14px] font-bold text-foreground hover:bg-surface-muted"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />
                  </svg>
                  Edit
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setViewOpen(false);
                  setConfirmDelete(viewing);
                }}
                className="inline-flex h-[38px] items-center gap-2 rounded-[12px] border border-border bg-surface px-3.5 text-[14px] font-bold text-[var(--bad)] hover:bg-[color-mix(in_srgb,var(--rose)_10%,transparent)]"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />
                </svg>
                {viewing.isSettlement ? "Delete settlement" : "Delete"}
              </button>
            </>
          )
        }
      >
        {viewing && (
          <>
            <div className="flex items-start gap-3.5 pr-12">
              <ExpenseIcon settlement={viewing.isSettlement} />
              <div className="min-w-0">
                <p className="text-[14px] font-[650] text-foreground-muted">{dateLabel(viewing.date)}</p>
                <h2 className="break-words text-[24px] font-extrabold tracking-[-0.03em] leading-tight text-foreground">
                  {viewing.isSettlement ? "Settlement" : viewing.title}
                </h2>
              </div>
            </div>
            <div className="d-big">
              <small>{viewing.isSettlement ? "Paid back" : "Total bill"}</small>
              <b className="num">{fmtINR(viewing.totalAmount)}</b>
              <small>
                {viewing.isSettlement
                  ? `${viewing.settlementFrom ?? viewing.paidBy} → ${viewing.settlementTo ?? viewing.splits[0]?.memberName ?? ""}`
                  : `Paid by ${viewing.paidBy}${viewing.splitType ? ` · ${viewing.splitType} split` : ""}`}
              </small>
            </div>
            {!viewing.isSettlement && (
              <div>
                <p className="mb-1 font-extrabold text-foreground">Split</p>
                <div className="grid">
                  {viewing.splits.map((s) => (
                    <div key={s.memberName} className="flex items-center gap-3 border-b border-border px-0.5 py-2.5 last:border-b-0">
                      <span
                        className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-extrabold text-[#1e1724]"
                        style={{ background: avatarTint(s.memberName) }}
                        aria-hidden="true"
                      >
                        {initialsOf(s.memberName)}
                      </span>
                      <b className="min-w-0 flex-1 truncate font-bold text-foreground">
                        {s.memberName}
                        {s.shares && s.shares > 1 ? <span className="font-semibold text-foreground-muted"> · {s.shares}×</span> : null}
                      </b>
                      <b className="font-extrabold num text-foreground">{fmtINR(s.amount)}</b>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {viewing.notes && (
              <div className="d-rows">
                <div className="d-row">
                  <span>Note</span>
                  <span>{viewing.notes}</span>
                </div>
              </div>
            )}
          </>
        )}
      </Drawer>

      {/* Confirm delete */}
      <ConfirmDialog
        isOpen={Boolean(confirmDelete)}
        onCancel={() => {
          setConfirmDelete(null);
          setError(null);
        }}
        onConfirm={doDelete}
        isWorking={deletingGroup || deletingExpense}
        error={error}
        title={confirmDelete === "group" ? "Delete this group?" : "Delete this entry?"}
        description={
          confirmDelete === "group"
            ? "All expenses and settlements in it are deleted for everyone. This can't be undone."
            : "Balances are recalculated without it."
        }
        confirmLabel={confirmDelete === "group" ? "Delete group" : "Delete"}
      />

      <GroupFormModal isOpen={editingGroup} onClose={() => setEditingGroup(false)} group={group} />
      <GroupExpenseModal
        isOpen={expenseModal.open}
        onClose={() => setExpenseModal({ open: false })}
        group={group}
        expense={expenseModal.expense}
      />
      <SettleModal isOpen={settle.open} onClose={() => setSettle({ open: false })} group={group} initial={settle.initial} />

      {toast && (
        <div
          role="status"
          className="tk-pop fixed bottom-6 left-1/2 z-[220] -translate-x-1/2 rounded-[14px] bg-[var(--primary)] px-4 py-2.5 text-[15px] font-bold text-[var(--on-primary)] shadow-[var(--shadow-pop)]"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
