"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";
import { Banner } from "@/components/admin/ListControls";

export default function OwnerForm({ owner }) {
  const { t } = useAdminPreferences();
  const router = useRouter();
  const isEdit = Boolean(owner);

  const [form, setForm] = useState({
    name: owner?.name || "",
    phone: owner?.phone || "",
    password: "",
    address: owner?.address || "",
    tazkiraNumber: owner?.tazkiraNumber || "",
    notes: owner?.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = { ...form };
    if (isEdit && !payload.password) delete payload.password;

    const res = await fetch(isEdit ? `/api/owners/${owner.id}` : "/api/owners", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (res.ok) {
      router.push("/admin/owners");
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error || t.common.error);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="mb-4 text-2xl font-semibold">
        {isEdit ? t.owner.editTitle : t.owner.addTitle}
      </h1>
      <Banner kind="error" message={error} />

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#0F1E30]"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">{t.owner.name}</label>
          <input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#152A42]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">{t.owner.phone}</label>
          <input
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#152A42]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            {isEdit ? t.owner.newPassword : t.owner.password}
          </label>
          <input
            type="password"
            minLength={8}
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder={isEdit ? t.owner.passwordHint : ""}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#152A42]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">{t.owner.address}</label>
          <input
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#152A42]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">{t.owner.tazkiraNumber}</label>
          <input
            value={form.tazkiraNumber}
            onChange={(e) => set("tazkiraNumber", e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#152A42]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">{t.owner.notes}</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
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
            onClick={() => router.push("/admin/owners")}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-white/10"
          >
            {t.common.cancel}
          </button>
        </div>
      </form>
    </div>
  );
}
