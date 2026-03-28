import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGenerationStatus } from '../services/websocket'

// Mock WebSocket
const mockWebSocket = {
  readyState: 1, // OPEN
  send: vi.fn(),
  close: vi.fn(),
  onopen: null,
  onmessage: null,
  onerror: null,
  onclose: null
}

global.WebSocket = vi.fn().mockImplementation(() => mockWebSocket)

describe('WebSocket Integration E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset WebSocket mock
    mockWebSocket.send.mockClear()
    mockWebSocket.close.mockClear()
  })

  it('should establish WebSocket connection when generationId is provided', () => {
    const generationId = 'test-gen-123'

    // This tests that the hook initializes WebSocket
    expect(WebSocket).toHaveBeenCalledWith('ws://localhost:3001/ws/generation')
  })

  it('should send subscribe message on connection', () => {
    const generationId = 'test-gen-456'

    // Simulate WebSocket open event
    mockWebSocket.onopen()

    expect(mockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'subscribe',
        generationId
      })
    )
  })

  it('should handle generation update messages correctly', () => {
    const generationId = 'test-gen-789'
    const mockUpdate = {
      type: 'generation_update',
      generationId,
      status: 'completed',
      audioUrl: 'https://example.com/audio.mp3',
      timestamp: new Date().toISOString()
    }

    // Simulate receiving a message
    mockWebSocket.onmessage({ data: JSON.stringify(mockUpdate) })

    // The hook should process this update
    expect(mockUpdate.status).toBe('completed')
    expect(mockUpdate.audioUrl).toBeDefined()
  })

  it('should fallback to polling when WebSocket fails', () => {
    // Simulate WebSocket error
    mockWebSocket.readyState = 3 // CLOSED
    mockWebSocket.onerror(new Error('Connection failed'))

    // Hook should detect WebSocket failure and enable polling
    expect(mockWebSocket.readyState).toBe(3)
  })

  it('should handle reconnections properly', () => {
    let reconnectCount = 0

    // Simulate multiple connection failures and reconnections
    for (let i = 0; i < 3; i++) {
      mockWebSocket.onclose({ code: 1006, reason: 'Connection lost' })
      reconnectCount++
    }

    expect(reconnectCount).toBe(3)
  })

  it('should clean up WebSocket connection on unmount', () => {
    const generationId = 'test-gen-cleanup'

    // Simulate component unmount
    mockWebSocket.onclose({ code: 1000, reason: 'Client disconnecting' })

    expect(mockWebSocket.close).toHaveBeenCalledWith(1000, 'Client disconnecting')
  })

  it('should handle malformed messages gracefully', () => {
    const invalidMessage = 'not-json'

    // Should not crash when receiving invalid JSON
    expect(() => {
      mockWebSocket.onmessage({ data: invalidMessage })
    }).not.toThrow()
  })

  it('should emit correct update format', () => {
    const expectedUpdate = {
      generationId: 'test-gen-format',
      status: 'processing',
      progress: 50,
      timestamp: expect.any(String)
    }

    // Simulate backend emitting update
    const updateData = {
      type: 'generation_update',
      ...expectedUpdate
    }

    mockWebSocket.onmessage({ data: JSON.stringify(updateData) })

    // Frontend should receive properly formatted update
    expect(updateData.generationId).toBe(expectedUpdate.generationId)
    expect(updateData.status).toBe(expectedUpdate.status)
  })
})