"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const inputClass =
  "w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/10";
const labelClass =
  "mb-1 block text-sm font-medium text-[#5B6472] dark:text-[#C7CDD6]";
const sectionClass =
  "space-y-4 rounded-xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0F1C2E]";

export default function CreatePlanPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    price_monthly: "",
    max_branches: 1,
    max_pos_devices: 2,
    is_active: true,
  });

  // simple key:value feature toggles — extend as needed
  const [featureKeys, setFeatureKeys] = useState([{ key: "", value: "" }]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }
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

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const features = {};
      featureKeys.forEach((f) => {
        if (f.key.trim()) features[f.key.trim()] = f.value;
      });

      const res = await fetchWithAuth("/api/subscription-plans", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          price_monthly: Number(form.price_monthly),
          max_branches: Number(form.max_branches),
          max_pos_devices: Number(form.max_pos_devices),
          is_active: form.is_active,
          features,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) return router.push("/login");
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create plan");
      }

      const data = await res.json();
      router.push(`/admin/plans/${data.plan.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/plans"
          className="text-sm font-medium text-[#2F6690] hover:underline"
        >
          ← Back
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-semibold text-[#10243A] dark:text-[#EDEBE3]">
        Create Subscription Plan
      </h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30">
            {error}
          </div>
        )}

        <div className={sectionClass}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>Plan name</label>
              <input
                required
                type="text"
                placeholder="e.g. Standard, Pro, Enterprise"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Price / month</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.price_monthly}
                onChange={(e) => update("price_monthly", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={form.is_active ? "active" : "inactive"}
                onChange={(e) =>
                  update("is_active", e.target.value === "active")
                }
                className={inputClass}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Max branches</label>
              <input
                required
                type="number"
                min="1"
                value={form.max_branches}
                onChange={(e) => update("max_branches", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Max POS devices</label>
              <input
                required
                type="number"
                min="1"
                value={form.max_pos_devices}
                onChange={(e) => update("max_pos_devices", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className={sectionClass}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#10243A] dark:text-[#EDEBE3]">
              Features (optional)
            </h2>
            <button
              type="button"
              onClick={addFeatureRow}
              className="text-sm font-medium text-[#2F6690] hover:underline"
            >
              + Add feature
            </button>
          </div>
          {featureKeys.map((f, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                placeholder="key (e.g. reports_export)"
                value={f.key}
                onChange={(e) => updateFeature(i, "key", e.target.value)}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="value (e.g. true, 100, csv)"
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
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#10243A] px-4 py-2 text-sm font-medium text-[#EDEBE3] transition-colors hover:bg-[#0B1826] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Create plan"}
          </button>
          <Link
            href="/admin/plans"
            className="rounded-xl px-4 py-2 text-sm font-medium text-[#5B6472] hover:underline dark:text-[#C7CDD6]"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
