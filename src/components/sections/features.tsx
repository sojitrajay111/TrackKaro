import { SectionHeading } from "@/components/section-heading";

type Feature = {
  title: string;
  description: string;
};

type FeatureGroup = {
  id: string;
  label: string;
  summary: string;
  features: Feature[];
};

const GROUPS: FeatureGroup[] = [
  {
    id: "track",
    label: "Track",
    summary: "Capture every rupee without spreadsheets.",
    features: [
      {
        title: "Smart expense log",
        description:
          "Quick entries, categories, and monthly views so you always know where money went.",
      },
      {
        title: "Scan bills (OCR)",
        description: "Photograph receipts and let the app pull amounts and merchants for you.",
      },
      {
        title: "Voice logging",
        description: "Say “₹250 chai” in Hindi, English, or Gujarati — we structure it for you.",
      },
    ],
  },
  {
    id: "split",
    label: "Split & settle",
    summary: "Digital bahi khata and trips with friends.",
    features: [
      {
        title: "Digital khata",
        description: "Running ledger with friends and shops — who owes whom, at a glance.",
      },
      {
        title: "Group expenses",
        description: "Split trips, rent, and dinners fairly with shared balances and reminders.",
      },
      {
        title: "UPI-ready flows",
        description: "Settle up with familiar payment patterns built for how India pays.",
      },
    ],
  },
  {
    id: "save",
    label: "Save & plan",
    summary: "Deals, conscience, and bills in one place.",
    features: [
      {
        title: "Amazon India deals",
        description: "Live deal feed with breakdowns so hype doesn’t beat math.",
      },
      {
        title: "AI purchase conscience",
        description: "Ask if a buy fits your budget and habits before you tap pay.",
      },
      {
        title: "Bills & subscriptions",
        description: "Reminders for rent, EMI, and renewals so nothing slips through.",
      },
    ],
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-24 border-b border-border bg-surface/40 py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          eyebrow="Features"
          title="Everything you need — nothing you don’t"
          description="Three pillars instead of a wall of icons: track daily money, split with people, and plan smarter purchases."
        />

        <div className="mt-14 space-y-16">
          {GROUPS.map((group, groupIndex) => (
            <div key={group.id}>
              <div className="flex flex-col gap-2 border-l-2 border-primary pl-4 md:flex-row md:items-end md:justify-between md:pl-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">
                    {String(groupIndex + 1).padStart(2, "0")} · {group.label}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-foreground md:text-[1.35rem]">
                    {group.summary}
                  </h3>
                </div>
              </div>

              <ul className="mt-6 grid gap-4 md:grid-cols-3">
                {group.features.map((feature) => (
                  <li
                    key={feature.title}
                    className="group rounded-2xl border border-border bg-background p-5 transition-colors hover:border-primary/30 hover:bg-surface"
                  >
                    <h4 className="text-[15px] font-bold text-foreground">{feature.title}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-foreground-sub">
                      {feature.description}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
