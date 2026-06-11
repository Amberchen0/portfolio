"use client";

/**
 * useLang — single shared EN/中 toggle for the whole site.
 *
 * Previously each page held its own `useState<Lang>` and rendered its
 * own EN/中 nav. After Amber asked for the toggle to live inside the
 * shared TopNav glass capsule, the state had to be promoted so the
 * one pill button could drive lang on / and /about simultaneously.
 *
 * Implementation: localStorage as the persistent store + a custom
 * window event so every mounted consumer re-renders the instant the
 * value changes. No Context wrapper, no Provider — works even from
 * Server Components' child Client Components without restructuring
 * the layout tree.
 *
 * Default is "en" (matches the home page's previous default). Pages
 * that prefer a different opening language can override on first
 * visit by calling `setLang("zh")` from their own first-mount effect.
 */
import { useEffect, useState } from "react";

export type Lang = "en" | "zh";

const STORAGE_KEY = "amber-lang";
const EVENT_NAME = "amber-lang-change";

function readStoredLang(): Lang {
  if (typeof window === "undefined") return "en";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "zh" ? "zh" : "en";
}

/** Write the new language to storage and broadcast to every consumer. */
export function setLang(lang: Lang) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, lang);
  window.dispatchEvent(new CustomEvent<Lang>(EVENT_NAME, { detail: lang }));
}

/** Read the current language; updates automatically when any other
 *  consumer calls setLang(). Initial render returns "en" so SSR + first
 *  client paint stay stable; the post-hydration effect then reads
 *  localStorage and re-renders if it differs. */
export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    setLangState(readStoredLang());
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<Lang>).detail;
      if (detail === "en" || detail === "zh") setLangState(detail);
    };
    window.addEventListener(EVENT_NAME, handler);
    // Also reflect changes from other tabs / windows.
    const storage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === "en" || e.newValue === "zh")) {
        setLangState(e.newValue);
      }
    };
    window.addEventListener("storage", storage);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener("storage", storage);
    };
  }, []);

  return [lang, setLang];
}
