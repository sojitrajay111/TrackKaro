"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGetNotificationsQuery } from "@/store/api/notificationsApi";
import { NotificationsPopover } from "./notifications-popover";
import { ThemeToggle } from "@/components/theme-toggle";
import { RecordExpenseModal } from "@/components/ui/record-expense-modal";
import { NewMenu } from "./new-menu";
import { MobileNav } from "./mobile-nav";
import { SearchPalette } from "./search-palette";

export function DashboardHeader() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const { data: apiNotifications = [] } = useGetNotificationsQuery();
  const unreadCount = apiNotifications.filter((n) => !n.read).length;

  const todayText = useMemo(() => {
    const d = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
    };
    return d.toLocaleDateString("en-US", options);
  }, []);

  // Listen for ⌘K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="shrink-0 z-30 w-full pt-3 pb-3 transition-all">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-8">
          {/* Left: Mobile Brand Mark + Finder Button */}
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            {/* Phone menu (the sidebar is hidden below lg) */}
            <MobileNav />
            {/* Mobile Brand Mark */}
            <Link
              href="/dashboard"
              className="lg:hidden flex items-center justify-center w-9 h-9 overflow-hidden rounded-[11px] shrink-0 shadow-xs"
              aria-label="TrackKaro Overview"
            >
              <Image src="/logo.png" alt="" width={40} height={40} className="h-full w-full scale-[1.16] object-contain" />
            </Link>

            {/* Kesta Finder Button (⌘K) */}
            <button
              type="button"
              onClick={() => setShowSearch(true)}
              className="flex-1 max-w-md h-[42px] px-3.5 rounded-[12px] bg-surface hover:bg-surface-muted border border-border text-foreground-muted hover:text-foreground text-[15px] flex items-center justify-between transition-all shadow-xs"
              aria-label="Search (⌘K)"
            >
              <div className="flex items-center gap-2.5 truncate">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-foreground-muted"
                >
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="m16 16 4 4" />
                </svg>
                <span className="truncate">Search transactions, khata, budgets…</span>
              </div>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded-md text-[12px] font-bold num bg-surface-muted border border-border text-foreground-sub shadow-2xs">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Tools: Today pill, Theme switcher, Notifications, "+ New" */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Today Live Date */}
            <div className="hidden md:inline-flex items-center gap-2 h-11 px-3.5 rounded-[14px] bg-surface border border-border text-[15px] font-bold text-foreground shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#1f8366] inline-block animate-pulse" />
              <span>{todayText || "Tue, Oct 20"}</span>
            </div>

            {/* Theme Toggle Button */}
            <ThemeToggle className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-border bg-surface text-foreground-sub shadow-xs transition hover:text-foreground hover:bg-surface-muted" />

            {/* Notification Bell with Badge */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications((prev) => !prev)}
                className={`relative inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-border transition shadow-xs ${
                  showNotifications
                    ? "bg-foreground text-background"
                    : "bg-surface hover:bg-surface-muted text-foreground-sub hover:text-foreground"
                }`}
                title="Notifications"
                aria-label="Toggle notifications"
              >
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z" />
                  <path d="M10 20.5a2 2 0 0 0 4 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#e2683f] ring-2 ring-background animate-pulse" />
                )}
              </button>

              <NotificationsPopover
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
              />
            </div>

            {/* Kesta "+ New" quick-add menu */}
            <NewMenu />
          </div>
        </div>
      </header>

      <SearchPalette open={showSearch} onClose={() => setShowSearch(false)} />

      {/* Record Expense / Income Modal */}
      <RecordExpenseModal
        isOpen={showRecordModal}
        onClose={() => setShowRecordModal(false)}
      />
    </>
  );
}
