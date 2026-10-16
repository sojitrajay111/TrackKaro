"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useClearAllNotificationsMutation,
} from "@/store/api/notificationsApi";

export type FilterType = "all" | "activity" | "bill" | "deal" | "unread";

interface NotificationCardItem {
  id: string;
  name: string;
  action: string;
  time: string;
  read: boolean;
  type: "activity" | "bill" | "deal" | "price_drop" | "insight";
  tag: string;
  avatar: React.ReactNode;
  link: string;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return dateString;
  }
}

// Illustrated Avatars faithfully matching Coterie & TrackKaro styling
function UserAvatar() {
  return (
    <div className="h-11 w-11 rounded-full bg-[#CEDDC9] dark:bg-[#2C3B30] flex items-center justify-center shrink-0 overflow-hidden shadow-xs ring-1 ring-black/5 dark:ring-white/10">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="16" r="7.5" fill="#DDB28D" />
        <path d="M13 15c0-4.5 3.1-7.5 7-7.5s7 3 7 7.5c0 0.5-0.5 1-1.5 1-1 0-1.5-1-2.5-1s-1.5 1-3 1-2-1-3-1-2 1-3 1c-0.8 0-1-0.5-1-1Z" fill="#3B2A1D" />
        <path d="M15 17c0 3 2.2 4.5 5 4.5s5-1.5 5-4.5h-10Z" fill="#3B2A1D" />
        <circle cx="17.5" cy="15" r="1" fill="#1C140E" />
        <circle cx="22.5" cy="15" r="1" fill="#1C140E" />
        <path d="M10 38c0-6 4.5-9 10-9s10 3 10 9" fill="#586C53" />
      </svg>
    </div>
  );
}

function BillAvatar() {
  return (
    <div className="h-11 w-11 rounded-full bg-[#DCE5EE] dark:bg-[#25333F] flex items-center justify-center shrink-0 overflow-hidden shadow-xs ring-1 ring-black/5 dark:ring-white/10">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="16.5" r="7.5" fill="#E8BA9B" />
        <path d="M12.5 15.5c-0.5-4.5 3-8 7.5-8s8 3.5 7.5 8c-1-0.5-2.5-1-4-0.5-1.5 0.5-2 1-3.5 1s-2-0.5-3.5-1c-1.5-0.5-3 0-4 0.5Z" fill="#B37C46" />
        <circle cx="16.5" cy="16.5" r="3.2" stroke="#68472B" strokeWidth="1.3" fill="none" />
        <circle cx="23.5" cy="16.5" r="3.2" stroke="#68472B" strokeWidth="1.3" fill="none" />
        <path d="M19.7 16.5h0.6" stroke="#68472B" strokeWidth="1.3" />
        <circle cx="16.5" cy="16.5" r="1" fill="#1C140E" />
        <circle cx="23.5" cy="16.5" r="1" fill="#1C140E" />
        <path d="M11 38c0-6 4-9 9-9s9 3 9 9" fill="#8C9CAE" />
      </svg>
    </div>
  );
}

function DealAvatar() {
  return (
    <div className="h-11 w-11 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs ring-1 ring-emerald-500/20">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    </div>
  );
}

function InsightAvatar() {
  return (
    <div className="h-11 w-11 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-xs ring-1 ring-purple-500/20">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
      </svg>
    </div>
  );
}

export function NotificationsPopover({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // Call Request URL: https://track-karo-backend.vercel.app/notifications
  const { data: apiNotifs = [], isLoading, isFetching } = useGetNotificationsQuery();
  const [markReadApi] = useMarkNotificationReadMutation();
  const [markAllReadApi] = useMarkAllNotificationsReadMutation();
  const [clearAllApi] = useClearAllNotificationsMutation();

  // Pure derived state from backend response (no useEffect or local state duplication)
  const notificationsList: NotificationCardItem[] = useMemo(() => {
    return (apiNotifs || []).map((n) => {
      let avatar = <UserAvatar />;
      let link = "/dashboard/expenses";
      let tag = "EXPENSE AUDIT";

      if (n.type === "activity") {
        tag = n.title.toLowerCase().includes("settle") ? "SETTLEMENT" : "GROUP ACTIVITY";
        avatar = <UserAvatar />;
        link = tag === "SETTLEMENT" ? "/dashboard/khata" : "/dashboard/groups";
      } else if (n.type === "bill") {
        tag = "BILL REMINDER";
        avatar = <BillAvatar />;
        link = "/dashboard/expenses";
      } else if (n.type === "deal" || n.type === "price_drop") {
        tag = n.type === "deal" ? "BEST DEAL" : "PRICE DROP";
        avatar = <DealAvatar />;
        link = "/dashboard/deals";
      } else {
        tag = "SMART INSIGHT";
        avatar = <InsightAvatar />;
        link = "/dashboard/spending";
      }

      return {
        id: n.id,
        name: n.title,
        action: n.message,
        time: formatRelativeTime(n.createdAt),
        read: n.read,
        type: n.type,
        tag,
        avatar,
        link,
      };
    });
  }, [apiNotifs]);

  // Compute unread count directly from memoized list
  const unreadCount = useMemo(
    () => notificationsList.filter((n) => !n.read).length,
    [notificationsList]
  );

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        isOpen
      ) {
        onClose();
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleNotificationClick = (item: NotificationCardItem) => {
    if (!item.read) {
      markReadApi(item.id).catch(() => {});
    }
    onClose();
    router.push(item.link);
  };

  const handleMarkAllRead = () => {
    markAllReadApi().catch(() => {});
  };

  const handleClearAll = () => {
    clearAllApi().catch(() => {});
  };

  const filtered = useMemo(() => {
    switch (activeFilter) {
      case "activity":
        return notificationsList.filter((n) => n.type === "activity");
      case "bill":
        return notificationsList.filter((n) => n.type === "bill");
      case "deal":
        return notificationsList.filter((n) => n.type === "deal" || n.type === "price_drop");
      case "unread":
        return notificationsList.filter((n) => !n.read);
      case "all":
      default:
        return notificationsList;
    }
  }, [notificationsList, activeFilter]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-full mt-3 w-[370px] sm:w-[410px] max-w-[calc(100vw-2rem)] rounded-[28px] bg-surface/95 dark:bg-[#1E2420] text-foreground p-4 sm:p-5 shadow-[0_25px_65px_-12px_rgba(0,0,0,0.35)] dark:shadow-[0_25px_65px_-12px_rgba(0,0,0,0.7)] border border-border/90 dark:border-white/10 z-[120] animate-in fade-in zoom-in-95 duration-150 select-none backdrop-blur-md"
    >
      {/* 1. Header with Title & Minimalist Close Button */}
      <div className="flex items-center justify-between pb-3 mb-1">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-medium text-[20px] text-foreground tracking-tight">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="flex h-5 items-center justify-center rounded-full bg-emerald-500/15 text-[#059669] dark:text-emerald-400 dark:bg-emerald-400/20 px-2 text-[10px] font-bold">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-[11px] font-semibold text-foreground-muted hover:text-foreground px-2 py-1 rounded-full hover:bg-surface-muted transition"
            >
              Mark all read
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
            className="flex h-7 w-7 items-center justify-center rounded-full text-foreground-sub hover:text-foreground hover:bg-surface-muted transition"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* 2. Filter Pills Matching TrackKaro Application Design */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2.5 pt-0.5">
        {[
          { id: "all" as FilterType, label: `All (${notificationsList.length})` },
          { id: "activity" as FilterType, label: "Activity" },
          { id: "bill" as FilterType, label: "Bills" },
          { id: "deal" as FilterType, label: "Deals" },
          ...(unreadCount > 0 ? [{ id: "unread" as FilterType, label: `Unread (${unreadCount})` }] : []),
        ].map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                isActive
                  ? "bg-[#0E1F16] text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-xs"
                  : "bg-surface-muted/90 text-foreground-sub hover:text-foreground hover:bg-surface-muted"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Notification Items List */}
      <div className="space-y-2 max-h-[360px] overflow-y-auto no-scrollbar pt-1 pb-1">
        {isLoading || isFetching ? (
          <div className="space-y-2.5 py-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-start gap-3.5 p-3 rounded-[20px] bg-surface-muted/60 animate-pulse border border-border/40"
              >
                <div className="h-11 w-11 rounded-full bg-border/60 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-border/60 rounded w-1/3" />
                  <div className="h-3 bg-border/40 rounded w-4/5" />
                  <div className="h-2.5 bg-border/30 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((item) => {
            return (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`group flex items-start gap-3.5 p-3 rounded-[20px] transition cursor-pointer relative border ${
                  item.read
                    ? "bg-surface-muted/50 hover:bg-surface-muted border-border/50"
                    : "bg-surface-muted hover:bg-surface-muted/80 border-[#059669]/25 dark:border-emerald-400/25 shadow-xs"
                }`}
              >
                {/* Avatar */}
                <div className="mt-0.5">{item.avatar}</div>

                {/* Text Information */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-display font-medium text-[13.5px] text-foreground leading-tight truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface border border-border text-foreground-sub shrink-0 uppercase tracking-wider">
                      {item.tag}
                    </span>
                  </div>

                  <p className="text-xs text-foreground-muted font-normal leading-snug mt-1 line-clamp-2">
                    {item.action}
                  </p>

                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[11px] text-foreground-sub font-medium">
                      {item.time}
                    </span>
                    {!item.read && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-[#059669] dark:text-emerald-400">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>New</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 text-xs text-foreground-muted">
            <p className="text-2xl mb-1">🎉</p>
            <p className="font-bold text-foreground">All caught up!</p>
            <p className="text-[11px] text-foreground-sub mt-0.5">
              No notifications found in your account.
            </p>
          </div>
        )}
      </div>

      {/* 4. Bottom Footer Note with Clear All & Preferences */}
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[11px] text-foreground-muted px-1">
        {notificationsList.length > 0 ? (
          <button
            type="button"
            onClick={handleClearAll}
            className="hover:text-red-500 transition font-medium"
          >
            Clear all
          </button>
        ) : (
          <span>TrackKaro Cloud Sync</span>
        )}

        <Link
          href="/dashboard/settings"
          onClick={onClose}
          className="text-[#059669] dark:text-emerald-400 hover:underline font-bold transition"
        >
          Alert Settings →
        </Link>
      </div>
    </div>
  );
}
