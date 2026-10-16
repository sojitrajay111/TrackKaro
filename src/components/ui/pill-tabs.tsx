"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface PillTabItem {
  id: string;
  label: string;
  href: string;
}

interface PillTabsProps {
  items: PillTabItem[];
  activeId?: string;
  className?: string;
}

export function PillTabs({ items, activeId, className = "" }: PillTabsProps) {
  const pathname = usePathname();

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface/90 p-1.5 backdrop-blur-md shadow-sm ${className}`}
    >
      {items.map((item) => {
        const isActive = activeId
          ? activeId === item.id
          : pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));

        return (
          <Link
            key={item.id}
            href={item.href}
            className={`relative rounded-full px-5 py-2 text-xs sm:text-[13px] font-bold transition-all duration-200 select-none ${
              isActive
                ? "bg-foreground text-background shadow-md shadow-black/10 dark:bg-emerald-400 dark:text-emerald-950"
                : "text-foreground-sub hover:text-foreground hover:bg-surface-muted"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
