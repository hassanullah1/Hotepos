"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

export default function PermissionsPage() {
  const router = useRouter();
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetchWithAuth("/api/permissions");
      if (res.status === 401) return router.push("/hotel/login");
      if (!res.ok) throw new Error("Failed to load permissions");
      const data = await res.json();
      setGrouped(data.grouped || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetchWithAuth("/api/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create permission");
      setCode("");
      setDescription("");
      setSuccess(`Permission "${data.permission.code}" created.`);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-semibold text-[#10243A] dark:text-[#EDEBE3]">
        Permissions
      </h1>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-950/30">
          {success}
        </div>
      )}

      <form
        onSubmit={handleCreate}
        className="mb-8 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#0F1C2E]"
      >
        <h2 className="mb-3 text-sm font-semibold text-[#10243A] dark:text-[#EDEBE3]">
          New Permission
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-[#5B6472] dark:text-[#C7CDD6]">
              Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. orders.create"
              required
              className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/10"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[#5B6472] dark:text-[#C7CDD6]">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this permission allows"
              className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/10"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-[#8FA0B3]">
          Use "category.action" format — the part before the dot groups
          permissions on the role assignment screen.
        </p>
        <button
          type="submit"
          disabled={saving}
          className="mt-3 rounded-xl bg-[#10243A] px-4 py-2 text-sm font-medium text-[#EDEBE3] transition-colors hover:bg-[#0B1826] disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create Permission"}
        </button>
      </form>

      {loading ? (
        <div className="py-10 text-center text-sm text-[#8FA0B3]">Loading…</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="py-10 text-center text-sm text-[#8FA0B3]">
          No permissions yet.
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([category, perms]) => (
            <div
              key={category}
              className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#0F1C2E]"
            >
              <h3 className="mb-2 text-sm font-medium capitalize text-[#10243A] dark:text-[#EDEBE3]">
                {category}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {perms.map((p) => (
                  <div
                    key={p.id}
                    className="text-sm text-[#5B6472] dark:text-[#C7CDD6]"
                  >
                    <span className="font-mono text-xs">{p.code}</span>
                    {p.description && (
                      <span className="block text-xs text-[#8FA0B3]">
                        {p.description}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
