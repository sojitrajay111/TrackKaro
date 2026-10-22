"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { RecordExpenseModal } from "@/components/ui/record-expense-modal";
import { ReminderForm } from "@/components/planner/reminder-form";
import { SubscriptionForm } from "@/components/planner/subscription-form";
import { TaskForm } from "@/components/planner/task-form";
import { GroupFormModal } from "@/components/groups/group-modals";

/**
 * Kesta's "+ New" quick-add menu, with TrackKaro's own actions. Each item opens the same
 * modal its page uses; while the menu is open, the letter keys pick an item.
 */

type Action = "expense" | "income" | "bill" | "sub" | "task" | "khata" | "group";

const ICONS: Record<Action, string> = {
  expense: "M12 19V5M6 11l6-6 6 6",
  income: "M12 5v14M6 13l6 6 6-6",
  bill: "M7 3h10a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1zM9 8h6M9 12h6",
  sub: "M20 12a8 8 0 0 1-14.3 4.9M4 12a8 8 0 0 1 14.3-4.9M18 3v4.5h-4.5M6 21v-4.5h4.5",
  task: "M5 5h14v14H5zM8.5 12l2.5 2.5 4.5-5",
  khata: "M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11M9 8h6",
  group: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20a6 6 0 0 1 12 0M16 4.5a3.5 3.5 0 0 1 0 6.5M21 20a6 6 0 0 0-4-5.6",
};

const SECTIONS: { label: string; items: { id: Action; label: string; key: string }[] }[] = [
  {
    label: "Money",
    items: [
      { id: "expense", label: "Expense", key: "E" },
      { id: "income", label: "Money in", key: "I" },
    ],
  },
  {
    label: "Plan",
    items: [
      { id: "bill", label: "Bill reminder", key: "B" },
      { id: "sub", label: "Subscription", key: "S" },
      { id: "task", label: "Task", key: "T" },
    ],
  },
  {
    label: "People",
    items: [
      { id: "khata", label: "Khata entry", key: "K" },
      { id: "group", label: "New shared group", key: "G" },
    ],
  },
];
const ALL = SECTIONS.flatMap((s) => s.items);

export function NewMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Action | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const choose = (id: Action) => {
    setOpen(false);
    if (id === "khata") router.push("/dashboard/khata?new=gave");
    else setActive(id);
  };

  // Close on outside click; Escape closes; arrows move; letters pick.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      const idx = itemRefs.current.findIndex((el) => el === document.activeElement);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const next = idx < 0 ? 0 : (idx + (e.key === "ArrowDown" ? 1 : ALL.length - 1)) % ALL.length;
        itemRefs.current[next]?.focus();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const hit = ALL.find((it) => it.key.toLowerCase() === e.key.toLowerCase());
      if (hit) {
        e.preventDefault();
        choose(hit.id);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    // Focus the first item so the keyboard works straight away.
    const t = window.setTimeout(() => itemRefs.current[0]?.focus({ preventScroll: true }), 0);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `choose` only reads stable setters/router
  }, [open]);

  const close = () => setActive(null);

  return (
    <>
      <div ref={wrapRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="inline-flex items-center justify-center gap-2 h-11 px-[18px] rounded-[14px] font-bold text-[16px] bg-[var(--primary)] hover:bg-[var(--primary-strong)] text-[var(--on-primary)] shadow-xs transition-all cursor-pointer select-none leading-none"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="shrink-0 transition-transform duration-300"
            style={{ transform: open ? "rotate(45deg)" : "none" }}
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>New</span>
        </button>

        <div
          role="menu"
          aria-label="Create new"
          data-open={open}
          className="tk-newmenu absolute right-0 top-[calc(100%+8px)] z-50 w-[min(300px,calc(100vw-32px))] rounded-[18px] border border-border bg-[var(--raised)] p-1.5 shadow-[var(--shadow-pop)]"
        >
          {SECTIONS.map((s, si) => (
            <div key={s.label} className={si > 0 ? "mt-1 border-t border-border pt-1" : ""}>
              <p className="px-3 pb-0.5 pt-1.5 text-[12px] font-extrabold uppercase tracking-[0.06em] text-foreground-muted">{s.label}</p>
              {s.items.map((it) => {
                const i = ALL.findIndex((a) => a.id === it.id);
                return (
                  <button
                    key={it.id}
                    ref={(el) => {
                      itemRefs.current[i] = el;
                    }}
                    type="button"
                    role="menuitem"
                    tabIndex={open ? 0 : -1}
                    onClick={() => choose(it.id)}
                    style={{ ["--i" as string]: i }}
                    className="tk-newmenu__item flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left text-[16px] font-semibold text-foreground outline-none transition-colors hover:bg-[var(--surface-2)] focus-visible:bg-[var(--surface-2)]"
                  >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-foreground-sub" aria-hidden="true">
                      <path d={ICONS[it.id]} />
                    </svg>
                    <span className="min-w-0 flex-1 truncate">{it.label}</span>
                    <kbd className="inline-grid h-6 min-w-6 place-items-center rounded-[7px] border border-border bg-[var(--surface-2)] px-1.5 font-sans text-[12px] font-bold text-foreground-muted">
                      {it.key}
                    </kbd>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <RecordExpenseModal key={active ?? "x"} isOpen={active === "expense" || active === "income"} onClose={close} defaultType={active === "income" ? "income" : "expense"} />
      <Modal isOpen={active === "bill"} onClose={close} title="Add bill reminder" maxWidth="xl">
        {active === "bill" && <ReminderForm onClose={close} />}
      </Modal>
      <Modal isOpen={active === "sub"} onClose={close} title="Add subscription" maxWidth="xl">
        {active === "sub" && <SubscriptionForm onClose={close} />}
      </Modal>
      <Modal isOpen={active === "task"} onClose={close} title="Add task" maxWidth="lg">
        {active === "task" && <TaskForm onClose={close} />}
      </Modal>
      <GroupFormModal isOpen={active === "group"} onClose={close} onSaved={(g) => router.push(`/dashboard/groups/${g.id}`)} />
    </>
  );
}
