"use client";

import type { CSSProperties } from "react";
import { useAppSelector } from "@/store";

/**
 * Hand-drawn scenes from Koboyo Icons (koboyo.com/icons — free for commercial use, no
 * attribution required; files live in /public/illustrations). Each SVG is single-colour, so
 * it's drawn as a CSS mask filled with `currentColor`: it takes any theme colour and follows
 * light/dark mode. Used for empty states, the welcome tour and the marketing site.
 *
 * Gender-aware: when the signed-in user's profile says male or female, single-person scenes
 * swap to a version with a man or a woman doing the same thing. "Other", "Skip" and signed-out
 * visitors see the default mix.
 */
const SIZES = {
  "person-celebrating-confetti": [208, 171],
  "person-empty-basket": [192, 261],
  "person-paid-receipt": [204, 238],
  "person-overdue-bill": [198, 241],
  "person-subscribing": [135, 226],
  "person-completing-checklist": [211, 227],
  "person-searching-torch": [270, 203],
  "person-receiving-money": [210, 224],
  "group-celebrating-win": [244, 183],
  "person-checking-wristwatch": [171, 228],
  "person-lost-map": [212, 213],
  "person-finding-answer": [200, 204],
  "person-launching-rocket": [194, 170],
  "person-adding-basket": [196, 262],
  "person-finding-shortcut": [249, 214],
  "buddy-pair": [227, 175],
  "person-raising-trophy": [193, 192],
  "person-finishing-tour": [220, 206],
  "person-no-signal": [154, 209],
  "person-empty-desk": [243, 213],
  "person-paying-card": [223, 257],
  "team-celebrating": [273, 181],
  "person-invoice": [229, 243],
  // gender variants
  "person-full-battery": [148, 192],
  "person-empty-table": [227, 217],
  "person-wishlist": [178, 219],
  "person-cutting-ribbon": [239, 188],
  "person-receiving-parcel": [176, 224],
  "person-searching-torch-2": [179, 239],
  "person-approving-submission": [219, 212],
  "person-following-signpost": [232, 205],
  "person-naming-workspace": [227, 201],
  "person-dead-end": [241, 195],
  "person-failed-transfer": [190, 221],
  "person-choosing-option": [123, 202],
} as const;

type FileName = keyof typeof SIZES;

/** Scene → the same idea drawn with a man / a woman (only where the default shows one person). */
const BY_GENDER: Partial<Record<FileName, { male: FileName; female: FileName }>> = {
  "person-celebrating-confetti": { male: "person-full-battery", female: "person-celebrating-confetti" },
  "person-checking-wristwatch": { male: "person-empty-table", female: "person-checking-wristwatch" },
  "person-empty-desk": { male: "person-empty-table", female: "person-empty-desk" },
  "person-adding-basket": { male: "person-wishlist", female: "person-adding-basket" },
  "person-launching-rocket": { male: "person-cutting-ribbon", female: "person-launching-rocket" },
  "person-receiving-money": { male: "person-receiving-parcel", female: "person-receiving-money" },
  "person-searching-torch": { male: "person-searching-torch-2", female: "person-searching-torch" },
  "person-completing-checklist": { male: "person-completing-checklist", female: "person-naming-workspace" },
  "person-empty-basket": { male: "person-empty-basket", female: "person-adding-basket" },
  "person-finding-shortcut": { male: "person-finding-shortcut", female: "person-following-signpost" },
  "person-invoice": { male: "person-invoice", female: "person-overdue-bill" },
  "person-lost-map": { male: "person-lost-map", female: "person-dead-end" },
  "person-no-signal": { male: "person-no-signal", female: "person-failed-transfer" },
  "person-paid-receipt": { male: "person-paid-receipt", female: "person-approving-submission" },
  "person-raising-trophy": { male: "person-raising-trophy", female: "person-celebrating-confetti" },
  "person-subscribing": { male: "person-subscribing", female: "person-choosing-option" },
};

export type SceneName = FileName;

export function Illustration({
  name,
  height = 120,
  color = "var(--primary)",
  className = "",
  float = true,
  label,
}: {
  name: SceneName;
  /** Rendered height in px; width follows the drawing's own proportions. */
  height?: number;
  color?: string;
  className?: string;
  /** Gentle rise-in + idle float (off for reduced motion). */
  float?: boolean;
  /** Set only when the drawing adds meaning; otherwise it's decorative. */
  label?: string;
}) {
  const gender = useAppSelector((s) => s.auth.user?.gender);
  const variant = BY_GENDER[name];
  const file: FileName = variant && (gender === "male" || gender === "female") ? variant[gender] : name;
  const [w, h] = SIZES[file];
  const url = `url(/illustrations/${file}.svg)`;
  const style: CSSProperties = {
    width: Math.round((height * w) / h),
    height,
    color,
    backgroundColor: "currentColor",
    WebkitMaskImage: url,
    maskImage: url,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskPosition: "center",
    maskPosition: "center",
  };
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`tk-illus inline-block shrink-0 ${float ? "tk-illus--float" : ""} ${className}`}
      style={style}
    />
  );
}
