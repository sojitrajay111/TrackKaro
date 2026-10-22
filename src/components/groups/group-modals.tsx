"use client";

import { useState, type FormEvent } from "react";
import { Modal, ModalField, ModalFooter } from "@/components/ui/modal";
import { Segmented } from "@/components/ui/segmented";
import { apiErrorMessage, fmtINR, inputCls, textareaCls, todayKey } from "@/lib/form";
import { buildSplits, clampShares, splitProblem, splitStateFromExpense, type SplitInput } from "@/lib/group-splits";
import {
  useAddGroupExpenseMutation,
  useCreateGroupMutation,
  useJoinGroupMutation,
  useLazyPreviewInviteQuery,
  useRecordGroupSettlementMutation,
  useUpdateGroupExpenseMutation,
  useUpdateGroupMutation,
} from "@/store/api/groupsApi";
import type { ExpenseGroup, GroupExpense, GroupInvitePreview, SplitType } from "@/store/types";

export const GROUP_CATEGORIES: { value: ExpenseGroup["category"]; label: string }[] = [
  { value: "Home & Utilities", label: "🏠 Home & Utilities" },
  { value: "Travel", label: "✈️ Travel" },
  { value: "Event & Party", label: "🎉 Event & Party" },
  { value: "Office & Work", label: "💼 Office & Work" },
  { value: "Other", label: "📦 Other" },
];

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-[15px] font-[650] text-[var(--bad)]">
      {message}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* Create / edit group                                                        */
/* -------------------------------------------------------------------------- */

interface MemberRow {
  key: string;
  name: string;
  phone: string;
  locked: boolean; // registered members (you, people who joined) can't be removed here
}

export function GroupFormModal({
  isOpen,
  onClose,
  group,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  group?: ExpenseGroup;
  onSaved?: (g: ExpenseGroup) => void;
}) {
  // Remount the form each time it opens so it starts from the group's current values.
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={group ? "Edit group" : "Create shared group"}
      description={group ? "Rename it, change the category, or add and remove people." : "Split bills with roommates, trip buddies or colleagues."}
      maxWidth="md"
    >
      {isOpen && <GroupForm key={group?.id ?? "new"} group={group} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

function GroupForm({
  group,
  onClose,
  onSaved,
}: {
  group?: ExpenseGroup;
  onClose: () => void;
  onSaved?: (g: ExpenseGroup) => void;
}) {
  const [createGroup, { isLoading: creating }] = useCreateGroupMutation();
  const [updateGroup, { isLoading: updating }] = useUpdateGroupMutation();
  const [name, setName] = useState(group?.name ?? "");
  const [category, setCategory] = useState<ExpenseGroup["category"]>(group?.category ?? "Home & Utilities");
  const [members, setMembers] = useState<MemberRow[]>(() =>
    group
      ? group.members.map((m) => ({
          key: m.id,
          name: m.name,
          phone: m.phone ?? "",
          locked: Boolean(m.linkedUserId) || m.status === "registered" || m.name.toLowerCase() === "you",
        }))
      : []
  );
  const [draftName, setDraftName] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addMember = () => {
    const n = draftName.trim();
    if (!n) return;
    if (n.toLowerCase() === "you" || members.some((m) => m.name.toLowerCase() === n.toLowerCase())) {
      setError(`"${n}" is already in this group.`);
      return;
    }
    setError(null);
    setMembers((list) => [...list, { key: `new-${Date.now()}`, name: n, phone: draftPhone.trim(), locked: false }]);
    setDraftName("");
    setDraftPhone("");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    const payload = members.map((m) => ({ name: m.name, phone: m.phone || undefined }));
    try {
      const saved = group
        ? await updateGroup({ groupId: group.id, name: name.trim(), category, members: payload }).unwrap()
        : await createGroup({ name: name.trim(), category, members: payload }).unwrap();
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't save the group."));
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <ModalField label="Group name">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Goa Trip 2026, Flat 402, Office Lunch"
          className={inputCls}
        />
      </ModalField>
      <ModalField label="Category">
        <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseGroup["category"])} className={inputCls}>
          {GROUP_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </ModalField>

      <ModalField label="Members" description={group ? undefined : "You're added automatically. Add the others here, or share the invite code later."}>
        <ul className="space-y-1.5">
          {members.map((m) => (
            <li key={m.key} className="flex items-center gap-2.5 rounded-[12px] border border-border bg-[var(--surface-2)] px-3 py-2 text-[15px]">
              <span className="flex-1 font-bold text-foreground truncate">{m.name}</span>
              {m.phone && <span className="font-mono text-foreground-muted">{m.phone}</span>}
              {m.locked ? (
                <span className="pill pill--faint !text-[13px]"><i />{m.name.toLowerCase() === "you" ? "You" : "Joined"}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => setMembers((list) => list.filter((x) => x.key !== m.key))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] text-foreground-muted hover:bg-[color-mix(in_srgb,var(--rose)_14%,transparent)] hover:text-[var(--bad)]"
                  aria-label={`Remove ${m.name}`}
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-2">
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addMember();
              }
            }}
            placeholder="Name (e.g. Rahul Sharma)"
            className={inputCls}
          />
          <input
            value={draftPhone}
            onChange={(e) => setDraftPhone(e.target.value)}
            placeholder="Phone (optional)"
            type="tel"
            className={`${inputCls} max-w-[140px]`}
          />
          <button
            type="button"
            onClick={addMember}
            className="inline-flex h-11 shrink-0 items-center rounded-[12px] bg-[var(--primary)] px-4 text-[15px] font-bold text-[var(--on-primary)]"
          >
            Add
          </button>
        </div>
      </ModalField>

      <FormError message={error} />
      <ModalFooter onCancel={onClose} confirmLabel={group ? "Save changes" : "Create group"} isSubmitting={creating || updating} />
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Join group (with invite preview)                                           */
/* -------------------------------------------------------------------------- */

export function JoinGroupModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join a group" description="Enter the invite code your friend shared." maxWidth="sm">
      {isOpen && <JoinForm onClose={onClose} />}
    </Modal>
  );
}

function JoinForm({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState<GroupInvitePreview | null>(null);
  const [pick, setPick] = useState<string>("__new");
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fetchPreview, { isFetching }] = useLazyPreviewInviteQuery();
  const [joinGroup, { isLoading: joining }] = useJoinGroupMutation();

  const lookUp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const p = await fetchPreview(code.trim().toUpperCase()).unwrap();
      setPreview(p);
      const firstFree = p.members.find((m) => !m.isClaimed && m.name.toLowerCase() !== "you");
      setPick(firstFree ? firstFree.id : "__new");
    } catch (err) {
      setError(apiErrorMessage(err, "No group found for that code."));
    }
  };

  const join = async () => {
    if (!preview) return;
    setError(null);
    if (pick === "__new" && !newName.trim()) {
      setError("Enter the name you want to join as.");
      return;
    }
    try {
      await joinGroup({
        inviteCode: preview.inviteCode,
        memberId: pick === "__new" ? undefined : pick,
        memberName: pick === "__new" ? newName.trim() : undefined,
      }).unwrap();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't join the group."));
    }
  };

  if (!preview) {
    return (
      <form onSubmit={lookUp} className="space-y-3">
        <ModalField label="Invite code">
          <input
            required
            maxLength={12}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. TK-GOA1"
            className={`${inputCls.replace("h-11", "h-12")} text-center font-mono text-[17px] font-bold uppercase tracking-widest`}
          />
        </ModalField>
        <FormError message={error} />
        <ModalFooter onCancel={onClose} confirmLabel={isFetching ? "Looking up…" : "Find group"} isSubmitting={isFetching} />
      </form>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[18px] border border-border bg-[var(--surface-2)] p-4">
        <p className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-foreground-muted">{preview.category}</p>
        <p className="text-[20px] font-extrabold tracking-[-0.02em] text-foreground">{preview.name}</p>
        <p className="text-[15px] text-foreground-muted">{preview.members.length} members</p>
      </div>
      <ModalField label="Who are you in this group?" description="If someone already added you by name, pick it so your past splits carry over.">
        <div className="space-y-1.5">
          {preview.members
            .filter((m) => m.name.toLowerCase() !== "you")
            .map((m) => (
              <label
                key={m.id}
                className={`flex items-center gap-2.5 rounded-[12px] border border-border px-3 py-2.5 text-[15px] ${
                  m.isClaimed ? "opacity-45" : "cursor-pointer bg-black/[0.03] dark:bg-white/[0.04]"
                }`}
              >
                <input type="radio" name="who" disabled={m.isClaimed} checked={pick === m.id} onChange={() => setPick(m.id)} />
                <span className="flex-1 font-bold text-foreground">{m.name}</span>
                {m.isClaimed && <span className="pill pill--faint !text-[13px]"><i />Taken</span>}
              </label>
            ))}
          <label className="flex cursor-pointer items-center gap-2.5 rounded-[12px] border border-border bg-[var(--surface-2)] px-3 py-2.5 text-[15px]">
            <input type="radio" name="who" checked={pick === "__new"} onChange={() => setPick("__new")} />
            <span className="font-bold text-foreground">I&apos;m not listed, join as new</span>
          </label>
          {pick === "__new" && (
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Your name" className={inputCls} />
          )}
        </div>
      </ModalField>
      <FormError message={error} />
      <ModalFooter onCancel={() => setPreview(null)} cancelLabel="Back" confirmLabel="Join group" isSubmitting={joining} onConfirm={join} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Add / edit group expense                                                   */
/* -------------------------------------------------------------------------- */

const SPLIT_MODES: { value: SplitType; label: string }[] = [
  { value: "equal", label: "Equal" },
  { value: "shares", label: "Shares" },
  { value: "exact", label: "Exact ₹" },
  { value: "percentage", label: "%" },
];

export function GroupExpenseModal({
  isOpen,
  onClose,
  group,
  expense,
}: {
  isOpen: boolean;
  onClose: () => void;
  group: ExpenseGroup;
  expense?: GroupExpense;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expense ? "Edit expense" : "Add group expense"}
      description={group.name}
      maxWidth="xl"
    >
      {isOpen && <ExpenseForm key={expense?.id ?? "new"} group={group} expense={expense} onClose={onClose} />}
    </Modal>
  );
}

function ExpenseForm({ group, expense, onClose }: { group: ExpenseGroup; expense?: GroupExpense; onClose: () => void }) {
  const memberNames = group.members.map((m) => m.name);
  const me = group.currentMemberName ?? group.members.find((m) => m.isCurrentUser)?.name ?? "You";
  const initialMode: SplitType = expense?.splitType ?? "equal";
  const initial = expense
    ? splitStateFromExpense(memberNames, expense.splits, expense.totalAmount, initialMode)
    : {
        included: Object.fromEntries(memberNames.map((m) => [m, true])),
        shares: Object.fromEntries(memberNames.map((m) => [m, 1])),
        exact: {},
        percent: {},
      };

  const [title, setTitle] = useState(expense?.title ?? "");
  const [amount, setAmount] = useState(expense ? String(expense.totalAmount) : "");
  const [date, setDate] = useState(expense?.date?.slice(0, 10) ?? todayKey());
  const [paidBy, setPaidBy] = useState(expense?.paidBy ?? (memberNames.includes(me) ? me : memberNames[0]));
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const [mode, setMode] = useState<SplitType>(initialMode);
  const [included, setIncluded] = useState<Record<string, boolean>>(initial.included);
  const [shares, setShares] = useState<Record<string, number>>(initial.shares);
  const [exact, setExact] = useState<Record<string, string>>(initial.exact);
  const [percent, setPercent] = useState<Record<string, string>>(initial.percent);
  const [error, setError] = useState<string | null>(null);

  const [addExpense, { isLoading: adding }] = useAddGroupExpenseMutation();
  const [updateExpense, { isLoading: updating }] = useUpdateGroupExpenseMutation();

  const total = parseFloat(amount) || 0;
  const input: SplitInput = { mode, total, members: memberNames, included, shares, exact, percent };
  const problem = splitProblem(input);
  const preview = problem ? [] : buildSplits(input);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Give the expense a title.");
    if (problem) return setError(problem);
    const body = {
      title: title.trim(),
      totalAmount: total,
      paidBy,
      date,
      splitType: mode,
      splits: buildSplits(input),
      notes: notes.trim() || undefined,
    };
    try {
      if (expense) await updateExpense({ groupId: group.id, expenseId: expense.id, patch: body }).unwrap();
      else await addExpense({ groupId: group.id, ...body }).unwrap();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't save the expense."));
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ModalField label="What was it for?">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Dinner at Toit" className={inputCls} />
        </ModalField>
        <ModalField label="Amount (₹)">
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 2400"
            className={inputCls}
          />
        </ModalField>
        <ModalField label="Paid by">
          <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)} className={inputCls}>
            {memberNames.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </ModalField>
        <ModalField label="Date">
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </ModalField>
      </div>

      <ModalField label="Split">
        <Segmented label="Split method" options={SPLIT_MODES} value={mode} onChange={setMode} />
      </ModalField>

      <ul className="space-y-1.5">
        {memberNames.map((m) => {
          const part = preview.find((p) => p.memberName === m)?.amount ?? 0;
          return (
            <li key={m} className="flex items-center gap-2.5 rounded-[12px] border border-border bg-[var(--surface-2)] px-3 py-2 text-[15px]">
              {(mode === "equal" || mode === "shares") && (
                <input
                  type="checkbox"
                  checked={Boolean(included[m])}
                  onChange={(e) => setIncluded((s) => ({ ...s, [m]: e.target.checked }))}
                  aria-label={`Include ${m}`}
                />
              )}
              <span className="flex-1 font-bold text-foreground truncate">{m}</span>
              {mode === "shares" && included[m] && (
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Fewer shares for ${m}`}
                    onClick={() => setShares((s) => ({ ...s, [m]: clampShares((s[m] ?? 1) - 1) }))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-border bg-surface font-bold hover:bg-surface-muted"
                  >
                    −
                  </button>
                  <b className="w-8 text-center tabular-nums">{shares[m] ?? 1}×</b>
                  <button
                    type="button"
                    aria-label={`More shares for ${m}`}
                    onClick={() => setShares((s) => ({ ...s, [m]: clampShares((s[m] ?? 1) + 1) }))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-border bg-surface font-bold hover:bg-surface-muted"
                  >
                    +
                  </button>
                </span>
              )}
              {mode === "exact" && (
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={exact[m] ?? ""}
                  onChange={(e) => setExact((s) => ({ ...s, [m]: e.target.value }))}
                  placeholder="₹0"
                  aria-label={`Amount for ${m}`}
                  className={`${inputCls.replace("h-11", "h-9")} tk-compact w-24 text-right`}
                />
              )}
              {mode === "percentage" && (
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={percent[m] ?? ""}
                  onChange={(e) => setPercent((s) => ({ ...s, [m]: e.target.value }))}
                  placeholder="0%"
                  aria-label={`Percent for ${m}`}
                  className={`${inputCls.replace("h-11", "h-9")} tk-compact w-20 text-right`}
                />
              )}
              <span className="w-24 text-right font-extrabold tabular-nums text-foreground">{part > 0 ? fmtINR(part) : "–"}</span>
            </li>
          );
        })}
      </ul>
      {problem && total > 0 && <p className="text-[14px] font-bold text-[var(--warn)]">{problem}</p>}

      <ModalField label="Notes (optional)">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={textareaCls} />
      </ModalField>

      <FormError message={error} />
      <ModalFooter onCancel={onClose} confirmLabel={expense ? "Save changes" : "Add expense"} isSubmitting={adding || updating} />
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Record settlement                                                          */
/* -------------------------------------------------------------------------- */

export function SettleModal({
  isOpen,
  onClose,
  group,
  initial,
}: {
  isOpen: boolean;
  onClose: () => void;
  group: ExpenseGroup;
  initial?: { from: string; to: string; amount: number };
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settle up" description="Record a payment between two members." maxWidth="sm">
      {isOpen && <SettleForm key={`${initial?.from}-${initial?.to}`} group={group} initial={initial} onClose={onClose} />}
    </Modal>
  );
}

function SettleForm({
  group,
  initial,
  onClose,
}: {
  group: ExpenseGroup;
  initial?: { from: string; to: string; amount: number };
  onClose: () => void;
}) {
  const names = group.members.map((m) => m.name);
  const [from, setFrom] = useState(initial?.from ?? names[0]);
  const [to, setTo] = useState(initial?.to ?? names[1] ?? names[0]);
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [record, { isLoading }] = useRecordGroupSettlementMutation();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const value = parseFloat(amount);
    if (from === to) return setError("Pick two different people.");
    if (!(value > 0)) return setError("Enter the amount paid.");
    try {
      await record({ groupId: group.id, fromMember: from, toMember: to, amount: value, notes: notes.trim() || undefined }).unwrap();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't record the payment."));
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <ModalField label="Who paid">
          <select value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls}>
            {names.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </ModalField>
        <ModalField label="Paid to">
          <select value={to} onChange={(e) => setTo(e.target.value)} className={inputCls}>
            {names.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </ModalField>
      </div>
      <ModalField label="Amount (₹)">
        <input type="number" min="0.01" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
      </ModalField>
      <ModalField label="Note (optional)">
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Paid via UPI" className={inputCls} />
      </ModalField>
      <FormError message={error} />
      <ModalFooter onCancel={onClose} confirmLabel="Record payment" isSubmitting={isLoading} />
    </form>
  );
}
