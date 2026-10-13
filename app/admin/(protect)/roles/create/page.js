"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

export default function CreateRolePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [scope, setScope] = useState("branch");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetchWithAuth("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, scope }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create role");
      router.push(`/admin/roles/${data.role.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-6 text-2xl font-semibold text-[#10243A] dark:text-[#EDEBE3]">
        New Role
      </h1>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-[#5B6472] dark:text-[#C7CDD6]">
            Role name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. branch_manager"
            required
            className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/10"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-[#5B6472] dark:text-[#C7CDD6]">
            Scope
          </label>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/10"
          >
            <option value="platform">platform</option>
            <option value="hotel">hotel</option>
            <option value="branch">branch</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[#10243A] px-4 py-2 text-sm font-medium text-[#EDEBE3] transition-colors hover:bg-[#0B1826] disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create Role"}
        </button>
      </form>

      <p className="mt-4 text-xs text-[#8FA0B3]">
        You'll assign permissions on the next screen.
      </p>
    </div>
  );
}
