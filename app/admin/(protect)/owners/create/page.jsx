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

export default function CreateOwnerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    is_active: true,
  });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetchWithAuth("/api/owners", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        if (res.status === 401) return router.push("/hotel/login");
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create owner");
      }
      const data = await res.json();
      router.push(`/admin/owners/${data.owner.id}`);
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
          href="/admin/owners"
          className="text-sm font-medium text-[#2F6690] hover:underline"
        >
          ← Back
        </Link>
      </div>

      <h1 className="mb-2 text-2xl font-semibold text-[#10243A] dark:text-[#EDEBE3]">
        Create Owner
      </h1>
      <p className="mb-6 text-sm text-[#8FA0B3]">
        Creates a login-only owner account. Attach hotels to it afterward from{" "}
        <Link
          href="/admin/hotels/create"
          className="text-[#2F6690] hover:underline"
        >
          Create Hotel
        </Link>{" "}
        by selecting "Existing owner" and searching for this person.
      </p>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30">
            {error}
          </div>
        )}

        <div className={sectionClass}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>Full name</label>
              <input
                required
                type="text"
                value={form.full_name}
                onChange={(e) => update("full_name", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Username</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input
                required
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-[#10243A] dark:text-[#EDEBE3]">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => update("is_active", e.target.checked)}
                  className="h-4 w-4 rounded border-black/20 dark:border-white/20"
                />
                Active
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#10243A] px-4 py-2 text-sm font-medium text-[#EDEBE3] transition-colors hover:bg-[#0B1826] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Create owner"}
          </button>
          <Link
            href="/admin/owners"
            className="rounded-xl px-4 py-2 text-sm font-medium text-[#5B6472] hover:underline dark:text-[#C7CDD6]"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
