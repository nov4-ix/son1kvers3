/**
 * Generation Worker
 * Processes music generation jobs from BullMQ queue
 * Handles retries, errors, and WebSocket updates
 * All generations require userId and are counted against user tier
 */
import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import MusicGenerationService from '../services/musicGenerationService';
import { Server as SocketIOServer } from 'socket.io';

// Redis connection for worker - DISABLED FOR LOCAL DEV
// Uncomment when Redis is available
/*
const redisConnection = new Redis(process.env.REDIS_URL || process.env.REDIS_HOST || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});
*/
const redisConnection: any = null; // Placeholder for local dev without Redis

export interface GenerationWorkerData {
  generationId: string;
  userId: string; // Required - all generations must be associated with a user
  prompt: string;
  style: string;
  duration: number;
  quality: 'standard' | 'high' | 'ultra';
}

/**
 * Create generation worker
 */
export function createGenerationWorker(
  prisma: PrismaClient,
  musicGenerationService: MusicGenerationService,
  io: SocketIOServer
): Worker<GenerationWorkerData> {
  const worker = new Worker<GenerationWorkerData>(
    'generation',
    async (job: Job<GenerationWorkerData>) => {
      const { generationId, userId, prompt, style, duration, quality } = job.data;

      // Validate that userId is provided
      if (!userId) {
        throw new Error('userId is required for all generations');
      }

      try {
        // Update progress: 10% - Starting
        await job.updateProgress(10);
        await prisma.generation.update({
          where: { id: generationId },
          data: { status: 'PROCESSING' }
        });

        // Emit WebSocket update (userId is always required)
        io.to(`user:${userId}`).emit('generation:progress', {
          generationId,
          progress: 10,
          status: 'processing',
          message: 'Iniciando generación...'
        });

        // Update progress: 30% - Calling generation API
        await job.updateProgress(30);
        io.to(`user:${userId}`).emit('generation:progress', {
          generationId,
          progress: 30,
          status: 'processing',
          message: 'Conectando con motor de generación IA...'
        });

        // Generate music with AI generation API
        const result = await musicGenerationService.generateMusic({
          prompt,
          genre: style,
          duration,
          quality,
          userId
        });

        // Update progress: 70% - Processing result
        await job.updateProgress(70);
        io.to(`user:${userId}`).emit('generation:progress', {
          generationId,
          progress: 70,
          status: 'processing',
          message: 'Procesando audio...'
        });

        // Update progress: 90% - Finalizing
        await job.updateProgress(90);
        await prisma.generation.update({
          where: { id: generationId },
          data: {
            status: result.status === 'completed' ? 'COMPLETED' : 'PROCESSING',
            generationTaskId: result.jobId,
            audioUrl: result.audioUrl || undefined,
            metadata: result.metadata ? JSON.stringify(result.metadata) : undefined
          }
        });

        io.to(`user:${userId}`).emit('generation:progress', {
          generationId,
          progress: 90,
          status: 'finalizing',
          message: 'Finalizando...'
        });

        // Update progress: 100% - Complete
        await job.updateProgress(100);

        // If audio URL is available, update to completed
        if (result.audioUrl) {
          await prisma.generation.update({
            where: { id: generationId },
            data: {
              status: 'COMPLETED',
              audioUrl: result.audioUrl
            }
          });

          // ✅ SOLO DECREMENTAR CRÉDITOS DESPUÉS DE ÉXITO CONFIRMADO
          // Esto asegura que el usuario no pierde créditos si la API falla
          // All generations must count against user tier (except system)
          if (userId !== 'system') {
            try {
              await prisma.userTier.upsert({
                where: { userId },
                create: {
                  userId,
                  usedThisMonth: 1,
                  usedToday: 1,
                  monthlyGenerations: 10,
                  dailyGenerations: 5
                },
                update: {
                  usedThisMonth: { increment: 1 },
                  usedToday: { increment: 1 }
                }
              });
              console.log(`✅ Créditos decrementados para usuario ${userId} después de éxito confirmado`);
            } catch (tierError) {
              // Log but don't fail - el audio ya está generado
              console.warn('Could not update user tier after success:', tierError);
            }
          }
        }

        // Emit completion
        io.to(`user:${userId}`).emit('generation:complete', {
          generationId,
          audioUrl: result.audioUrl,
          status: 'completed',
          message: '¡Música generada exitosamente!'
        });

        return {
          success: true,
          generationId,
          audioUrl: result.audioUrl,
          generationTaskId: result.jobId
        };

      } catch (error: any) {
        console.error(`Generation job ${generationId} failed:`, error);

        // Update DB with error
        await prisma.generation.update({
          where: { id: generationId },
          data: {
            status: 'FAILED',
            metadata: JSON.stringify({
              error: error.message,
              stack: error.stack,
              attempts: job.attemptsMade
            })
          }
        });

        // Emit error (userId is always required)
        io.to(`user:${userId}`).emit('generation:error', {
          generationId,
          error: error.message || 'Error desconocido',
          status: 'failed',
          message: 'Error al generar música. Inténtalo de nuevo.'
        });

        // Re-throw for BullMQ retry mechanism
        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: parseInt(process.env.GENERATION_CONCURRENCY || '50'), // Increased for scale
      limiter: {
        max: parseInt(process.env.GENERATION_RATE_LIMIT || '100'), // Increased for scale
        duration: 1000, // Per second
      },
    }
  );

  // Event handlers
  worker.on('completed', (job) => {
    console.log(`✅ Generation job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Generation job ${job?.id} failed:`, err);
  });

  worker.on('error', (err) => {
    console.error('❌ Generation worker error:', err);
  });

  worker.on('stalled', (jobId) => {
    console.warn(`⚠️ Generation job ${jobId} stalled`);
  });

  return worker;
}

/**
 * Close worker and cleanup
 */
export async function closeWorker(worker: Worker<GenerationWorkerData>) {
  await worker.close();
  await redisConnection.quit();
}
