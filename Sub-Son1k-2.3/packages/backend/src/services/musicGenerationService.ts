/**
 * Music Generation Service
 * Handles integration with AI music generation API
 */

import { TokenManager } from './tokenManager';
import { TokenPoolService } from './tokenPoolService';
import { CreditService } from './creditService';
import axios, { AxiosInstance } from 'axios';
import { env } from '../lib/config';
import { PrismaClient } from '@prisma/client';
import { emitGenerationUpdate } from '../websocket/generationSocket';
import { Queue } from 'bullmq';
import { withRetry } from '@super-son1k/shared-utils';
import {
  generationCounter,
  generationDuration,
  activeGenerations,
  sunoApiCalls,
  sunoApiDuration,
  sunoApiErrors,
  measureDuration
} from '../monitoring/metrics';

export interface GenerationRequest {
  prompt: string;
  style: string;
  duration: number;
  quality: string;
  userId: string; // Required - all generations must be associated with a user
  generationId?: string;
  boost?: boolean;
}

export interface CoverRequest {
  audio_url: string;
  prompt: string;
  style?: string;
  customMode?: boolean;
  userId: string;
}

export interface GenerationResult {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  generationTaskId?: string;
  audioUrl?: string;
  metadata?: any;
  estimatedTime?: number;
  error?: string;
}

export class MusicGenerationService {
  private axiosInstances: Map<string, AxiosInstance> = new Map();
  private tokenPoolService?: TokenPoolService;
  private generationQueue: Queue;
  private prisma: PrismaClient;

  constructor(private tokenManager: TokenManager, tokenPoolService: TokenPoolService | undefined, prisma: PrismaClient, private creditService: CreditService) {
    this.tokenPoolService = tokenPoolService;
    this.prisma = prisma;

    const REDIS_URL = process.env.REDIS_URL;
    if (REDIS_URL) {
      // Only initialize queue if Redis is available
      this.generationQueue = new Queue('music-generation', {
        connection: {
          url: REDIS_URL
        }
      });
      console.log('🚀 MusicGenerationService: Queue initialized with Redis');
    } else {
      // @ts-ignore - Queue is optional for local dev
      this.generationQueue = null;
      console.log('⚠️  MusicGenerationService: Running without Redis (queue disabled)');
    }
  }

  /**
   * Generate music using AI generation API implementation
   */
  async generateMusic(request: GenerationRequest): Promise<GenerationResult> {
    try {
      if (!request.userId) {
        return { status: 'failed', error: 'userId is required' };
      }

      // 0. Gamification: Check & Spend Credits
      let priority = 0;
      if (request.userId !== 'anonymous') {
        const creditCost = 5; // Standard cost
        const canSpend = await this.creditService.spendCredits(request.userId, creditCost, 'generation');
        if (!canSpend) {
          return { status: 'failed', error: 'Insufficient credits (Required: 5)' };
        }

        // Boost Check
        if (request.boost) {
          const durationMinutes = Math.ceil(request.duration / 60) || 1;
          const userCredits = await this.creditService.getUserCredits(request.userId);
          if (userCredits.boostMinutes >= durationMinutes) {
            await this.creditService.consumeBoost(request.userId, durationMinutes);
            priority = 10;
            console.log(`[MusicGenerationService] Boost activated for user ${request.userId}`);
          }
        }
      }

      console.log(`[MusicGenerationService] Enqueuing generation for user ${request.userId}`);

      // 1. Create DB Record
      const queueItem = await this.prisma.generationQueue.create({
        data: {
          userId: request.userId,
          prompt: request.prompt,
          type: 'song',
          parameters: {
            style: request.style,
            duration: request.duration,
            quality: request.quality
          },
          status: 'pending',
          position: 0,
          estimatedWaitTime: priority > 0 ? 30 : 120, // Faster if boosted
          priority: priority
        }
      });

      // 2. Add to BullMQ (only if Redis is available)
      if (this.generationQueue) {
        await this.generationQueue.add('generate-music', {
          userId: request.userId,
          prompt: request.prompt,
          style: request.style,
          duration: request.duration,
          quality: request.quality,
          queueId: queueItem.id,
          priority: priority
        }, { priority: priority }); // BullMQ job priority
        console.log(`[MusicGenerationService] Enqueued job: ${queueItem.id} (Priority: ${priority})`);
      } else {
        // ✅ MODO SIN REDIS: Procesar directamente (síncrono pero funcional)
        console.log(`[MusicGenerationService] Queue disabled - processing directly for queueId: ${queueItem.id}`);

        // Procesar en background sin bloquear la respuesta
        setImmediate(async () => {
          try {
            await this.processGenerationDirectly(queueItem.id, {
              userId: request.userId,
              prompt: request.prompt,
              style: request.style,
              duration: request.duration,
              quality: request.quality
            });
          } catch (error) {
            console.error(`[MusicGenerationService] Direct processing failed for ${queueItem.id}:`, error);
          }
        });
      }

      return {
        status: 'pending',
        generationTaskId: queueItem.id, // Return Queue ID, not Suno ID
        estimatedTime: priority > 0 ? 30 : 120
      };

    } catch (error) {
      console.error('Music generation error:', error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate cover using AI generation API
   */
  async generateCover(request: CoverRequest): Promise<GenerationResult> {
    try {
      // Validate userId
      // Validate userId
      if (!request.userId) {
        return {
          status: 'failed',
          error: 'userId is required for cover generation'
        };
      }

      // 0. Gamification: Check & Spend Credits for Cover
      if (request.userId !== 'anonymous') {
        const creditCost = 10; // Covers are more expensive? Or same? Let's say 10.
        const canSpend = await this.creditService.spendCredits(request.userId, creditCost, 'cover');
        if (!canSpend) {
          return { status: 'failed', error: 'Insufficient credits (Required: 10)' };
        }
      }

      // Get Token (Unified Strategy)
      let tokenStr: string;
      let tokenId: string;

      try {
        if (this.tokenPoolService) {
          // Get User Tier
          let tier = 'free';
          if (request.userId && request.userId !== 'anonymous') {
            const userTier = await this.prisma.userTier.findUnique({ where: { userId: request.userId } });
            if (userTier) tier = userTier.tier.toLowerCase();
          }

          const selection = await this.tokenPoolService.selectOptimalToken(tier as any, request.userId);
          tokenStr = selection.token;
          tokenId = selection.tokenId;
        } else {
          // Fallback to basic manager
          const tokenData = await this.tokenManager.getHealthyToken(request.userId);
          if (!tokenData) throw new Error('No available tokens');
          tokenStr = tokenData.token;
          tokenId = tokenData.tokenId;
        }
      } catch (err) {
        return { status: 'failed', error: 'No available generation resources. Please try again later.' };
      }

      // Use the specific cover API URL if different, or default to the main one
      // Note: The original code used 'https://usa.imgkits.com/node-api/suno/cover'
      // We should probably make this configurable or part of the axios instance creation
      const coverApiUrl = env.COVER_API_URL || 'https://usa.imgkits.com/node-api/suno';

      const response = await axios.post(`${coverApiUrl}/cover`, {
        audio_url: request.audio_url,
        prompt: request.prompt,
        customMode: request.customMode || true,
        style: request.style || 'cover'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${tokenStr}`,
          'channel': 'node-api',
          'origin': 'https://www.livepolls.app',
          'referer': 'https://www.livepolls.app/'
        },
        timeout: 30000
      });

      if (response.status === 200 && response.data) {
        const data = response.data;
        const taskId = data.data?.taskId || data.taskId || data.task_id;

        if (!taskId) {
          return {
            status: 'failed',
            error: 'No task ID received from generation API'
          };
        }

        // Update token usage
        await this.tokenManager.updateTokenUsage(tokenId, {
          endpoint: '/cover',
          method: 'POST',
          statusCode: response.status,
          responseTime: 0,
          timestamp: new Date()
        });

        return {
          status: 'pending',
          generationTaskId: taskId,
          estimatedTime: 120 // Covers might take longer?
        };
      } else {
        return {
          status: 'failed',
          error: 'Invalid response from cover generation API'
        };
      }

    } catch (error) {
      console.error('Cover generation error:', error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check generation status
   * COMPORTAMIENTO LEGACY: Tolerante a estados inconsistentes, no falla con "unknown" o "running"
   */
  async checkGenerationStatus(generationTaskId: string, generationId?: string): Promise<GenerationResult> {
    try {
      // Get Token (Unified Strategy)
      let tokenStr: string;
      let tokenId: string;

      try {
        if (this.tokenPoolService) {
          // For status check, tier doesn't matter much, defaulting to free/system
          const selection = await this.tokenPoolService.selectOptimalToken('free', 'system-poller');
          tokenStr = selection.token;
          tokenId = selection.tokenId;
        } else {
          // Fallback to basic manager
          const tokenData = await this.tokenManager.getHealthyToken();
          if (!tokenData) throw new Error('No available tokens');
          tokenStr = tokenData.token;
          tokenId = tokenData.tokenId;
        }
      } catch (err) {
        // ⚠️ LEGACY BEHAVIOR: Si no hay token disponible, retornar 'processing' en lugar de 'failed'
        // para que el polling continúe en el siguiente intento (retrying)
        console.warn('[checkGenerationStatus] No token available, retrying...', err);
        return { status: 'processing', generationTaskId, estimatedTime: 60 }; // retrying
      }

      const pollingUrl = env.GENERATION_POLLING_URL || env.NEURAL_ENGINE_POLLING_URL || 'https://usa.imgkits.com/node-api/suno';

      let response;
      try {
        response = await withRetry(async () => {
          return await axios.get(`${pollingUrl}/get_mj_status/${generationTaskId}`, {
            timeout: 10000,
            headers: {
              'authorization': `Bearer ${tokenStr}`,
              'Content-Type': 'application/json',
              'channel': 'node-api',
              'origin': 'https://www.livepolls.app',
              'referer': 'https://www.livepolls.app/'
            }
          });
        }, {
          maxRetries: 3,
          initialDelay: 1000
        });
      } catch (networkError) {
        // ⚠️ LEGACY BEHAVIOR: Si falla la red, retornar 'processing' para reintentar
        console.warn('[checkGenerationStatus] Network error, will retry...', networkError);
        return {
          status: 'processing',
          generationTaskId,
          estimatedTime: 60
        };
      }

      if (response.status === 200 && response.data) {
        const data = response.data;

        // Update token usage
        try {
          await this.tokenManager.updateTokenUsage(tokenId, {
            endpoint: `/get_mj_status/${generationTaskId}`,
            method: 'GET',
            statusCode: response.status,
            responseTime: data.responseTime || 0,
            timestamp: new Date()
          });
        } catch (tokenUpdateError) {
          // No fallar si falla el update del token
          console.warn('[checkGenerationStatus] Token usage update failed', tokenUpdateError);
        }

        // ✅ LEGACY BEHAVIOR: Prioridad a tracks válidos sobre el campo "running"
        // Si existen tracks con audio_url, consideramos la generación exitosa
        const tracks = data.tracks || data.clips || [];
        const hasValidTracks = Array.isArray(tracks) && tracks.length > 0 && tracks.some((t: any) => t.audio_url);

        if (hasValidTracks) {
          const firstTrack = tracks.find((t: any) => t.audio_url);
          const result = {
            status: 'completed' as const,
            generationTaskId,
            audioUrl: firstTrack.audio_url,
            metadata: {
              tracks: tracks,
              duration: firstTrack.duration,
              title: firstTrack.title,
              createdAt: new Date()
            }
          } as GenerationResult;

          // Emit WebSocket update
          if (generationId) {
            emitGenerationUpdate(generationId, 'completed', 100, tracks, firstTrack.audio_url);
          }

          return result;
        }

        // ✅ LEGACY BEHAVIOR: Fallback al campo audio_url directo
        if (data.audio_url) {
          const result = {
            status: 'completed' as const,
            generationTaskId,
            audioUrl: data.audio_url,
            metadata: {
              duration: data.duration,
              title: data.title,
              createdAt: new Date()
            }
          } as GenerationResult;

          // Emit WebSocket update
          if (generationId) {
            emitGenerationUpdate(generationId, 'completed', 100, [], data.audio_url);
          }

          return result;
        }

        // ✅ LEGACY BEHAVIOR: Evaluar el campo "running" SOLO si no hay tracks
        // running === false SIN audio_url = seguir en procesamiento (Suno puede estar preparando)
        if (data.running === false && !data.audio_url) {
          console.log('[checkGenerationStatus] running=false pero sin audio_url, continuar polling...');
          return {
            status: 'processing',
            generationTaskId,
            estimatedTime: 60
          };
        }

        // ✅ LEGACY BEHAVIOR: running === true = procesamiento activo
        if (data.running === true) {
          return {
            status: 'processing',
            generationTaskId,
            estimatedTime: 60
          };
        }

        // ✅ LEGACY BEHAVIOR: Estado "unknown" o cualquier otro = continuar procesando
        // NO abortar el flujo, simplemente esperar el siguiente poll
        const statusStr = (data.status || 'unknown').toLowerCase();
        if (statusStr === 'error' || statusStr === 'failed') {
          // Solo fallar si Suno explícitamente indica error
          return {
            status: 'failed',
            generationTaskId,
            error: data.error_message || data.error || 'Generation failed on Suno API'
          };
        }

        // ✅ DEFAULT: Continuar procesando (comportamiento tolerante)
        return {
          status: 'processing',
          generationTaskId,
          estimatedTime: 60
        };

      } else {
        // ⚠️ LEGACY BEHAVIOR: Respuesta HTTP no-200 = continuar polling (puede ser temporal)
        console.warn(`[checkGenerationStatus] Non-200 response: ${response.status}, will retry...`);
        return {
          status: 'processing',
          generationTaskId,
          estimatedTime: 60
        };
      }

    } catch (error) {
      // ⚠️ LEGACY BEHAVIOR: Error inesperado = continuar polling
      // SOLO abortar en errores HTTP fatales (401, 403, 404)
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          console.error('[checkGenerationStatus] Auth error, aborting:', error);
          return {
            status: 'failed',
            error: 'Authentication error'
          };
        }
        if (status === 404) {
          console.error('[checkGenerationStatus] Task not found:', error);
          return {
            status: 'failed',
            error: 'Generation task not found'
          };
        }
      }

      // Cualquier otro error = continuar polling
      // Unexpected error, will retry - retornar status: 'processing'
      console.warn('[checkGenerationStatus] Unexpected error, will retry:', error);
      return { status: 'processing', generationTaskId, estimatedTime: 60 };
    }
  }

  /**
   * Check cover generation status
   */
  async checkCoverStatus(generationTaskId: string): Promise<GenerationResult> {
    // Reuse checkGenerationStatus as the endpoint seems to be the same for status checks
    return this.checkGenerationStatus(generationTaskId);
  }

  /**
   * Create axios instance for generation API
   */
  private createAxiosInstance(token: string): AxiosInstance {
    const baseURL = env.GENERATION_API_URL || env.NEURAL_ENGINE_API_URL || 'https://ai.imgkits.com/suno';
    return axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'channel': 'node-api',
        'origin': 'https://www.livepolls.app',
        'referer': 'https://www.livepolls.app/',
        'User-Agent': 'Super-Son1k-2.0/2.0',
        'X-Client-Version': '2.0.0'
      }
    });
  }

  /**
   * Process generation directly when Redis is not available
   * This is a fallback mechanism for local development
   */
  private async processGenerationDirectly(
    queueId: string,
    request: { userId: string; prompt: string; style: string; duration: number; quality: string }
  ): Promise<void> {
    try {
      // Get User Tier
      const user = await this.prisma.user.findUnique({ where: { id: request.userId } });
      const userTier = (user?.tier || 'free').toLowerCase() as 'free' | 'basic' | 'pro' | 'enterprise';

      // Get Token
      let tokenStr: string;
      let tokenId: string;

      if (this.tokenPoolService) {
        const selection = await this.tokenPoolService.selectOptimalToken(userTier, request.userId);
        tokenStr = selection.token;
        tokenId = selection.tokenId;
      } else {
        const tokenData = await this.tokenManager.getHealthyToken(request.userId);
        if (!tokenData) throw new Error('No available tokens');
        tokenStr = tokenData.token;
        tokenId = tokenData.tokenId;
      }

      // Update status to processing
      await this.prisma.generationQueue.update({
        where: { id: queueId },
        data: {
          status: 'processing',
          startedAt: new Date()
        }
      });

      // Call generation API (simplified version)
      const baseURL = env.GENERATION_API_URL || env.NEURAL_ENGINE_API_URL || 'https://ai.imgkits.com/suno';
      const response = await axios.post(`${baseURL}/generate`, {
        prompt: request.prompt,
        lyrics: '',
        title: '',
        style: request.style,
        customMode: false,
        instrumental: false
      }, {
        headers: {
          'authorization': `Bearer ${tokenStr}`,
          'Content-Type': 'application/json',
          'channel': 'node-api',
          'origin': 'https://www.livepolls.app',
          'referer': 'https://www.livepolls.app/'
        },
        timeout: 60000
      });

      if (response.status === 200 && response.data) {
        const taskId = response.data.taskId || response.data.id || response.data.task_id;

        await this.prisma.generationQueue.update({
          where: { id: queueId },
          data: {
            status: 'processing',
            result: { taskId, ...response.data }
          }
        });

        // Update generation record if exists
        const generation = await this.prisma.generation.findFirst({
          where: { generationTaskId: queueId }
        });

        if (generation) {
          await this.prisma.generation.update({
            where: { id: generation.id },
            data: {
              status: 'PROCESSING',
              generationTaskId: taskId
            }
          });
        }

        // ✅ Actualizar health del token después de uso exitoso
        if (this.tokenPoolService) {
          try {
            await this.tokenPoolService.updateTokenHealth(tokenId, true, response.data.responseTime || 30000);
          } catch (healthError) {
            console.warn('[MusicGenerationService] Failed to update token health:', healthError);
          }
        }

        console.log(`[MusicGenerationService] Direct processing started: ${taskId}`);
      } else {
        // ✅ Actualizar health del token (fallo)
        if (this.tokenPoolService) {
          try {
            await this.tokenPoolService.updateTokenHealth(tokenId, false, 0);
          } catch (healthError) {
            console.warn('[MusicGenerationService] Failed to update token health:', healthError);
          }
        }
        throw new Error(`API returned status ${response.status}`);
      }
    } catch (error: any) {
      console.error(`[MusicGenerationService] Direct processing error:`, error);
      
      // ✅ Actualizar health del token (error)
      if (this.tokenPoolService && tokenId) {
        try {
          await this.tokenPoolService.updateTokenHealth(tokenId, false, 0);
        } catch (healthError) {
          console.warn('[MusicGenerationService] Failed to update token health:', healthError);
        }
      }

      await this.prisma.generationQueue.update({
        where: { id: queueId },
        data: {
          status: 'failed',
          error: error.message || 'Unknown error'
        }
      });
    }
  }

  /**
   * Generate tags based on style
   */
  private generateTags(style: string): string[] {
    const styleTags: Record<string, string[]> = {
      'pop': ['pop', 'catchy', 'melodic'],
      'rock': ['rock', 'guitar', 'energetic'],
      'hip-hop': ['hip-hop', 'rap', 'urban'],
      'electronic': ['electronic', 'synth', 'dance'],
      'jazz': ['jazz', 'smooth', 'sophisticated'],
      'classical': ['classical', 'orchestral', 'elegant'],
      'country': ['country', 'folk', 'acoustic'],
      'blues': ['blues', 'soulful', 'emotional'],
      'reggae': ['reggae', 'tropical', 'laid-back'],
      'metal': ['metal', 'heavy', 'aggressive']
    };

    return styleTags[style.toLowerCase()] || ['original', 'unique'];
  }

  /**
   * Estimate generation time based on duration and quality
   */
  private estimateGenerationTime(duration: number, quality: string): number {
    let baseTime = duration * 2; // Base 2x duration

    // Adjust based on quality
    switch (quality.toLowerCase()) {
      case 'standard':
        baseTime *= 1;
        break;
      case 'high':
        baseTime *= 1.5;
        break;
      case 'premium':
        baseTime *= 2;
        break;
      case 'enterprise':
        baseTime *= 2.5;
        break;
      default:
        baseTime *= 1;
    }

    // Minimum 30 seconds, maximum 10 minutes
    return Math.max(30, Math.min(600, baseTime));
  }

  /**
   * Health check for generation service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const tokenData = await this.tokenManager.getHealthyToken();

      if (!tokenData) {
        return false;
      }

      // Health check usando un endpoint simple
      try {
        const axiosInstance = this.createAxiosInstance(tokenData.token);
        // Intentar una llamada simple para verificar token
        const response = await axiosInstance.get('/generate', {
          timeout: 5000,
          validateStatus: () => true // Aceptar cualquier status para health check
        });
        // Si no es 401 (Unauthorized), el token es válido
        return response.status !== 401;
      } catch (error) {
        return false;
      }
    } catch (error) {
      console.error('Generation service health check failed:', error);
      return false;
    }
  }

  /**
   * Close service and cleanup
   */
  async close() {
    // Close all axios instances
    this.axiosInstances.clear();
  }
  /**
   * Get the status of a generation task from Suno API
   */
  public async getGenerationStatus(taskId: string): Promise<any> {
    // 1. Check DB first
    try {
      const queueItem = await this.prisma.generationQueue.findUnique({ where: { id: taskId } });
      if (queueItem) {
        if (queueItem.status === 'completed' && queueItem.result) {
          const result: any = queueItem.result;
          // Normalize result
          return {
            success: true,
            status: 'completed',
            audioUrl: result.audio_url || (Array.isArray(result) ? result[0]?.audio_url : null),
            title: result.title,
            metadata: result
          };
        } else if (queueItem.status === 'failed') {
          return { success: false, status: 'failed', error: queueItem.error };
        } else {
          return { success: true, status: queueItem.status }; // pending, processing
        }
      }
    } catch (dbError) {
      console.warn('DB check failed in getGenerationStatus, falling back to Suno check', dbError);
    }

    // 2. Fallback to direct Suno check
    const result = await this.checkGenerationStatus(taskId);
    if (result.status === 'failed') {
      throw new Error(result.error || 'Status check failed');
    }
    return result;
  }

}
