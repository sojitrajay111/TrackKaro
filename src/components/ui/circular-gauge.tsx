interface CircularGaugeProps {
  percent: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  centerText: string;
  subText?: string;
  className?: string;
}

export function CircularGauge({
  percent,
  size = 140,
  strokeWidth = 10,
  centerText,
  subText,
  className = "",
}: CircularGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safePercent = Math.min(Math.max(percent, 0), 100);
  const strokeDashoffset = circumference - (safePercent / 100) * circumference;

  // TrackKaro dynamic colors based on budget load
  let strokeColor = "#059669"; // Emerald safe
  if (safePercent >= 90) {
    strokeColor = "#EF4444"; // Danger red
  } else if (safePercent >= 75) {
    strokeColor = "#F59E0B"; // Warning amber
  }

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border opacity-40 dark:opacity-20"
          strokeDasharray="4 4"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-extrabold tracking-tight text-foreground font-mono">
          {centerText}
        </span>
        {subText && (
          <span className="text-[11px] font-semibold text-foreground-muted mt-0.5">
            {subText}
          </span>
        )}
      </div>
    </div>
  );
}
