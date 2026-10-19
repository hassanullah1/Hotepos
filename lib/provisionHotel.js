import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/app/admin/email";

// ─────────────────────────────────────────────────────────────
// Creates the hotel + owner user in an EXPIRED state.
// Owner user has password_hash = null (they set it via reset link).
// Idempotent: if this email already owns a hotel, that one is reused.
// ─────────────────────────────────────────────────────────────
export async function createExpiredHotel(data) {
  const { hotel_name, owner_name, email, phone, subscription_plan_id } = data;
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.users.findUnique({
    where: { email: normalizedEmail },
    include: { hotel_owners: { include: { hotels: true } } },
  });

  if (existingUser?.hotel_owners?.[0]?.hotels) {
    const existingHotel = existingUser.hotel_owners[0].hotels;
    await prisma.hotels.update({
      where: { id: existingHotel.id },
      data: { name: hotel_name.trim(), subscription_plan_id },
    });
    return { hotel: existingHotel, isNew: false };
  }

  const ownerRole = await prisma.roles.upsert({
    where: { name: "hotel_owner" },
    update: {},
    create: { name: "hotel_owner", scope: "hotel" },
  });

  const slug = await uniqueSlug(hotel_name);
  const now = new Date();

  const hotel = await prisma.hotels.create({
    data: {
      name: hotel_name.trim(),
      slug,
      subscription_plan_id,
      subscription_status: "expired",
      subscription_expires_at: now,
    },
  });

  let phoneValue = phone?.trim() || undefined;
  if (phoneValue) {
    const existingPhoneOwner = await prisma.users.findUnique({
      where: { phone: phoneValue },
    });
    if (
      existingPhoneOwner &&
      existingPhoneOwner.email?.toLowerCase() !== normalizedEmail
    ) {
      phoneValue = undefined;
    }
  }

  const ownerUser = await prisma.users.upsert({
    where: { email: normalizedEmail },
    update: { role_id: ownerRole.id },
    create: {
      full_name: owner_name.trim(),
      email: normalizedEmail,
      phone: phoneValue,
      password_hash: null,
      role_id: ownerRole.id,
    },
  });

  await prisma.hotel_owners.create({
    data: { user_id: ownerUser.id, hotel_id: hotel.id },
  });

  return { hotel, isNew: true };
}

// ─────────────────────────────────────────────────────────────
// Activate a hotel after successful payment.
// - status → "active", expires_at = max(now, current) + 1 month
// - If owner has no password yet, generate a reset_token and email
//   them the existing reset-password link. No password_hash is set
//   here — the user chooses their own password.
// ─────────────────────────────────────────────────────────────
export async function activateHotel(hotelId) {
  const hotel = await prisma.hotels.findUnique({ where: { id: hotelId } });
  if (!hotel) throw new Error("hotel_not_found");

  const now = new Date();
  const currentExpiry = hotel.subscription_expires_at
    ? new Date(hotel.subscription_expires_at)
    : null;
  const base = currentExpiry && currentExpiry > now ? currentExpiry : now;

  const newExpiry = new Date(base);
  newExpiry.setMonth(newExpiry.getMonth() + 1);

  const updatedHotel = await prisma.hotels.update({
    where: { id: hotel.id },
    data: {
      subscription_status: "active",
      subscription_expires_at: newExpiry,
    },
  });

  // If the owner has no password yet, send them a "set your password"
  // link using the existing reset-token flow (24h expiry).
  const owner = await prisma.hotel_owners.findUnique({
    where: { hotel_id: hotel.id },
    include: { users: true },
  });

  let resetLinkSent = false;

  if (owner?.users && !owner.users.password_hash) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.users.update({
      where: { id: owner.users.id },
      data: {
        reset_token: resetToken,
        reset_token_expires_at: resetExpiry,
      },
    });

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL 
      "http://localhost:3000";
    const link = `${appUrl}/reset-password?token=${resetToken}`;

    try {
      await sendPasswordResetEmail({
        to: owner.users.email,
        ownerName: owner.users.full_name,
        link,
      });
      resetLinkSent = true;
    } catch (err) {
      console.error("Password setup email failed:", err);
    }
  }

  return { hotel: updatedHotel, resetLinkSent };
}

// ─────────────────────────────────────────────────────────────
// Admin approval path (WhatsApp) — creates + activates in one shot.
// ─────────────────────────────────────────────────────────────
export async function provisionHotelFromSignup(signup) {
  const { hotel } = await createExpiredHotel({
    hotel_name: signup.hotel_name,
    owner_name: signup.owner_name,
    email: signup.email,
    phone: signup.phone,
    subscription_plan_id: signup.subscription_plan_id,
  });

  await activateHotel(hotel.id);
  return { hotel };
}

async function uniqueSlug(name) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  let slug = base || "hotel";
  let n = 1;
  while (await prisma.hotels.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}
