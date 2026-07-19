"use client";

import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme, t } = useAdminPreferences();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      title={isDark ? t.header.dark : t.header.light}
      className="group relative flex h-8 w-14 items-center rounded-full bg-[#EFE8D8] px-1 transition-colors duration-200 dark:bg-white/5"
    >
      <span
        className={[
          "flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ease-out dark:bg-[#C9A227]",
          isDark ? "translate-x-6 rtl:-translate-x-6" : "translate-x-0",
        ].join(" ")}
      >
        {isDark ? (
          // moon
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-[#10243A]">
            <path d="M17.3 12.5A7.6 7.6 0 0 1 7.5 2.7 7.6 7.6 0 1 0 17.3 12.5Z" />
          </svg>
        ) : (
          // sun
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-[#C9A227]">
            <circle cx="10" cy="10" r="4" />
            <g stroke="#C9A227" strokeWidth="1.5" strokeLinecap="round">
              <line x1="10" y1="1" x2="10" y2="3" />
              <line x1="10" y1="17" x2="10" y2="19" />
              <line x1="1" y1="10" x2="3" y2="10" />
              <line x1="17" y1="10" x2="19" y2="10" />
            </g>
          </svg>
        )}
      </span>
    </button>
  );
}
