"use client";

import { useSyncExternalStore } from "react";

type ContactsManager = { select: (props: string[], opts?: { multiple?: boolean }) => Promise<{ name?: string[]; tel?: string[] }[]> };
const getContacts = () => (typeof navigator !== "undefined" ? (navigator as Navigator & { contacts?: ContactsManager }).contacts : undefined);

/**
 * "From contacts" — the browser's Contact Picker (Chrome on Android). Hidden where the browser
 * doesn't support it, so desktop users just type the name as before.
 */
export function ContactPickerButton({ onPick }: { onPick: (name: string, phone?: string) => void }) {
  const supported = useSyncExternalStore(
    () => () => {},
    () => Boolean(getContacts()?.select),
    () => false
  );
  if (!supported) return null;
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          const [c] = (await getContacts()!.select(["name", "tel"], { multiple: false })) ?? [];
          if (c?.name?.[0]) onPick(c.name[0], c.tel?.[0]);
        } catch {
          // picker dismissed
        }
      }}
      className="inline-flex h-8 items-center gap-1.5 rounded-[10px] px-2 text-[14px] font-bold text-[var(--primary)] transition hover:bg-[var(--primary-soft)]"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20a6 6 0 0 1 12 0M18 8v6M15 11h6" />
      </svg>
      From contacts
    </button>
  );
}
