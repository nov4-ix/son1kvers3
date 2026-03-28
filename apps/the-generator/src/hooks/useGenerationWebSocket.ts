import { useEffect, useRef, useState, useCallback } from 'react'

interface GenerationUpdate {
  type: string
  generationId: string
  status: string
  progress?: number
  tracks?: any[]
  audioUrl?: string
  metadata?: any
  timestamp: string
}

interface UseGenerationWebSocketOptions {
  onUpdate?: (update: GenerationUpdate) => void
  onConnected?: () => void
  onDisconnected?: () => void
  onError?: (error: Error) => void
  autoReconnect?: boolean
}

export function useGenerationWebSocket(
  generationId: string | null,
  options: UseGenerationWebSocketOptions = {}
) {
  const {
    onUpdate,
    onConnected,
    onDisconnected,
    onError,
    autoReconnect = true
  } = options

  const [update, setUpdate] = useState<GenerationUpdate | null>(null)
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttemptsRef = useRef(0)

  const connect = useCallback(() => {
    if (!generationId || connecting || connected) return

    setConnecting(true)

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = import.meta.env.VITE_BACKEND_URL?.replace(/^https?:\/\//, '') || 'localhost:3001'
    const wsUrl = `${protocol}//${host}/ws/generation`

    console.log(`🔌 Connecting to WebSocket: ${wsUrl}`)

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('✅ WebSocket connected')
      setConnected(true)
      setConnecting(false)
      reconnectAttemptsRef.current = 0

      // Suscribirse a la generación
      ws.send(JSON.stringify({
        type: 'subscribe',
        generationId
      }))

      onConnected?.()
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('📡 WebSocket message:', data)

        if (data.type === 'generation_update') {
          setUpdate(data)
          onUpdate?.(data)
        } 
        // ✅ RESPONDER A PING
        else if (data.type === 'ping') {
          // Responder inmediatamente con pong
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ 
              type: 'pong',
              timestamp: Date.now() 
            }))
          }
        } 
        else if (data.type === 'connected') {
          console.log('✅ WebSocket handshake complete:', data.clientId)
        } 
        else if (data.type === 'subscribed') {
          console.log('✅ Subscribed to generation:', data.generationId)
        } 
        else if (data.type === 'error') {
          console.error('❌ WebSocket error:', data.message)
          onError?.(new Error(data.message))
        }
      } catch (error) {
        console.error('❌ Failed to parse WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error)
      setConnected(false)
      setConnecting(false)
      onError?.(new Error('WebSocket connection error'))
    }

    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected')
      setConnected(false)
      setConnecting(false)
      onDisconnected?.()

      // Auto-reconectar con backoff exponencial
      if (autoReconnect && generationId) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
        reconnectAttemptsRef.current++

        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`)

        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, delay)
      }
    }
  }, [generationId, connecting, connected, autoReconnect, onConnected, onUpdate, onDisconnected, onError])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN && generationId) {
        wsRef.current.send(JSON.stringify({
          type: 'unsubscribe',
          generationId
        }))
      }
      wsRef.current.close()
      wsRef.current = null
    }

    setConnected(false)
    setConnecting(false)
  }, [generationId])

  useEffect(() => {
    if (generationId) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [generationId, connect, disconnect])

  return {
    update,
    connected,
    connecting,
    reconnect: connect,
    disconnect
  }
}

// Hook combinado que usa WebSocket si está disponible, sino polling
export function useGenerationStatus(generationId: string | null) {
  const wsStatus = useGenerationWebSocket(generationId)
  const [pollingUpdate, setPollingUpdate] = useState<GenerationUpdate | null>(null)

  useEffect(() => {
    // Si WebSocket está conectado, no hacer polling
    if (wsStatus.connected || !generationId) return

    console.log('🔄 Falling back to polling mode')

    const poll = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
        const response = await fetch(`${backendUrl}/api/generation/${generationId}/status`)

        if (response.ok) {
          const data = await response.json()

          // Convertir formato de polling a formato WebSocket
          const wsFormat: GenerationUpdate = {
            generationId,
            status: data.data?.statusNormalized || 'processing',
            progress: data.data?.progress,
            tracks: data.data?.tracks,
            audioUrl: data.data?.audioUrl,
            timestamp: new Date().toISOString()
          }

          setPollingUpdate(wsFormat)
        }
      } catch (error) {
        console.error('❌ Polling error:', error)
      }
    }

    // Poll inicial
    poll()

    // Configurar polling cada 5 segundos
    const interval = setInterval(poll, 5000)

    return () => clearInterval(interval)
  }, [generationId, wsStatus.connected])

  // Retornar estado: si está conectado, usar wsStatus, si no, usar pollingUpdate
  return wsStatus.connected ? wsStatus : { ...wsStatus, update: pollingUpdate }
}
