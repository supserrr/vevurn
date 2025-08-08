import Redis from 'ioredis';
import { logger } from '../utils/logger';

export class RedisService {
  private client: Redis | null = null;
  private isConnected: boolean = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis connection established');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.client.on('error', (error) => {
      logger.error('Redis connection error:', error);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      logger.info('Redis connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });
  }

  async connect(): Promise<void> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    try {
      await this.client.connect();
      logger.info('Redis connected successfully');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        this.isConnected = false;
        logger.info('Redis disconnected successfully');
      } catch (error) {
        logger.error('Error disconnecting from Redis:', error);
        throw error;
      }
    }
  }

  getClient(): Redis {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis not connected. Call connect() first.');
    }
    return this.client;
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.client) return false;
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  // Cache operations
  async get(key: string): Promise<string | null> {
    if (!this.client) throw new Error('Redis not connected');
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<'OK' | null> {
    if (!this.client) throw new Error('Redis not connected');
    
    if (ttlSeconds) {
      return this.client.setex(key, ttlSeconds, value);
    }
    return this.client.set(key, value);
  }

  async del(key: string): Promise<number> {
    if (!this.client) throw new Error('Redis not connected');
    return this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    if (!this.client) throw new Error('Redis not connected');
    return this.client.exists(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (!this.client) throw new Error('Redis not connected');
    return this.client.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    if (!this.client) throw new Error('Redis not connected');
    return this.client.ttl(key);
  }

  // JSON operations
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    return value ? JSON.parse(value) : null;
  }

  async setJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<'OK' | null> {
    return this.set(key, JSON.stringify(value), ttlSeconds);
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | null> {
    if (!this.client) throw new Error('Redis not connected');
    return this.client.hget(key, field);
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    if (!this.client) throw new Error('Redis not connected');
    return this.client.hset(key, field, value);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    if (!this.client) throw new Error('Redis not connected');
    return this.client.hgetall(key);
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    if (!this.client) throw new Error('Redis not connected');
    return this.client.hdel(key, ...fields);
  }

  // List operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    if (!this.client) throw new Error('Redis not connected');
    return this.client.lpush(key, ...values);
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    if (!this.client) throw new Error('Redis not connected');
    return this.client.rpush(key, ...values);
  }

  async lpop(key: string): Promise<string | null> {
    if (!this.client) throw new Error('Redis not connected');
    return this.client.lpop(key);
  }

  async rpop(key: string): Promise<string | null> {
    if (!this.client) throw new Error('Redis not connected');
    return this.client.rpop(key);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    if (!this.client) throw new Error('Redis not connected');
    return this.client.lrange(key, start, stop);
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    if (!this.client) throw new Error('Redis not connected');
    return this.client.sadd(key, ...members);
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    if (!this.client) throw new Error('Redis not connected');
    return this.client.srem(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    if (!this.client) throw new Error('Redis not connected');
    return this.client.smembers(key);
  }

  async sismember(key: string, member: string): Promise<number> {
    if (!this.client) throw new Error('Redis not connected');
    return this.client.sismember(key, member);
  }

  // Session management helpers
  async setSession(sessionId: string, data: any, ttlSeconds: number = 3600): Promise<void> {
    const key = `session:${sessionId}`;
    await this.setJSON(key, data, ttlSeconds);
  }

  async getSession<T>(sessionId: string): Promise<T | null> {
    const key = `session:${sessionId}`;
    return this.getJSON<T>(key);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.del(key);
  }

  // Rate limiting helpers
  async incrementCounter(key: string, ttlSeconds: number = 60): Promise<number> {
    if (!this.client) throw new Error('Redis not connected');
    
    const multi = this.client.multi();
    multi.incr(key);
    multi.expire(key, ttlSeconds);
    
    const results = await multi.exec();
    return results ? results[0][1] as number : 0;
  }

  // Cache invalidation patterns
  async deletePattern(pattern: string): Promise<number> {
    if (!this.client) throw new Error('Redis not connected');
    
    const keys = await this.client.keys(pattern);
    if (keys.length === 0) return 0;
    
    return this.client.del(...keys);
  }
}

// Export singleton instance
export const redis = new RedisService();
