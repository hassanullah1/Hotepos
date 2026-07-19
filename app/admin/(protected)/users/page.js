"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";
import { Banner, DeleteButton } from "@/components/admin/ListControls";

export default function UsersListPage() {
  const { t } = useAdminPreferences();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/users");
    setUsers(res.ok ? await res.json() : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id) {
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      setBanner({ kind: "success", message: t.common.deleted });
      load();
    } else {
      const { error } = await res.json().catch(() => ({}));
      setBanner({ kind: "error", message: error || t.common.error });
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t.user.title}</h1>
        <Link
          href="/admin/users/new"
          className="rounded-lg bg-[#10243A] px-4 py-2 text-sm font-medium text-white hover:bg-[#16324f] dark:bg-[#2F6690]"
        >
          + {t.common.add}
        </Link>
      </div>

      <Banner kind={banner?.kind} message={banner?.message} />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0F1E30]">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 dark:bg-white/5 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">{t.user.name}</th>
              <th className="px-4 py-3 font-medium">{t.user.email}</th>
              <th className="px-4 py-3 font-medium">{t.user.role}</th>
              <th className="px-4 py-3 font-medium">{t.user.isActive}</th>
              <th className="px-4 py-3 font-medium text-right">
                {t.common.actions}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  {t.common.loading}
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  {t.common.noResults}
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-slate-100 dark:border-white/5"
                >
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">
                    {t.user.roles[u.role] ?? u.role}
                  </td>
                  <td className="px-4 py-3">
                    {u.isActive ? t.common.yes : t.common.no}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-[#2F6690] hover:bg-slate-50 dark:text-[#7FB3D9] dark:hover:bg-white/5"
                      >
                        {t.common.edit}
                      </Link>
                      <DeleteButton onConfirm={() => handleDelete(u.id)} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
