import { Redis } from 'ioredis'
import type { SecondaryStorage } from 'better-auth'
import { config } from '../config/environment.js'

/**
 * Enhanced Redis Secondary Storage Implementation
 * Following Better Auth documentation patterns with additional monitoring and error handling
 * Reference: https://better-auth.com/docs/concepts/database#secondary-storage
 */

// Create Redis client with enhanced configuration using the same URL as main app
let redis: Redis | null = null

try {
  if (config.REDIS_URL) {
    redis = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
      // Connection pool settings
      family: 4, // Use IPv4
      keepAlive: 30000,
      enableOfflineQueue: false, // Don't queue commands when disconnected
      // Retry configuration
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        console.log(`Retrying Redis connection attempt ${times}, delay: ${delay}ms`);
        return delay;
      }
    })

    // Enhanced Redis event handling
    redis.on('error', (err) => {
      console.error('❌ Redis secondary storage error:', err.message)
    })

    redis.on('connect', () => {
      console.log('✅ Connected to Redis for Better Auth secondary storage')
    })

    redis.on('ready', () => {
      console.log('🚀 Redis is ready for Better Auth operations')
    })

    redis.on('close', () => {
      console.warn('⚠️ Redis secondary storage connection closed')
    })

    redis.on('reconnecting', () => {
      console.log('🔄 Reconnecting to Redis secondary storage...')
    })
  } else {
    console.warn('⚠️ Redis URL not configured, secondary storage will be unavailable')
  }
} catch (error) {
  console.error('❌ Failed to initialize Redis secondary storage:', error)
  redis = null
}

/**
 * Enhanced Better Auth Secondary Storage Implementation
 * Includes key prefixing, error handling, and monitoring capabilities
 */
export const redisStorage: SecondaryStorage = {
  async get(key: string): Promise<string | null> {
    try {
      if (!redis) {
        console.warn('Redis not available, skipping cache get')
        return null
      }
      
      const prefixedKey = `vevurn-auth:${key}`
      const value = await redis.get(prefixedKey)
      
      // Optional: Log cache hits/misses for monitoring
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 Redis GET ${prefixedKey}: ${value ? 'HIT' : 'MISS'}`)
      }
      
      return value
    } catch (error) {
      console.error('❌ Redis get error:', error)
      // Return null to allow fallback to database
      return null
    }
  },

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (!redis) {
        console.warn('Redis not available, skipping cache set')
        return
      }
      
      const prefixedKey = `vevurn-auth:${key}`
      
      if (ttl) {
        await redis.setex(prefixedKey, ttl, value)
      } else {
        await redis.set(prefixedKey, value)
      }
      
      // Optional: Log cache operations for monitoring
      if (process.env.NODE_ENV === 'development') {
        console.log(`💾 Redis SET ${prefixedKey} (TTL: ${ttl || 'none'})`)
      }
    } catch (error) {
      console.error('❌ Redis set error:', error)
      // Don't throw error to prevent auth failures when Redis is down
    }
  },

  async delete(key: string): Promise<void> {
    try {
      if (!redis) {
        console.warn('Redis not available, skipping cache delete')
        return
      }
      
      const prefixedKey = `vevurn-auth:${key}`
      await redis.del(prefixedKey)
      
      // Optional: Log cache deletions for monitoring
      if (process.env.NODE_ENV === 'development') {
        console.log(`🗑️ Redis DEL ${prefixedKey}`)
      }
    } catch (error) {
      console.error('❌ Redis delete error:', error)
      // Don't throw error to prevent auth failures when Redis is down
    }
  }
}

/**
 * Additional Redis utilities for monitoring and maintenance
 * Following Better Auth documentation patterns
 */
export class RedisManager {
  private redis: Redis | null

  constructor() {
    this.redis = redis
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck() {
    try {
      if (!this.redis) {
        return {
          status: "unavailable",
          timestamp: new Date().toISOString(),
          storage: "redis",
          error: "Redis client not initialized",
        }
      }
      
      await this.redis.ping()
      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
        storage: "redis",
      }
    } catch (error) {
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        storage: "redis",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Get Redis statistics for monitoring
   */
  async getStatistics() {
    try {
      if (!this.redis) {
        throw new Error('Redis client not available')
      }
      
      const info = await this.redis.info('memory')
      const keyspace = await this.redis.info('keyspace')
      const authKeys = await this.redis.keys('vevurn-auth:*')
      
      return {
        memory: info,
        keyspace,
        authKeysCount: authKeys.length,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      throw new Error(`Failed to get Redis statistics: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  /**
   * Clear all Better Auth related keys (for maintenance)
   */
  async clearAuthCache() {
    try {
      if (!this.redis) {
        throw new Error('Redis client not available')
      }
      
      const keys = await this.redis.keys('vevurn-auth:*')
      if (keys.length > 0) {
        await this.redis.del(...keys)
        return {
          deletedKeys: keys.length,
          timestamp: new Date().toISOString(),
        }
      }
      return {
        deletedKeys: 0,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      throw new Error(`Failed to clear auth cache: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    if (!this.redis) {
      return {
        status: 'unavailable',
        lazyConnect: false,
        timestamp: new Date().toISOString(),
      }
    }
    
    return {
      status: this.redis.status,
      lazyConnect: this.redis.options.lazyConnect,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Disconnect Redis (for graceful shutdown)
   */
  async disconnect() {
    if (this.redis) {
      await this.redis.disconnect()
    }
  }
}

export { redis }
export default new RedisManager()
