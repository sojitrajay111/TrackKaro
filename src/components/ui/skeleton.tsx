interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = "", style }: SkeletonProps) {
  return (
    <div
      style={style}
      className={`animate-pulse rounded-xl bg-foreground/10 dark:bg-foreground/5 ${className}`}
      aria-hidden="true"
    />
  );
}
