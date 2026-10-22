"use client";

import type { ReactNode } from "react";
import { Modal } from "@/components/ui/modal";

/** Kesta-style destructive confirmation: ghost Cancel + red confirm, both 44px. */
export function ConfirmDialog({
  isOpen,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
  isWorking = false,
  error,
  children,
}: {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  isWorking?: boolean;
  error?: string | null;
  children?: ReactNode;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} description={description} maxWidth="sm">
      {children}
      {error && (
        <p role="alert" className="text-[15px] font-[650] text-[var(--bad)]">
          {error}
        </p>
      )}
      <div className="mt-2 flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={onCancel}
          disabled={isWorking}
          className="inline-flex h-11 items-center rounded-[14px] border border-border bg-surface px-[18px] text-[16px] font-bold text-foreground transition hover:bg-surface-muted active:brightness-[0.93] disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isWorking}
          className="inline-flex h-11 items-center gap-2 rounded-[14px] bg-[var(--bad)] px-[18px] text-[16px] font-bold text-white shadow-xs transition hover:brightness-110 active:brightness-[0.93] disabled:opacity-50"
        >
          {isWorking ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />
            </svg>
          )}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
