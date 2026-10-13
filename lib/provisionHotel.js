import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Shared by both the HesabPay webhook (automatic) and the admin "approve"
// endpoint (manual, for WhatsApp orders confirmed by a human). Both paths
// must produce the exact same result: a hotel, an owner user, and the
// 1-to-1 hotel_owners profile linking them — the same shape
// prisma/seed.js creates by hand.
//
// Options:
//   generatePassword (default true)
//     true  → generate a random temp password, hash it, log it.
//              Used by the admin-approve path (WhatsApp orders), where a
//              human will hand the credentials to the customer.
//     false → create the owner WITHOUT a password_hash, and skip the
//              logging. Used when the customer is going to set their own
//              password right after payment.
export async function provisionHotelFromSignup(
  signup,
  { generatePassword = true } = {},
) {
  const ownerRole = await prisma.roles.upsert({
    where: { name: "hotel_owner" },
    update: {},
    create: { name: "hotel_owner", scope: "hotel" },
  });

  const slug = await uniqueSlug(signup.hotel_name);

  // Every new hotel gets 1 month from now, regardless of plan. Renewals
  // (via /api/renew/confirm or the HesabPay webhook) extend this on top
  // of whatever is already there.
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  const hotel = await prisma.hotels.create({
    data: {
      name: signup.hotel_name,
      slug,
      subscription_plan_id: signup.subscription_plan_id,
      subscription_status: "active",
      subscription_expires_at: expiresAt,
    },
  });

  // Only generate + log a temp password when the caller actually wants one.
  let tempPassword = null;
  let passwordHash = null;
  if (generatePassword) {
    tempPassword = crypto.randomBytes(6).toString("hex");
    passwordHash = await bcrypt.hash(tempPassword, 12);
  }

  // users.phone is @unique. If this phone number already belongs to a
  // different user (e.g. an earlier test signup with the same phone), the
  // create below would fail with P2002. Detect that and drop the phone
  // rather than failing the whole provision — the email is the identity.
  let phoneValue = signup.phone?.trim() || undefined;
  if (phoneValue) {
    const existingPhoneOwner = await prisma.users.findUnique({
      where: { phone: phoneValue },
    });
    if (
      existingPhoneOwner &&
      existingPhoneOwner.email?.toLowerCase() !== signup.email?.toLowerCase()
    ) {
      console.warn(
        `Phone ${phoneValue} already belongs to ${existingPhoneOwner.email}; ` +
          `omitting it for new owner ${signup.email}.`,
      );
      phoneValue = undefined;
    }
  }

  const ownerUser = await prisma.users.upsert({
    where: { email: signup.email },
    update: {
      role_id: ownerRole.id,
      // Only touch password_hash when we generated a new one — otherwise
      // leave whatever is there (null for fresh self-service owners, or an
      // existing hash if this email already had an account).
      ...(passwordHash ? { password_hash: passwordHash } : {}),
    },
    create: {
      full_name: signup.owner_name,
      email: signup.email,
      phone: phoneValue,
      password_hash: passwordHash,
      role_id: ownerRole.id,
    },
  });

  await prisma.hotel_owners.upsert({
    where: { hotel_id: hotel.id },
    update: { user_id: ownerUser.id },
    create: { user_id: ownerUser.id, hotel_id: hotel.id },
  });

  if (generatePassword) {
    console.log(
      `✅ Hotel account created for ${signup.email}. Temp password: ${tempPassword}`,
    );
  } else {
    console.log(
      `✅ Hotel account created for ${signup.email}. Password to be set by customer.`,
    );
  }

  return { hotel, tempPassword };
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
