import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getStaffBranch } from "@/lib/pos-scope";

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scope = await getStaffBranch(user.id);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tables = await prisma.dining_tables.findMany({
    where: { branch_id: scope.branchId },
    include: {
      dining_areas: { select: { id: true, name: true } },
      table_sessions: {
        where: { status: "open" },
        select: { id: true, opened_at: true, guest_count: true },
        take: 1,
        orderBy: { opened_at: "desc" },
      },
    },
    orderBy: { table_number: "asc" },
  });

  return NextResponse.json({
    tables: tables.map((t) => ({
      id: t.id,
      table_number: t.table_number,
      capacity: t.capacity,
      status: t.status,
      area: t.dining_areas?.name || null,
      open_session: t.table_sessions[0] || null,
    })),
  });
}
