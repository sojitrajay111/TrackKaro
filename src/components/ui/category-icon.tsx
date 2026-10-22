import type { CategoryName } from "@/store/types";

/** Line icons for spending categories (24px grid, 2px stroke, round caps). */
const PATHS: Record<CategoryName, string> = {
  Food: "M7 3v8a2 2 0 0 0 2 2v8M11 3v8a2 2 0 0 1-2 2M17 21V3c-2 1.5-3 4-3 7s1 4 3 4",
  Shopping: "M5 8h14l-1 12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zM9 8V6a3 3 0 0 1 6 0v2",
  Groceries: "M4 5h2l2 11h10l2-8H7M10 20h.01M17 20h.01",
  Bills: "M7 3h10a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1zM9 8h6M9 12h6",
  Travel: "M3 13.5 21 7l-2.5 3.5L21 17zM8 12l-1.5 6",
  Fuel: "M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M4 21h12M15 9h2a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V8l-3-3M8 8h4",
  Entertainment: "M4 6h16v12H4zM4 10h16M9 6l-2 4M14 6l-2 4M19 6l-2 4",
  Health: "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10zM9 11h6M12 8v6",
  Subscriptions: "M20 12a8 8 0 0 1-14.3 4.9M4 12a8 8 0 0 1 14.3-4.9M18 3v4.5h-4.5M6 21v-4.5h4.5",
  Rent: "M4 10.5 12 4l8 6.5V20H4zM10 20v-5h4v5",
  EMI: "M3 7h18v10H3zM3 11h18M7 15h3",
  Education: "M3 9l9-4 9 4-9 4zM7 11v4c0 1.5 2.2 3 5 3s5-1.5 5-3v-4M21 9v5",
  Other: "M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z",
};

/** Kesta-style category colours: a soft tile with a deeper stroke. */
export const CATEGORY_TINT: Record<CategoryName, { bg: string; fg: string; dot: string }> = {
  Food: { bg: "#f6e0bb", fg: "#8f5f06", dot: "#cc8a12" },
  Shopping: { bg: "#f5c3cb", fg: "#a3364a", dot: "#d1495b" },
  Groceries: { bg: "#cfe8b9", fg: "#3f7420", dot: "#5a9a2c" },
  Bills: { bg: "#d8d0f6", fg: "#5646ad", dot: "#7a68d6" },
  Travel: { bg: "#c2daf3", fg: "#2a6299", dot: "#3b7fc4" },
  Fuel: { bg: "#fbcdb8", fg: "#b04a24", dot: "#e2683f" },
  Entertainment: { bg: "#ead8f2", fg: "#7a3f94", dot: "#a35bc2" },
  Health: { bg: "#b5e3dc", fg: "#11707d", dot: "#178a9a" },
  Subscriptions: { bg: "#d8d0f6", fg: "#5646ad", dot: "#7a68d6" },
  Rent: { bg: "#f3d3d8", fg: "#9b3a4a", dot: "#d1495b" },
  EMI: { bg: "#f5d79f", fg: "#8f5f06", dot: "#cc8a12" },
  Education: { bg: "#cfe9e5", fg: "#1f6f61", dot: "#1f8366" },
  Other: { bg: "#d3d6df", fg: "#4d5163", dot: "#6b6f80" },
};

export function CategoryIcon({ name, size = 18 }: { name: CategoryName | string; size?: number }) {
  const d = PATHS[name as CategoryName] ?? PATHS.Other;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

/** Rounded tile with the category's icon, in the category's colours. */
export function CategoryTile({ name, size = 36 }: { name: CategoryName | string; size?: number }) {
  const t = CATEGORY_TINT[name as CategoryName] ?? CATEGORY_TINT.Other;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size, borderRadius: size * 0.3, background: t.bg, color: t.fg }}
      aria-hidden="true"
    >
      <CategoryIcon name={name} size={Math.round(size * 0.5)} />
    </span>
  );
}
