/**
 * useWebSocket Hook
 * Manages WebSocket connection to backend for real-time updates
 * Handles reconnection, error recovery, and event subscriptions
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface WebSocketConfig {
  url?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionDelay?: number;
  reconnectionAttempts?: number;
}

export interface WebSocketEventHandlers {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onGenerationProgress?: (data: {
    generationId: string;
    progress: number;
    status: string;
    message?: string;
  }) => void;
  onGenerationComplete?: (data: {
    generationId: string;
    audioUrl: string;
    status: string;
  }) => void;
  onGenerationError?: (data: {
    generationId: string;
    error: string;
    status: string;
  }) => void;
  onCoverProgress?: (data: {
    taskId: string;
    progress: number;
    status: string;
  }) => void;
  onCoverComplete?: (data: {
    taskId: string;
    imageUrl: string;
    status: string;
  }) => void;
}

export interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
  subscribeToGeneration: (generationId: string) => void;
  unsubscribeFromGeneration: (generationId: string) => void;
  emit: (event: string, data: any) => void;
}

export function useWebSocket(
  config: WebSocketConfig = {},
  handlers: WebSocketEventHandlers = {}
): UseWebSocketReturn {
  const {
    url,
    autoConnect = true,
    reconnection = true,
    reconnectionDelay = 1000,
    reconnectionAttempts = 5,
  } = config;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(handlers);

  // Update handlers ref when they change
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  // Get backend URL
  const getBackendUrl = useCallback(() => {
    if (url) return url;
    
    // Try to get from environment variables
    if (typeof window !== 'undefined') {
      return (
        import.meta.env?.VITE_BACKEND_URL ||
        process.env?.NEXT_PUBLIC_BACKEND_URL ||
        'http://localhost:3001'
      );
    }
    
    return process.env?.BACKEND_URL || 'http://localhost:3001';
  }, [url]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return; // Already connected
    }

    setIsConnecting(true);
    setError(null);

    const backendUrl = getBackendUrl();
    const socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection,
      reconnectionDelay,
      reconnectionAttempts,
      timeout: 10000,
      auth: {
        // Add auth token if available
        token: typeof window !== 'undefined' 
          ? localStorage.getItem('auth_token') || undefined
          : undefined,
      },
    });

    // Connection events
    socket.on('connect', () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      handlersRef.current.onConnect?.();
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      setIsConnecting(false);
      handlersRef.current.onDisconnect?.();
    });

    socket.on('connect_error', (err) => {
      setIsConnecting(false);
      const error = new Error(err.message || 'Connection failed');
      setError(error);
      handlersRef.current.onError?.(error);
    });

    // Generation events
    socket.on('generation:progress', (data) => {
      handlersRef.current.onGenerationProgress?.(data);
    });

    socket.on('generation:complete', (data) => {
      handlersRef.current.onGenerationComplete?.(data);
    });

    socket.on('generation:error', (data) => {
      handlersRef.current.onGenerationError?.(data);
    });

    // Cover generation events
    socket.on('cover:progress', (data) => {
      handlersRef.current.onCoverProgress?.(data);
    });

    socket.on('cover:complete', (data) => {
      handlersRef.current.onCoverComplete?.(data);
    });

    socketRef.current = socket;
  }, [getBackendUrl, reconnection, reconnectionDelay, reconnectionAttempts]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setIsConnecting(false);
    }
  }, []);

  // Subscribe to generation updates
  const subscribeToGeneration = useCallback((generationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe:generation', generationId);
      // Also join user room if authenticated
      const userId = typeof window !== 'undefined'
        ? localStorage.getItem('user_id') || undefined
        : undefined;
      
      if (userId) {
        socketRef.current.emit('authenticate', {
          userId,
          username: localStorage.getItem('username') || 'user',
          tier: localStorage.getItem('user_tier') || 'FREE',
        });
      }
    }
  }, []);

  // Unsubscribe from generation updates
  const unsubscribeFromGeneration = useCallback((generationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe:generation', generationId);
    }
  }, []);

  // Emit custom event
  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Cannot emit event: WebSocket not connected');
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    subscribeToGeneration,
    unsubscribeFromGeneration,
    emit,
  };
}

