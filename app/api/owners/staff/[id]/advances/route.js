import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { loadOwnedStaff } from "@/lib/owner-scope";

function serialize(a) {
  return {
    id: a.id,
    amount: a.amount,
    reason: a.reason,
    status: a.status,
    requested_at: a.requested_at,
    approved_by: a.approver ? { id: a.approver.id, full_name: a.approver.full_name } : null,
  };
}

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const staff = await loadOwnedStaff(id, user.id);
  if (!staff) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const advances = await prisma.staff_advances.findMany({
    where: { user_id: id },
    include: { approver: { select: { id: true, full_name: true } } },
    orderBy: { requested_at: "desc" },
  });

  const totalOutstanding = advances
    .filter((a) => a.status === "approved")
    .reduce((sum, a) => sum + Number(a.amount), 0);

  return NextResponse.json({
    advances: advances.map(serialize),
    total_outstanding: totalOutstanding,
  });
}

// Owner creates an advance directly, so it's created already approved by
// them rather than left pending on itself — pending is reserved for a
// future flow where a branch_manager requests one on staff's behalf.
export async function POST(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const staff = await loadOwnedStaff(id, user.id);
  if (!staff) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const body = await request.json();
  const { amount, reason } = body;

  if (amount === undefined || amount === null || isNaN(Number(amount)) || Number(amount) <= 0)
    return NextResponse.json({ error: "ADVANCE_AMOUNT_INVALID" }, { status: 400 });

  try {
    const advance = await prisma.staff_advances.create({
      data: {
        user_id: id,
        amount,
        reason: reason || null,
        status: "approved",
        approved_by: user.id,
      },
      include: { approver: { select: { id: true, full_name: true } } },
    });
    return NextResponse.json({ advance: serialize(advance) }, { status: 201 });
  } catch (err) {
    console.error("Create advance error:", err);
    return NextResponse.json({ error: "ADVANCE_SAVE_FAILED" }, { status: 400 });
  }
}
