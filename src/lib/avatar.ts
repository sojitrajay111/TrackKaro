/** Kesta-style letter avatars: soft pastel background, stable per name. */
const AV_TINTS = ["#ead8f2", "#d6e4f3", "#d9ecd2", "#f6e0bb", "#f3d3d8", "#cfe9e5"];

export function avatarTint(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AV_TINTS[h % AV_TINTS.length];
}

export function initialsOf(name: string): string {
  return (
    name
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}
