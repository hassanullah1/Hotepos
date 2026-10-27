"use client";

import { useState, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

export default function RequestLeavePage({ params }) {
  const { id } = usePromise(params);
  const router = useRouter();
  const { dir } = useAdminPreferences();

  const [form, setForm] = useState({
    leave_type: "annual",
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(ev) {
    ev.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetchWithAuth(
        `/api/owners/staff/${id}/attendance/request`,
        {
          method: "POST",
          body: JSON.stringify(form),
        },
      );
      if (res.status === 401) return router.push("/hotel/login");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit request");
      router.push(`/admin/owners/attendance/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="p-6 max-w-lg mx-auto dark:bg-gray-900 dark:text-gray-100"
      dir={dir}
    >
      <button
        onClick={() => router.push(`/admin/owners/attendance/${id}`)}
        className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1 mb-4"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <h1 className="text-xl font-semibold mb-4">Request leave</h1>

      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-3">{error}</p>
      )}

      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={form.leave_type}
            onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="annual">Annual</option>
            <option value="sick">Sick</option>
            <option value="unpaid">Unpaid</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div />
        <div>
          <label className="block text-sm font-medium mb-1">Start date *</label>
          <input
            type="date"
            required
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End date *</label>
          <input
            type="date"
            required
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Reason</label>
          <textarea
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
            rows={3}
          />
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-md text-sm disabled:opacity-50"
          >
            {saving ? "Submitting..." : "Submit request"}
          </button>
        </div>
      </form>
    </div>
  );
}
