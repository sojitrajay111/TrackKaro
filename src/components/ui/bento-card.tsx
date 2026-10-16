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
  dark = false,
}: BentoCardProps) {
  const cardStyle = dark
    ? "bg-[#091811]/95 text-emerald-50 border border-emerald-900/40 shadow-xl backdrop-blur-md"
    : "bg-surface/90 text-foreground border border-border/80 card-shadow backdrop-blur-md";

  const renderAction = () => {
    if (!actionHref && !onAction) return null;

    const actionContent = (
      <div
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-all ${
          dark
            ? "bg-emerald-900/40 text-emerald-300 hover:bg-emerald-800/60"
            : "bg-surface-muted text-foreground-sub hover:bg-primary-soft hover:text-primary"
        }`}
        title={actionLabel || "Open"}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="7" y1="17" x2="17" y2="7" />
          <polyline points="7 7 17 7 17 17" />
        </svg>
      </div>
    );

    if (actionHref) {
      return <Link href={actionHref}>{actionContent}</Link>;
    }

    return (
      <button type="button" onClick={onAction}>
        {actionContent}
      </button>
    );
  };

  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] p-6 sm:p-7 transition-all ${cardStyle} ${className}`}
    >
      {(title || subtitle || actionHref || onAction) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && (
              <h3
                className={`text-base font-bold tracking-tight ${
                  dark ? "text-white" : "text-foreground"
                }`}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                className={`mt-0.5 text-xs ${
                  dark ? "text-emerald-400/80" : "text-foreground-muted"
                }`}
              >
                {subtitle}
              </p>
            )}
          </div>
          {renderAction()}
        </div>
      )}
      {children}
    </div>
  );
}
