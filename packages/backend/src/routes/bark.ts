import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { barkService } from '../services/barkService';

export async function barkRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: any }>(
    '/api/bark/enhance',
    {
      preHandler: [authMiddleware]
    },
    async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
      try {
        const { generationId, audioUrl, quality, enhanceVocals, enhanceHarmonics } = request.body;

        if (!generationId || !audioUrl) {
          return reply.code(400).send({
            success: false,
            error: { code: 'INVALID_PAYLOAD', message: 'generationId and audioUrl are required' }
          });
        }

        const result = await barkService.enhanceAudio({
          generationId,
          audioUrl,
          quality: quality || 'standard',
          enhanceVocals: enhanceVocals !== false,
          enhanceHarmonics: enhanceHarmonics !== false
        });

        return reply.send({
          success: true,
          result
        });
      } catch (error: any) {
        fastify.log.error(error, 'Bark enhancement error');
        return reply.code(500).send({
          success: false,
          error: { code: 'BARK_ERROR', message: error.message }
        });
      }
    }
  );

  fastify.post<{ Body: any }>(
    '/api/bark/process-vocals',
    {
      preHandler: [authMiddleware]
    },
    async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
      try {
        const { audioUrl, voiceCloneId } = request.body;

        if (!audioUrl) {
          return reply.code(400).send({
            success: false,
            error: { code: 'INVALID_PAYLOAD', message: 'audioUrl is required' }
          });
        }

        const processedUrl = await barkService.processVocals(audioUrl, voiceCloneId);

        return reply.send({
          success: true,
          processedUrl
        });
      } catch (error: any) {
        fastify.log.error(error, 'Bark vocal processing error');
        return reply.code(500).send({
          success: false,
          error: { code: 'BARK_ERROR', message: error.message }
        });
      }
    }
  );

  fastify.get(
    '/api/bark/status',
    async (request, reply) => {
      return reply.send({
        success: true,
        status: {
          enabled: process.env.BARK_ENABLED === 'true',
          apiUrl: process.env.BARK_API_URL || 'http://localhost:8002'
        }
      });
    }
  );
}