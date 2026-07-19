"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";
import { Banner } from "@/components/admin/ListControls";

export default function ProvinceForm({ province }) {
  const { t } = useAdminPreferences();
  const router = useRouter();
  const [name, setName] = useState(province?.name || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isEdit = Boolean(province);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch(
      isEdit ? `/api/provinces/${province.id}` : "/api/provinces",
      {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      },
    );

    setSaving(false);

    if (res.ok) {
      router.push("/admin/provinces");
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error || t.common.error);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="mb-4 text-2xl font-semibold">
        {isEdit ? t.province.editTitle : t.province.addTitle}
      </h1>
      <Banner kind="error" message={error} />

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#0F1E30]"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t.province.name}
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#152A42]"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#10243A] px-4 py-2 text-sm font-medium text-white hover:bg-[#16324f] disabled:opacity-60 dark:bg-[#2F6690]"
          >
            {t.common.save}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/provinces")}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-white/10"
          >
            {t.common.cancel}
          </button>
        </div>
      </form>
    </div>
  );
}
