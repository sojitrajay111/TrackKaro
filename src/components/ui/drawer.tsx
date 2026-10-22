"use client";

import { useEffect, useRef, useState, type AnimationEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Floating side drawer, Kesta-style: slides in from the right with a slight overshoot,
 * then its sections rise in one after another. On phones it becomes a bottom sheet that
 * can be swiped down to close. Motion lives in globals.css (.tk-drawer*), and is cut to
 * near-zero under prefers-reduced-motion.
 */
export function Drawer({
  open,
  onClose,
  label,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  /** Pinned to the bottom of the drawer (actions). */
  footer?: ReactNode;
}) {
  // Keep the drawer mounted while its closing animation plays.
  const [shown, setShown] = useState(open);
  const [closing, setClosing] = useState(false);
  if (open && (!shown || closing)) {
    setShown(true);
    setClosing(false);
  }
  if (!open && shown && !closing) setClosing(true);

  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Escape closes; the page behind doesn't scroll while open; focus moves into the drawer.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Swipe down to close (bottom-sheet layout on phones only).
  const touch = useRef({ startY: -1, dy: 0 });
  const isSheet = () => typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;
  const onTouchStart = (e: React.TouchEvent) => {
    const el = panelRef.current;
    if (!el || !isSheet() || el.scrollTop > 0) return;
    touch.current = { startY: e.touches[0].clientY, dy: 0 };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const el = panelRef.current;
    if (!el || touch.current.startY < 0) return;
    touch.current.dy = Math.max(0, e.touches[0].clientY - touch.current.startY);
    el.style.transform = `translateY(${touch.current.dy * 0.9}px)`;
  };
  const onTouchEnd = () => {
    const el = panelRef.current;
    if (!el || touch.current.startY < 0) return;
    const { dy } = touch.current;
    touch.current.startY = -1;
    el.style.transition = "transform .35s cubic-bezier(.22,1.4,.36,1)";
    el.style.transform = "";
    setTimeout(() => {
      if (el) el.style.transition = "";
    }, 360);
    if (dy > 90) onCloseRef.current();
  };

  const onAnimationEnd = (e: AnimationEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || !closing) return;
    setShown(false);
    setClosing(false);
  };

  if (!shown || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div className={`tk-drawer-scrim ${closing ? "is-closing" : ""}`} onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={`tk-drawer ${closing ? "is-closing" : ""}`}
        onAnimationEnd={onAnimationEnd}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <button type="button" onClick={onClose} aria-label="Close" className="tk-drawer__close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <div className="tk-drawer__inner">{children}</div>
        {footer && <div className="tk-drawer__foot">{footer}</div>}
      </div>
    </>,
    document.body
  );
}

/** Animate a number from 0 to `value` (ease-out), restarting whenever `key` changes. */
export function useCountUp(value: number, key: unknown, duration = 650) {
  const [shownValue, setShownValue] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = reduce ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShownValue(value * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, key, duration]);
  return shownValue;
}
