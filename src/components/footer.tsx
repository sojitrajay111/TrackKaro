import Link from "next/link";
import { Logo } from "./logo";
import { SITE } from "@/lib/site";

const PRODUCT_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it Works" },
  { href: "/#download", label: "Download" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-foreground-sub">
              {SITE.description}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-foreground-muted">Product</h3>
            <ul className="mt-4 space-y-2.5">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-foreground-sub transition hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-foreground-muted">Legal</h3>
            <ul className="mt-4 space-y-2.5">
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-foreground-sub transition hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-foreground-muted">Contact</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-foreground-sub">
              <li>
                <a href={`mailto:${SITE.supportEmail}`} className="transition hover:text-primary">
                  {SITE.supportEmail}
                </a>
              </li>
              <li>Made for India 🇮🇳 — INR, UPI &amp; trilingual by default</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-foreground-muted sm:flex-row">
          <p>© {new Date().getFullYear()} TrackKaro. All rights reserved.</p>
          <p>Not a bank, lender or SEBI-registered investment advisor. See Terms for details.</p>
        </div>
      </div>
    </footer>
  );
}
