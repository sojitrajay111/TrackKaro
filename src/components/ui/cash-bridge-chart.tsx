"use client";

import { useState, useMemo } from "react";

export interface MonthData {
  month: string; // e.g. "Nov", "Dec"
  year: number;
  open: number;
  inflow: number;
  outflow: number;
  net: number;
  close: number;
}

export interface CategoryBreakdown {
  name: string;
  amount: number;
  pct: number;
  icon: string;
  tint: "pine" | "amber" | "sky" | "slate";
}
interface CashBridgeProps {
  months: MonthData[];
  currencySymbol?: string;
  range: "6M" | "12M";
  onRangeChange: (r: "6M" | "12M") => void;
}

export function CashBridgeChart({
  months,
  currencySymbol = "₹",
  range,
  onRangeChange,
}: CashBridgeProps) {
  const visibleMonths = useMemo(() => {
    const count = range === "6M" ? 6 : 12;
    return months.slice(-count);
  }, [months, range]);

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const activeIdx = hoveredIdx !== null ? hoveredIdx : visibleMonths.length - 1;
  const activeMonth = visibleMonths[activeIdx] || visibleMonths[0];

  const { minVal, maxVal } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    visibleMonths.forEach((m) => {
      min = Math.min(min, m.open, m.close);
      max = Math.max(max, m.open, m.close);
    });
    const pad = (max - min) * 0.18 || Math.max(1000, Math.abs(max) * 0.2);
    return {
      // Real balances can go negative (more spent than recorded income), so only floor at 0 when they don't.
      minVal: min >= 0 ? Math.max(0, min - pad) : min - pad,
      maxVal: max + pad,
    };
  }, [visibleMonths]);

  // Dimensions
  const svgWidth = 660;
  const svgHeight = 220;
  const chartPadLeft = 48;
  const chartPadRight = 20;
  const chartPadTop = 18;
  const chartPadBottom = 28;
  const plotWidth = svgWidth - chartPadLeft - chartPadRight;
  const plotHeight = svgHeight - chartPadTop - chartPadBottom;

  const getY = (val: number) => {
    if (maxVal === minVal) return chartPadTop + plotHeight / 2;
    const norm = (val - minVal) / (maxVal - minVal);
    return chartPadTop + plotHeight * (1 - norm);
  };

  const colGap = plotWidth / visibleMonths.length;
  const colWidth = Math.min(26, colGap * 0.55);

  const startBalance = visibleMonths[0]?.open || 0;
  const endBalance = visibleMonths[visibleMonths.length - 1]?.close || 0;
  const totalChange = endBalance - startBalance;

  // Tile/tooltip money: sign before the symbol ("−₹840"), whole rupees on screen (paise only in
  // the hover title), Indian grouping. `signed` adds "+" for gains.
  const money = (val: number, exact = false, signed = false) => {
    const abs = Math.abs(val);
    const num = exact
      ? abs.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
      : Math.round(abs).toLocaleString("en-IN");
    const sign = val < 0 ? "−" : signed && val > 0 ? "+" : "";
    return `${sign}${currencySymbol}${num}`;
  };

  const formatY = (val: number) => {
    const sign = val < 0 ? "−" : "";
    const abs = Math.abs(val);
    if (abs >= 10000000) return `${sign}${currencySymbol}${(abs / 10000000).toFixed(1)}Cr`;
    if (abs >= 100000) return `${sign}${currencySymbol}${(abs / 100000).toFixed(1)}L`;
    if (abs >= 1000) return `${sign}${currencySymbol}${Math.round(abs / 1000)}k`;
    return `${sign}${currencySymbol}${Math.round(abs)}`;
  };

  const formatVal = (val: number) => {
    const abs = Math.abs(val);
    if (abs >= 10000000) return `${(abs / 10000000).toFixed(1)}Cr`;
    if (abs >= 100000) return `${(abs / 100000).toFixed(1)}L`;
    if (abs >= 1000) return `${Math.round(abs / 1000)}k`;
    return `${Math.round(abs)}`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Card Header row with Title, Legend, and Segment */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-foreground">
            Cash bridge
          </h2>
          <p className="text-[14px] font-medium text-foreground-muted mt-0.5">
            How your balance moved, month by month · in INR ({currencySymbol})
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Legend */}
          <div className="flex items-center gap-3 text-[14px] font-semibold text-foreground-muted select-none">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#1f8366] inline-block" />
              Up
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#e2683f] inline-block" />
              Down
            </span>
          </div>

          {/* Segment Control */}
          <div className="inline-flex items-center p-0.5 rounded-full bg-[var(--well)] border border-border">
            <button
              type="button"
              className={`h-[30px] px-3 rounded-full text-[14px] font-bold transition-all ${
                range === "6M"
                  ? "bg-surface text-foreground shadow-xs"
                  : "text-foreground-muted hover:text-foreground"
              }`}
              onClick={() => onRangeChange("6M")}
              aria-pressed={range === "6M"}
            >
              6M
            </button>
            <button
              type="button"
              className={`h-[30px] px-3 rounded-full text-[14px] font-bold transition-all ${
                range === "12M"
                  ? "bg-surface text-foreground shadow-xs"
                  : "text-foreground-muted hover:text-foreground"
              }`}
              onClick={() => onRangeChange("12M")}
              aria-pressed={range === "12M"}
            >
              12M
            </button>
          </div>
        </div>
      </div>

      {/* 3 Summary Blocks (`dl.ov-sum`) */}
      {/* Stack when the card itself is narrow; figure size follows each tile's width. */}
      <div className="@container">
      <div className="grid grid-cols-1 gap-3.5 @[34rem]:grid-cols-3">
        <div className="@container min-w-0 px-3.5 py-3 rounded-[16px] bg-[var(--surface-2)] border border-border">
          <div className="text-[14px] font-bold text-foreground-muted">
            Cash on {visibleMonths[0]?.month || "Nov"} 1
          </div>
          <div className="whitespace-nowrap text-[clamp(1.05rem,10cqw,1.75rem)] font-extrabold tracking-[-0.035em] leading-[1.2] mt-1 num text-foreground" title={money(startBalance, true)}>
            {money(startBalance)}
          </div>
        </div>

        <div className="@container min-w-0 px-3.5 py-3 rounded-[16px] bg-[var(--surface-2)] border border-border">
          <div className="text-[14px] font-bold text-foreground-muted">
            {totalChange >= 0 ? "Up over" : "Down over"} {range === "6M" ? "6 months" : "12 months"}
          </div>
          <div
            className={`whitespace-nowrap text-[clamp(1.05rem,10cqw,1.75rem)] font-extrabold tracking-[-0.035em] leading-[1.2] mt-1 num ${totalChange >= 0 ? "text-[var(--good)]" : "text-[var(--bad)]"}`}
            title={money(totalChange, true, true)}
          >
            {money(totalChange, false, true)}
          </div>
        </div>

        <div className="@container min-w-0 px-3.5 py-3 rounded-[16px] bg-[var(--primary-soft)] border border-[color-mix(in_srgb,var(--primary)_30%,transparent)]">
          <div className="text-[14px] font-semibold text-[var(--primary)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1f8366] inline-block" />
            Cash today
          </div>
          <div className="whitespace-nowrap text-[clamp(1.05rem,10cqw,1.75rem)] font-extrabold tracking-[-0.035em] leading-[1.2] mt-1 num text-foreground" title={money(endBalance, true)}>
            {money(endBalance)}
          </div>
        </div>
      </div>
      </div>

      {/* Waterfall Chart SVG */}
      <div className="relative w-full pt-1">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
            const y = chartPadTop + plotHeight * frac;
            const val = maxVal - frac * (maxVal - minVal);
            return (
              <g key={i}>
                <line
                  x1={chartPadLeft}
                  x2={svgWidth - chartPadRight}
                  y1={y}
                  y2={y}
                  stroke="var(--line)"
                  strokeWidth="1"
                  strokeDasharray="3 4"
                />
                <text
                  x={chartPadLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="text-[12px] fill-foreground-muted font-semibold num"
                >
                  {formatY(val)}
                </text>
              </g>
            );
          })}

          {/* Current / Rightmost Month Shaded Pillar (Authentic Kesta design) */}
          {visibleMonths.length > 0 && (() => {
            const lastIdx = visibleMonths.length - 1;
            const pillarX = chartPadLeft + lastIdx * colGap + colGap / 2 - colWidth / 2 - 6;
            return (
              <rect
                x={pillarX}
                y={chartPadTop - 6}
                width={colWidth + 12}
                height={plotHeight + 12}
                rx="10"
                className="fill-[#faeed2]/60 dark:fill-[#2d2514]/70 stroke-[#e5c986]/70 dark:stroke-[#614e21]"
                strokeWidth="1"
                strokeDasharray="4 3"
              />
            );
          })()}

          {/* Connecting dashed bridge lines */}
          {visibleMonths.map((m, idx) => {
            if (idx === visibleMonths.length - 1) return null;
            const x1 = chartPadLeft + idx * colGap + colGap / 2 + colWidth / 2;
            const x2 = chartPadLeft + (idx + 1) * colGap + colGap / 2 - colWidth / 2;
            const y = getY(m.close);
            return (
              <line
                key={`link-${idx}`}
                x1={x1}
                x2={x2}
                y1={y}
                y2={y}
                stroke="var(--line-2)"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
            );
          })}

          {/* Month Step Capsules */}
          {visibleMonths.map((m, idx) => {
            const isSelected = activeIdx === idx;
            const isUp = m.net >= 0;
            const topY = getY(Math.max(m.open, m.close));
            const bottomY = getY(Math.min(m.open, m.close));
            const barHeight = Math.max(bottomY - topY, 7);
            const barX = chartPadLeft + idx * colGap + colGap / 2 - colWidth / 2;

            return (
              <g
                key={idx}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Hover Lens */}
                <rect
                  x={chartPadLeft + idx * colGap}
                  y={chartPadTop}
                  width={colGap}
                  height={plotHeight}
                  rx="10"
                  className={`transition-colors ${
                    isSelected ? "fill-foreground/5" : "fill-transparent"
                  }`}
                />

                {/* Capsule Step */}
                <rect
                  x={barX}
                  y={topY}
                  width={colWidth}
                  height={barHeight}
                  rx="7"
                  fill={isUp ? "#1f8366" : "#e2683f"}
                  stroke={isSelected ? "var(--text)" : "none"}
                  strokeWidth={isSelected ? 1.5 : 0}
                  className="transition-all"
                />

                {/* Amount label above or below step */}
                <text
                  x={barX + colWidth / 2}
                  y={isUp ? topY - 5 : bottomY + 11}
                  textAnchor="middle"
                  className={`text-[13px] font-bold num ${
                    isUp ? "fill-[#1f8366]" : "fill-[#e2683f]"
                  } ${isSelected ? "opacity-100" : "opacity-0"} transition-opacity`}
                >
                  {isUp ? "+" : "−"}{currencySymbol}{formatVal(m.net)}
                </text>

                {/* X Axis Month Label */}
                <text
                  x={barX + colWidth / 2}
                  y={svgHeight - 8}
                  textAnchor="middle"
                  className={`text-[13px] transition-colors ${
                    isSelected
                      ? "fill-foreground font-extrabold"
                      : "fill-foreground-muted font-semibold"
                  }`}
                >
                  {m.month}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip on active month */}
        {activeMonth && (
          <div className="mt-2 p-2.5 rounded-xl bg-surface-muted border border-border flex flex-wrap items-center justify-between text-[14px] font-semibold">
            <span className="text-foreground">
              <strong>{activeMonth.month} {activeMonth.year}</strong>: Opened <strong>{money(activeMonth.open)}</strong>
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[#1f8366] flex items-center gap-1">
                <i className="w-2 h-2 rounded-full bg-[#1f8366] inline-block" />
                +{money(activeMonth.inflow)} in
              </span>
              <span className="text-[#e2683f] flex items-center gap-1">
                <i className="w-2 h-2 rounded-full bg-[#e2683f] inline-block" />
                −{money(activeMonth.outflow)} out
              </span>
              <span className="text-foreground border-l border-border pl-3">
                Closed <strong>{money(activeMonth.close)}</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
