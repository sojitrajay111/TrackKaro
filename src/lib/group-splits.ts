import type { GroupExpenseSplit, SplitType } from "@/store/types";

/**
 * Build the `splits` array for a group expense, matching the mobile app's AddGroupExpenseSheet.
 * All maths is done in paise so the parts always add up to the total exactly (the backend
 * rejects splits that don't sum to the bill).
 */

export function clampShares(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(99, Math.max(1, Math.round(value)));
}

/** Divide `totalMinor` by weights; the last part takes the rounding remainder. */
function divideMinor(totalMinor: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return weights.map(() => 0);
  let allocated = 0;
  return weights.map((w, i) => {
    if (i === weights.length - 1) return totalMinor - allocated;
    const part = Math.round((totalMinor * w) / sum);
    allocated += part;
    return part;
  });
}

export interface SplitInput {
  mode: SplitType;
  total: number;
  members: string[];
  included: Record<string, boolean>;
  shares: Record<string, number>;
  exact: Record<string, string>;
  percent: Record<string, string>;
}

export function buildSplits(input: SplitInput): GroupExpenseSplit[] {
  const totalMinor = Math.round(input.total * 100);
  if (totalMinor <= 0) return [];

  if (input.mode === "equal" || input.mode === "shares") {
    const chosen = input.members.filter((m) => input.included[m]);
    const weights = chosen.map((m) => (input.mode === "shares" ? clampShares(input.shares[m] ?? 1) : 1));
    const parts = divideMinor(totalMinor, weights);
    return chosen.map((m, i) => ({ memberName: m, amount: parts[i] / 100, shares: weights[i] }));
  }

  if (input.mode === "exact") {
    return input.members
      .map((m) => ({ memberName: m, amount: Math.round((parseFloat(input.exact[m] || "0") || 0) * 100) / 100 }))
      .filter((s) => s.amount > 0);
  }

  // percentage
  const chosen = input.members.filter((m) => (parseFloat(input.percent[m] || "0") || 0) > 0);
  const parts = divideMinor(
    totalMinor,
    chosen.map((m) => parseFloat(input.percent[m] || "0") || 0)
  );
  return chosen.map((m, i) => ({ memberName: m, amount: parts[i] / 100 }));
}

/** Why the split can't be saved yet, or null when it is valid. */
export function splitProblem(input: SplitInput): string | null {
  if (!(input.total > 0)) return "Enter the bill amount.";
  if (input.mode === "equal" || input.mode === "shares") {
    return input.members.some((m) => input.included[m]) ? null : "Pick at least one person to split with.";
  }
  if (input.mode === "exact") {
    const sum = input.members.reduce((a, m) => a + (parseFloat(input.exact[m] || "0") || 0), 0);
    const diff = Math.round((input.total - sum) * 100) / 100;
    if (Math.abs(diff) >= 0.05) return diff > 0 ? `₹${diff.toFixed(2)} still to assign.` : `₹${(-diff).toFixed(2)} over the total.`;
    return null;
  }
  const pct = input.members.reduce((a, m) => a + (parseFloat(input.percent[m] || "0") || 0), 0);
  if (Math.abs(pct - 100) >= 0.01) return `Percentages add up to ${Math.round(pct * 100) / 100}%, need 100%.`;
  return null;
}

/** Rebuild form state from a saved expense, for editing. */
export function splitStateFromExpense(
  members: string[],
  splits: GroupExpenseSplit[],
  total: number,
  mode: SplitType
): Pick<SplitInput, "included" | "shares" | "exact" | "percent"> {
  const by = new Map(splits.map((s) => [s.memberName, s]));
  const included: Record<string, boolean> = {};
  const shares: Record<string, number> = {};
  const exact: Record<string, string> = {};
  const percent: Record<string, string> = {};
  for (const m of members) {
    const s = by.get(m);
    included[m] = Boolean(s && s.amount > 0);
    shares[m] = s?.shares ? clampShares(s.shares) : 1;
    exact[m] = s && s.amount > 0 ? String(s.amount) : "";
    percent[m] = s && s.amount > 0 && total > 0 ? String(Math.round((s.amount / total) * 10000) / 100) : "";
  }
  if (mode === "equal" && !members.some((m) => included[m])) members.forEach((m) => (included[m] = true));
  return { included, shares, exact, percent };
}
