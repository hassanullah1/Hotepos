"use client";

import { usePathname } from "next/navigation";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";
import { Sun, Moon, Globe } from "lucide-react";

export default function AdminTopbar() {
  const pathname = usePathname();
  const { t, theme, toggleTheme, lang, setLang, availableLanguages } =
    useAdminPreferences();

  const pageTitle =
    pathname === "/admin"
      ? (t.nav?.dashboard ?? "Dashboard")
      : (pathname?.split("/").filter(Boolean).pop() ?? "").replace(/-/g, " ");

  return (
    <header
      className={[
        "sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3",
        "border-b border-slate-200/80 bg-white/80 py-3.5 backdrop-blur-md",
        "dark:border-white/10 dark:bg-[#0F1E30]/80",
        "ps-16 pe-4 lg:ps-6 lg:pe-6",
      ].join(" ")}
    >
      <h1 className="truncate text-[15px] font-semibold capitalize text-slate-800 dark:text-white">
        {pageTitle}
      </h1>

      <div className="flex shrink-0 items-center gap-2">
        <div className="relative">
          <Globe
            className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-400"
            aria-hidden="true"
          />
          <select
            aria-label={t.common.language}
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="min-w-0 rounded-full border border-slate-200 bg-white py-1.5 ps-7 pe-3 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:border-slate-300 dark:border-white/10 dark:bg-[#152A42] dark:text-slate-200 dark:hover:border-white/20"
          >
            {availableLanguages.map((code) => (
              <option key={code} value={code}>
                {code.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={t.common.darkMode}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-colors hover:border-slate-300 dark:border-white/10 dark:bg-[#152A42] dark:hover:border-white/20"
        >
          {theme === "dark" ? (
            <Moon className="h-4 w-4 text-slate-200" aria-hidden="true" />
          ) : (
            <Sun className="h-4 w-4 text-amber-500" aria-hidden="true" />
          )}
        </button>
      </div>
    </header>
  );
}
