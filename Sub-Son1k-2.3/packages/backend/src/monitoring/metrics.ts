import promClient from 'prom-client'

// Registro de métricas
const register = new promClient.Registry()

// Métricas por defecto (CPU, memoria, etc)
promClient.collectDefaultMetrics({ register, prefix: 'son1k_' })

// ========================================
// MÉTRICAS DE GENERACIÓN MUSICAL
// ========================================
export const generationCounter = new promClient.Counter({
  name: 'son1k_generations_total',
  help: 'Total number of music generations',
  labelNames: ['status', 'style', 'quality', 'user_tier'],
  registers: [register]
})

export const generationDuration = new promClient.Histogram({
  name: 'son1k_generation_duration_seconds',
  help: 'Time taken to complete generation',
  labelNames: ['status', 'style'],
  buckets: [10, 30, 60, 90, 120, 180, 300, 600],
  registers: [register]
})

export const activeGenerations = new promClient.Gauge({
  name: 'son1k_active_generations',
  help: 'Number of currently active generations',
  labelNames: ['status'],
  registers: [register]
})

export const generationQueueSize = new promClient.Gauge({
  name: 'son1k_generation_queue_size',
  help: 'Number of generations in queue',
  registers: [register]
})

// ========================================
// MÉTRICAS DE WEBSOCKET (BASE)
// ========================================
export const wsConnectionsActive = new promClient.Gauge({
  name: 'son1k_websocket_connections_active',
  help: 'Number of active WebSocket connections',
  labelNames: ['user_type'], // 'authenticated' | 'anonymous'
  registers: [register]
})

export const wsConnectionsTotal = new promClient.Counter({
  name: 'son1k_websocket_connections_total',
  help: 'Total WebSocket connections (lifetime)',
  labelNames: ['user_type'],
  registers: [register]
})

export const wsMessagesTotal = new promClient.Counter({
  name: 'son1k_websocket_messages_total',
  help: 'Total WebSocket messages',
  labelNames: ['type','direction'], // type: ping|pong|subscribe|generation_update, direction: in|out
  registers: [register]
})

export const wsMessageLatency = new promClient.Histogram({
  name: 'son1k_websocket_message_latency_ms',
  help: 'WebSocket message round-trip latency in milliseconds',
  labelNames: ['message_type'],
  buckets: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
  registers: [register]
})

export const wsPingPongSuccess = new promClient.Counter({
  name: 'son1k_websocket_ping_pong_success_total',
  help: 'Total successful ping/pong exchanges',
  registers: [register]
})

export const wsPingPongTimeout = new promClient.Counter({
  name: 'son1k_websocket_ping_pong_timeout_total',
  help: 'Total ping/pong timeouts',
  registers: [register]
})

export const wsMessageQueueSize = new promClient.Gauge({
  name: 'son1k_websocket_message_queue_size',
  help: 'Number of messages waiting to be sent',
  labelNames: ['client_id'],
  registers: [register]
})

export const wsDataTransferred = new promClient.Counter({
  name: 'son1k_websocket_data_transferred_bytes',
  help: 'Total bytes transferred via WebSocket',
  labelNames: ['direction'], // 'sent' | 'received'
  registers: [register]
})

export const wsErrorsByType = new promClient.Counter({
  name: 'son1k_websocket_errors_by_type',
  help: 'WebSocket errors categorized by type',
  labelNames: ['error_type'], // 'parse', 'auth', 'timeout', 'network', 'authorization'
  registers: [register]
})

export const wsClientsByTier = new promClient.Gauge({
  name: 'son1k_websocket_clients_by_tier',
  help: 'Active WebSocket clients grouped by subscription tier',
  labelNames: ['tier'], // 'FREE', 'PRO', 'ENTERPRISE'
  registers: [register]
})

export const wsSubscriptionsActive = new promClient.Gauge({
  name: 'son1k_websocket_subscriptions_active',
  help: 'Number of active generation subscriptions',
  registers: [register]
})

export const wsHeartbeatTimeouts = new promClient.Counter({
  name: 'son1k_websocket_heartbeat_timeouts_total',
  help: 'Total heartbeat timeouts (dead connections)',
  registers: [register]
})

// ========================================
// MÉTRICAS DE NEGOCIO
// ========================================
export const userRegistrations = new promClient.Counter({
  name: 'son1k_user_registrations_total',
  help: 'Total user registrations',
  labelNames: ['tier'],
  registers: [register]
})

export const quotaUsage = new promClient.Gauge({
  name: 'son1k_quota_usage',
  help: 'Current quota usage',
  labelNames: ['user_tier'],
  registers: [register]
})

export const revenueTotal = new promClient.Counter({
  name: 'son1k_revenue_total_usd',
  help: 'Total revenue in USD',
  labelNames: ['tier', 'payment_method'],
  registers: [register]
})

// ========================================
// MÉTRICAS DE SUNO API
// ========================================
export const sunoApiCalls = new promClient.Counter({
  name: 'son1k_suno_api_calls_total',
  help: 'Total calls to Suno API',
  labelNames: ['endpoint', 'status'],
  registers: [register]
})

export const sunoApiDuration = new promClient.Histogram({
  name: 'son1k_suno_api_duration_seconds',
  help: 'Suno API call duration',
  labelNames: ['endpoint'],
  buckets: [0.5, 1, 2, 5, 10, 30],
  registers: [register]
})

export const sunoApiErrors = new promClient.Counter({
  name: 'son1k_suno_api_errors_total',
  help: 'Total Suno API errors',
  labelNames: ['endpoint', 'error_type'],
  registers: [register]
})

// ========================================
// MÉTRICAS HTTP
// ========================================
export const httpRequestDuration = new promClient.Histogram({
  name: 'son1k_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register]
})

export const httpRequestTotal = new promClient.Counter({
  name: 'son1k_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
})

export const httpRequestErrors = new promClient.Counter({
  name: 'son1k_http_request_errors_total',
  help: 'Total HTTP request errors',
  labelNames: ['method', 'route', 'error_type'],
  registers: [register]
})

// ========================================
// FUNCIONES HELPER
// ========================================
export async function getMetrics() {
  return register.metrics()
}
export { register }

export function measureDuration<T>(
  histogram: promClient.Histogram,
  labels: Record<string, string>
) {
  return async (fn: () => Promise<T>): Promise<T> => {
    const timer = histogram.startTimer(labels)
    try {
      const result = await fn()
      timer()
      return result
    } catch (error) {
      timer()
      throw error
    }
  }
}
