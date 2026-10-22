/** Shared styles and helpers for dashboard forms. */

// Kesta field: 44px, tinted surface, 12px radius, soft focus ring.
export const inputCls =
  "h-11 w-full rounded-[12px] border border-[var(--line-2)] bg-surface px-[13px] text-[15px] font-medium text-foreground placeholder:text-[var(--faint)] focus:outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_16%,transparent)] transition";

export const textareaCls = inputCls.replace("h-11", "min-h-[88px] py-2.5");

/** Readable message from an RTK Query / backend error. */
export function apiErrorMessage(err: unknown, fallback = "Something went wrong. Please try again.") {
  const e = err as { data?: { message?: string | string[]; error?: { message?: string } }; message?: string };
  const raw = e?.data?.message ?? e?.data?.error?.message ?? e?.message;
  if (Array.isArray(raw)) return raw.join(", ");
  if (typeof raw === "string" && raw.trim()) return raw;
  return fallback;
}

export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const fmtINR = (v: number) =>
  `₹${Math.abs(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/** Share text with the native share sheet when available, else copy it. Returns what happened. */
export async function shareOrCopy(text: string, title?: string): Promise<"shared" | "copied" | "failed"> {
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title, text });
      return "shared";
    }
  } catch (err) {
    if ((err as Error)?.name === "AbortError") return "failed";
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
