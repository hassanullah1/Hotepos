"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, Plus, Eye, BedDouble } from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

const inputClass =
  "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500";

function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export default function PlansListPage() {
  const router = useRouter();
  const { t, dir } = useAdminPreferences();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [includeInactive, setIncludeInactive] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const getText = (key, fallback) => {
    try {
      const parts = key.split(".");
      let value = t;
      for (const part of parts) {
        if (value && typeof value === "object" && part in value) {
          value = value[part];
        } else {
          return fallback;
        }
      }
      return value || fallback;
    } catch {
      return fallback;
    }
  };

  async function loadPlans() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (includeInactive) params.set("include_inactive", "1");
      const res = await fetchWithAuth(
        `/api/subscription-plans?${params.toString()}`,
      );
      if (!res.ok) {
        if (res.status === 401) return router.push("/hotel/login");
        throw new Error(
          getText("plansList.errors.loadFailed", "Failed to load plans"),
        );
      }
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadPlans, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, includeInactive]);

  async function deletePlan(id) {
    const confirmMsg = getText(
      "plansList.deleteConfirm",
      "Are you sure you want to delete this plan?",
    );
    if (!confirm(confirmMsg)) return;
    setDeletingId(id);
    try {
      const res = await fetchWithAuth(`/api/subscription-plans/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        if (res.status === 401) return router.push("/hotel/login");
        throw new Error(
          getText("plansList.errors.deleteFailed", "Failed to delete plan"),
        );
      }
      await loadPlans();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  const title = getText("plansList.title", "Subscription Plans");
  const newPlan = getText("plansList.newPlan", "New Plan");
  const searchPlaceholder = getText(
    "plansList.searchPlaceholder",
    "Search plans...",
  );
  const showInactive = getText("plansList.showInactive", "Show inactive");
  const loadingMsg = getText("plansList.loading", "Loading...");
  const noPlans = getText("plansList.noPlans", "No plans found.");
  const perMonth = getText("plansList.perMonth", "/mo");
  const activeLabel = getText("plansList.active", "Active");
  const inactiveLabel = getText("plansList.inactive", "Inactive");
  const editLabel = getText("plansList.edit", "Edit");
  const deleteLabel = getText("plansList.delete", "Delete");
  const roomsLabel = getText("plansList.rooms", "Rooms"); // 👈 NEW

  return (
    <div className="p-6" dir={dir}>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h1>
        <Link
          href="/admin/plans/create"
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
        >
          <Plus size={16} />
          {newPlan}
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={inputClass + " max-w-xs"}
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-800"
          />
          {showInactive}
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Max Branches
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Max POS
              </th>
              {/* 👈 NEW column */}
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {roomsLabel}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Hotels
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  {loadingMsg}
                </td>
              </tr>
            ) : plans.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  {noPlans}
                </td>
              </tr>
            ) : (
              plans.map((plan) => (
                <tr
                  key={plan.id}
                  className="hover:bg-teal-50/50 dark:hover:bg-teal-900/10 transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                    <Link
                      href={`/admin/plans/${plan.id}`}
                      className="hover:text-teal-600 dark:hover:text-teal-400"
                    >
                      {plan.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {Number(plan.price_monthly).toLocaleString()}
                    <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                      {perMonth}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {plan.max_branches}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {plan.max_pos_devices}
                  </td>
                  {/* 👈 NEW cell */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        plan.is_rooms
                          ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                      title={
                        plan.is_rooms
                          ? "Rooms management included"
                          : "Rooms management not included"
                      }
                    >
                      <BedDouble size={12} />
                      {plan.is_rooms ? "✓" : "✕"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {plan.hotel_count}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        plan.is_active
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {plan.is_active ? activeLabel : inactiveLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/plans/${plan.id}`}
                        className="rounded p-1 text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                        aria-label={editLabel}
                      >
                        <Eye size={16} />
                      </Link>
                      <button
                        onClick={() => deletePlan(plan.id)}
                        disabled={deletingId === plan.id}
                        className="rounded p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                        aria-label={deleteLabel}
                      >
                        <Trash2 size={16} />
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
