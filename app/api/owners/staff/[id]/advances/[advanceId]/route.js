import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { loadOwnedStaff } from "@/lib/owner-scope";

// Advances are created pre-approved (see POST /advances), so the only
// transitions this endpoint needs to support are:
//   approved -> repaid   (staff paid it back / it was deducted from a payslip)
//   approved -> rejected (owner reverses an advance they shouldn't have given)
const ALLOWED_TRANSITIONS = {
  approved: ["repaid", "rejected"],
};

function serialize(a) {
  return {
    id: a.id,
    amount: a.amount,
    reason: a.reason,
    status: a.status,
    requested_at: a.requested_at,
  };
}

export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id, advanceId } = await params;
  const staff = await loadOwnedStaff(id, user.id);
  if (!staff) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const advance = await prisma.staff_advances.findFirst({
    where: { id: advanceId, user_id: id },
  });
  if (!advance)
    return NextResponse.json({ error: "ADVANCE_NOT_FOUND" }, { status: 404 });

  const body = await request.json();
  const { status } = body;
  const allowedNext = ALLOWED_TRANSITIONS[advance.status] || [];

  // Frontend has advance.status and allowedNext already (or can refetch),
  // so it can build the localized "from X you can only go to Y" sentence
  // itself from t.errors.ADVANCE_INVALID_TRANSITION — no English baked in here.
  if (!status || !allowedNext.includes(status))
    return NextResponse.json(
      { error: "ADVANCE_INVALID_TRANSITION", from: advance.status, allowed: allowedNext },
      { status: 400 },
    );

  try {
    const updated = await prisma.staff_advances.update({
      where: { id: advanceId },
      data: { status },
    });
    return NextResponse.json({ advance: serialize(updated) });
  } catch (err) {
    console.error("Update advance error:", err);
    return NextResponse.json({ error: "ADVANCE_UPDATE_FAILED" }, { status: 400 });
  }
}
