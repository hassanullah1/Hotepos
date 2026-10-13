"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";
import { LOCALES } from "@/lib/i18n/translations";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [togglingStatus, setTogglingStatus] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const router = useRouter();
  const { t, locale, setLocale, dir } = useAdminPreferences();

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersRes, rolesRes] = await Promise.all([
          fetchWithAuth("/api/users"),
          fetchWithAuth("/api/roles"),
        ]);

        if (!usersRes.ok || !rolesRes.ok) {
          if (usersRes.status === 401 || rolesRes.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error(t.users.loadError);
        }

        const usersData = await usersRes.json();
        const rolesData = await rolesRes.json();
        setUsers(usersData.users || []);
        setRoles(rolesData.roles || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleRoleChange(userId, newRoleId) {
    setUpdating(userId);
    try {
      const res = await fetchWithAuth(`/api/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ roleId: newRoleId }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.users.saveError);
      }

      const data = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === userId ? data.user : u)));
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(null);
    }
  }

  async function handleToggleStatus(user) {
    setTogglingStatus(user.id);
    try {
      const res = await fetchWithAuth(`/api/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.users.saveError);
      }
      const data = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === user.id ? data.user : u)));
    } catch (err) {
      alert(err.message);
    } finally {
      setTogglingStatus(null);
    }
  }

  async function handleDelete(userId) {
    if (!confirm(t.users.confirmDelete)) return;
    setDeleting(userId);
    try {
      const res = await fetchWithAuth(`/api/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.users.deleteError);
      }
      // Deletion is a soft-delete server-side (is_active -> false), so
      // reflect that instead of removing the row from the list.
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: false } : u)),
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  }

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (
        q &&
        !(
          u.full_name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
        )
      ) {
        return false;
      }
      if (roleFilter && u.role_id !== roleFilter) return false;
      if (statusFilter === "active" && !u.is_active) return false;
      if (statusFilter === "inactive" && u.is_active) return false;
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  return (
    <div className="p-6" dir={dir}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-[#10243A] dark:text-[#EDEBE3]">
          {t.users.title}
        </h1>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/users/create"
            className="rounded-xl bg-[#10243A] px-4 py-2 text-sm font-medium text-[#EDEBE3] transition-colors hover:bg-[#0B1826]"
          >
            + {t.users.addUser}
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.users.searchPlaceholder}
          className="w-full max-w-sm rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#0F1C2E] dark:text-[#EDEBE3]"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#0F1C2E] dark:text-[#EDEBE3]"
        >
          <option value="">{t.users.role} — all</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#0F1C2E] dark:text-[#EDEBE3]"
        >
          <option value="">Status — all</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <div className="rounded-lg border border-black/10 bg-white p-6 text-sm text-[#5B6472] dark:border-white/10 dark:bg-[#0F1C2E] dark:text-[#C7CDD6]">
          {t.common.loading}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30">
          {error}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-[#0F1C2E]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.02]">
                <th className="px-4 text-xs py-3 text-start  text-[#5B6472] dark:text-[#C7CDD6]">
                  {t.users.name}
                </th>
                <th className="px-4 text-xs py-3 text-start  text-[#5B6472] dark:text-[#C7CDD6]">
                  {t.users.email}
                </th>
                <th className="px-4 text-xs py-3 text-start  text-[#5B6472] dark:text-[#C7CDD6]">
                  {t.users.role}
                </th>
                <th className="px-4 text-xs py-3 text-start  text-[#5B6472] dark:text-[#C7CDD6]">
                  {t.users.hotel} / {t.users.branch}
                </th>
                <th className="px-4 text-xs py-3 text-start  text-[#5B6472] dark:text-[#C7CDD6]">
                  Status
                </th>
                <th className="px-4 text-xs py-3 text-start  text-[#5B6472] dark:text-[#C7CDD6]">
                  {t.users.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-[#8FA0B3]"
                  >
                    {t.users.noResults}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-black/5 last:border-0 dark:border-white/5"
                  >
                    <td className="px-4 py-3 text-[#10243A] dark:text-[#EDEBE3]">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="hover:underline text-blue-600"
                      >
                        {user.full_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#5B6472] dark:text-[#C7CDD6]">
                      {user.email || t.users.noEmail}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role_id}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value)
                        }
                        disabled={updating === user.id}
                        className="rounded-lg border border-black/10 bg-transparent px-2 py-1 dark:border-white/10"
                      >
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-[#5B6472] dark:text-[#C7CDD6]">
                      {user.hotel_name || user.branch_name
                        ? [user.hotel_name, user.branch_name]
                            .filter(Boolean)
                            .join(" / ")
                        : t.users.scopePlatform}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                          user.is_active
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                        }`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                          className="font-medium text-[#2F6690] hover:underline"
                        >
                          {t.users.editLink}
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={togglingStatus === user.id}
                          className="font-medium text-[#5B6472] hover:underline disabled:opacity-50 dark:text-[#C7CDD6]"
                        >
                          {user.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={deleting === user.id || !user.is_active}
                          className="font-medium text-red-600 hover:underline disabled:opacity-50"
                        >
                          {t.users.deleteLink}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
