import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/marketing/reveal";
import { Illustration, type SceneName } from "@/components/ui/illustration";

const STEPS: { title: string; body: string; scene: SceneName }[] = [
  { title: "Sign up in a minute", body: "Pick English, Hindi or Gujarati and set a monthly budget that feels realistic.", scene: "person-launching-rocket" },
  { title: "Log money your way", body: "Tap “+ New”, describe it in a sentence, speak it, or scan a bill.", scene: "person-paid-receipt" },
  { title: "Check before you buy", body: "Search a product and see if it fits this month's budget.", scene: "person-searching-torch" },
  { title: "Settle and stay on track", body: "Collect from friends, pay bills on time, and review the month.", scene: "group-celebrating-win" },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 border-y border-border bg-[var(--surface-2)] py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading eyebrow="How it works" title="From sign-up to sorted in four steps" description="Start logging on day one; it gets smarter as you go." />

        <Reveal as="ol" className="relative mt-12 grid gap-x-4 gap-y-8 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="tk-reveal-item relative flex flex-col items-center rounded-[22px] border border-border bg-surface p-6 pt-8 text-center shadow-xs">
              <span className="absolute -top-4 left-1/2 grid h-8 min-w-8 -translate-x-1/2 place-items-center rounded-full bg-[var(--primary)] px-2 text-[14px] font-extrabold text-[var(--on-primary)] shadow-xs num">
                {i + 1}
              </span>
              <span className="grid h-[120px] w-full place-items-center rounded-[18px] bg-[var(--primary-soft)]">
                <Illustration name={s.scene} height={96} float={false} />
              </span>
              <h3 className="mt-5 text-[18px] font-extrabold tracking-[-0.02em] text-foreground">{s.title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-foreground-muted">{s.body}</p>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
