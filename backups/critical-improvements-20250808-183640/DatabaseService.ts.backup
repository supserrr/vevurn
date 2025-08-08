import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export class DatabaseService {
  private prisma: PrismaClient;
  private isConnected: boolean = false;

  constructor() {
    this.prisma = new PrismaClient({
      log: ['info', 'warn', 'error'],
      errorFormat: 'pretty',
    });
  }

  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      this.isConnected = true;
      logger.info('Database connection established');
      
      // Test the connection
      await this.prisma.$queryRaw`SELECT 1`;
      logger.info('Database connection verified');
      
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error disconnecting from database:', error);
      throw error;
    }
  }

  getClient(): PrismaClient {
    if (!this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.prisma;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  async runMigrations(): Promise<void> {
    try {
      // Note: In production, run migrations separately
      // This is for development convenience
      if (process.env.NODE_ENV === 'development') {
        logger.info('Running database migrations...');
        // Migrations would be handled by Prisma CLI
      }
    } catch (error) {
      logger.error('Failed to run migrations:', error);
      throw error;
    }
  }

  // Transaction helper
  async transaction<T>(
    callback: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(callback);
  }

  // Batch operations helper
  async batchWrite(operations: any[]): Promise<any> {
    return this.prisma.$transaction(operations);
  }
}

// Export singleton instance
export const database = new DatabaseService();
