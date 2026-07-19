"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";
import { Banner } from "@/components/admin/ListControls";

export default function OwnersListPage() {
  const { t } = useAdminPreferences();
  const router = useRouter();
  const [owners, setOwners] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/owners?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setOwners(data.owners || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id) {
    if (!confirm(t.common.confirmDelete || "Delete this owner?")) return;
    const res = await fetch(`/api/owners/${id}`, { method: "DELETE" });
    if (res.ok) {
      load();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error || t.common.error);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t.owner.listTitle}</h1>
        <Link
          href="/admin/owners/new"
          className="rounded-lg bg-[#10243A] px-4 py-2 text-sm font-medium text-white hover:bg-[#16324f] dark:bg-[#2F6690]"
        >
          {t.owner.addTitle}
        </Link>
      </div>

      <Banner kind="error" message={error} />

      <div className="mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder={t.common.search}
          className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#152A42]"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0F1E30]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-white/10">
            <tr>
              <th className="px-4 py-3">{t.owner.name}</th>
              <th className="px-4 py-3">{t.owner.phone}</th>
              <th className="px-4 py-3">{t.owner.tazkiraNumber}</th>
              <th className="px-4 py-3">{t.owner.vehicles}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  {t.common.loading}
                </td>
              </tr>
            ) : owners.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  {t.common.noResults}
                </td>
              </tr>
            ) : (
              owners.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-slate-100 last:border-0 dark:border-white/5"
                >
                  <td className="px-4 py-3">
                    <Link href={`/admin/owners/${o.id}`} className="font-medium hover:underline">
                      {o.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{o.phone || "—"}</td>
                  <td className="px-4 py-3">{o.tazkiraNumber || "—"}</td>
                  <td className="px-4 py-3">{o._count?.vehicles ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => router.push(`/admin/owners/${o.id}/edit`)}
                        className="rounded-lg border border-slate-300 px-3 py-1 text-xs dark:border-white/10"
                      >
                        {t.common.edit}
                      </button>
                      <button
                        onClick={() => handleDelete(o.id)}
                        className="rounded-lg border border-red-300 px-3 py-1 text-xs text-red-600 dark:border-red-900"
                      >
                        {t.common.delete}
                      </button>
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
