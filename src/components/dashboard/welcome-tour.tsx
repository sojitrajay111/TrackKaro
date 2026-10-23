"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Modal } from "@/components/ui/modal";
import { Illustration, type SceneName } from "@/components/ui/illustration";

/**
 * First-run welcome tour (the app's onboarding + guided tour, on the web). Shows once per
 * browser after sign-in; Settings → "Replay the welcome tour" opens it again.
 */
const SEEN_KEY = "tk.tour-seen";

const STEPS = [
  {
    title: "Welcome to TrackKaro",
    body: "Your spending, ledgers, shared bills and savings in one place — the same account as the phone app, always in sync.",
    scene: "person-launching-rocket" as SceneName,
  },
  {
    title: "Add anything with + New",
    body: "Expenses, money in, bills, subscriptions, tasks, khata entries and groups. Press E, I, B, S, T, K or G once the menu is open — or just describe it, speak it, or scan a bill.",
    scene: "person-adding-basket" as SceneName,
  },
  {
    title: "Find it with ⌘K",
    body: "Search transactions, bills, people, groups and products from the box at the top. Ctrl+K works on Windows.",
    scene: "person-finding-shortcut" as SceneName,
  },
  {
    title: "Money you lend and split",
    body: "Khata keeps track of who owes whom, with WhatsApp reminders and statements. Split Groups handles trips and flatmates, down to settling up.",
    scene: "buddy-pair" as SceneName,
  },
  {
    title: "Spend smarter",
    body: "Budgets warn you before you overspend, Deals checks if a purchase fits your budget, and the AI Assistant answers questions about your money.",
    scene: "person-raising-trophy" as SceneName,
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
        <span className="grid h-[150px] w-full place-items-center rounded-[20px] bg-[var(--primary-soft)]">
          <Illustration name={s.scene} height={124} />
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
