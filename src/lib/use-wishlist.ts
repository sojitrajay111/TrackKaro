"use client";

import { useSyncExternalStore } from "react";
import type { Deal } from "@/store/types";

/**
 * Saved ("wishlisted") deals, kept in this browser's storage — the app keeps its wishlist on
 * the device the same way. Stores the whole deal so the Saved view works without re-searching.
 */
const KEY = "tk.deal-wishlist";
const listeners = new Set<() => void>();
let cacheRaw: string | null = null;
let cache: Deal[] = [];
const EMPTY: Deal[] = [];

function read(): Deal[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return cache;
  }
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    try {
      cache = raw ? (JSON.parse(raw) as Deal[]) : [];
    } catch {
      cache = [];
    }
  }
  return cache;
}

function write(list: Deal[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // storage blocked: keep it for this visit
    cache = list;
    cacheRaw = null;
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useWishlist() {
  const list = useSyncExternalStore(subscribe, read, () => EMPTY);
  const has = (id: string) => list.some((d) => d.id === id);
  const toggle = (deal: Deal) => write(has(deal.id) ? list.filter((d) => d.id !== deal.id) : [deal, ...list]);
  return { list, has, toggle };
}
