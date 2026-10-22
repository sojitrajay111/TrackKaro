import type { ReactNode } from "react";

/** Kesta page header: breadcrumb, 30–38px title, 16px summary line, actions on the right. */
export function PageHeader({ section, title, summary, actions }: { section: string; title: string; summary?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[14px] font-[650] text-foreground-muted">
          <span>{section}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9.5 6 6 6-6 6" />
          </svg>
          <span className="text-foreground">{title}</span>
        </nav>
        <h1 className="text-[clamp(1.875rem,2.5vw,2.375rem)] font-extrabold leading-[1.08] tracking-[-0.04em] text-foreground">{title}</h1>
        {summary && <p className="text-[16px] font-medium text-foreground-muted">{summary}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Kesta stat tile: label, big figure, optional note; tone tints the figure. */
export function StatTile({
  label,
  value,
  note,
  tone,
  index = 0,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  tone?: "good" | "bad" | "warn";
  index?: number;
}) {
  const color = tone === "good" ? "var(--good)" : tone === "bad" ? "var(--bad)" : tone === "warn" ? "var(--warn)" : undefined;
  return (
    <div className="tk-pop min-w-0 rounded-[16px] border border-border bg-surface px-4 py-3 shadow-xs" style={{ animationDelay: `${index * 0.05}s` }}>
      <dt className="truncate text-[14px] font-bold text-foreground-muted">{label}</dt>
      <dd className="mt-0.5 truncate text-[clamp(1.25rem,2vw,1.625rem)] font-extrabold tracking-[-0.03em] num" style={{ color: color ?? "var(--text)" }}>
        {value}
      </dd>
      {note && <p className="truncate text-[13px] font-semibold text-foreground-muted">{note}</p>}
    </div>
  );
}

export const btnPrimary =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[var(--primary)] px-[18px] text-[16px] font-bold text-[var(--on-primary)] shadow-xs transition hover:bg-[var(--primary-strong)] active:brightness-[0.93] disabled:opacity-50";
export const btnGhost =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-border bg-surface px-[18px] text-[16px] font-bold text-foreground shadow-xs transition hover:bg-surface-muted active:brightness-[0.93]";
export const btnSmall =
  "inline-flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 text-[13px] font-bold transition";
