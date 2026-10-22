import type { Transaction } from "@/store/types";

/**
 * Transactions recorded while offline wait here (browser storage) and are sent when the
 * connection comes back — the web version of the app's offline queue.
 */
export type QueuedTransaction = Omit<Transaction, "id">;

const KEY = "tk.offline-queue";
const EVENT = "tk:offline-queue";

export function readQueue(): QueuedTransaction[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as QueuedTransaction[];
  } catch {
    return [];
  }
}

function writeQueue(list: QueuedTransaction[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // storage full / blocked
  }
  window.dispatchEvent(new Event(EVENT));
}

export const enqueueTransaction = (tx: QueuedTransaction) => writeQueue([...readQueue(), tx]);
export const replaceQueue = (list: QueuedTransaction[]) => writeQueue(list);
export const QUEUE_EVENT = EVENT;

/** True for network failures (no response), not for validation/server errors. */
export const isNetworkError = (err: unknown) =>
  typeof navigator !== "undefined" && (!navigator.onLine || (typeof err === "object" && err !== null && (err as { status?: unknown }).status === "FETCH_ERROR"));
