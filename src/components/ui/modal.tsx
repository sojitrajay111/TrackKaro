"use client";

import { useEffect, useState, type ReactNode } from "react";
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
  sm: "max-w-[380px]",
  md: "max-w-[440px]",
  lg: "max-w-[480px]",
  xl: "max-w-[560px]",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "lg",
  position = "center",
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const isRight = position === "right";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-[200] flex items-center ${
        isRight
          ? "justify-end p-3 sm:p-6 sm:pr-8 animate-in fade-in duration-200"
          : "justify-center p-4 animate-in fade-in duration-150"
      }`}
    >
      {/* Crisp Backdrop Scrim (No blur, matching Pane) */}
      <div
        className="fixed inset-0 bg-black/25 dark:bg-black/45 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Liquid Glass Modal Surface Card */}
      <div
        className={`w-full ${MAX_WIDTHS[maxWidth]} ${
          isRight
            ? "h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] animate-in slide-in-from-right duration-250 flex flex-col overflow-hidden p-5 sm:p-6"
            : "max-h-[92vh] animate-in zoom-in-95 duration-150 space-y-4 overflow-y-auto p-6 sm:p-7"
        } rounded-[32px] bg-white/95 dark:bg-[#121c16]/95 backdrop-blur-2xl text-foreground relative shadow-[0_30px_90px_rgba(0,0,0,0.35)] border border-white/60 dark:border-white/10 z-10 no-scrollbar`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Head (Always pinned at top) */}
        <div className={`flex items-start justify-between gap-4 shrink-0 ${isRight ? "pb-3" : ""}`}>
          <div>
            <h3 className="font-display font-bold text-xl sm:text-2xl tracking-tight text-foreground leading-snug">
              {title}
            </h3>
            {description && (
              <p className="mt-0.5 text-xs text-foreground-muted">
                {description}
              </p>
            )}
          </div>

          {/* Frosted Circular Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-foreground-muted hover:text-foreground flex items-center justify-center transition border border-black/5 dark:border-white/10 shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        {isRight ? (
          <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
            {children}
          </div>
        ) : (
          children
        )}
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
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-foreground-sub">
        {label}
      </label>
      {children}
      {description && (
        <p className="text-[11px] text-foreground-muted leading-relaxed">
          {description}
        </p>
      )}
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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {options.map((opt) => {
        const isSelected = opt.value === selected;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`h-9 rounded-xl text-xs font-medium transition-all flex items-center justify-center select-none ${
              isSelected
                ? "bg-foreground text-background font-bold shadow-xs dark:bg-emerald-400 dark:text-emerald-950"
                : "bg-black/[0.03] dark:bg-white/[0.04] text-foreground-muted hover:text-foreground border border-black/[0.04] dark:border-white/10"
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
    <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.05] dark:border-white/10">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="px-3.5 py-2 text-xs font-semibold text-foreground-muted hover:text-foreground transition disabled:opacity-50"
      >
        {cancelLabel}
      </button>
      <button
        type={onConfirm ? "button" : "submit"}
        onClick={onConfirm}
        disabled={isSubmitting}
        className="rounded-full px-5 py-2 text-xs font-bold bg-foreground text-background hover:opacity-90 dark:bg-emerald-400 dark:text-emerald-950 transition shadow-xs disabled:opacity-50 inline-flex items-center gap-2"
      >
        {isSubmitting && (
          <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
        )}
        <span>{confirmLabel}</span>
      </button>
    </div>
  );
}
