"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

export default function OwnersListPage() {
  const router = useRouter();
  const [owners, setOwners] = useState([]);
  const [totalDue, setTotalDue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  async function loadOwners() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      const res = await fetchWithAuth(`/api/owners?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401) return router.push("/login");
        throw new Error("Failed to load owners");
      }
      const data = await res.json();
      setOwners(data.owners || []);
      setTotalDue(data.total_monthly_due || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(loadOwners, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#10243A] dark:text-[#EDEBE3]">
          Hotel Owners
        </h1>
        <Link
          href="/admin/owners/create"
          className="rounded-xl bg-[#10243A] px-4 py-2 text-sm font-medium text-[#EDEBE3] transition-colors hover:bg-[#0B1826]"
        >
          + New Owner
        </Link>
      </div>

      <input
        type="text"
        placeholder="Search by name, email, phone, or username…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-4 w-full max-w-sm rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/10"
      />

      {!loading && owners.length > 0 && (
        <div className="mb-4 rounded-lg border border-black/10 bg-black/[0.02] px-4 py-2 text-sm dark:border-white/10 dark:bg-white/[0.03]">
          <strong>{owners.length}</strong> owner(s) shown · combined monthly
          due: <strong>{totalDue.toLocaleString()}</strong>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-[#0F1C2E]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 text-xs uppercase text-[#8FA0B3] dark:border-white/10">
            <tr>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">HesabPay</th>
              <th className="px-4 py-3">Hotels</th>
              <th className="px-4 py-3">Branches</th>
              <th className="px-4 py-3">Workers</th>
              <th className="px-4 py-3">Monthly Due</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-6 text-center text-[#8FA0B3]"
                >
                  Loading…
                </td>
              </tr>
            ) : owners.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-6 text-center text-[#8FA0B3]"
                >
                  No owners found.
                </td>
              </tr>
            ) : (
              owners.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-black/5 last:border-0 dark:border-white/5"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/owners/${o.id}`}
                      className="font-medium text-[#2F6690] hover:underline"
                    >
                      {o.full_name}
                    </Link>
                    {o.username && (
                      <div className="text-xs text-[#8FA0B3]">
                        @{o.username}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#8FA0B3]">
                    <div>{o.email || "—"}</div>
                    <div>{o.phone || "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {o.hotels.some((h) => h.hesabpay_account_number) ? (
                      <span className="font-mono text-[#10243A] dark:text-[#EDEBE3]">
                        {
                          o.hotels.find((h) => h.hesabpay_account_number)
                            ?.hesabpay_account_number
                        }
                      </span>
                    ) : (
                      <span className="text-[#8FA0B3]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {o.hotel_count === 0 ? (
                      <span className="text-xs text-[#8FA0B3]">None yet</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {o.hotels.slice(0, 3).map((h) => (
                          <span
                            key={h.id}
                            className="rounded-full bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10"
                          >
                            {h.name}
                          </span>
                        ))}
                        {o.hotels.length > 3 && (
                          <span className="text-xs text-[#8FA0B3]">
                            +{o.hotels.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">{o.total_branches}</td>
                  <td className="px-4 py-3">{o.total_workers}</td>
                  <td className="px-4 py-3">
                    {o.total_monthly_due.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        o.is_active
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-black/5 text-[#8FA0B3] dark:bg-white/10"
                      }`}
                    >
                      {o.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/owners/${o.id}`}
                      className="text-xs font-medium text-[#2F6690] hover:underline"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
