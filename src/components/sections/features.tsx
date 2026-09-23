type Feature = {
  icon: string;
  tag?: string;
  title: string;
  body: string;
};

const FEATURES: Feature[] = [
  {
    icon: "🤖",
    title: "AI Financial Copilot & Receipt OCR",
    body: "Ask TrackKaro's Gemini-powered assistant for money advice, log expenses by speaking or typing naturally, or snap a bill photo to extract the merchant, amount and category in seconds.",
  },
  {
    icon: "📖",
    title: "Digital Bahi Khata Ledger",
    body: "A familiar double-entry ledger for peer debts — You Gave / You Got — with native phonebook contact import, WhatsApp statement sharing, UPI reminders, and 1-tap settle up.",
  },
  {
    icon: "👥",
    title: "Shared Expense Groups",
    body: "Split trips, rent and dinners equally, by exact ₹ amounts, or by %. A built-in greedy pairwise algorithm simplifies debt to settle who owes whom in the fewest transactions.",
  },
  {
    icon: "✅",
    tag: "New",
    title: "Confirm Group Expenses",
    body: "A unified view lists every group expense split you're part of across all groups, giving you full control to file shared expenses into your personal ledger without double-counting.",
  },
  {
    icon: "🎯",
    title: "Budgets with Smart Warnings",
    body: "Set monthly spending limits per category and get intelligent warnings at 80% and 100% spent, with quick step-adjustments (+₹500 to +₹5,000) and master progress bars.",
  },
  {
    icon: "🛍️",
    tag: "Live",
    title: "Live Amazon India Deals",
    body: "Search any product in real time (smartphones, earbuds, fashion, essentials) across Amazon India with authentic INR prices, genuine discount percentages, and verified seller star ratings.",
  },
  {
    icon: "🧠",
    tag: "New",
    title: "AI Purchase Conscience",
    body: "\"Should you buy this?\" TrackKaro evaluates item costs against your remaining monthly category budget and upcoming bills, giving instant SAFE (green) or WAIT (amber) recommendations.",
  },
  {
    icon: "🔍",
    title: "Amazon-Style Search History",
    body: "Persistent search history pills with 1-tap re-queries, individual deletion, and \"Clear All\", plus seamless edge-to-edge fluid horizontal carousel or 2-column full grid layouts.",
  },
  {
    icon: "🏷️",
    title: "Price Drop Alerts & Lows",
    body: "Append-only historical price tracking detects all-time lows and lets you subscribe to target price-drop alerts with one tap, with clean affiliate redirection directly to Amazon.",
  },
  {
    icon: "📱",
    title: "Subscriptions & Bill Reminders",
    body: "Track recurring plans with AI redundancy detection for duplicate or overlapping subscriptions, plus smart countdown badges (Due in 3 days, Due Today!) to prevent late fees.",
  },
  {
    icon: "📤",
    tag: "New",
    title: "Download Reports — CSV & PDF",
    body: "Export a clean spreadsheet or a branded PDF statement with KPI cards, category graphs, and itemized ledgers — filtered by date range and customized by data scope in one tap.",
  },
  {
    icon: "🌐",
    title: "100% Trilingual & Multi-Theme",
    body: "Every screen, toast, and action is natively translated in English, Hindi (हिंदी), and Gujarati (ગુજરાતી), with Obsidian Dark, Clean Light, and System Default themes.",
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
