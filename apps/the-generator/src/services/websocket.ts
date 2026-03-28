import { useEffect, useRef, useState } from 'react'

interface GenerationUpdate {
  generationId: string
  status: string
  progress?: number
  tracks?: any[]
  audioUrl?: string
  error?: string
  timestamp: string
}

export function useGenerationWebSocket(generationId: string | null) {
  const [update, setUpdate] = useState<GenerationUpdate | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  const connect = () => {
    if (!generationId || wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = import.meta.env.VITE_BACKEND_URL?.replace(/^https?:\/\//, '') || 'localhost:3001'
      const wsUrl = `${protocol}//${host}/ws/generation`

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('✅ WebSocket connected for generation updates')
        setConnected(true)
        setError(null)
        reconnectAttemptsRef.current = 0

        // Suscribirse a la generación
        ws.send(JSON.stringify({
          type: 'subscribe',
          generationId
        }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'generation_update') {
            console.log('📡 Generation update received:', data)
            setUpdate(data)
          } else if (data.type === 'connected') {
            console.log('🔗 WebSocket connection confirmed')
          }
        } catch (err) {
          console.error('❌ Error parsing WebSocket message:', err)
        }
      }

      ws.onerror = (event) => {
        console.error('❌ WebSocket error:', event)
        setError('WebSocket connection error')
        setConnected(false)
      }

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason)
        setConnected(false)
        wsRef.current = null

        // Intentar reconectar si no fue un cierre intencional
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          console.log(`🔄 Attempting to reconnect in ${delay}ms...`)

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            connect()
          }, delay)
        }
      }

    } catch (err) {
      console.error('❌ Failed to create WebSocket connection:', err)
      setError('Failed to establish WebSocket connection')
    }
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'unsubscribe',
        generationId
      }))

      wsRef.current.close(1000, 'Client disconnecting')
    }

    wsRef.current = null
    setConnected(false)
    setUpdate(null)
  }

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [generationId])

  return {
    update,
    connected,
    error,
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

  return wsStatus.connected ? wsStatus : { ...wsStatus, update: pollingUpdate }
}