"use client";

import { useState, useSyncExternalStore } from "react";
import { useTheme } from "./theme-provider";

const emptySubscribe = () => () => {};

/** True only after hydration — avoids a mismatch since the system-resolved theme is unknown during SSR. */
function useIsClient() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export function ThemeToggle({ className }: { className?: string } = {}) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useIsClient();

  const isDark = mounted && resolvedTheme === "dark";
  // Bumped on each click so the icon re-mounts and plays its spin-in.
  const [spins, setSpins] = useState(0);
  const spinCls = spins > 0 ? "tk-theme-spin" : undefined;

  return (
    <button
      type="button"
      onClick={(e) => {
        setSpins((n) => n + 1);
        setTheme(isDark ? "light" : "dark", e.currentTarget);
      }}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={className ?? "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground-sub transition hover:text-primary hover:border-primary/40"}
    >
      {!mounted ? (
        <span className="h-4 w-4" />
      ) : isDark ? (
        <svg key={spins} className={spinCls} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        <svg key={spins} className={spinCls} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
        </svg>
      )}
    </button>
  );
}
