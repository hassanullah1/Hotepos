import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { loadOwnedBranch } from "@/lib/owner-scope";

// draft -> processed: locks the run in (who/when), doesn't recompute amounts.
// processed -> paid: bulk pay, see PATCH below.
const ALLOWED_TRANSITIONS = {
  draft: ["processed"],
  processed: ["paid"],
};

function serializePayslip(p) {
  return {
    id: p.id,
    user: { id: p.users.id, full_name: p.users.full_name },
    base_salary: p.base_salary,
    bonus_amount: p.bonus_amount,
    deduction_amount: p.deduction_amount,
    advance_deducted: p.advance_deducted,
    net_pay: p.net_pay,
    status: p.status,
    paid_at: p.paid_at,
  };
}

function serializeRun(run) {
  return {
    id: run.id,
    branch_id: run.branch_id,
    period_start: run.period_start,
    period_end: run.period_end,
    status: run.status,
    processed_at: run.processed_at,
    processed_by: run.processor
      ? { id: run.processor.id, full_name: run.processor.full_name }
      : null,
    payslips: run.payslips.map(serializePayslip),
  };
}

async function loadRun(id, runId) {
  return prisma.payroll_runs.findFirst({
    where: { id: runId, branch_id: id },
    include: {
      processor: { select: { id: true, full_name: true } },
      payslips: { include: { users: { select: { id: true, full_name: true } } } },
    },
  });
}

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id, runId } = await params;
  const branch = await loadOwnedBranch(id, user.id);
  if (!branch) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const run = await loadRun(id, runId);
  if (!run) return NextResponse.json({ error: "RUN_NOT_FOUND" }, { status: 404 });

  return NextResponse.json({ run: serializeRun(run) });
}

// processed -> paid bulk-marks every still-unpaid payslip on the run as
// paid, and closes out (status: repaid) any staff_advances that funded an
// advance_deducted amount on this run — see the simplification note on
// POST /payroll-runs.
export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id, runId } = await params;
  const branch = await loadOwnedBranch(id, user.id);
  if (!branch) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const run = await loadRun(id, runId);
  if (!run) return NextResponse.json({ error: "RUN_NOT_FOUND" }, { status: 404 });

  const body = await request.json();
  const { status } = body;
  const allowedNext = ALLOWED_TRANSITIONS[run.status] || [];

  if (!status || !allowedNext.includes(status))
    return NextResponse.json(
      { error: "PAYROLL_INVALID_TRANSITION", from: run.status, allowed: allowedNext },
      { status: 400 },
    );

  try {
    await prisma.$transaction(async (tx) => {
      if (status === "processed") {
        await tx.payroll_runs.update({
          where: { id: runId },
          data: { status: "processed", processed_by: user.id, processed_at: new Date() },
        });
        return;
      }

      // status === "paid"
      const now = new Date();
      await tx.payslips.updateMany({
        where: { payroll_run_id: runId, status: "unpaid" },
        data: { status: "paid", paid_at: now },
      });

      const userIdsWithAdvanceDeducted = run.payslips
        .filter((p) => Number(p.advance_deducted) > 0)
        .map((p) => p.user_id);

      if (userIdsWithAdvanceDeducted.length > 0) {
        await tx.staff_advances.updateMany({
          where: { user_id: { in: userIdsWithAdvanceDeducted }, status: "approved" },
          data: { status: "repaid" },
        });
      }

      await tx.payroll_runs.update({ where: { id: runId }, data: { status: "paid" } });
    });

    const updated = await loadRun(id, runId);
    return NextResponse.json({ run: serializeRun(updated) });
  } catch (err) {
    console.error("Update payroll run error:", err);
    return NextResponse.json({ error: "PAYROLL_RUN_UPDATE_FAILED" }, { status: 400 });
  }
}
