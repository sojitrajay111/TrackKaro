"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, StatTile, btnPrimary, btnSmall } from "@/components/ui/page-header";
import { TaskForm } from "@/components/planner/task-form";
import { addDays, dueLabel } from "@/lib/finance";
import { todayKey } from "@/lib/form";
import { useGetTasksQuery, useUpdateTaskMutation } from "@/store/api/tasksApi";
import type { PlannerTask } from "@/store/types";
import { Illustration } from "@/components/ui/illustration";

type View = "todo" | "done" | "all";

const PRIORITY: Record<PlannerTask["priority"], { label: string; pill: string }> = {
  high: { label: "High", pill: "pill--bad" },
  medium: { label: "Medium", pill: "pill--amber" },
  low: { label: "Low", pill: "pill--faint" },
};

/** Tasks list (the calendar shows them by day; this is the plain list, like the app's task view). */
export default function TasksPage() {
  const today = todayKey();
  // Last 60 days through the next year: covers overdue work and everything planned.
  const range = useMemo(() => ({ from: addDays(today, -60), to: addDays(today, 365) }), [today]);
  const { data: tasks = [], isLoading } = useGetTasksQuery(range);
  const [updateTask] = useUpdateTaskMutation();
  const [view, setView] = useState<View>("todo");
  const [editing, setEditing] = useState<PlannerTask | "new" | null>(null);

  const groups = useMemo(() => {
    const list = tasks
      .filter((t) => (view === "all" ? true : view === "done" ? t.status === "done" : t.status !== "done"))
      .sort((a, b) => `${a.dueDate}${a.dueTime ?? ""}`.localeCompare(`${b.dueDate}${b.dueTime ?? ""}`));
    const day = (t: PlannerTask) => t.dueDate.slice(0, 10);
    return [
      { label: "Overdue", items: list.filter((t) => t.status !== "done" && day(t) < today) },
      { label: "Today", items: list.filter((t) => day(t) === today) },
      { label: "Upcoming", items: list.filter((t) => day(t) > today) },
      { label: "Earlier", items: list.filter((t) => t.status === "done" && day(t) < today) },
    ].filter((g) => g.items.length);
  }, [tasks, view, today]);

  const counts = {
    todo: tasks.filter((t) => t.status !== "done").length,
    done: tasks.filter((t) => t.status === "done").length,
    overdue: tasks.filter((t) => t.status !== "done" && t.dueDate.slice(0, 10) < today).length,
    today: tasks.filter((t) => t.status !== "done" && t.dueDate.slice(0, 10) === today).length,
  };

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        section="Studio"
        title="Tasks"
        summary={
          counts.todo ? (
            <>
              <strong className="font-bold text-foreground">{counts.todo}</strong> to do
              {counts.overdue > 0 && (
                <>
                  {" "}
                  · <strong className="font-bold text-[var(--bad)]">{counts.overdue} overdue</strong>
                </>
              )}
              {counts.today > 0 && <> · {counts.today} due today</>}
            </>
          ) : (
            "Plan payments, renewals and anything else you need to remember."
          )
        }
        actions={
          <button type="button" onClick={() => setEditing("new")} className={btnPrimary}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add task
          </button>
        }
      />

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile index={0} label="To do" value={isLoading ? "…" : counts.todo} />
        <StatTile index={1} label="Due today" value={isLoading ? "…" : counts.today} tone={counts.today ? "warn" : undefined} />
        <StatTile index={2} label="Overdue" value={isLoading ? "…" : counts.overdue} tone={counts.overdue ? "bad" : undefined} />
        <StatTile index={3} label="Done" value={isLoading ? "…" : counts.done} tone={counts.done ? "good" : undefined} note="Last 60 days" />
      </dl>

      <div className="inline-flex rounded-[12px] bg-[var(--well)] p-[3px]" role="group" aria-label="Show">
        {(
          [
            ["todo", "To do", counts.todo],
            ["done", "Done", counts.done],
            ["all", "All", tasks.length],
          ] as const
        ).map(([v, l, n]) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            aria-pressed={view === v}
            className={`rounded-[9px] px-3.5 py-1.5 text-[14px] font-bold transition ${view === v ? "bg-[var(--raised)] text-foreground shadow-xs" : "text-foreground-muted hover:text-foreground"}`}
          >
            {l} <span className="opacity-60 num">{n}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-[22px]" />
      ) : groups.length === 0 ? (
        <div className="tk-pop rounded-[22px] border border-border bg-surface p-12 text-center shadow-xs">
          <Illustration name={view === "done" ? "person-empty-desk" : "person-completing-checklist"} height={120} className="mx-auto mb-3" />
          <p className="text-[17px] font-extrabold text-foreground">{view === "done" ? "Nothing finished yet" : "Nothing to do"}</p>
          <p className="mt-1 text-[15px] text-foreground-muted">Add a task to plan payments, renewals or anything else.</p>
        </div>
      ) : (
        <div key={view} className="space-y-4">
          {groups.map((g, gi) => (
            <section key={g.label} className="tk-pop rounded-[22px] border border-border bg-surface p-4 shadow-xs sm:p-5" style={{ animationDelay: `${gi * 0.06}s` }}>
              <h2 className={`mb-1 px-1 text-[13px] font-extrabold uppercase tracking-[0.06em] ${g.label === "Overdue" ? "text-[var(--bad)]" : "text-foreground-muted"}`}>
                {g.label} · {g.items.length}
              </h2>
              <ul>
                {g.items.map((t) => {
                  const done = t.status === "done";
                  return (
                    <li key={t.id} className="flex items-center gap-3 border-b border-border px-1 py-3 last:border-b-0">
                      <span
                        className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-[12px]"
                        style={{ background: "color-mix(in srgb, var(--violet) 15%, transparent)", color: "var(--violet)" }}
                        aria-hidden="true"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 5h14v14H5zM8.5 12l2.5 2.5 4.5-5" />
                        </svg>
                      </span>
                      <button type="button" onClick={() => setEditing(t)} className="min-w-0 flex-1 text-left" title="Edit task">
                        <b className={`block truncate text-[16px] font-bold ${done ? "text-foreground-muted line-through" : "text-foreground"}`}>{t.title}</b>
                        <small className="block truncate text-[14px] text-foreground-muted">
                          {dueLabel(t.dueDate)}
                          {t.dueTime ? ` · ${t.dueTime}` : ""}
                          {t.notes ? ` · ${t.notes}` : ""}
                        </small>
                      </button>
                      <span className={`pill hidden shrink-0 sm:inline-flex ${PRIORITY[t.priority]?.pill ?? "pill--faint"}`}>
                        <i />
                        {PRIORITY[t.priority]?.label}
                      </span>
                      {done ? (
                        <button type="button" onClick={() => updateTask({ id: t.id, patch: { status: "todo" } })} className={`${btnSmall} shrink-0 border border-border bg-surface text-foreground hover:bg-surface-muted`}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--good)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="m5 12.5 4.5 4.5L19 7.5" />
                          </svg>
                          Undo
                        </button>
                      ) : (
                        <button type="button" onClick={() => updateTask({ id: t.id, patch: { status: "done" } })} className={`${btnSmall} shrink-0 bg-[var(--violet)] text-white hover:brightness-110`}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="m5 12.5 4.5 4.5L19 7.5" />
                          </svg>
                          Done
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Modal isOpen={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Add task" : "Edit task"} maxWidth="lg">
        {editing !== null && <TaskForm key={editing === "new" ? "new" : editing.id} task={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      </Modal>
    </div>
  );
}
