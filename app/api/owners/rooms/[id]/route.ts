import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { getAuthUser } from "@/lib/auth";
import { assertManagedBranch } from "@/lib/owner-scope";
import { hotelHasRoomsFeature } from "@/lib/require-rooms-plan";

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
  const room = await prisma.rooms.findUnique({ where: { id } });
  if (!room) return null;
  const branch = await assertManagedBranch(room.branch_id, userId);
  if (!branch) return null;
  return { room, branch };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const scoped = await loadScoped(id, user.id);
  if (!scoped)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { room: existing, branch } = scoped;

  const hasRooms = await hotelHasRoomsFeature(branch.hotel_id);
  if (!hasRooms)
    return NextResponse.json(
      { error: "Rooms feature is not included in your plan" },
      { status: 403 },
    );

  const body = await readJson(request);

  const data: Prisma.roomsUncheckedUpdateInput = {};

  if (typeof body.room_number === "string" && body.room_number.trim() !== "")
    data.room_number = body.room_number.trim();

  if (typeof body.floor === "string" || body.floor === null)
    data.floor = (body.floor as string | null) || null;

  if (typeof body.status === "string") data.status = body.status;

  if (typeof body.notes === "string" || body.notes === null)
    data.notes = (body.notes as string | null) || null;

  if (typeof body.is_active === "boolean") data.is_active = body.is_active;

  if (typeof body.room_type_id === "string" && body.room_type_id) {
    const rt = await prisma.room_types.findFirst({
      where: { id: body.room_type_id, branch_id: existing.branch_id },
    });
    if (!rt)
      return NextResponse.json(
        { error: "Room type not found in this branch" },
        { status: 404 },
      );
    data.room_type_id = body.room_type_id;
  }

  try {
    const room = await prisma.rooms.update({ where: { id }, data });
    return NextResponse.json({ room });
  } catch (err: unknown) {
    console.error("Update room error:", err);
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
      { error: "Failed to update room" },
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
  const scoped = await loadScoped(id, user.id);
  if (!scoped)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { branch } = scoped;

  const hasRooms = await hotelHasRoomsFeature(branch.hotel_id);
  if (!hasRooms)
    return NextResponse.json(
      { error: "Rooms feature is not included in your plan" },
      { status: 403 },
    );

  const activeStay = await prisma.room_stays.findFirst({
    where: { room_id: id, status: "active" },
  });
  if (activeStay) {
    return NextResponse.json(
      {
        error:
          "Cannot delete room with an active stay. Check out the guest first.",
      },
      { status: 400 },
    );
  }

  try {
    await prisma.rooms.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete room error:", err);
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 400 },
    );
  }
}
