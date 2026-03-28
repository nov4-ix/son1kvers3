import { FastifyRequest, FastifyReply } from 'fastify'
import Redis from 'ioredis'
import { AuthenticatedRequest } from './auth'
import { generateDeviceFingerprint } from './security'

// Redis client for rate limiting - DISABLED FOR LOCAL DEV
const redisUrl = process.env.REDIS_URL;
// const redis = redisUrl
//   ? new Redis(redisUrl, { maxRetriesPerRequest: 3 })
//   : new Redis({
//     host: process.env.REDIS_HOST || 'localhost',
//     port: parseInt(process.env.REDIS_PORT || '6379'),
//     password: process.env.REDIS_PASSWORD,
//     maxRetriesPerRequest: 3,
//   });
const redis: any = null; // Placeholder for local dev without Redis

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  keyPrefix: string
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  FREE: { maxRequests: 10, windowMs: 60000, keyPrefix: 'rate_limit:free' },
  PRO: { maxRequests: 50, windowMs: 60000, keyPrefix: 'rate_limit:pro' },
  PREMIUM: { maxRequests: 200, windowMs: 60000, keyPrefix: 'rate_limit:premium' },
  ENTERPRISE: { maxRequests: 1000, windowMs: 60000, keyPrefix: 'rate_limit:enterprise' },
  GLOBAL: { maxRequests: 100, windowMs: 60000, keyPrefix: 'rate_limit:global' },
}

interface RateLimitCheck {
  exceeded: boolean
  retryAfter?: number
  limit: number
  remaining: number
  resetTime: number
}

/**
 * Check rate limit for a specific key
 */
async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitCheck> {
  // If Redis is not available, allow all requests
  if (!redis) {
    return {
      exceeded: false,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: Math.ceil((Date.now() + config.windowMs) / 1000),
    };
  }

  const currentCount = await redis.get(key)
  const count = currentCount ? parseInt(currentCount) : 0
  const windowSeconds = Math.ceil(config.windowMs / 1000)
  const resetTime = Math.ceil((Date.now() + config.windowMs) / 1000)

  if (count >= config.maxRequests) {
    const ttl = await redis.ttl(key)
    const retryAfter = ttl > 0 ? ttl : windowSeconds

    return {
      exceeded: true,
      retryAfter,
      limit: config.maxRequests,
      remaining: 0,
      resetTime,
    }
  }

  // Increment counter
  if (count === 0) {
    await redis.setex(key, windowSeconds, '1')
  } else {
    await redis.incr(key)
  }

  return {
    exceeded: false,
    limit: config.maxRequests,
    remaining: config.maxRequests - count - 1,
    resetTime,
  }
}

/**
 * Multi-layer rate limiting middleware
 * Checks limits for IP, User, and Device separately
 */
export async function rateLimitMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = (request as AuthenticatedRequest).user
    const ip = request.ip || 'unknown'
    const deviceFingerprint = (request as any).deviceFingerprint || generateDeviceFingerprint(request)

    // Determine rate limit config based on user tier
    let config: RateLimitConfig
    if (user) {
      const tier = user.tier || 'FREE'
      config = RATE_LIMITS[tier] || RATE_LIMITS.FREE
    } else {
      config = RATE_LIMITS.GLOBAL
    }

    // Check multiple layers: IP, User (if authenticated), and Device
    const checks: Array<{ type: string; check: RateLimitCheck }> = []

    // 1. IP-based rate limit (stricter for anonymous users)
    const ipConfig = user ? config : RATE_LIMITS.GLOBAL
    const ipKey = `${ipConfig.keyPrefix}:ip:${ip}`
    const ipCheck = await checkRateLimit(ipKey, ipConfig)
    checks.push({ type: 'ip', check: ipCheck })

    // 2. User-based rate limit (if authenticated)
    if (user) {
      const userKey = `${config.keyPrefix}:user:${user.id}`
      const userCheck = await checkRateLimit(userKey, config)
      checks.push({ type: 'user', check: userCheck })
    }

    // 3. Device-based rate limit (additional layer)
    const deviceKey = `${config.keyPrefix}:device:${deviceFingerprint}`
    const deviceCheck = await checkRateLimit(deviceKey, config)
    checks.push({ type: 'device', check: deviceCheck })

    // Find the most restrictive limit (first exceeded)
    const exceededCheck = checks.find((c) => c.check.exceeded)

    if (exceededCheck) {
      const { check } = exceededCheck
      reply.header('Retry-After', (check.retryAfter || 60).toString())
      reply.header('X-RateLimit-Limit', check.limit.toString())
      reply.header('X-RateLimit-Remaining', '0')
      reply.header('X-RateLimit-Reset', check.resetTime.toString())
      reply.header('X-RateLimit-Layer', exceededCheck.type)

      return reply.status(429).send({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded (${exceededCheck.type} layer). Please try again later.`,
          retryAfter: check.retryAfter,
          layer: exceededCheck.type,
        },
      })
    }

    // All checks passed - use the most restrictive remaining count
    const minRemaining = Math.min(...checks.map((c) => c.check.remaining))
    const maxLimit = Math.max(...checks.map((c) => c.check.limit))
    const maxResetTime = Math.max(...checks.map((c) => c.check.resetTime))

    // Set rate limit headers (use most restrictive values)
    reply.header('X-RateLimit-Limit', maxLimit.toString())
    reply.header('X-RateLimit-Remaining', minRemaining.toString())
    reply.header('X-RateLimit-Reset', maxResetTime.toString())

    // Store device fingerprint in request for abuse detection
    if (!(request as any).deviceFingerprint) {
      (request as any).deviceFingerprint = deviceFingerprint
    }
  } catch (error) {
    console.error('Rate limiting error:', error)
    // If Redis fails, allow the request but log the error
    // In production, you might want to fail closed
  }
}

// Cleanup function for graceful shutdown
export async function cleanupRateLimit() {
  if (redis) {
    await redis.quit();
  }
}