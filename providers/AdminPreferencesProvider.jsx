"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations } from "./../lib/i18n/translations";

const AdminPreferencesContext = createContext(null);

const THEME_KEY = "admin:theme";
const LANG_KEY = "admin:lang";

// Languages that should flip the whole layout to right-to-left.
// Add/remove codes here as you add languages to `translations`.
const RTL_LANGUAGES = ["fa", "ps", "ar", "ur"];

export function AdminPreferencesProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [lang, setLang] = useState("en");
  const [ready, setReady] = useState(false);

  // Load persisted preferences on mount (client-only — avoids SSR mismatch).
  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_KEY);
    const storedLang = window.localStorage.getItem(LANG_KEY);
    const systemDark = window.matchMedia?.(
      "(prefers-color-scheme: dark)",
    ).matches;

    const initialTheme = storedTheme || (systemDark ? "dark" : "light");
    const initialLang =
      storedLang || (navigator.language?.startsWith("lt") ? "lt" : "en");

    setTheme(initialTheme);
    setLang(initialLang);
    setReady(true);
  }, []);

  // Keep the <html> class in sync so Tailwind's `dark:` variants apply.
  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme, ready]);

  // Keep <html lang> and <html dir> in sync so the layout actually flips
  // for right-to-left languages (Dari, Pashto, etc), not just the text.
  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGUAGES.includes(lang) ? "rtl" : "ltr";
    window.localStorage.setItem(LANG_KEY, lang);
  }, [lang, ready]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      lang,
      setLang,
      t: translations[lang] || translations.en,
      availableLanguages: Object.keys(translations),
      isRtl: RTL_LANGUAGES.includes(lang),
      ready,
    }),
    [theme, lang, ready],
  );

  return (
    <AdminPreferencesContext.Provider value={value}>
      {children}
    </AdminPreferencesContext.Provider>
  );
}

export function useAdminPreferences() {
  const ctx = useContext(AdminPreferencesContext);
  if (!ctx)
    throw new Error(
      "useAdminPreferences must be used within AdminPreferencesProvider",
    );
  return ctx;
}
