import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user || !user.branch_id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tables = await prisma.dining_tables.findMany({
    where: { branch_id: user.branch_id },
    include: {
      dining_areas: { select: { id: true, name: true } },
      table_sessions: {
        where: { status: "open" },
        select: { id: true, guest_count: true, opened_at: true },
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
      area: t.dining_areas,
      open_session: t.table_sessions[0]
        ? {
            id: t.table_sessions[0].id,
            guest_count: t.table_sessions[0].guest_count,
            opened_at: t.table_sessions[0].opened_at,
          }
        : null,
    })),
  });
}
