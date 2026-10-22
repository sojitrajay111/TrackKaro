import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

/** Sign-in / sign-up / reset shell: Kesta card on the mint backdrop, app logo on top. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-[calc(100vh-4.25rem)] w-full flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div className="relative z-10 mx-auto flex w-full max-w-[440px] flex-col items-center">
        <div className="mb-5 flex w-full items-center justify-between px-1">
          <Link href="/" className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-2 text-[14px] font-bold text-foreground-muted transition hover:bg-surface hover:text-foreground">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to home
          </Link>
          <ThemeToggle />
        </div>

        <div className="tk-pop w-full rounded-[24px] border border-border bg-[var(--raised)] p-7 shadow-[var(--shadow-pop)] sm:p-9">
          <Link href="/" className="mb-6 flex items-center justify-center gap-2.5" aria-label="TrackKaro home">
            <span className="h-11 w-11 overflow-hidden rounded-[13px] shadow-[0_4px_14px_-4px_#04785766]">
              <Image src="/logo.png" alt="" width={44} height={44} priority className="h-full w-full scale-[1.16] object-contain" />
            </span>
            <span className="text-[22px] font-extrabold tracking-[-0.03em] text-foreground">TrackKaro</span>
          </Link>
          {children}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-[13px] font-semibold text-foreground-muted">
          <span className="inline-flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect width="16" height="10" x="4" y="11" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            Secure HTTPS sign-in
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 21s8-4 8-10V5l-8-3-8 3v6c0 6 8 10 8 10" />
            </svg>
            We never sell your data
          </span>
        </div>
      </div>
    </div>
  );
}
