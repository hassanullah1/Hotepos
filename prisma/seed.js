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
  // ---------------------------------------------------------------
  // 1. Permissions
  // ---------------------------------------------------------------
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

  // ---------------------------------------------------------------
  // 2. Roles
  // ---------------------------------------------------------------
  console.log("Seeding roles…");
  const roles = {};
  for (const r of ROLES) {
    roles[r.name] = await prisma.roles.upsert({
      where: { name: r.name },
      update: { scope: r.scope },
      create: r,
    });
  }

  // ---------------------------------------------------------------
  // 3. Role → permission mappings
  // ---------------------------------------------------------------

  // super_admin: every permission
  await prisma.role_permissions.createMany({
    data: permissions.map((p) => ({
      role_id: roles.super_admin.id,
      permission_id: p.id,
    })),
    skipDuplicates: true,
  });

  // hotel_owner
  const ownerCodes = [
    "hotels.view",
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
  // 4. Platform Super Admin (the ONLY user this seed creates)
  // ---------------------------------------------------------------
  const adminEmail = (
    process.env.SEED_ADMIN_EMAIL || "hassanullahshahbaz74@gmail.com"
  ).toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "shahbaz@123";
  const adminName = process.env.SEED_ADMIN_NAME || "Platform Super Admin";

  console.log(`Seeding platform admin: ${adminEmail}`);
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.users.upsert({
    where: { email: adminEmail },
    update: { role_id: roles.super_admin.id },
    create: {
      full_name: adminName,
      email: adminEmail,
      password_hash: adminPasswordHash,
      role_id: roles.super_admin.id,
    },
  });

  console.log("✅ Seed complete.");
  console.log(`🔑 Super admin : ${adminEmail} / ${adminPassword}`);
  console.log("⚠️  Change this password after first login!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
