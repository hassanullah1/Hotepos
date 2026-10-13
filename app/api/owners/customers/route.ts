import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { getAuthUser } from "@/lib/auth";
import { ownsHotel } from "@/lib/owner-scope";

async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") return {};
    return body as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Allow either:
 *  - a hotel owner who owns this hotel, OR
 *  - any active user whose `hotel_id` matches (branch managers, etc.)
 */
async function assertHotelScope(hotelId: string, userId: string) {
  if (!hotelId) return false;
  const owns = await ownsHotel(userId, hotelId);
  if (owns) return true;

  const u = await prisma.users.findUnique({
    where: { id: userId },
    select: { hotel_id: true, is_active: true },
  });
  return !!u && u.is_active !== false && u.hotel_id === hotelId;
}

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const hotelId = searchParams.get("hotel_id");
  const q = (searchParams.get("q") || "").trim();

  // -------- pagination params --------
  const pageRaw = parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const limitRaw = parseInt(searchParams.get("limit") || "20", 10);
  const limit = Math.min(
    100,
    Math.max(1, Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 20),
  );

  const skip = (page - 1) * limit;

  if (!hotelId)
    return NextResponse.json(
      { error: "hotel_id is required" },
      { status: 400 },
    );

  const ok = await assertHotelScope(hotelId, user.id);
  if (!ok)
    return NextResponse.json(
      { error: "Hotel not found in your scope" },
      { status: 404 },
    );

  const where: Prisma.customersWhereInput = { hotel_id: hotelId };
  if (q) {
    where.OR = [
      { full_name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, customers] = await prisma.$transaction([
    prisma.customers.count({ where }),
    prisma.customers.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
      include: { _count: { select: { orders: true, room_stays: true } } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return NextResponse.json({
    customers: customers.map((c) => ({
      id: c.id,
      full_name: c.full_name,
      phone: c.phone,
      email: c.email,
      loyalty_points: c.loyalty_points,
      notes: c.notes,
      created_at: c.created_at,
      order_count: c._count.orders,
      stay_count: c._count.room_stays,
    })),
    page,
    limit,
    total,
    totalPages,
  });
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJson(request);

  const hotelId = typeof body.hotel_id === "string" ? body.hotel_id : "";
  if (!hotelId)
    return NextResponse.json(
      { error: "hotel_id is required" },
      { status: 400 },
    );

  const ok = await assertHotelScope(hotelId, user.id);
  if (!ok)
    return NextResponse.json(
      { error: "Hotel not found in your scope" },
      { status: 404 },
    );

  const fullName =
    typeof body.full_name === "string" && body.full_name.trim()
      ? body.full_name.trim()
      : null;
  const phone =
    typeof body.phone === "string" && body.phone.trim()
      ? body.phone.trim()
      : null;
  const email =
    typeof body.email === "string" && body.email.trim()
      ? body.email.trim()
      : null;
  const notes =
    typeof body.notes === "string" && body.notes.trim()
      ? body.notes.trim()
      : null;
  const loyaltyPoints =
    typeof body.loyalty_points === "number"
      ? body.loyalty_points
      : typeof body.loyalty_points === "string" &&
          body.loyalty_points.trim() !== "" &&
          !Number.isNaN(Number(body.loyalty_points))
        ? Number(body.loyalty_points)
        : 0;

  if (!fullName && !phone && !email) {
    return NextResponse.json(
      { error: "At least a name, phone or email is required" },
      { status: 400 },
    );
  }

  const data: Prisma.customersUncheckedCreateInput = {
    hotel_id: hotelId,
    full_name: fullName,
    phone,
    email,
    loyalty_points: loyaltyPoints,
    notes,
  };

  try {
    const customer = await prisma.customers.create({ data });
    return NextResponse.json({ customer }, { status: 201 });
  } catch (err: unknown) {
    console.error("Create customer error:", err);
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A customer with this phone already exists in this hotel" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 400 },
    );
  }
}
