import 'server-only';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

// Prisma 7's generated client has no built-in engine — it connects through a
// driver adapter. PrismaPg wraps node-postgres (`pg`) and works with any
// Postgres (local, Neon, Supabase, Vercel Postgres) via DATABASE_URL.
function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
}

// Reuse a single client across hot reloads in development to avoid exhausting
// the database connection pool.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
