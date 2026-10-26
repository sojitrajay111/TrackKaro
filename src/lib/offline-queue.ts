import type { Transaction } from "@/store/types";

/**
 * Changes made while offline wait here (browser storage) and are sent, in order, when the
 * connection comes back — the web version of the app's offline queue. Covers the same writes
 * the app queues: transactions, khata entries, and group expenses/settlements.
 */
export type QueuedTransaction = Omit<Transaction, "id">;
export type WriteMethod = "POST" | "PATCH" | "PUT" | "DELETE";
export type QueuedWrite = { id: string; at: number; url: string; method: WriteMethod; body?: unknown };

const KEY = "tk.offline-queue";
const EVENT = "tk:offline-queue";

/** Same list as the app (`TrackKaro/src/store/offline/offline-write-support.ts`). */
const QUEUEABLE: RegExp[] = [
  /^\/transactions$/,
  /^\/transactions\/[^/]+$/,
  /^\/khata$/,
  /^\/khata\/[^/]+\/toggle$/,
  /^\/khata\/settle-all$/,
  /^\/khata\/[^/]+$/,
  /^\/groups\/[^/]+\/expenses$/,
  /^\/groups\/[^/]+\/expenses\/[^/]+$/,
  /^\/groups\/[^/]+\/settlements$/,
];

export const isWriteMethod = (method: string): method is WriteMethod =>
  method === "POST" || method === "PATCH" || method === "PUT" || method === "DELETE";

export const isQueueableOfflineWrite = (url: string, method: string) => isWriteMethod(method) && QUEUEABLE.some((re) => re.test(url));

/** Records created offline get this id until they sync; later queued writes that use it are re-pointed. */
export const offlineId = (queueId: string) => `offline-${queueId}`;
export const isOfflineId = (id: string | undefined) => Boolean(id?.startsWith("offline-"));

export function readQueue(): QueuedWrite[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]") as unknown[];
    // Older builds stored bare transactions; treat those as "add transaction" writes.
    return raw.map((item, i) => {
      const w = item as Partial<QueuedWrite>;
      if (typeof w?.url === "string" && typeof w.method === "string") return w as QueuedWrite;
      return { id: `legacy-${i}`, at: 0, url: "/transactions", method: "POST", body: item };
    });
  } catch {
    return [];
  }
}

function writeQueue(list: QueuedWrite[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // storage full / blocked
  }
  window.dispatchEvent(new Event(EVENT));
}

export function enqueueWrite(write: Omit<QueuedWrite, "id" | "at">): QueuedWrite {
  const item: QueuedWrite = { ...write, id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, at: Date.now() };
  writeQueue([...readQueue(), item]);
  return item;
}

export const enqueueTransaction = (tx: QueuedTransaction) => enqueueWrite({ url: "/transactions", method: "POST", body: tx });
export const replaceQueue = (list: QueuedWrite[]) => writeQueue(list);
export const QUEUE_EVENT = EVENT;

/** What a queued write "returns" right away, so the mutation succeeds and the UI can move on. */
export function offlineResponse(item: QueuedWrite): unknown {
  const body = (item.body ?? {}) as Record<string, unknown>;
  if (item.method === "DELETE") return null;
  if (item.method === "POST" && item.url === "/transactions") return { ...body, id: offlineId(item.id) };
  if (item.method === "POST" && item.url === "/khata") return { ...body, id: offlineId(item.id), status: body.status ?? "pending" };
  const groupPost = item.url.match(/^\/groups\/([^/]+)\/(expenses|settlements)$/);
  if (item.method === "POST" && groupPost) return { ...body, id: offlineId(item.id), groupId: groupPost[1] };
  const idInUrl = item.url.match(/\/([^/]+)$/)?.[1];
  return { ...body, id: idInUrl };
}

/** True for network failures (no response), not for validation/server errors. */
export const isNetworkError = (err: unknown) =>
  typeof navigator !== "undefined" && (!navigator.onLine || (typeof err === "object" && err !== null && (err as { status?: unknown }).status === "FETCH_ERROR"));
