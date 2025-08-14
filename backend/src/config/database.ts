import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Database connection test
prisma.$connect()
  .then(() => {
    logger.info('📦 Database connected successfully');
  })
  .catch((error) => {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  });
