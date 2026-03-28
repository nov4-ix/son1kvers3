/**
 * Neural Engine Service
 * Handles integration with Music Lab API (HeartMuLa)
 */

import axios from 'axios';

const MUSIC_LAB_URL = process.env.MUSIC_LAB_URL || 'http://localhost:8001';

export interface GenerationRequest {
  prompt: string;
  genre: string;
  duration: number;
  quality: string;
  userId: string;
  includeVocals?: boolean;
  lyrics?: string;
}

export interface GenerationResult {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  jobId?: string;
  audioUrl?: string;
  metadata?: Record<string, unknown>;
  estimatedTime?: number;
  error?: string;
}

export class NeuralEngineService {
  private baseUrl = MUSIC_LAB_URL;

  /**
   * Generate music using Music Lab API
   */
  async generate(request: GenerationRequest): Promise<GenerationResult> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/generate/complete`,
        {
          prompt: request.prompt,
          genre: request.genre,
          duration: request.duration,
          quality: request.quality,
          include_vocals: request.includeVocals || false,
          lyrics: request.lyrics,
          user_tier: 'FREE'
        },
        { timeout: 600000 }
      );

      return {
        status: 'processing',
        jobId: response.data.job_id,
        estimatedTime: this.estimateTime(request)
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Generation failed'
      };
    }
  }

  /**
   * Get generation status
   */
  async getStatus(jobId: string): Promise<GenerationResult> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/generate/status/${jobId}`
      );
      return response.data;
    } catch (error) {
      return {
        status: 'failed',
        error: 'Failed to get status'
      };
    }
  }

  /**
   * Estimate processing time
   */
  private estimateTime(request: GenerationRequest): number {
    let time = 60;
    if (request.includeVocals) time += 45;
    if (request.quality === 'ultra') time += 30;
    return time;
  }
}

export const neuralEngine = new NeuralEngineService();
