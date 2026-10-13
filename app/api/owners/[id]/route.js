import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, requireRole, hashPassword } from "@/lib/auth";

const OWNER_DETAIL_SELECT = {
  id: true,
  full_name: true,
  email: true,
  phone: true,
  username: true,
  is_active: true,
  created_at: true,
  updated_at: true,
  hotel_owners: {
    select: {
      hotel_id: true,
      address: true,
      hesabpay_account_number: true,
      created_at: true,
      hotels: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo_url: true,
          subscription_status: true,
          created_at: true,
          subscription_plans: {
            select: {
              id: true,
              name: true,
              price_monthly: true,
              max_branches: true,
              max_pos_devices: true,
            },
          },
          branches: {
            select: {
              id: true,
              name: true,
              _count: { select: { users: true } },
            },
          },
        },
      },
    },
  },
};

function serializeOwnerDetail(u) {
  const ownerEntries = u.hotel_owners || [];
  const hotels = ownerEntries.map((ho) => {
    const hotel = ho.hotels;
    const workerCount = (hotel.branches || []).reduce(
      (sum, b) => sum + (b._count?.users ?? 0),
      0,
    );
    return {
      id: hotel.id,
      name: hotel.name,
      slug: hotel.slug,
      logo_url: hotel.logo_url,
      address: ho.address,
      hesabpay_account_number: ho.hesabpay_account_number,
      owned_since: ho.created_at,
      subscription_status: hotel.subscription_status,
      plan: hotel.subscription_plans,
      monthly_due: hotel.subscription_plans?.price_monthly ?? null,
      branch_count: hotel.branches?.length ?? 0,
      worker_count: workerCount,
      created_at: hotel.created_at,
    };
  });

  return {
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    phone: u.phone,
    username: u.username,
    is_active: u.is_active,
    created_at: u.created_at,
    updated_at: u.updated_at,
    hotels,
    hotel_count: hotels.length,
    total_monthly_due: hotels.reduce(
      (sum, h) => sum + Number(h.monthly_due ?? 0),
      0,
    ),
    total_branches: hotels.reduce((sum, h) => sum + h.branch_count, 0),
    total_workers: hotels.reduce((sum, h) => sum + h.worker_count, 0),
  };
}

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (user.roles?.name !== "super_admin" && user.id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const owner = await prisma.users.findUnique({
    where: { id },
    select: OWNER_DETAIL_SELECT,
  });
  if (!owner)
    return NextResponse.json({ error: "Owner not found" }, { status: 404 });

  return NextResponse.json({ owner: serializeOwnerDetail(owner) });
}

export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (user.roles?.name !== "super_admin" && user.id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const data = {};

  if (body.full_name !== undefined) data.full_name = body.full_name;
  if (body.username !== undefined) data.username = body.username || null;

  if (body.is_active !== undefined) {
    if (user.roles?.name !== "super_admin") {
      return NextResponse.json(
        { error: "Only super_admin can change active status" },
        { status: 403 },
      );
    }
    data.is_active = !!body.is_active;
  }

  if (body.email !== undefined) {
    if (body.email) {
      const conflict = await prisma.users.findFirst({
        where: { email: body.email, NOT: { id } },
      });
      if (conflict)
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 },
        );
    }
    data.email = body.email || null;
  }

  if (body.phone !== undefined) {
    if (body.phone) {
      const conflict = await prisma.users.findFirst({
        where: { phone: body.phone, NOT: { id } },
      });
      if (conflict)
        return NextResponse.json(
          { error: "Phone already in use" },
          { status: 409 },
        );
    }
    data.phone = body.phone || null;
  }

  if (body.password) {
    data.password_hash = await hashPassword(body.password);
  }

  try {
    await prisma.users.update({ where: { id }, data });
    const owner = await prisma.users.findUnique({
      where: { id },
      select: OWNER_DETAIL_SELECT,
    });
    return NextResponse.json({ owner: serializeOwnerDetail(owner) });
  } catch (err) {
    console.error("Update owner error:", err);
    return NextResponse.json(
      { error: "Failed to update owner" },
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

  const hotelCount = await prisma.hotel_owners.count({
    where: { user_id: id },
  });
  if (hotelCount > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete — this owner still has ${hotelCount} hotel(s). Reassign or delete those hotels first.`,
      },
      { status: 409 },
    );
  }

  try {
    await prisma.users.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete owner error:", err);
    return NextResponse.json(
      { error: "Failed to delete owner" },
      { status: 400 },
    );
  }
}
