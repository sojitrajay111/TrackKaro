"use client";

import { useRef, useState } from "react";
import { Modal, ModalField, ModalFooter, ModalSegmentedPicker } from "@/components/ui/modal";
import { CategoryTile } from "@/components/ui/category-icon";
import { inputCls, todayKey } from "@/lib/form";
import { useAddTransactionMutation } from "@/store/api/transactionsApi";
import { useScanBillMutation, useSmartParseVoiceMutation } from "@/store/api/assistantApi";
import { useI18n } from "@/i18n";
import { imageFileToBase64 } from "@/lib/image";
import { enqueueTransaction, isNetworkError } from "@/lib/offline-queue";
import { DICTATION_LANG, useDictation } from "@/lib/use-dictation";
import type { CategoryName, PaymentMethod, TransactionType } from "@/store/types";

interface RecordExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
}

const CATEGORIES: CategoryName[] = [
  "Food",
  "Groceries",
  "Shopping",
  "Travel",
  "Fuel",
  "Bills",
  "Rent",
  "EMI",
  "Subscriptions",
  "Entertainment",
  "Health",
  "Education",
  "Other",
];

const PAYMENT_METHODS: PaymentMethod[] = ["UPI", "Debit Card", "Credit Card", "Net Banking", "Cash"];

/** Selectable chip (category / payment method), Kesta 34px chip with an emerald selected ring. */
const chipCls = (on: boolean) =>
  `inline-flex h-[38px] shrink-0 items-center gap-2 rounded-[12px] border px-2.5 text-[14px] font-bold transition select-none ${
    on
      ? "border-[var(--primary)] bg-[var(--primary-soft)] text-foreground shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_14%,transparent)]"
      : "border-border bg-surface text-foreground-muted hover:border-[var(--line-2)] hover:text-foreground"
  }`;

export function RecordExpenseModal({ isOpen, onClose, defaultType = "expense" }: RecordExpenseModalProps) {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [title, setTitle] = useState("");
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryName>("Food");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [date, setDate] = useState(() => todayKey());
  const [error, setError] = useState<string | null>(null);

  const [addTransaction, { isLoading }] = useAddTransactionMutation();

  // AI fill: describe it (typed or spoken) or scan a bill; fields are filled for review, not saved.
  const { lang } = useI18n();
  const [describe, setDescribe] = useState("");
  const [aiNote, setAiNote] = useState<{ tone: "good" | "bad"; text: string } | null>(null);
  const [smartParse, { isLoading: parsing }] = useSmartParseVoiceMutation();
  const [scanBill, { isLoading: scanning }] = useScanBillMutation();
  const fileRef = useRef<HTMLInputElement>(null);
  const asCategory = (c?: string): CategoryName | null => CATEGORIES.find((x) => x.toLowerCase() === (c || "").toLowerCase()) ?? null;
  const asDate = (d?: string) => (d && /^\d{4}-\d{2}-\d{2}/.test(d) ? d.slice(0, 10) : null);

  const runParse = async (text: string) => {
    const t = text.trim();
    if (!t) return;
    setAiNote(null);
    try {
      const r = await smartParse({ text: t, mode: "expense", autoSave: false }).unwrap();
      if (r.type === "gave" || r.type === "took") {
        setAiNote({ tone: "bad", text: "That sounds like money lent or borrowed. Record it in Khata instead." });
        return;
      }
      if (r.type === "income" || r.type === "expense") setType(r.type);
      if (r.amount > 0) setAmount(String(r.amount));
      if (r.title) setTitle(r.title);
      const c = asCategory(r.category);
      if (c) setCategory(c);
      const d = asDate(r.date);
      if (d) setDate(d);
      setAiNote({ tone: "good", text: "Filled in from your description. Check it and save." });
    } catch {
      setAiNote({ tone: "bad", text: "Couldn't understand that. Try e.g. “Spent 450 at DMart via UPI”." });
    }
  };

  const dictation = useDictation((text, final) => {
    setDescribe(text);
    if (final && text) void runParse(text);
  }, DICTATION_LANG[lang] ?? "en-IN");

  const onScanFile = async (file?: File) => {
    if (!file) return;
    setAiNote(null);
    try {
      const img = await imageFileToBase64(file);
      const r = await scanBill({ imageBase64: img.base64, mimeType: img.mimeType }).unwrap();
      setType("expense");
      if (r.amount > 0) setAmount(String(r.amount));
      if (r.merchant) {
        setTitle(r.merchant);
        setMerchant(r.merchant);
      }
      const c = asCategory(r.category);
      if (c) setCategory(c);
      const d = asDate(r.date);
      if (d) setDate(d);
      setAiNote({ tone: "good", text: "Read from your bill. Check the amount and save." });
    } catch (err) {
      setAiNote({ tone: "bad", text: err instanceof Error && err.message ? err.message : "Couldn't read that bill. Try a clearer photo." });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!title.trim()) {
      setError("Please enter a description");
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    const body = {
      title: title.trim(),
      merchant: merchant.trim() || title.trim(),
      amount: numAmount,
      type,
      category,
      paymentMethod,
      date,
    };
    try {
      setError(null);
      await addTransaction(body).unwrap();

      // Reset and close
      setTitle("");
      setMerchant("");
      setAmount("");
      onClose();
    } catch (err: unknown) {
      // No connection: keep it and sync when back online (the offline banner shows progress).
      if (isNetworkError(err)) {
        enqueueTransaction(body);
        setTitle("");
        setMerchant("");
        setAmount("");
        onClose();
        return;
      }
      const e = err as { data?: { message?: string } };
      setError(e?.data?.message || "Failed to save transaction");
    }
  };

  const isExpense = type === "expense";
  const tone = isExpense ? "var(--coral)" : "var(--pine)";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isExpense ? "Record an expense" : "Record income"}
      description={isExpense ? "A payment out of your accounts. Automatically tracks your budget." : "Money coming into your operating or savings balance."}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* AI fill */}
        <div className="rounded-[16px] border border-dashed border-[var(--line-2)] bg-[var(--surface-2)] p-2.5">
          <div className="flex gap-2">
            <input
              value={describe}
              onChange={(e) => setDescribe(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void runParse(describe);
                }
              }}
              placeholder={dictation.listening ? "Listening…" : "Describe it — “Spent 450 at DMart via UPI”"}
              aria-label="Describe the transaction"
              className="tk-compact min-w-0 flex-1 !min-h-[40px] !h-10 !text-[14px]"
            />
            {dictation.supported && (
              <button
                type="button"
                onClick={dictation.listening ? dictation.stop : dictation.start}
                aria-label={dictation.listening ? "Stop listening" : "Speak it"}
                title={dictation.listening ? "Stop listening" : "Speak it"}
                className={`inline-grid h-10 w-10 shrink-0 place-items-center rounded-[12px] border transition ${
                  dictation.listening ? "animate-pulse border-transparent bg-[var(--bad)] text-white" : "border-border bg-surface text-foreground hover:bg-surface-muted"
                }`}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={() => void runParse(describe)}
              disabled={!describe.trim() || parsing}
              className="inline-flex h-10 shrink-0 items-center rounded-[12px] bg-[var(--primary)] px-3 text-[14px] font-bold text-[var(--on-primary)] transition hover:bg-[var(--primary-strong)] disabled:opacity-50"
            >
              {parsing ? "Reading…" : "Fill"}
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={scanning}
              className="inline-flex h-8 items-center gap-1.5 rounded-[10px] px-2 text-[14px] font-bold text-[var(--primary)] transition hover:bg-[var(--primary-soft)] disabled:opacity-50"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16M8 12h8" />
              </svg>
              {scanning ? "Reading bill…" : "Scan a bill"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => void onScanFile(e.target.files?.[0])} />
            {(aiNote || dictation.error) && (
              <span className={`text-[13px] font-semibold ${aiNote?.tone === "good" && !dictation.error ? "text-[var(--good)]" : "text-[var(--bad)]"}`}>
                {dictation.error || aiNote?.text}
              </span>
            )}
          </div>
        </div>

        <ModalSegmentedPicker
          options={[
            { value: "expense" as const, label: "Expense · money out" },
            { value: "income" as const, label: "Income · money in" },
          ]}
          selected={type}
          onChange={setType}
        />

        {/* Amount: the main figure, large and tinted by direction */}
        <div
          className="rounded-[18px] border px-4 py-3.5 transition-colors"
          style={{
            borderColor: `color-mix(in srgb, ${tone} 28%, var(--line))`,
            background: `color-mix(in srgb, ${tone} 7%, var(--surface))`,
          }}
        >
          <label htmlFor="rx-amount" className="block text-[14px] font-bold text-foreground-muted">
            Amount
          </label>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="shrink-0 whitespace-nowrap text-[30px] font-extrabold leading-none" style={{ color: tone }} aria-hidden="true">
              {isExpense ? "−₹" : "+₹"}
            </span>
            <input
              id="rx-amount"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              autoFocus
              className="tk-compact tk-bare w-full min-w-0 border-0 bg-transparent p-0 text-[34px] font-extrabold leading-none tracking-[-0.03em] text-foreground num outline-none placeholder:text-[var(--line-2)] focus:ring-0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <ModalField label="Description">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Coffee, Grocery run, Rent"
              className={inputCls}
            />
          </ModalField>
          <ModalField label={isExpense ? "Paid to" : "Received from"}>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder={isExpense ? "e.g. Swiggy, Amazon" : "e.g. Employer, Client"}
              className={inputCls}
            />
          </ModalField>
        </div>

        <ModalField label="Category">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Category">
            {CATEGORIES.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={category === c} onClick={() => setCategory(c)} className={chipCls(category === c)}>
                <CategoryTile name={c} size={24} />
                {c}
              </button>
            ))}
          </div>
        </ModalField>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[minmax(0,1fr)_170px]">
          <ModalField label={isExpense ? "Paid with" : "Received via"}>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Payment method">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm}
                  type="button"
                  role="radio"
                  aria-checked={paymentMethod === pm}
                  onClick={() => setPaymentMethod(pm)}
                  className={`${chipCls(paymentMethod === pm)} px-3`}
                >
                  {pm}
                </button>
              ))}
            </div>
          </ModalField>
          <ModalField label="Date">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputCls} num`} />
          </ModalField>
        </div>

        {error && (
          <p role="alert" className="rounded-[12px] border border-[color-mix(in_srgb,var(--bad)_30%,transparent)] bg-[color-mix(in_srgb,var(--bad)_8%,transparent)] px-3 py-2.5 text-[14px] font-semibold text-[var(--bad)]">
            {error}
          </p>
        )}

        <ModalFooter
          onCancel={onClose}
          isSubmitting={isLoading}
          confirmLabel={isLoading ? "Saving…" : isExpense ? "Record expense" : "Record income"}
        />
      </form>
    </Modal>
  );
}
