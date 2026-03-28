import { FastifyInstance } from 'fastify';
import { authenticateRequest } from '../middleware/auth.middleware';
import { viralHooksService } from '../services/viral-hooks.service';
import { scheduleOptimizer } from '../services/schedule-optimizer.service';
import { z } from 'zod';

const hooksQuerySchema = z.object({
    platform: z.string().default('instagram')
});

const scheduleQuerySchema = z.object({
    platform: z.string(),
    audience: z.string().default('general')
});

export async function growthRoutes(fastify: FastifyInstance) {

    // GET /api/growth/hooks
    fastify.get('/api/growth/hooks', {
        preHandler: [authenticateRequest]
    }, async (request, reply) => {
        const user = (request as any).user;
        const { platform } = hooksQuerySchema.parse(request.query);

        try {
            const hooks = await viralHooksService.generateWeeklyHooks(user.userId, platform);
            return reply.send({ success: true, data: hooks });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to generate viral hooks' });
        }
    });

    // GET /api/growth/schedule
    fastify.get('/api/growth/schedule', {
        preHandler: [authenticateRequest]
    }, async (request, reply) => {
        const { platform, audience } = scheduleQuerySchema.parse(request.query);

        try {
            const slots = scheduleOptimizer.getOptimalSlots(platform, audience);
            return reply.send({ success: true, data: slots });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to get schedule optimization' });
        }
    });
}
