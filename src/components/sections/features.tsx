type Feature = {
  icon: string;
  tag?: string;
  title: string;
  body: string;
};

const FEATURES: Feature[] = [
  {
    icon: "🤖",
    title: "AI Financial Copilot & Receipt Scanner",
    body: "Ask TrackKaro's Gemini-powered assistant for money advice, log expenses by typing or speaking naturally, or snap a receipt photo and let AI extract the merchant, amount and category for you.",
  },
  {
    icon: "📖",
    title: "Digital Bahi Khata Ledger",
    body: "A familiar double-entry ledger for peer-to-peer debts — You Gave / You Got — with consolidated customer balances, WhatsApp statement sharing and printable PDF statements.",
  },
  {
    icon: "👥",
    title: "Shared Expense Groups",
    body: "Split trips, rent and dinners equally, by exact amount, or by percentage. A built-in debt-simplification engine works out who owes whom with the fewest possible payments.",
  },
  {
    icon: "✅",
    tag: "New",
    title: "Confirm Group Expenses",
    body: "One page lists every group expense split you're part of, anywhere across your groups, so you decide exactly when a shared cost gets added to your personal spending.",
  },
  {
    icon: "🎯",
    title: "Budgets with Smart Alerts",
    body: "Set monthly limits per category and get warned at 80% and 100% spent — with a master progress view across every category at a glance.",
  },
  {
    icon: "🛍️",
    title: "Deal Finder & Price Alerts",
    body: "Live AI deal discovery across Amazon, Flipkart, Myntra, Swiggy, Zomato and more — with coupon stacking, cashback math and custom price-drop alerts.",
  },
  {
    icon: "📱",
    title: "Subscriptions & Bill Reminders",
    body: "Track recurring costs with AI redundancy detection for duplicate subscriptions, plus due-date countdowns for bills so nothing sneaks up on you.",
  },
  {
    icon: "📤",
    tag: "New",
    title: "Download Reports — CSV & PDF",
    body: "Export a clean spreadsheet or a fully formatted PDF statement — filtered by date range and by transactions, khata, budgets or group expenses — in one tap.",
  },
  {
    icon: "🌐",
    title: "Trilingual by Default",
    body: "Every screen, toast and button is natively available in English, Hindi (हिंदी) and Gujarati (ગુજરાતી) — plus light, dark and system theme modes.",
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-border bg-surface-muted/40 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[11.5px] font-bold uppercase tracking-wider text-primary">Everything in one app</span>
          <h2 className="mt-3 text-[clamp(24px,3.5vw,34px)] font-extrabold tracking-tight text-foreground">
            Built for how India actually manages money
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground-sub">
            From daily spending to shared trips with friends — TrackKaro covers the full picture,
            backed by AI where it genuinely helps.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-surface p-5 card-shadow transition hover:-translate-y-0.5 hover:border-primary/30"
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                  style={{ background: "var(--color-primary-soft)" }}
                >
                  {f.icon}
                </span>
                {f.tag && (
                  <span className="rounded-full bg-accent px-2.5 py-1 text-[9.5px] font-extrabold text-[#06210F]">
                    {f.tag}
                  </span>
                )}
              </div>
              <h3 className="mt-3.5 text-[15px] font-extrabold text-foreground">{f.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-foreground-sub">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
