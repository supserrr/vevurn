import { Redis } from 'ioredis'
import type { SecondaryStorage } from 'better-auth'

// Create Redis client
const redisConfig: any = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: 3,
  lazyConnect: true,
}

if (process.env.REDIS_PASSWORD) {
  redisConfig.password = process.env.REDIS_PASSWORD
}

const redis = new Redis(redisConfig)

// Redis error handling
redis.on('error', (err) => {
  console.error('Redis connection error:', err)
})

redis.on('connect', () => {
  console.log('Connected to Redis')
})

// Better Auth secondary storage implementation
export const redisStorage: SecondaryStorage = {
  async get(key: string): Promise<string | null> {
    try {
      const value = await redis.get(`better-auth:${key}`)
      return value
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  },

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      const redisKey = `better-auth:${key}`
      if (ttl) {
        await redis.setex(redisKey, ttl, value)
      } else {
        await redis.set(redisKey, value)
      }
    } catch (error) {
      console.error('Redis set error:', error)
    }
  },

  async delete(key: string): Promise<void> {
    try {
      await redis.del(`better-auth:${key}`)
    } catch (error) {
      console.error('Redis delete error:', error)
    }
  },
}

export { redis }
