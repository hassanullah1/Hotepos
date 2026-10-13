import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, requireRole, hashPassword } from "@/lib/auth";

const OWNER_SELECT = {
  id: true,
  full_name: true,
  email: true,
  phone: true,
  username: true,
  is_active: true,
  created_at: true,
  hotel_owners: {
    select: {
      hotel_id: true,
      address: true,
      hesabpay_account_number: true,
      hotels: {
        select: {
          id: true,
          name: true,
          slug: true,
          subscription_status: true,
          subscription_plans: { select: { name: true, price_monthly: true } },
          branches: {
            select: { id: true, _count: { select: { users: true } } },
          },
        },
      },
    },
  },
};

function serializeOwner(u) {
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
      address: ho.address,
      hesabpay_account_number: ho.hesabpay_account_number,
      subscription_status: hotel.subscription_status,
      plan_name: hotel.subscription_plans?.name ?? null,
      monthly_due: hotel.subscription_plans?.price_monthly ?? null,
      branch_count: hotel.branches?.length ?? 0,
      worker_count: workerCount,
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

// GET /api/owners?q=ali
export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireRole(user, ["super_admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();

  const ownerRole = await prisma.roles.findUnique({
    where: { name: "hotel_owner" },
  });
  if (!ownerRole) return NextResponse.json({ owners: [] });

  const where = { role_id: ownerRole.id };
  if (q) {
    where.OR = [
      { full_name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
    ];
  }

  const owners = await prisma.users.findMany({
    where,
    select: OWNER_SELECT,
    orderBy: { created_at: "desc" },
  });

  const serialized = owners.map(serializeOwner);

  return NextResponse.json({
    owners: serialized,
    total_monthly_due: serialized.reduce(
      (sum, o) => sum + o.total_monthly_due,
      0,
    ),
  });
}

// POST /api/owners
export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireRole(user, ["super_admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.full_name || !body.password) {
    return NextResponse.json(
      { error: "full_name and password are required" },
      { status: 400 },
    );
  }

  if (body.email) {
    const conflict = await prisma.users.findFirst({
      where: { email: body.email },
    });
    if (conflict)
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 },
      );
  }
  if (body.phone) {
    const conflict = await prisma.users.findFirst({
      where: { phone: body.phone },
    });
    if (conflict)
      return NextResponse.json(
        { error: "Phone already in use" },
        { status: 409 },
      );
  }

  const ownerRole = await prisma.roles.findUnique({
    where: { name: "hotel_owner" },
  });
  if (!ownerRole) {
    return NextResponse.json(
      { error: "hotel_owner role is not configured" },
      { status: 500 },
    );
  }

  try {
    const password_hash = await hashPassword(body.password);
    const owner = await prisma.users.create({
      data: {
        full_name: body.full_name,
        email: body.email || null,
        phone: body.phone || null,
        username: body.username || null,
        password_hash,
        role_id: ownerRole.id,
        is_active: body.is_active ?? true,
      },
      select: OWNER_SELECT,
    });
    return NextResponse.json({ owner: serializeOwner(owner) }, { status: 201 });
  } catch (err) {
    console.error("Create owner error:", err);
    return NextResponse.json(
      { error: "Failed to create owner" },
      { status: 400 },
    );
  }
}
