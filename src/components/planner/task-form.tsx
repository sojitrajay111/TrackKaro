"use client";

import { useState, type FormEvent } from "react";
import { ModalField, ModalFooter } from "@/components/ui/modal";
import { Segmented } from "@/components/ui/segmented";
import { apiErrorMessage, inputCls, textareaCls, todayKey } from "@/lib/form";
import { useAddTaskMutation, useDeleteTaskMutation, useUpdateTaskMutation } from "@/store/api/tasksApi";
import type { PlannerTask, PlannerTaskPriority } from "@/store/types";

export function TaskForm({
  task,
  initialDate,
  onClose,
}: {
  task?: PlannerTask;
  initialDate?: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate?.slice(0, 10) ?? initialDate ?? todayKey());
  const [dueTime, setDueTime] = useState(task?.dueTime ?? "");
  const [priority, setPriority] = useState<PlannerTaskPriority>(task?.priority ?? "medium");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [addTask, { isLoading: adding }] = useAddTaskMutation();
  const [updateTask, { isLoading: updating }] = useUpdateTaskMutation();
  const [deleteTask, { isLoading: deleting }] = useDeleteTaskMutation();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Give the task a title.");
    const body = { title: title.trim(), dueDate, dueTime: dueTime || undefined, priority, notes: notes.trim() || undefined };
    try {
      if (task) await updateTask({ id: task.id, patch: body }).unwrap();
      else await addTask(body).unwrap();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't save the task."));
    }
  };

  const toggleDone = async () => {
    if (!task) return;
    try {
      await updateTask({ id: task.id, patch: { status: task.status === "done" ? "todo" : "done" } }).unwrap();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const remove = async () => {
    if (!task || !window.confirm(`Delete "${task.title}"?`)) return;
    try {
      await deleteTask(task.id).unwrap();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <ModalField label="Task">
        <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Pay maid, renew insurance" className={inputCls} />
      </ModalField>
      <div className="grid grid-cols-2 gap-3">
        <ModalField label="Due date">
          <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
        </ModalField>
        <ModalField label="Time (optional)">
          <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className={inputCls} />
        </ModalField>
      </div>
      <ModalField label="Priority">
        <Segmented
          label="Priority"
          value={priority}
          onChange={setPriority}
          options={[
            { value: "low", label: "Low" },
            { value: "medium", label: "Medium" },
            { value: "high", label: "High" },
          ]}
        />
      </ModalField>
      <ModalField label="Notes (optional)">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={textareaCls} />
      </ModalField>
      {error && <p role="alert" className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
      {task && (
        <div className="flex justify-between text-xs font-semibold">
          <button type="button" onClick={toggleDone} disabled={updating} className="text-primary hover:underline">
            {task.status === "done" ? "Mark to do" : "Mark done"}
          </button>
          <button type="button" onClick={remove} disabled={deleting} className="text-red-500 hover:underline">
            Delete task
          </button>
        </div>
      )}
      <ModalFooter onCancel={onClose} confirmLabel={task ? "Save changes" : "Add task"} isSubmitting={adding || updating} />
    </form>
  );
}
