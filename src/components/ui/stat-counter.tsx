import type { ReactNode } from "react";

interface StatCounterProps {
  value: string | number;
  label: string;
  icon?: ReactNode;
  className?: string;
}

export function StatCounter({ value, label, icon, className = "" }: StatCounterProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">
        {value}
      </span>
      <div className="flex items-center gap-1.5 mt-0.5 text-xs font-semibold text-foreground-muted">
        {icon}
        <span>{label}</span>
      </div>
    </div>
  );
}
