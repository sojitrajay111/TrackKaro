"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/store";
import { useSignOut } from "@/store/api/authApi";
import { useGetTransactionsQuery } from "@/store/api/transactionsApi";
import { useGetKhataEntriesQuery } from "@/store/api/khataApi";
import { useGetBudgetsQuery } from "@/store/api/budgetsApi";
import { useGetRemindersQuery } from "@/store/api/remindersApi";
import { daysUntil } from "@/lib/finance";

/** Menu sections (with live counts) shared by the desktop sidebar and the phone menu. */
export function useNavSections() {
  const { user } = useAppSelector((state) => state.auth);
  const { data: transactions = [] } = useGetTransactionsQuery();
  const { data: khataEntries = [] } = useGetKhataEntriesQuery();
  const { data: budgets = [] } = useGetBudgetsQuery();

  const pendingKhata = khataEntries.filter((e) => e.status === "pending").length;
  // Bills due within 3 days (or overdue) — same "urgent" rule as the Bills page.
  const { data: reminders = [] } = useGetRemindersQuery();
  const dueBills = reminders.filter((r) => r.status === "pending" && daysUntil(r.dueDate) <= 3).length;

  const moneyNav = [
    {
      id: "overview",
      label: "Overview",
      href: "/dashboard",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.5" y="3.5" width="7.5" height="9" rx="2" />
          <rect x="13" y="3.5" width="7.5" height="5.5" rx="2" />
          <rect x="3.5" y="14.5" width="7.5" height="6" rx="2" />
          <rect x="13" y="11" width="7.5" height="9.5" rx="2" />
        </svg>
      ),
    },
    {
      id: "expenses",
      label: "Expenses",
      href: "/dashboard/expenses",
      count: transactions.length > 0 ? transactions.length : undefined,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3.5 12h3.5l2.5-6 5 12 2.5-6h3.5" />
        </svg>
      ),
    },
    {
      id: "khata",
      label: "Khata Ledger",
      href: "/dashboard/khata",
      count: pendingKhata > 0 ? pendingKhata : undefined,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="3" width="16" height="18" rx="3" />
          <circle cx="12" cy="10" r="2.8" />
          <path d="M8 17c.8-1.8 2.3-2.5 4-2.5s3.2.7 4 2.5" />
        </svg>
      ),
    },
    {
      id: "groups",
      label: "Split Groups",
      href: "/dashboard/groups",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="M3 10h18" />
          <circle cx="16" cy="14" r="1.2" fill="currentColor" />
        </svg>
      ),
    },
  ];

  const manageNav = [
    {
      id: "budgets",
      label: "Budgets & Limits",
      href: "/dashboard/spending",
      count: budgets.length > 0 ? budgets.length : undefined,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="M7 5v14M17 5v14M3 12h18" />
        </svg>
      ),
    },
    {
      id: "deals",
      label: "Live Deals",
      href: "/dashboard/deals",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      ),
    },
    {
      id: "bills",
      label: "Bills",
      href: "/dashboard/reminders",
      count: dueBills > 0 ? dueBills : undefined,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 3h10a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1z" />
          <path d="M9 8h6M9 12h6" />
        </svg>
      ),
    },
    {
      id: "subscriptions",
      label: "Subscriptions",
      href: "/dashboard/subscriptions",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 12a8 8 0 0 1-14.3 4.9M4 12a8 8 0 0 1 14.3-4.9M18 3v4.5h-4.5M6 21v-4.5h4.5" />
        </svg>
      ),
    },
    {
      id: "assistant",
      label: "AI Assistant",
      href: "/dashboard/assistant",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
          <path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z" />
        </svg>
      ),
    },
    {
      id: "tasks",
      label: "Tasks",
      href: "/dashboard/tasks",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 5h14v14H5z" />
          <path d="M8.5 12l2.5 2.5 4.5-5" />
        </svg>
      ),
    },
    {
      id: "calendar",
      label: "Calendar",
      href: "/dashboard/calendar",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      id: "settings",
      label: "Settings",
      href: "/dashboard/settings",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2.8l2 2.1 2.9-.4.7 2.8 2.6 1.4-1 2.8 1 2.8-2.6 1.4-.7 2.8-2.9-.4-2 2.1-2-2.1-2.9.4-.7-2.8-2.6-1.4 1-2.8-1-2.8 2.6-1.4.7-2.8 2.9.4Z" />
        </svg>
      ),
    },
  ];

  const displayName = user?.name || user?.email?.split("@")[0] || "You";
  const initials =
    displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  const sections = [
    { label: "Money", items: moneyNav },
    { label: "Studio", items: manageNav },
  ];
  const all = [...moneyNav, ...manageNav];
  return { sections, all, user, displayName, initials };
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { signOut } = useSignOut();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { sections, all, user, displayName, initials } = useNavSections();
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname === href || Boolean(pathname?.startsWith(`${href}/`));
  const activeId = all.find((i) => isActive(i.href))?.id ?? null;

  // Sliding pill: a dark copy of the menu, clipped to the active item (see useNavPill).
  const asideRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  useNavPill(trackRef, pillRef, activeId, isCollapsed);

  // Collapse: labels fade out first, then the sidebar narrows (Kesta: 0.16s, then 0.32s).
  const toggleCollapsed = () => {
    const aside = asideRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isCollapsed && aside && !reduce) {
      aside.classList.add("is-folding");
      setTimeout(() => {
        aside.classList.remove("is-folding");
        setIsCollapsed(true);
      }, 160);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  // Entrance stagger order: brand, fold button, then labels and items top to bottom, then the footer.
  let order = 2;
  const stagger = () => ({ "--i": order++ }) as CSSProperties;

  const renderNav = (variant: "base" | "pill") => (
    <div className="space-y-2">
      {sections.map((section) => (
        <div key={section.label}>
          {isCollapsed ? (
            <div className="h-3.5" aria-hidden="true" />
          ) : (
            <div
              className={`px-3 pt-3 pb-1.5 text-[12px] font-extrabold uppercase tracking-[0.1em] text-foreground-muted ${
                variant === "pill" ? "invisible" : "tk-side-item tk-side-label"
              }`}
              style={variant === "base" ? stagger() : undefined}
            >
              {section.label}
            </div>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const active = item.id === activeId;
              const inner = (
                <>
                  <span className="shrink-0 opacity-90">{item.icon}</span>
                  {!isCollapsed && <span className="tk-side-text flex-1 truncate">{item.label}</span>}
                  {/* Expanded: count pill. Collapsed: a small dot on the icon (count is in the tooltip),
                      since a number can't fit beside a 20px icon in the narrow rail. */}
                  {item.count !== undefined &&
                    (isCollapsed ? (
                      <span
                        className={`absolute left-1/2 top-[9px] ml-[5px] h-2 w-2 rounded-full ring-2 ${
                          variant === "pill" ? "bg-[var(--on-side-pill)] ring-[var(--side-pill)]" : "bg-[var(--accent)] ring-[var(--surface)]"
                        }`}
                        aria-hidden="true"
                      />
                    ) : (
                      <span
                        className={`inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-[7px] text-[13px] font-extrabold num ${
                          variant === "pill" ? "bg-[var(--on-side-pill)] text-[var(--side-pill)]" : "bg-[var(--side-soft)] text-foreground"
                        }`}
                      >
                        {item.count > 999 ? "999+" : item.count}
                      </span>
                    ))}
                </>
              );
              const cls = `flex h-11 items-center gap-3 rounded-[14px] text-[16px] font-[650] ${
                isCollapsed ? "justify-center px-0" : "px-3"
              }`;
              if (variant === "pill") {
                return (
                  <span key={item.id} className={`${cls} relative text-[var(--on-side-pill)]`}>
                    {inner}
                  </span>
                );
              }
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  data-nav={item.id}
                  aria-current={active ? "page" : undefined}
                  title={isCollapsed ? (item.count !== undefined ? `${item.label} (${item.count})` : item.label) : undefined}
                  style={stagger()}
                  className={`tk-side-item ${cls} relative text-foreground transition-[background-color,filter] duration-150 hover:bg-[var(--side-hover)] active:brightness-[0.93] ${
                    active ? "hover:bg-transparent" : ""
                  }`}
                >
                  {inner}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <aside
      ref={asideRef}
      aria-label="Dashboard navigation"
      className={`tk-side hidden lg:flex h-[calc(100vh-2rem)] my-4 ml-4 shrink-0 flex-col rounded-[26px] bg-surface border border-border px-3 pt-4 pb-3 z-40 select-none shadow-xs transition-[width] duration-[320ms] ease-[cubic-bezier(0.65,0,0.35,1)] ${
        isCollapsed ? "w-[84px]" : "w-[244px]"
      }`}
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && e.propertyName === "width") trackRef.current?.dispatchEvent(new Event("tk-remeasure"));
      }}
    >
      {/* Brand + fold toggle */}
      <div className={`flex items-center gap-2 pb-3.5 ${isCollapsed ? "flex-col" : "justify-between"}`}>
        <Link
          href="/dashboard"
          className="tk-side-item flex items-center gap-[11px] overflow-hidden px-1.5 py-0.5"
          style={{ "--i": 0 } as CSSProperties}
          title="TrackKaro — Overview"
        >
          {/* App logo (same artwork as the TrackKaro app icon); scaled to trim its transparent margin. */}
          <span className="flex h-10 w-10 shrink-0 select-none items-center justify-center overflow-hidden rounded-[12px] shadow-[0_4px_14px_-4px_#04785766]">
            <Image src="/logo.png" alt="" width={48} height={48} priority className="h-full w-full scale-[1.16] object-contain" />
          </span>
          {!isCollapsed && (
            <span className="tk-side-text flex min-w-0 flex-col">
              <span className="text-[22px] font-extrabold leading-tight tracking-[-0.03em] text-foreground">TrackKaro</span>
              <span className="truncate text-[13px] font-semibold text-foreground-muted">Personal Finance</span>
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="tk-side-item flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] text-foreground-muted transition hover:bg-[var(--side-hover)] hover:text-foreground"
          style={{ "--i": 1 } as CSSProperties}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={isCollapsed}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
            <path d="M9.5 4.5v15" />
          </svg>
        </button>
      </div>

      {/* Menu, with the sliding active pill layered on top */}
      <nav aria-label="Main" className="flex-1 overflow-y-auto no-scrollbar py-1">
        <div ref={trackRef} className="relative">
          {renderNav("base")}
          <div ref={pillRef} aria-hidden="true" className="tk-nav-pill pointer-events-none absolute inset-0 bg-[var(--side-pill)]">
            {renderNav("pill")}
          </div>
        </div>
      </nav>

      {/* Profile + sign out */}
      <div className={`flex items-center border-t border-border pt-3 ${isCollapsed ? "flex-col gap-2" : "justify-between"}`}>
        {/* Profile opens Settings (account details live there). */}
        <Link
          href="/dashboard/settings"
          title={isCollapsed ? `${displayName} · Settings` : "Account settings"}
          className={`tk-side-item flex min-w-0 items-center gap-2.5 rounded-2xl p-2 transition hover:bg-[var(--side-hover)] active:brightness-[0.95] ${
            isCollapsed ? "justify-center" : "flex-1"
          }`}
          style={stagger()}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[13px] font-bold text-[var(--on-primary)] shadow-xs">
            {initials}
          </div>
          {!isCollapsed && (
            <div className="tk-side-text min-w-0 flex-1">
              <div className="truncate text-[15px] font-bold leading-tight text-foreground">{displayName}</div>
              <div className="truncate text-[13px] font-medium text-foreground-muted">{user?.email || "Personal account"}</div>
            </div>
          )}
        </Link>
        <button
          type="button"
          onClick={() => signOut()}
          title="Sign out"
          aria-label="Sign out"
          className="tk-side-item inline-flex h-[34px] w-[34px] items-center justify-center rounded-[10px] text-foreground-muted transition hover:bg-[var(--side-hover)] hover:text-coral"
          style={stagger()}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </aside>
  );
}

/* -------------------------------------------------------------------------- */
/* Sliding pill                                                               */
/* -------------------------------------------------------------------------- */

type Edges = { t: number; r: number; b: number; l: number };

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Clips the dark pill layer to the active menu item. When the active item changes, the
 * leading edge moves first (0.36s, ease-out) and the trailing edge follows (0.55s), so the
 * pill stretches toward the new item and then catches up — Kesta's motion, without a library.
 */
function useNavPill(
  trackRef: RefObject<HTMLDivElement | null>,
  pillRef: RefObject<HTMLDivElement | null>,
  activeId: string | null,
  collapsed: boolean
) {
  const current = useRef<Edges | null>(null);
  const frame = useRef(0);
  const firstRun = useRef(true);
  const lastCollapsed = useRef(collapsed);

  useLayoutEffect(() => {
    const track = trackRef.current;
    const pill = pillRef.current;
    if (!track || !pill) return;

    const clip = (e: Edges) => `inset(${e.t}px ${e.r}px ${e.b}px ${e.l}px round 14px)`;
    const measure = (): Edges | null => {
      const el = activeId ? track.querySelector<HTMLElement>(`[data-nav="${activeId}"]`) : null;
      if (!el || !el.offsetWidth) return null;
      return {
        l: el.offsetLeft,
        t: el.offsetTop,
        r: track.scrollWidth - (el.offsetLeft + el.offsetWidth),
        b: track.scrollHeight - (el.offsetTop + el.offsetHeight),
      };
    };
    const place = () => {
      cancelAnimationFrame(frame.current);
      const to = measure();
      if (!to) {
        pill.style.opacity = "0";
        current.current = null;
        return;
      }
      current.current = to;
      pill.style.opacity = "1";
      pill.style.clipPath = clip(to);
    };

    const to = measure();
    const from = current.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const collapseChanged = lastCollapsed.current !== collapsed;
    lastCollapsed.current = collapsed;
    if (!to || !from || reduce || firstRun.current || collapseChanged) {
      firstRun.current = false;
      place();
    } else {
      // Which way are we moving, and which edge leads?
      const vertical = Math.abs(to.t - from.t) > Math.abs(to.l - from.l);
      const forward = vertical ? to.t > from.t : to.l > from.l;
      const [lead, trail] = vertical ? (forward ? ["b", "t"] : ["t", "b"]) : forward ? ["r", "l"] : ["l", "r"];
      const cross = vertical ? ["l", "r"] : ["t", "b"];
      const dur: Record<string, [number, (t: number) => number]> = {
        [lead]: [360, easeOut],
        [trail]: [550, easeInOut],
        [cross[0]]: [450, easeInOut],
        [cross[1]]: [450, easeInOut],
      };
      const start = performance.now();
      const startEdges = { ...from };
      cancelAnimationFrame(frame.current);
      const tick = (now: number) => {
        const e = { ...startEdges };
        let done = true;
        (Object.keys(e) as (keyof Edges)[]).forEach((k) => {
          const [ms, ease] = dur[k];
          const p = Math.min(1, (now - start) / ms);
          if (p < 1) done = false;
          e[k] = startEdges[k] + (to[k] - startEdges[k]) * ease(p);
        });
        current.current = e;
        pill.style.opacity = "1";
        pill.style.clipPath = clip(e);
        if (!done) frame.current = requestAnimationFrame(tick);
      };
      frame.current = requestAnimationFrame(tick);
    }

    // Re-place without animation when the sidebar resizes or finishes collapsing.
    // (ResizeObserver also fires once on observe; ignore that so it doesn't cancel the slide.)
    let size = `${track.offsetWidth}x${track.offsetHeight}`;
    const ro = new ResizeObserver(() => {
      const next = `${track.offsetWidth}x${track.offsetHeight}`;
      if (next === size) return;
      size = next;
      place();
    });
    ro.observe(track);
    track.addEventListener("tk-remeasure", place);
    return () => {
      ro.disconnect();
      track.removeEventListener("tk-remeasure", place);
    };
  }, [trackRef, pillRef, activeId, collapsed]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);
}
