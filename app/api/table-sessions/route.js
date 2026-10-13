import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.branch_id || !body.table_id) {
    return NextResponse.json(
      { error: "branch_id and table_id are required" },
      { status: 400 },
    );
  }

  const table = await prisma.dining_tables.findFirst({
    where: { id: body.table_id, branch_id: body.branch_id },
  });
  if (!table) return NextResponse.json({ error: "Table not found" }, { status: 404 });

  if (table.status === "occupied") {
    // table already has an open session — return it instead of creating a duplicate
    const existing = await prisma.table_sessions.findFirst({
      where: { table_id: body.table_id, status: "open" },
    });
    if (existing) return NextResponse.json({ session: existing });
  }

  const [session] = await prisma.$transaction([
    prisma.table_sessions.create({
      data: {
        table_id: body.table_id,
        branch_id: body.branch_id,
        opened_by: user.id,
        guest_count: body.guest_count ?? 1,
        status: "open",
      },
    }),
    prisma.dining_tables.update({
      where: { id: body.table_id },
      data: { status: "occupied" },
    }),
  ]);

  return NextResponse.json({ session }, { status: 201 });
}
