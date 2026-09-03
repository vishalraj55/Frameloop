"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  ReactNode,
} from "react";

export type Theme = "dark" | "light" | "system";
export type FontSize = "sm" | "md" | "lg";

interface ThemeContextValue {
  theme: Theme;
  fontSize: FontSize;
  language: string;
  resolvedTheme: "dark" | "light";
  setTheme: (t: Theme) => void;
  setFontSize: (f: FontSize) => void;
  setLanguage: (l: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/* --- color tokens consumed by components --- */

export const THEME_COLORS = {
  dark: {
    bg: "#000000",
    card: "#1e1e1e",
    cardMuted: "#181818",
    cardFaint: "#141414",
    border: "#262626",
    text: "#f0f0f0",
    textMuted: "#555555",
    textFaint: "#444444",
  },
  light: {
    bg: "#ffffff",
    card: "#ececec",
    cardMuted: "#f2f2f2",
    cardFaint: "#f6f6f6",
    border: "#d9d9d9",
    text: "#0a0a0a",
    textMuted: "#767676",
    textFaint: "#8a8a8a",
  },
} as const;

/* --- localStorage as an external store --- */

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

function notify(key: string) {
  listeners.get(key)?.forEach((l) => l());
}

function subscribe(key: string, onChange: Listener) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === key) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.get(key)!.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function readStorage<T extends string>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  return (localStorage.getItem(key) as T | null) ?? fallback;
}

function writeStorage(key: string, value: string) {
  localStorage.setItem(key, value);
  notify(key);
}

function useStoredValue<T extends string>(key: string, fallback: T) {
  const value = useSyncExternalStore(
    (onChange) => subscribe(key, onChange),
    () => readStorage(key, fallback),
    () => fallback,
  );
  const setValue = useCallback((v: T) => writeStorage(key, v), [key]);
  return [value, setValue] as const;
}

function subscribeSystemTheme(onChange: Listener) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function readSystemTheme(): "dark" | "light" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function useSystemTheme() {
  return useSyncExternalStore(
    subscribeSystemTheme,
    readSystemTheme,
    () => "dark" as const,
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useStoredValue<Theme>("theme", "dark");
  const [fontSize, setFontSize] = useStoredValue<FontSize>("fontSize", "md");
  const [language, setLanguage] = useStoredValue<string>("language", "English");
  const systemTheme = useSystemTheme();

  const resolvedTheme = useMemo(
    () => (theme === "system" ? systemTheme : theme),
    [theme, systemTheme],
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.classList.toggle("light", resolvedTheme === "light");
    root.setAttribute("data-font-size", fontSize);
    root.setAttribute("lang", language);

    const c = THEME_COLORS[resolvedTheme];
    Object.entries(c).forEach(([key, val]) => {
      root.style.setProperty(`--${key}`, val);
    });
  }, [resolvedTheme, fontSize, language]);

  const value = useMemo(
    () => ({
      theme,
      fontSize,
      language,
      resolvedTheme,
      setTheme,
      setFontSize,
      setLanguage,
    }),
    [
      theme,
      fontSize,
      language,
      resolvedTheme,
      setTheme,
      setFontSize,
      setLanguage,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
