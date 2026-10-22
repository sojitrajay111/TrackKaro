"use client";

import { useEffect, useState } from "react";
import { useCountUp } from "@/components/ui/drawer";

/**
 * Semicircle gauge, drawn to Kesta's dial geometry (200×112 viewBox):
 * a radius-80 arc centred at (100,100), 13px stroke; 25 ticks inside it (every 6th
 * is major); a needle that swings with an elastic settle; the value counts up below.
 */

// GSAP's elastic.out(1, 0.5), sampled into a CSS linear() easing so the needle can
// overshoot and settle without an animation library.
const ELASTIC_OUT = (() => {
  const period = 0.5;
  const s = (period / (2 * Math.PI)) * Math.asin(1);
  const pts: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const v = t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / period) + 1;
    pts.push(v.toFixed(4));
  }
  return `linear(${pts.join(", ")})`;
})();

const point = (frac: number, r: number) => [100 - r * Math.cos(Math.PI * frac), 100 - r * Math.sin(Math.PI * frac)];
const ARC = "M20,100 A80,80 0 0 1 180,100";
const TICKS = Array.from({ length: 25 }, (_, t) => {
  const f = t / 24;
  const major = t % 6 === 0;
  const [x1, y1] = point(f, 66);
  const [x2, y2] = point(f, major ? 58 : 62);
  return { x1, y1, x2, y2, major };
});

export function RunwayDial({
  value,
  max = 12,
  sub = "months of runway",
  label = "Runway in months",
  format = (v: number) => v.toFixed(1),
}: {
  value: number;
  max?: number;
  sub?: string;
  label?: string;
  format?: (v: number) => string;
}) {
  // Start empty, then move to the real value after mount so the first draw animates.
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(id);
  }, [value]);

  const frac = Math.max(0, Math.min(1, shown / max));
  // Kesta: under a quarter of the scale is rose, under half amber, otherwise lime.
  const tone = shown < max * 0.25 ? "var(--rose)" : shown < max * 0.5 ? "var(--amber)" : "var(--lime)";
  const counted = useCountUp(value, value, 1100);

  return (
    <div className="mx-auto w-full max-w-[230px]">
      <svg viewBox="0 0 200 112" className="block h-auto w-full overflow-visible" role="img" aria-label={`${label}: ${format(value)}`}>
        <path d={ARC} pathLength={100} fill="none" stroke="var(--well)" strokeWidth={13} strokeLinecap="round" />
        <path
          d={ARC}
          pathLength={100}
          fill="none"
          stroke={tone}
          strokeWidth={13}
          strokeLinecap="round"
          strokeDasharray={`${(frac * 100).toFixed(2)} 100`}
          style={{ transition: "stroke-dasharray 1.1s cubic-bezier(0.65, 0, 0.35, 1), stroke 0.4s ease" }}
        />
        <g strokeLinecap="round">
          {TICKS.map((t, i) => (
            <line
              key={i}
              x1={t.x1.toFixed(1)}
              y1={t.y1.toFixed(1)}
              x2={t.x2.toFixed(1)}
              y2={t.y2.toFixed(1)}
              stroke={t.major ? "var(--muted)" : "var(--line-2)"}
              strokeWidth={t.major ? 1.8 : 1.3}
            />
          ))}
        </g>
        <g
          style={{
            transform: `rotate(${180 * frac}deg)`,
            transformOrigin: "100px 100px",
            transition: `transform 1.7s ${ELASTIC_OUT}`,
          }}
        >
          <path d="M100,97 L46,100 L100,103 Z" fill="var(--text)" />
          <circle cx="100" cy="100" r="6.5" fill="var(--text)" />
          <circle cx="100" cy="100" r="2.4" fill="var(--surface)" />
        </g>
      </svg>
      <div className="mt-1.5 grid justify-items-center text-center">
        <b className="text-[32px] font-extrabold leading-none tracking-[-0.04em] text-foreground num">{format(counted)}</b>
        <span className="mt-1 text-[14px] font-semibold text-foreground-muted">{sub}</span>
      </div>
    </div>
  );
}
