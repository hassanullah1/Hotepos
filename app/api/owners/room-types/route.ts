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

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branch_id");
  if (!branchId)
    return NextResponse.json(
      { error: "branch_id is required" },
      { status: 400 },
    );

  const branch = await assertManagedBranch(branchId, user.id);
  if (!branch)
    return NextResponse.json(
      { error: "Branch not found in your hotel" },
      { status: 404 },
    );

  const types = await prisma.room_types.findMany({
    where: { branch_id: branchId },
    orderBy: { name: "asc" },
    include: { _count: { select: { rooms: true } } },
  });

  return NextResponse.json({
    roomTypes: types.map((t) => ({
      id: t.id,
      name: t.name,
      base_price: t.base_price,
      capacity: t.capacity,
      is_active: t.is_active,
      room_count: t._count.rooms,
    })),
  });
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJson(request);

  const branchId = typeof body.branch_id === "string" ? body.branch_id : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const basePrice =
    typeof body.base_price === "number"
      ? body.base_price
      : typeof body.base_price === "string" && body.base_price.trim() !== ""
        ? Number(body.base_price)
        : NaN;

  if (!branchId || !name || Number.isNaN(basePrice)) {
    return NextResponse.json(
      { error: "branch_id, name and base_price are required" },
      { status: 400 },
    );
  }

  const branch = await assertManagedBranch(branchId, user.id);
  if (!branch)
    return NextResponse.json(
      { error: "Branch not found in your hotel" },
      { status: 404 },
    );

  const capacity =
    typeof body.capacity === "number"
      ? body.capacity
      : typeof body.capacity === "string" && body.capacity.trim() !== ""
        ? Number(body.capacity)
        : 2;

  const data: Prisma.room_typesUncheckedCreateInput = {
    branch_id: branchId,
    name,
    base_price: basePrice,
    capacity: Number.isFinite(capacity) ? capacity : 2,
    is_active: typeof body.is_active === "boolean" ? body.is_active : true,
  };

  try {
    const roomType = await prisma.room_types.create({ data });
    return NextResponse.json({ roomType }, { status: 201 });
  } catch (err) {
    console.error("Create room type error:", err);
    return NextResponse.json(
      { error: "Failed to create room type" },
      { status: 400 },
    );
  }
}
