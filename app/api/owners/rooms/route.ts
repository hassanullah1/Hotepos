import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { getAuthUser } from "@/lib/auth";
import { assertManagedBranch } from "@/lib/owner-scope";

const ROOM_SELECT = {
  id: true,
  room_number: true,
  floor: true,
  status: true,
  notes: true,
  is_active: true,
  room_type_id: true,
  room_types: {
    select: { id: true, name: true, base_price: true, capacity: true },
  },
} satisfies Prisma.roomsSelect;

type RoomRow = Prisma.roomsGetPayload<{ select: typeof ROOM_SELECT }>;

function serialize(r: RoomRow) {
  return {
    id: r.id,
    room_number: r.room_number,
    floor: r.floor,
    status: r.status,
    notes: r.notes,
    is_active: r.is_active,
    room_type: r.room_types,
  };
}

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
  const roomTypeId = searchParams.get("room_type_id");
  const status = searchParams.get("status");
  const q = (searchParams.get("q") || "").trim();

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

  const where: Prisma.roomsWhereInput = { branch_id: branchId };
  if (roomTypeId) where.room_type_id = roomTypeId;
  if (status) where.status = status;
  if (q) where.room_number = { contains: q, mode: "insensitive" };

  const rooms = await prisma.rooms.findMany({
    where,
    select: ROOM_SELECT,
    orderBy: { room_number: "asc" },
  });

  return NextResponse.json({ rooms: rooms.map(serialize) });
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJson(request);

  const branchId = typeof body.branch_id === "string" ? body.branch_id : "";
  const roomNumber =
    typeof body.room_number === "string" ? body.room_number.trim() : "";
  const roomTypeId =
    typeof body.room_type_id === "string" ? body.room_type_id : "";

  if (!branchId || !roomNumber || !roomTypeId) {
    return NextResponse.json(
      { error: "branch_id, room_number and room_type_id are required" },
      { status: 400 },
    );
  }

  const branch = await assertManagedBranch(branchId, user.id);
  if (!branch)
    return NextResponse.json(
      { error: "Branch not found in your hotel" },
      { status: 404 },
    );

  const rt = await prisma.room_types.findFirst({
    where: { id: roomTypeId, branch_id: branchId },
  });
  if (!rt)
    return NextResponse.json(
      { error: "Room type not found in this branch" },
      { status: 404 },
    );

  const data: Prisma.roomsUncheckedCreateInput = {
    branch_id: branchId,
    room_type_id: roomTypeId,
    room_number: roomNumber,
    floor: typeof body.floor === "string" && body.floor ? body.floor : null,
    status: typeof body.status === "string" ? body.status : "available",
    notes: typeof body.notes === "string" && body.notes ? body.notes : null,
    is_active: typeof body.is_active === "boolean" ? body.is_active : true,
  };

  try {
    const room = await prisma.rooms.create({
      data,
      select: ROOM_SELECT,
    });
    return NextResponse.json({ room: serialize(room) }, { status: 201 });
  } catch (err: unknown) {
    console.error("Create room error:", err);
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Room number already exists in this branch" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 400 },
    );
  }
}
