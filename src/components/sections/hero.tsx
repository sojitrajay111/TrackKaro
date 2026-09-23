import Link from "next/link";

const TRUST_CHIPS = [
  "🤖 Gemini AI Copilot",
  "🛍️ Live Amazon India Deals",
  "🧠 AI Purchase Conscience",
  "📖 Digital Bahi Khata",
  "👥 Shared Expense Groups",
  "🌐 English · हिंदी · ગુજરાતી",
  "🔒 JWT-Secured",
];

function PhoneMock() {
  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      <div className="absolute -inset-6 -z-10 rounded-[3rem] brand-glow" />
      <div className="rounded-[2.4rem] border border-border bg-surface p-3 card-shadow">
        <div className="rounded-[1.9rem] bg-background p-4">
          {/* status row */}
          <div className="mb-4 flex items-center justify-between text-[10px] font-semibold text-foreground-muted">
            <span>9:41</span>
            <span>●●●●</span>
          </div>

          {/* balance hero card */}
          <div className="rounded-2xl bg-gradient-to-br from-[#0B5338] to-[#063B28] p-4 text-white">
            <p className="text-[10px] font-semibold text-[#A7F3D0]">Total Balance</p>
            <p className="mt-1 text-2xl font-extrabold">₹42,318</p>
            <div className="mt-3 flex gap-2">
              <span className="rounded-full bg-white/12 px-2.5 py-1 text-[9.5px] font-bold">↑ 12% saved</span>
            </div>
          </div>

          {/* AI Deal Conscience badge snippet */}
          <div className="mt-3.5 rounded-xl border border-primary/30 bg-primary/5 p-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🎧</span>
                <span className="text-[11px] font-bold text-foreground">OnePlus Buds Pro</span>
              </div>
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[8.5px] font-extrabold text-primary">SAFE TO BUY</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-foreground-muted">
              <span>Amazon · ₹4,499 (25% off)</span>
              <span className="font-semibold text-primary">₹8,500 headroom</span>
            </div>
          </div>

          {/* budget bar */}
          <div className="mt-3 rounded-xl border border-border bg-surface p-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-foreground">
              <span>Food Budget</span>
              <span className="text-primary">68%</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
              <div className="h-full w-[68%] rounded-full bg-primary" />
            </div>
          </div>

          {/* transaction rows */}
          <div className="mt-3 space-y-2">
            {[
              { icon: "🍔", name: "Swiggy", amt: "-₹450" },
              { icon: "⛽", name: "Petrol", amt: "-₹1,200" },
            ].map((t) => (
              <div key={t.name} className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg text-xs" style={{ background: "var(--color-primary-soft)" }}>
                    {t.icon}
                  </span>
                  <span className="text-[11.5px] font-bold text-foreground">{t.name}</span>
                </div>
                <span className={`text-[11.5px] font-extrabold ${t.amt.startsWith("+") ? "text-primary" : "text-foreground"}`}>
                  {t.amt}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[560px] brand-glow" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-[11.5px] font-bold text-primary">
            ✨ Live Amazon Deals · AI Purchase Conscience · Bahi Khata
          </span>
          <h1 className="mt-5 text-[clamp(30px,5vw,48px)] font-extrabold leading-[1.1] tracking-tight text-foreground">
            Track spending, split expenses &amp; stay ahead — all in one app.
          </h1>
          <p className="mt-5 max-w-lg text-[15.5px] leading-relaxed text-foreground-sub">
            TrackKaro is a privacy-first personal finance app for India — combining digital bahi khata,
            shared group expenses, real-time Amazon deals with an AI purchase conscience, smart bill reminders,
            and trilingual support in English, Hindi and Gujarati.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="#download"
              className="inline-flex h-12 items-center rounded-full bg-primary px-6 text-sm font-bold text-white shadow-sm transition hover:bg-primary-strong"
            >
              Download TrackKaro
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex h-12 items-center rounded-full border border-border bg-surface px-6 text-sm font-bold text-foreground transition hover:border-primary/40 hover:text-primary"
            >
              See how it works
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {TRUST_CHIPS.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-[11.5px] font-semibold text-foreground-sub"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        <PhoneMock />
      </div>
    </section>
  );
}
