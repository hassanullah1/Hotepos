"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  Building2,
  ShieldCheck,
  ShieldAlert,
  Clock,
  PhoneCall,
  Loader2,
  Globe,
  Store,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { usePermissions } from "@/lib/usePermissions";
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

function Badge({ tone = "neutral", children }) {
  const tones = {
    neutral: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
    active: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    warning:
      "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    danger: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    success:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

const STATUS_TONE = {
  active: "active",
  trialing: "active",
  trial: "active",
  past_due: "warning",
  suspended: "danger",
  cancelled: "danger",
  canceled: "danger",
  inactive: "neutral",
};

const VERIFICATION_ICON = {
  pending: Clock,
  contacted: PhoneCall,
  verified: ShieldCheck,
  rejected: ShieldAlert,
};

const VERIFICATION_OPTIONS = ["pending", "contacted", "verified", "rejected"];

export default function HotelsListPage() {
  const router = useRouter();
  const { t, dir } = useAdminPreferences();
  const [hotels, setHotels] = useState([]);
  const [totalDue, setTotalDue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [q, setQ] = useState("");
  const [ownerQ, setOwnerQ] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("all");

  const { hasPermission, hasRole } = usePermissions();
  const isSuperAdmin = hasRole(["super_admin"]);

  async function loadHotels() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (ownerQ) params.set("owner", ownerQ);
      if (verificationFilter !== "all")
        params.set("verification", verificationFilter);
      const res = await fetchWithAuth(`/api/hotels?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401) return router.push("/login");
        throw new Error(t.hotels.errorLoad);
      }
      const data = await res.json();
      setHotels(data.hotels || []);
      setTotalDue(data.total_monthly_due || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadHotels, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, ownerQ, verificationFilter]);

  async function handleDelete(id, name) {
    if (!confirm(t.hotels.deleteConfirm.replace("{name}", name))) return;
    setDeletingId(id);
    try {
      const res = await fetchWithAuth(`/api/hotels/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || t.hotels.deleteError || "Failed to delete hotel",
        );
      }
      setHotels((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  async function changeVerification(hotelId, status) {
    setUpdatingId(hotelId);
    try {
      const res = await fetchWithAuth(`/api/hotels/${hotelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verification_status: status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setHotels((prev) =>
        prev.map((h) =>
          h.id === hotelId ? { ...h, verification_status: status } : h,
        ),
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function toggleOnline(hotelId, current) {
    setUpdatingId(hotelId);
    try {
      const res = await fetchWithAuth(`/api/hotels/${hotelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_online: !current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setHotels((prev) =>
        prev.map((h) => (h.id === hotelId ? { ...h, is_online: !current } : h)),
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  const canCreate = hasPermission("hotels.create");
  const showActionsColumn =
    hasPermission("hotels.edit") || hasPermission("hotels.delete");

  const pendingCount = hotels.filter(
    (h) => h.verification_status === "pending",
  ).length;

  const colCount = 6 + (isSuperAdmin ? 2 : 0) + (showActionsColumn ? 1 : 0);

  return (
    <div className="p-6 max-w-6xl mx-auto" dir={dir}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#10243A] dark:text-[#EDEBE3]">
            {hasRole(["hotel_owner"]) ? t.hotels.yourHotels : t.hotels.title}
          </h1>
          {isSuperAdmin && pendingCount > 0 && (
            <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
              {pendingCount} hotel{pendingCount === 1 ? "" : "s"} pending
              verification
            </p>
          )}
        </div>
        {canCreate && (
          <PrimaryButton onClick={() => router.push("/admin/hotels/create")}>
            <Plus size={16} />{" "}
            {t.hotels.create || t.hotels.addTitle || "Create hotel"}
          </PrimaryButton>
        )}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder={t.hotels.searchByNamePlaceholder}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className={`${inputClass} ps-9`}
          />
        </div>

        {!hasRole("hotel_owner") && (
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder={t.hotels.searchByOwnerPlaceholder}
              value={ownerQ}
              onChange={(e) => setOwnerQ(e.target.value)}
              className={`${inputClass} ps-9`}
            />
          </div>
        )}

        {isSuperAdmin && (
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className={inputClass}
          >
            <option value="all">All verifications</option>
            <option value="pending">Pending</option>
            <option value="contacted">Contacted</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        )}
      </div>

      {!loading && hotels.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-teal-100 bg-teal-50/60 px-4 py-2.5 text-sm text-teal-900 dark:border-teal-900/40 dark:bg-teal-900/10 dark:text-teal-300">
          <span>{t.hotels.resultsCount.replace("{count}", hotels.length)}</span>
          <span className="text-teal-300 dark:text-teal-700">·</span>
          <span className="font-medium">
            {t.hotels.totalMonthlyDue.replace(
              "{amount}",
              totalDue.toLocaleString(),
            )}
          </span>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">{t.hotels.columns.name}</th>
              <th className="px-4 py-3">{t.hotels.columns.owner}</th>
              <th className="px-4 py-3">{t.hotels.columns.plan}</th>
              <th className="px-4 py-3">{t.hotels.columns.branches}</th>
              <th className="px-4 py-3">{t.hotels.columns.status}</th>
              {isSuperAdmin && <th className="px-4 py-3">Verification</th>}
              {isSuperAdmin && <th className="px-4 py-3">Online</th>}
              {showActionsColumn && (
                <th className="px-4 py-3 text-end">{t.common.actions}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                    {t.hotels.loading}
                  </span>
                </td>
              </tr>
            ) : hotels.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Building2
                      size={22}
                      className="text-gray-300 dark:text-gray-600"
                    />
                    {t.hotels.noResults}
                  </div>
                </td>
              </tr>
            ) : (
              hotels.map((h) => {
                const vStatus = h.verification_status || "pending";
                const VIcon = VERIFICATION_ICON[vStatus] || Clock;
                const isUpdating = updatingId === h.id;

                return (
                  <tr
                    key={h.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-gray-700/60 dark:hover:bg-gray-700/20"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/hotels/${h.id}`}
                        className="font-medium text-teal-700 hover:text-teal-800 hover:underline dark:text-teal-400 dark:hover:text-teal-300"
                      >
                        {h.name}
                      </Link>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {h.slug}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{h.owner_name || "—"}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {h.owner_email || h.owner_phone || ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{h.subscription_plan_name || "—"}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {h.monthly_due != null
                          ? Number(h.monthly_due).toLocaleString()
                          : "—"}
                        /mo
                      </div>
                    </td>
                    <td className="px-4 py-3">{h.branch_count}</td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={STATUS_TONE[h.subscription_status] || "neutral"}
                      >
                        {t.hotels.statuses[h.subscription_status] ||
                          h.subscription_status}
                      </Badge>
                    </td>

                    {isSuperAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                              {
                                pending:
                                  "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                                contacted:
                                  "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
                                verified:
                                  "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                                rejected:
                                  "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                              }[vStatus] ||
                              "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                          >
                            <VIcon size={11} />
                            {vStatus}
                          </span>

                          {isUpdating ? (
                            <Loader2
                              size={14}
                              className="animate-spin text-gray-400"
                            />
                          ) : (
                            <select
                              value={vStatus}
                              onChange={(e) =>
                                changeVerification(h.id, e.target.value)
                              }
                              className="rounded-md border border-gray-300 bg-white px-1.5 py-1 text-xs outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                              title="Change verification"
                            >
                              {VERIFICATION_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>
                    )}

                    {isSuperAdmin && (
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleOnline(h.id, h.is_online)}
                          disabled={isUpdating}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition disabled:opacity-50 ${
                            h.is_online
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
                          }`}
                          title={
                            h.is_online
                              ? "Click to disable online ordering"
                              : "Click to enable online ordering"
                          }
                        >
                          {h.is_online ? (
                            <Globe size={11} />
                          ) : (
                            <Store size={11} />
                          )}
                          {h.is_online ? "Online" : "POS only"}
                        </button>
                      </td>
                    )}

                    {showActionsColumn && (
                      <td className="px-4 py-3 text-end">
                        <div className="inline-flex items-center gap-3">
                          {hasPermission("hotels.edit") && (
                            <Link
                              href={`/admin/hotels/${h.id}`}
                              className="text-xs font-medium text-teal-700 hover:text-teal-800 hover:underline dark:text-teal-400 dark:hover:text-teal-300"
                            >
                              {t.hotels.manage}
                            </Link>
                          )}
                          {hasPermission("hotels.delete") && (
                            <button
                              type="button"
                              disabled={deletingId === h.id}
                              onClick={() => handleDelete(h.id, h.name)}
                              className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline disabled:opacity-50 dark:text-red-400"
                            >
                              {deletingId === h.id
                                ? t.common.deleting || t.hotels.delete
                                : t.hotels.delete}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
