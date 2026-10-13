import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, requireRole, hashPassword } from "@/lib/auth";

export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireRole(user, ["super_admin", "hotel_owner"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const link = await prisma.hotel_owners.findUnique({
    where: { hotel_id: id },
    select: { user_id: true },
  });
  if (!link)
    return NextResponse.json({ error: "Hotel has no owner" }, { status: 404 });

  if (user.role_name === "hotel_owner" && user.id !== link.user_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  // user-identity fields — shared across ALL hotels this owner has
  const userData = {};
  if (body.full_name !== undefined) userData.full_name = body.full_name;
  if (body.username !== undefined) userData.username = body.username || null;
  if (body.is_active !== undefined && requireRole(user, ["super_admin"])) {
    userData.is_active = body.is_active;
  }
  if (body.email !== undefined) {
    if (body.email) {
      const conflict = await prisma.users.findFirst({
        where: { email: body.email, NOT: { id: link.user_id } },
      });
      if (conflict)
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 },
        );
    }
    userData.email = body.email || null;
  }
  if (body.phone !== undefined) {
    if (body.phone) {
      const conflict = await prisma.users.findFirst({
        where: { phone: body.phone, NOT: { id: link.user_id } },
      });
      if (conflict)
        return NextResponse.json(
          { error: "Phone already in use" },
          { status: 409 },
        );
    }
    userData.phone = body.phone || null;
  }
  if (body.password) {
    userData.password_hash = await hashPassword(body.password);
  }

  // address + hesabpay account number — per-hotel, on hotel_owners row
  const profileData = {};
  if (body.address !== undefined) profileData.address = body.address || null;
  if (body.hesabpay_account_number !== undefined) {
    profileData.hesabpay_account_number = body.hesabpay_account_number || null;
  }

  try {
    await prisma.$transaction([
      ...(Object.keys(userData).length
        ? [prisma.users.update({ where: { id: link.user_id }, data: userData })]
        : []),
      ...(Object.keys(profileData).length
        ? [
            prisma.hotel_owners.update({
              where: { hotel_id: id },
              data: profileData,
            }),
          ]
        : []),
    ]);

    const updated = await prisma.users.findUnique({
      where: { id: link.user_id },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        username: true,
        is_active: true,
      },
    });
    const profile = await prisma.hotel_owners.findUnique({
      where: { hotel_id: id },
      select: { address: true, hesabpay_account_number: true },
    });

    return NextResponse.json({
      owner: {
        ...updated,
        address: profile?.address ?? null,
        hesabpay_account_number: profile?.hesabpay_account_number ?? null,
      },
    });
  } catch (err) {
    console.error("Update owner error:", err);
    return NextResponse.json(
      { error: "Failed to update owner" },
      { status: 400 },
    );
  }
}
