import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { getAuthUser } from "@/lib/auth";
import { assertManagedBranch } from "@/lib/owner-scope";

async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") return {};
    return body as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function loadScoped(id: string, userId: string) {
  const roomType = await prisma.room_types.findUnique({ where: { id } });
  if (!roomType) return null;
  const branch = await assertManagedBranch(roomType.branch_id, userId);
  if (!branch) return null;
  return roomType;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await loadScoped(id, user.id);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await readJson(request);

  const data: Prisma.room_typesUncheckedUpdateInput = {};

  if (typeof body.name === "string" && body.name.trim() !== "")
    data.name = body.name.trim();

  if (typeof body.base_price === "number") {
    data.base_price = body.base_price;
  } else if (
    typeof body.base_price === "string" &&
    body.base_price.trim() !== "" &&
    !Number.isNaN(Number(body.base_price))
  ) {
    data.base_price = Number(body.base_price);
  }

  if (typeof body.capacity === "number") {
    data.capacity = body.capacity;
  } else if (
    typeof body.capacity === "string" &&
    body.capacity.trim() !== "" &&
    !Number.isNaN(Number(body.capacity))
  ) {
    data.capacity = Number(body.capacity);
  }

  if (typeof body.is_active === "boolean") data.is_active = body.is_active;

  try {
    const roomType = await prisma.room_types.update({ where: { id }, data });
    return NextResponse.json({ roomType });
  } catch (err) {
    console.error("Update room type error:", err);
    return NextResponse.json(
      { error: "Failed to update room type" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await loadScoped(id, user.id);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const roomCount = await prisma.rooms.count({ where: { room_type_id: id } });
  if (roomCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete room type with rooms assigned." },
      { status: 400 },
    );
  }

  try {
    await prisma.room_types.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete room type error:", err);
    return NextResponse.json(
      { error: "Failed to delete room type" },
      { status: 400 },
    );
  }
}
