"use client";

import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

export default function LanguageSwitcher() {
  const { locale, setLocale, locales, t } = useAdminPreferences();

  return (
    <div
      role="radiogroup"
      aria-label={t.header.language}
      className="flex items-center gap-0.5 rounded-full bg-[#EFE8D8] p-0.5 dark:bg-white/5"
    >
      {Object.entries(locales).map(([code, meta]) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setLocale(code)}
            className={[
              "rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-150",
              active
                ? "bg-[#1E3A5F] text-white shadow-sm dark:bg-[#C9A227] dark:text-[#10243A]"
                : "text-[#5B5347] hover:bg-white/60 dark:text-white/50 dark:hover:bg-white/10",
            ].join(" ")}
          >
            {meta.native}
          </button>
        );
      })}
    </div>
  );
}
