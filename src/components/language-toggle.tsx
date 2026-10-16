"use client";

import { useI18n } from "@/i18n";
import type { Lang } from "@/i18n/translations";

const LANGUAGES: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "EN", native: "English" },
  { code: "hi", label: "HI", native: "हिंदी" },
  { code: "gu", label: "GU", native: "ગુજરાતી" },
];

export function LanguageToggle() {
  const { lang, setLang } = useI18n();

  return (
    <div className="inline-flex items-center rounded-full border border-border bg-surface p-1 shadow-sm">
      {LANGUAGES.map((l) => {
        const isActive = lang === l.code;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l.code)}
            title={l.native}
            className={`rounded-full px-2.5 py-1 text-xs font-bold transition-all duration-150 ${
              isActive
                ? "bg-primary text-white shadow-xs"
                : "text-foreground-sub hover:text-foreground hover:bg-surface-muted"
            }`}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
