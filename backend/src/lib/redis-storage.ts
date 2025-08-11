import { Redis } from 'ioredis'
import type { SecondaryStorage } from 'better-auth'

/**
 * Enhanced Redis Secondary Storage Implementation
 * Following Better Auth documentation patterns with additional monitoring and error handling
 * Reference: https://better-auth.com/docs/concepts/database#secondary-storage
 */

// Create Redis client with enhanced configuration
const redisConfig: any = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  // Enhanced retry strategy
  retryDelayOnFailover: 100,
  // Connection pool settings
  family: 4, // Use IPv4
  keepAlive: true,
}

if (process.env.REDIS_PASSWORD) {
  redisConfig.password = process.env.REDIS_PASSWORD
}

const redis = new Redis(redisConfig)

// Enhanced Redis event handling
redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err)
})

redis.on('connect', () => {
  console.log('✅ Connected to Redis for Better Auth secondary storage')
})

redis.on('ready', () => {
  console.log('🚀 Redis is ready for Better Auth operations')
})

redis.on('close', () => {
  console.warn('⚠️ Redis connection closed')
})

/**
 * Enhanced Better Auth Secondary Storage Implementation
 * Includes key prefixing, error handling, and monitoring capabilities
 */
export const redisStorage: SecondaryStorage = {
  async get(key: string): Promise<string | null> {
    try {
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
  private redis: Redis

  constructor() {
    this.redis = redis
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck() {
    try {
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
    await this.redis.disconnect()
  }
}

export { redis }
export default new RedisManager()
