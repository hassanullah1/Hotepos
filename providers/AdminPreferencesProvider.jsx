"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations } from "./../lib/i18n/translations";

const AdminPreferencesContext = createContext(null);

const THEME_KEY = "admin:theme";
const LANG_KEY = "admin:lang";

const RTL_LANGUAGES = ["fa", "ps", "ar", "ur"];

export function AdminPreferencesProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [lang, setLang] = useState("en");
  const [ready, setReady] = useState(false);

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

  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme, ready]);

  useEffect(() => {
    if (!ready) return;
    const isRtlLang = RTL_LANGUAGES.includes(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtlLang ? "rtl" : "ltr";
    // Apply the Nazanin font globally whenever the language is RTL
    document.documentElement.classList.toggle("font-rtl", isRtlLang);
    window.localStorage.setItem(LANG_KEY, lang);
  }, [lang, ready]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const isRtl = RTL_LANGUAGES.includes(lang);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      lang,
      setLang,
      t: translations[lang] || translations.en,
      availableLanguages: Object.keys(translations),
      isRtl,
      dir: isRtl ? "rtl" : "ltr",
      ready,
    }),
    [theme, lang, ready, isRtl],
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
