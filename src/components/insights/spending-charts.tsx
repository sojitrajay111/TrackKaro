"use client";

import { useId, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { CategoryName, Transaction } from "@/store/types";

/* Shared spending maths and charts, used by the Spending insights page and the Overview. */

export const CATEGORY_HEX: Record<CategoryName, string> = {
  Food: "#F59E0B",
  Shopping: "#EC4899",
  Groceries: "#10B981",
  Bills: "#9333EA",
  Travel: "#2563EB",
  Fuel: "#E11D48",
  Entertainment: "#4F46E5",
  Health: "#0D9488",
  Subscriptions: "#A855F7",
  Rent: "#F43F5E",
  EMI: "#D97706",
  Education: "#0891B2",
  Other: "#64748B",
};

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const pad = (n: number) => String(n).padStart(2, "0");
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const monthKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
export const dayLabel = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getDate()}`;

export const fmt = (v: number) => `₹${Math.round(Math.abs(v)).toLocaleString("en-IN")}`;

export function fmtShort(v: number) {
  const a = Math.abs(v);
  if (a >= 100_000) return `₹${(a / 100_000).toFixed(a >= 1_000_000 ? 0 : 1)}L`;
  if (a >= 1_000) return `₹${(a / 1_000).toFixed(a >= 10_000 ? 0 : 1)}k`;
  return `₹${Math.round(a)}`;
}

/** Percent change, or null when there is no previous value to compare with. */
export function pctChange(cur: number, prev: number) {
  if (prev <= 0) return null;
  return Math.round(((cur - prev) / prev) * 100);
}

/** Round an axis maximum up to a tidy number. */
export function niceMax(v: number) {
  if (v <= 0) return 100;
  const mag = 10 ** Math.floor(Math.log10(v));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * mag >= v) ?? 10;
  return step * mag;
}

/** Smooth path through points without vertical overshoot. */
function smoothPath(pts: [number, number][]) {
  if (pts.length === 0) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }
  return d;
}


/** Change badge. `goodWhenUp` decides whether a rise is shown green or red. */
export function Delta({ value, goodWhenUp, suffix = "" }: { value: number | null; goodWhenUp: boolean; suffix?: string }) {
  if (value === null) return null;
  const good = value === 0 ? null : value > 0 === goodWhenUp;
  const tone =
    good === null
      ? "bg-surface-muted text-foreground-muted"
      : good
        ? "bg-[color-mix(in_srgb,var(--good)_14%,transparent)] text-[var(--good)]"
        : "bg-[color-mix(in_srgb,var(--bad)_14%,transparent)] text-[var(--bad)]";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[13px] font-bold tabular-nums ${tone}`}>
      {value > 0 ? "+" : value < 0 ? "−" : ""}
      {Math.abs(value)}%{suffix}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Daily spending chart (this period vs previous)                             */
/* -------------------------------------------------------------------------- */

export interface DayPoint {
  date: Date;
  cur: number;
  prev: number;
}

export function DailyChart({ days }: { days: DayPoint[] }) {
  const gid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);

  const W = 680;
  const H = 260;
  const L = 52;
  const R = 12;
  const T = 12;
  const B = 28;
  const max = niceMax(Math.max(...days.map((d) => Math.max(d.cur, d.prev))));
  const n = days.length;
  const x = (i: number) => (n === 1 ? L : L + (i / (n - 1)) * (W - L - R));
  const y = (v: number) => T + (1 - v / max) * (H - T - B);

  const curPts = days.map((d, i) => [x(i), y(d.cur)] as [number, number]);
  const prevPts = days.map((d, i) => [x(i), y(d.prev)] as [number, number]);
  const curPath = smoothPath(curPts);
  const area = `${curPath} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`;

  const tickEvery = Math.max(1, Math.ceil(n / 7));
  const ticks = days.map((_, i) => i).filter((i) => i % tickEvery === 0 || i === n - 1);
  if (ticks.length > 1 && ticks[ticks.length - 1] - ticks[ticks.length - 2] < tickEvery / 2) {
    ticks.splice(ticks.length - 2, 1);
  }

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const vx = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((vx - L) / (W - L - R)) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") setHover((h) => Math.min(n - 1, (h ?? -1) + 1));
    else if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? n) - 1));
    else return;
    e.preventDefault();
  };

  const h = hover !== null ? days[hover] : null;

  return (
    <div
      className="relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
      tabIndex={0}
      onKeyDown={onKey}
      onBlur={() => setHover(null)}
      aria-label="Daily spending chart. Use arrow keys to read each day."
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto select-none touch-none"
        role="img"
        aria-label="Amount spent each day, this period and the previous one"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`g-${gid}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--pine)" stopOpacity="0.28" />
            <stop offset="1" stopColor="var(--pine)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g className="text-foreground-muted" fontSize="11" fill="currentColor">
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line
                x1={L}
                x2={W - R}
                y1={y(max * f)}
                y2={y(max * f)}
                stroke="currentColor"
                strokeOpacity="0.18"
                strokeDasharray={f === 0 ? undefined : "3 5"}
              />
              <text x={L - 8} y={y(max * f) + 4} textAnchor="end">
                {fmtShort(max * f)}
              </text>
            </g>
          ))}
          {ticks.map((i) => (
            <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}>
              {dayLabel(days[i].date)}
            </text>
          ))}
        </g>

        <path d={smoothPath(prevPts)} fill="none" stroke="var(--color-foreground-muted)" strokeOpacity="0.55" strokeWidth="1.75" strokeDasharray="5 5" />
        <path d={area} fill={`url(#g-${gid})`} />
        <path d={curPath} fill="none" stroke="var(--pine)" strokeWidth="2.5" strokeLinecap="round" />

        {h && hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="var(--color-foreground-muted)" strokeOpacity="0.4" />
            <circle cx={x(hover)} cy={y(h.prev)} r="3.5" fill="var(--color-surface)" stroke="var(--color-foreground-muted)" strokeWidth="1.5" />
            <circle cx={x(hover)} cy={y(h.cur)} r="4.5" fill="var(--color-surface)" stroke="var(--pine)" strokeWidth="2.5" />
          </g>
        )}
      </svg>

      {h && hover !== null && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-[12px] border border-border bg-[var(--raised)] px-3 py-2 text-[14px] shadow-[var(--shadow-pop)]"
          style={{ left: `clamp(70px, ${(x(hover) / W) * 100}%, calc(100% - 70px))` }}
        >
          <b className="block text-foreground">{dayLabel(h.date)}</b>
          <span className="block text-foreground-sub tabular-nums">Spent {fmt(h.cur)}</span>
          <span className="block text-foreground-muted tabular-nums">Previous {fmt(h.prev)}</span>
        </div>
      )}
    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* Period maths                                                               */
/* -------------------------------------------------------------------------- */

export interface PeriodSummary {
  days: DayPoint[];
  spent: number;
  prevSpent: number;
  income: number;
  prevIncome: number;
  inRange: Transaction[];
}

/** The last `n` days ending `today`, compared with the `n` days before them. */
export function buildPeriod(transactions: Transaction[], n: number, today: Date): PeriodSummary {
  const expByDay = new Map<string, number>();
  const incByDay = new Map<string, number>();
  for (const t of transactions) {
    const m = t.type === "expense" ? expByDay : incByDay;
    m.set(t.date, (m.get(t.date) || 0) + t.amount);
  }

  const days: DayPoint[] = [];
  let spent = 0;
  let prevSpent = 0;
  let income = 0;
  let prevIncome = 0;
  const curKeys = new Set<string>();

  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const p = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i - n);
    const k = dayKey(d);
    const pk = dayKey(p);
    curKeys.add(k);
    const cur = expByDay.get(k) || 0;
    const prev = expByDay.get(pk) || 0;
    days.push({ date: d, cur, prev });
    spent += cur;
    prevSpent += prev;
    income += incByDay.get(k) || 0;
    prevIncome += incByDay.get(pk) || 0;
  }

  const inRange = transactions.filter((t) => curKeys.has(t.date));
  return { days, spent, prevSpent, income, prevIncome, inRange };
}

export interface CategorySlice {
  name: string;
  amount: number;
  color: string;
}

/** Expenses by category: the top `top` categories, the rest folded into one slice. */
export function buildCategorySplit(transactions: Transaction[], top = 5): CategorySlice[] {
  const map = new Map<CategoryName, number>();
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    map.set(t.category, (map.get(t.category) || 0) + t.amount);
  }
  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
  const slices: CategorySlice[] = sorted
    .slice(0, top)
    .map(([name, amount]) => ({ name, amount, color: CATEGORY_HEX[name] }));
  const rest = sorted.slice(top).reduce((s, [, a]) => s + a, 0);
  if (rest > 0) slices.push({ name: "Everything else", amount: rest, color: "#94A3B8" });
  return slices;
}

/* -------------------------------------------------------------------------- */
/* Category donut                                                             */
/* -------------------------------------------------------------------------- */

export function CategoryDonut({ slices, size = 150 }: { slices: CategorySlice[]; size?: number }) {
  const total = slices.reduce((s, c) => s + c.amount, 0);
  const R = 52;
  const C = 2 * Math.PI * R;
  const gap = slices.length > 1 ? 3 : 0;
  const arcs = slices.map((c, i) => ({
    name: c.name,
    color: c.color,
    len: Math.max(0, (c.amount / total) * C - gap),
    start: (slices.slice(0, i).reduce((s, x) => s + x.amount, 0) / total) * C,
  }));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" role="img" aria-label="Spending by category">
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--color-surface-muted)" strokeWidth="16" />
        {arcs.map((a) => (
          <circle
            key={a.name}
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke={a.color}
            strokeWidth="16"
            strokeDasharray={`${a.len} ${C}`}
            strokeDashoffset={-a.start}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <b className="text-[20px] font-extrabold tracking-[-0.03em] text-foreground tabular-nums">{fmtShort(total)}</b>
        <span className="text-[13px] text-foreground-muted">spent</span>
      </div>
    </div>
  );
}

/** Legend rows for the donut: colour, name, amount, share. */
export function CategoryLegend({ slices }: { slices: CategorySlice[] }) {
  const total = slices.reduce((s, c) => s + c.amount, 0);
  return (
    <table className="w-full table-fixed text-[14px]">
      <caption className="sr-only">Spending by category</caption>
      <tbody>
        {slices.map((c) => (
          <tr key={c.name}>
            <th scope="row" className="py-1.5 text-left font-medium text-foreground">
              <span className="flex min-w-0 items-center gap-2">
                <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                <span className="truncate">{c.name}</span>
              </span>
            </th>
            <td className="w-[6.5rem] truncate py-1.5 text-right tabular-nums text-foreground">{fmt(c.amount)}</td>
            <td className="py-1.5 pl-2 text-right tabular-nums text-foreground-muted w-11">
              {Math.round((c.amount / total) * 100)}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
