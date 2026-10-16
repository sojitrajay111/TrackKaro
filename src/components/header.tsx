"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { NAV_LINKS, SITE } from "@/lib/site";
import { useAppDispatch, useAppSelector } from "@/store";
import { logOut } from "@/store/slices/authSlice";

import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  if (pathname?.startsWith("/dashboard")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between px-5 md:px-8">
        <Logo />

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13.5px] font-semibold text-foreground-sub transition hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href={SITE.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TrackKaro on Instagram"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground-sub transition hover:border-pink-500/50 hover:text-pink-500"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
            </svg>
          </a>
          <ThemeToggle />

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2.5 pl-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary/50 hover:bg-surface-muted"
                title="Open Dashboard"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="max-w-[120px] truncate">{user.name}</span>
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-bold text-white shadow-sm transition hover:bg-primary-strong"
              >
                Dashboard →
              </Link>
              <button
                type="button"
                onClick={() => dispatch(logOut())}
                className="text-xs font-semibold text-foreground-sub hover:text-red-500 transition px-2 py-1"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-1">
              <Link
                href="/auth/login"
                className="text-[13.5px] font-semibold text-foreground-sub transition hover:text-primary px-3 py-2"
              >
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-[13px] font-bold text-white shadow-sm transition hover:bg-primary-strong"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground"
          >
            {open ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 pb-5 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground-sub hover:bg-surface-muted hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={SITE.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground-sub hover:bg-surface-muted hover:text-primary"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
              <span>Follow on Instagram ({SITE.instagramHandle})</span>
            </a>
            {isAuthenticated && user ? (
              <div className="mt-3 border-t border-border pt-3">
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-sm font-semibold text-foreground">{user.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      dispatch(logOut());
                      setOpen(false);
                    }}
                    className="text-xs font-semibold text-red-500 hover:underline"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                <Link
                  href="/auth/login"
                  onClick={() => setOpen(false)}
                  className="flex h-10 items-center justify-center rounded-xl border border-border text-sm font-semibold text-foreground"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setOpen(false)}
                  className="flex h-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-sm"
                >
                  Create account
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
