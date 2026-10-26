import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/marketing/reveal";
import { SITE } from "@/lib/site";

const FAQS = [
  {
    q: "Is TrackKaro free?",
    a: "Yes. You can sign up and use expenses, budgets, khata, group splits, bills and deals at no cost.",
  },
  {
    q: "Does TrackKaro move my money?",
    a: "No. TrackKaro keeps the record — what you spent, who owes whom, what's due. You pay and settle the way you already do, by UPI, cash or bank transfer.",
  },
  {
    q: "Is my data private?",
    a: "Your records are tied to your account and synced securely between the phone app and the web. We never sell your data, and you can export or delete everything from Settings at any time.",
  },
  {
    q: "Can I use it on my laptop and phone?",
    a: "Yes. Sign in on the web dashboard or the app with the same account and everything stays in sync.",
  },
  {
    q: "Which languages does it support?",
    a: "English, Hindi and Gujarati — including voice entry and questions to the AI assistant.",
  },
  {
    q: "How does group splitting work?",
    a: "Add who paid and how it's split (equally, exact amounts, percentages or shares). TrackKaro works out every balance to the paisa and, with “Simplify debts” on, the fewest payments to settle up.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 border-t border-border bg-[var(--surface-2)] py-20 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 md:px-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SectionHeading eyebrow="FAQ" title="Questions, answered" align="left" />
          <Reveal delay={100}>
            <p className="mt-4 text-[16px] text-foreground-muted">
              Something else?{" "}
              <a href={`mailto:${SITE.supportEmail}`} className="font-bold text-[var(--primary)] hover:underline">
                {SITE.supportEmail}
              </a>
            </p>
          </Reveal>
        </div>
        <Reveal as="ul" className="grid gap-3">
          {FAQS.map((f) => (
            <li key={f.q} className="tk-reveal-item">
              <details className="group rounded-[18px] border border-border bg-surface px-5 py-4 shadow-xs transition open:shadow-[var(--shadow-pop)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-bold text-foreground [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)] transition-transform duration-300 group-open:rotate-45">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-[15px] leading-relaxed text-foreground-muted">{f.a}</p>
              </details>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
