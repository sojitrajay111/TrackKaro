"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { CategoryTile } from "@/components/ui/category-icon";
import { useGetTransactionsQuery } from "@/store/api/transactionsApi";
import { useGetRemindersQuery } from "@/store/api/remindersApi";
import { useGetSubscriptionsQuery } from "@/store/api/subscriptionsApi";
import { useGetKhataEntriesQuery } from "@/store/api/khataApi";
import { useGetGroupsQuery } from "@/store/api/groupsApi";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

const PAGES = [
  { label: "Overview", href: "/dashboard" },
  { label: "Expenses", href: "/dashboard/expenses" },
  { label: "Khata Ledger", href: "/dashboard/khata" },
  { label: "Split Groups", href: "/dashboard/groups" },
  { label: "Budgets", href: "/dashboard/spending" },
  { label: "Live Deals", href: "/dashboard/deals" },
  { label: "Bills", href: "/dashboard/reminders" },
  { label: "Subscriptions", href: "/dashboard/subscriptions" },
  { label: "AI Assistant", href: "/dashboard/assistant" },
  { label: "Tasks", href: "/dashboard/tasks" },
  { label: "Calendar", href: "/dashboard/calendar" },
  { label: "Settings", href: "/dashboard/settings" },
];

type Hit = { key: string; group: string; title: string; sub?: string; right?: string; category?: string; href: string };

/**
 * Universal search (⌘K), like the app's search: transactions, bills, subscriptions, khata
 * people, groups and pages — plus a jump to live deal search for products.
 */
export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Only fetch while open; RTK reuses whatever the pages already loaded.
  const skip = !open;
  const { data: txs = [] } = useGetTransactionsQuery(undefined, { skip });
  const { data: bills = [] } = useGetRemindersQuery(undefined, { skip });
  const { data: subs = [] } = useGetSubscriptionsQuery(undefined, { skip });
  const { data: khata = [] } = useGetKhataEntriesQuery(undefined, { skip });
  const { data: groups = [] } = useGetGroupsQuery(undefined, { skip });

  const hits = useMemo<Hit[]>(() => {
    const term = q.trim().toLowerCase();
    const has = (...v: (string | undefined)[]) => v.some((x) => x?.toLowerCase().includes(term));
    if (!term) return PAGES.map((p) => ({ key: `p-${p.href}`, group: "Go to", title: p.label, href: p.href }));
    const out: Hit[] = [];
    out.push(
      ...PAGES.filter((p) => has(p.label)).map((p) => ({ key: `p-${p.href}`, group: "Pages", title: p.label, href: p.href }))
    );
    out.push(
      ...[...txs]
        .filter((t) => has(t.title, t.merchant, t.category, t.notes))
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
        .slice(0, 6)
        .map((t) => ({
          key: `t-${t.id}`,
          group: "Transactions",
          title: t.title,
          sub: `${t.merchant && t.merchant !== t.title ? `${t.merchant} · ` : ""}${t.date?.slice(0, 10)}`,
          right: `${t.type === "income" ? "+" : "−"}${inr(t.amount)}`,
          category: t.category,
          href: `/dashboard/expenses?q=${encodeURIComponent(t.title)}`,
        }))
    );
    out.push(
      ...bills
        .filter((b) => has(b.title, b.category, b.notes))
        .slice(0, 4)
        .map((b) => ({ key: `b-${b.id}`, group: "Bills", title: b.title, sub: `${b.frequency} · due ${b.dueDate?.slice(0, 10)}`, right: inr(b.amount), category: b.category, href: "/dashboard/reminders" }))
    );
    out.push(
      ...subs
        .filter((s) => has(s.name, s.category))
        .slice(0, 4)
        .map((s) => ({ key: `s-${s.id}`, group: "Subscriptions", title: s.name, sub: `${s.billingCycle} · renews ${s.nextBillingDate?.slice(0, 10)}`, right: inr(s.amount), category: s.category, href: "/dashboard/subscriptions" }))
    );
    const people = [...new Set(khata.filter((k) => has(k.personName, k.phone, k.notes)).map((k) => k.personName))].slice(0, 4);
    out.push(...people.map((name) => ({ key: `k-${name}`, group: "Khata", title: name, sub: "Open ledger", href: `/dashboard/khata?person=${encodeURIComponent(name)}` })));
    out.push(
      ...groups
        .filter((g) => has(g.name, g.category))
        .slice(0, 4)
        .map((g) => ({ key: `g-${g.id}`, group: "Groups", title: g.name, sub: g.category, href: `/dashboard/groups/${g.id}` }))
    );
    out.push({ key: "deal", group: "Products", title: `Search deals for “${q.trim()}”`, sub: "Live prices from stores", href: `/dashboard/deals?q=${encodeURIComponent(q.trim())}` });
    return out;
  }, [q, txs, bills, subs, khata, groups]);

  const active = Math.min(cursor, Math.max(0, hits.length - 1));

  const go = (h: Hit) => {
    onClose();
    router.push(h.href);
  };

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-start justify-center p-4 pt-[10vh]" role="dialog" aria-modal="true" aria-label="Search">
      <div className="tk-modal-scrim fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="tk-modal relative z-10 w-full max-w-[600px] !p-0 overflow-hidden">
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="shrink-0 text-foreground-muted" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setCursor(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              else if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor((c) => Math.min(c + 1, hits.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) => Math.max(c - 1, 0));
              } else if (e.key === "Enter" && hits[active]) {
                e.preventDefault();
                go(hits[active]);
              }
            }}
            placeholder="Search transactions, bills, people, groups, products…"
            aria-label="Search"
            className="tk-bare h-14 min-w-0 flex-1 border-0 bg-transparent text-[16px] text-foreground outline-none placeholder:text-foreground-muted"
          />
          <kbd className="hidden rounded-[7px] border border-border bg-[var(--surface-2)] px-1.5 py-0.5 text-[12px] font-bold text-foreground-muted sm:inline">Esc</kbd>
        </div>
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2" role="listbox" aria-label="Results">
          {hits.map((h, i) => {
            const header = i === 0 || hits[i - 1].group !== h.group ? h.group : null;
            return (
              <div key={h.key}>
                {header && <p className="px-3 pb-1 pt-2.5 text-[12px] font-extrabold uppercase tracking-[0.08em] text-foreground-muted">{header}</p>}
                <button
                  type="button"
                  data-i={i}
                  role="option"
                  aria-selected={i === active}
                  onMouseMove={() => setCursor(i)}
                  onClick={() => go(h)}
                  className={`flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-left transition-colors ${i === active ? "bg-[var(--surface-2)]" : ""}`}
                >
                  {h.category ? (
                    <CategoryTile name={h.category} size={32} />
                  ) : (
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[var(--primary-soft)] text-foreground" aria-hidden="true">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={h.group === "Products" ? "M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8zM7 7h.01" : "M5 12h14M13 6l6 6-6 6"} />
                      </svg>
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-[15px] font-bold text-foreground">{h.title}</b>
                    {h.sub && <small className="block truncate text-[13px] text-foreground-muted">{h.sub}</small>}
                  </span>
                  {h.right && <b className="shrink-0 text-[14px] font-extrabold text-foreground num">{h.right}</b>}
                </button>
              </div>
            );
          })}
          {q.trim() && hits.length <= 1 && <p className="px-3 py-6 text-center text-[14px] text-foreground-muted">Nothing in your records matches “{q.trim()}”.</p>}
        </div>
      </div>
    </div>,
    document.body
  );
}
