import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { loadOwnedBranch, STAFF_ROLES } from "@/lib/owner-scope";

function serializeRun(run) {
  const payslips = run.payslips || [];
  return {
    id: run.id,
    period_start: run.period_start,
    period_end: run.period_end,
    status: run.status,
    processed_at: run.processed_at,
    processed_by: run.processor
      ? { id: run.processor.id, full_name: run.processor.full_name }
      : null,
    created_at: run.created_at,
    payslip_count: payslips.length,
    total_net: payslips.reduce((sum, p) => sum + Number(p.net_pay), 0),
    paid_count: payslips.filter((p) => p.status === "paid").length,
  };
}

// Normalizes any Date to a UTC "YYYY-MM-DD" string so we can compare
// attendance timestamps (which carry a time-of-day) against leave_request
// date ranges (which don't) without timezone/time-of-day edge cases.
function toDateKey(d) {
  return new Date(d).toISOString().slice(0, 10);
}

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const branch = await loadOwnedBranch(id, user.id);
  if (!branch)
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const runs = await prisma.payroll_runs.findMany({
    where: { branch_id: id },
    include: {
      processor: { select: { id: true, full_name: true } },
      payslips: { select: { net_pay: true, status: true } },
    },
    orderBy: { period_start: "desc" },
  });

  return NextResponse.json({ runs: runs.map(serializeRun) });
}

// Generates a payroll run for this branch + one payslip per eligible staff
// member, in one shot.
//
// A staff member is skipped (not double-created) for either reason:
//   - "no_salary"      — no current staff_salaries row.
//   - "period_overlap" — they already have a payslip (any status: unpaid,
//                         paid, whatever) on THIS branch whose period
//                         overlaps the requested period. This is what
//                         stops re-running payroll for a period you've
//                         already generated/paid for someone from paying
//                         them twice — checked per staff member, not just
//                         as an exact-duplicate-period check on the run
//                         itself, so partially-overlapping date ranges
//                         (e.g. re-running "Jul 1–Aug 2" after already
//                         having paid "Jul 1–Aug 1") are also caught.
//
// base_salary is prorated based on the period length:
//   - monthly: uses the 30/360 day-count convention (see days360() below)
//     — every calendar month counts as exactly 30 units regardless of
//     whether it actually has 28, 29, 30, or 31 days. So Jul 1 -> Aug 1
//     and Feb 1 -> Mar 1 both pay exactly 1x the monthly salary, and a
//     Jul 1 -> Aug 16 period (1 month + 15 days) pays 1.5x. Only a
//     genuinely partial mid-month range gets a non-whole-month fraction.
//   - daily:   base_amount * actual calendar days in the period
//     (base_amount treated as a day rate).
//   - hourly:  NOT prorated here — this would need actual hours worked
//     from staff_attendance, which isn't wired up yet. hourly staff still
//     get base_amount as-is; flag if you want attendance-based hourly
//     pay built next.
//
// bonus_amount (NEW):
//   - Pulled from staff_salaries.bonus_amount (the standing bonus tied to
//     the staff member's current salary structure), NOT from anything
//     entered per-payslip. Defaults to 0 when unset, same convention as
//     the column itself ("some staff have it, some don't").
//   - Prorated using the EXACT same rule as base_salary for that staff
//     member's salary_type (30/360 for monthly, actual days for daily,
//     flat/unprorated for hourly) — a half-month period pays half the
//     standing bonus, matching how base pay is prorated. If you instead
//     want the bonus paid in full regardless of period length, replace
//     the proration below with the raw bonusRate.
//   - NOT subject to the unexcused-absence deduction below — only
//     base_salary is docked for absences, the bonus is untouched.
//   - NOT counted against advance_deducted's cap either — advances are
//     only ever recovered from base pay, same as before this change.
//
// deduction_amount:
//   - Built from staff_attendance rows within [period_start, period_end]
//     where status = "absent".
//   - For each absent day, we check staff_leave_requests for an
//     APPROVED leave request whose [start_date, end_date] covers that
//     day. If one exists, the absence is EXCUSED — it does NOT reduce
//     pay (that's what leave is for).
//   - If no approved leave covers the day, it's an UNEXCUSED absence
//     and gets deducted at a per-day rate of:
//         base_salary / actualDaysInPeriod
//     i.e. the day-rate is derived from what was actually earned for
//     THIS period (base_salary, already prorated), divided by the real
//     calendar days in the period — NOT the raw monthly rate / 30.
//     Using the raw rate/30 would double-penalize short periods: e.g.
//     a 01–30 Aug period only earns 29/30 of a month under the 30/360
//     convention (base_salary = 14,500 on a 15,000 rate), so the day
//     rate for THAT period is 14,500 / 30 actual days = 483.33/day —
//     not 15,000 / 30 = 500/day, which would silently re-apply the
//     proration shortfall on top of every absence.
//   - hourly staff: not handled yet (same "not wired up" caveat as
//     proration above) — 0 deduction for them for now.
//   - The total deduction is capped at base_salary so net_pay can't go
//     negative purely from absences (bonus is not part of this cap).
//
// advance_deducted only counts approved advances requested ON OR BEFORE
// the period's end date — an advance given AFTER a period already ended
// can't be something that period is repaying. (Advances get marked
// "repaid" once a payslip that deducted them is paid, so a later run
// won't see them as "approved" again — no separate check needed to avoid
// double-deducting the same advance across runs.)
export async function POST(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const branch = await loadOwnedBranch(id, user.id);
  if (!branch)
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const body = await request.json();
  const { period_start, period_end } = body;

  if (!period_start || !period_end)
    return NextResponse.json({ error: "PERIOD_REQUIRED" }, { status: 400 });

  const start = new Date(period_start);
  const end = new Date(period_end);
  if (isNaN(start.getTime()) || isNaN(end.getTime()))
    return NextResponse.json({ error: "PERIOD_INVALID" }, { status: 400 });
  if (end < start)
    return NextResponse.json(
      { error: "PERIOD_END_BEFORE_START" },
      { status: 400 },
    );

  // Real inclusive calendar day count, e.g. Jul 1 -> Aug 1 = 32 days.
  // Used for daily-rate staff only.
  const actualDaysInPeriod =
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // 30/360 (US / NASD) day-count convention, used for monthly-rate staff.
  // Every month contributes exactly 30 units no matter whether the real
  // calendar month has 28, 29, 30, or 31 days — so a full-month period
  // (Jul 1 -> Aug 1, Jan 1 -> Feb 1, Feb 1 -> Mar 1, etc.) always prorates
  // to exactly 1x the monthly salary, whichever month it lands in.
  // Partial/mid-month ranges still prorate proportionally, using the same
  // 30-day month as the denominator.
  function days360(d1date, d2date) {
    let d1 = d1date.getUTCDate();
    let d2 = d2date.getUTCDate();
    const m1 = d1date.getUTCMonth() + 1;
    const m2 = d2date.getUTCMonth() + 1;
    const y1 = d1date.getUTCFullYear();
    const y2 = d2date.getUTCFullYear();

    if (d1 === 31) d1 = 30;
    if (d2 === 31 && d1 === 30) d2 = 30;

    return (y2 - y1) * 360 + (m2 - m1) * 30 + (d2 - d1);
  }
  // Compute month units based on actual days in the month
  const daysInMonth = new Date(
    start.getFullYear(),
    start.getMonth() + 1,
    0,
  ).getDate();
  const monthUnits = actualDaysInPeriod / daysInMonth;

  const staff = await prisma.users.findMany({
    where: {
      branch_id: id,
      is_active: true,
      roles: { name: { in: STAFF_ROLES } },
    },
    include: {
      staff_salaries: { where: { is_current: true } },
      advances_received: {
        where: { status: "approved", requested_at: { lte: end } },
      },
    },
  });

  const withSalary = staff.filter((s) => s.staff_salaries.length > 0);
  const noSalary = staff
    .filter((s) => s.staff_salaries.length === 0)
    .map((s) => ({ id: s.id, full_name: s.full_name, reason: "no_salary" }));

  // Overlap check: does this staff member already have a payslip on this
  // branch whose run period overlaps [start, end]? Standard interval
  // overlap test: existing.start <= end AND existing.end >= start.
  const overlapping = withSalary.length
    ? await prisma.payslips.findMany({
        where: {
          user_id: { in: withSalary.map((s) => s.id) },
          payroll_runs: {
            branch_id: id,
            period_start: { lte: end },
            period_end: { gte: start },
          },
        },
        select: { user_id: true },
      })
    : [];
  const overlappingUserIds = new Set(overlapping.map((p) => p.user_id));

  const eligible = withSalary.filter((s) => !overlappingUserIds.has(s.id));
  const periodOverlap = withSalary
    .filter((s) => overlappingUserIds.has(s.id))
    .map((s) => ({
      id: s.id,
      full_name: s.full_name,
      reason: "period_overlap",
    }));

  const skipped = [...noSalary, ...periodOverlap];

  if (eligible.length === 0)
    return NextResponse.json(
      { error: "NO_ELIGIBLE_STAFF", skipped },
      { status: 400 },
    );

  // --- attendance-based deductions --------------------------------------
  const eligibleIds = eligible.map((s) => s.id);

  // Every "absent" attendance row for eligible staff within the period.
  const absences = eligibleIds.length
    ? await prisma.staff_attendance.findMany({
        where: {
          user_id: { in: eligibleIds },
          branch_id: id,
          status: "absent",
          check_in: { gte: start, lte: end },
        },
        select: { user_id: true, check_in: true },
      })
    : [];

  // Every APPROVED leave request for eligible staff that overlaps the
  // period at all (we filter down to the exact day below).
  const approvedLeaves = eligibleIds.length
    ? await prisma.staff_leave_requests.findMany({
        where: {
          user_id: { in: eligibleIds },
          status: "approved",
          start_date: { lte: end },
          end_date: { gte: start },
        },
        select: { user_id: true, start_date: true, end_date: true },
      })
    : [];

  const leavesByUser = new Map();
  for (const lv of approvedLeaves) {
    if (!leavesByUser.has(lv.user_id)) leavesByUser.set(lv.user_id, []);
    leavesByUser.get(lv.user_id).push({
      start: toDateKey(lv.start_date),
      end: toDateKey(lv.end_date),
    });
  }

  function isCoveredByApprovedLeave(userId, dateKey) {
    const leaves = leavesByUser.get(userId);
    if (!leaves) return false;
    return leaves.some((lv) => lv.start <= dateKey && lv.end >= dateKey);
  }

  // Count UNEXCUSED absent days per user — i.e. absent, and NOT covered
  // by an approved leave request for that same day. Absences that fall
  // on an approved-leave day are excused and simply don't count here.
  const unexcusedAbsenceCountByUser = new Map();
  for (const a of absences) {
    const dateKey = toDateKey(a.check_in);
    if (isCoveredByApprovedLeave(a.user_id, dateKey)) continue; // excused
    unexcusedAbsenceCountByUser.set(
      a.user_id,
      (unexcusedAbsenceCountByUser.get(a.user_id) || 0) + 1,
    );
  }
  // -----------------------------------------------------------------------

  try {
    const created = await prisma.$transaction(async (tx) => {
      const run = await tx.payroll_runs.create({
        data: {
          branch_id: id,
          period_start: start,
          period_end: end,
          status: "draft",
        },
      });

      for (const s of eligible) {
        const salary = s.staff_salaries[0];
        const rate = Number(salary.base_amount);
        const bonusRate = Number(salary.bonus_amount ?? 0);

        let base_salary;
        let bonus_amount;
        if (salary.salary_type === "daily") {
          base_salary = rate * actualDaysInPeriod;
          bonus_amount = bonusRate * actualDaysInPeriod;
        } else if (salary.salary_type === "hourly") {
          // Not prorated — needs actual hours from staff_attendance,
          // not built yet. Uses the raw rate as a placeholder.
          base_salary = rate;
          bonus_amount = bonusRate;
        } else {
          // monthly (default) — prorated by calendar months (30/360),
          // not raw days, so 28/29/30/31-day months all pay the same.
          base_salary = rate * monthUnits;
          bonus_amount = bonusRate * monthUnits;
        }
        base_salary = Math.round(base_salary * 100) / 100;
        bonus_amount = Math.round(bonus_amount * 100) / 100;

        // Unexcused-absence deduction. hourly is left at 0 for now —
        // same "not wired up yet" caveat as base_salary proration above.
        // Based on base_salary only — the standing bonus is not clawed
        // back for absences.
        //
        // Day rate = base_salary / actualDaysInPeriod — derived from what
        // was actually earned THIS period (already prorated), divided by
        // the real number of calendar days in the period. Deliberately
        // NOT rate/30, which would re-apply the proration shortfall a
        // second time on short periods (see comment above POST).
        const unexcusedDays = unexcusedAbsenceCountByUser.get(s.id) || 0;
        let deduction_amount = 0;
        if (unexcusedDays > 0 && salary.salary_type !== "hourly") {
          const dayRate = base_salary / actualDaysInPeriod;
          deduction_amount = Math.round(dayRate * unexcusedDays * 100) / 100;
          // never deduct more than what was earned
          deduction_amount = Math.min(deduction_amount, base_salary);
        }

        const outstanding = s.advances_received.reduce(
          (sum, a) => sum + Number(a.amount),
          0,
        );
        // advances are only ever recovered from base pay, not bonus
        const advance_deducted = Math.min(
          outstanding,
          base_salary - deduction_amount,
        );
        const net_pay =
          base_salary - deduction_amount - advance_deducted + bonus_amount;

        await tx.payslips.create({
          data: {
            payroll_run_id: run.id,
            user_id: s.id,
            base_salary,
            bonus_amount,
            deduction_amount,
            advance_deducted,
            net_pay,
            status: "unpaid",
          },
        });
      }

      return run;
    });

    const full = await prisma.payroll_runs.findUnique({
      where: { id: created.id },
      include: {
        processor: { select: { id: true, full_name: true } },
        payslips: { select: { net_pay: true, status: true } },
      },
    });

    return NextResponse.json(
      { run: serializeRun(full), skipped },
      { status: 201 },
    );
  } catch (err) {
    console.error("Create payroll run error:", err);
    if (err.code === "P2002")
      return NextResponse.json(
        { error: "PAYROLL_PERIOD_EXISTS" },
        { status: 409 },
      );
    return NextResponse.json({ error: "PAYROLL_RUN_FAILED" }, { status: 400 });
  }
}
