import type { ReactNode } from "react";

export function LegalHeader({
  title,
  updated,
  intro,
}: {
  title: string;
  updated: string;
  intro: string;
}) {
  return (
    <div className="border-b border-border bg-surface-muted/50 px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <span className="text-[11.5px] font-bold uppercase tracking-wider text-primary">Legal</span>
        <h1 className="mt-3 text-[clamp(26px,4vw,38px)] font-extrabold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-2 text-[13px] font-semibold text-foreground-muted">Last updated: {updated}</p>
        <p className="mt-4 text-[14.5px] leading-relaxed text-foreground-sub">{intro}</p>
      </div>
    </div>
  );
}

export function LegalBody({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="space-y-10">{children}</div>
    </div>
  );
}

export function LegalSection({
  id,
  n,
  title,
  children,
}: {
  id: string;
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="flex items-baseline gap-2.5 text-[18px] font-extrabold text-foreground">
        <span className="text-primary">{String(n).padStart(2, "0")}</span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-foreground-sub">{children}</div>
    </section>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 marker:text-primary">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
