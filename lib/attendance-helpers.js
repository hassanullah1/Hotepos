// lib/attendance-helpers.js

export const ATTENDANCE_STATUSES = ["present", "absent", "late"];

export const LEAVE_STATUSES = ["pending", "approved", "rejected"];

/**
 * Resolve a "YYYY-MM" string (or default to current month) into a UTC
 * [start, end) date range, plus the normalized label back.
 */
export function monthRange(monthStr) {
  const now = new Date();
  const [y, m] = (
    monthStr ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  )
    .split("-")
    .map(Number);

  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1)); // exclusive
  const label = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`;

  return { start, end, label };
}

/** Shift a "YYYY-MM" string by `delta` months (can be negative). */
export function shiftMonth(monthStr, delta) {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Number of calendar days in a "YYYY-MM" month. */
export function daysInMonth(monthStr) {
  const [y, m] = monthStr.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Count how many days of [reqStart, reqEnd) fall inside [rangeStart, rangeEnd). */
export function overlapDays(reqStart, reqEnd, rangeStart, rangeEnd) {
  const s = reqStart > rangeStart ? reqStart : rangeStart;
  const e = reqEnd < rangeEnd ? reqEnd : rangeEnd;
  const diff = Math.round((e - s) / 86400000);
  return diff > 0 ? diff : 0;
}

export function serializeAttendance(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    branch_id: row.branch_id,
    check_in: row.check_in,
    check_out: row.check_out ?? null,
    status: row.status,
    notes: row.notes ?? null,
  };
}

export function serializeLeaveRequest(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    branch_id: row.branch_id,
    leave_type: row.leave_type,
    start_date: row.start_date,
    end_date: row.end_date,
    reason: row.reason ?? null,
    status: row.status,
    approved_by: row.approved_by ?? null,
    approved_at: row.approved_at ?? null,
    created_at: row.created_at ?? null,
  };
}
