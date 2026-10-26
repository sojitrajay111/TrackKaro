/**
 * Task times are stored as 24-hour "HH:mm" (the backend's format, and what <input type="time">
 * reads and writes). The app shows them as 12-hour; so does the website.
 */

/** "18:10" → "6:10 PM"; empty or unreadable → "". */
export function formatTaskTime(value?: string | null): string {
  const m = value?.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return "";
  const h = Number(m[1]);
  if (h > 23 || Number(m[2]) > 59) return "";
  return `${h % 12 || 12}:${m[2]} ${h >= 12 ? "PM" : "AM"}`;
}

/** Minutes after midnight, for ordering same-day items (no time sorts first). */
export function taskTimeMinutes(value?: string | null): number {
  const m = value?.match(/^(\d{1,2}):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : -1;
}
