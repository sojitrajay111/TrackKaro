"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { SITE } from "@/lib/site";

const PRODUCT_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#comparison", label: "Compare" },
  { href: "/#faq", label: "FAQ" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

export function Footer() {
  const pathname = usePathname();

  // The dashboard and the sign-in screens have no marketing footer.
  if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/auth")) {
    return null;
  }

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-8">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-foreground-muted">
              {SITE.description}
            </p>
          </div>

          <div>
            <h3 className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-foreground-muted">Product</h3>
            <ul className="mt-4 space-y-2.5">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[15px] font-semibold text-foreground transition hover:text-[var(--primary)]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-foreground-muted">Legal</h3>
            <ul className="mt-4 space-y-2.5">
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[15px] font-semibold text-foreground transition hover:text-[var(--primary)]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-foreground-muted">Contact &amp; Social</h3>
            <ul className="mt-4 space-y-2.5 text-[15px] font-semibold text-foreground-muted">
              <li>
                <a href={`mailto:${SITE.supportEmail}`} className="transition hover:text-[var(--primary)]">
                  {SITE.supportEmail}
                </a>
              </li>
              <li>
                <a
                  href={SITE.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 font-medium text-foreground transition hover:text-[var(--primary)]"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-sm transition group-hover:scale-105">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                    </svg>
                  </span>
                  <span>{SITE.instagramHandle}</span>
                </a>
              </li>
              <li>Made in India · ₹ · English, हिंदी, ગુજરાતી</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-[13px] font-semibold text-foreground-muted sm:flex-row">
          <p>© {new Date().getFullYear()} TrackKaro. All rights reserved.</p>
          <a
            href={SITE.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium transition hover:text-foreground"
          >
            <span>Follow on Instagram:</span>
            <span className="font-bold text-[var(--primary)]">{SITE.instagramHandle}</span>
          </a>
          <p>Not a bank, lender or SEBI-registered investment advisor. See Terms for details.</p>
        </div>
      </div>
    </footer>
  );
}
