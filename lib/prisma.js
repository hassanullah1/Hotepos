// Prisma 7 - driver adapter pattern.
// PrismaClient is imported from the generated output folder
// (set in prisma/schema.prisma -> generator client { output = "../generated/prisma" }),
// not from "@prisma/client" directly.
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis;

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
