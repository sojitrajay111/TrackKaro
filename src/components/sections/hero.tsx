"use client";

import Link from "next/link";
import { Illustration } from "@/components/ui/illustration";
import { mktBtnGhost, mktBtnPrimary } from "@/components/section-heading";
import { useAppSelector } from "@/store";
import { useMounted } from "@/lib/use-mounted";

const TRUST = [
  { icon: "M12 3 5 6v6c0 4 3 7.5 7 9 4-1.5 7-5 7-9V6zM9 12l2 2 4-4", text: "Private by default — we never sell your data" },
  { icon: "M4 6h16M4 12h10M4 18h7", text: "English · हिंदी · ગુજરાતી" },
  { icon: "M7 3h10v18H7zM10 18h4", text: "Phone app + web, always in sync" },
] as const;

/** Illustrative preview of the dashboard (sample figures, not a real account). */
function ProductPreview() {
  const bars = [38, 62, 45, 80, 54, 70, 92];
  // Floating cards live in the bands above and below the main card (sm+: pt/pb), so they only
  // overlap its edge, never its figures.
  return (
    <div className="relative mx-auto w-full max-w-[520px] sm:pb-32 sm:pt-24" aria-hidden="true">
      <div className="absolute inset-0 -z-10 rounded-[3rem] bg-[var(--primary-soft)] blur-3xl" />

      {/* Main card: this month */}
      <div className="tk-drift rounded-[24px] border border-border bg-surface p-5 shadow-[var(--shadow-pop)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-bold text-foreground-muted">Spent this month</p>
            <p className="text-[32px] font-extrabold leading-tight tracking-[-0.04em] text-foreground num">₹28,450</p>
          </div>
          <span className="pill pill--good">
            <i />
            On budget
          </span>
        </div>
        <div className="mt-4 flex h-24 items-end gap-2">
          {bars.map((h, i) => (
            <span
              key={i}
              className="flex-1 rounded-[6px_6px_3px_3px]"
              style={{ height: `${h}%`, background: i === bars.length - 1 ? "var(--primary)" : "color-mix(in srgb, var(--primary) 28%, var(--surface-2))" }}
            />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            ["Food", "₹6,200", "var(--amber)"],
            ["Bills", "₹4,850", "var(--violet)"],
            ["Travel", "₹3,100", "var(--sky)"],
          ].map(([l, v, c]) => (
            <div key={l} className="rounded-[12px] border border-border bg-[var(--surface-2)] px-2.5 py-2">
              <p className="flex items-center gap-1.5 text-[12px] font-bold text-foreground-muted">
                <i className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
                {l}
              </p>
              <p className="text-[15px] font-extrabold text-foreground num">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Floating: khata */}
      <div className="tk-drift tk-drift--b absolute left-0 top-0 hidden w-[230px] rounded-[18px] border border-border bg-surface p-3.5 shadow-[var(--shadow-pop)] sm:block">
        <p className="text-[12px] font-extrabold uppercase tracking-[0.06em] text-foreground-muted">Khata</p>
        <div className="mt-1.5 flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#f6d9b8] text-[13px] font-extrabold text-[#1e1724]">RM</span>
          <div className="min-w-0 flex-1">
            <p className="whitespace-nowrap text-[14px] font-bold text-foreground">Rahul Mehta</p>
            <p className="text-[12px] font-semibold text-[var(--good)]">will pay you</p>
          </div>
          <b className="text-[15px] font-extrabold text-[var(--good)] num">+₹2,400</b>
        </div>
      </div>

      {/* Floating: split group */}
      <div className="tk-drift tk-drift--c absolute bottom-0 right-0 hidden w-[240px] rounded-[18px] border border-border bg-surface p-3.5 shadow-[var(--shadow-pop)] sm:block">
        <p className="text-[12px] font-extrabold uppercase tracking-[0.06em] text-foreground-muted">Goa trip · settle up</p>
        <p className="mt-1.5 text-[14px] text-foreground">
          <b className="font-bold">Priya</b> <span className="text-foreground-muted">pays</span> <b className="font-bold">You</b>
        </p>
        <div className="mt-1 flex items-center justify-between">
          <b className="text-[18px] font-extrabold text-foreground num">₹2,362</b>
          <span className="rounded-[8px] bg-[var(--primary)] px-2 py-1 text-[12px] font-bold text-[var(--on-primary)]">Settle</span>
        </div>
      </div>

      {/* Floating: deal check */}
      <div className="tk-drift tk-drift--b absolute right-0 top-6 hidden rounded-[14px] border border-[color-mix(in_srgb,var(--primary)_35%,transparent)] bg-[var(--primary-soft)] px-3 py-2 shadow-xs lg:block">
        <p className="text-[12px] font-extrabold text-[var(--primary)]">✓ Safe to buy</p>
        <p className="text-[12px] font-semibold text-foreground-muted">Fits your Shopping budget</p>
      </div>
    </div>
  );
}

export function Hero() {
  // Signed-in state comes from browser storage: only use it after hydration (server shows signed-out).
  const mounted = useMounted();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated) && mounted;

  return (
    <section className="relative overflow-hidden">
      <div className="tk-mkt-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-6 pt-8 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-8 lg:pt-12">
        <div className="tk-pop">
          <h1 className="text-[clamp(2.4rem,5.4vw,4rem)] font-extrabold leading-[1.02] tracking-[-0.045em] text-foreground">
            Every rupee, <span className="text-[var(--primary)]">accounted for.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[18px] leading-relaxed text-foreground-muted">
            Track spending and budgets, keep a digital khata, split bills with friends, never miss a bill, and check if a deal really fits your budget — in one app.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard" className={mktBtnPrimary}>
                Open your dashboard
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            ) : (
              <Link href="/auth/signup" className={mktBtnPrimary}>
                Get started — it&apos;s free
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            )}
            <Link href="/#features" className={mktBtnGhost}>
              See what it does
            </Link>
          </div>

          <ul className="mt-9 grid gap-2.5">
            {TRUST.map((t) => (
              <li key={t.text} className="flex items-center gap-2.5 text-[15px] font-semibold text-foreground-muted">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] bg-[var(--primary-soft)] text-[var(--primary)]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d={t.icon} />
                  </svg>
                </span>
                {t.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <ProductPreview />
          <Illustration name="person-receiving-money" height={112} className="absolute bottom-0 left-2 hidden sm:inline-block" />
        </div>
      </div>
    </section>
  );
}
