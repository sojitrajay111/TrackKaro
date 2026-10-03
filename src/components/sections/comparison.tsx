import { SectionHeading } from "@/components/section-heading";

type Cell = boolean | string;

const MATRIX: { feature: string; trackkaro: Cell; splitwise: Cell; khatabook: Cell; other: Cell }[] = [
  { feature: "Income, expense & cash flow", trackkaro: true, splitwise: false, khatabook: "Partial", other: true },
  { feature: "Receipt OCR", trackkaro: true, splitwise: false, khatabook: false, other: "Paid" },
  { feature: "Voice log (EN / HI / GU)", trackkaro: true, splitwise: false, khatabook: false, other: false },
  { feature: "Digital khata + reminders", trackkaro: true, splitwise: false, khatabook: true, other: false },
  { feature: "Groups & debt simplify", trackkaro: true, splitwise: true, khatabook: false, other: false },
  { feature: "UPI settle-up", trackkaro: true, splitwise: false, khatabook: "Partial", other: false },
  { feature: "Amazon deals & price drops", trackkaro: true, splitwise: false, khatabook: false, other: false },
  { feature: "AI “should I buy?” check", trackkaro: true, splitwise: false, khatabook: false, other: false },
  { feature: "Subscriptions audit", trackkaro: true, splitwise: false, khatabook: false, other: "Paid" },
  { feature: "PDF / CSV export", trackkaro: true, splitwise: "Paid", khatabook: true, other: "Paid" },
  { feature: "No ads on core finance", trackkaro: true, splitwise: false, khatabook: false, other: false },
];

function CellBadge({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground/5 text-foreground-sub/60">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </span>
    );
  }
  return (
    <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
      {value}
    </span>
  );
}

export function Comparison() {
  return (
    <section id="comparison" className="scroll-mt-24 border-y border-border bg-surface/40 py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          eyebrow="Compare"
          title="One app instead of four"
          description="TrackKaro combines expense tracking, group splits, khata, and deal intelligence — without selling your data."
        />

        <div className="mt-12 overflow-x-auto rounded-2xl border border-border bg-background shadow-[0_16px_48px_-24px_rgba(15,23,42,0.12)]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wider text-foreground-sub">
                <th className="sticky left-0 z-10 bg-background py-4 pl-5 pr-4 md:pl-6">Capability</th>
                <th className="px-3 py-4 text-center text-primary">TrackKaro</th>
                <th className="px-3 py-4 text-center">Splitwise</th>
                <th className="px-3 py-4 text-center">Khatabook</th>
                <th className="py-4 pl-3 pr-5 text-center md:pr-6">Others</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {MATRIX.map((row) => (
                <tr key={row.feature} className="group hover:bg-surface/80">
                  <td className="sticky left-0 z-10 bg-background py-3.5 pl-5 pr-4 font-medium text-foreground group-hover:bg-surface/80 md:pl-6">
                    {row.feature}
                  </td>
                  <td className="bg-primary/[0.04] px-3 py-3.5 text-center">
                    <div className="flex justify-center">
                      <CellBadge value={row.trackkaro} />
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <div className="flex justify-center">
                      <CellBadge value={row.splitwise} />
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <div className="flex justify-center">
                      <CellBadge value={row.khatabook} />
                    </div>
                  </td>
                  <td className="py-3.5 pl-3 pr-5 text-center md:pr-6">
                    <div className="flex justify-center">
                      <CellBadge value={row.other} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
