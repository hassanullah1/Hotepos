// app/api/permissions/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, canManageUsers } from "@/lib/auth";

// Expects permission codes like "orders.create", "menu.edit_price",
// "inventory.adjust" — the part before the first "." becomes the
// category used to group checkboxes on the role detail page.
export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageUsers(user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const permissions = await prisma.permissions.findMany({
    orderBy: { code: "asc" },
  });

  const grouped = {};
  for (const p of permissions) {
    const category = p.code.includes(".") ? p.code.split(".")[0] : "general";
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push({
      id: p.id,
      code: p.code,
      description: p.description,
    });
  }

  return NextResponse.json({ permissions, grouped });
}

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageUsers(user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { code, description } = body;

  if (!code) {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }
  // Keep the "category.action" convention the grouping logic relies on.
  if (!code.includes(".")) {
    return NextResponse.json(
      { error: 'code should look like "category.action", e.g. "orders.create"' },
      { status: 400 },
    );
  }

  try {
    const permission = await prisma.permissions.create({
      data: { code, description: description || null },
    });
    return NextResponse.json({ permission }, { status: 201 });
  } catch (err) {
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "A permission with that code already exists" },
        { status: 409 },
      );
    }
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create permission" },
      { status: 500 },
    );
  }
}
