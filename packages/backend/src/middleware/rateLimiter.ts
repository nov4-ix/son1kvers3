import rateLimit from '@fastify/rate-limit'
import Redis from 'ioredis'

const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : null

export const globalRateLimit = {
  max: 100, // requests
  timeWindow: '1 minute',
  redis: redis || undefined, // Fallback a memoria si no hay Redis
  errorResponseBuilder: (req: any, context: any) => ({
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Too many requests. Try again in ${Math.ceil(context.ttl / 1000)} seconds`,
      retryAfter: context.ttl
    }
  })
}

export const generationRateLimit = {
  max: 5, // 5 generaciones por minuto
  timeWindow: '1 minute',
  redis: redis || undefined,
  keyGenerator: (req: any) => {
    return req.user?.id || req.ip // Por usuario o IP
  },
  errorResponseBuilder: (req: any, context: any) => ({
    success: false,
    error: {
      code: 'GENERATION_LIMIT_EXCEEDED',
      message: 'Too many generations. Please wait before creating more.',
      retryAfter: context.ttl,
      limit: context.max
    }
  })
}

export const authRateLimit = {
  max: 10,
  timeWindow: '15 minutes',
  redis: redis || undefined,
  errorResponseBuilder: () => ({
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT',
      message: 'Too many authentication attempts'
    }
  })
}