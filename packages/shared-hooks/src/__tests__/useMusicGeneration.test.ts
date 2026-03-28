/**
 * Tests for useMusicGeneration hook
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMusicGeneration } from '../useMusicGeneration';
import type { GenerationRequest } from '@super-son1k/shared-types';

// Mock MusicService
vi.mock('@super-son1k/shared-services', () => {
  const mockGenerateMusic = vi.fn();
  return {
    getMusicService: vi.fn(() => ({
      generateMusic: mockGenerateMusic,
    })),
  };
});

describe('useMusicGeneration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useMusicGeneration());

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.generatedTrack).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should handle generation request', async () => {
    const mockTrack = {
      id: 'test-id',
      prompt: 'test prompt',
      audioUrl: 'https://example.com/audio.mp3',
      duration: 60,
      status: 'completed' as const,
      createdAt: new Date().toISOString(),
    };

    const { getMusicService } = await import('@super-son1k/shared-services');
    const mockService = getMusicService();
    
    vi.mocked(mockService.generateMusic).mockResolvedValue({
      generationId: 'test-id',
      audioUrl: 'https://example.com/audio.mp3',
      status: 'completed',
    });

    const { result } = renderHook(() => useMusicGeneration());

    const request: GenerationRequest = {
      prompt: 'test prompt',
      style: 'pop',
      duration: 60,
    };

    await result.current.generateMusic(request);

    await waitFor(() => {
      expect(result.current.generatedTrack).toBeTruthy();
      expect(result.current.isGenerating).toBe(false);
    });
  });

  it('should handle generation errors', async () => {
    const { getMusicService } = await import('@super-son1k/shared-services');
    const mockService = getMusicService();
    vi.mocked(mockService.generateMusic).mockRejectedValue(new Error('Generation failed'));

    const { result } = renderHook(() => useMusicGeneration());

    const request: GenerationRequest = {
      prompt: 'test prompt',
      style: 'pop',
      duration: 60,
    };

    await result.current.generateMusic(request);

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.isGenerating).toBe(false);
    });
  });
});
