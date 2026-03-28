import { FastifyInstance } from 'fastify'
import { getMetrics } from '../monitoring/metrics'

export async function metricsRoutes(app: FastifyInstance) {
  // Endpoint de Prometheus
  app.get('/metrics', async (req, reply) => {
    reply.header('Content-Type', 'text/plain; version=0.0.4')
    return getMetrics()
  })
}