"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";
import { Banner, DeleteButton } from "@/components/admin/ListControls";

const STATUSES = ["AVAILABLE", "RENTED", "MAINTENANCE", "OUT_OF_SERVICE"];

export default function VehiclesListPage() {
  const { t } = useAdminPreferences();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState(null);
  const [filters, setFilters] = useState({ type: "", status: "", q: "" });

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.type) params.set("type", filters.type);
    if (filters.status) params.set("status", filters.status);
    if (filters.q) params.set("q", filters.q);
    const res = await fetch(`/api/admin/vehicles?${params.toString()}`);
    setVehicles(res.ok ? await res.json() : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.type, filters.status]);

  async function handleDelete(id) {
    const res = await fetch(`/api/admin/vehicles/${id}`, { method: "DELETE" });
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t.vehicle.title}</h1>
        <Link
          href="/admin/vehicles/new"
          className="rounded-lg bg-[#10243A] px-4 py-2 text-sm font-medium text-white hover:bg-[#16324f] dark:bg-[#2F6690]"
        >
          + {t.common.add}
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#152A42]"
        >
          <option value="">
            {t.common.all} — {t.vehicle.type}
          </option>
          {Object.entries(t.vehicle.types).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: e.target.value }))
          }
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#152A42]"
        >
          <option value="">
            {t.common.all} — {t.vehicle.status}
          </option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t.vehicle.statuses[s]}
            </option>
          ))}
        </select>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="flex gap-2"
        >
          <input
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            placeholder={t.common.search}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#152A42]"
          />
          <button
            type="submit"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/10"
          >
            {t.common.search}
          </button>
        </form>
      </div>

      <Banner kind={banner?.kind} message={banner?.message} />

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0F1E30]">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 dark:bg-white/5 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">{t.vehicle.type}</th>
              <th className="px-4 py-3 font-medium">
                {t.vehicle.brand} / {t.vehicle.model}
              </th>
              <th className="px-4 py-3 font-medium">{t.vehicle.plateNumber}</th>
              <th className="px-4 py-3 font-medium">{t.vehicle.status}</th>
              <th className="px-4 py-3 font-medium">
                {t.owner?.title || "Owner"}
              </th>
              <th className="px-4 py-3 font-medium">{t.vehicle.province}</th>
              <th className="px-4 py-3 font-medium text-right">
                {t.common.actions}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  {t.common.loading}
                </td>
              </tr>
            ) : vehicles.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  {t.common.noResults}
                </td>
              </tr>
            ) : (
              vehicles.map((v) => (
                <tr
                  key={v.id}
                  className="border-t border-slate-100 dark:border-white/5"
                >
                  <td className="px-4 py-3">
                    {t.vehicle.types[v.type] ?? v.type}
                  </td>
                  <td className="px-4 py-3">
                    {[v.brand, v.model].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="px-4 py-3">{v.plateNumber || "—"}</td>
                  <td className="px-4 py-3">
                    {t.vehicle.statuses[v.status] ?? v.status}
                  </td>
                  <td className="px-4 py-3">{v.owner?.name || "—"}</td>
                  <td className="px-4 py-3">{v.province?.name || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/vehicles/${v.id}/view`}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"
                      >
                        {t.common.view || "View"}
                      </Link>
                      <Link
                        href={`/admin/vehicles/${v.id}`}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-[#2F6690] hover:bg-slate-50 dark:text-[#7FB3D9] dark:hover:bg-white/5"
                      >
                        {t.common.edit}
                      </Link>
                      <DeleteButton onConfirm={() => handleDelete(v.id)} />
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
