import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL missing in .env");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// -------------------------------------------------------------------
// Permission & role definitions
// -------------------------------------------------------------------
const PERMISSIONS = [
  { code: "hotels.view", description: "View hotels" },
  { code: "hotels.manage", description: "Create and edit hotels" },
  { code: "branches.view", description: "View branches" },
  { code: "branches.manage", description: "Create and edit branches" },
  { code: "users.view", description: "View users" },
  {
    code: "users.manage",
    description: "Create, edit, and assign roles to users",
  },
  { code: "roles.view", description: "View roles and permissions" },
  { code: "roles.manage", description: "Create roles and attach permissions" },
  { code: "orders.view", description: "View orders" },
  { code: "orders.manage", description: "Create and update orders" },
  { code: "inventory.view", description: "View inventory" },
  { code: "inventory.manage", description: "Adjust inventory" },
  { code: "reports.view", description: "View reports" },
];

const ROLES = [
  { name: "super_admin", scope: "platform" },
  { name: "hotel_owner", scope: "hotel" },
  { name: "branch_manager", scope: "branch" },
  { name: "waiter", scope: "branch" },
  { name: "cashier", scope: "branch" },
  { name: "kitchen", scope: "branch" },
];

async function main() {
  console.log("Seeding permissions…");
  const permissions = await Promise.all(
    PERMISSIONS.map((p) =>
      prisma.permissions.upsert({
        where: { code: p.code },
        update: { description: p.description },
        create: p,
      }),
    ),
  );

  console.log("Seeding roles…");
  const roles = {};
  for (const r of ROLES) {
    roles[r.name] = await prisma.roles.upsert({
      where: { name: r.name },
      update: { scope: r.scope },
      create: r,
    });
  }

  // super_admin gets every permission
  await prisma.role_permissions.createMany({
    data: permissions.map((p) => ({
      role_id: roles.super_admin.id,
      permission_id: p.id,
    })),
    skipDuplicates: true,
  });

  // hotel_owner
  const ownerCodes = [
    "hotel.view",
    "branches.view",
    "branches.manage",
    "users.view",
    "users.manage",
    "orders.view",
    "orders.manage",
    "reports.view",
    "inventory.view",
  ];
  await prisma.role_permissions.createMany({
    data: permissions
      .filter((p) => ownerCodes.includes(p.code))
      .map((p) => ({ role_id: roles.hotel_owner.id, permission_id: p.id })),
    skipDuplicates: true,
  });

  // branch_manager
  const managerCodes = [
    "users.view",
    "users.manage",
    "orders.view",
    "orders.manage",
    "inventory.view",
    "inventory.manage",
    "reports.view",
  ];
  await prisma.role_permissions.createMany({
    data: permissions
      .filter((p) => managerCodes.includes(p.code))
      .map((p) => ({ role_id: roles.branch_manager.id, permission_id: p.id })),
    skipDuplicates: true,
  });

  // waiter / cashier / kitchen
  for (const roleName of ["waiter", "cashier", "kitchen"]) {
    await prisma.role_permissions.createMany({
      data: permissions
        .filter((p) => ["orders.view", "orders.manage"].includes(p.code))
        .map((p) => ({ role_id: roles[roleName].id, permission_id: p.id })),
      skipDuplicates: true,
    });
  }

  // ---------------------------------------------------------------
  // Platform Super Admin (scope: platform — no hotel, no branch)
  // ---------------------------------------------------------------
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@platform.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
  const adminName = process.env.SEED_ADMIN_NAME || "Platform Super Admin";

  console.log(`Seeding platform admin: ${adminEmail}`);
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.users.upsert({
    where: { email: adminEmail.toLowerCase() },
    update: { role_id: roles.super_admin.id },
    create: {
      full_name: adminName,
      email: adminEmail.toLowerCase(),
      password_hash: adminPasswordHash,
      role_id: roles.super_admin.id,
    },
  });

  // ---------------------------------------------------------------
  // Sample Hotel + Hotel Owner (scope: hotel — 1-to-1 profile)
  // ---------------------------------------------------------------
  const hotelSlug = process.env.SEED_HOTEL_SLUG || "kohistan-demo";
  const hotel = await prisma.hotels.upsert({
    where: { slug: hotelSlug },
    update: {},
    create: {
      name: process.env.SEED_HOTEL_NAME || "Kohistan Demo Hotel",
      slug: hotelSlug,
      subscription_status: "trial",
    },
  });

  const ownerEmail = process.env.SEED_OWNER_EMAIL || "owner@kohistan.local";
  const ownerPassword = process.env.SEED_OWNER_PASSWORD || "OwnerPass123!";
  const ownerName = process.env.SEED_OWNER_NAME || "Hotel Owner";

  console.log(`Seeding hotel owner: ${ownerEmail}`);
  const ownerPasswordHash = await bcrypt.hash(ownerPassword, 12);

  const ownerUser = await prisma.users.upsert({
    where: { email: ownerEmail.toLowerCase() },
    update: { role_id: roles.hotel_owner.id },
    create: {
      full_name: ownerName,
      email: ownerEmail.toLowerCase(),
      password_hash: ownerPasswordHash,
      role_id: roles.hotel_owner.id,
    },
  });

  // Create the 1-to-1 hotel_owners profile (this is the "separate form")
  // Create the 1-to-1 hotel_owners profile (this is the "separate form")
  await prisma.hotel_owners.upsert({
    where: { hotel_id: hotel.id },
    update: { user_id: ownerUser.id },
    create: {
      user_id: ownerUser.id,
      hotel_id: hotel.id,
      address: process.env.SEED_OWNER_ADDRESS || null,
    },
  });

  // ---------------------------------------------------------------
  // Sample Branch + Branch Manager (scope: branch)
  // ---------------------------------------------------------------
  const branch = await prisma.branches.upsert({
    where: { hotel_id_code: { hotel_id: hotel.id, code: "MAIN" } },
    update: {},
    create: {
      hotel_id: hotel.id,
      name: "Main Branch",
      code: "MAIN",
    },
  });

  const managerEmail =
    process.env.SEED_MANAGER_EMAIL || "manager@kohistan.local";
  const managerPassword =
    process.env.SEED_MANAGER_PASSWORD || "ManagerPass123!";
  const managerPasswordHash = await bcrypt.hash(managerPassword, 12);

  await prisma.users.upsert({
    where: { email: managerEmail.toLowerCase() },
    update: { role_id: roles.branch_manager.id, branch_id: branch.id },
    create: {
      full_name: "Branch Manager",
      email: managerEmail.toLowerCase(),
      password_hash: managerPasswordHash,
      role_id: roles.branch_manager.id,
      branch_id: branch.id,
    },
  });

  console.log("✅ Seed complete.");
  console.log(`🔑 Super admin : ${adminEmail} / ${adminPassword}`);
  console.log(
    `🔑 Hotel owner : ${ownerEmail} / ${ownerPassword}  (hotel: ${hotel.slug})`,
  );
  console.log(
    `🔑 Manager     : ${managerEmail} / ${managerPassword}  (branch: ${branch.code})`,
  );
  console.log("⚠️  Change these passwords after first login!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
