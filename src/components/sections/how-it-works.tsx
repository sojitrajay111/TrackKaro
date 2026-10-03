import { SectionHeading } from "@/components/section-heading";

const STEPS = [
  {
    step: "01",
    title: "Install & set your language",
    body: "When we launch on Play and the App Store, pick Hindi, English, or Gujarati and set a monthly budget that feels realistic.",
  },
  {
    step: "02",
    title: "Log expenses your way",
    body: "Tap to add, scan a bill, or speak an amount. Khata and group splits stay in sync as you go.",
  },
  {
    step: "03",
    title: "Check deals before you buy",
    body: "Browse live deals, run the AI conscience check, and decide with numbers — not FOMO.",
  },
  {
    step: "04",
    title: "Settle & stay on track",
    body: "Use reminders for bills, nudge friends on group balances, and review trends at month end.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="From install to insight in four steps"
          description="No setup marathon — start logging on day one and refine as you go."
        />

        <ol className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((item, index) => (
            <li
              key={item.step}
              className="relative flex flex-col rounded-2xl border border-border bg-surface p-6"
            >
              <span className="text-[11px] font-bold tabular-nums tracking-widest text-primary">
                {item.step}
              </span>
              <h3 className="mt-3 text-base font-bold leading-snug text-foreground">{item.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground-sub">{item.body}</p>
              {index < STEPS.length - 1 ? (
                <span
                  className="pointer-events-none absolute -right-2 top-1/2 hidden h-px w-4 bg-border lg:block"
                  aria-hidden
                />
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
