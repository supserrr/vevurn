// =============================================
// VEVURN POS SYSTEM - DATABASE SERVICE
// Production-Ready Enhanced Architecture
// =============================================

const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');

class DatabaseService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20, // Maximum connections
      min: 5,  // Minimum connections
      idle: 10000, // 10 seconds
      acquire: 60000, // 60 seconds
      evict: 1000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    this.redis = new Redis(process.env.REDIS_URL, {
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    });

    this.preparedStatements = new Set();
  }

  async initialize() {
    try {
      // Test database connection
      await this.pool.query('SELECT 1');
      console.log('✅ Database connected successfully');

      // Test Redis connection
      await this.redis.ping();
      console.log('✅ Redis connected successfully');

      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async executePreparedQuery(name, query, params) {
    const client = await this.pool.connect();
    try {
      if (!this.preparedStatements.has(name)) {
        await client.query(`PREPARE ${name} AS ${query}`);
        this.preparedStatements.add(name);
      }
      
      return await client.query(`EXECUTE ${name}`, params);
    } finally {
      client.release();
    }
  }

  async healthCheck() {
    try {
      const dbResult = await this.pool.query('SELECT NOW()');
      const redisResult = await this.redis.ping();
      
      return {
        database: { status: 'healthy', timestamp: dbResult.rows[0].now },
        redis: { status: redisResult === 'PONG' ? 'healthy' : 'unhealthy' }
      };
    } catch (error) {
      return {
        database: { status: 'unhealthy', error: error.message },
        redis: { status: 'unhealthy', error: error.message }
      };
    }
  }

  async close() {
    await this.pool.end();
    await this.prisma.$disconnect();
    await this.redis.quit();
  }
}

export const db = new DatabaseService();
