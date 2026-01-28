/**
 * useGenerationProgress Hook
 * Manages real-time generation progress via WebSocket
 */
import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '@super-son1k/shared-hooks';

export interface GenerationProgress {
  generationId: string;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
  audioUrl?: string;
  error?: string;
}

export function useGenerationProgress(generationId: string | null) {
  const [progress, setProgress] = useState<GenerationProgress | null>(null);

  const { 
    isConnected, 
    subscribeToGeneration, 
    unsubscribeFromGeneration 
  } = useWebSocket(
    {
      autoConnect: true,
      reconnection: true,
    },
    {
      onGenerationProgress: (data) => {
        if (data.generationId === generationId) {
          setProgress({
            generationId: data.generationId,
            progress: data.progress || 0,
            status: data.status as any,
            message: data.message,
          });
        }
      },
      onGenerationComplete: (data) => {
        if (data.generationId === generationId) {
          setProgress({
            generationId: data.generationId,
            progress: 100,
            status: 'completed',
            audioUrl: data.audioUrl,
            message: 'Generación completada',
          });
        }
      },
      onGenerationError: (data) => {
        if (data.generationId === generationId) {
          setProgress({
            generationId: data.generationId,
            progress: 0,
            status: 'failed',
            error: data.error,
            message: 'Error en la generación',
          });
        }
      },
    }
  );

  // Subscribe when generationId changes
  useEffect(() => {
    if (generationId && isConnected) {
      subscribeToGeneration(generationId);
      return () => {
        unsubscribeFromGeneration(generationId);
      };
    }
  }, [generationId, isConnected, subscribeToGeneration, unsubscribeFromGeneration]);

  const reset = useCallback(() => {
    setProgress(null);
  }, []);

  return {
    progress,
    isConnected,
    reset,
  };
}

