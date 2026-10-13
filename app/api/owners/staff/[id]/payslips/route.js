import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { loadOwnedStaff } from "@/lib/owner-scope";

function serialize(p) {
  return {
    id: p.id,
    base_salary: p.base_salary,
    bonus_amount: p.bonus_amount,
    deduction_amount: p.deduction_amount,
    advance_deducted: p.advance_deducted,
    net_pay: p.net_pay,
    status: p.status,
    paid_at: p.paid_at,
    notes: p.notes,
    payroll_run: {
      id: p.payroll_runs.id,
      period_start: p.payroll_runs.period_start,
      period_end: p.payroll_runs.period_end,
      status: p.payroll_runs.status,
    },
  };
}

// Read-only history of what this staff member has actually been paid.
// Creating/generating a payroll_run is a branch-wide batch action across
// every staff member on that branch at once (pulls attendance, computes
// deductions, etc.) — deliberately out of scope for a single-staff route.
export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const staff = await loadOwnedStaff(id, user.id);
  if (!staff) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const payslips = await prisma.payslips.findMany({
    where: { user_id: id },
    include: { payroll_runs: true },
    orderBy: { payroll_runs: { period_start: "desc" } },
  });

  const totalPaid = payslips
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.net_pay), 0);

  return NextResponse.json({
    payslips: payslips.map(serialize),
    total_paid: totalPaid,
  });
}
