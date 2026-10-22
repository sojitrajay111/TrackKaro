"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Hands a URL query value (e.g. `?q=rent` from the search palette) to the page once, then
 * removes it from the address bar. Wrapped in Suspense as useSearchParams requires.
 */
export function OnQueryParam({ name, onValue }: { name: string; onValue: (value: string) => void }) {
  return (
    <Suspense fallback={null}>
      <Reader name={name} onValue={onValue} />
    </Suspense>
  );
}

function Reader({ name, onValue }: { name: string; onValue: (value: string) => void }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const value = params.get(name);
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!value) {
      handled.current = null;
      return;
    }
    if (handled.current === value) return;
    handled.current = value;
    onValue(value);
    const rest = new URLSearchParams(params.toString());
    rest.delete(name);
    const qs = rest.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [value, name, onValue, params, pathname, router]);
  return null;
}
