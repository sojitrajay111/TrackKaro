import type { ReactNode } from "react";
import Link from "next/link";

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  actionHref?: string;
  actionLabel?: string;
  onAction?: () => void;
  headerTools?: ReactNode;
  dark?: boolean;
}

export function BentoCard({
  children,
  className = "",
  title,
  subtitle,
  actionHref,
  actionLabel,
  onAction,
  headerTools,
  dark = false,
}: BentoCardProps) {
  // Same surface as the Overview's Cash bridge and Budgets cards (Kesta card: 22px radius, 20px padding).
  const cardStyle = dark
    ? "bg-[#181a18] text-foreground border border-border shadow-xs"
    : "bg-surface text-foreground border border-border shadow-xs";

  const renderAction = () => {
    if (headerTools) {
      return <div className="flex shrink-0 items-center gap-2">{headerTools}</div>;
    }

    if (!actionHref && !onAction) return null;

    const actionContent = (
      <div
        className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[14px] font-bold text-foreground hover:opacity-80 transition-opacity group cursor-pointer"
        title={actionLabel || "View all"}
      >
        <span>{actionLabel || "View"}</span>
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform group-hover:translate-x-0.5"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </div>
    );

    if (actionHref) {
      return <Link href={actionHref} className="shrink-0">{actionContent}</Link>;
    }

    return (
      <button type="button" onClick={onAction}>
        {actionContent}
      </button>
    );
  };

  return (
    <section
      className={`relative overflow-hidden rounded-[22px] p-5 transition-all ${cardStyle} ${className}`}
    >
      {(title || subtitle || actionHref || onAction || headerTools) && (
        <header className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-foreground">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-[14px] font-medium text-foreground-muted truncate">
                {subtitle}
              </p>
            )}
          </div>
          {renderAction()}
        </header>
      )}
      {children}
    </section>
  );
}
