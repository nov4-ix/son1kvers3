import { FastifyInstance } from 'fastify'
import { logger } from '../config/logger'
import { EventEmitter } from 'events'
import { PrismaClient } from '@prisma/client'
import {
  wsConnectionsActive,
  wsConnectionsTotal,
  wsMessagesTotal,
  wsSubscriptionsActive,
  wsErrorsByType
} from '../monitoring/metrics'

// Stub for wsAuthMiddleware - to be implemented
async function wsAuthMiddleware(req: any): Promise<void> {
  // TODO: Implement authentication middleware
  (req as any).user = { id: 'anonymous', tier: 'FREE' }
}

// Stub for verifyGenerationOwnership - to be implemented
async function verifyGenerationOwnership(userId: string, generationId: string, prisma: PrismaClient): Promise<boolean> {
  // TODO: Implement ownership verification
  const generation = await prisma.generation.findFirst({
    where: { id: generationId, userId }
  })
  return generation !== null
}

// Event emitter global para generaciones
export const generationEvents = new EventEmitter()
generationEvents.setMaxListeners(100)

// Prisma client singleton para ownership checks
const prisma = new PrismaClient()
// Global subscriptions map for metrics/health
const subscriptions = new Map<string, number>()

interface Client {
  ws: any // WebSocket from Fastify
  userId: string
  userTier: string
  generationIds: Set<string>
  clientId: string
  heartbeat?: NodeJS.Timeout
  lastPong?: number
  lastPingTime?: number
}

const clients = new Map<string, Client>()

// (duplicate unsubscribe function removed)

// Generate unique client id
function generateClientId(): string {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Helper: unsubscribe a client from all generations
function unsubscribeAll(client: Client) {
  client.generationIds.clear()
}

export async function setupWebSocket(app: FastifyInstance) {
  await app.register(require('@fastify/websocket'))

  app.get('/ws/generation', {
    websocket: true,
    preHandler: async (req, reply) => {
      await wsAuthMiddleware(req as any)
    }
  }, (connection, req) => {
    const ws = connection.socket
    const user: any = (req as any).user
    const clientId = req.id || generateClientId()
    const connectTime = Date.now()
    const userTier = user?.tier || 'FREE'

    logger.info({ clientId, userId: user?.id, tier: userTier }, 'WebSocket client connected')

    const client: Client = {
      ws,
      userId: user?.id,
      userTier,
      generationIds: new Set<string>(),
      clientId,
      lastPong: Date.now(),
      lastPingTime: Date.now(),
      heartbeat: undefined
    }
    clients.set(clientId, client)

    // Heartbeat activo (con métricas opcionales)
    if (typeof setInterval === 'function') {
      const hb = setInterval(() => {
        if (ws.readyState === 1) { // WebSocket.OPEN = 1
          const timeSinceLastPong = Date.now() - (client.lastPong ?? 0)
          if (timeSinceLastPong > 60000) {
            logger.warn({ clientId }, 'Client heartbeat timeout, closing connection')
            ws.close()
            return
          }
          ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }))
          if (typeof wsMessagesTotal?.labels === 'function') {
            wsMessagesTotal.labels('ping', 'out').inc()
          }
        } else {
          if (client.heartbeat) {
            clearInterval(client.heartbeat)
            client.heartbeat = undefined
          }
        }
      }, 30000)
      client.heartbeat = hb
    }

    // Mensaje de bienvenida
    ws.send(JSON.stringify({
      type: 'connected',
      clientId,
      tier: userTier,
      timestamp: new Date().toISOString(),
      message: 'Connected to Son1kvers3 WebSocket'
    }))

    // Manejar mensajes del cliente
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString())
        logger.debug({ clientId, messageType: message.type }, 'WebSocket message received')

        if (message.type === 'pong') {
          client.lastPong = Date.now()
          if (typeof wsMessagesTotal?.labels === 'function') wsMessagesTotal.labels('pong', 'in').inc()
          return
        }

        handleClientMessage(client, message)
      } catch (error) {
        logger.error({ error, clientId }, 'Invalid WebSocket message')
      }
    })

    // Manejar desconexión
    ws.on('close', () => {
      if (client.heartbeat) {
        clearInterval(client.heartbeat)
        client.heartbeat = undefined
      }
      unsubscribeAll(client)
      clients.delete(clientId)
      const duration = (Date.now() - connectTime) / 1000
      // wsConnectionDuration removed - not in metrics
      if (typeof wsConnectionsActive?.labels === 'function') wsConnectionsActive.labels(userTier).dec()
      logger.info({ clientId }, 'WebSocket client disconnected')
    })

    ws.on('error', (error) => {
      logger.error({ error, clientId }, 'WebSocket error')
      if (client.heartbeat) {
        clearInterval(client.heartbeat)
        client.heartbeat = undefined
      }
      if (typeof wsConnectionsActive?.labels === 'function') wsConnectionsActive.labels(userTier).dec()
      clients.delete(clientId)
    })
  })

  // Escuchar eventos de generación y broadcast a clientes suscritos
  generationEvents.on('generation:update', (data: any) => {
    const { generationId, status, progress, tracks, audioUrl, error } = data

    logger.debug({ generationId, status }, 'Broadcasting generation update via WebSocket')

    // Enviar a todos los clientes suscritos
    for (const [clientId, client] of clients) {
      if (client.generationIds.has(generationId)) {
        try {
          client.ws.send(JSON.stringify({
            type: 'generation_update',
            generationId,
            status,
            progress,
            tracks,
            audioUrl,
            error,
            timestamp: new Date().toISOString()
          }))
        } catch (error) {
          logger.error({ error, clientId }, 'Failed to send WebSocket update')
          clients.delete(clientId)
        }
      }
    }
  })

  logger.info('WebSocket server configured for generation updates')
}

// Manejar mensajes recibidos desde clientes (centralizado)
async function handleClientMessage(client: Client, message: any) {
  if (!message || !message.type) {
    client.ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }))
    return
  }

  const { type, generationId, data } = message

  switch (type) {
    case 'subscribe': {
      if (!generationId) {
        client.ws.send(JSON.stringify({ type: 'error', message: 'generationId is required' }))
        return
      }
      const hasAccess = await verifyGenerationOwnership(client.userId, generationId, prisma)
      if (!hasAccess) {
        // registrar intento no autorizado
        wsErrorsByType?.labels?.('authorization')?.inc?.()
        logger.warn({ userId: client.userId, generationId, clientId: client.clientId }, 'Unauthorized subscription attempt')
        client.ws.send(JSON.stringify({ type: 'error', code: 'UNAUTHORIZED', message: 'Access denied' }))
        client.ws.close(1008, 'Unauthorized access to generation')
        return
      }
      client.generationIds.add(generationId)
      // Update global subscriptions map for health/dashboard
      const prevCount = subscriptions.get(generationId) ?? 0
      subscriptions.set(generationId, prevCount + 1)
      if (typeof wsSubscriptionsActive?.inc === 'function') wsSubscriptionsActive.inc()
      if (typeof wsMessagesTotal?.labels === 'function') wsMessagesTotal.labels('subscribe', 'in').inc()
      client.ws.send(JSON.stringify({
        type: 'subscribed',
        generationId,
        timestamp: new Date().toISOString()
      }))
      break
    }
    case 'unsubscribe': {
      const removed = generationId ? client.generationIds.delete(generationId) : false
      if (removed) {
        if (typeof wsSubscriptionsActive?.dec === 'function') wsSubscriptionsActive.dec()
        const prev2 = subscriptions.get(generationId) ?? 0
        if (prev2 <= 1) subscriptions.delete(generationId)
        else subscriptions.set(generationId, prev2 - 1)
      }
      if (typeof wsMessagesTotal?.labels === 'function') wsMessagesTotal.labels('unsubscribe', 'in').inc()
      client.ws.send(JSON.stringify({
        type: 'unsubscribed',
        generationId
      }))
      break
    }
    case 'pong': {
      // Heartbeat response (if received via this path)
      client.lastPong = Date.now()
      if (typeof wsMessagesTotal?.labels === 'function') wsMessagesTotal.labels('pong', 'in').inc()
      break
    }
    default: {
      client.ws.send(JSON.stringify({
        type: 'error',
        message: `Unknown message type: ${type}`
      }))
    }
  }
}

// Función para emitir actualizaciones
export function emitGenerationUpdate(
  generationId: string,
  status: string,
  progress?: number,
  tracks?: any[],
  audioUrl?: string,
  error?: string
) {
  generationEvents.emit('generation:update', {
    generationId,
    status,
    progress,
    tracks,
    audioUrl,
    error
  })
}

// Health helper: export a function to expose current WebSocket stats
export function getWebSocketStats() {
  const clientsByUser = new Map<string, number>()
  for (const c of clients.values()) {
    const curr = clientsByUser.get(c.userId) ?? 0
    clientsByUser.set(c.userId, curr + 1)
  }

  const clientsByTier = new Map<string, number>()
  for (const c of clients.values()) {
    const t = clientsByTier.get(c.userTier) ?? 0
    clientsByTier.set(c.userTier, t + 1)
  }

  const stats = {
    totalClients: clients.size,
    clientsByUser,
    subscriptions,
    clientsByTier
  }
  return stats
}
