import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// POST /mobileapp/table-sessions  body: { table_id }
export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user || !user.branch_id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.table_id)
    return NextResponse.json({ error: "table_id is required" }, { status: 400 });

  const table = await prisma.dining_tables.findFirst({
    where: { id: body.table_id, branch_id: user.branch_id },
  });
  if (!table)
    return NextResponse.json({ error: "Table not found" }, { status: 404 });

  // Reuse an existing open session instead of creating a duplicate.
  const existing = await prisma.table_sessions.findFirst({
    where: { table_id: table.id, status: "open" },
  });
  if (existing) {
    return NextResponse.json({ session: existing });
  }

  const session = await prisma.table_sessions.create({
    data: {
      table_id: table.id,
      branch_id: user.branch_id,
      opened_by: user.id,
      guest_count: body.guest_count ?? 1,
    },
  });

  await prisma.dining_tables.update({
    where: { id: table.id },
    data: { status: "occupied" },
  });

  return NextResponse.json({ session }, { status: 201 });
}
