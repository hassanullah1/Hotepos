"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  X,
  Check,
  LayoutGrid,
  Loader2,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const inputClass =
  "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500";
const labelClass =
  "mb-1 block text-sm font-medium text-gray-600 dark:text-gray-400";
const cardClass =
  "rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm";

function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}
function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export default function SectionsPage() {
  const router = useRouter();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      // show ALL sections here (active + inactive) — the API filters by default,
      // so hit prisma through a plain call: we accept `include_inactive`
      const res = await fetchWithAuth("/api/sections?include_inactive=1");
      if (!res.ok) {
        if (res.status === 401) return router.push("/hotel/login");
        throw new Error("Failed to load sections");
      }
      const data = await res.json();
      setSections(data.sections || []);
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

  async function toggleActive(s) {
    setBusyId(s.id);
    try {
      const res = await fetchWithAuth(`/api/sections/${s.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !s.is_active }),
      });
      if (!res.ok) throw new Error("Failed to update");
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(s) {
    if (!confirm(`Delete section "${s.name}"? This cannot be undone.`)) return;
    setBusyId(s.id);
    try {
      const res = await fetchWithAuth(`/api/sections/${s.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete");
      }
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }
  function openEdit(s) {
    setEditing(s);
    setShowForm(true);
  }
  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            <LayoutGrid size={22} /> Sections
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            The master list of gateable app sections. Plans can include or
            exclude each one.
          </p>
        </div>
        <PrimaryButton onClick={openCreate}>
          <Plus size={16} /> Add section
        </PrimaryButton>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <div className={cardClass}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                {[
                  "Key",
                  "Name",
                  "Description",
                  "Order",
                  "Status",
                  "Actions",
                ].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 ${
                      i === 5 ? "text-right" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    <Loader2 size={16} className="mx-auto animate-spin" />
                  </td>
                </tr>
              ) : sections.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No sections yet — click “Add section” to create the first
                    one.
                  </td>
                </tr>
              ) : (
                sections.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-teal-50/50 dark:hover:bg-teal-900/10"
                  >
                    <td className="px-4 py-3 font-mono text-sm text-gray-700 dark:text-gray-300">
                      {s.key}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {s.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-md truncate">
                      {s.description || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {s.sort_order ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.is_active
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {s.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => toggleActive(s)}
                          disabled={busyId === s.id}
                          className="rounded p-1 text-gray-400 hover:text-amber-600 disabled:opacity-50"
                          title={s.is_active ? "Deactivate" : "Activate"}
                        >
                          {s.is_active ? (
                            <PowerOff size={16} />
                          ) : (
                            <Power size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => openEdit(s)}
                          className="rounded p-1 text-gray-400 hover:text-teal-600"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          disabled={busyId === s.id}
                          className="rounded p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <SectionForm
          section={editing}
          onSaved={async () => {
            closeForm();
            await load();
          }}
          onCancel={closeForm}
        />
      )}
    </div>
  );
}

function SectionForm({ section, onSaved, onCancel }) {
  const isEdit = !!section;
  const [form, setForm] = useState({
    key: section?.key ?? "",
    name: section?.name ?? "",
    description: section?.description ?? "",
    sort_order: section?.sort_order ?? 0,
    is_active: section?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = isEdit ? `/api/sections/${section.id}` : "/api/sections";
      const method = isEdit ? "PATCH" : "POST";
      const body = isEdit
        ? {
            name: form.name,
            description: form.description,
            sort_order: Number(form.sort_order),
            is_active: form.is_active,
          }
        : {
            key: form.key,
            name: form.name,
            description: form.description,
            sort_order: Number(form.sort_order),
            is_active: form.is_active,
          };
      const res = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Save failed");
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isEdit ? "Edit section" : "New section"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className={labelClass}>Key (machine name, immutable)</label>
            <input
              required
              type="text"
              disabled={isEdit}
              placeholder="e.g. rooms, pos, payroll"
              value={form.key}
              onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
              className={inputClass + (isEdit ? " opacity-60" : "")}
            />
          </div>
          <div>
            <label className={labelClass}>Display name</label>
            <input
              required
              type="text"
              placeholder="e.g. Rooms & Stays"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Description (optional)</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Sort order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sort_order: e.target.value }))
                }
                className={inputClass}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_active: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                Active
              </label>
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <PrimaryButton type="submit" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create section"}
          </PrimaryButton>
          <SecondaryButton type="button" onClick={onCancel}>
            Cancel
          </SecondaryButton>
        </div>
      </form>
    </div>
  );
}
