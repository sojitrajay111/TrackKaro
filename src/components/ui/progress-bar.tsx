interface ProgressBarProps {
  label: string;
  percent: number;
  valueText?: string;
  variant?: "dark" | "amber" | "emerald" | "striped" | "outline";
  className?: string;
}

export function ProgressBar({
  label,
  percent,
  valueText,
  variant = "emerald",
  className = "",
}: ProgressBarProps) {
  const safePercent = Math.min(Math.max(percent, 0), 100);

  const getTrackFill = () => {
    switch (variant) {
      case "dark":
        return "bg-foreground dark:bg-emerald-400";
      case "amber":
        return "bg-amber-400";
      case "striped":
        return "bg-[repeating-linear-gradient(45deg,#059669,#059669_8px,#047857_8px,#047857_16px)] opacity-90";
      case "outline":
        return "bg-transparent border border-foreground/30";
      case "emerald":
      default:
        return "bg-primary";
    }
  };

  return (
    <div className={`flex flex-col gap-1 min-w-[120px] ${className}`}>
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-foreground-sub">{label}</span>
        <span className="text-foreground font-mono">{valueText || `${safePercent}%`}</span>
      </div>
      <div className="h-5 sm:h-6 w-full rounded-full bg-surface-muted border border-border/80 p-0.5 overflow-hidden">
        <div
          style={{ width: `${safePercent}%` }}
          className={`h-full rounded-full transition-all duration-700 ${getTrackFill()}`}
        />
      </div>
    </div>
  );
}
