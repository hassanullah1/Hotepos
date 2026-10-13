"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Search, CalendarCheck, ClipboardList } from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";
import { LOCALES } from "@/lib/i18n/translations";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const fieldClass =
  "border border-teal-200 dark:border-teal-800 rounded-full px-3.5 py-2 text-sm bg-white dark:bg-teal-950 text-teal-900 dark:text-teal-100 placeholder:text-teal-400 dark:placeholder:text-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400";

export default function AttendancePage() {
  const router = useRouter();
  const { t, dir, locale, setLocale } = useAdminPreferences();

  // ---------- who is logged in ----------
  const [me, setMe] = useState(null);
  const isOwner = me?.role === "hotel_owner";
  const isBranchManager = me?.role === "branch_manager";

  // ---------- owner-only: hotel + branch selection ----------
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");

  const [branches, setBranches] = useState([]);
  const [branchesHotelId, setBranchesHotelId] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchFilter, setBranchFilter] = useState("");

  const [month, setMonth] = useState(currentMonth());
  const [q, setQ] = useState("");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const branchesReady = !loadingBranches && branchesHotelId === selectedHotelId;

  // ---------- load current user ----------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth("/api/auth/me");
        if (!res.ok) {
          if (res.status === 401) return router.push("/login");
          throw new Error(t.common.loadUserError || "Failed to load user");
        }
        const data = await res.json();
        setMe(data.user);
      } catch (err) {
        setError(err.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- owner: load owned hotels ----------
  async function loadHotels() {
    try {
      const res = await fetchWithAuth("/api/owners/hotel");
      if (!res.ok) {
        if (res.status === 401) return router.push("/login");
        throw new Error(t.attendance.errors.loadHotels);
      }
      const data = await res.json();
      setHotels(data.hotels || []);
      const defaultHotelId = data.selectedHotelId || data.hotels?.[0]?.id || "";
      setSelectedHotelId(defaultHotelId);
    } catch (err) {
      setError(err.message);
    }
  }

  // ---------- owner: load branches for selected hotel ----------
  async function loadBranches(hotelId) {
    if (!hotelId) return;
    setLoadingBranches(true);
    setBranches([]);
    setBranchesHotelId("");
    try {
      const res = await fetchWithAuth(`/api/branches?hotel_id=${hotelId}`);
      if (!res.ok) {
        if (res.status === 401) return router.push("/login");
        throw new Error(t.attendance.errors.loadBranches);
      }
      const data = await res.json();
      setSelectedHotelId((current) => {
        if (current === hotelId) {
          setBranches(data.branches || []);
          setBranchesHotelId(hotelId);
          setError("");
        }
        return current;
      });
    } catch (err) {
      setError(err.message);
      setBranches([]);
      setBranchesHotelId("");
    } finally {
      setLoadingBranches(false);
    }
  }

  // ---------- load attendance data ----------
  async function loadAttendance() {
    if (!me) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({ month });
      if (q) params.set("q", q);

      if (isOwner) {
        if (!selectedHotelId) return;
        params.set("hotel_id", selectedHotelId);
        if (branchFilter) params.set("branch_id", branchFilter);
      } else if (isBranchManager) {
        if (!me.branch?.id) return;
        params.set("branch_id", me.branch.id);
        // Optionally also send hotel_id if the endpoint requires it
        if (me.branch.hotel_id) params.set("hotel_id", me.branch.hotel_id);
      } else {
        // fallback – treat as owner
        if (!selectedHotelId) return;
        params.set("hotel_id", selectedHotelId);
        if (branchFilter) params.set("branch_id", branchFilter);
      }

      const res = await fetchWithAuth(
        `/api/owners/attendance?${params.toString()}`,
      );
      if (!res.ok) {
        if (res.status === 401) return router.push("/login");
        throw new Error(t.attendance.errors.loadAttendance);
      }
      const data = await res.json();
      setRows(data.staff || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ---------- initialisation ----------
  useEffect(() => {
    if (isOwner) {
      loadHotels();
    } else if (isBranchManager) {
      // For branch manager, set branch filter to their branch
      if (me?.branch?.id) {
        setBranchFilter(me.branch.id);
        // Also set selectedHotelId to the branch's hotel_id (not strictly needed)
        if (me.branch.hotel_id) setSelectedHotelId(me.branch.hotel_id);
        // No need to load hotels/branches – we already have the branch
        setBranches([me.branch]);
        setBranchesHotelId(me.branch.hotel_id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, isBranchManager, me]);

  // Owner: when hotel changes, reload branches and staff
  useEffect(() => {
    if (isOwner && selectedHotelId) {
      setBranchFilter("");
      setError("");
      loadBranches(selectedHotelId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, selectedHotelId]);

  // Debounced load
  useEffect(() => {
    const timer = setTimeout(loadAttendance, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, branchFilter, selectedHotelId, month, me]);

  // ---------- render ----------
  if (!me) {
    return (
      <div className="min-h-screen bg-[#F4FAF9] dark:bg-[#0B2624] p-6 flex items-center justify-center">
        <p className="text-sm text-teal-700/70 dark:text-teal-300/70">
          {t.common.loading || "Loading..."}
        </p>
      </div>
    );
  }

  const selectedHotelName =
    hotels.find((h) => h.id === selectedHotelId)?.name || "";

  return (
    <div className="min-h-screen light:bg-[#F4FAF9]  p-6" dir={dir}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-900/10 shrink-0">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-teal-950 dark:text-teal-50 tracking-tight">
                {t.attendance.title}
              </h1>
              {isOwner && hotels.length === 1 && (
                <p className="text-sm text-teal-700/70 dark:text-teal-300/70 mt-0.5">
                  {selectedHotelName}
                </p>
              )}
              {isOwner && hotels.length > 1 && (
                <div className="mt-1 flex items-center gap-2">
                  <label
                    htmlFor="hotel-select"
                    className="text-xs text-teal-700/70 dark:text-teal-300/70"
                  >
                    {t.attendance.hotelLabel}
                  </label>
                  <select
                    id="hotel-select"
                    value={selectedHotelId}
                    onChange={(e) => setSelectedHotelId(e.target.value)}
                    className={fieldClass}
                  >
                    {hotels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {isBranchManager && (
                <p className="text-sm text-teal-700/70 dark:text-teal-300/70 mt-0.5">
                  {me.branch?.name || t.attendance.branchLabel}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/owners/attendance/today")}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm shadow-teal-900/20 whitespace-nowrap transition-colors"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              {t.attendance.takeToday}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-2.5 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 mb-5">
          {/* Branch filter – only for owners */}
          {isOwner && (
            <select
              id="branch-select"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className={fieldClass}
            >
              <option value="">{t.attendance.allBranches}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className={fieldClass}
          />

          <div className="relative flex-1 min-w-[180px] max-w-[240px]">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3.5 h-3.5 w-3.5 text-teal-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.attendance.searchPlaceholder}
              className={`w-full ps-9 pe-3.5 ${fieldClass}`}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="rounded-2xl border border-teal-200 dark:border-teal-800 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-12 border-b last:border-b-0 border-teal-100 dark:border-teal-800/60 bg-teal-100/40 dark:bg-teal-900/20 animate-pulse"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 rounded-2xl border border-dashed border-teal-200 dark:border-teal-800">
            <CalendarCheck className="h-8 w-8 text-teal-300 dark:text-teal-700 mb-3" />
            <p className="text-sm text-teal-700/70 dark:text-teal-300/70">
              {t.attendance.noStaff}
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-2xl border border-teal-200 dark:border-teal-800">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-teal-600 dark:bg-teal-700 text-white">
                  <th className="text-start font-medium py-3 whitespace-nowrap ps-4 pe-4">
                    {t.attendance.columns.name}
                  </th>
                  <th className="text-start font-medium whitespace-nowrap pe-4">
                    {t.attendance.columns.branch}
                  </th>
                  <th className="text-start font-medium whitespace-nowrap pe-4">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                      {t.attendance.columns.present}
                    </span>
                  </th>
                  <th className="text-start font-medium whitespace-nowrap pe-4">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                      {t.attendance.columns.requested}
                    </span>
                  </th>
                  <th className="text-start font-medium whitespace-nowrap pe-4">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-300" />
                      {t.attendance.columns.absent}
                    </span>
                  </th>
                  <th className="pe-4 w-16" />
                </tr>
              </thead>
              <tbody>
                {rows.map((s, idx) => (
                  <tr
                    key={s.id}
                    className={`border-t border-teal-100 dark:border-teal-800/50 hover:bg-teal-50 dark:hover:bg-teal-900/40 transition-colors ${
                      idx % 2 === 1
                        ? "bg-teal-50/50 dark:bg-teal-950/30"
                        : "bg-white dark:bg-transparent"
                    }`}
                  >
                    <td className="py-3 whitespace-nowrap ps-4 pe-4 font-semibold text-teal-950 dark:text-white">
                      {s.full_name}
                    </td>
                    <td className="whitespace-nowrap pe-4 text-teal-700/80 dark:text-teal-300/70">
                      {s.branch?.name || "—"}
                    </td>
                    <td className="whitespace-nowrap pe-4">
                      <span className="inline-flex items-center justify-center min-w-[1.75rem] rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 text-xs font-medium">
                        {s.present_days}
                      </span>
                    </td>
                    <td className="whitespace-nowrap pe-4">
                      <span className="inline-flex items-center justify-center min-w-[1.75rem] rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 text-xs font-medium">
                        {s.requested_days}
                      </span>
                    </td>
                    <td className="whitespace-nowrap pe-4">
                      <span className="inline-flex items-center justify-center min-w-[1.75rem] rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 px-2 py-0.5 text-xs font-medium">
                        {s.absent_days}
                      </span>
                    </td>
                    <td className="whitespace-nowrap pe-4">
                      <button
                        onClick={() =>
                          router.push(`/admin/owners/attendance/${s.id}`)
                        }
                        title={t.attendance.view}
                        aria-label={t.attendance.view}
                        className="text-teal-700/70 hover:text-teal-700 hover:bg-teal-100 dark:text-teal-300/70 dark:hover:text-teal-200 dark:hover:bg-teal-900 p-1.5 rounded-full transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
