"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";
import { Banner } from "@/components/admin/ListControls";

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#0F1E30]">
      <div className="text-xs uppercase text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

export default function OwnerDetailPage() {
  const { t } = useAdminPreferences();
  const router = useRouter();
  const { id } = useParams();

  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/owners/${id}`);
      if (res.ok) {
        setOwner(await res.json());
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error || t.common.error);
      }
      setLoading(false);
    })();
  }, [id]);

  async function handleDelete() {
    if (!confirm(t.common.confirmDelete || "Delete this owner?")) return;
    const res = await fetch(`/api/owners/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/owners");
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error || t.common.error);
    }
  }

  if (loading) return <div className="p-6 text-slate-500">{t.common.loading}</div>;
  if (!owner) return <Banner kind="error" message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{owner.name}</h1>
          <p className="text-sm text-slate-500">
            {owner.phone || "—"} · {owner.tazkiraNumber || "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/owners/${owner.id}/edit`}
            className="rounded-lg bg-[#10243A] px-4 py-2 text-sm font-medium text-white hover:bg-[#16324f] dark:bg-[#2F6690]"
          >
            {t.common.edit}
          </Link>
          <button
            onClick={handleDelete}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 dark:border-red-900"
          >
            {t.common.delete}
          </button>
        </div>
      </div>

      <Banner kind="error" message={error} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label={t.owner.vehicles} value={owner.stats.vehicleCount} />
        <StatCard label={t.owner.orders} value={owner.stats.orderCount} />
        <StatCard
          label={t.owner.totalEarnings}
          value={`$${owner.stats.totalEarnings.toFixed(2)}`}
        />
        <StatCard
          label={t.owner.pendingEarnings}
          value={`$${owner.stats.pendingEarnings.toFixed(2)}`}
        />
      </div>

      {(owner.address || owner.notes) && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#0F1E30]">
          {owner.address && (
            <p className="text-sm">
              <span className="font-medium">{t.owner.address}: </span>
              {owner.address}
            </p>
          )}
          {owner.notes && (
            <p className="mt-2 text-sm">
              <span className="font-medium">{t.owner.notes}: </span>
              {owner.notes}
            </p>
          )}
        </div>
      )}

      <div>
        <h2 className="mb-2 text-lg font-semibold">{t.owner.vehicles}</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0F1E30]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-white/10">
              <tr>
                <th className="px-4 py-3">Plate</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Brand / Model</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Price / Day</th>
              </tr>
            </thead>
            <tbody>
              {owner.vehicles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    {t.common.noResults}
                  </td>
                </tr>
              ) : (
                owner.vehicles.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-slate-100 last:border-0 dark:border-white/5"
                  >
                    <td className="px-4 py-3">{v.plateNumber || "—"}</td>
                    <td className="px-4 py-3">{v.type}</td>
                    <td className="px-4 py-3">
                      {[v.brand, v.model].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="px-4 py-3">{v.status}</td>
                    <td className="px-4 py-3">
                      {v.pricePerDay ? `$${v.pricePerDay}` : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">{t.owner.orders}</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0F1E30]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-white/10">
              <tr>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {owner.orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    {t.common.noResults}
                  </td>
                </tr>
              ) : (
                owner.orders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-slate-100 last:border-0 dark:border-white/5"
                  >
                    <td className="px-4 py-3">{o.vehicle.plateNumber || o.vehicle.type}</td>
                    <td className="px-4 py-3">{o.client?.name || "—"}</td>
                    <td className="px-4 py-3">
                      {new Date(o.startDate).toLocaleDateString()} –{" "}
                      {new Date(o.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">{o.status}</td>
                    <td className="px-4 py-3">
                      {o.totalPrice ? `$${o.totalPrice.toFixed(2)}` : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
