"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

export default function RolesListPage() {
  const router = useRouter();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  async function loadRoles() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      const res = await fetchWithAuth(`/api/roles?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401) return router.push("/hotel/login");
        throw new Error("Failed to load roles");
      }
      const data = await res.json();
      setRoles(data.roles || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(loadRoles, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#10243A] dark:text-[#EDEBE3]">
          Roles &amp; Permissions
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/permissions"
            className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium text-[#10243A] transition-colors hover:bg-black/5 dark:border-white/10 dark:text-[#EDEBE3] dark:hover:bg-white/5"
          >
            Manage Permissions
          </Link>
          <Link
            href="/admin/roles/create"
            className="rounded-xl bg-[#10243A] px-4 py-2 text-sm font-medium text-[#EDEBE3] transition-colors hover:bg-[#0B1826]"
          >
            + New Role
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search roles…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/10"
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-10 text-center text-sm text-[#8FA0B3]">
            Loading…
          </div>
        ) : roles.length === 0 ? (
          <div className="col-span-full py-10 text-center text-sm text-[#8FA0B3]">
            No roles yet.
          </div>
        ) : (
          roles.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-black/10 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-[#0F1C2E]"
            >
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#10243A] dark:text-[#EDEBE3]">
                  {r.name}
                </h2>
                <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-[#8FA0B3] dark:bg-white/10">
                  {r.scope}
                </span>
              </div>
              <div className="mt-3 space-y-1 text-xs text-[#8FA0B3]">
                <div>{r.permission_count} permission(s) assigned</div>
                <div>{r.user_count} user(s) with this role</div>
              </div>
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/admin/roles/${r.id}`}
                  className="flex-1 rounded-lg border border-black/10 px-3 py-1.5 text-center text-xs font-medium text-[#10243A] transition-colors hover:bg-black/5 dark:border-white/10 dark:text-[#EDEBE3] dark:hover:bg-white/5"
                >
                  Edit Role
                </Link>
                <Link
                  href={`/admin/roles/${r.id}#permissions`}
                  className="flex-1 rounded-lg bg-[#10243A] px-3 py-1.5 text-center text-xs font-medium text-[#EDEBE3] transition-colors hover:bg-[#0B1826]"
                >
                  Assign Permissions
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
