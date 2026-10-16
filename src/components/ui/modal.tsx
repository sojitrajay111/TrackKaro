"use client";

import { useEffect, type ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
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
}: ModalProps) {
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

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Modal Surface Card (Coterie exact width min(440px), rounded-[28px], clean luminous solid surface) */}
      <div
        className={`w-full ${MAX_WIDTHS[maxWidth]} rounded-[28px] bg-[#F9FCFA] dark:bg-[#0E1F16] text-foreground p-6 sm:p-7 space-y-4 animate-in zoom-in-95 duration-150 relative shadow-[0_30px_70px_-20px_rgba(10,48,28,0.3),0_0_0_1px_rgba(255,255,255,0.9)_inset] dark:shadow-[0_30px_70px_-20px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.08)_inset]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Head */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display font-medium text-[20px] sm:text-[21px] tracking-tight text-[#102117] dark:text-[#F1FBF6] leading-snug">
              {title}
            </h3>
            {description && (
              <p className="mt-0.5 text-xs text-[#6B8B79] dark:text-[#A9C4B6]">
                {description}
              </p>
            )}
          </div>

          {/* Bare Close '✕' Button (matching Coterie) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[#6B8B79] hover:text-[#102117] dark:text-[#A9C4B6] dark:hover:text-white transition p-1 -mr-1 shrink-0"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        {children}
      </div>
    </div>
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
      <label className="block text-[12px] font-semibold text-[#3E5A4A] dark:text-[#A9C4B6]">
        {label}
      </label>
      {children}
      {description && (
        <p className="text-[11px] text-[#6B8B79] dark:text-[#7E9A8B] leading-relaxed">
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
            className={`h-9 rounded-[10px] text-xs sm:text-[13px] font-medium transition-all flex items-center justify-center select-none ${
              isSelected
                ? "bg-[#0E1F16] text-white font-bold shadow-xs dark:bg-emerald-400 dark:text-emerald-950"
                : "bg-[#EAF3EE] dark:bg-[#14291F] text-[#3E5A4A] dark:text-[#A9C4B6] shadow-[inset_0_0_0_1px_rgba(18,60,38,0.1)] hover:text-[#102117] hover:bg-[#E2EDE6]"
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
    <div className="flex items-center justify-end gap-2 pt-1.5">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="px-3.5 py-2 text-xs sm:text-[13px] font-semibold text-[#4B6858] dark:text-[#A9C4B6] hover:text-[#102117] dark:hover:text-white transition disabled:opacity-50"
      >
        {cancelLabel}
      </button>
      <button
        type={onConfirm ? "button" : "submit"}
        onClick={onConfirm}
        disabled={isSubmitting}
        className="rounded-full px-5 py-2 text-xs sm:text-[13px] font-bold bg-[#0E1F16] text-white hover:bg-black dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300 transition shadow-xs disabled:opacity-50 inline-flex items-center gap-2"
      >
        {isSubmitting && (
          <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        )}
        <span>{confirmLabel}</span>
      </button>
    </div>
  );
}
