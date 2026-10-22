"use client";

import { useState, type FormEvent } from "react";
import { ModalField, ModalFooter } from "@/components/ui/modal";
import { apiErrorMessage, inputCls, textareaCls, todayKey } from "@/lib/form";
import { CATEGORIES, CATEGORY_ICON, addDays } from "@/lib/finance";
import { useAddReminderMutation, useUpdateReminderMutation } from "@/store/api/remindersApi";
import type { BillReminder, CategoryName, Frequency } from "@/store/types";

const FREQUENCIES: Frequency[] = ["Monthly", "Quarterly", "Yearly", "One-time"];

/* -------------------------------------------------------------------------- */
/* Add / edit form                                                            */
/* -------------------------------------------------------------------------- */

export function ReminderForm({
  reminder,
  initialDueDate,
  onClose,
}: {
  reminder?: BillReminder;
  initialDueDate?: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(reminder?.title ?? "");
  const [category, setCategory] = useState<CategoryName>(reminder?.category ?? "Bills");
  const [amount, setAmount] = useState(reminder ? String(reminder.amount) : "");
  const [dueDate, setDueDate] = useState(reminder?.dueDate?.slice(0, 10) ?? initialDueDate ?? addDays(todayKey(), 7));
  const [reminderDate, setReminderDate] = useState(reminder?.reminderDate?.slice(0, 10) ?? addDays(todayKey(), 4));
  const [frequency, setFrequency] = useState<Frequency>(reminder?.frequency ?? "Monthly");
  const [notes, setNotes] = useState(reminder?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [addReminder, { isLoading: adding }] = useAddReminderMutation();
  const [updateReminder, { isLoading: updating }] = useUpdateReminderMutation();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const value = parseFloat(amount);
    if (!title.trim()) return setError("Give the bill a name.");
    if (!(value > 0)) return setError("Enter the bill amount.");
    if (reminderDate > dueDate) return setError("The reminder date should be on or before the due date.");
    const body = { title: title.trim(), category, amount: value, dueDate, reminderDate, frequency, notes: notes.trim() || undefined };
    try {
      if (reminder) await updateReminder({ id: reminder.id, patch: body }).unwrap();
      else await addReminder({ ...body, status: "pending" }).unwrap();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't save the reminder."));
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ModalField label="Bill name">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Electricity, Rent" className={inputCls} />
        </ModalField>
        <ModalField label="Amount (₹)">
          <input type="number" min="0.01" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
        </ModalField>
        <ModalField label="Category">
          <select value={category} onChange={(e) => setCategory(e.target.value as CategoryName)} className={inputCls}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_ICON[c]} {c}
              </option>
            ))}
          </select>
        </ModalField>
        <ModalField label="Repeats">
          <select value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)} className={inputCls}>
            {FREQUENCIES.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </ModalField>
        <ModalField label="Due date">
          <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
        </ModalField>
        <ModalField label="Remind me on">
          <input type="date" required value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} className={inputCls} />
        </ModalField>
      </div>
      <ModalField label="Notes (optional)">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={textareaCls} />
      </ModalField>
      {error && <p role="alert" className="rounded-[12px] border border-[color-mix(in_srgb,var(--bad)_30%,transparent)] bg-[color-mix(in_srgb,var(--bad)_8%,transparent)] px-3 py-2.5 text-[14px] font-semibold text-[var(--bad)]">{error}</p>}
      <ModalFooter onCancel={onClose} confirmLabel={reminder ? "Save changes" : "Add reminder"} isSubmitting={adding || updating} />
    </form>
  );
}
