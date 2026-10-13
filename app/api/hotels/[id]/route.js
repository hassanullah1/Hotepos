import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

const HOTEL_DETAIL_SELECT = {
  id: true,
  name: true,
  slug: true,
  logo_url: true,
  subscription_plan_id: true,
  subscription_status: true,
  verification_status: true,
  is_online: true,
  created_at: true,
  updated_at: true,
  hotel_owner: {
    select: {
      user_id: true,
      address: true,
      created_at: true,
      users: {
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
          username: true,
          is_active: true,
        },
      },
    },
  },
  subscription_plans: {
    select: {
      id: true,
      name: true,
      max_branches: true,
      max_pos_devices: true,
      price_monthly: true,
      features: true,
    },
  },
  branches: {
    select: {
      id: true,
      name: true,
      code: true,
      address: true,
      city: true,
      phone: true,
      currency: true,
      timezone: true,
      tax_rate: true,
      service_charge_rate: true,
      status: true,
      opening_time: true,
      closing_time: true,
      created_at: true,
      _count: {
        select: { users: true, dining_tables: true, menu_items: true },
      },
    },
    orderBy: { created_at: "asc" },
  },
};

function serializeHotelDetail(h) {
  const worker_count = (h.branches || []).reduce(
    (sum, b) => sum + (b._count?.users ?? 0),
    0,
  );
  return {
    id: h.id,
    name: h.name,
    slug: h.slug,
    owner: h.hotel_owner
      ? {
          id: h.hotel_owner.users.id,
          full_name: h.hotel_owner.users.full_name,
          email: h.hotel_owner.users.email,
          phone: h.hotel_owner.users.phone,
          username: h.hotel_owner.users.username,
          is_active: h.hotel_owner.users.is_active,
          address: h.hotel_owner.address,
          owned_since: h.hotel_owner.created_at,
        }
      : null,
    logo_url: h.logo_url,
    subscription_plan_id: h.subscription_plan_id,
    subscription_plan: h.subscription_plans,
    monthly_due: h.subscription_plans?.price_monthly ?? null,
    subscription_status: h.subscription_status,
    verification_status: h.verification_status || "pending",
    is_online: h.is_online ?? false,
    branches: (h.branches || []).map((b) => ({
      id: b.id,
      name: b.name,
      code: b.code,
      address: b.address,
      city: b.city,
      phone: b.phone,
      currency: b.currency,
      timezone: b.timezone,
      tax_rate: b.tax_rate,
      service_charge_rate: b.service_charge_rate,
      status: b.status,
      opening_time: b.opening_time,
      closing_time: b.closing_time,
      created_at: b.created_at,
      staff_count: b._count?.users ?? 0,
      table_count: b._count?.dining_tables ?? 0,
      menu_item_count: b._count?.menu_items ?? 0,
    })),
    worker_count,
    created_at: h.created_at,
    updated_at: h.updated_at,
  };
}

async function loadHotel(id) {
  return prisma.hotels.findUnique({
    where: { id },
    select: HOTEL_DETAIL_SELECT,
  });
}

function canAccess(user, hotelId) {
  if (user.roles.name === "super_admin") return true;
  if (user.roles.name === "hotel_owner")
    return (user.owned_hotel_ids || []).includes(hotelId);
  return false;
}

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireRole(user, ["super_admin", "hotel_owner"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  if (!canAccess(user, id))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const hotel = await loadHotel(id);
  if (!hotel)
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });

  let other_hotels = [];
  if (hotel.hotel_owner) {
    const others = await prisma.hotel_owners.findMany({
      where: { user_id: hotel.hotel_owner.users.id, NOT: { hotel_id: id } },
      select: { hotels: { select: { id: true, name: true, slug: true } } },
    });
    other_hotels = others.map((o) => o.hotels);
  }

  return NextResponse.json({
    hotel: serializeHotelDetail(hotel),
    other_hotels,
  });
}

export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireRole(user, ["super_admin", "hotel_owner"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  if (!canAccess(user, id))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const data = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.logo_url !== undefined) data.logo_url = body.logo_url || null;
  if (body.subscription_status !== undefined)
    data.subscription_status = body.subscription_status;

  if (body.verification_status !== undefined) {
    if (!requireRole(user, ["super_admin"])) {
      return NextResponse.json(
        { error: "Only super_admin can change verification status" },
        { status: 403 },
      );
    }
    const allowed = ["pending", "contacted", "verified", "rejected"];
    if (!allowed.includes(body.verification_status)) {
      return NextResponse.json(
        { error: "Invalid verification_status" },
        { status: 400 },
      );
    }
    data.verification_status = body.verification_status;
  }

  if (body.is_online !== undefined) {
    if (!requireRole(user, ["super_admin"])) {
      return NextResponse.json(
        { error: "Only super_admin can change online status" },
        { status: 403 },
      );
    }
    data.is_online = !!body.is_online;
  }

  if (requireRole(user, ["super_admin"])) {
    if (body.slug !== undefined && body.slug) {
      const conflict = await prisma.hotels.findFirst({
        where: { slug: body.slug, NOT: { id } },
        select: { id: true },
      });
      if (conflict)
        return NextResponse.json(
          { error: "Slug already in use" },
          { status: 409 },
        );
      data.slug = body.slug;
    }
    if (body.subscription_plan_id !== undefined) {
      data.subscription_plan_id = body.subscription_plan_id || null;
    }
  }

  try {
    await prisma.hotels.update({ where: { id }, data });
    const hotel = await loadHotel(id);
    return NextResponse.json({ hotel: serializeHotelDetail(hotel) });
  } catch (err) {
    console.error("Update hotel error:", err);
    return NextResponse.json(
      { error: "Failed to update hotel" },
      { status: 400 },
    );
  }
}

export async function DELETE(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireRole(user, ["super_admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  try {
    await prisma.hotels.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete hotel error:", err);
    return NextResponse.json(
      { error: "Failed to delete hotel" },
      { status: 400 },
    );
  }
}
