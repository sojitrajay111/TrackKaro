"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Speech-to-text with the browser's built-in recognition (Chrome, Edge, Safari). Used for
 * voice logging and asking the assistant — the web stand-in for the app's voice input.
 * `lang` follows the app languages: en-IN, hi-IN, gu-IN.
 */

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const DICTATION_LANG: Record<string, string> = { en: "en-IN", hi: "hi-IN", gu: "gu-IN" };

export function useDictation(onText: (text: string, final: boolean) => void, lang = "en-IN") {
  const supported = useSyncExternalStore(
    () => () => {},
    () => getCtor() !== null,
    () => false
  );
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);
  const cb = useRef(onText);
  useEffect(() => {
    cb.current = onText;
  }, [onText]);

  const stop = useCallback(() => rec.current?.stop(), []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) {
      setError("Voice input isn't supported in this browser. Try Chrome or Edge.");
      return;
    }
    rec.current?.abort();
    const r = new Ctor();
    r.lang = lang;
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e) => {
      let text = "";
      let final = false;
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
        if (e.results[i].isFinal) final = true;
      }
      cb.current(text.trim(), final);
    };
    r.onerror = (e) => {
      setError(e.error === "not-allowed" ? "Allow microphone access to use voice." : e.error === "no-speech" ? "Didn't catch that. Try again." : "Voice input stopped.");
      setListening(false);
    };
    r.onend = () => setListening(false);
    rec.current = r;
    setError(null);
    setListening(true);
    r.start();
  }, [lang]);

  useEffect(() => () => rec.current?.abort(), []);

  return { supported, listening, error, start, stop };
}
