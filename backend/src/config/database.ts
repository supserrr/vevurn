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

// Database connection test - non-blocking for development
let isDbConnected = false;

export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    isDbConnected = true;
    logger.info('📦 Database connected successfully');
    return true;
  } catch (error) {
    isDbConnected = false;
    logger.error('❌ Database connection failed:', error);
    logger.warn('⚠️ API will continue without database features');
    return false;
  }
};

export const isDatabaseConnected = () => isDbConnected;
