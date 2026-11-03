import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/app/admin/email";

/* ─────────────────────────────────────────────────────────────
   Input shape for createExpiredHotel
   ───────────────────────────────────────────────────────────── */
type CreateExpiredHotelInput = {
  hotel_name: string;
  owner_name: string;
  email: string;
  phone?: string | null;
  subscription_plan_id: string;
  business_type_id?: string | null;
};

/* ─────────────────────────────────────────────────────────────
   Creates the hotel + owner user in an EXPIRED state.
   Owner user has password_hash = null (they set it via reset link).
   Idempotent: if this email already owns a hotel, that one is reused
   and its editable fields (name, plan, business type) are refreshed.
   ───────────────────────────────────────────────────────────── */
export async function createExpiredHotel(data: CreateExpiredHotelInput) {
  const {
    hotel_name,
    owner_name,
    email,
    phone,
    subscription_plan_id,
    business_type_id,
  } = data;

  const normalizedEmail = email.trim().toLowerCase();

  /* ── 1. Reuse existing hotel for this email (abandoned signup / retry) ── */
  const existingUser = await prisma.users.findUnique({
    where: { email: normalizedEmail },
    include: { hotel_owners: { include: { hotels: true } } },
  });

  if (existingUser?.hotel_owners?.[0]?.hotels) {
    const existingHotel = existingUser.hotel_owners[0].hotels;

    // Build an update that only sets business_type_id when the caller
    // actually supplied one — never clobber a previously chosen type
    // with null on a retry that didn't pick one.
    const updateData: Record<string, unknown> = {
      name: hotel_name.trim(),
      subscription_plan_id,
    };
    if (business_type_id) {
      updateData.business_type_id = business_type_id;
    }

    const refreshed = await prisma.hotels.update({
      where: { id: existingHotel.id },
      data: updateData,
    });

    return { hotel: refreshed, isNew: false };
  }

  /* ── 2. Fresh signup — create user role, slug, hotel, owner profile ── */
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
      business_type_id: business_type_id ?? null,
    },
  });

  /* ── 3. Resolve the phone (only if it isn't already used elsewhere) ── */
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

  /* ── 4. Create (or link) the owner user ── */
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

/* ─────────────────────────────────────────────────────────────
   Activate a hotel after successful payment. IDEMPOTENT.
   (unchanged)
   ───────────────────────────────────────────────────────────── */
export async function activateHotel(hotelId: string) {
  const hotel = await prisma.hotels.findUnique({ where: { id: hotelId } });
  if (!hotel) throw new Error("hotel_not_found");

  const now = new Date();

  if (
    hotel.subscription_status === "active" &&
    hotel.subscription_expires_at &&
    new Date(hotel.subscription_expires_at) > now
  ) {
    console.log("[activateHotel] already active, skipping:", hotelId);
    return {
      hotel,
      resetLinkSent: false,
      already_active: true,
    };
  }

  const currentExpiry = hotel.subscription_expires_at
    ? new Date(hotel.subscription_expires_at)
    : null;
  const base = currentExpiry && currentExpiry > now ? currentExpiry : now;
  const newExpiry = new Date(base);
  newExpiry.setMonth(newExpiry.getMonth() + 1);

  const updateResult = await prisma.hotels.updateMany({
    where: {
      id: hotel.id,
      OR: [
        { subscription_status: { not: "active" } },
        { subscription_expires_at: { lte: now } },
      ],
    },
    data: {
      subscription_status: "active",
      subscription_expires_at: newExpiry,
    },
  });

  if (updateResult.count === 0) {
    console.log(
      "[activateHotel] lost race, already activated by another call:",
      hotelId,
    );
    const fresh = await prisma.hotels.findUnique({ where: { id: hotelId } });
    return {
      hotel: fresh || hotel,
      resetLinkSent: false,
      already_active: true,
    };
  }

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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const link = `${appUrl}/reset-password?token=${resetToken}`;

    try {
      await sendPasswordResetEmail({
        to: owner.users.email,
        ownerName: owner.users.full_name,
        link,
      });
      resetLinkSent = true;
      console.log("[activateHotel] password email sent to:", owner.users.email);
    } catch (err) {
      console.error("[activateHotel] password email failed:", err);
    }
  }

  const updatedHotel = await prisma.hotels.findUnique({
    where: { id: hotelId },
  });

  return { hotel: updatedHotel || hotel, resetLinkSent };
}

/* ─────────────────────────────────────────────────────────────
   Admin approval path (WhatsApp) — creates + activates in one shot.

   `signup` is a pending_signups row. It may or may not have a
   business_type_id column — `?? null` handles both cases cleanly.
   ───────────────────────────────────────────────────────────── */
export async function provisionHotelFromSignup(signup: {
  hotel_name: string;
  owner_name: string;
  email: string;
  phone?: string | null;
  subscription_plan_id: string;
  business_type_id?: string | null;
}) {
  const { hotel } = await createExpiredHotel({
    hotel_name: signup.hotel_name,
    owner_name: signup.owner_name,
    email: signup.email,
    phone: signup.phone,
    subscription_plan_id: signup.subscription_plan_id,
    business_type_id: signup.business_type_id ?? null,
  });

  await activateHotel(hotel.id);
  return { hotel };
}

/* ─────────────────────────────────────────────────────────────
   Slug generation (unchanged)
   ───────────────────────────────────────────────────────────── */
async function uniqueSlug(name: string): Promise<string> {
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
