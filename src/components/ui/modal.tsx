"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  position?: "center" | "right";
}

const MAX_WIDTHS = {
  sm: "max-w-[400px]",
  md: "max-w-[460px]",
  lg: "max-w-[500px]",
  xl: "max-w-[560px]",
};

/**
 * Kesta-style dialog: raised surface, 24px radius, rises in with a small overshoot.
 * On phones it becomes a bottom sheet. Inputs inside pick up the shared field style
 * from globals.css (.tk-modal …).
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "lg",
  position = "center",
}: ModalProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Move focus into the dialog unless something inside already has it (e.g. autoFocus).
    if (panelRef.current && !panelRef.current.contains(document.activeElement)) {
      panelRef.current.focus({ preventScroll: true });
    }
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const isRight = position === "right";

  return createPortal(
    <div
      className={`tk-modal-wrap fixed inset-0 z-[200] flex ${
        isRight ? "items-stretch justify-end p-3" : "items-center justify-center p-4"
      }`}
    >
      <div className="tk-modal-scrim fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`tk-modal ${isRight ? "tk-modal--right" : ""} relative z-10 w-full ${MAX_WIDTHS[maxWidth]} outline-none ${
          isRight ? "flex flex-col overflow-hidden" : "max-h-[92dvh] overflow-y-auto"
        } no-scrollbar`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 mb-[18px]">
          <div className="min-w-0">
            <h3 className="text-[22px] font-extrabold tracking-[-0.025em] leading-tight text-foreground">{title}</h3>
            {description && <p className="mt-1 text-[15px] text-foreground-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-border bg-[var(--raised)] text-foreground-muted transition hover:bg-[var(--surface-2)] hover:text-foreground"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        {isRight ? <div className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden">{children}</div> : <div className="space-y-4">{children}</div>}
      </div>
    </div>,
    document.body
  );
}

interface ModalFieldProps {
  label: string;
  description?: string;
  children: ReactNode;
}

export function ModalField({ label, description, children }: ModalFieldProps) {
  return (
    <div className="grid min-w-0 content-start gap-1.5">
      <label className="block text-[14px] font-bold text-foreground-muted">{label}</label>
      {children}
      {description && <p className="text-[14px] leading-relaxed text-[var(--faint)]">{description}</p>}
    </div>
  );
}

interface ModalSegmentedOption<T extends string | number> {
  value: T;
  label: string;
}

interface ModalSegmentedPickerProps<T extends string | number> {
  options: ModalSegmentedOption<T>[];
  selected: T;
  onChange: (value: T) => void;
}

export function ModalSegmentedPicker<T extends string | number>({
  options,
  selected,
  onChange,
}: ModalSegmentedPickerProps<T>) {
  return (
    <div className="inline-flex w-full rounded-[12px] bg-[var(--well)] p-[3px]" role="group">
      {options.map((opt) => {
        const isSelected = opt.value === selected;
        return (
          <button
            key={String(opt.value)}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(opt.value)}
            className={`flex-1 rounded-[9px] px-[13px] py-1.5 text-[14px] font-bold transition select-none ${
              isSelected ? "bg-[var(--raised)] text-foreground shadow-[0_1px_4px_#12322a24]" : "text-foreground-muted hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

interface ModalFooterProps {
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  onConfirm?: () => void;
}

export function ModalFooter({
  onCancel,
  confirmLabel = "Save changes",
  cancelLabel = "Cancel",
  isSubmitting = false,
  onConfirm,
}: ModalFooterProps) {
  return (
    <div className="mt-2 flex items-center justify-end gap-2.5">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="inline-flex h-11 items-center rounded-[14px] border border-border bg-surface px-[18px] text-[16px] font-bold text-foreground transition hover:bg-surface-muted active:brightness-[0.93] disabled:opacity-50"
      >
        {cancelLabel}
      </button>
      <button
        type={onConfirm ? "button" : "submit"}
        onClick={onConfirm}
        disabled={isSubmitting}
        className="inline-flex h-11 items-center gap-2 rounded-[14px] bg-[var(--primary)] px-[18px] text-[16px] font-bold text-[var(--on-primary)] shadow-xs transition hover:bg-[var(--primary-strong)] active:brightness-[0.93] disabled:opacity-50"
      >
        {isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
        <span>{confirmLabel}</span>
      </button>
    </div>
  );
}
