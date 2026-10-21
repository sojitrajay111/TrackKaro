"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/store";
import { useI18n } from "@/i18n";
import { useGetNotificationsQuery } from "@/store/api/notificationsApi";
import { NotificationsPopover } from "./notifications-popover";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";

export function DashboardHeader() {
  const pathname = usePathname();
  const { user } = useAppSelector((state) => state.auth);
  const { t } = useI18n();
  const [showNotifications, setShowNotifications] = useState(false);

  // Directly fetch from notifications endpoint
  const { data: apiNotifications = [] } = useGetNotificationsQuery();
  const unreadCount = apiNotifications.filter((n) => !n.read).length;

  const navItems = [
    { id: "overview", label: t.navOverview || "Overview", href: "/dashboard" },
    { id: "expenses", label: t.navExpenses || "Expenses", href: "/dashboard/expenses" },
    { id: "khata", label: t.navKhata || "Khata", href: "/dashboard/khata" },
    { id: "groups", label: t.navGroups || "Groups", href: "/dashboard/groups" },
    { id: "deals", label: t.navDeals || "Deals", href: "/dashboard/deals" },
    { id: "spending", label: "Analytics", href: "/dashboard/spending" },
    { id: "settings", label: t.settings || "Settings", href: "/dashboard/settings" },
  ];

  return (
    <header className="shrink-0 z-30 w-full pt-3 pb-2 transition-all">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-8">
        {/* Left Side: Mobile Logo */}
        <div className="flex items-center gap-3">
          {/* Mobile Logo pill (visible only below lg) */}
          <Link
            href="/dashboard"
            className="lg:hidden flex items-center gap-2 rounded-2xl glass glass--chrome glass-specular px-3 py-1.5 shadow-sm"
          >
            <Image
              src="/logo.png"
              alt="TrackKaro"
              width={24}
              height={24}
              className="h-5 w-5 rounded-md object-contain"
              priority
            />
            <span className="font-display text-sm font-bold tracking-tight text-foreground">
              Track<span className="text-emerald-500">Karo</span>
            </span>
          </Link>
        </div>

        {/* Right Side: Liquid Glass Tools Pill */}
        <div className="flex items-center gap-2 rounded-2xl glass glass--chrome glass-specular px-2.5 py-1.5 shadow-sm">
          {/* Language Toggle */}
          <div className="hidden sm:block">
            <LanguageToggle />
          </div>

          {/* Theme Switcher Button */}
          <ThemeToggle />

          {/* Notification Bell with Badge */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((prev) => !prev)}
              className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl transition hover:bg-white/20 dark:hover:bg-white/10 ${
                showNotifications ? "bg-emerald-500/20 text-emerald-500" : "text-foreground-sub hover:text-foreground"
              }`}
              title={t.notifications || "Notifications"}
              aria-label="Toggle notifications"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute 1.5 top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-amber-400 ring-2 ring-background animate-pulse" />
              )}
            </button>

            <NotificationsPopover
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
            />
          </div>

          {/* Quick Settings Avatar Link */}
          <Link
            href="/dashboard/settings"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs shadow-xs transition hover:scale-105"
            title={`${user?.name || "User"} (${t.settings || "Settings"})`}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </Link>
        </div>
      </div>

      {/* Mobile Horizontal Pill Scroll */}
      <div className="lg:hidden flex overflow-x-auto px-4 pb-1 pt-2 gap-1.5 no-scrollbar">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-xs ${
                isActive
                  ? "bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-emerald-950"
                  : "glass glass--card text-foreground-sub hover:text-foreground"
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
