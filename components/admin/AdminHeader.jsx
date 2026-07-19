"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";

export default function AdminHeader({ user }) {
  const router = useRouter();
  const { t } = useAdminPreferences();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-black/5 bg-white px-6 dark:border-white/10 dark:bg-[#0F1C2E]">
      <p className="text-sm text-[#5B5347] dark:text-white/50">
        {t.header.welcome},{" "}
        <span className="font-medium text-[#1E3A5F] dark:text-white">
          {user.name.split(" ")[0]}
        </span>
      </p>

      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <ThemeToggle />

        <div className="mx-1 h-8 w-px bg-black/10 dark:bg-white/10" />

        <div className="text-end">
          <p className="text-sm font-medium text-[#1E3A5F] dark:text-white">
            {user.name}
          </p>
          <p className="text-xs text-[#8A8272] dark:text-white/40">
            {user.role}
          </p>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
        >
          {loggingOut ? t.header.loggingOut : t.header.logout}
        </button>
      </div>
    </header>
  );
}
