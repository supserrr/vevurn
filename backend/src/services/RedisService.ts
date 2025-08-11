import { createClient, RedisClientType, RedisClientOptions } from 'redis'
import { config } from '../config/environment.js'
import { logger } from '../utils/logger'

interface CacheOptions {
  ttl?: number // Time to live in seconds
  nx?: boolean // Set only if key doesn't exist
  xx?: boolean // Set only if key exists
}

interface SessionData {
  userId: string
  email: string
  role: string
  createdAt: string
  lastActivity: string
  ip?: string
  userAgent?: string
}

export class RedisService {
  private client: RedisClientType
  private isConnected: boolean = false

  constructor() {
    this.client = createClient({
      url: config.REDIS_URL,
      socket: {
        connectTimeout: 10000,
      },
    })

    // Event listeners
    this.client.on('error', (err) => {
      logger.error('Redis Client Error:', err)
    })

    this.client.on('connect', () => {
      logger.info('Redis client connected')
    })

    this.client.on('ready', () => {
      logger.info('Redis client ready')
      this.isConnected = true
    })

    this.client.on('end', () => {
      logger.info('Redis client disconnected')
      this.isConnected = false
    })
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {

    try {
      if (!this.isConnected) {
        await this.client.connect()
        logger.info('Redis connection established')
      }
    } catch (error) {
      logger.error('Failed to connect to Redis:', error)
      throw error
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.disconnect()
        logger.info('Redis connection closed')
      }
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error)
      throw error
    }
  }

  /**
   * Check if Redis is connected
   */
  isRedisConnected(): boolean {
    return this.isConnected
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.ping()
      return response === 'PONG'
    } catch {
      return false
    }
  }

  // ==========================================
  // BASIC KEY-VALUE OPERATIONS
  // ==========================================

  /**
   * Set a string value
   */
  async set(key: string, value: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      const { ttl, nx, xx } = options

      if (nx) {
        // Check if key doesn't exist first
        const exists = await this.client.exists(key)
        if (exists > 0) return false
      }

      if (xx) {
        // Check if key exists first
        const exists = await this.client.exists(key)
        if (exists === 0) return false
      }

      let result: string | null = null
      if (ttl) {
        result = await this.client.setEx(key, ttl, value) as string | null
      } else {
        result = await this.client.set(key, value) as string | null
      }
      
      return result === 'OK'
    } catch (error) {
      logger.error('Redis SET error:', error)
      return false
    }
  }

  /**
   * Get a string value
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key) as string | null
    } catch (error) {
      logger.error('Redis GET error:', error)
      return null
    }
  }

  /**
   * Delete a key
   */
  async del(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(key)
      return result > 0
    } catch (error) {
      logger.error('Redis DEL error:', error)
      return false
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      logger.error('Redis EXISTS error:', error)
      return false
    }
  }

  /**
   * Set expiration time
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, seconds)
      return result === 1
    } catch (error) {
      logger.error('Redis EXPIRE error:', error)
      return false
    }
  }

  /**
   * Get time to live
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key)
    } catch (error) {
      logger.error('Redis TTL error:', error)
      return -1
    }
  }

  // ==========================================
  // JSON OPERATIONS (for complex data)
  // ==========================================

  /**
   * Set JSON data
   */
  async setJSON(key: string, data: any, ttl?: number): Promise<boolean> {
    try {
      const jsonString = JSON.stringify(data)
      if (ttl !== undefined) {
        return await this.set(key, jsonString, { ttl })
      }
      return await this.set(key, jsonString)
    } catch (error) {
      logger.error('Redis setJSON error:', error)
      return false
    }
  }

  /**
   * Get JSON data
   */
  async getJSON<T = any>(key: string): Promise<T | null> {
    try {
      const jsonString = await this.get(key)
      if (!jsonString) return null
      return JSON.parse(jsonString) as T
    } catch (error) {
      logger.error('Redis getJSON error:', error)
      return null
    }
  }

  // ==========================================
  // HASH OPERATIONS
  // ==========================================

  /**
   * Set hash field
   */
  async hSet(key: string, field: string, value: string): Promise<boolean> {
    try {
      const result = await this.client.hSet(key, field, value)
      return result >= 0
    } catch (error) {
      logger.error('Redis HSET error:', error)
      return false
    }
  }

  /**
   * Get hash field
   */
  async hGet(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hGet(key, field) as string | null
    } catch (error) {
      logger.error('Redis HGET error:', error)
      return null
    }
  }

  /**
   * Get all hash fields
   */
  async hGetAll(key: string): Promise<Record<string, string> | null> {
    try {
      return await this.client.hGetAll(key)
    } catch (error) {
      logger.error('Redis HGETALL error:', error)
      return null
    }
  }

  /**
   * Delete hash field
   */
  async hDel(key: string, field: string): Promise<boolean> {
    try {
      const result = await this.client.hDel(key, field)
      return result > 0
    } catch (error) {
      logger.error('Redis HDEL error:', error)
      return false
    }
  }

  // ==========================================
  // SESSION MANAGEMENT
  // ==========================================

  /**
   * Create user session
   */
  async createSession(userId: string, sessionData: SessionData, ttl: number = 3600): Promise<boolean> {
    const sessionKey = `session:${userId}`
    return await this.setJSON(sessionKey, sessionData, ttl)
  }

  /**
   * Get user session
   */
  async getSession(userId: string): Promise<SessionData | null> {
    const sessionKey = `session:${userId}`
    return await this.getJSON<SessionData>(sessionKey)
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(userId: string): Promise<boolean> {
    const sessionKey = `session:${userId}`
    const session = await this.getSession(userId)
    
    if (session) {
      session.lastActivity = new Date().toISOString()
      return await this.setJSON(sessionKey, session, 3600)
    }
    
    return false
  }

  /**
   * Destroy user session
   */
  async destroySession(userId: string): Promise<boolean> {
    const sessionKey = `session:${userId}`
    return await this.del(sessionKey)
  }

  // ==========================================
  // RATE LIMITING
  // ==========================================

  /**
   * Rate limiting check
   */
  async checkRateLimit(
    identifier: string,
    windowSizeInSeconds: number,
    maxRequests: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      const key = `rate_limit:${identifier}`
      const now = Math.floor(Date.now() / 1000)
      const windowStart = now - windowSizeInSeconds
      
      // Remove old entries
      await this.client.zRemRangeByScore(key, 0, windowStart)
      
      // Count current requests
      const currentRequests = await this.client.zCard(key)
      
      if (currentRequests >= maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: windowStart + windowSizeInSeconds,
        }
      }
      
      // Add current request
      await this.client.zAdd(key, { score: now, value: `${now}-${Math.random()}` })
      await this.client.expire(key, windowSizeInSeconds)
      
      return {
        allowed: true,
        remaining: maxRequests - currentRequests - 1,
        resetTime: windowStart + windowSizeInSeconds,
      }
    } catch (error) {
      logger.error('Rate limit check error:', error)
      // Allow request on error
      return { allowed: true, remaining: maxRequests - 1, resetTime: 0 }
    }
  }

  // ==========================================
  // CACHE MANAGEMENT
  // ==========================================

  /**
   * Cache with automatic JSON serialization
   */
  async cache<T>(
    key: string,
    dataFetcher: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.getJSON<T>(key)
      if (cached !== null) {
        return cached
      }

      // Fetch fresh data
      const data = await dataFetcher()
      
      // Cache the result
      await this.setJSON(key, data, ttl)
      
      return data
    } catch (error) {
      logger.error('Cache operation error:', error)
      // Fallback to direct data fetching
      return await dataFetcher()
    }
  }

  /**
   * Invalidate cache pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.client.keys(pattern)
      if (keys.length === 0) return 0
      
      return await this.client.del(keys)
    } catch (error) {
      logger.error('Cache invalidation error:', error)
      return 0
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Get Redis info
   */
  async getInfo(): Promise<string> {
    try {
      return await this.client.info()
    } catch (error) {
      logger.error('Redis INFO error:', error)
      return ''
    }
  }

  /**
   * Flush all data (use with caution!)
   */
  async flushAll(): Promise<boolean> {
    try {
      const result = await this.client.flushAll()
      return result === 'OK'
    } catch (error) {
      logger.error('Redis FLUSHALL error:', error)
      return false
    }
  }

  /**
   * Increment a numeric value
   */
  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key)
    } catch (error) {
      logger.error('Redis INCR error:', error)
      return 0
    }
  }

  /**
   * Add member to set
   */
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.client.sAdd(key, members)
    } catch (error) {
      logger.error('Redis SADD error:', error)
      return 0
    }
  }

  /**
   * Get all members of a set
   */
  async smembers(key: string): Promise<string[]> {
    try {
      return await this.client.sMembers(key)
    } catch (error) {
      logger.error('Redis SMEMBERS error:', error)
      return []
    }
  }

  /**
   * Get keys matching a pattern (use with caution on large datasets)
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern)
    } catch (error) {
      logger.error('Redis KEYS error:', error)
      return []
    }
  }

  /**
   * Scan for keys matching a pattern (preferred over KEYS for production)
   */
  async scan(pattern: string, count: number = 100): Promise<string[]> {
    try {
      const keys: string[] = []
      let cursor = 0
      
      do {
        const result = await this.client.scan(cursor.toString(), {
          MATCH: pattern,
          COUNT: count
        })
        cursor = parseInt(result.cursor.toString())
        keys.push(...result.keys)
      } while (cursor !== 0)
      
      return keys
    } catch (error) {
      logger.error('Redis SCAN error:', error)
      return []
    }
  }
}

// Export singleton instance
export const redisService = new RedisService()

// Export singleton instance
export const redis = new RedisService();
