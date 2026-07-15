import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

// One PrismaClient for the whole app. In development the module registry is
// cleared on hot reload, so the instance is kept on globalThis to avoid
// opening a new connection pool per reload.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  // The app always talks to the pooled Neon endpoint; the direct connection
  // is reserved for the Prisma CLI (see prisma.config.ts).
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
