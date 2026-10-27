"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Pencil,
  Eye,
  ArrowLeft,
  Check,
  X,
  Trash2,
  BedDouble,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

const inputClass =
  "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500";
const labelClass =
  "mb-1 block text-sm font-medium text-gray-600 dark:text-gray-400";
const cardClass =
  "space-y-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm";

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

function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ isActive, t }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        isActive
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
      }`}
    >
      {isActive ? t.planDetail.active : t.planDetail.inactive}
    </span>
  );
}

export default function PlanDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { dir, t } = useAdminPreferences();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  async function loadPlan() {
    try {
      const res = await fetchWithAuth(`/api/subscription-plans/${id}`);
      if (!res.ok) {
        if (res.status === 401) return router.push("/hotel/login");
        if (res.status === 404) return router.push("/admin/plans");
        throw new Error(t.planDetail.errors.loadFailed);
      }
      const data = await res.json();
      setPlan(data.plan);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleDelete() {
    if (!confirm(t.planDetail.deleteConfirm.replace("{name}", plan.name)))
      return;
    setDeleting(true);
    try {
      const res = await fetchWithAuth(`/api/subscription-plans/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.planDetail.errors.deleteFailed);
      }
      router.push("/admin/plans");
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  }

  if (loading)
    return (
      <div className="p-6 text-sm text-gray-500 dark:text-gray-400" dir={dir}>
        {t.planDetail.loading}
      </div>
    );
  if (!plan)
    return (
      <div className="p-6 text-sm text-red-600" dir={dir}>
        {error || t.planDetail.planNotFound}
      </div>
    );

  const canDelete = plan.hotel_count === 0;

  return (
    <div className="p-6 max-w-6xl mx-auto" dir={dir}>
      {/* Header with back button */}
      <div className="mb-6">
        <Link
          href="/admin/plans"
          className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300"
        >
          <ArrowLeft size={16} className={dir === "rtl" ? "rotate-180" : ""} />
          {t.planDetail.back}
        </Link>
      </div>

      {/* Plan summary card */}
      <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {plan.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {Number(plan.price_monthly).toLocaleString()}
                </span>{" "}
                {t.planDetail.perMonth}
              </span>
              <span>·</span>
              <span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {plan.hotel_count}
                </span>{" "}
                {t.planDetail.hotels}
              </span>
              <span>·</span>
              <StatusBadge isActive={plan.is_active} t={t} />
              <span>·</span>
              <span>
                {t.planDetail.maxBranches}:{" "}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {plan.max_branches}
                </span>
              </span>
              <span>·</span>
              <span>
                {t.planDetail.maxPos}:{" "}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {plan.max_pos_devices}
                </span>
              </span>

              {/* 👈 NEW — rooms badge */}
              <span>·</span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  plan.is_rooms
                    ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                <BedDouble size={12} />
                {plan.is_rooms ? "Rooms ✓" : "Rooms ✕"}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {!showEdit && (
              <PrimaryButton onClick={() => setShowEdit(true)}>
                <Pencil size={16} />
                {t.planDetail.edit}
              </PrimaryButton>
            )}
            <button
              type="button"
              disabled={deleting || !canDelete}
              onClick={handleDelete}
              title={!canDelete ? t.planDetail.deleteDisabledTooltip : ""}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 dark:border-red-900/40 dark:hover:bg-red-950/30"
            >
              <Trash2 size={16} />
              {deleting ? t.planDetail.deleting : t.planDetail.delete}
            </button>
          </div>
        </div>
        {plan.features && Object.keys(plan.features).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            {Object.entries(plan.features).map(([key, value]) => (
              <span
                key={key}
                className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 dark:bg-teal-900/20 dark:text-teal-400"
              >
                {key}: {String(value)}
              </span>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {showEdit ? (
        <EditForm
          plan={plan}
          onSaved={loadPlan}
          onCancel={() => setShowEdit(false)}
          dir={dir}
          t={t}
        />
      ) : (
        <HotelsTable plan={plan} dir={dir} t={t} />
      )}
    </div>
  );
}

function HotelsTable({ plan, dir, t }) {
  const hotels = plan.hotels || [];
  const isRtl = dir === "rtl";

  return (
    <div className={cardClass}>
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
        {t.planDetail.hotelsOnPlan.replace("{count}", hotels.length)}
      </h2>
      {hotels.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t.planDetail.noHotels}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th
                  className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 ${isRtl ? "text-right" : "text-left"}`}
                >
                  {t.planDetail.table.hotelName}
                </th>
                <th
                  className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 ${isRtl ? "text-right" : "text-left"}`}
                >
                  {t.planDetail.table.owner}
                </th>
                <th
                  className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 ${isRtl ? "text-right" : "text-left"}`}
                >
                  {t.planDetail.table.status}
                </th>
                <th
                  className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 ${isRtl ? "text-left" : "text-right"}`}
                >
                  {t.planDetail.table.action}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {hotels.map((h) => (
                <tr
                  key={h.id}
                  className="hover:bg-teal-50/50 dark:hover:bg-teal-900/10 transition-colors"
                >
                  <td
                    className={`px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 ${isRtl ? "text-right" : "text-left"}`}
                  >
                    <Link
                      href={`/admin/hotels/${h.id}`}
                      className="hover:text-teal-600 dark:hover:text-teal-400"
                    >
                      {h.name}
                    </Link>
                  </td>
                  <td
                    className={`px-4 py-3 text-sm text-gray-700 dark:text-gray-300 ${isRtl ? "text-right" : "text-left"}`}
                  >
                    {h.owner_name || "—"}
                    {h.owner_contact && (
                      <span className="ml-1 text-xs text-gray-400">
                        ({h.owner_contact})
                      </span>
                    )}
                  </td>
                  <td
                    className={`px-4 py-3 ${isRtl ? "text-right" : "text-left"}`}
                  >
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        h.subscription_status === "active"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : h.subscription_status === "trial"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {h.subscription_status}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3 ${isRtl ? "text-left" : "text-right"}`}
                  >
                    <Link
                      href={`/admin/hotels/${h.id}`}
                      className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400"
                    >
                      <Eye size={14} />
                      {t.planDetail.table.view}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EditForm({ plan, onSaved, onCancel, dir, t }) {
  const [form, setForm] = useState({
    name: plan.name,
    price_monthly: plan.price_monthly,
    max_branches: plan.max_branches,
    max_pos_devices: plan.max_pos_devices,
    is_active: plan.is_active,
    is_rooms: plan.is_rooms === true, // 👈 NEW
  });
  const [featureKeys, setFeatureKeys] = useState(
    Object.entries(plan.features || {}).length
      ? Object.entries(plan.features).map(([key, value]) => ({
          key,
          value: String(value),
        }))
      : [{ key: "", value: "" }],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function updateFeature(i, field, value) {
    setFeatureKeys((prev) =>
      prev.map((f, idx) => (idx === i ? { ...f, [field]: value } : f)),
    );
  }
  function addFeatureRow() {
    setFeatureKeys((prev) => [...prev, { key: "", value: "" }]);
  }
  function removeFeatureRow(i) {
    setFeatureKeys((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const features = {};
      featureKeys.forEach((f) => {
        if (f.key.trim()) features[f.key.trim()] = f.value;
      });

      const res = await fetchWithAuth(`/api/subscription-plans/${plan.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name,
          price_monthly: Number(form.price_monthly),
          max_branches: Number(form.max_branches),
          max_pos_devices: Number(form.max_pos_devices),
          is_active: form.is_active,
          is_rooms: form.is_rooms, // 👈 NEW
          features,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.planDetail.errors.saveFailed);
      }
      setSaved(true);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className={cardClass} dir={dir}>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {t.planDetail.editPlan}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <X size={18} />
        </button>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {saved && (
        <div className="text-sm text-green-600 flex items-center gap-1">
          <Check size={16} /> {t.planDetail.saved}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>{t.planDetail.fields.planName}</label>
          <input
            required
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>{t.planDetail.fields.price}</label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={form.price_monthly}
            onChange={(e) =>
              setForm((f) => ({ ...f, price_monthly: e.target.value }))
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>{t.planDetail.fields.status}</label>
          <select
            value={form.is_active ? "active" : "inactive"}
            onChange={(e) =>
              setForm((f) => ({ ...f, is_active: e.target.value === "active" }))
            }
            className={inputClass}
          >
            <option value="active">{t.planDetail.fields.active}</option>
            <option value="inactive">{t.planDetail.fields.inactive}</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>
            {t.planDetail.fields.maxBranches}
          </label>
          <input
            required
            type="number"
            min="1"
            value={form.max_branches}
            onChange={(e) =>
              setForm((f) => ({ ...f, max_branches: e.target.value }))
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>
            {t.planDetail.fields.maxPosDevices}
          </label>
          <input
            required
            type="number"
            min="1"
            value={form.max_pos_devices}
            onChange={(e) =>
              setForm((f) => ({ ...f, max_pos_devices: e.target.value }))
            }
            className={inputClass}
          />
        </div>

        {/* 👈 NEW — rooms feature toggle */}
        <div className="sm:col-span-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_rooms}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_rooms: e.target.checked }))
              }
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-800"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                Rooms management
              </span>
              <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                Hotels on this plan can manage rooms and room stays.
                {plan.hotel_count > 0 && (
                  <>
                    {" "}
                    This plan is on {plan.hotel_count} hotel
                    {plan.hotel_count === 1 ? "" : "s"} — the change applies
                    everywhere immediately.
                  </>
                )}
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className={labelClass}>{t.planDetail.fields.features}</span>
          <button
            type="button"
            onClick={addFeatureRow}
            className="text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400"
          >
            + {t.planDetail.fields.addFeature}
          </button>
        </div>
        {featureKeys.map((f, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              placeholder={t.planDetail.fields.keyPlaceholder}
              value={f.key}
              onChange={(e) => updateFeature(i, "key", e.target.value)}
              className={inputClass}
            />
            <input
              type="text"
              placeholder={t.planDetail.fields.valuePlaceholder}
              value={f.value}
              onChange={(e) => updateFeature(i, "value", e.target.value)}
              className={inputClass}
            />
            {featureKeys.length > 1 && (
              <button
                type="button"
                onClick={() => removeFeatureRow(i)}
                className="shrink-0 text-xs font-medium text-red-600 hover:underline"
              >
                {t.planDetail.fields.removeFeature}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <PrimaryButton type="submit" disabled={saving}>
          {saving ? t.planDetail.saving : t.planDetail.saveChanges}
        </PrimaryButton>
        <SecondaryButton type="button" onClick={onCancel}>
          {t.planDetail.cancel}
        </SecondaryButton>
      </div>
    </form>
  );
}
