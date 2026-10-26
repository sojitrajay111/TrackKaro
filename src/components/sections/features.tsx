import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/marketing/reveal";
import { Illustration, type SceneName } from "@/components/ui/illustration";

type Feature = {
  title: string;
  body: string;
  points: string[];
  scene: SceneName;
  tint: string;
  wide?: boolean;
  /** Small label next to the title, e.g. "New". */
  badge?: string;
  /** An example of what to say, shown as a quote. */
  example?: string;
};

/** Only features that exist in the app and on the web today. Seven cards: the two wide ones
 * keep the 3-column grid full (2+1, 1+1+1, 1+2). */
const FEATURES: Feature[] = [
  {
    title: "Spending & budgets",
    body: "Log a payment in seconds — type it, say it, or scan the bill — and see exactly where your money goes.",
    points: ["Monthly limits per category with early warnings", "Daily and category charts", "PDF and CSV reports"],
    scene: "person-invoice",
    tint: "var(--primary)",
    wide: true,
  },
  {
    title: "Digital khata",
    body: "A running bahi khata for friends and shops: who owes whom, with due dates.",
    points: ["WhatsApp reminders and statements", "Settle everything in one tap"],
    scene: "person-receiving-money",
    tint: "var(--good)",
  },
  {
    title: "Split with friends",
    body: "Trips, flatmates, dinners — split equally, by exact amount, percentage or shares.",
    points: ["Simplify debts to the fewest payments", "Scan a bill and split it"],
    scene: "buddy-pair",
    tint: "var(--sky)",
  },
  {
    title: "Bills, renewals & tasks",
    body: "Rent, EMIs, utilities and subscriptions on one calendar, with reminders before they're due.",
    points: ["Monthly bills roll forward when paid", "Spot subscriptions you no longer use"],
    scene: "person-paid-receipt",
    tint: "var(--amber)",
  },
  {
    title: "Deals that fit your budget",
    body: "Live prices from Amazon India, checked against your own budget before you buy.",
    points: ["“Safe to buy” or “wait” on every deal", "Price-drop alerts"],
    scene: "person-searching-torch",
    tint: "var(--coral)",
  },
  {
    title: "Ask TrackKaro AI",
    body: "“Can I afford a ₹20,000 phone this month?” Answers from your own numbers, in plain words.",
    points: ["Type or speak in English, Hindi or Gujarati"],
    scene: "person-finding-answer",
    tint: "var(--violet)",
  },
  {
    title: "Just say it, we'll remind you",
    body: "Speak a reminder the way you'd tell a friend. TrackKaro works out what, when and what time, adds it to your tasks, and your phone rings right on time.",
    example: "Set reminder for tomorrow 4:55 PM to pay the pizza bill",
    points: ["English, हिंदी or ગુજરાતી — “kal shaam 5 baje” works too", "Shows in Tasks and the calendar on phone and web"],
    scene: "person-checking-wristwatch",
    tint: "var(--pine)",
    wide: true,
    badge: "New",
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-24 py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          eyebrow="Features"
          title="Everything your money needs, in one place"
          description="No more juggling a tracker, a khata book, a split app and a reminder app."
        />

        <Reveal as="ul" className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <li
              key={f.title}
              className={`tk-reveal-item group relative flex flex-col overflow-hidden rounded-[22px] border border-border bg-surface p-6 shadow-xs transition hover:-translate-y-1 hover:shadow-[var(--shadow-pop)] ${
                f.wide ? "md:col-span-2" : ""
              }`}
            >
              <div className={`flex gap-5 ${f.wide ? "flex-col sm:flex-row sm:items-center" : "flex-col"}`}>
                <span
                  className="grid h-[120px] shrink-0 place-items-center rounded-[18px]"
                  style={{ background: `color-mix(in srgb, ${f.tint} 12%, var(--surface-2))`, minWidth: f.wide ? 200 : undefined }}
                >
                  <Illustration name={f.scene} height={100} color={f.tint} float={false} className="transition duration-500 group-hover:scale-105" />
                </span>
                <div className="min-w-0">
                  <h3 className="flex flex-wrap items-center gap-2 text-[20px] font-extrabold tracking-[-0.02em] text-foreground">
                    {f.title}
                    {f.badge && (
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[12px] font-extrabold uppercase tracking-[0.06em]"
                        style={{ background: `color-mix(in srgb, ${f.tint} 16%, transparent)`, color: f.tint }}
                      >
                        {f.badge}
                      </span>
                    )}
                  </h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-foreground-muted">{f.body}</p>
                  {f.example && (
                    <p
                      className="mt-3 flex items-start gap-2 rounded-[14px] border px-3.5 py-2.5 text-[15px] font-semibold text-foreground"
                      style={{ borderColor: `color-mix(in srgb, ${f.tint} 30%, transparent)`, background: `color-mix(in srgb, ${f.tint} 7%, transparent)` }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={f.tint} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-1 shrink-0" aria-hidden>
                        <rect x="9" y="3" width="6" height="11" rx="3" />
                        <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
                      </svg>
                      <q className="before:content-['“'] after:content-['”']" style={{ quotes: "none" }}>{f.example}</q>
                    </p>
                  )}
                  <ul className="mt-3 grid gap-1.5">
                    {f.points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-[14px] font-semibold text-foreground">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={f.tint} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden>
                          <path d="m5 12.5 4.5 4.5L19 7.5" />
                        </svg>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
