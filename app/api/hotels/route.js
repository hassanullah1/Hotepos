import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, requireRole, hashPassword } from "@/lib/auth";

const HOTEL_SELECT = {
  id: true,
  name: true,
  slug: true,
  logo_url: true,
  subscription_plan_id: true,
  subscription_status: true,
  is_online: true,
  created_at: true,
  updated_at: true,
  hotel_owner: {
    select: {
      user_id: true,
      address: true,
      users: {
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
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
    },
  },
  branches: { select: { id: true, _count: { select: { users: true } } } },
  _count: { select: { branches: true } },
};

function serializeHotel(h) {
  const worker_count = (h.branches || []).reduce(
    (sum, b) => sum + (b._count?.users ?? 0),
    0,
  );
  return {
    id: h.id,
    name: h.name,
    slug: h.slug,
    owner_id: h.hotel_owner?.user_id ?? null,
    owner_name: h.hotel_owner?.users?.full_name ?? null,
    owner_email: h.hotel_owner?.users?.email ?? null,
    owner_phone: h.hotel_owner?.users?.phone ?? null,
    owner_is_active: h.hotel_owner?.users?.is_active ?? null,
    owner_address: h.hotel_owner?.address ?? null,
    logo_url: h.logo_url,
    subscription_plan_id: h.subscription_plan_id,
    subscription_plan_name: h.subscription_plans?.name ?? null,
    monthly_due: h.subscription_plans?.price_monthly ?? null,
    subscription_status: h.subscription_status,
    is_online: h.is_online ?? false,
    branch_count: h._count?.branches ?? 0,
    worker_count,
    created_at: h.created_at,
    updated_at: h.updated_at,
  };
}

function slugify(value) {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uniqueSlug(base) {
  const root = base || "hotel";
  let slug = root;
  let i = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.hotels.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing) return slug;
    i += 1;
    slug = `${root}-${i}`;
  }
}

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireRole(user, ["super_admin", "hotel_owner"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const ownerQ = (searchParams.get("owner") || "").trim();
  const verification = (searchParams.get("verification") || "").trim();

  const where = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }
  if (ownerQ) {
    where.hotel_owner = {
      users: {
        OR: [
          { full_name: { contains: ownerQ, mode: "insensitive" } },
          { email: { contains: ownerQ, mode: "insensitive" } },
          { phone: { contains: ownerQ, mode: "insensitive" } },
        ],
      },
    };
  }
  if (
    verification &&
    ["pending", "contacted", "verified", "rejected"].includes(verification)
  ) {
    where.verification_status = verification;
  }

  if (user.roles?.name === "hotel_owner") {
    const ownerProfiles = await prisma.hotel_owners.findMany({
      where: { user_id: user.id },
      select: { hotel_id: true },
    });
    const ownedHotelIds = ownerProfiles.map((p) => p.hotel_id);

    if (ownedHotelIds.length === 0) {
      return NextResponse.json({ hotels: [], total_monthly_due: 0 });
    }

    where.id = { in: ownedHotelIds };
  }

  const hotels = await prisma.hotels.findMany({
    where,
    select: HOTEL_SELECT,
    orderBy: { created_at: "desc" },
  });

  return NextResponse.json({
    hotels: hotels.map(serializeHotel),
    total_monthly_due: hotels.reduce(
      (sum, h) => sum + Number(h.subscription_plans?.price_monthly ?? 0),
      0,
    ),
  });
}

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireRole(user, ["super_admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { hotel, owner_mode, owner_id, owner, branches, owner_address } =
    body || {};

  if (!hotel?.name) {
    return NextResponse.json(
      { error: "hotel.name is required" },
      { status: 400 },
    );
  }
  if (!hotel?.subscription_plan_id) {
    return NextResponse.json(
      { error: "subscription_plan_id is required — create a plan first" },
      { status: 400 },
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

  let resolvedOwnerId = null;

  if (owner_mode === "existing") {
    if (!owner_id) {
      return NextResponse.json(
        { error: "owner_id is required for owner_mode=existing" },
        { status: 400 },
      );
    }
    const existing = await prisma.users.findUnique({ where: { id: owner_id } });
    if (!existing || existing.role_id !== ownerRole.id) {
      return NextResponse.json(
        { error: "owner_id is not a valid hotel_owner" },
        { status: 400 },
      );
    }
    resolvedOwnerId = existing.id;
  } else {
    if (!owner?.full_name || !owner?.password) {
      return NextResponse.json(
        { error: "owner.full_name and owner.password are required" },
        { status: 400 },
      );
    }
    if (owner.email) {
      const conflict = await prisma.users.findFirst({
        where: { email: owner.email },
      });
      if (conflict)
        return NextResponse.json(
          { error: "Owner email already in use" },
          { status: 409 },
        );
    }
    if (owner.phone) {
      const conflict = await prisma.users.findFirst({
        where: { phone: owner.phone },
      });
      if (conflict)
        return NextResponse.json(
          { error: "Owner phone already in use" },
          { status: 409 },
        );
    }
  }

  const slug = await uniqueSlug(slugify(hotel.slug || hotel.name));

  try {
    const hotelId = await prisma.$transaction(async (tx) => {
      let ownerUserId = resolvedOwnerId;

      if (owner_mode !== "existing") {
        const password_hash = await hashPassword(owner.password);
        const ownerUser = await tx.users.create({
          data: {
            full_name: owner.full_name,
            email: owner.email || null,
            phone: owner.phone || null,
            username: owner.username || null,
            password_hash,
            role_id: ownerRole.id,
            is_active: true,
          },
        });
        ownerUserId = ownerUser.id;
      }

      const createdHotel = await tx.hotels.create({
        data: {
          name: hotel.name,
          slug,
          logo_url: hotel.logo_url || null,
          subscription_plan_id: hotel.subscription_plan_id,
          subscription_status: hotel.subscription_status || "trial",
          verification_status: hotel.verification_status || "pending",
          is_online: hotel.is_online === true,
        },
      });

      await tx.hotel_owners.create({
        data: {
          hotel_id: createdHotel.id,
          user_id: ownerUserId,
          address: owner_address || owner?.address || null,
        },
      });

      if (Array.isArray(branches) && branches.length > 0) {
        const validBranches = branches.filter((b) => b?.name);
        if (validBranches.length > 0) {
          await tx.branches.createMany({
            data: validBranches.map((b) => ({
              hotel_id: createdHotel.id,
              name: b.name,
              code: b.code || null,
              address: b.address || null,
              city: b.city || null,
              phone: b.phone || null,
              currency: b.currency || "AFN",
              timezone: b.timezone || "Asia/Kabul",
              tax_rate: b.tax_rate ?? 0,
              service_charge_rate: b.service_charge_rate ?? 0,
              opening_time: b.opening_time
                ? new Date(`1970-01-01T${b.opening_time}:00Z`)
                : null,
              closing_time: b.closing_time
                ? new Date(`1970-01-01T${b.closing_time}:00Z`)
                : null,
            })),
          });
        }
      }

      return createdHotel.id;
    });

    const result = await prisma.hotels.findUnique({
      where: { id: hotelId },
      select: HOTEL_SELECT,
    });
    return NextResponse.json(
      { hotel: serializeHotel(result) },
      { status: 201 },
    );
  } catch (err) {
    console.error("Create hotel error:", err);
    return NextResponse.json(
      { error: "Failed to create hotel" },
      { status: 400 },
    );
  }
}
