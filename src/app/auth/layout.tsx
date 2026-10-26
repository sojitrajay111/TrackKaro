import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Illustration } from "@/components/ui/illustration";
import { ThemeToggle } from "@/components/theme-toggle";

const POINTS = [
  "Spending, budgets and bills in one view",
  "Digital khata with WhatsApp reminders",
  "Split trips and flats down to the paisa",
  "Deals checked against your own budget",
];

/**
 * Sign in / sign up / reset: split screen. Brand panel on the left (lg+), form on the right.
 * No marketing footer here (Footer hides itself on /auth).
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh w-full lg:grid-cols-[0.95fr_1.05fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-[#064e3b] px-12 py-12 text-white lg:flex lg:flex-col">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(70% 60% at 90% 0%, rgba(0,223,129,0.32), transparent 70%), radial-gradient(50% 50% at 0% 100%, rgba(16,185,129,0.22), transparent 70%)" }}
          aria-hidden
        />
        <Link href="/" className="relative flex items-center gap-2.5" aria-label="TrackKaro home">
          <span className="h-10 w-10 overflow-hidden rounded-[12px] shadow-[0_4px_14px_-4px_rgba(0,0,0,0.4)]">
            <Image src="/logo.png" alt="" width={40} height={40} priority className="h-full w-full scale-[1.16] object-contain" />
          </span>
          <span className="text-[20px] font-extrabold tracking-[-0.03em]">TrackKaro</span>
        </Link>

        <div className="relative mt-auto max-w-md">
          <h2 className="text-[clamp(2rem,3vw,2.6rem)] font-extrabold leading-[1.08] tracking-[-0.04em]">
            Every rupee, <span className="text-[#6ee7b7]">accounted for.</span>
          </h2>
          <ul className="mt-6 grid gap-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-3 text-[16px] font-semibold text-white/85">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/12">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m5 12.5 4.5 4.5L19 7.5" />
                  </svg>
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mt-auto flex items-end justify-between gap-6 pt-10">
          <p className="text-[14px] font-semibold text-white/60">English · हिंदी · ગુજરાતી · Phone + web in sync</p>
          <Illustration name="group-celebrating-win" height={150} color="rgba(255,255,255,0.9)" />
        </div>
      </aside>

      {/* Form column */}
      <section className="relative flex flex-col px-5 py-6 sm:px-8">
        {/* No site header here: logo (phones/tablets, where the brand panel is hidden), home link and theme toggle. */}
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 lg:invisible" aria-label="TrackKaro home">
            <span className="h-9 w-9 overflow-hidden rounded-[11px]">
              <Image src="/logo.png" alt="" width={36} height={36} className="h-full w-full scale-[1.16] object-contain" />
            </span>
            <span className="text-[18px] font-extrabold tracking-[-0.03em] text-foreground">TrackKaro</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="inline-flex h-10 items-center gap-1.5 rounded-[12px] px-3 text-[14px] font-bold text-foreground-muted transition hover:bg-surface hover:text-foreground">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m15 18-6-6 6-6" />
              </svg>
              Home
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="tk-pop w-full max-w-[420px]">{children}</div>
        </div>
      </section>
    </div>
  );
}
