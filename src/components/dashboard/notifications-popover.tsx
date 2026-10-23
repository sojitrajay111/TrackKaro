"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Illustration } from "@/components/ui/illustration";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useClearAllNotificationsMutation,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  type ApiNotification,
} from "@/store/api/notificationsApi";

export type FilterType = "all" | "activity" | "bill" | "deal" | "unread";

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

/** Per type: tint, icon, label and where tapping it goes. */
function meta(n: ApiNotification) {
  if (n.type === "bill") return { tint: "var(--amber)", label: "Bill", href: "/dashboard/reminders", icon: "M7 3h10a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1zM9 8h6M9 12h6" };
  if (n.type === "deal" || n.type === "price_drop")
    return { tint: "var(--primary)", label: n.type === "deal" ? "Deal" : "Price drop", href: "/dashboard/deals", icon: "M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8zM7 7h.01" };
  if (n.type === "insight") return { tint: "var(--violet)", label: "Insight", href: "/dashboard/spending", icon: "M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" };
  const settle = n.title.toLowerCase().includes("settle");
  const budget = /budget|limit/i.test(n.title);
  if (budget) return { tint: "var(--coral)", label: "Budget", href: "/dashboard/spending", icon: "M12 3 2.5 20h19zM12 10v4.5M12 17.5h.01" };
  return settle
    ? { tint: "var(--good)", label: "Settled", href: "/dashboard/khata", icon: "m5 12.5 4.5 4.5L19 7.5" }
    : { tint: "var(--sky)", label: "Activity", href: "/dashboard/expenses", icon: "M3.5 12h3.5l2.5-6 5 12 2.5-6h3.5" };
}

const FILTERS: { id: FilterType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "activity", label: "Activity" },
  { id: "bill", label: "Bills" },
  { id: "deal", label: "Deals" },
];

export function NotificationsPopover({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const { data: notifs = [], isLoading } = useGetNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const [clearAll] = useClearAllNotificationsMutation();

  const unreadCount = useMemo(() => notifs.filter((n) => !n.read).length, [notifs]);
  const filtered = useMemo(() => {
    if (activeFilter === "unread") return notifs.filter((n) => !n.read);
    if (activeFilter === "activity") return notifs.filter((n) => n.type === "activity" || n.type === "insight");
    if (activeFilter === "bill") return notifs.filter((n) => n.type === "bill");
    if (activeFilter === "deal") return notifs.filter((n) => n.type === "deal" || n.type === "price_drop");
    return notifs;
  }, [notifs, activeFilter]);

  // Escape and click-outside close it.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => document.addEventListener("mousedown", onDown), 50);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
      document.removeEventListener("mousedown", onDown);
    };
  }, [isOpen, onClose]);

  const open = (n: ApiNotification) => {
    if (!n.read) markRead(n.id).catch(() => {});
    onClose();
    router.push(meta(n).href);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Notifications"
      className="tk-notif absolute right-0 top-full z-[120] mt-2.5 flex max-h-[calc(100dvh-6rem)] w-[400px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[20px] border border-border bg-[var(--raised)] p-3 text-foreground shadow-[var(--shadow-pop)]"
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-2 px-1.5 pb-2 pt-1">
        <div className="flex items-center gap-2">
          <h3 className="text-[17px] font-extrabold tracking-[-0.015em] text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <span className="pill pill--good">
              <i />
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button type="button" onClick={() => markAllRead().catch(() => {})} className="h-8 rounded-[10px] px-2.5 text-[13px] font-bold text-foreground-muted transition hover:bg-[var(--surface-2)] hover:text-foreground">
              Mark all read
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
            className="inline-grid h-8 w-8 place-items-center rounded-[10px] text-foreground-muted transition hover:bg-[var(--surface-2)] hover:text-foreground"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex shrink-0 gap-1.5 overflow-x-auto px-1 pb-2.5 no-scrollbar" role="group" aria-label="Filter">
        {FILTERS.map((f) => {
          const on = activeFilter === f.id;
          const count = f.id === "all" ? notifs.length : f.id === "unread" ? unreadCount : null;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              aria-pressed={on}
              className={`inline-flex h-[32px] shrink-0 items-center gap-1 rounded-full px-3 text-[13px] font-bold transition ${
                on ? "bg-[var(--primary)] text-[var(--on-primary)]" : "border border-border bg-surface text-foreground-muted hover:text-foreground"
              }`}
            >
              {f.label}
              {count != null && count > 0 && <span className="opacity-70 num">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        {isLoading ? (
          <div className="space-y-2 p-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex animate-pulse items-start gap-3 rounded-[14px] p-2.5">
                <div className="h-10 w-10 shrink-0 rounded-[12px] bg-[var(--well)]" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3.5 w-1/2 rounded bg-[var(--well)]" />
                  <div className="h-3 w-4/5 rounded bg-[var(--well)]" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Illustration name={activeFilter === "all" ? "person-celebrating-confetti" : "person-lost-map"} height={92} className="mx-auto mb-2" />
            <p className="text-[15px] font-extrabold text-foreground">All caught up</p>
            <p className="mt-0.5 text-[14px] text-foreground-muted">{activeFilter === "all" ? "No notifications yet." : "Nothing here for this filter."}</p>
          </div>
        ) : (
          <ul key={activeFilter} className="grid min-w-0 grid-cols-1 gap-0.5">
            {filtered.map((n, i) => {
              const m = meta(n);
              return (
                <li key={n.id} className="tk-notif__row min-w-0" style={{ animationDelay: `${Math.min(i, 8) * 0.03}s` }}>
                  <button
                    type="button"
                    onClick={() => open(n)}
                    className={`relative flex w-full min-w-0 items-start gap-3 rounded-[14px] p-2.5 pr-6 text-left transition hover:bg-[var(--surface-2)] ${n.read ? "" : "bg-[color-mix(in_srgb,var(--primary)_6%,transparent)]"}`}
                  >
                    <span
                      className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-[12px]"
                      style={{ background: `color-mix(in srgb, ${m.tint} 15%, transparent)`, color: m.tint }}
                      aria-hidden="true"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={m.icon} />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-baseline justify-between gap-2">
                        <b className={`truncate text-[15px] ${n.read ? "font-semibold text-foreground" : "font-extrabold text-foreground"}`}>{n.title}</b>
                        <small className="shrink-0 text-[12px] font-semibold text-foreground-muted">{formatRelativeTime(n.createdAt)}</small>
                      </span>
                      <span className="mt-0.5 line-clamp-2 block break-words text-[14px] leading-snug text-foreground-muted [overflow-wrap:anywhere]">{n.message}</span>
                      <span className="mt-1 block text-[12px] font-bold" style={{ color: m.tint }}>
                        {m.label}
                      </span>
                    </span>
                    {!n.read && <i className="absolute right-2.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[var(--primary)]" aria-label="Unread" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="mt-2 flex shrink-0 items-center justify-between border-t border-border px-1.5 pt-2.5">
        {notifs.length > 0 ? (
          <button type="button" onClick={() => clearAll().catch(() => {})} className="h-8 rounded-[10px] px-2 text-[13px] font-bold text-foreground-muted transition hover:bg-[color-mix(in_srgb,var(--rose)_12%,transparent)] hover:text-[var(--bad)]">
            Clear all
          </button>
        ) : (
          <span />
        )}
        <Link href="/dashboard/settings" onClick={onClose} className="inline-flex h-8 items-center gap-1 rounded-[10px] px-2 text-[13px] font-bold text-[var(--primary)] transition hover:bg-[var(--primary-soft)]">
          Alert settings
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
