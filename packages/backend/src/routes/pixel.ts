import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { pixelService } from '../services/pixelService';
import { authMiddleware } from '../middleware/auth';

interface PixelChatBody {
  userId: string;
  message: string;
  history?: Array<{ role: string; content: string }>;
}

export async function pixelRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: PixelChatBody }>(
    '/api/pixel/chat',
    {
      preHandler: [authMiddleware]
    },
    async (request: FastifyRequest<{ Body: PixelChatBody }>, reply: FastifyReply) => {
      try {
        const { userId, message, history } = request.body;
        
        if (!userId || !message) {
          return reply.code(400).send({
            success: false,
            error: { code: 'INVALID_PAYLOAD', message: 'userId and message are required' }
          });
        }

        const response = await pixelService.chat(userId, message, history);

        return reply.send({
          success: true,
          response
        });
      } catch (error: any) {
        fastify.log.error(error, 'Pixel chat error');
        return reply.code(500).send({
          success: false,
          error: { code: 'PIXEL_ERROR', message: error.message }
        });
      }
    }
  );

  fastify.get<{ Params: { userId: string } }>(
    '/api/pixel/diagnose/:userId',
    {
      preHandler: [authMiddleware]
    },
    async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
      try {
        const { userId } = request.params;
        
        const diagnosis = await pixelService.diagnoseCreativeBlock(userId);

        return reply.send({
          success: true,
          diagnosis
        });
      } catch (error: any) {
        fastify.log.error(error, 'Pixel diagnose error');
        return reply.code(500).send({
          success: false,
          error: { code: 'PIXEL_ERROR', message: error.message }
        });
      }
    }
  );

  fastify.get(
    '/api/pixel/symbols',
    async (request, reply) => {
      return reply.send({
        success: true,
        symbols: {
          selloImperfecto: '◉⚡',
          simboloArcano: '◐',
          fullSello: '◯⚡',
          fullArcano: '◉◐'
        }
      });
    }
  );
}