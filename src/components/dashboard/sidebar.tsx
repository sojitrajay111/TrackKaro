"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/store";
import { useSignOut } from "@/store/api/authApi";
import { useI18n } from "@/i18n";
import { useGetTransactionsQuery } from "@/store/api/transactionsApi";
import { useGetKhataEntriesQuery } from "@/store/api/khataApi";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { signOut } = useSignOut();
  const { user } = useAppSelector((state) => state.auth);
  const { t } = useI18n();

  const { data: transactions = [] } = useGetTransactionsQuery();
  const { data: khataEntries = [] } = useGetKhataEntriesQuery();

  const navItems = [
    {
      id: "overview",
      label: t.navOverview || "Overview",
      href: "/dashboard",
      icon: (
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15V15a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5.5H5.5A1.5 1.5 0 0 1 4 19z" />
        </svg>
      ),
    },
    {
      id: "expenses",
      label: t.navExpenses || "Expenses",
      href: "/dashboard/expenses",
      badge: transactions.length > 0 ? transactions.length : undefined,
      icon: (
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="4" />
          <path d="m8.5 12 2.5 2.5 4.5-5" />
        </svg>
      ),
    },
    {
      id: "khata",
      label: t.navKhata || "Khata Ledger",
      href: "/dashboard/khata",
      badge: khataEntries.length > 0 ? khataEntries.length : undefined,
      icon: (
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10M6 10h10M6 14h6" />
        </svg>
      ),
    },
    {
      id: "groups",
      label: t.navGroups || "Groups",
      href: "/dashboard/groups",
      icon: (
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="8.5" r="3.5" />
          <path d="M3 19.5c.6-3.2 3-5 6-5s5.4 1.8 6 5" />
          <path d="M15.5 5.2a3.5 3.5 0 0 1 0 6.6M17.5 14.8c1.8.6 3 2.2 3.5 4.7" />
        </svg>
      ),
    },
    {
      id: "deals",
      label: t.navDeals || "Live Deals",
      href: "/dashboard/deals",
      icon: (
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      ),
    },
    {
      id: "spending",
      label: "Spending Analysis",
      href: "/dashboard/spending",
      icon: (
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 19.5h15" />
          <path d="M7.5 16v-4.5M12 16V7.5M16.5 16v-6.5" />
        </svg>
      ),
    },
    {
      id: "settings",
      label: t.settings || "Settings",
      href: "/dashboard/settings",
      icon: (
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2.8l2 2.1 2.9-.4.7 2.8 2.6 1.4-1 2.8 1 2.8-2.6 1.4-.7 2.8-2.9-.4-2 2.1-2-2.1-2.9.4-.7-2.8-2.6-1.4 1-2.8-1-2.8 2.6-1.4.7-2.8 2.9.4Z" />
        </svg>
      ),
    },
  ];

  const displayName = user?.name || "Friend";
  const userInitials = displayName.charAt(0).toUpperCase();

  return (
    <aside
      className="hidden lg:flex h-[calc(100vh-2rem)] my-4 ml-4 w-64 shrink-0 flex-col rounded-3xl glass glass--chrome glass-specular p-4 z-40 select-none shadow-2xl transition-all"
      aria-label="Dashboard Sidebar"
    >
      {/* Brand Header */}
      <Link
        href="/dashboard"
        className="group flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all hover:bg-white/10 dark:hover:bg-white/5"
      >
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-md">
          <Image
            src="/logo.png"
            alt="TrackKaro"
            width={28}
            height={28}
            className="h-6 w-6 rounded-lg object-contain"
            priority
          />
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-background animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="font-display text-[19px] font-bold tracking-tight text-foreground leading-none">
            Track<span className="text-emerald-600 dark:text-emerald-400">Karo</span>
          </span>
          <span className="text-[10px] uppercase font-semibold tracking-widest text-foreground-muted mt-1">
            Finance Glass
          </span>
        </div>
      </Link>

      {/* Nav List */}
      <nav className="mt-5 flex-1 space-y-1.5 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`group flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-[13.5px] font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 dark:bg-emerald-500 dark:text-emerald-950 font-bold"
                  : "text-foreground-sub hover:bg-white/30 dark:hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? "text-white dark:text-emerald-950" : "text-foreground-muted group-hover:text-primary"
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              {typeof item.badge === "number" && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold leading-none ${
                    isActive
                      ? "bg-white/25 text-white dark:bg-emerald-950/20 dark:text-emerald-950"
                      : "bg-surface-muted text-foreground-muted group-hover:bg-primary-soft group-hover:text-primary"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Pinned / Quick Ledger Pulse */}
      {/* <div className="my-3 px-3 py-2.5 rounded-2xl bg-white/20 dark:bg-white/5 border border-white/20 dark:border-white/10">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-foreground-muted">
          <span>Active Pulse</span>
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-foreground-sub">Smart Bahi Khata</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">Synced</span>
        </div>
      </div> */}

      {/* User Account / Sign Out */}
      <div className="pt-2 border-t border-border/40">
        <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-white/20 dark:bg-white/5 border border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 font-bold text-white text-xs shadow-xs">
              {userInitials}
            </div>
            <div className="truncate">
              <p className="truncate text-xs font-bold text-foreground leading-tight">{displayName}</p>
              <p className="truncate text-[10px] text-foreground-muted">{user?.email || "Personal"}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void signOut()}
            title="Log Out"
            aria-label="Log Out"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-foreground-muted hover:bg-rose-500/15 hover:text-rose-600 transition"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
