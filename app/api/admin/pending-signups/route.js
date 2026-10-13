import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

// GET /api/admin/pending-signups?status=pending
// Lists signups waiting on manual confirmation — this is what you check
// before approving a WhatsApp order that was paid outside the system
// (cash, mobile money transfer, etc).
export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireRole(user, ["super_admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "pending";

  const signups = await prisma.pending_signups.findMany({
    where: { status },
    include: {
      subscription_plans: { select: { name: true, price_monthly: true } },
    },
    orderBy: { created_at: "desc" },
  });

  return NextResponse.json({
    signups: signups.map((s) => ({
      ...s,
      subscription_plans: {
        ...s.subscription_plans,
        price_monthly: s.subscription_plans?.price_monthly
          ? Number(s.subscription_plans.price_monthly)
          : null,
      },
    })),
  });
}

// DELETE /api/admin/pending-signups?status=pending  (or ?status=rejected)
// Bulk-deletes signups that were never approved. Restricted to pending/rejected
// only — and double-guarded with created_hotel_id: null — so an approved
// signup (which has a real hotel/user behind it) can never be wiped by this.
export async function DELETE(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireRole(user, ["super_admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  if (!["pending", "rejected"].includes(status)) {
    return NextResponse.json(
      { error: "status must be 'pending' or 'rejected'" },
      { status: 400 },
    );
  }

  const result = await prisma.pending_signups.deleteMany({
    where: { status, created_hotel_id: null },
  });

  return NextResponse.json({ ok: true, deleted: result.count });
}
