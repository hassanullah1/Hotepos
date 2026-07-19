"use client";

import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

export default function AdminTopbar() {
  const { t, theme, toggleTheme, lang, setLang, availableLanguages } =
    useAdminPreferences();

  return (
    <header className="flex items-center justify-end border-b border-slate-200 bg-white px-6 py-3 dark:border-white/10 dark:bg-[#0F1E30]">
      <div className="flex items-center gap-3">
        <select
          aria-label={t.common.language}
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 dark:border-white/10 dark:bg-[#152A42] dark:text-slate-200"
        >
          {availableLanguages.map((code) => (
            <option key={code} value={code}>
              {code.toUpperCase()}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={t.common.darkMode}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
        >
          {theme === "dark" ? "🌙" : "☀️"}
        </button>
      </div>
    </header>
  );
}
