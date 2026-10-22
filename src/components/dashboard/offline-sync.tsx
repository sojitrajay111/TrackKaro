"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { QUEUE_EVENT, readQueue, replaceQueue } from "@/lib/offline-queue";
import { useAddTransactionMutation } from "@/store/api/transactionsApi";

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
  const [addTransaction] = useAddTransactionMutation();
  const busy = useRef(false);

  const flush = useCallback(async () => {
    if (busy.current || !navigator.onLine) return;
    const queue = readQueue();
    if (!queue.length) return;
    busy.current = true;
    setSyncing(true);
    const left = [];
    let sent = 0;
    for (const tx of queue) {
      try {
        await addTransaction(tx).unwrap();
        sent++;
      } catch {
        left.push(tx); // keep it for the next try
      }
    }
    replaceQueue(left);
    busy.current = false;
    setSyncing(false);
    if (sent) {
      setSynced(sent);
      setTimeout(() => setSynced(null), 3000);
    }
  }, [addTransaction]);

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
        ? `You're offline${pending ? ` · ${pending} waiting to sync` : ". New expenses will sync later."}`
        : syncing
          ? `Syncing ${pending} saved ${pending === 1 ? "entry" : "entries"}…`
          : synced
            ? `Synced ${synced} ${synced === 1 ? "entry" : "entries"}`
            : `${pending} waiting to sync`}
    </div>
  );
}
