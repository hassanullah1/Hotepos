// Prisma 7 reads the DB connection URL from here (for migrate/studio/etc),
// not from schema.prisma anymore. The Prisma Client itself still gets its
// own adapter + connection string separately, in lib/prisma.js.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
