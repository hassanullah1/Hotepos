"use client";

import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

export default function AdminRootWrapper({ children }) {
  const { dir, isRtl } = useAdminPreferences();

  return (
    <div
      dir={dir}
      className={`flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0B1826] ${
        isRtl ? "font-rtl" : "font-sans"
      }`}
    >
      {children}
    </div>
  );
}
