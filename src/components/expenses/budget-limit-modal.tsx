"use client";

import { useState, type FormEvent } from "react";
import { Modal, ModalField, ModalFooter } from "@/components/ui/modal";
import { CategoryTile } from "@/components/ui/category-icon";
import { apiErrorMessage } from "@/lib/form";
import { CATEGORIES } from "@/lib/finance";
import { useSetBudgetMutation } from "@/store/api/budgetsApi";
import type { CategoryName } from "@/store/types";

/**
 * Set, change or remove a monthly category limit (PUT /budgets/:category).
 * With no `category`, it asks which category to budget (from `available`).
 */
export function BudgetLimitModal({
  isOpen,
  onClose,
  category,
  currentLimit,
  spent,
  available,
}: {
  isOpen: boolean;
  onClose: () => void;
  category?: CategoryName | null;
  currentLimit?: number;
  spent?: number;
  /** Categories that don't have a limit yet (used when adding a new budget). */
  available?: CategoryName[];
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? `${category} budget` : "New budget"}
      description="A monthly limit. You get alerts at 75% and 100% of it."
      maxWidth="md"
    >
      {isOpen && (
        <LimitForm
          key={`${category ?? "new"}-${currentLimit ?? 0}`}
          category={category ?? null}
          currentLimit={currentLimit ?? 0}
          spent={spent}
          available={available ?? CATEGORIES}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}

function LimitForm({
  category,
  currentLimit,
  spent,
  available,
  onClose,
}: {
  category: CategoryName | null;
  currentLimit: number;
  spent?: number;
  available: CategoryName[];
  onClose: () => void;
}) {
  const [cat, setCat] = useState<CategoryName>(category ?? available[0] ?? "Food");
  const [value, setValue] = useState(currentLimit > 0 ? String(currentLimit) : "");
  const [error, setError] = useState<string | null>(null);
  const [setBudget, { isLoading }] = useSetBudgetMutation();

  const save = async (limit: number) => {
    setError(null);
    try {
      await setBudget({ category: cat, limit }).unwrap();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't save the limit. Check your connection and try again."));
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(value);
    if (!(limit > 0)) {
      setError("Enter a limit above ₹0.");
      return;
    }
    void save(Math.round(limit * 100) / 100);
  };

  const quick = [1000, 2000, 5000, 10000];

  return (
    <form onSubmit={submit} className="space-y-4">
      {category ? (
        <div className="flex items-center gap-3 rounded-[16px] border border-border bg-[var(--surface-2)] p-3">
          <CategoryTile name={category} size={40} />
          <div className="min-w-0">
            <p className="font-extrabold text-foreground">{category}</p>
            <p className="text-[14px] text-foreground-muted">
              {spent !== undefined ? `₹${spent.toLocaleString("en-IN")} spent this month` : "Monthly limit"}
            </p>
          </div>
        </div>
      ) : (
        <ModalField label="Category">
          <select value={cat} onChange={(e) => setCat(e.target.value as CategoryName)}>
            {available.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </ModalField>
      )}

      <ModalField label="Monthly limit">
        <span className="relative block">
          <span className="pointer-events-none absolute inset-y-0 left-[13px] grid place-items-center font-extrabold text-foreground-muted">₹</span>
          <input
            type="number"
            min="1"
            step="any"
            inputMode="decimal"
            autoFocus
            required
            placeholder="e.g. 5000"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full !pl-[34px] text-[17px] font-[750]"
          />
        </span>
      </ModalField>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Quick amounts">
        {quick.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setValue(String(q))}
            aria-pressed={Number(value) === q}
            className={`inline-flex h-[34px] items-center rounded-full border px-[13px] text-[14px] font-bold transition ${
              Number(value) === q ? "border-transparent bg-foreground text-background" : "border-border bg-surface text-foreground hover:border-[var(--line-2)]"
            }`}
          >
            ₹{q.toLocaleString("en-IN")}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-[15px] font-[650] text-[var(--bad)]">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        {currentLimit > 0 ? (
          <button
            type="button"
            onClick={() => void save(0)}
            disabled={isLoading}
            className="inline-flex h-11 items-center rounded-[14px] px-3 text-[15px] font-bold text-[var(--bad)] hover:bg-[color-mix(in_srgb,var(--rose)_10%,transparent)] disabled:opacity-50"
          >
            Remove limit
          </button>
        ) : (
          <span />
        )}
        <ModalFooter onCancel={onClose} confirmLabel={currentLimit > 0 ? "Save limit" : "Set limit"} isSubmitting={isLoading} />
      </div>
    </form>
  );
}
