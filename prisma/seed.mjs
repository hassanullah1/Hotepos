// prisma/seed.mjs
// Run with: node prisma/seed.mjs
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "admin@rawanlogistic.com";
  const plainPassword = "ChangeMe123!"; // change this after first login

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Superadmin already exists:", email);
    return;
  }

  const hashed = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.create({
    data: {
      name: "Super Admin",
      email,
      password: hashed,
      role: "SUPERADMIN",
      isActive: true,
    },
  });

  console.log("Created superadmin:", user.email);
  console.log("Temporary password:", plainPassword);
  console.log("IMPORTANT: log in and change this password immediately.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
