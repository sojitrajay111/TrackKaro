"use client";

import { useState, type FormEvent } from "react";
import { Modal, ModalField, ModalFooter } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetGroupsQuery,
  useCreateGroupMutation,
  useDeleteGroupMutation,
  useJoinGroupMutation,
} from "@/store/api/groupsApi";
import type { ExpenseGroup } from "@/store/types";

export default function GroupsPage() {
  const { data: expenseGroups = [], isLoading: loadingGroups } = useGetGroupsQuery();
  const [createGroup, { isLoading: isCreatingGroup }] = useCreateGroupMutation();
  const [deleteGroup, { isLoading: isDeletingGroup }] = useDeleteGroupMutation();
  const [joinGroup, { isLoading: isJoiningGroup }] = useJoinGroupMutation();

  // Modals State
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const [groupToDeleteId, setGroupToDeleteId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<ExpenseGroup | null>(null);

  // Form State
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupCategory, setNewGroupCategory] = useState<ExpenseGroup["category"]>("Home & Utilities");
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
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

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header Row (Matching Coterie Styling & Outfit Font) */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="font-display font-normal text-[26px] sm:text-[32px] lg:text-[38px] tracking-[-0.02em] text-foreground leading-tight mb-1.5">
            Shared Groups
          </h1>
          <p className="text-xs sm:text-sm font-medium text-foreground-muted">
            Roommates, trips, flatmates & shared group expense split ledger.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
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
        </div>
      </div>

      {/* 2. Groups KPI Stats Row */}
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

      {/* 3. Groups Cards Grid */}
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

      {/* MODAL 1: CREATE GROUP */}
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

      {/* MODAL 2: JOIN GROUP WITH CODE */}
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

      {/* MODAL 3: VIEW GROUP DETAILS */}
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

      {/* MODAL 4: DELETE GROUP CONFIRMATION */}
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
    </div>
  );
}
