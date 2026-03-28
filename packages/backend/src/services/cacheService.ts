import Redis from 'ioredis'

interface CacheConfig {
  ttl: number // Time to live in seconds
  prefix: string
}

export class CacheService {
  private redis: Redis
  private configs: Map<string, CacheConfig> = new Map()

  constructor() {
    const redisUrl = process.env.REDIS_URL
    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
      })
    } else {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: 3,
      })
    }

    // Define cache configurations
    this.configs.set('neural_tokens', { ttl: 300, prefix: 'cache:neural_tokens' }) // 5 minutes
    this.configs.set('user_data', { ttl: 1800, prefix: 'cache:user_data' }) // 30 minutes
    this.configs.set('generation_results', { ttl: 3600, prefix: 'cache:generation_results' }) // 1 hour
    this.configs.set('analytics', { ttl: 900, prefix: 'cache:analytics' }) // 15 minutes
    this.configs.set('templates', { ttl: 7200, prefix: 'cache:templates' }) // 2 hours
  }

  private getKey(cacheType: string, identifier: string): string {
    const config = this.configs.get(cacheType)
    if (!config) {
      throw new Error(`Unknown cache type: ${cacheType}`)
    }
    return `${config.prefix}:${identifier}`
  }

  async get<T>(cacheType: string, identifier: string): Promise<T | null> {
    try {
      const key = this.getKey(cacheType, identifier)
      const value = await this.redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error(`Cache get error for ${cacheType}:${identifier}:`, error)
      return null
    }
  }

  async set<T>(cacheType: string, identifier: string, value: T): Promise<boolean> {
    try {
      const config = this.configs.get(cacheType)
      if (!config) {
        throw new Error(`Unknown cache type: ${cacheType}`)
      }

      const key = this.getKey(cacheType, identifier)
      await this.redis.setex(key, config.ttl, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`Cache set error for ${cacheType}:${identifier}:`, error)
      return false
    }
  }

  async del(cacheType: string, identifier: string): Promise<boolean> {
    try {
      const key = this.getKey(cacheType, identifier)
      const result = await this.redis.del(key)
      return result > 0
    } catch (error) {
      console.error(`Cache delete error for ${cacheType}:${identifier}:`, error)
      return false
    }
  }

  async invalidatePattern(cacheType: string, pattern: string): Promise<number> {
    try {
      const config = this.configs.get(cacheType)
      if (!config) {
        throw new Error(`Unknown cache type: ${cacheType}`)
      }

      const fullPattern = `${config.prefix}:${pattern}`
      const keys = await this.redis.keys(fullPattern)

      if (keys.length === 0) return 0

      return await this.redis.del(...keys)
    } catch (error) {
      console.error(`Cache invalidate pattern error for ${cacheType}:${pattern}:`, error)
      return 0
    }
  }

  async invalidateUser(userId: string): Promise<void> {
    // Invalidate all user-related caches
    await Promise.all([
      this.invalidatePattern('user_data', `*${userId}*`),
      this.invalidatePattern('generation_results', `*${userId}*`),
      this.invalidatePattern('analytics', `*${userId}*`),
    ])
  }

  async getStats(): Promise<{ totalKeys: number; memoryUsage: string }> {
    try {
      const info = await this.redis.info('memory')
      const memoryMatch = info.match(/used_memory_human:(.+)/)
      const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'unknown'

      const keys = await this.redis.keys('cache:*')
      return {
        totalKeys: keys.length,
        memoryUsage
      }
    } catch (error) {
      console.error('Cache stats error:', error)
      return { totalKeys: 0, memoryUsage: 'unknown' }
    }
  }

  async cleanup(): Promise<void> {
    await this.redis.quit()
  }
}

// Singleton instance
export const cacheService = new CacheService()
