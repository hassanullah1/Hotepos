"use client";

import Link from "next/link";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

export default function DashboardCards({ counts }) {
  const { t } = useAdminPreferences();

  const cards = [
    { key: "vehicles", href: "/admin/vehicles", value: counts.vehicles },
    { key: "provinces", href: "/admin/provinces", value: counts.provinces },
    { key: "users", href: "/admin/users", value: counts.users },
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">{t.dashboard.title}</h1>
      <p className="mb-6 text-slate-500 dark:text-slate-400">
        {t.dashboard.welcome}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.key}
            href={c.href}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-[#0F1E30]"
          >
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t.dashboard[c.key]}
            </p>
            <p className="mt-2 text-3xl font-semibold">{c.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
