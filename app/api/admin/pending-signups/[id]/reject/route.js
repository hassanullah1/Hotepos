import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

// POST /api/admin/pending-signups/:id/reject
// Marks a pending signup as rejected — e.g. the WhatsApp order never got
// paid, or the details didn't check out. Does NOT touch users/hotels;
// nothing was created yet for a still-pending signup, so there's nothing
// to undo.
export async function POST(request, { params }) {
  const { id } = await params; // Next.js 15+: params is a Promise

  const admin = await getAuthUser(request);
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireRole(admin, ["super_admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const signup = await prisma.pending_signups.findUnique({ where: { id } });
  if (!signup) {
    return NextResponse.json({ error: "Signup not found" }, { status: 404 });
  }
  if (signup.status === "paid" && signup.created_hotel_id) {
    return NextResponse.json(
      { error: "This signup was already approved and can't be rejected" },
      { status: 409 },
    );
  }
  if (signup.status === "rejected") {
    return NextResponse.json(
      { error: "This signup is already rejected" },
      { status: 409 },
    );
  }

  await prisma.pending_signups.update({
    where: { id: signup.id },
    data: { status: "rejected" },
  });

  return NextResponse.json({ ok: true });
}
