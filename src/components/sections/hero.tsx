import Link from "next/link";
import { SITE } from "@/lib/site";

const STATS = [
  { value: "1 app", label: "Expenses, khata, deals & bills" },
  { value: "India-first", label: "UPI, ₹, and local language" },
  { value: "Private", label: "Your data stays on your device" },
] as const;

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="page-grid-bg pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      <div className="brand-glow pointer-events-none absolute inset-x-0 top-0 h-[420px]" aria-hidden />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-14 md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-10 md:px-8 md:pb-24 md:pt-20">
        <div>
          <p className="section-eyebrow">Personal finance for India</p>
          <h1 className="mt-4 text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.08] tracking-tight text-foreground">
            Track spending. Split fairly.{" "}
            <span className="text-primary">Shop smarter.</span>
          </h1>
          <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-foreground-sub md:text-[17px]">
            {SITE.description}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/#download" className="btn-primary">
              Coming soon
            </Link>
            <Link href="/#how-it-works" className="btn-secondary">
              See how it works
            </Link>
          </div>

          <ul className="mt-10 grid gap-4 sm:grid-cols-3">
            {STATS.map((item) => (
              <li
                key={item.value}
                className="rounded-2xl border border-border bg-surface/80 px-4 py-3 backdrop-blur-sm"
              >
                <p className="text-sm font-bold text-foreground">{item.value}</p>
                <p className="mt-0.5 text-xs leading-snug text-foreground-sub">{item.label}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-[320px] md:max-w-none md:justify-self-end">
          <div
            className="absolute -inset-6 rounded-[2rem] bg-primary/10 blur-2xl"
            aria-hidden
          />
          <div className="relative rounded-[2rem] border border-border bg-surface p-3 shadow-[0_24px_64px_-24px_rgba(15,23,42,0.18)]">
            <div className="overflow-hidden rounded-[1.35rem] bg-background">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-xs font-semibold text-foreground-sub">Today</span>
                <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[10px] font-bold text-primary">
                  Live
                </span>
              </div>
              <div className="space-y-3 p-4">
                <div className="rounded-xl border border-border bg-surface p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground-sub">
                    Balance
                  </p>
                  <p className="mt-1 text-2xl font-extrabold tabular-nums text-foreground">
                    ₹12,480
                  </p>
                  <p className="mt-1 text-xs text-primary">Within monthly budget</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Khata", amount: "₹2,400" },
                    { label: "Groups", amount: "₹850" },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="rounded-xl border border-border bg-background px-3 py-2.5"
                    >
                      <p className="text-[10px] text-foreground-sub">{row.label}</p>
                      <p className="text-sm font-bold tabular-nums text-foreground">{row.amount}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-dashed border-primary/35 bg-primary-soft/50 px-3 py-2.5">
                  <p className="text-xs font-semibold text-foreground">Deal check</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-foreground-sub">
                    AI suggests waiting — price often drops in 5 days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
