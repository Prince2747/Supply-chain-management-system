import { PrismaClient } from './generated/prisma';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Add connection pooling parameters to DATABASE_URL if not already present
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) return url;
  
  // If using pgbouncer, add connection pool settings
  if (url.includes('pgbouncer=true')) {
    const urlObj = new URL(url);
    if (!urlObj.searchParams.has('connection_limit')) {
      urlObj.searchParams.set('connection_limit', '1');
      urlObj.searchParams.set('pool_timeout', '20');
      return urlObj.toString();
    }
  }
  return url;
};

export const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl()
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;