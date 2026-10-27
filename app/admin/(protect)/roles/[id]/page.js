"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

export default function RoleDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [role, setRole] = useState(null);
  const [name, setName] = useState("");
  const [scope, setScope] = useState("branch");
  const [savingDetails, setSavingDetails] = useState(false);
  const [grouped, setGrouped] = useState({});
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [roleRes, permRes] = await Promise.all([
        fetchWithAuth(`/api/roles/${id}`),
        fetchWithAuth(`/api/permissions`),
      ]);
      if (roleRes.status === 401 || permRes.status === 401) {
        return router.push("/hotel/login");
      }
      if (!roleRes.ok) throw new Error("Failed to load role");
      if (!permRes.ok) throw new Error("Failed to load permissions");

      const roleData = await roleRes.json();
      const permData = await permRes.json();

      setRole(roleData.role);
      setName(roleData.role.name);
      setScope(roleData.role.scope);
      setSelected(new Set(roleData.role.permission_ids));
      setGrouped(permData.grouped);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function toggle(permId) {
    setSuccess("");
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(permId) ? next.delete(permId) : next.add(permId);
      return next;
    });
  }

  function toggleCategory(perms, checked) {
    setSuccess("");
    setSelected((prev) => {
      const next = new Set(prev);
      perms.forEach((p) => (checked ? next.add(p.id) : next.delete(p.id)));
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetchWithAuth(`/api/roles/${id}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permission_ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save permissions");
      setSuccess("Permissions saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDetails(e) {
    e.preventDefault();
    setSavingDetails(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetchWithAuth(`/api/roles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, scope }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role");
      setRole(data.role);
      setSuccess("Role updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingDetails(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetchWithAuth(`/api/roles/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete role");
      router.push("/admin/roles");
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-[#8FA0B3]">Loading…</div>;
  }
  if (!role) {
    return (
      <div className="p-6 text-sm text-red-600">
        {error || "Role not found"}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-start justify-between">
        <h1 className="text-2xl font-semibold text-[#10243A] dark:text-[#EDEBE3]">
          Edit Role
        </h1>
        <button
          onClick={handleDelete}
          className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/30"
        >
          Delete Role
        </button>
      </div>

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
        onSubmit={handleSaveDetails}
        className="mb-8 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#0F1C2E]"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-[#5B6472] dark:text-[#C7CDD6]">
              Role name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
        </div>
        <button
          type="submit"
          disabled={savingDetails}
          className="mt-3 rounded-xl bg-[#10243A] px-4 py-2 text-sm font-medium text-[#EDEBE3] transition-colors hover:bg-[#0B1826] disabled:opacity-50"
        >
          {savingDetails ? "Saving…" : "Save Role Details"}
        </button>
      </form>

      <h2
        id="permissions"
        className="mb-3 scroll-mt-6 text-sm font-semibold text-[#10243A] dark:text-[#EDEBE3]"
      >
        Permissions
      </h2>

      <div className="space-y-5">
        {Object.entries(grouped).map(([category, perms]) => {
          const allChecked = perms.every((p) => selected.has(p.id));
          return (
            <div
              key={category}
              className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#0F1C2E]"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium capitalize text-[#10243A] dark:text-[#EDEBE3]">
                  {category}
                </h3>
                <label className="flex items-center gap-2 text-xs text-[#8FA0B3]">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={(e) => toggleCategory(perms, e.target.checked)}
                    className="h-4 w-4 rounded border-black/20 dark:border-white/20"
                  />
                  Select all
                </label>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {perms.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-start gap-2 text-sm text-[#5B6472] dark:text-[#C7CDD6]"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggle(p.id)}
                      className="mt-0.5 h-4 w-4 rounded border-black/20 dark:border-white/20"
                    />
                    <span>
                      <span className="font-mono text-xs">{p.code}</span>
                      {p.description && (
                        <span className="block text-xs text-[#8FA0B3]">
                          {p.description}
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-[#10243A] px-4 py-2 text-sm font-medium text-[#EDEBE3] transition-colors hover:bg-[#0B1826] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Permissions"}
        </button>
      </div>
    </div>
  );
}
