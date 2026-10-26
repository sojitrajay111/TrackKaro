import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/marketing/reveal";

/**
 * "One app instead of four": which job each kind of app usually covers. Compares app categories,
 * not named competitors, so every claim here is about TrackKaro itself.
 */
type Cell = "yes" | "no" | "some";
const COLUMNS = ["Expense tracker", "Split app", "Khata app", "Deals app"] as const;

const ROWS: { feature: string; cells: [Cell, Cell, Cell, Cell] }[] = [
  { feature: "Expenses, income & budgets", cells: ["yes", "no", "some", "no"] },
  { feature: "Scan bills & voice entry", cells: ["some", "no", "no", "no"] },
  { feature: "Digital khata with reminders", cells: ["no", "no", "yes", "no"] },
  { feature: "Group splits & simplify debts", cells: ["no", "yes", "no", "no"] },
  { feature: "Bills, subscriptions & calendar", cells: ["some", "no", "no", "no"] },
  { feature: "Live deals & price alerts", cells: ["no", "no", "no", "yes"] },
  { feature: "“Can I afford it?” budget check", cells: ["no", "no", "no", "no"] },
  { feature: "Ask in English, Hindi or Gujarati", cells: ["some", "no", "some", "no"] },
];

function Mark({ v, strong = false }: { v: Cell | "tk"; strong?: boolean }) {
  if (v === "tk" || v === "yes") {
    return (
      <span className={`inline-grid h-7 w-7 place-items-center rounded-full ${strong ? "bg-[var(--primary)] text-[var(--on-primary)]" : "bg-[var(--primary-soft)] text-[var(--primary)]"}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-label="Yes">
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      </span>
    );
  }
  if (v === "some") return <span className="rounded-full bg-[color-mix(in_srgb,var(--amber)_14%,transparent)] px-2 py-0.5 text-[12px] font-bold text-[var(--warn)]">Some</span>;
  return (
    <span className="inline-grid h-7 w-7 place-items-center rounded-full bg-[var(--well)] text-foreground-muted">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-label="No">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </span>
  );
}

export function Comparison() {
  return (
    <section id="comparison" className="scroll-mt-24 py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading eyebrow="Compare" title="One app instead of four" description="What a typical app in each category covers — and what TrackKaro brings together." />

        <Reveal className="mt-12 overflow-x-auto rounded-[22px] border border-border bg-surface shadow-xs">
          <table className="w-full min-w-[720px] text-left text-[15px]">
            <thead>
              <tr className="border-b border-border text-[13px] font-extrabold uppercase tracking-[0.06em] text-foreground-muted">
                <th className="sticky left-0 z-10 bg-surface py-4 pl-6 pr-4">What you need</th>
                <th className="bg-[var(--primary-soft)] px-3 py-4 text-center text-[var(--primary)]">TrackKaro</th>
                {COLUMNS.map((c) => (
                  <th key={c} className="px-3 py-4 text-center">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.feature} className="border-b border-border last:border-b-0 hover:bg-[var(--surface-2)]">
                  <td className="sticky left-0 z-10 bg-surface py-3.5 pl-6 pr-4 font-semibold text-foreground">{r.feature}</td>
                  <td className="bg-[color-mix(in_srgb,var(--primary)_6%,transparent)] px-3 py-3.5 text-center">
                    <Mark v="tk" strong />
                  </td>
                  {r.cells.map((c, i) => (
                    <td key={i} className="px-3 py-3.5 text-center">
                      <Mark v={c} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </div>
    </section>
  );
}
