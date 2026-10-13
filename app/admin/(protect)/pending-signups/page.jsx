"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const STATUS_TABS = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function PendingSignupsPage() {
  const router = useRouter();
  const [status, setStatus] = useState("pending");
  const [signups, setSignups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState(null); // id currently being approved/rejected
  const [deletingAll, setDeletingAll] = useState(false);
  const [result, setResult] = useState(null); // { hotelName, ownerName, email, phone, hotelSlug } after a successful approve

  async function loadSignups() {
    setLoading(true);
    setError("");
    try {
      const res = await fetchWithAuth(
        `/api/admin/pending-signups?status=${status}`,
      );
      if (!res.ok) {
        if (res.status === 401) return router.push("/login");
        throw new Error("Failed to load signups");
      }
      const data = await res.json();
      setSignups(data.signups || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSignups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function handleApprove(signup) {
    const confirmed = window.confirm(
      `Approve "${signup.hotel_name}"? This creates the hotel account and owner login immediately.`,
    );
    if (!confirmed) return;

    setWorkingId(signup.id);
    setError("");
    try {
      const res = await fetchWithAuth(
        `/api/admin/pending-signups/${signup.id}/approve`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not approve signup");

      setResult({
        hotelName: signup.hotel_name,
        ownerName: signup.owner_name,
        email: signup.email,
        phone: signup.phone,
        hotelSlug: data.hotel_slug,
      });
      setSignups((prev) => prev.filter((s) => s.id !== signup.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setWorkingId(null);
    }
  }

  async function handleReject(signup) {
    const confirmed = window.confirm(
      `Reject "${signup.hotel_name}"? This just marks the signup as rejected — no account is created.`,
    );
    if (!confirmed) return;

    setWorkingId(signup.id);
    setError("");
    try {
      const res = await fetchWithAuth(
        `/api/admin/pending-signups/${signup.id}/reject`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not reject signup");

      setSignups((prev) => prev.filter((s) => s.id !== signup.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setWorkingId(null);
    }
  }

  async function handleDeleteAll() {
    const label = status === "pending" ? "pending" : "rejected";
    const confirmed = window.confirm(
      `Delete ALL ${label} signups (${signups.length})? This can't be undone. Approved signups are never affected.`,
    );
    if (!confirmed) return;

    setDeletingAll(true);
    setError("");
    try {
      const res = await fetchWithAuth(
        `/api/admin/pending-signups?status=${status}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete signups");

      setSignups([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingAll(false);
    }
  }

  const canDeleteAll = status !== "paid"; // never allow bulk-delete on approved signups

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#10243A] dark:text-[#EDEBE3]">
          Signups
        </h1>
      </div>

      {/* Status tabs + bulk delete */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex w-fit gap-1 rounded-xl border border-black/10 bg-black/[0.02] p-1 dark:border-white/10 dark:bg-white/[0.03]">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatus(tab.value)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                status === tab.value
                  ? "bg-[#10243A] text-[#EDEBE3]"
                  : "text-[#8FA0B3] hover:text-[#10243A] dark:hover:text-[#EDEBE3]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {canDeleteAll && signups.length > 0 && (
          <button
            type="button"
            onClick={handleDeleteAll}
            disabled={deletingAll}
            className="rounded-lg border border-red-300 px-3.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-900/40 dark:hover:bg-red-950/30"
          >
            {deletingAll ? "Deleting…" : `Delete all (${signups.length})`}
          </button>
        )}
      </div>

      {/* Post-approve credentials reminder */}
      {result && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
          <p className="font-medium">
            {result.hotelName} is set up (slug: {result.hotelSlug}).
          </p>
          <p className="mt-1">
            {result.ownerName}&apos;s login email is{" "}
            <strong>{result.email || result.phone}</strong>. Their welcome email
            with the temporary password has been sent automatically.
          </p>
          <button
            type="button"
            onClick={() => setResult(null)}
            className="mt-2 text-xs font-medium underline underline-offset-2"
          >
            Dismiss
          </button>
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
              <th className="px-4 py-3">Hotel</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-[#8FA0B3]"
                >
                  Loading…
                </td>
              </tr>
            ) : signups.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-[#8FA0B3]"
                >
                  No {status} signups.
                </td>
              </tr>
            ) : (
              signups.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-black/5 last:border-0 dark:border-white/5"
                >
                  <td className="px-4 py-3 font-medium text-[#10243A] dark:text-[#EDEBE3]">
                    {s.hotel_name}
                  </td>
                  <td className="px-4 py-3">{s.owner_name}</td>
                  <td className="px-4 py-3 text-xs text-[#8FA0B3]">
                    <div>{s.email || "—"}</div>
                    <div>{s.phone || "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{s.subscription_plans?.name ?? "—"}</div>
                    {s.subscription_plans?.price_monthly != null && (
                      <div className="text-xs text-[#8FA0B3]">
                        {Number(
                          s.subscription_plans.price_monthly,
                        ).toLocaleString()}
                        /mo
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#8FA0B3]">
                    {s.created_at
                      ? new Date(s.created_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(s)}
                          disabled={workingId === s.id}
                          className="rounded-lg bg-[#10243A] px-3 py-1.5 text-xs font-medium text-[#EDEBE3] transition-colors hover:bg-[#0B1826] disabled:opacity-60"
                        >
                          {workingId === s.id ? "Working…" : "Approve"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(s)}
                          disabled={workingId === s.id}
                          className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-900/40 dark:hover:bg-red-950/30"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-[#8FA0B3]">
                        {s.status === "paid" ? "Approved" : s.status}
                      </span>
                    )}
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
