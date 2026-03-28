import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { voiceCloneService } from '../services/voiceCloneService';
import { authMiddleware, premiumMiddleware } from '../middleware/auth';

interface CreateCloneBody {
  audioUrl: string;
  name: string;
  description?: string;
  language?: string;
}

interface ApplyCloneParams {
  generationId: string;
}

interface ApplyCloneBody {
  voiceCloneId: string;
}

export async function voiceCloneRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateCloneBody }>(
    '/api/voice-clone',
    {
      preHandler: [authMiddleware, premiumMiddleware]
    },
    async (request: FastifyRequest<{ Body: CreateCloneBody }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user;
        const { audioUrl, name, description, language } = request.body;

        if (!audioUrl || !name) {
          return reply.code(400).send({
            success: false,
            error: { code: 'INVALID_PAYLOAD', message: 'audioUrl and name are required' }
          });
        }

        const voiceClone = await voiceCloneService.createVoiceClone(
          user.id,
          audioUrl,
          name,
          description,
          language
        );

        return reply.send({
          success: true,
          voiceClone
        });
      } catch (error: any) {
        fastify.log.error(error, 'Voice clone creation error');
        return reply.code(500).send({
          success: false,
          error: { code: 'VOICE_CLONE_ERROR', message: error.message }
        });
      }
    }
  );

  fastify.get(
    '/api/voice-clone',
    {
      preHandler: [authMiddleware]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as any).user;
        const voiceClones = await voiceCloneService.getUserVoiceClones(user.id);

        return reply.send({
          success: true,
          voiceClones
        });
      } catch (error: any) {
        fastify.log.error(error, 'Get voice clones error');
        return reply.code(500).send({
          success: false,
          error: { code: 'VOICE_CLONE_ERROR', message: error.message }
        });
      }
    }
  );

  fastify.get<{ Params: { id: string } }>(
    '/api/voice-clone/:id',
    {
      preHandler: [authMiddleware]
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const voiceClone = await voiceCloneService.getVoiceCloneById(request.params.id);

        if (!voiceClone) {
          return reply.code(404).send({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Voice clone not found' }
          });
        }

        return reply.send({
          success: true,
          voiceClone
        });
      } catch (error: any) {
        fastify.log.error(error, 'Get voice clone error');
        return reply.code(500).send({
          success: false,
          error: { code: 'VOICE_CLONE_ERROR', message: error.message }
        });
      }
    }
  );

  fastify.delete<{ Params: { id: string } }>(
    '/api/voice-clone/:id',
    {
      preHandler: [authMiddleware]
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user;
        await voiceCloneService.deleteVoiceClone(request.params.id, user.id);

        return reply.send({
          success: true,
          message: 'Voice clone deleted'
        });
      } catch (error: any) {
        fastify.log.error(error, 'Delete voice clone error');
        return reply.code(500).send({
          success: false,
          error: { code: 'VOICE_CLONE_ERROR', message: error.message }
        });
      }
    }
  );

  fastify.post<{ Params: ApplyCloneParams; Body: ApplyCloneBody }>(
    '/api/generation/:generationId/apply-voice',
    {
      preHandler: [authMiddleware]
    },
    async (
      request: FastifyRequest<{ Params: ApplyCloneParams; Body: ApplyCloneBody }>,
      reply: FastifyReply
    ) => {
      try {
        const { generationId } = request.params;
        const { voiceCloneId } = request.body;

        if (!voiceCloneId) {
          return reply.code(400).send({
            success: false,
            error: { code: 'INVALID_PAYLOAD', message: 'voiceCloneId is required' }
          });
        }

        await voiceCloneService.applyVoiceClone(generationId, voiceCloneId);

        return reply.send({
          success: true,
          message: 'Voice clone applied to generation'
        });
      } catch (error: any) {
        fastify.log.error(error, 'Apply voice clone error');
        return reply.code(500).send({
          success: false,
          error: { code: 'VOICE_CLONE_ERROR', message: error.message }
        });
      }
    }
  );
}