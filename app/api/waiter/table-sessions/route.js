import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getStaffBranch } from "@/lib/pos-scope";

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scope = await getStaffBranch(user.id);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  if (!body.table_id)
    return NextResponse.json(
      { error: "table_id is required" },
      { status: 400 },
    );

  const table = await prisma.dining_tables.findFirst({
    where: { id: body.table_id, branch_id: scope.branchId },
  });
  if (!table)
    return NextResponse.json(
      { error: "Table not found in your branch" },
      { status: 404 },
    );

  // Reuse an already-open session instead of creating a duplicate —
  // lets a waiter tap the same table again to keep adding rounds.
  const existing = await prisma.table_sessions.findFirst({
    where: { table_id: table.id, status: "open" },
  });
  if (existing) return NextResponse.json({ session: existing });

  try {
    const [session] = await prisma.$transaction([
      prisma.table_sessions.create({
        data: {
          table_id: table.id,
          branch_id: scope.branchId,
          opened_by: user.id,
          guest_count: body.guest_count || 1,
          status: "open",
        },
      }),
      prisma.dining_tables.update({
        where: { id: table.id },
        data: { status: "occupied" },
      }),
    ]);
    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    console.error("Open table session error:", err);
    return NextResponse.json(
      { error: "Failed to open table" },
      { status: 400 },
    );
  }
}
