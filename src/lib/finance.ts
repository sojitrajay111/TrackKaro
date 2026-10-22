import type { CategoryName } from "@/store/types";

export const CATEGORIES: CategoryName[] = [
  "Food",
  "Shopping",
  "Groceries",
  "Bills",
  "Travel",
  "Fuel",
  "Entertainment",
  "Health",
  "Subscriptions",
  "Rent",
  "EMI",
  "Education",
  "Other",
];

export const CATEGORY_ICON: Record<CategoryName, string> = {
  Food: "🍔",
  Shopping: "🛍️",
  Groceries: "🥦",
  Bills: "📄",
  Travel: "✈️",
  Fuel: "⛽",
  Entertainment: "🎬",
  Health: "🏥",
  Subscriptions: "🔄",
  Rent: "🏠",
  EMI: "💳",
  Education: "🎓",
  Other: "📦",
};

/** Whole days from today until a YYYY-MM-DD date (negative when it's past). */
export function daysUntil(date: string): number {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return 0;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((new Date(y, m - 1, d).getTime() - today.getTime()) / 86_400_000);
}

export function dueLabel(date: string): string {
  const n = daysUntil(date);
  if (n < 0) return `Overdue by ${-n}d`;
  if (n === 0) return "Due today";
  if (n === 1) return "Due tomorrow";
  return `Due in ${n}d`;
}

/** Shift a YYYY-MM-DD date by a number of days. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  const t = new Date(y, m - 1, d + days);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

export const shortDate = (date: string) => {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  if (!y) return date;
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};
