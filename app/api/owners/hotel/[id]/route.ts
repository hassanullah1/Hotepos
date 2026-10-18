import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ownsHotel } from "@/lib/owner-scope";

function serialize(h: any) {
  const owner = h.hotel_owner ?? null;
  const plan = h.subscription_plans ?? null;
  return {
    id: h.id,
    name: h.name,
    slug: h.slug,
    logo_url: h.logo_url,
    is_online: h.is_online,
    verification_status: h.verification_status,
    subscription_status: h.subscription_status,
    subscription_expires_at: h.subscription_expires_at,
    created_at: h.created_at,
    address: owner?.address ?? null,
    hesabpay_account_number: owner?.hesabpay_account_number ?? null,
    plan: plan
      ? {
          id: plan.id,
          name: plan.name,
          max_branches: plan.max_branches,
          max_pos_devices: plan.max_pos_devices,
          price_monthly: Number(plan.price_monthly),
          is_rooms: plan.is_rooms === true, // 👈 NEW
          features: plan.features ?? {},
        }
      : null,
  };
}

// GET /api/owners/hotel/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: hotelId } = await params;
  const owns = await ownsHotel(user.id, hotelId);
  if (!owns)
    return NextResponse.json(
      { error: "Hotel not found in your scope" },
      { status: 404 },
    );

  const hotel = await prisma.hotels.findUnique({
    where: { id: hotelId },
    include: { hotel_owner: true, subscription_plans: true },
  });
  if (!hotel) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ hotel: serialize(hotel) });
}

// PATCH /api/owners/hotel/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: hotelId } = await params;
  const owns = await ownsHotel(user.id, hotelId);
  if (!owns)
    return NextResponse.json(
      { error: "Hotel not found in your scope" },
      { status: 404 },
    );

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const hotelData: Record<string, unknown> = {};
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name)
      return NextResponse.json(
        { error: "Hotel name cannot be empty" },
        { status: 400 },
      );
    hotelData.name = name;
  }
  if (body.logo_url !== undefined)
    hotelData.logo_url =
      typeof body.logo_url === "string" && body.logo_url.trim()
        ? body.logo_url.trim()
        : null;

  const ownerData: Record<string, unknown> = {};
  if (body.address !== undefined)
    ownerData.address =
      typeof body.address === "string" && body.address.trim()
        ? body.address.trim()
        : null;
  if (body.hesabpay_account_number !== undefined)
    ownerData.hesabpay_account_number =
      typeof body.hesabpay_account_number === "string" &&
      body.hesabpay_account_number.trim()
        ? body.hesabpay_account_number.trim()
        : null;

  if (
    Object.keys(hotelData).length === 0 &&
    Object.keys(ownerData).length === 0
  ) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    if (Object.keys(hotelData).length > 0) {
      await prisma.hotels.update({ where: { id: hotelId }, data: hotelData });
    }
    if (Object.keys(ownerData).length > 0) {
      await prisma.hotel_owners.updateMany({
        where: { hotel_id: hotelId, user_id: user.id },
        data: ownerData,
      });
    }

    const fresh = await prisma.hotels.findUnique({
      where: { id: hotelId },
      include: { hotel_owner: true, subscription_plans: true },
    });

    return NextResponse.json({ hotel: serialize(fresh) });
  } catch (err) {
    console.error("Update hotel error:", err);
    return NextResponse.json(
      { error: "Failed to update hotel" },
      { status: 400 },
    );
  }
}
