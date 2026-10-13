import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getOwnerHotelIds } from "@/lib/owner-scope";

export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, requestId } = await params;

  const leaveRequest = await prisma.staff_leave_requests.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      user_id: true,
      status: true,
      branch: { select: { hotel_id: true } },
    },
  });
  if (!leaveRequest || leaveRequest.user_id !== id)
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const ownedHotelIds = await getOwnerHotelIds(user.id);
  if (!ownedHotelIds.includes(leaveRequest.branch.hotel_id))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { status } = body;
  if (!["approved", "rejected"].includes(status))
    return NextResponse.json({ error: "STATUS_INVALID" }, { status: 400 });
  if (leaveRequest.status !== "pending")
    return NextResponse.json({ error: "INVALID_TRANSITION" }, { status: 400 });

  const updated = await prisma.staff_leave_requests.update({
    where: { id: requestId },
    data: { status, approved_by: user.id, approved_at: new Date() },
  });

  return NextResponse.json({ request: updated });
}
