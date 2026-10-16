import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-[calc(100vh-4.25rem)] w-full overflow-hidden bg-background py-10 px-4 flex flex-col justify-center items-center">
      {/* Background radial glow & grid */}
      <div className="pointer-events-none absolute inset-0 brand-glow opacity-60" />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(5,150,105,0.15),rgba(255,255,255,0))]"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center">
        {/* Navigation row above card */}
        <div className="w-full mb-6 flex items-center justify-between px-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-foreground-sub hover:text-primary transition-colors"
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
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Home
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>

        {/* Auth card container */}
        <div className="w-full rounded-2xl border border-border/80 bg-surface/90 p-7 sm:p-9 shadow-xl backdrop-blur-xl card-shadow">
          <div className="mb-6 flex justify-center">
            <Logo />
          </div>
          {children}
        </div>

        {/* Security / trust reassurance */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-center text-xs text-foreground-muted">
          <span className="inline-flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            256-Bit SSL Encryption
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
            </svg>
            Privacy First
          </span>
          <span>•</span>
          <span>Zero Data Selling</span>
        </div>
      </div>
    </div>
  );
}
