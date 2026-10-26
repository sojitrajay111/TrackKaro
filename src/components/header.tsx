"use client";

import { useState } from "react";
import { useMounted } from "@/lib/use-mounted";
import Link from "next/link";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { NAV_LINKS, SITE } from "@/lib/site";
import { useAppSelector } from "@/store";
import { useSignOut } from "@/store/api/authApi";

import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { signOut } = useSignOut();
  const auth = useAppSelector((state) => state.auth);
  // The session is restored from browser storage, which the server can't see. Render the
  // signed-out header for the server pass and first client render, then the real state —
  // otherwise React reports a hydration mismatch.
  const mounted = useMounted();
  const isAuthenticated = mounted && auth.isAuthenticated;
  const user = mounted ? auth.user : null;

  // The dashboard and the sign-in screens have their own chrome.
  if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/auth")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between px-5 md:px-8">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-[10px] px-3 py-2 text-[15px] font-bold text-foreground-muted transition hover:bg-surface hover:text-foreground"
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-border bg-surface text-foreground-muted transition hover:text-foreground"
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
                className="flex h-10 items-center gap-2 rounded-[12px] border border-border bg-surface px-3 text-[14px] font-bold text-foreground transition hover:bg-surface-muted"
                title="Open Dashboard"
              >
                <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
                <span className="max-w-[120px] truncate">{user.name}</span>
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center gap-1.5 rounded-[12px] bg-[var(--primary)] px-4 text-[14px] font-bold text-[var(--on-primary)] shadow-xs transition hover:bg-[var(--primary-strong)]"
              >
                Dashboard →
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                className="rounded-[10px] px-2.5 py-2 text-[14px] font-bold text-foreground-muted transition hover:text-[var(--bad)]"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-1">
              <Link
                href="/auth/login"
                className="rounded-[10px] px-3 py-2 text-[15px] font-bold text-foreground transition hover:bg-surface"
              >
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex h-10 items-center rounded-[12px] bg-[var(--primary)] px-4 text-[15px] font-bold text-[var(--on-primary)] shadow-xs transition hover:bg-[var(--primary-strong)]"
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-border bg-surface text-foreground"
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
                className="rounded-[12px] px-3 py-2.5 text-[15px] font-bold text-foreground-muted hover:bg-surface hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={SITE.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-[15px] font-bold text-foreground-muted hover:bg-surface hover:text-foreground"
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
                    <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
                    <span className="text-[15px] font-bold text-foreground">{user.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void signOut();
                      setOpen(false);
                    }}
                    className="text-[14px] font-bold text-[var(--bad)] hover:underline"
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
                  className="flex h-11 items-center justify-center rounded-[14px] border border-border bg-surface text-[15px] font-bold text-foreground"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setOpen(false)}
                  className="flex h-11 items-center justify-center rounded-[14px] bg-[var(--primary)] text-[15px] font-bold text-[var(--on-primary)] shadow-xs"
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
