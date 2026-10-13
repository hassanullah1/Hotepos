"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

const inputClass =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#10243A] dark:border-white/10 dark:bg-[#0F1C2E] dark:text-[#EDEBE3]";
const labelClass =
  "mb-1 block text-sm font-medium text-[#5B6472] dark:text-[#C7CDD6]";
const cardClass =
  "space-y-4 rounded-xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0F1C2E]";

export default function ManageUserPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t, dir } = useAdminPreferences();

  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    username: "",
    hired_at: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [roleId, setRoleId] = useState("");
  const [savingRole, setSavingRole] = useState(false);

  const [creds, setCreds] = useState({ password: "", pin_code: "" });
  const [savingCreds, setSavingCreds] = useState(false);

  const [togglingStatus, setTogglingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [userRes, rolesRes] = await Promise.all([
          fetchWithAuth(`/api/users/${id}`),
          fetchWithAuth("/api/roles"),
        ]);

        if (userRes.status === 401 || rolesRes.status === 401) {
          router.push("/login");
          return;
        }
        if (!userRes.ok) throw new Error(t.users.loadError);

        const userData = await userRes.json();
        const rolesData = await rolesRes.json().catch(() => ({ roles: [] }));

        setUser(userData.user);
        setRoles(rolesData.roles || []);
        setRoleId(userData.user.role_id);
        setProfile({
          full_name: userData.user.full_name || "",
          email: userData.user.email || "",
          phone: userData.user.phone || "",
          username: userData.user.username || "",
          hired_at: userData.user.hired_at
            ? userData.user.hired_at.slice(0, 10)
            : "",
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router]);

  function flashNotice(msg) {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3000);
  }

  async function saveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    setError("");
    try {
      const res = await fetchWithAuth(`/api/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(profile),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.users.saveError);
      }
      const data = await res.json();
      setUser(data.user);
      flashNotice("Profile updated");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveRole() {
    setSavingRole(true);
    setError("");
    try {
      const res = await fetchWithAuth(`/api/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ roleId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.users.saveError);
      }
      const data = await res.json();
      setUser(data.user);
      flashNotice("Role updated");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingRole(false);
    }
  }

  async function saveCreds(e) {
    e.preventDefault();
    if (!creds.password && !creds.pin_code) {
      setError("Enter a new password or PIN");
      return;
    }
    setSavingCreds(true);
    setError("");
    try {
      const res = await fetchWithAuth(`/api/users/${id}/password`, {
        method: "PATCH",
        body: JSON.stringify(creds),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.users.saveError);
      }
      setCreds({ password: "", pin_code: "" });
      flashNotice("Credentials updated");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingCreds(false);
    }
  }

  async function toggleStatus() {
    setTogglingStatus(true);
    setError("");
    try {
      const res = await fetchWithAuth(`/api/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.users.saveError);
      }
      const data = await res.json();
      setUser(data.user);
      flashNotice(data.user.is_active ? "User activated" : "User deactivated");
    } catch (err) {
      setError(err.message);
    } finally {
      setTogglingStatus(false);
    }
  }

  async function handleDelete() {
    if (!confirm(t.users.confirmDelete)) return;
    setDeleting(true);
    try {
      const res = await fetchWithAuth(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.users.deleteError);
      }
      router.push("/admin/users");
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6" dir={dir}>
        {t.common.loading}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6" dir={dir}>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30">
          {error || t.users.loadError}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6" dir={dir}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#10243A] dark:text-[#EDEBE3]">
            {user.full_name}
          </h1>
          <p className="text-sm text-[#8FA0B3]">
            {user.role_name}
            {" · "}
            <span
              className={user.is_active ? "text-emerald-600" : "text-red-500"}
            >
              {user.is_active ? "Active" : "Inactive"}
            </span>
          </p>
        </div>
        <Link
          href="/admin/users"
          className="text-sm font-medium text-[#2F6690] hover:underline"
        >
          ← {t.users.title}
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30">
          {notice}
        </div>
      )}

      {/* Profile */}
      <form onSubmit={saveProfile} className={cardClass}>
        <h2 className="font-medium text-[#10243A] dark:text-[#EDEBE3]">
          Profile
        </h2>
        <div>
          <label className={labelClass}>{t.users.name}</label>
          <input
            className={inputClass}
            value={profile.full_name}
            onChange={(e) =>
              setProfile((p) => ({ ...p, full_name: e.target.value }))
            }
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t.users.email}</label>
            <input
              type="email"
              className={inputClass}
              value={profile.email}
              onChange={(e) =>
                setProfile((p) => ({ ...p, email: e.target.value }))
              }
            />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input
              className={inputClass}
              value={profile.phone}
              onChange={(e) =>
                setProfile((p) => ({ ...p, phone: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Username</label>
            <input
              className={inputClass}
              value={profile.username}
              onChange={(e) =>
                setProfile((p) => ({ ...p, username: e.target.value }))
              }
            />
          </div>
          <div>
            <label className={labelClass}>Hired date</label>
            <input
              type="date"
              className={inputClass}
              value={profile.hired_at}
              onChange={(e) =>
                setProfile((p) => ({ ...p, hired_at: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingProfile}
            className="rounded-xl bg-[#10243A] px-4 py-2 text-sm font-medium text-[#EDEBE3] hover:bg-[#0B1826] disabled:opacity-50"
          >
            {savingProfile ? t.common.loading : "Save profile"}
          </button>
        </div>
      </form>

      {/* Role */}
      <div className={cardClass}>
        <h2 className="font-medium text-[#10243A] dark:text-[#EDEBE3]">
          {t.users.role}
        </h2>
        <select
          className={inputClass}
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.scope})
            </option>
          ))}
        </select>
        <div className="flex justify-end">
          <button
            onClick={saveRole}
            disabled={savingRole || roleId === user.role_id}
            className="rounded-xl bg-[#10243A] px-4 py-2 text-sm font-medium text-[#EDEBE3] hover:bg-[#0B1826] disabled:opacity-50"
          >
            {savingRole ? t.common.loading : "Update role"}
          </button>
        </div>
      </div>

      {/* Credentials */}
      <form onSubmit={saveCreds} className={cardClass}>
        <h2 className="font-medium text-[#10243A] dark:text-[#EDEBE3]">
          Reset credentials
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>New password</label>
            <input
              type="password"
              className={inputClass}
              value={creds.password}
              onChange={(e) =>
                setCreds((c) => ({ ...c, password: e.target.value }))
              }
              placeholder="Leave blank to keep current"
            />
          </div>
          <div>
            <label className={labelClass}>New POS PIN</label>
            <input
              className={inputClass}
              value={creds.pin_code}
              onChange={(e) =>
                setCreds((c) => ({ ...c, pin_code: e.target.value }))
              }
              maxLength={10}
              placeholder="Leave blank to keep current"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingCreds}
            className="rounded-xl bg-[#10243A] px-4 py-2 text-sm font-medium text-[#EDEBE3] hover:bg-[#0B1826] disabled:opacity-50"
          >
            {savingCreds ? t.common.loading : "Update credentials"}
          </button>
        </div>
      </form>

      {/* Danger zone */}
      <div className={cardClass}>
        <h2 className="font-medium text-[#10243A] dark:text-[#EDEBE3]">
          Account status
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#5B6472] dark:text-[#C7CDD6]">
            {user.is_active
              ? "This user can currently log in and use the system."
              : "This user is deactivated and cannot log in."}
          </p>
          <button
            onClick={toggleStatus}
            disabled={togglingStatus}
            className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/[0.03] disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/[0.03]"
          >
            {togglingStatus
              ? t.common.loading
              : user.is_active
                ? "Deactivate"
                : "Activate"}
          </button>
        </div>
        <div className="flex items-center justify-between border-t border-black/5 pt-4 dark:border-white/5">
          <p className="text-sm text-[#5B6472] dark:text-[#C7CDD6]">
            Permanently remove this user.
          </p>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/40 dark:hover:bg-red-950/30"
          >
            {deleting ? t.common.loading : t.users.deleteLink}
          </button>
        </div>
      </div>
    </div>
  );
}
