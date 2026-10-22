"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";

export type Theme = "light" | "dark" | "system";

export interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme, origin?: Element | null) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
});

const STORAGE_KEY = "theme";

const subscribeMedia = (callback: () => void) => {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
};

const getSystemSnapshot = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const getServerSnapshot = (): "light" | "dark" => "light";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const val = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (val === "dark" || val === "light" || val === "system") {
      return val;
    }
  } catch {}
  return "system";
}

export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = STORAGE_KEY,
  attribute = "data-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme() || defaultTheme);
  const systemTheme = useSyncExternalStore(subscribeMedia, getSystemSnapshot, getServerSnapshot);

  const resolvedTheme: "light" | "dark" = theme === "system" ? systemTheme : theme;

  /**
   * Switch theme. When the resolved theme actually changes, the new theme is revealed as a
   * circle growing from the control that was clicked (Kesta: View Transitions, 640ms).
   * `origin` defaults to the focused element — the button just pressed.
   */
  const setTheme = useCallback(
    (newTheme: Theme, origin?: Element | null) => {
      const next: "light" | "dark" = newTheme === "system" ? getSystemSnapshot() : newTheme;
      const current = document.documentElement.getAttribute(attribute);
      const apply = () => {
        flushSync(() => setThemeState(newTheme));
        // Set the attribute synchronously so the transition's "after" snapshot has the new colours.
        document.documentElement.setAttribute(attribute, next);
        try {
          localStorage.setItem(storageKey, newTheme);
        } catch {}
      };

      const source = origin ?? (document.activeElement !== document.body ? document.activeElement : null);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!source || next === current || !document.startViewTransition || reduce) {
        apply();
        return;
      }

      const r = source.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      document
        .startViewTransition(apply)
        .ready.then(() => {
          document.documentElement.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
            { duration: 640, easing: "cubic-bezier(0.65, 0, 0.35, 1)", pseudoElement: "::view-transition-new(root)" }
          );
        })
        .catch(() => {});
    },
    [attribute, storageKey]
  );

  // Synchronize the DOM data-theme attribute with resolvedTheme
  useEffect(() => {
    document.documentElement.setAttribute(attribute, resolvedTheme);
  }, [attribute, resolvedTheme]);

  // Synchronize across multiple browser tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        const val = e.newValue as Theme;
        if (val === "dark" || val === "light" || val === "system") {
          setThemeState(val);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [storageKey]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [theme, resolvedTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
