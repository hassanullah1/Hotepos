import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { loadOwnedStaff } from "@/lib/owner-scope";

// Lets an owner pay a single staff member's payslip outside of (or ahead
// of) the branch-wide "mark run as paid" action — e.g. paying one person
// in cash today, the rest on the 1st.
//
// Only allowed once the parent run has been processed (amounts locked);
// draft-run payslips can't be paid individually because the run as a
// whole might still be regenerated/corrected.
export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id, payslipId } = await params;
  const staff = await loadOwnedStaff(id, user.id);
  if (!staff) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const payslip = await prisma.payslips.findFirst({
    where: { id: payslipId, user_id: id },
    include: { payroll_runs: true },
  });
  if (!payslip)
    return NextResponse.json({ error: "PAYSLIP_NOT_FOUND" }, { status: 404 });

  if (payslip.status !== "unpaid")
    return NextResponse.json({ error: "PAYSLIP_ALREADY_PAID" }, { status: 400 });
  if (payslip.payroll_runs.status === "draft")
    return NextResponse.json({ error: "PAYROLL_RUN_NOT_PROCESSED" }, { status: 400 });

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.payslips.update({
        where: { id: payslipId },
        data: { status: "paid", paid_at: new Date() },
      });

      // Same simplification as the bulk-pay route: paying off this
      // payslip's advance_deducted portion closes out ALL of this staff
      // member's approved advances (no partial tracking in this schema).
      if (Number(payslip.advance_deducted) > 0) {
        await tx.staff_advances.updateMany({
          where: { user_id: id, status: "approved" },
          data: { status: "repaid" },
        });
      }

      // If that was the last unpaid payslip on the run, flip the run
      // itself to "paid" so it doesn't sit stuck at "processed" forever.
      const remaining = await tx.payslips.count({
        where: { payroll_run_id: payslip.payroll_run_id, status: "unpaid" },
      });
      if (remaining === 0) {
        await tx.payroll_runs.update({
          where: { id: payslip.payroll_run_id },
          data: { status: "paid" },
        });
      }

      return p;
    });

    return NextResponse.json({
      payslip: { id: updated.id, status: updated.status, paid_at: updated.paid_at },
    });
  } catch (err) {
    console.error("Mark payslip paid error:", err);
    return NextResponse.json({ error: "PAYSLIP_UPDATE_FAILED" }, { status: 400 });
  }
}
