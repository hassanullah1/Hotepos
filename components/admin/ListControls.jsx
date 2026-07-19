"use client";

import { useState } from "react";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

export function Banner({ message, kind = "info" }) {
  if (!message) return null;
  const styles =
    kind === "error"
      ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30"
      : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30";
  return (
    <div className={`mb-4 rounded-lg border px-4 py-2.5 text-sm ${styles}`}>
      {message}
    </div>
  );
}

export function DeleteButton({ onConfirm }) {
  const { t } = useAdminPreferences();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            onConfirm();
          }}
          className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
        >
          {t.common.yes}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300"
        >
          {t.common.no}
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="rounded-md px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
    >
      {t.common.delete}
    </button>
  );
}
