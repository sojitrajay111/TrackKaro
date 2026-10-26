"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * false during server rendering and hydration, true afterwards. Use it to gate anything that
 * depends on browser-only state (the signed-in user restored from storage), so the first client
 * render matches the server HTML and React doesn't report a hydration mismatch.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}
