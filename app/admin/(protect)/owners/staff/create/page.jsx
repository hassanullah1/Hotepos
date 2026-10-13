"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

const inputClass =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#10243A] dark:border-white/10 dark:bg-[#0F1C2E] dark:text-[#EDEBE3]";
const labelClass =
  "mb-1 block text-sm font-medium text-[#5B6472] dark:text-[#C7CDD6]";

export default function CreateUserPage() {
  const router = useRouter();
  const { t, dir } = useAdminPreferences();

  const [roles, setRoles] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isPlatformActor, setIsPlatformActor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    pin_code: "",
    role_id: "",
    hotel_id: "",
    branch_id: "",
    hired_at: "",
  });

  const selectedRole = roles.find((r) => r.id === form.role_id);

  // Load roles, and try hotels — a 200 there tells us the actor is platform-scoped.
  useEffect(() => {
    async function load() {
      try {
        const rolesRes = await fetchWithAuth("/api/roles");
        if (rolesRes.status === 401) return router.push("/login");
        if (!rolesRes.ok) throw new Error(t.users.loadError);
        const rolesData = await rolesRes.json();
        setRoles(rolesData.roles || []);

        const hotelsRes = await fetchWithAuth("/api/hotels");
        if (hotelsRes.ok) {
          const hotelsData = await hotelsRes.json();
          setHotels(hotelsData.hotels || []);
          setIsPlatformActor(true);
        } else {
          // Not platform-scoped: preload branches within the actor's own hotel.
          const branchesRes = await fetchWithAuth("/api/branches");
          if (branchesRes.ok) {
            const branchesData = await branchesRes.json();
            setBranches(branchesData.branches || []);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // When a platform actor picks a hotel, load that hotel's branches.
  useEffect(() => {
    if (!isPlatformActor) return;
    async function loadBranches() {
      if (!form.hotel_id) {
        setBranches([]);
        return;
      }
      const res = await fetchWithAuth(
        `/api/branches?hotel_id=${form.hotel_id}`,
      );
      if (res.ok) {
        const data = await res.json();
        setBranches(data.branches || []);
      }
    }
    loadBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.hotel_id, isPlatformActor]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.full_name.trim()) return setError(`${t.users.name} is required`);
    if (!form.role_id) return setError("Please select a role");
    if (!form.password && !form.pin_code)
      return setError("Set a password or a PIN code");
    if (selectedRole?.scope === "branch" && !form.branch_id)
      return setError("Please select a branch");

    setSaving(true);
    try {
      const res = await fetchWithAuth("/api/users", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          hotel_id: form.hotel_id || null,
          branch_id: form.branch_id || null,
          hired_at: form.hired_at || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.users.saveError);
      }

      router.push("/admin/users");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6" dir={dir}>
        {t.common.loading}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6" dir={dir}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#10243A] dark:text-[#EDEBE3]">
          + {t.users.addUser}
        </h1>
        <Link
          href="/admin/owners/staff/create"
          className="text-sm font-medium text-[#2F6690] hover:underline"
        >
          ← {t.users.title}
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0F1C2E]"
      >
        <div>
          <label className={labelClass}>{t.users.name}</label>
          <input
            className={inputClass}
            value={form.full_name}
            onChange={(e) => update("full_name", e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t.users.email}</label>
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Username</label>
            <input
              className={inputClass}
              value={form.username}
              onChange={(e) => update("username", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Hired date</label>
            <input
              type="date"
              className={inputClass}
              value={form.hired_at}
              onChange={(e) => update("hired_at", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Password</label>
            <input
              type="password"
              className={inputClass}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Min 8 characters"
            />
          </div>
          <div>
            <label className={labelClass}>POS PIN (quick login)</label>
            <input
              className={inputClass}
              value={form.pin_code}
              onChange={(e) => update("pin_code", e.target.value)}
              maxLength={10}
              placeholder="4–6 digits"
            />
          </div>
        </div>
        <p className="text-xs text-[#8FA0B3]">
          Set at least one of password or PIN. Waiters/cashiers on the floor app
          usually only need a PIN.
        </p>

        <div>
          <label className={labelClass}>{t.users.role}</label>
          <select
            className={inputClass}
            value={form.role_id}
            onChange={(e) => update("role_id", e.target.value)}
            required
          >
            <option value="">Select a role</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.scope})
              </option>
            ))}
          </select>
        </div>

        {isPlatformActor && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t.users.hotel}</label>
              <select
                className={inputClass}
                value={form.hotel_id}
                onChange={(e) => update("hotel_id", e.target.value)}
              >
                <option value="">{t.users.scopePlatform}</option>
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t.users.branch}</label>
              <select
                className={inputClass}
                value={form.branch_id}
                onChange={(e) => update("branch_id", e.target.value)}
                disabled={!form.hotel_id}
              >
                <option value="">—</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {!isPlatformActor && selectedRole?.scope === "branch" && (
          <div>
            <label className={labelClass}>{t.users.branch}</label>
            <select
              className={inputClass}
              value={form.branch_id}
              onChange={(e) => update("branch_id", e.target.value)}
              required
            >
              <option value="">Select a branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/admin/users"
            className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium text-[#5B6472] hover:bg-black/[0.03] dark:border-white/10 dark:text-[#C7CDD6] dark:hover:bg-white/[0.03]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#10243A] px-4 py-2 text-sm font-medium text-[#EDEBE3] transition-colors hover:bg-[#0B1826] disabled:opacity-50"
          >
            {saving ? t.common.loading : t.users.addUser}
          </button>
        </div>
      </form>
    </div>
  );
}
