/**
 * Custom hook for music generation logic
 * Separates generation logic from UI components
 * Uses MusicService for API calls
 */
import { useState, useCallback } from 'react';
import { getMusicService, type MusicServiceConfig } from '@super-son1k/shared-services';
import type { GenerationRequest, MusicTrack } from '@super-son1k/shared-types';

interface UseMusicGenerationOptions {
  backendUrl?: string;
  backendSecret?: string;
  onSuccess?: (track: MusicTrack) => void;
  onError?: (error: Error) => void;
}

export function useMusicGeneration(options: UseMusicGenerationOptions = {}) {
  const {
    backendUrl,
    backendSecret,
    onSuccess,
    onError
  } = options;

  // Get music service instance
  const musicService = getMusicService(
    backendUrl || backendSecret 
      ? { backendUrl, backendSecret } as MusicServiceConfig
      : undefined
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedTrack, setGeneratedTrack] = useState<MusicTrack | null>(null);

  const generateMusic = useCallback(async (request: GenerationRequest): Promise<MusicTrack | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await musicService.generateMusic(request);

      if (!result.generationId && !result.taskId) {
        throw new Error('No generation ID received from server');
      }

      const track: MusicTrack = {
        id: result.generationId || result.taskId || '',
        prompt: request.prompt,
        audioUrl: result.audioUrl || '',
        duration: request.duration || 120,
        status: result.status || 'pending',
        createdAt: new Date().toISOString(),
        generationId: result.generationId,
        taskId: result.taskId,
        style: request.style,
        genre: request.genre,
        mood: request.mood
      };

      setGeneratedTrack(track);
      onSuccess?.(track);
      return track;
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to generate music. Please try again.';
      setError(errorMessage);
      const error = err instanceof Error ? err : new Error(errorMessage);
      onError?.(error);
      console.error('Error generating music:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [musicService, onSuccess, onError]);

  const reset = useCallback(() => {
    setError(null);
    setGeneratedTrack(null);
    setIsGenerating(false);
  }, []);

  return {
    generateMusic,
    isGenerating,
    error,
    generatedTrack,
    reset
  };
}

