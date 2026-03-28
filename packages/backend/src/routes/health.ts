import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { getWebSocketStats } from '../websocket/generationSocket'

const prisma = new PrismaClient()

export async function healthRoutes(app: FastifyInstance) {
  // Liveness probe - ¿está corriendo?
  app.get('/health', async (req, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    }
  })

  // Readiness probe - ¿listo para recibir tráfico?
  app.get('/health/ready', async (req, reply) => {
    const checks = {
      database: false,
      redis: false
    }

    try {
      // Check DB
      await prisma.$queryRaw`SELECT 1`
      checks.database = true
    } catch (error) {
      app.log.error({ error }, 'Database health check failed')
    }

    // Check Redis (si existe)
    if (process.env.REDIS_URL) {
      try {
        const Redis = require('ioredis')
        const redis = new Redis(process.env.REDIS_URL)
        await redis.ping()
        checks.redis = true
        redis.disconnect()
      } catch (error) {
        app.log.error({ error }, 'Redis health check failed')
      }
    } else {
      checks.redis = true // No es crítico
    }

    const isReady = checks.database

    reply.code(isReady ? 200 : 503)
    return {
      status: isReady ? 'ready' : 'not_ready',
      checks,
      timestamp: new Date().toISOString()
    }
  })

  // Métricas básicas
  app.get('/health/metrics', async (req, reply) => {
    const memUsage = process.memoryUsage()

    return {
      process: {
        uptime: process.uptime(),
        pid: process.pid,
        memory: {
          heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
          rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
        },
        cpu: process.cpuUsage()
      },
      timestamp: new Date().toISOString()
    }
  })

  // WebSocket health probe
  app.get('/health/websocket', async (req, reply) => {
    const stats = getWebSocketStats()
    const totalConnections = stats.totalClients
    const subscriptionCount = Array.from(stats.subscriptions.values()).reduce((a, b) => a + b, 0)

    const health = {
      status: totalConnections > 0 ? 'ok' : 'ok',
      connections: {
        total: totalConnections,
        byUser: Object.fromEntries(stats.clientsByUser),
        byTier: Object.fromEntries(stats.clientsByTier),
        activeSubscriptions: subscriptionCount
      },
      timestamp: new Date().toISOString()
    }
    reply.code(200)
    return health
  })
}
