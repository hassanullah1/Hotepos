"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { Check, Loader2 } from "lucide-react";

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

  const [allSections, setAllSections] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [selectedSectionKeys, setSelectedSectionKeys] = useState([]);

  const [form, setForm] = useState({
    name: "",
    price_monthly: "",
    max_branches: 1,
    max_pos_devices: 2,
    is_active: true,
  });

  // Load the section catalogue once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithAuth("/api/sections");
        if (!res.ok) throw new Error("Failed to load sections");
        const data = await res.json();
        if (!cancelled) setAllSections(data.sections || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setSectionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleSection(key) {
    setSelectedSectionKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetchWithAuth("/api/subscription-plans", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          price_monthly: Number(form.price_monthly),
          max_branches: Number(form.max_branches),
          max_pos_devices: Number(form.max_pos_devices),
          is_active: form.is_active,
          section_keys: selectedSectionKeys,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) return router.push("/hotel/login");
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

        {/* ── Basic info ─────────────────────────────────── */}
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

        {/* ── Sections (the new gating mechanism) ─────────── */}
        <div className={sectionClass}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#10243A] dark:text-[#EDEBE3]">
                Sections included in this plan
              </h2>
              <p className="mt-0.5 text-xs text-[#5B6472] dark:text-[#C7CDD6]">
                Hotels on this plan will only see the sections you tick below.
              </p>
            </div>
            <span className="text-xs text-[#5B6472] dark:text-[#C7CDD6]">
              {selectedSectionKeys.length} selected
            </span>
          </div>

          {sectionsLoading ? (
            <div className="flex items-center gap-2 text-sm text-[#5B6472] dark:text-[#C7CDD6]">
              <Loader2 size={14} className="animate-spin" />
              Loading sections…
            </div>
          ) : allSections.length === 0 ? (
            <div className="rounded-lg border border-dashed border-black/10 px-3 py-4 text-xs text-[#5B6472] dark:border-white/10 dark:text-[#C7CDD6]">
              No sections found. Ask a super admin to seed the{" "}
              <code>sections</code> table first.
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {allSections.map((s) => {
                const checked = selectedSectionKeys.includes(s.key);
                return (
                  <label
                    key={s.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                      checked
                        ? "border-teal-500 bg-teal-50/60 dark:bg-teal-900/20"
                        : "border-black/10 hover:bg-black/[0.03] dark:border-white/10 dark:hover:bg-white/[0.03]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSection(s.key)}
                      className="mt-0.5 h-4 w-4 rounded border-black/20 text-teal-600 focus:ring-teal-500 dark:border-white/20"
                    />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-[#10243A] dark:text-[#EDEBE3]">
                        {s.name}
                        {checked && (
                          <Check
                            size={12}
                            className="text-teal-600 dark:text-teal-400"
                          />
                        )}
                      </span>
                      <span className="mt-0.5 block font-mono text-[11px] text-[#5B6472] dark:text-[#C7CDD6]">
                        {s.key}
                      </span>
                      {s.description && (
                        <span className="mt-1 block text-xs text-[#5B6472] dark:text-[#C7CDD6]">
                          {s.description}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
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
