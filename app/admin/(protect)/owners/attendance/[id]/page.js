"use client";

import { useEffect, useRef, useState, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Clock3,
  AlertTriangle,
  CalendarDays,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";
import { LOCALES } from "@/lib/i18n/translations";

const WEEKDAYS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(monthStr, delta) {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function daysInMonth(monthStr) {
  const [y, m] = monthStr.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function firstWeekday(monthStr) {
  const [y, m] = monthStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
}

function monthTitle(monthStr, locale) {
  const [y, m] = monthStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, 1));
  return date.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function cellInfo(day, t) {
  if (!day)
    return {
      icon: null,
      label: t.staffAttendance.status.notMarked,
      cellCls:
        "bg-teal-50/40 dark:bg-teal-900/20 border-teal-100 dark:border-teal-800/50",
      textCls: "text-teal-400/70 dark:text-teal-500/60",
      iconCls: "text-teal-300 dark:text-teal-700",
    };

  if (day.source === "attendance") {
    if (day.status === "present")
      return {
        icon: <Check size={15} strokeWidth={3} />,
        label: t.staffAttendance.status.present,
        cellCls:
          "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700",
        textCls: "text-emerald-700 dark:text-emerald-300",
        iconCls: "text-emerald-600 dark:text-emerald-400",
      };
    if (day.status === "late")
      return {
        icon: <Clock3 size={15} strokeWidth={3} />,
        label: t.staffAttendance.status.late,
        cellCls:
          "bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700",
        textCls: "text-amber-700 dark:text-amber-300",
        iconCls: "text-amber-600 dark:text-amber-400",
      };
    if (day.status === "absent")
      return {
        icon: <X size={15} strokeWidth={3} />,
        label: t.staffAttendance.status.absent,
        cellCls:
          "bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700",
        textCls: "text-red-700 dark:text-red-300",
        iconCls: "text-red-600 dark:text-red-400",
      };
  }

  if (day.source === "leave_request") {
    if (day.status === "pending")
      return {
        icon: <AlertTriangle size={15} strokeWidth={3} />,
        label: t.staffAttendance.status.requested,
        cellCls:
          "bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 border-dashed",
        textCls: "text-amber-700 dark:text-amber-300",
        iconCls: "text-amber-600 dark:text-amber-400",
      };
    if (day.status === "approved")
      return {
        icon: <Check size={15} strokeWidth={3} />,
        label: t.staffAttendance.status.onLeave,
        cellCls:
          "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700",
        textCls: "text-indigo-700 dark:text-indigo-300",
        iconCls: "text-indigo-600 dark:text-indigo-400",
      };
  }

  return {
    icon: null,
    label: t.staffAttendance.status.notMarked,
    cellCls:
      "bg-teal-50/40 dark:bg-teal-900/20 border-teal-100 dark:border-teal-800/50",
    textCls: "text-teal-400/70 dark:text-teal-500/60",
    iconCls: "text-teal-300 dark:text-teal-700",
  };
}

const STATUS_BUTTONS = [
  {
    key: "present",
    label: "Present",
    icon: <Check size={18} strokeWidth={3} />,
    cls: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  {
    key: "late",
    label: "Late",
    icon: <Clock3 size={18} strokeWidth={3} />,
    cls: "bg-amber-600 hover:bg-amber-700 text-white",
  },
  {
    key: "absent",
    label: "Absent",
    icon: <X size={18} strokeWidth={3} />,
    cls: "bg-red-600 hover:bg-red-700 text-white",
  },
];

export default function StaffAttendancePage({ params }) {
  const { id } = usePromise(params);
  const router = useRouter();
  const { t, dir, locale, setLocale } = useAdminPreferences();

  const [month, setMonth] = useState(currentMonth());
  const [days, setDays] = useState({});
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [marking, setMarking] = useState(false);
  const [popoverPos, setPopoverPos] = useState(null);
  const [showAllRequests, setShowAllRequests] = useState(false);
  const gridRef = useRef(null);
  const popoverRef = useRef(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetchWithAuth(
        `/api/owners/staff/${id}/attendance?month=${month}`,
      );
      if (res.status === 401) return router.push("/hotel/login");
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || t.staffAttendance.errors.loadFailed);
      setDays(data.days || {});
      setLeaveRequests(data.leave_requests || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, month]);

  useEffect(() => {
    setSelectedDate(null);
    setPopoverPos(null);
  }, [month]);

  useEffect(() => {
    if (!selectedDate) return;
    function onPointerDown(e) {
      if (popoverRef.current?.contains(e.target)) return;
      if (gridRef.current?.contains(e.target)) return;
      setSelectedDate(null);
      setPopoverPos(null);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [selectedDate]);

  async function mark(status) {
    if (!selectedDate) return;
    setMarking(true);
    try {
      const res = await fetchWithAuth(`/api/owners/staff/${id}/attendance`, {
        method: "POST",
        body: JSON.stringify({ date: selectedDate, status }),
      });
      if (res.status === 401) return router.push("/hotel/login");
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || t.staffAttendance.errors.markFailed);
      setSelectedDate(null);
      setPopoverPos(null);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setMarking(false);
    }
  }

  async function decideRequest(requestId, status) {
    try {
      const res = await fetchWithAuth(
        `/api/owners/staff/${id}/attendance/request/${requestId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
      );
      if (res.status === 401) return router.push("/hotel/login");
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || t.staffAttendance.errors.updateFailed);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  const total = daysInMonth(month);
  const leadingBlanks = firstWeekday(month);

  const cells = Array.from({ length: total }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `${month}-${String(dayNum).padStart(2, "0")}`;
    return { dayNum, dateStr, info: cellInfo(days[dateStr], t) };
  });

  const summary = cells.reduce(
    (acc, c) => {
      const s = days[c.dateStr];
      if (s?.source === "attendance") acc[s.status] = (acc[s.status] || 0) + 1;
      if (s?.source === "leave_request" && s.status === "pending")
        acc.requested = (acc.requested || 0) + 1;
      return acc;
    },
    { present: 0, late: 0, absent: 0, requested: 0 },
  );

  const selectedInfo = selectedDate ? cellInfo(days[selectedDate], t) : null;

  const pendingRequests = leaveRequests.filter((r) => r.status === "pending");
  const decidedRequests = leaveRequests.filter((r) => r.status !== "pending");

  const POPOVER_WIDTH = 220;

  function handleCellClick(e, dateStr) {
    if (selectedDate === dateStr) {
      setSelectedDate(null);
      setPopoverPos(null);
      return;
    }
    const btnRect = e.currentTarget.getBoundingClientRect();
    const gridRect = gridRef.current.getBoundingClientRect();

    const top = btnRect.bottom - gridRect.top + 6;
    let left =
      btnRect.left - gridRect.left + btnRect.width / 2 - POPOVER_WIDTH / 2;
    left = Math.max(0, Math.min(left, gridRect.width - POPOVER_WIDTH));

    setPopoverPos({ top, left });
    setSelectedDate(dateStr);
  }

  const monthLabel = monthTitle(month, locale);

  return (
    <div className="min-h-screen light:bg-[#F4FAF9]  p-6" dir={dir}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push("/admin/owners/attendance")}
            className="text-sm text-teal-600 dark:text-teal-400 flex items-center gap-1 hover:underline"
          >
            <ArrowLeft size={14} /> {t.staffAttendance.back}
          </button>
        </div>

        {/* Header: month nav + request leave */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMonth((m) => shiftMonth(m, -1))}
              className="p-2 rounded-full text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
              aria-label={t.staffAttendance.previousMonth}
            >
              <ChevronLeft size={18} />
            </button>
            <h1 className="text-lg font-semibold text-teal-950 dark:text-teal-50 w-44 text-center flex items-center justify-center gap-2">
              <CalendarDays size={17} className="text-teal-500" />
              {monthLabel}
            </h1>
            <button
              onClick={() => setMonth((m) => shiftMonth(m, 1))}
              className="p-2 rounded-full text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
              aria-label={t.staffAttendance.nextMonth}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <button
            onClick={() =>
              router.push(`/admin/owners/attendance/${id}/request`)
            }
            className="bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 rounded-full text-sm font-medium shadow-sm shadow-teal-900/20 transition-colors"
          >
            + {t.staffAttendance.requestLeave}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-2.5 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-10 rounded-xl bg-teal-100/50 dark:bg-teal-900/30 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            {/* Summary strip */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              <SummaryPill
                label={t.staffAttendance.summary.present}
                value={summary.present}
                icon={<Check size={13} strokeWidth={3} />}
                cls="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
              />
              <SummaryPill
                label={t.staffAttendance.summary.late}
                value={summary.late}
                icon={<Clock3 size={13} strokeWidth={3} />}
                cls="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
              />
              <SummaryPill
                label={t.staffAttendance.summary.absent}
                value={summary.absent}
                icon={<X size={13} strokeWidth={3} />}
                cls="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300"
              />
              <SummaryPill
                label={t.staffAttendance.summary.requested}
                value={summary.requested}
                icon={<AlertTriangle size={13} strokeWidth={3} />}
                cls="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
              />
            </div>

            {/* Pending requests */}
            {pendingRequests.length > 0 && (
              <div className="mb-5 space-y-2">
                {pendingRequests.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 px-3.5 py-2.5"
                  >
                    <div className="flex items-center gap-2 text-sm min-w-0">
                      <AlertTriangle
                        size={15}
                        className="text-amber-600 dark:text-amber-400 shrink-0"
                      />
                      <span className="font-medium truncate">
                        {r.leave_type}
                      </span>
                      <span className="text-xs text-amber-700/80 dark:text-amber-300/80 whitespace-nowrap">
                        {new Date(r.start_date).toLocaleDateString(locale)} –{" "}
                        {new Date(r.end_date).toLocaleDateString(locale)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => decideRequest(r.id, "approved")}
                        title="Approve"
                        aria-label="Approve"
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>
                      <button
                        onClick={() => decideRequest(r.id, "rejected")}
                        title="Reject"
                        aria-label="Reject"
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
                      >
                        <X size={14} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Weekday header */}
            <div className="grid grid-cols-7 gap-1.5 mb-1">
              {WEEKDAYS_SHORT.map((w, i) => (
                <div
                  key={i}
                  className="text-center text-[10px] font-medium text-teal-500/70 dark:text-teal-400/60"
                >
                  {w}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div
              ref={gridRef}
              className="relative grid grid-cols-7 gap-1.5 mb-2"
            >
              {Array.from({ length: leadingBlanks }).map((_, i) => (
                <div key={`blank-${i}`} />
              ))}
              {cells.map((c) => {
                const isSelected = selectedDate === c.dateStr;
                return (
                  <button
                    key={c.dateStr}
                    onClick={(e) => handleCellClick(e, c.dateStr)}
                    title={c.info.label}
                    className={`relative h-9 sm:h-10 rounded-lg border flex items-center justify-center transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm ${c.info.cellCls} ${
                      isSelected
                        ? "ring-2 ring-offset-1 ring-teal-500 dark:ring-teal-400 dark:ring-offset-teal-950 scale-105 shadow-sm"
                        : ""
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 start-1 text-[9px] font-semibold leading-none ${c.info.textCls}`}
                    >
                      {c.dayNum}
                    </span>
                    {c.info.icon ? (
                      <span className={c.info.iconCls}>{c.info.icon}</span>
                    ) : (
                      <span className="w-1 h-1 rounded-full bg-current opacity-30" />
                    )}
                  </button>
                );
              })}

              {/* Quick-mark popover */}
              {selectedDate && popoverPos && (
                <div
                  ref={popoverRef}
                  style={{
                    top: popoverPos.top,
                    left: popoverPos.left,
                    width: 220,
                  }}
                  className="absolute z-20 border border-teal-200 dark:border-teal-800 rounded-2xl px-3 py-3 bg-white dark:bg-teal-950 shadow-lg shadow-teal-950/10"
                >
                  <div className="text-xs mb-2">
                    <span className="font-medium text-teal-950 dark:text-white">
                      {new Date(`${selectedDate}T00:00:00Z`).toLocaleDateString(
                        locale,
                        {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          timeZone: "UTC",
                        },
                      )}
                    </span>
                    <span
                      className={`ms-2 ${selectedInfo?.textCls || "text-teal-400"}`}
                    >
                      {selectedInfo?.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1.5">
                    {STATUS_BUTTONS.map((btn) => (
                      <button
                        key={btn.key}
                        disabled={marking}
                        onClick={() => mark(btn.key)}
                        title={t.staffAttendance.status[btn.key] || btn.label}
                        aria-label={
                          t.staffAttendance.status[btn.key] || btn.label
                        }
                        className={`flex items-center justify-center w-10 h-10 rounded-full disabled:opacity-50 transition-colors ${btn.cls}`}
                      >
                        {btn.icon}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setSelectedDate(null);
                        setPopoverPos(null);
                      }}
                      title={t.staffAttendance.popover.cancel}
                      aria-label={t.staffAttendance.popover.cancel}
                      className="flex items-center justify-center w-10 h-10 rounded-full border border-teal-200 dark:border-teal-800 text-teal-500 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-teal-700/70 dark:text-teal-300/60 mb-6">
              <span className="flex items-center gap-1">
                <Check size={12} className="text-emerald-600" />{" "}
                {t.staffAttendance.legend.present}
              </span>
              <span className="flex items-center gap-1">
                <Clock3 size={12} className="text-amber-600" />{" "}
                {t.staffAttendance.legend.late}
              </span>
              <span className="flex items-center gap-1">
                <X size={12} className="text-red-600" />{" "}
                {t.staffAttendance.legend.absent}
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle size={12} className="text-amber-600" />{" "}
                {t.staffAttendance.legend.requested}
              </span>
              <span className="flex items-center gap-1">
                <Check size={12} className="text-indigo-600" />{" "}
                {t.staffAttendance.legend.onLeave}
              </span>
            </div>

            {/* Leave request history */}
            <button
              onClick={() => setShowAllRequests((v) => !v)}
              className="flex items-center justify-between w-full text-sm font-medium text-teal-950 dark:text-teal-50 mb-2 text-start"
            >
              <span>
                {t.staffAttendance.leaveHistory.title}
                {decidedRequests.length > 0 && ` (${decidedRequests.length})`}
              </span>
              <ChevronRight
                size={16}
                className={`text-teal-400 transition-transform ${
                  showAllRequests ? "rotate-90" : ""
                }`}
              />
            </button>

            {showAllRequests &&
              (decidedRequests.length === 0 ? (
                <p className="text-sm text-teal-800/80 dark:text-teal-300/70 mb-6">
                  {t.staffAttendance.leaveHistory.noPast}
                </p>
              ) : (
                <div className="max-h-56 overflow-y-auto border border-orange-500 dark:border-red-100/60 rounded-2xl divide-y divide-teal-100 dark:divide-teal-800/60 mb-6">
                  {decidedRequests.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {r.status === "approved" ? (
                          <Check
                            size={14}
                            className="text-indigo-600 dark:text-indigo-400 shrink-0"
                          />
                        ) : (
                          <X
                            size={14}
                            className="text-teal-800 dark:text-teal-600 shrink-0"
                          />
                        )}
                        <span className="truncate text-teal-950 dark:text-teal-50">
                          {r.leave_type}
                        </span>
                      </div>
                      <span className="text-xs text-orange-900 dark:text-teal-800 whitespace-nowrap">
                        {new Date(r.start_date).toLocaleDateString(locale)} –{" "}
                        {new Date(r.end_date).toLocaleDateString(locale)}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}

function SummaryPill({ label, value, icon, cls }) {
  return (
    <div className={`rounded-2xl px-3 py-2.5 flex items-center gap-2 ${cls}`}>
      <span className="opacity-80">{icon}</span>
      <div className="leading-tight">
        <div className="text-sm font-semibold">{value}</div>
        <div className="text-[10px] opacity-80">{label}</div>
      </div>
    </div>
  );
}
