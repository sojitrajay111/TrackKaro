"use client";

import { useState, type FormEvent } from "react";
import { ModalField, ModalFooter } from "@/components/ui/modal";
import { apiErrorMessage, inputCls, todayKey } from "@/lib/form";
import { CATEGORIES, addDays } from "@/lib/finance";
import { useAddSubscriptionMutation, useUpdateSubscriptionMutation } from "@/store/api/subscriptionsApi";
import type { BillingCycle, CategoryName, Subscription } from "@/store/types";

const ICONS = ["📺", "🎵", "☁️", "🎮", "📰", "💪", "🛒", "📱", "💼", "🔄"];

export function SubscriptionForm({
  sub,
  initialDate,
  onClose,
}: {
  sub?: Subscription;
  initialDate?: string;
  onClose: () => void;
}) {
  const [name, setName] = useState(sub?.name ?? "");
  const [icon, setIcon] = useState(sub?.icon ?? "📺");
  const [category, setCategory] = useState<CategoryName>(sub?.category ?? "Subscriptions");
  const [amount, setAmount] = useState(sub ? String(sub.amount) : "");
  const [cycle, setCycle] = useState<BillingCycle>(sub?.billingCycle ?? "Monthly");
  const [nextDate, setNextDate] = useState(sub?.nextBillingDate?.slice(0, 10) ?? initialDate ?? addDays(todayKey(), 30));
  const [error, setError] = useState<string | null>(null);
  const [add, { isLoading: adding }] = useAddSubscriptionMutation();
  const [update, { isLoading: updating }] = useUpdateSubscriptionMutation();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const value = parseFloat(amount);
    if (!name.trim()) return setError("Enter the service name.");
    if (!(value > 0)) return setError("Enter how much it costs.");
    const body = { name: name.trim(), icon, category, amount: value, billingCycle: cycle, nextBillingDate: nextDate };
    try {
      if (sub) await update({ id: sub.id, patch: body }).unwrap();
      else await add(body).unwrap();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't save the subscription."));
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <ModalField label="Icon">
        <div className="flex flex-wrap gap-2">
          {ICONS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIcon(i)}
              aria-pressed={icon === i}
              className={`h-10 w-10 rounded-[12px] border text-[18px] transition ${icon === i ? "border-[var(--primary)] bg-[var(--primary-soft)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_14%,transparent)]" : "border-border bg-surface hover:border-[var(--line-2)]"}`}
            >
              {i}
            </button>
          ))}
        </div>
      </ModalField>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ModalField label="Service">
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Netflix, Spotify" className={inputCls} />
        </ModalField>
        <ModalField label="Amount (₹)">
          <input type="number" min="0.01" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
        </ModalField>
        <ModalField label="Billed">
          <select value={cycle} onChange={(e) => setCycle(e.target.value as BillingCycle)} className={inputCls}>
            <option>Monthly</option>
            <option>Yearly</option>
          </select>
        </ModalField>
        <ModalField label="Next billing date">
          <input type="date" required value={nextDate} onChange={(e) => setNextDate(e.target.value)} className={inputCls} />
        </ModalField>
        <ModalField label="Category">
          <select value={category} onChange={(e) => setCategory(e.target.value as CategoryName)} className={inputCls}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </ModalField>
      </div>
      {error && <p role="alert" className="rounded-[12px] border border-[color-mix(in_srgb,var(--bad)_30%,transparent)] bg-[color-mix(in_srgb,var(--bad)_8%,transparent)] px-3 py-2.5 text-[14px] font-semibold text-[var(--bad)]">{error}</p>}
      <ModalFooter onCancel={onClose} confirmLabel={sub ? "Save changes" : "Add subscription"} isSubmitting={adding || updating} />
    </form>
  );
}
