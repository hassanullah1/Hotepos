"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";
import { Banner } from "@/components/admin/ListControls";

const ROLES = ["SUPERADMIN", "ADMIN", "STAFF"];

export default function UserForm({ user }) {
  const { t } = useAdminPreferences();
  const router = useRouter();
  const isEdit = Boolean(user);

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    role: user?.role || "STAFF",
    isActive: user?.isActive ?? true,
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

    const res = await fetch(isEdit ? `/api/users/${user.id}` : "/api/users", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (res.ok) {
      router.push("/admin/users");
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error || t.common.error);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="mb-4 text-2xl font-semibold">
        {isEdit ? t.user.editTitle : t.user.addTitle}
      </h1>
      <Banner kind="error" message={error} />

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#0F1E30]"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t.user.name}
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#152A42]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            {t.user.email}
          </label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#152A42]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            {isEdit ? t.user.newPassword : t.user.password}
          </label>
          <input
            required={!isEdit}
            type="password"
            minLength={8}
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#152A42]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            {t.user.role}
          </label>
          <select
            value={form.role}
            onChange={(e) => set("role", e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#152A42]"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {t.user.roles[r]}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
          />
          {t.user.isActive}
        </label>

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
            onClick={() => router.push("/admin/users")}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-white/10"
          >
            {t.common.cancel}
          </button>
        </div>
      </form>
    </div>
  );
}
