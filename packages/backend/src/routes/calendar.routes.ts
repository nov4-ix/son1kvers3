import { FastifyInstance } from 'fastify';
import { authenticateRequest } from '../middleware/auth.middleware';
import { postingService } from '../services/posting.service';
import { z } from 'zod';

const schedulePostSchema = z.object({
    content: z.string().min(1),
    platform: z.string(),
    scheduledTime: z.string().datetime(), // ISO string
    metadata: z.any().optional()
});

export async function calendarRoutes(fastify: FastifyInstance) {

    // POST /api/calendar/schedule
    fastify.post('/api/calendar/schedule', {
        preHandler: [authenticateRequest]
    }, async (request, reply) => {
        const user = (request as any).user;
        const body = schedulePostSchema.parse(request.body);

        try {
            const jobId = await postingService.schedulePost({
                userId: user.userId,
                content: body.content,
                platform: body.platform,
                scheduledTime: new Date(body.scheduledTime),
                status: 'scheduled',
                metadata: body.metadata
            });

            return reply.send({ success: true, jobId, status: 'scheduled' });
        } catch (error: any) {
            request.log.error(error);
            return reply.status(400).send({ error: error.message || 'Failed to schedule post' });
        }
    });

    // GET /api/calendar/posts
    fastify.get('/api/calendar/posts', {
        preHandler: [authenticateRequest]
    }, async (request, reply) => {
        const user = (request as any).user;

        // TODO: Fetch from database when implemented
        // For now returning empty or mock
        const posts = await postingService.getScheduledPosts(user.userId);

        return reply.send({ success: true, data: posts });
    });
}
