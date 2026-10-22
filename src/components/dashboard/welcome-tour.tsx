"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { Modal } from "@/components/ui/modal";

/**
 * First-run welcome tour (the app's onboarding + guided tour, on the web). Shows once per
 * browser after sign-in; Settings → "Replay the welcome tour" opens it again.
 */
const SEEN_KEY = "tk.tour-seen";

const STEPS = [
  {
    title: "Welcome to TrackKaro",
    body: "Your spending, ledgers, shared bills and savings in one place — the same account as the phone app, always in sync.",
    icon: "logo",
  },
  {
    title: "Add anything with + New",
    body: "Expenses, money in, bills, subscriptions, tasks, khata entries and groups. Press E, I, B, S, T, K or G once the menu is open — or just describe it, speak it, or scan a bill.",
    icon: "M12 5v14M5 12h14",
  },
  {
    title: "Find it with ⌘K",
    body: "Search transactions, bills, people, groups and products from the box at the top. Ctrl+K works on Windows.",
    icon: "M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM16 16l4 4",
  },
  {
    title: "Money you lend and split",
    body: "Khata keeps track of who owes whom, with WhatsApp reminders and statements. Split Groups handles trips and flatmates, down to settling up.",
    icon: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20a6 6 0 0 1 12 0M16 4.5a3.5 3.5 0 0 1 0 6.5M21 20a6 6 0 0 0-4-5.6",
  },
  {
    title: "Spend smarter",
    body: "Budgets warn you before you overspend, Deals checks if a purchase fits your budget, and the AI Assistant answers questions about your money.",
    icon: "M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z",
  },
];

function readSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true; // storage blocked: don't nag every visit
  }
}

export function WelcomeTour() {
  const seen = useSyncExternalStore(
    () => () => {},
    readSeen,
    () => true
  );
  const [dismissed, setDismissed] = useState(false);
  const [replay, setReplay] = useState(false);
  const [step, setStep] = useState(0);
  const open = replay || (!seen && !dismissed);

  useEffect(() => {
    const onReplay = () => {
      setStep(0);
      setReplay(true);
    };
    window.addEventListener("tk:replay-tour", onReplay);
    return () => window.removeEventListener("tk:replay-tour", onReplay);
  }, []);

  const close = () => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // ignore
    }
    setDismissed(true);
    setReplay(false);
  };

  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <Modal isOpen={open} onClose={close} title={s.title} maxWidth="md">
      <div key={step} className="tk-pop grid justify-items-center gap-4 text-center">
        <span className="grid h-20 w-20 place-items-center overflow-hidden rounded-[22px] bg-[var(--primary-soft)] text-[var(--primary)]">
          {s.icon === "logo" ? (
            <Image src="/logo.png" alt="" width={80} height={80} className="h-full w-full scale-[1.16] object-contain" />
          ) : (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={s.icon} />
            </svg>
          )}
        </span>
        <p className="text-[16px] leading-relaxed text-foreground-muted">{s.body}</p>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="flex gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((_, i) => (
            <span key={i} className={`h-2 rounded-full transition-all ${i === step ? "w-6 bg-[var(--primary)]" : "w-2 bg-[var(--line-2)]"}`} />
          ))}
        </div>
        <div className="flex gap-2">
          {step > 0 ? (
            <button type="button" onClick={() => setStep(step - 1)} className="inline-flex h-11 items-center rounded-[14px] border border-border bg-surface px-4 text-[16px] font-bold text-foreground hover:bg-surface-muted">
              Back
            </button>
          ) : (
            <button type="button" onClick={close} className="inline-flex h-11 items-center rounded-[14px] px-3 text-[16px] font-bold text-foreground-muted hover:text-foreground">
              Skip
            </button>
          )}
          <button
            type="button"
            onClick={() => (last ? close() : setStep(step + 1))}
            className="inline-flex h-11 items-center rounded-[14px] bg-[var(--primary)] px-[18px] text-[16px] font-bold text-[var(--on-primary)] shadow-xs transition hover:bg-[var(--primary-strong)]"
          >
            {last ? "Get started" : "Next"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
