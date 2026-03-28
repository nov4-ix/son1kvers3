import { FastifyReply, FastifyRequest } from 'fastify'
import { httpRequestDuration, httpRequestTotal, httpRequestErrors } from '../monitoring/metrics'
import { logger } from '../config/logger'

export async function metricsMiddleware(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const start = Date.now()
  const route = req.routerPath || req.url

  // Usar el hook onSend de Fastify (se registra en la instancia)
  // Por ahora, medimos al final del middleware usando un setTimeout
  // En producción, esto debería registrarse como hook en la instancia de Fastify
  const originalSend = reply.send.bind(reply)
  reply.send = function (payload?: any) {
    const duration = (Date.now() - start) / 1000
    const statusCode = String(reply.statusCode || 200)

    // Registrar duración
    if (httpRequestDuration) {
      httpRequestDuration
        .labels(req.method || 'GET', route, statusCode)
        .observe(duration)
    }

    // Registrar total de requests
    if (httpRequestTotal) {
      httpRequestTotal
        .labels(req.method || 'GET', route, statusCode)
        .inc()
    }

    // Registrar errores si status >= 400
    if (reply.statusCode && reply.statusCode >= 400) {
      const errorType = reply.statusCode >= 500 ? 'server_error' : 'client_error'
      if (httpRequestErrors) {
        httpRequestErrors
          .labels(req.method || 'GET', route, errorType)
          .inc()
      }
    }

    // Log detallado para requests lentos (>3s)
    if (duration > 3) {
      logger.warn({
        method: req.method,
        route,
        duration,
        statusCode,
        userId: (req as any).user?.id
      }, 'Slow request detected')
    }

    return originalSend(payload)
  }
}