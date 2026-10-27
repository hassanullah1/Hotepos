"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock3, X, CalendarCheck, Loader2, Search } from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";
import { LOCALES } from "@/lib/i18n/translations";

const STATUS_OPTIONS = [
  {
    key: "present",
    label: "Present",
    icon: <Check size={14} strokeWidth={3} />,
    cls: "bg-emerald-600 text-white",
  },
  {
    key: "late",
    label: "Late",
    icon: <Clock3 size={14} strokeWidth={3} />,
    cls: "bg-amber-600 text-white",
  },
  {
    key: "absent",
    label: "Absent",
    icon: <X size={14} strokeWidth={3} />,
    cls: "bg-red-600 text-white",
  },
];

const fieldClass =
  "border border-teal-200 dark:border-teal-800 rounded-full px-3.5 py-2 text-sm bg-white dark:bg-teal-950 text-teal-900 dark:text-teal-100 placeholder:text-teal-400 dark:placeholder:text-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400";

export default function TakeTodayAttendancePage() {
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

  const [q, setQ] = useState("");
  const [staff, setStaff] = useState([]);
  const [today, setToday] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selections, setSelections] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  const branchesReady = !loadingBranches && branchesHotelId === selectedHotelId;

  // ---------- load current user ----------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth("/api/auth/me");
        if (!res.ok) {
          if (res.status === 401) return router.push("/hotel/login");
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
        if (res.status === 401) return router.push("/hotel/login");
        throw new Error(t.attendanceToday.errors.loadHotels);
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
        if (res.status === 401) return router.push("/hotel/login");
        throw new Error(t.attendanceToday.errors.loadBranches);
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

  // ---------- load staff for today ----------
  async function loadStaff() {
    if (!me) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);

      if (isOwner) {
        if (!selectedHotelId) return;
        params.set("hotel_id", selectedHotelId);
        if (branchFilter) params.set("branch_id", branchFilter);
      } else if (isBranchManager) {
        if (!me.branch?.id) return;
        params.set("branch_id", me.branch.id);
        // Optionally also send hotel_id if needed
        if (me.branch.hotel_id) params.set("hotel_id", me.branch.hotel_id);
      } else {
        // fallback – treat as owner
        if (!selectedHotelId) return;
        params.set("hotel_id", selectedHotelId);
        if (branchFilter) params.set("branch_id", branchFilter);
      }

      const res = await fetchWithAuth(
        `/api/owners/attendance/today?${params.toString()}`,
      );
      if (!res.ok) {
        if (res.status === 401) return router.push("/hotel/login");
        throw new Error(t.attendanceToday.errors.loadStaff);
      }
      const data = await res.json();
      setStaff(data.staff || []);
      setToday(data.date || "");
      setSelections({});
      setError("");
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

  // Debounced staff load
  useEffect(() => {
    const timer = setTimeout(loadStaff, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, branchFilter, selectedHotelId, me]);

  // ---------- handlers ----------
  function setPick(userId, status) {
    setSelections((cur) => ({ ...cur, [userId]: status }));
  }

  function markAllPresent() {
    const next = {};
    for (const s of staff) next[s.id] = "present";
    setSelections(next);
  }

  function clearSelections() {
    setSelections({});
  }

  function effectiveStatus(s) {
    return selections[s.id] ?? s.today_status ?? null;
  }

  const pendingCount = Object.keys(selections).length;

  async function saveAll() {
    if (pendingCount === 0) return;
    setSaving(true);
    setSavedMsg("");
    try {
      const records = Object.entries(selections).map(([user_id, status]) => ({
        user_id,
        status,
      }));
      const res = await fetchWithAuth("/api/owners/attendance/today", {
        method: "POST",
        body: JSON.stringify({ records }),
      });
      if (res.status === 401) return router.push("/hotel/login");
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || t.attendanceToday.errors.saveAttendance);

      const peopleWord =
        records.length === 1
          ? t.attendanceToday.peopleOne
          : t.attendanceToday.peopleMany;
      setSavedMsg(
        t.attendanceToday.savedMessage
          .replace("{count}", records.length)
          .replace("{people}", peopleWord),
      );
      loadStaff();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

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

  const formattedDate = today
    ? new Date(`${today}T00:00:00Z`).toLocaleDateString(locale, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : "";

  return (
    <div className="min-h-screen light:bg-[#F4FAF9]  p-6 pb-28" dir={dir}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-900/10 shrink-0">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-teal-950 dark:text-teal-50 tracking-tight">
                {t.attendanceToday.title}
              </h1>
              <p className="text-sm text-teal-700/70 dark:text-teal-300/70 mt-0.5">
                {formattedDate}
              </p>
            </div>
          </div>
        </div>

        {/* Hotel selector – only for owners with >1 hotel */}
        {isOwner && hotels.length > 1 && (
          <div className="mb-3 flex items-center gap-2">
            <label className="text-xs text-teal-700/70 dark:text-teal-300/70 whitespace-nowrap">
              {t.attendanceToday.hotelLabel}
            </label>
            <select
              value={selectedHotelId}
              onChange={(e) => setSelectedHotelId(e.target.value)}
              className={`${fieldClass} min-w-0 truncate`}
            >
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {isOwner && hotels.length === 1 && (
          <p className="text-sm text-teal-700/70 dark:text-teal-300/70 mb-3">
            {selectedHotelName}
          </p>
        )}
        {isBranchManager && (
          <p className="text-sm text-teal-700/70 dark:text-teal-300/70 mb-3">
            {me.branch?.name || t.attendanceToday.branchLabel}
          </p>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-2.5 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
        {savedMsg && (
          <div className="mb-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-300">
            {savedMsg}
          </div>
        )}

        {/* Branch filter + search + bulk actions */}
        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          {isOwner && (
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className={fieldClass}
            >
              <option value="">{t.attendanceToday.allBranches}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          <div className="relative flex-1 min-w-[160px] max-w-[220px]">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3.5 h-3.5 w-3.5 text-teal-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.attendanceToday.searchPlaceholder}
              className={`w-full ps-9 pe-3.5 ${fieldClass}`}
            />
          </div>

          <button
            onClick={markAllPresent}
            disabled={loading || staff.length === 0}
            className="ms-auto text-sm px-3.5 py-2 rounded-full border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-900/50 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {t.attendanceToday.markAllPresent}
          </button>
          {pendingCount > 0 && (
            <button
              onClick={clearSelections}
              className="text-sm px-3.5 py-2 rounded-full border border-teal-200 dark:border-teal-800 text-teal-600/80 dark:text-teal-400/80 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
            >
              {t.attendanceToday.clear}
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-2xl bg-teal-100/50 dark:bg-teal-900/30 animate-pulse"
              />
            ))}
          </div>
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 rounded-2xl border border-dashed border-teal-200 dark:border-teal-800">
            <CalendarCheck className="h-8 w-8 text-teal-300 dark:text-teal-700 mb-3" />
            <p className="text-sm text-teal-700/70 dark:text-teal-300/70">
              {t.attendanceToday.noStaff}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {staff.map((s) => {
              const status = effectiveStatus(s);
              const isDirty =
                selections[s.id] && selections[s.id] !== s.today_status;
              return (
                <div
                  key={s.id}
                  className={`flex items-center justify-between gap-3 border rounded-2xl px-4 py-3 transition-colors ${
                    isDirty
                      ? "border-teal-500 dark:border-teal-400 bg-teal-50 dark:bg-teal-900/40 shadow-sm shadow-teal-900/5"
                      : "border-teal-100 dark:border-teal-800/60 bg-white dark:bg-teal-950/30"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-teal-950 dark:text-white truncate">
                      {s.full_name}
                    </div>
                    <div className="text-xs text-teal-700/70 dark:text-teal-300/60 truncate">
                      {s.branch?.name || "—"}
                      {s.on_leave && (
                        <span className="ms-2 text-amber-600 dark:text-amber-400">
                          ·{" "}
                          {s.on_leave.status === "approved"
                            ? t.attendanceToday.leaveStatus.approved
                            : t.attendanceToday.leaveStatus.requested}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {STATUS_OPTIONS.map((opt) => {
                      const active = status === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => setPick(s.id, opt.key)}
                          title={opt.label}
                          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-full transition-colors ${
                            active
                              ? opt.cls
                              : "bg-teal-50 dark:bg-teal-900/40 text-teal-600/70 dark:text-teal-400/70 hover:bg-teal-100 dark:hover:bg-teal-900"
                          }`}
                        >
                          {opt.icon}
                          <span className="hidden sm:inline">
                            {t.attendanceToday.statuses[opt.key] || opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky save bar */}
      {pendingCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 border-t border-teal-200 dark:border-teal-800 bg-white/95 dark:bg-teal-950/95 backdrop-blur px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-teal-700/80 dark:text-teal-300/80">
            {pendingCount === 1
              ? t.attendanceToday.saveBar.changesOne.replace(
                  "{count}",
                  pendingCount,
                )
              : t.attendanceToday.saveBar.changesMany.replace(
                  "{count}",
                  pendingCount,
                )}
          </span>
          <button
            onClick={saveAll}
            disabled={saving}
            className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-full text-sm font-medium shadow-sm shadow-teal-900/20 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving
              ? t.attendanceToday.saveBar.saving
              : t.attendanceToday.saveBar.save}
          </button>
        </div>
      )}
    </div>
  );
}
