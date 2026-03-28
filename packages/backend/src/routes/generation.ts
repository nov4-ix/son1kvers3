/**
 * Generation Routes
 * Handles music generation requests with AI generation API integration
 */

import { FastifyInstance } from 'fastify';
import MusicGenerationService from '../services/musicGenerationService';
import { AnalyticsService } from '../services/analyticsService';
import { authMiddleware, quotaMiddleware } from '../middleware/auth';
import { addGenerationJob, getJobStatus } from '../queue';
import { generationRequestSchema, validateRequest } from '../lib/validation';
import { env } from '../lib/config';

export function generationRoutes(musicGenerationService: MusicGenerationService, analyticsService: AnalyticsService) {
  return async function (fastify: FastifyInstance) {
    // Generate music with AI generation API
    fastify.post('/create', {
      preHandler: [authMiddleware, quotaMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;

      try {
        // ✅ VALIDAR INPUT CON ZOD (Backend validation)
        let validatedData;
        try {
          validatedData = validateRequest(generationRequestSchema, request.body);
        } catch (validationError: any) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: validationError.message,
              details: validationError.details
            }
          });
        }

        const { prompt, style, duration, quality } = validatedData;

        // Check user limits
        const quotaInfo = (request as any).quotaInfo;
        if (quotaInfo.remainingGenerations <= 0) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'QUOTA_EXCEEDED',
              message: 'Monthly generation quota exceeded'
            }
          });
        }

        // Call generation API via service
        const result = await musicGenerationService.generateMusic({
          prompt,
          genre: style || 'pop',
          duration: duration || 60,
          quality: quality || 'standard',
          userId: user.id
        });

        if (result.status === 'failed') {
          return reply.code(500).send({
            success: false,
            error: {
              code: 'GENERATION_FAILED',
              message: result.error || 'Failed to generate music'
            }
          });
        }

        const taskId = result.jobId;

        if (!taskId) {
          return reply.code(500).send({
            success: false,
            error: {
              code: 'NO_TASK_ID',
              message: 'No task ID received from generation service'
            }
          });
        }

        // Create generation record in database
        const generation = await fastify.prisma.generation.create({
          data: {
            userId: user.id,
            prompt,
            style: style || 'pop',
            duration: duration || 60,
            quality: quality || 'standard',
            status: 'PENDING',
            generationTaskId: taskId,
            metadata: JSON.stringify({
              type: 'standard',
              style: style || 'pop',
              duration: duration || 60,
              quality: quality || 'standard'
            })
          }
        });

        // Add generation to queue for processing
        await addGenerationJob({
          generationId: generation.id,
          userId: user.id,
          prompt,
          style: style || 'pop',
          duration: duration || 60,
          quality: quality || 'standard'
        });

        // Track analytics
        await analyticsService.trackGeneration({
          userId: user.id,
          generationId: generation.id,
          prompt,
          style: style || 'pop',
          duration: duration || 60,
          quality: quality || 'standard',
          timestamp: new Date()
        });

        return {
          success: true,
          data: {
            generationId: generation.id,
            generationTaskId: taskId,
            status: 'PENDING',
            message: 'Generation started'
          }
        };

      } catch (error: any) {
        console.error('Generation error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'GENERATION_FAILED',
            message: error.message || 'Failed to generate music'
          }
        });
      }
    });

    // Generate lyrics only (for Lyrics Studio)
    fastify.post('/lyrics', async (request, reply) => {
      const { prompt, style } = request.body as any;

      try {
        if (!prompt) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'INVALID_INPUT',
              message: 'prompt is required'
            }
          });
        }

        // Import generateSongStructure from worker
        const axios = require('axios');
        const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

        if (!GROQ_API_KEY) {
          return reply.code(503).send({
            success: false,
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: 'Lyrics generation service not configured'
            }
          });
        }

        console.log('🧠 Generating lyrics with Groq...');
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: "llama3-70b-8192",
          messages: [
            {
              role: "system",
              content: `You are a world-class Songwriter and Music Producer AI. Your goal is to turn a simple user prompt into a hit song structure.
              
              OUTPUT FORMAT (JSON ONLY):
              {
                  "title": "Creative Song Title",
                  "style": "Enhanced Music Style (e.g., 'Uplifting Pop, 120bpm, Female Vocals, Synthesizer')",
                  "lyrics": "Complete song lyrics with structure tags [Verse], [Chorus], [Bridge], etc."
              }
              
              RULES:
              1. Lyrics MUST be structured with [Verse], [Chorus], [Bridge], [Outro].
              2. Use metatags like [Instrumental Solo], [Drop], [Slow Down] if appropriate.
              3. Determine the best style if user's style is vague.
              4. Lyrics should be creative, rhyming, and fit the mood.
              5. Return ONLY valid JSON.`
            },
            {
              role: "user",
              content: `User Prompt: "${prompt}". User Style Preference: "${style || 'Any'}". 
              Create a full song structure.`
            }
          ],
          response_format: { type: "json_object" }
        }, {
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        const content = response.data.choices[0].message.content;
        const result = JSON.parse(content);

        console.log(`🧠 Groq generated: "${result.title}" (${result.style})`);

        return {
          success: true,
          data: {
            title: result.title,
            lyrics: result.lyrics,
            style: result.style
          }
        };

      } catch (error: any) {
        console.error('Lyrics generation error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'LYRICS_GENERATION_FAILED',
            message: error.message || 'Failed to generate lyrics'
          }
        });
      }
    });

    // Get generation status
    fastify.get('/:id/status', {
      preHandler: [authMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;
      const { id } = request.params as any;

      try {
        const generation = await fastify.prisma.generation.findFirst({
          where: {
            id,
            userId: user.id
          }
        });

        if (!generation) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'GENERATION_NOT_FOUND',
              message: 'Generation not found'
            }
          });
        }

        // Check status with generation API if still pending or processing
        if (generation.status === 'PENDING' || generation.status === 'PROCESSING') {
          if (generation.generationTaskId) {
            const status = await musicGenerationService.getJobStatus(generation.generationTaskId);

            // ✅ NORMALIZED RESPONSE: Convertir status del servicio a formato normalizado
            // El servicio retorna: 'pending' | 'processing' | 'completed' | 'failed'
            // Normalizamos para DB: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
            const normalizedStatus = status.status === 'pending' ? 'PROCESSING' :
              status.status === 'processing' ? 'PROCESSING' :
                status.status === 'completed' ? 'COMPLETED' :
                  status.status === 'failed' ? 'FAILED' : generation.status;

            if (normalizedStatus !== generation.status || status.audioUrl) {
              await fastify.prisma.generation.update({
                where: { id: generation.id },
                data: {
                  status: normalizedStatus,
                  generationTaskId: status.jobId || generation.generationTaskId,
                  audioUrl: status.audioUrl || generation.audioUrl,
                  metadata: status.metadata ? JSON.stringify(status.metadata) : generation.metadata
                }
              });

              generation.status = normalizedStatus;
              generation.generationTaskId = status.jobId || generation.generationTaskId;
              generation.audioUrl = status.audioUrl || generation.audioUrl;
              if (status.metadata) {
                generation.metadata = JSON.stringify(status.metadata);
              }
            }
          }
        }

        // ✅ NORMALIZED RESPONSE CONTRACT: Frontend espera este formato
        // { running: boolean, status: string, tracks?: Track[] }
        const isRunning = generation.status === 'PENDING' || generation.status === 'PROCESSING';
        const statusFormatted = generation.status === 'COMPLETED' ? 'complete' :
          generation.status === 'FAILED' ? 'failed' :
            isRunning ? 'running' : 'unknown';

        // Parsear metadata para obtener tracks si existen
        let tracks = [];
        try {
          const metadata = generation.metadata ? JSON.parse(generation.metadata.toString()) : null;
          if (metadata?.tracks && Array.isArray(metadata.tracks)) {
            tracks = metadata.tracks;
          }
        } catch (e) {
          // Ignorar errores de parsing
        }

        return {
          success: true,
          data: {
            id: generation.id,
            generationTaskId: generation.generationTaskId,
            status: generation.status, // DB format: COMPLETED, FAILED, etc.
            audioUrl: generation.audioUrl,
            prompt: generation.prompt,
            style: generation.style,
            createdAt: generation.createdAt,
            updatedAt: generation.updatedAt,
            // ✅ CAMPOS NORMALIZADOS PARA FRONTEND LEGACY
            running: isRunning,
            statusNormalized: statusFormatted,
            tracks: tracks.length > 0 ? tracks : undefined
          }
        };

      } catch (error) {
        console.error('Status check error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'STATUS_CHECK_FAILED',
            message: 'Failed to check generation status'
          }
        });
      }
    });

    // Get generation history
    fastify.get('/history', {
      preHandler: [authMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;
      const { limit = 50, offset = 0 } = request.query as any;

      try {
        const generations = await fastify.prisma.generation.findMany({
          where: {
            userId: user.id
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: parseInt(limit) || 50,
          skip: parseInt(offset) || 0
        });

        return {
          success: true,
          data: generations.map(g => ({
            id: g.id,
            generationTaskId: g.generationTaskId,
            prompt: g.prompt,
            style: g.style,
            duration: g.duration,
            status: g.status,
            audioUrl: g.audioUrl,
            createdAt: g.createdAt,
            updatedAt: g.updatedAt
          }))
        };

      } catch (error) {
        console.error('History error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'HISTORY_FAILED',
            message: 'Failed to fetch generation history'
          }
        });
      }
    });

    // Generate cover (for Ghost Studio)
    fastify.post('/cover', {
      preHandler: [authMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;
      const { audio_url, prompt, style, customMode } = request.body as any;

      try {
        // Validate input
        if (!audio_url || !prompt) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'INVALID_INPUT',
              message: 'audio_url and prompt are required'
            }
          });
        }

        // Temporary mapping for compilation - map cover to generateMusic
        const result = await musicGenerationService.generateMusic({
          prompt: `Cover for ${audio_url}. ${prompt}`,
          genre: style || 'cover',
          duration: 120,
          quality: 'standard',
          userId: user.id
        });

        if (result.status === 'failed') {
          return reply.code(500).send({
            success: false,
            error: {
              code: 'COVER_GENERATION_FAILED',
              message: result.error || 'Failed to generate cover'
            }
          });
        }

        const taskId = result.jobId;

        if (!taskId) {
          return reply.code(500).send({
            success: false,
            error: {
              code: 'NO_TASK_ID',
              message: 'No task ID received from generation service'
            }
          });
        }

        // ✅ CREAR GENERACIÓN EN BASE DE DATOS (como en /create)
        const generation = await fastify.prisma.generation.create({
          data: {
            userId: user.id,
            prompt: `Cover: ${prompt}`,
            style: style || 'cover',
            duration: 120, // Default duration for covers
            quality: 'standard',
            status: 'PENDING',
            generationTaskId: taskId,
            metadata: JSON.stringify({
              type: 'cover',
              audio_url,
              customMode: customMode || true,
              originalPrompt: prompt
            })
          }
        });

        // Add generation to queue for processing
        await addGenerationJob({
          generationId: generation.id,
          userId: user.id,
          prompt: `Cover: ${prompt}`,
          style: style || 'cover',
          duration: 120,
          quality: 'standard'
        });

        // Track analytics
        await analyticsService.trackGeneration({
          userId: user.id,
          generationId: generation.id,
          prompt: `Cover: ${prompt}`,
          style: style || 'cover',
          duration: 120,
          quality: 'standard',
          timestamp: new Date()
        });

        return {
          success: true,
          data: {
            generationId: generation.id,
            taskId,
            status: 'PENDING',
            message: 'Cover generation started'
          }
        };

      } catch (error: any) {
        console.error('Cover generation error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'COVER_GENERATION_FAILED',
            message: error.message || 'Failed to generate cover'
          }
        });
      }
    });

    // Get cover status by taskId
    fastify.get('/cover/status/:taskId', {
      preHandler: [authMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;
      const { taskId } = request.params as any;

      try {
        // Find generation by taskId
        const generation = await fastify.prisma.generation.findFirst({
          where: {
            generationTaskId: taskId,
            userId: user.id
          }
        });

        if (!generation) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'GENERATION_NOT_FOUND',
              message: 'Cover generation not found'
            }
          });
        }

        // Check status with generation API if still pending or processing
        if (generation.status === 'PENDING' || generation.status === 'PROCESSING') {
          const status = await musicGenerationService.getJobStatus(taskId);

          // Normalize status
          const normalizedStatus = status.status === 'pending' ? 'PROCESSING' :
            status.status === 'processing' ? 'PROCESSING' :
              status.status === 'completed' ? 'COMPLETED' :
                status.status === 'failed' ? 'FAILED' : generation.status;

          if (normalizedStatus !== generation.status || status.audioUrl) {
            await fastify.prisma.generation.update({
              where: { id: generation.id },
              data: {
                status: normalizedStatus,
                generationTaskId: status.jobId || generation.generationTaskId,
                audioUrl: status.audioUrl || generation.audioUrl,
                metadata: status.metadata ? JSON.stringify(status.metadata) : generation.metadata
              }
            });

            generation.status = normalizedStatus;
            generation.generationTaskId = status.jobId || generation.generationTaskId;
            generation.audioUrl = status.audioUrl || generation.audioUrl;
            if (status.metadata) {
              generation.metadata = JSON.stringify(status.metadata);
            }
          }
        }

        return {
          success: true,
          data: {
            id: generation.id,
            taskId: generation.generationTaskId,
            status: generation.status,
            audioUrl: generation.audioUrl,
            prompt: generation.prompt,
            style: generation.style,
            createdAt: generation.createdAt,
            updatedAt: generation.updatedAt
          }
        };

      } catch (error) {
        console.error('Cover status check error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'STATUS_CHECK_FAILED',
            message: 'Failed to check cover status'
          }
        });
      }
    });
  };
}
