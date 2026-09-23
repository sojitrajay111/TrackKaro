const STEPS = [
  {
    n: "01",
    icon: "✍️",
    title: "Log it in seconds",
    body: "Type it, speak it, or scan the receipt — AI turns it into a categorized transaction instantly.",
  },
  {
    n: "02",
    icon: "🎯",
    title: "Track budgets & khata",
    body: "Watch category budgets and peer-to-peer balances update live, with alerts before you overspend.",
  },
  {
    n: "03",
    icon: "👥",
    title: "Split with your group",
    body: "Add a shared expense once — TrackKaro works out who owes whom, and you confirm your own share.",
  },
  {
    n: "04",
    icon: "🛍️",
    title: "Shop smart & export",
    body: "Search live Amazon India deals with AI budget-safety checks, consult your Gemini copilot, and export PDF statements anytime.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[11.5px] font-bold uppercase tracking-wider text-primary">How it works</span>
          <h2 className="mt-3 text-[clamp(24px,3.5vw,34px)] font-extrabold tracking-tight text-foreground">
            From a single tap to the full picture
          </h2>
        </div>

        <div className="relative mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-border lg:block" />
          {STEPS.map((s) => (
            <div key={s.n} className="relative">
              <div className="flex items-center gap-3">
                <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg text-white shadow-sm">
                  {s.icon}
                </span>
                <span className="text-[13px] font-extrabold text-foreground-muted">{s.n}</span>
              </div>
              <h3 className="mt-4 text-[15px] font-extrabold text-foreground">{s.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-foreground-sub">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
