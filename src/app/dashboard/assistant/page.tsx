"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAppSelector } from "@/store";
import { useI18n } from "@/i18n";
import { DICTATION_LANG, useDictation } from "@/lib/use-dictation";
import { useSendAssistantMessageMutation } from "@/store/api/assistantApi";
import type { ChatMessage } from "@/store/types";

/** Same prompts as the app's "Try asking" cards. */
const PROMPTS = [
  "Can I afford a ₹20,000 phone this month?",
  "Show my spending this month",
  "How much money can I safely spend this month?",
  "Remind me to pay electricity bill",
  "How can I save more money?",
];

const GREETING =
  '👋 Hi! I am TrackKaro AI, your personal finance and budget assistant. Ask me anything like "How much did I spend on food this month?" or "Can I afford a ₹20,000 phone?".';

const timeNow = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** AI Assistant (the app's assistant sheet): chat about your own money via POST /assistant/messages. */
export default function AssistantPage() {
  const user = useAppSelector((s) => s.auth.user);
  const { lang } = useI18n();
  const [send, { isLoading }] = useSendAssistantMessageMutation();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: "init", sender: "ai", text: GREETING, timestamp: "" }]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  const ask = async (raw: string) => {
    const text = raw.trim();
    if (!text || isLoading) return;
    setError(null);
    setInput("");
    setMessages((m) => [...m, { id: `u-${m.length}`, sender: "user", text, timestamp: timeNow() }]);
    try {
      const reply = await send(text).unwrap();
      setMessages((m) => [...m, { ...reply, id: reply.id || `a-${m.length}`, timestamp: timeNow() }]);
    } catch {
      setError("The assistant didn't respond. Check your connection and try again.");
    }
  };

  // Speak a question: words fill the box as you talk; it's sent when you stop.
  const dictation = useDictation((text, final) => {
    setInput(text);
    if (final && text) void ask(text);
  }, DICTATION_LANG[lang] ?? "en-IN");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void ask(input);
  };

  const first = user?.name?.trim().split(" ")[0];
  const started = messages.length > 1;

  return (
    <div className="flex flex-col gap-5 pb-6">
      <header>
        <p className="text-[14px] font-semibold text-foreground-muted">Studio · Assistant</p>
        <h1 className="mt-0.5 text-[clamp(1.875rem,2.5vw,2.375rem)] font-extrabold leading-[1.08] tracking-[-0.04em] text-foreground">
          {first ? `Hi ${first}, ask TrackKaro AI` : "Ask TrackKaro AI"}
        </h1>
        <p className="mt-1.5 text-[16px] font-medium text-foreground-muted">Questions about your spending, budgets, bills and purchases, answered from your own data.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Chat */}
        <section className="flex min-h-[60vh] flex-col overflow-hidden rounded-[22px] border border-border bg-surface shadow-xs">
          <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5" aria-live="polite">
            {messages.map((m) => (
              <div key={m.id} className={`tk-pop flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-[18px] px-4 py-2.5 text-[15px] leading-relaxed ${
                    m.sender === "user"
                      ? "rounded-br-[6px] bg-[var(--primary)] text-[var(--on-primary)]"
                      : "rounded-bl-[6px] border border-border bg-[var(--surface-2)] text-foreground"
                  }`}
                >
                  {m.text}
                  {m.timestamp && <span className="mt-1 block text-right text-[12px] font-semibold opacity-70">{m.timestamp}</span>}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-[18px] rounded-bl-[6px] border border-border bg-[var(--surface-2)] px-4 py-3" aria-label="TrackKaro AI is thinking">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-[var(--primary)]" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            {!started && (
              <div className="flex flex-wrap gap-2 pt-2">
                {PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => void ask(p)}
                    className="inline-flex min-h-[34px] items-center rounded-full border border-border bg-surface px-3.5 py-1.5 text-left text-[14px] font-semibold text-foreground transition hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-border bg-[var(--raised)] p-3">
            {dictation.supported && (
              <button
                type="button"
                onClick={dictation.listening ? dictation.stop : dictation.start}
                aria-pressed={dictation.listening}
                aria-label={dictation.listening ? "Stop listening" : "Speak your question"}
                title={dictation.listening ? "Stop listening" : "Speak your question"}
                className={`inline-grid h-11 w-11 shrink-0 place-items-center rounded-[14px] border transition ${
                  dictation.listening ? "animate-pulse border-transparent bg-[var(--bad)] text-white" : "border-border bg-surface text-foreground hover:bg-surface-muted"
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
                </svg>
              </button>
            )}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={dictation.listening ? "Listening…" : "Ask about your money…"}
              className="h-11 min-w-0 flex-1 rounded-[14px] border border-border bg-surface px-3.5 text-[15px] text-foreground outline-none transition placeholder:text-foreground-muted focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_16%,transparent)]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[14px] bg-[var(--primary)] px-4 text-[16px] font-bold text-[var(--on-primary)] transition hover:bg-[var(--primary-strong)] disabled:opacity-50"
            >
              Send
            </button>
          </form>
          {(error || dictation.error) && <p className="px-4 pb-3 text-[14px] font-semibold text-[var(--bad)]">{error || dictation.error}</p>}
        </section>

        {/* Side panel */}
        <aside className="grid content-start gap-4">
          {started && (
            <section className="rounded-[22px] border border-border bg-surface p-5 shadow-xs">
              <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-foreground">Try asking</h2>
              <div className="mt-3 grid gap-2">
                {PROMPTS.map((p) => (
                  <button key={p} type="button" onClick={() => void ask(p)} className="rounded-[12px] border border-border px-3 py-2 text-left text-[14px] font-semibold text-foreground transition hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]">
                    {p}
                  </button>
                ))}
              </div>
            </section>
          )}
          <section className="rounded-[22px] border border-border bg-surface p-5 shadow-xs">
            <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-foreground">How it works</h2>
            <ol className="mt-3 grid gap-3 text-[14px] text-foreground-muted">
              {[
                ["Ask in plain words", "Type or speak a question, in English, Hindi or Gujarati."],
                ["It reads your own data", "Your transactions, budgets, bills and khata, nothing else."],
                ["You get a straight answer", "With the numbers behind it, so you can decide."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--primary-soft)] text-[13px] font-extrabold text-foreground">{i + 1}</span>
                  <span>
                    <b className="block font-bold text-foreground">{t}</b>
                    {d}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
