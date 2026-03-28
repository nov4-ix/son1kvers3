/**
 * Music Generation Service - Professional Quality Pipeline
 * Uses HeartMuLa + Bark + HAM + Mixing + Mastering
 */

import axios, { AxiosInstance } from 'axios';
import { PrismaClient } from '@prisma/client';
import { emitGenerationUpdate } from '../websocket/generationSocket';
import { Queue } from 'bullmq';

export interface GenerationRequest {
  prompt: string;
  genre: string;
  duration: number;
  quality: 'standard' | 'high' | 'ultra';
  userId: string;
  includeVocals?: boolean;
  lyrics?: string;
  voiceCloneId?: string;
  includeHarmonies?: boolean;
  vocalStyle?: 'emotional' | 'energetic' | 'calm' | 'powerful';
}

export interface GenerationResult {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  jobId?: string;
  audioUrl?: string;
  metadata?: Record<string, unknown>;
  estimatedTime?: number;
  error?: string;
}

export interface TierLimits {
  tier: string;
  canGenerate: boolean;
  remaining: number;
  resetAt: string;
  reason?: string;
}

class MusicGenerationService {
  private musicLabUrl: string;
  private prisma: PrismaClient;
  private generationQueue: Queue | null = null;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.musicLabUrl = process.env.MUSIC_LAB_URL || 'http://localhost:8001';
    
    const REDIS_URL = process.env.REDIS_URL;
    if (REDIS_URL) {
      this.generationQueue = new Queue('music-generation', {
        connection: { url: REDIS_URL }
      });
    }
  }

  /**
   * Check if user can generate based on tier
   */
  async checkTierLimit(userId: string): Promise<TierLimits> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return {
        tier: 'FREE',
        canGenerate: true,
        remaining: 3,
        resetAt: this.getNextReset('daily')
      };
    }

    const tier = user.tier || 'FREE';
    const config = this.getTierConfig(tier);

    // Get current usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await this.prisma.userGenerationStats.aggregate({
      where: {
        userId,
        date: { gte: today }
      },
      _sum: { count: true }
    });

    const usedToday = usage._sum.count || 0;
    const remaining = Math.max(0, (config.generationsPerDay || 999) - usedToday);

    return {
      tier,
      canGenerate: remaining > 0,
      remaining,
      resetAt: this.getNextReset('daily')
    };
  }

  /**
   * Generate complete professional-quality song
   */
  async generateMusic(request: GenerationRequest): Promise<GenerationResult> {
    const { userId, includeVocals, includeHarmonies, quality, voiceCloneId } = request;

    // Check tier limits
    const limits = await this.checkTierLimit(userId);
    if (!limits.canGenerate) {
      return {
        status: 'failed',
        error: `Generation limit reached. Your ${limits.tier} tier allows ${limits.remaining} more generations.`
      };
    }

    // Validate tier permissions for features
    if (voiceCloneId && !['PRO', 'STUDIO'].includes(limits.tier)) {
      return {
        status: 'failed',
        error: 'Voice cloning requires PRO or STUDIO tier'
      };
    }

    if (includeHarmonies && !['PRO', 'STUDIO'].includes(limits.tier)) {
      return {
        status: 'failed',
        error: 'Harmonies require PRO or STUDIO tier'
      };
    }

    if (quality === 'ultra' && !['PRO', 'STUDIO'].includes(limits.tier)) {
      return {
        status: 'failed',
        error: 'Ultra quality requires PRO or STUDIO tier'
      };
    }

    // Create generation record
    const generation = await this.prisma.generation.create({
      data: {
        id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        status: 'pending',
        prompt: request.prompt,
        genre: request.genre,
        quality: request.quality
      }
    });

    try {
      // Call Music Lab API
      const response = await axios.post(
        `${this.musicLabUrl}/generate/complete`,
        {
          prompt: request.prompt,
          genre: request.genre,
          duration: request.duration,
          quality: request.quality,
          include_vocals: includeVocals || false,
          lyrics: includeVocals ? request.lyrics : undefined,
          voice_clone_id: voiceCloneId,
          include_harmonies: includeHarmonies || false,
          vocal_style: request.vocalStyle || 'emotional',
          user_tier: limits.tier
        },
        { timeout: 600000 } // 10 minutes
      );

      const { job_id } = response.data;

      // Update generation record
      await this.prisma.generation.update({
        where: { id: generation.id },
        data: { status: 'processing' }
      });

      // Record usage
      await this.recordGeneration(userId);

      return {
        status: 'processing',
        jobId: job_id,
        estimatedTime: this.estimateProcessingTime(request)
      };

    } catch (error) {
      console.error('Music Lab API error:', error);

      await this.prisma.generation.update({
        where: { id: generation.id },
        data: { status: 'failed' }
      });

      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Generation failed'
      };
    }
  }

  /**
   * Get generation job status
   */
  async getJobStatus(jobId: string): Promise<GenerationResult> {
    try {
      const response = await axios.get(
        `${this.musicLabUrl}/generate/status/${jobId}`
      );

      const data = response.data;

      return {
        status: data.status,
        audioUrl: data.audio_url,
        metadata: data.metadata,
        error: data.error
      };
    } catch (error) {
      return {
        status: 'failed',
        error: 'Failed to get job status'
      };
    }
  }

  /**
   * Record generation usage
   */
  private async recordGeneration(userId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.userGenerationStats.findFirst({
      where: {
        userId,
        date: today
      }
    });

    if (existing) {
      await this.prisma.userGenerationStats.update({
        where: { id: existing.id },
        data: { count: existing.count + 1 }
      });
    } else {
      await this.prisma.userGenerationStats.create({
        data: {
          userId,
          date: today,
          count: 1,
          monthYear: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
        }
      });
    }
  }

  /**
   * Get tier configuration
   */
  private getTierConfig(tier: string): {
    generationsPerDay: number | null;
    generationsPerMonth: number | null;
    qualities: string[];
  } {
    const configs = {
      FREE: { generationsPerDay: 3, generationsPerMonth: null, qualities: ['standard'] },
      CREATOR: { generationsPerDay: null, generationsPerMonth: 50, qualities: ['standard', 'high'] },
      PRO: { generationsPerDay: null, generationsPerMonth: 200, qualities: ['standard', 'high', 'ultra'] },
      STUDIO: { generationsPerDay: null, generationsPerMonth: -1, qualities: ['standard', 'high', 'ultra'] }
    };

    return configs[tier as keyof typeof configs] || configs.FREE;
  }

  /**
   * Get next reset time
   */
  private getNextReset(type: 'daily' | 'monthly'): string {
    const now = new Date();
    
    if (type === 'daily') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow.toISOString();
    } else {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return firstOfMonth.toISOString();
    }
  }

  /**
   * Estimate processing time based on request
   */
  private estimateProcessingTime(request: GenerationRequest): number {
    let time = 60; // Base time for instrumental

    if (request.includeVocals) time += 45;
    if (request.includeHarmonies) time += 30;
    if (request.quality === 'ultra') time += 30;
    if (request.duration > 180) time += (request.duration - 180) * 0.5;

    return time;
  }
}

export default MusicGenerationService;
