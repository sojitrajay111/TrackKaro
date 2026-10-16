"use client";

import { useState } from "react";

export interface SparkBarItem {
  label: string;
  value: number;
  formatted?: string;
  isPeak?: boolean;
}

export interface SparkBarsProps {
  data: SparkBarItem[];
  height?: number;
  highlightIndex?: number;
  className?: string;
}

export function SparkBars({
  data,
  height = 110,
  highlightIndex = 6,
  className = "",
}: SparkBarsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={`flex flex-col items-center w-full select-none ${className}`}>
      {/* 7 Columns Container */}
      <div className="flex items-end justify-between w-full" style={{ height }}>
        {data.map((item, idx) => {
          const isHovered = hoveredIndex === idx;
          const isDefaultHighlight = hoveredIndex === null && idx === highlightIndex;
          const isActive = isHovered || isDefaultHighlight;
          const hasData = item.value > 0;

          // Proportional bar height when has data (from 22% up to 80%)
          const barHeightPct = hasData
            ? Math.max((item.value / maxValue) * 75, 22)
            : 0;
          const displayValue =
            item.formatted || `₹${Math.round(item.value).toLocaleString("en-IN")}`;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="relative flex flex-col items-center flex-1 h-full justify-end cursor-pointer group"
            >
              {/* 1. Vertical Dashed Guideline running behind the column */}
              <div
                className="absolute inset-x-0 mx-auto w-0 border-r border-dashed border-[#B8CAC0]/60 dark:border-[#2C4234] pointer-events-none z-0"
                style={{ top: 0, bottom: 28 }}
              />

              {/* 2. Floating Golden Tooltip Pill */}
              {isActive && (
                <div
                  className="absolute whitespace-nowrap rounded-[12px] bg-[#F3BA42] text-[#2C1E03] px-2.5 py-0.5 text-[11px] font-bold shadow-xs z-30 pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95"
                  style={{
                    bottom: hasData ? `calc(${barHeightPct}% + 34px)` : "42px",
                  }}
                >
                  {displayValue}
                </div>
              )}

              {/* 3. The Bar: Solid black when has data, or tiny grey dot when NO data */}
              {hasData ? (
                <div
                  style={{ height: `${barHeightPct}%` }}
                  className={`w-2.5 sm:w-3 rounded-full transition-all duration-300 z-10 ${
                    isActive
                      ? "bg-[#F3BA42] shadow-sm shadow-amber-500/30"
                      : "bg-[#18261E] dark:bg-white group-hover:bg-[#F3BA42]"
                  }`}
                />
              ) : (
                <div
                  className={`h-2 w-2 rounded-full transition-all duration-300 z-10 ${
                    isActive
                      ? "bg-[#F3BA42] shadow-sm"
                      : "bg-[#B8CAC0] dark:bg-white/25 group-hover:bg-[#F3BA42]"
                  }`}
                />
              )}

              {/* 4. Small Dot between bar and weekday label */}
              <div
                className={`h-1.5 w-1.5 rounded-full my-2 transition-colors duration-200 z-10 ${
                  isActive
                    ? "bg-[#F3BA42]"
                    : hasData
                    ? "bg-[#18261E] dark:bg-white"
                    : "bg-[#B8CAC0] dark:bg-white/25"
                }`}
              />

              {/* 5. Weekday Label */}
              <span
                className={`text-[12px] select-none transition-colors duration-150 z-10 leading-none ${
                  isActive
                    ? "font-extrabold text-foreground"
                    : hasData
                    ? "font-medium text-foreground-sub"
                    : "font-normal text-[#94A59B] dark:text-foreground-muted/50"
                }`}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
