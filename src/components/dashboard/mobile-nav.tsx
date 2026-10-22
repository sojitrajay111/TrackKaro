"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSignOut } from "@/store/api/authApi";
import { compactCount, useNavSections } from "./sidebar";

/**
 * Phone / tablet navigation (below lg the sidebar is hidden): a menu button that slides the
 * same menu in from the left.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { signOut } = useSignOut();
  const { sections, displayName, initials, user } = useNavSections();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) => (href === "/dashboard" ? pathname === href : pathname === href || Boolean(pathname?.startsWith(`${href}/`)));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="lg:hidden inline-grid h-10 w-10 shrink-0 place-items-center rounded-[12px] border border-border bg-surface text-foreground shadow-xs transition hover:bg-surface-muted"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      </button>

      <div className={`tk-mnav lg:hidden ${open ? "is-open" : ""}`} aria-hidden={!open}>
        <div className="tk-mnav__scrim" onClick={() => setOpen(false)} />
        <nav aria-label="Main" className="tk-mnav__panel flex flex-col">
          <div className="flex items-center justify-between gap-2 pb-3">
            <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2.5">
              <span className="h-10 w-10 overflow-hidden rounded-[12px]">
                <Image src="/logo.png" alt="" width={40} height={40} className="h-full w-full scale-[1.16] object-contain" />
              </span>
              <span className="text-[20px] font-extrabold tracking-[-0.03em] text-foreground">TrackKaro</span>
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="inline-grid h-10 w-10 place-items-center rounded-[12px] text-foreground-muted transition hover:bg-[var(--side-hover)] hover:text-foreground"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
            {sections.map((section) => (
              <div key={section.label}>
                <p className="px-3 pb-1.5 pt-3 text-[12px] font-extrabold uppercase tracking-[0.1em] text-foreground-muted">{section.label}</p>
                {section.items.map((item, i) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      style={{ animationDelay: `${0.04 + i * 0.025}s` }}
                      className={`tk-mnav__item flex h-11 items-center gap-3 rounded-[14px] px-3 text-[16px] font-[650] transition ${
                        active ? "bg-[var(--side-pill)] text-[var(--on-side-pill)]" : "text-foreground hover:bg-[var(--side-hover)]"
                      }`}
                    >
                      <span className="shrink-0 opacity-90">{item.icon}</span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.count !== undefined && (
                        <span
                          className={`inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-[7px] text-[13px] font-extrabold num ${
                            active ? "bg-[var(--on-side-pill)] text-[var(--side-pill)]" : "bg-[var(--side-soft)] text-foreground"
                          }`}
                        >
                          {compactCount(item.count)}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-border pt-3">
            <Link href="/dashboard/settings" onClick={() => setOpen(false)} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl p-2 hover:bg-[var(--side-hover)]">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--primary)] text-[13px] font-bold text-[var(--on-primary)]">{initials}</span>
              <span className="min-w-0">
                <b className="block truncate text-[15px] font-bold text-foreground">{displayName}</b>
                <small className="block truncate text-[13px] text-foreground-muted">{user?.email}</small>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              aria-label="Sign out"
              className="inline-grid h-10 w-10 place-items-center rounded-[12px] text-foreground-muted transition hover:bg-[var(--side-hover)] hover:text-[var(--bad)]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}
