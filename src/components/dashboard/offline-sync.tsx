"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { QUEUE_EVENT, offlineId, readQueue, replaceQueue, type QueuedWrite } from "@/lib/offline-queue";
import { useAppDispatch } from "@/store";
import { apiSlice } from "@/store/api/apiSlice";

/** Sends one queued write exactly as it was made (through the normal auth / token-refresh path). */
const replayApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    replayOfflineWrite: builder.mutation<unknown, Pick<QueuedWrite, "url" | "method" | "body">>({
      query: ({ url, method, body }) => ({ url, method, body }),
    }),
  }),
});

const subscribeOnline = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

const subscribeQueue = (cb: () => void) => {
  window.addEventListener(QUEUE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(QUEUE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};

/** Offline banner + sync: shows when offline or items are waiting, and sends them when back online. */
export function OfflineSync() {
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const pending = useSyncExternalStore(subscribeQueue, () => readQueue().length, () => 0);
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState<number | null>(null);
  const [replayWrite] = replayApi.useReplayOfflineWriteMutation();
  const dispatch = useAppDispatch();
  const busy = useRef(false);

  const flush = useCallback(async () => {
    if (busy.current || !navigator.onLine) return;
    const queue = readQueue();
    if (!queue.length) return;
    busy.current = true;
    setSyncing(true);
    // In order, so an edit made offline lands after the add it edits. Records created offline
    // have a temporary id; once the add syncs, later writes are re-pointed at the real id.
    const realIds = new Map<string, string>();
    const left: QueuedWrite[] = [];
    let sent = 0;
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      const url = item.url.replace(/offline-[\w-]+/g, (tmp) => realIds.get(tmp) ?? tmp);
      try {
        const res = (await replayWrite({ url, method: item.method, body: item.body }).unwrap()) as { id?: string } | null;
        if (res?.id) realIds.set(offlineId(item.id), res.id);
        sent++;
      } catch (err) {
        const status = (err as { status?: unknown })?.status;
        if (typeof status === "number" && status >= 400 && status < 500) continue; // rejected for good (e.g. already deleted): drop it
        left.push(...queue.slice(i)); // network trouble: keep this and the rest for the next try
        break;
      }
    }
    replaceQueue(left);
    if (sent) dispatch(apiSlice.util.invalidateTags(["Transactions", "Khata", "Groups", "Budgets", "Notifications"]));
    busy.current = false;
    setSyncing(false);
    if (sent) {
      setSynced(sent);
      setTimeout(() => setSynced(null), 3000);
    }
  }, [replayWrite, dispatch]);

  // When the connection returns (or on load), send anything waiting. Deferred a tick so the
  // sync's state updates don't run inside the effect itself.
  useEffect(() => {
    if (!online) return;
    const t = window.setTimeout(() => void flush(), 0);
    return () => window.clearTimeout(t);
  }, [online, flush]);

  if (online && !pending && !synced) return null;
  return (
    <div role="status" className="tk-pop fixed bottom-4 left-1/2 z-[230] -translate-x-1/2 rounded-full border border-border bg-[var(--toast)] px-4 py-2 text-[14px] font-bold text-[var(--on-toast)] shadow-[var(--shadow-pop)]">
      {!online
        ? `You're offline${pending ? ` · ${pending} waiting to sync` : ". Changes will sync when you're back online."}`
        : syncing
          ? `Syncing ${pending} saved ${pending === 1 ? "change" : "changes"}…`
          : synced
            ? `Synced ${synced} ${synced === 1 ? "change" : "changes"}`
            : `${pending} waiting to sync`}
    </div>
  );
}
