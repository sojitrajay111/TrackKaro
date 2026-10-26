import { Reveal } from "@/components/marketing/reveal";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
};

/** Marketing section heading: emerald eyebrow pill, large bold title, muted lead. */
export function SectionHeading({ eyebrow, title, description, align = "center" }: SectionHeadingProps) {
  const alignClass = align === "center" ? "mx-auto text-center items-center" : "text-left items-start";
  return (
    <Reveal className={`flex max-w-2xl flex-col ${alignClass}`}>
      <span className="inline-flex h-8 items-center rounded-full border border-[color-mix(in_srgb,var(--primary)_30%,transparent)] bg-[var(--primary-soft)] px-3 text-[13px] font-extrabold uppercase tracking-[0.08em] text-[var(--primary)]">
        {eyebrow}
      </span>
      <h2 className="mt-4 text-[clamp(1.75rem,3.4vw,2.5rem)] font-extrabold leading-[1.1] tracking-[-0.035em] text-foreground">{title}</h2>
      {description ? <p className="mt-3 text-[17px] leading-relaxed text-foreground-muted">{description}</p> : null}
    </Reveal>
  );
}

export const mktBtnPrimary =
  "inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-[var(--primary)] px-6 text-[16px] font-bold text-[var(--on-primary)] shadow-[0_10px_24px_-10px_color-mix(in_srgb,var(--primary)_70%,transparent)] transition hover:-translate-y-0.5 hover:bg-[var(--primary-strong)] active:translate-y-0";
export const mktBtnGhost =
  "inline-flex h-12 items-center justify-center gap-2 rounded-[14px] border border-border bg-surface px-6 text-[16px] font-bold text-foreground shadow-xs transition hover:-translate-y-0.5 hover:bg-surface-muted active:translate-y-0";
