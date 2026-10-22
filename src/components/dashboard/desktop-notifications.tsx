"use client";

import { useEffect, useRef } from "react";
import { useGetNotificationsQuery, type ApiNotification } from "@/store/api/notificationsApi";

/**
 * Desktop alerts for new TrackKaro notifications while the site is open in any tab (the web
 * stand-in for the app's push notifications). Turned on from Settings → Notifications, which
 * asks the browser for permission; checks for new ones every minute.
 */
export const DESKTOP_ALERTS_KEY = "tk.desktop-alerts";

export function desktopAlertsOn() {
  try {
    return localStorage.getItem(DESKTOP_ALERTS_KEY) === "1" && typeof Notification !== "undefined" && Notification.permission === "granted";
  } catch {
    return false;
  }
}

export function DesktopNotifications() {
  const { data = [] } = useGetNotificationsQuery(undefined, { pollingInterval: 60_000 });
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    // First load: remember what's already there so only genuinely new ones pop up.
    if (seen.current === null) {
      seen.current = new Set(data.map((n) => n.id));
      return;
    }
    const fresh: ApiNotification[] = data.filter((n) => !n.read && !seen.current!.has(n.id));
    data.forEach((n) => seen.current!.add(n.id));
    if (!fresh.length || !desktopAlertsOn()) return;
    for (const n of fresh.slice(0, 3)) {
      try {
        const note = new Notification(n.title, { body: n.message, icon: "/logo.png", tag: n.id });
        note.onclick = () => {
          window.focus();
          note.close();
        };
      } catch {
        // some browsers only allow notifications from a service worker
      }
    }
  }, [data]);

  return null;
}
