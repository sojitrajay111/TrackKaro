"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/store";
import { useI18n } from "@/i18n";
import { useGetNotificationsQuery } from "@/store/api/notificationsApi";
import { NotificationsPopover } from "./notifications-popover";

export function DashboardHeader() {
  const pathname = usePathname();
  const { user } = useAppSelector((state) => state.auth);
  const { t } = useI18n();
  const [showNotifications, setShowNotifications] = useState(false);

  // Directly fetch from https://track-karo-backend.vercel.app/notifications
  const { data: apiNotifications = [] } = useGetNotificationsQuery();
  const unreadCount = apiNotifications.filter((n) => !n.read).length;

  const navItems = [
    { id: "overview", label: t.navOverview, href: "/dashboard" },
    { id: "expenses", label: t.navExpenses, href: "/dashboard/expenses" },
    { id: "khata", label: t.navKhata, href: "/dashboard/khata" },
    { id: "groups", label: t.navGroups, href: "/dashboard/groups" },
    { id: "deals", label: t.navDeals, href: "/dashboard/deals" },
  ];

  return (
    <header className="w-full pt-4 pb-2">
      <div className="mx-auto flex max-w-[1520px] items-center justify-between px-4 sm:px-8">
        {/* Left Side: Brand Pill with official TrackKaro Logo & Name */}
        <Link
          href="/dashboard"
          className="group flex items-center gap-2.5 rounded-full border border-border bg-surface px-4 py-2 shadow-xs backdrop-blur-md transition hover:border-primary/40 hover:scale-[1.01]"
        >
          <Image
            src="/logo.png"
            alt="TrackKaro"
            width={32}
            height={32}
            className="h-7 w-7 rounded-lg object-contain shrink-0 shadow-xs"
            priority
          />
          <span className="font-display text-[20px] font-medium tracking-tight text-foreground">
            Track<span className="font-bold text-primary">Karo</span>
          </span>
        </Link>

        {/* Right Side: Segmented Pill Navigation + Settings Pill + Bell + Avatar */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Segmented Pill Navigation Bar */}
          <nav className="hidden lg:flex items-center gap-1 rounded-full border border-border bg-surface p-1 shadow-xs backdrop-blur-md">
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`rounded-full px-5 py-2 text-[13px] font-medium transition-all duration-150 select-none ${
                    isActive
                      ? "bg-[#18261E] text-white shadow-xs dark:bg-emerald-400 dark:text-emerald-950"
                      : "text-foreground-sub hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Settings Pill Button */}
          <Link
            href="/dashboard/settings"
            className={`flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-[13px] font-medium text-foreground shadow-xs backdrop-blur-md transition hover:border-primary/40 ${
              pathname === "/dashboard/settings"
                ? "border-primary bg-primary/10 text-primary"
                : ""
            }`}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-foreground-sub"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
            <span>{t.settings}</span>
          </Link>

          {/* Circular Notification Bell with Badge & Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((prev) => !prev)}
              className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-foreground transition hover:border-primary/40 shadow-xs backdrop-blur-md ${
                showNotifications ? "ring-2 ring-emerald-500/50 border-primary" : ""
              }`}
              title={t.notifications}
              aria-label="Toggle notifications"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              {/* Amber Notification Counter Badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-black shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover Dropdown */}
            <NotificationsPopover
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
            />
          </div>

          {/* Circular User Avatar Button */}
          <Link
            href="/dashboard/settings"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-foreground transition hover:border-primary/50 hover:bg-surface-muted shadow-xs backdrop-blur-md"
            title={`${user?.name || "User"} (${t.settings})`}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-foreground"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Mobile Horizontal Pill Scroll */}
      <div className="lg:hidden flex overflow-x-auto px-4 pb-2 pt-2 gap-2 no-scrollbar">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition shadow-xs ${
                isActive
                  ? "bg-[#18261E] text-white dark:bg-emerald-400 dark:text-emerald-950"
                  : "bg-surface/90 border border-border text-foreground-sub"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
