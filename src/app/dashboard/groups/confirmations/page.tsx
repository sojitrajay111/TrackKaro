"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryTile } from "@/components/ui/category-icon";
import { apiErrorMessage, fmtINR } from "@/lib/form";
import { shortDate } from "@/lib/finance";
import { useConfirmGroupExpenseMutation, useGetPendingGroupConfirmationsQuery } from "@/store/api/groupsApi";
import type { CategoryName, PendingGroupConfirmation } from "@/store/types";

const CATEGORIES: CategoryName[] = ["Food", "Shopping", "Groceries", "Bills", "Travel", "Fuel", "Entertainment", "Health", "Subscriptions", "Rent", "EMI", "Education", "Other"];

type Item = PendingGroupConfirmation;
type Phase = "idle" | "saving" | "added" | "leaving";
const keyOf = (p: Item) => `${p.groupId}-${p.expenseId}`;

/** How long each step of the "added" sequence lasts (ms). */
const ADDED_MS = 850; // green button + sweep, so the user sees it worked
const LEAVE_MS = 380; // card fades and shrinks away

/** One group bill: your share, where it goes in your spending, and the confirm action. */
function ConfirmCard({
  item,
  index,
  onAdded,
  onGone,
  cardRef,
}: {
  item: Item;
  index: number;
  onAdded: () => void;
  onGone: () => void;
  cardRef: (el: HTMLLIElement | null) => void;
}) {
  const [category, setCategory] = useState<CategoryName>(item.suggestedCategory);
  const [confirm] = useConfirmGroupExpenseMutation();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setPhase("saving");
    try {
      await confirm({ groupId: item.groupId, expenseId: item.expenseId, category }).unwrap();
      onAdded(); // keep this card on screen while it animates out, even after the list refetches
      setPhase("added");
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.setTimeout(() => setPhase("leaving"), reduce ? 400 : ADDED_MS);
      window.setTimeout(onGone, (reduce ? 400 : ADDED_MS) + LEAVE_MS);
    } catch (err) {
      setPhase("idle");
      setError(apiErrorMessage(err, "Couldn't add it to your expenses."));
    }
  };

  const busy = phase !== "idle";
  const done = phase === "added" || phase === "leaving";

  return (
    <li
      ref={cardRef}
      data-phase={phase}
      className="tk-cf tk-pop relative flex flex-col gap-4 overflow-hidden rounded-[22px] border border-border bg-surface p-5 shadow-xs"
      style={{ animationDelay: `${Math.min(index, 6) * 0.05}s` }}
      aria-busy={phase === "saving"}
    >
      <div className="flex items-start gap-3.5">
        <span className="tk-cf__tile">
          <CategoryTile name={category} size={44} />
        </span>
        <div className="min-w-0 flex-1">
          <Link href={`/dashboard/groups/${item.groupId}`} className="text-[14px] font-[650] text-foreground-muted hover:text-foreground hover:underline">
            {item.groupName}
          </Link>
          <h3 className="truncate text-[17px] font-extrabold tracking-[-0.015em] text-foreground">{item.title}</h3>
          <p className="text-[14px] text-foreground-muted">
            {shortDate(item.date)} · Paid by {item.isPayer ? "you" : item.paidBy}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[13px] font-bold text-foreground-muted">Your share</p>
          <b className="text-[24px] font-extrabold leading-tight tracking-[-0.03em] text-foreground num">{fmtINR(item.amount)}</b>
        </div>
      </div>

      <div>
        <p className="mb-2 text-[14px] font-bold text-foreground-muted">Add to category</p>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="radiogroup" aria-label={`Category for ${item.title}`}>
          {CATEGORIES.map((c) => {
            const on = category === c;
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={busy}
                onClick={() => setCategory(c)}
                className={`inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-full border pl-1 pr-3 text-[14px] font-bold transition disabled:cursor-default ${
                  on ? "border-[var(--primary)] bg-[var(--primary-soft)] text-foreground" : "border-border bg-surface text-foreground-muted enabled:hover:text-foreground"
                }`}
              >
                <CategoryTile name={c} size={26} />
                {c}
                {c === item.suggestedCategory && !on && <span className="text-[12px] font-semibold text-foreground-muted">· suggested</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-[14px] text-foreground-muted">
          {done ? (
            <>
              Added to your <b className="font-bold text-foreground">{category}</b> spending
            </>
          ) : (
            <>
              Counts toward your <b className="font-bold text-foreground">{category}</b> budget
            </>
          )}
        </p>
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          aria-live="polite"
          className={`tk-cf__btn inline-flex h-11 items-center gap-2 rounded-[14px] px-[18px] text-[16px] font-bold shadow-xs transition-colors duration-300 ${
            done ? "bg-[var(--good)] text-white" : "bg-[var(--primary)] text-[var(--on-primary)] enabled:hover:bg-[var(--primary-strong)]"
          }`}
        >
          {phase === "saving" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path className={done ? "tk-cf__check" : ""} d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          )}
          {phase === "saving" ? "Adding…" : done ? `Added to ${category}` : "Add to my expenses"}
        </button>
      </div>
      {error && (
        <p role="alert" className="-mt-2 text-[14px] font-semibold text-[var(--bad)]">
          {error}
        </p>
      )}
    </li>
  );
}

export default function GroupConfirmationsPage() {
  const { data: pending = [], isLoading } = useGetPendingGroupConfirmationsQuery();

  // What's on screen: the pending list plus any card still playing its exit animation (the
  // server list drops it as soon as it's confirmed). Order is kept so nothing jumps.
  const [exiting, setExiting] = useState<Set<string>>(() => new Set());
  const [order, setOrder] = useState<string[]>([]);
  const [items, setItems] = useState<Record<string, Item>>({});
  const [seen, setSeen] = useState<string | null>(null);
  const sig = pending.map(keyOf).join("|");
  if (sig !== seen) {
    setSeen(sig);
    const pendingKeys = new Set(pending.map(keyOf));
    setItems((prev) => ({ ...prev, ...Object.fromEntries(pending.map((p) => [keyOf(p), p])) }));
    setOrder((prev) => [...prev.filter((k) => pendingKeys.has(k) || exiting.has(k)), ...pending.map(keyOf).filter((k) => !prev.includes(k))]);
  }
  const shown = order.map((k) => items[k]).filter(Boolean);
  const waiting = shown.filter((p) => !exiting.has(keyOf(p)));
  const total = waiting.reduce((s, p) => s + p.amount, 0);

  const markAdded = (k: string) => setExiting((s) => new Set(s).add(k));
  const markGone = (k: string) => {
    setOrder((o) => o.filter((x) => x !== k));
    setExiting((s) => {
      const next = new Set(s);
      next.delete(k);
      return next;
    });
  };

  // FLIP: when a card leaves, the others glide into the gap instead of jumping.
  const els = useRef(new Map<string, HTMLLIElement>());
  const lastPos = useRef(new Map<string, DOMRect>());
  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const next = new Map<string, DOMRect>();
    els.current.forEach((el, k) => {
      const now = el.getBoundingClientRect();
      const prev = lastPos.current.get(k);
      if (prev && !reduce) {
        const dx = prev.left - now.left;
        const dy = prev.top - now.top;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }], { duration: 460, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
        }
      }
      next.set(k, now);
    });
    lastPos.current = next;
  }, [order]);

  return (
    <div className="space-y-6 pb-16">
      <header className="flex flex-col gap-1.5">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[14px] font-[650] text-foreground-muted">
          <Link href="/dashboard/groups" className="hover:text-foreground">
            Split Groups
          </Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9.5 6 6 6-6 6" />
          </svg>
          <span className="text-foreground">Confirm</span>
        </nav>
        <h1 className="text-[clamp(1.875rem,2.5vw,2.375rem)] font-extrabold leading-[1.08] tracking-[-0.04em] text-foreground">Confirm group expenses</h1>
        <p className="text-[16px] font-medium text-foreground-muted" aria-live="polite">
          {waiting.length > 0 ? (
            <>
              <strong className="font-bold text-foreground">{waiting.length}</strong> {waiting.length === 1 ? "bill" : "bills"} waiting ·{" "}
              <strong className="font-bold text-foreground num">{fmtINR(total)}</strong> is your share. Add each to your own spending and budgets.
            </>
          ) : (
            "Your share of each group bill, ready to add to your own spending and budgets."
          )}
        </p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-56 rounded-[22px]" />
          <Skeleton className="h-56 rounded-[22px]" />
        </div>
      ) : shown.length === 0 ? (
        <div className="tk-pop rounded-[22px] border border-border bg-surface px-6 py-14 text-center shadow-xs">
          <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-[16px] bg-[var(--primary-soft)] text-[var(--primary)]" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path className="tk-cf__check" d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          </span>
          <p className="text-[17px] font-extrabold text-foreground">All caught up</p>
          <p className="mt-1 text-[15px] text-foreground-muted">Nothing waiting. New group bills you&apos;re part of will show up here.</p>
          <Link
            href="/dashboard/groups"
            className="mt-4 inline-flex h-11 items-center rounded-[14px] border border-border bg-surface px-[18px] text-[16px] font-bold text-foreground transition hover:bg-surface-muted"
          >
            Back to groups
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {shown.map((p, i) => {
            const k = keyOf(p);
            return (
              <ConfirmCard
                key={k}
                item={p}
                index={i}
                onAdded={() => markAdded(k)}
                onGone={() => markGone(k)}
                cardRef={(el) => {
                  if (el) els.current.set(k, el);
                  else els.current.delete(k);
                }}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}
