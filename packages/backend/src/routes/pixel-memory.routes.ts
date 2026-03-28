import { FastifyInstance } from 'fastify';
import { authenticateRequest } from '../middleware/auth.middleware';
import { pixelMemoryService } from '../services/pixel-memory.service';
import { z } from 'zod';

const saveConversationSchema = z.object({
    messages: z.array(z.object({
        id: z.string(),
        role: z.enum(['user', 'assistant']),
        content: z.string(),
        timestamp: z.string()
    })),
    context: z.object({
        app: z.string().optional(),
        mood: z.string().optional()
    }).optional()
});

const saveMemorySchema = z.object({
    type: z.enum(['note', 'preference', 'learning', 'achievement']),
    content: z.string().min(1),
    metadata: z.record(z.string(), z.any()).optional()
});

const updateProfileSchema = z.object({
    preferences: z.object({
        defaultMood: z.enum(['calmo', 'agradecido', 'enfoque']).optional(),
        favoriteApp: z.string().optional(),
        codeStyle: z.enum(['verbose', 'concise']).optional(),
        helpLevel: z.enum(['beginner', 'intermediate', 'expert']).optional()
    }).optional(),
    learnings: z.object({
        topics: z.array(z.string()).optional(),
        skills: z.array(z.string()).optional(),
        patterns: z.record(z.string(), z.any()).optional()
    }).optional()
});

export async function pixelMemoryRoutes(fastify: FastifyInstance) {
    // Save conversation
    fastify.post('/api/pixel/conversations', {
        preHandler: [authenticateRequest]
    }, async (request, reply) => {
        const user = (request as any).user;
        const body = saveConversationSchema.parse(request.body);

        const messages = body.messages.map(m => ({
            ...m,
            timestamp: new Date(m.timestamp).getTime()
        }));

        const success = await pixelMemoryService.saveConversation(
            user.userId,
            messages,
            body.context
        );

        if (!success) {
            return reply.status(500).send({ error: 'Failed to save conversation' });
        }

        return reply.send({ success: true });
    });

    // Load conversations
    fastify.get('/api/pixel/conversations', {
        preHandler: [authenticateRequest]
    }, async (request, reply) => {
        const user = (request as any).user;
        const { limit } = request.query as { limit?: string };

        const conversations = await pixelMemoryService.loadConversations(
            user.userId,
            limit ? parseInt(limit) : 50
        );

        return reply.send({ conversations });
    });

    // Get user profile
    fastify.get('/api/pixel/profile', {
        preHandler: [authenticateRequest]
    }, async (request, reply) => {
        const user = (request as any).user;
        const profile = await pixelMemoryService.getUserProfile(user.userId);

        if (!profile) {
            return reply.status(404).send({ error: 'Profile not found' });
        }

        return reply.send({ profile });
    });

    // Update user profile
    fastify.patch('/api/pixel/profile', {
        preHandler: [authenticateRequest]
    }, async (request, reply) => {
        const user = (request as any).user;
        const updates = updateProfileSchema.parse(request.body);

        const success = await pixelMemoryService.updateUserProfile(
            user.userId,
            updates as any
        );

        if (!success) {
            return reply.status(500).send({ error: 'Failed to update profile' });
        }

        return reply.send({ success: true });
    });

    // Save memory note
    fastify.post('/api/pixel/memories', {
        preHandler: [authenticateRequest]
    }, async (request, reply) => {
        const user = (request as any).user;
        const body = saveMemorySchema.parse(request.body);

        const memoryId = await pixelMemoryService.saveMemory({
            userId: user.userId,
            ...body
        });

        if (!memoryId) {
            return reply.status(500).send({ error: 'Failed to save memory' });
        }

        return reply.send({ success: true, memoryId });
    });

    // Search memories
    fastify.get('/api/pixel/memories/search', {
        preHandler: [authenticateRequest]
    }, async (request, reply) => {
        const user = (request as any).user;
        const { q, type } = request.query as { q: string; type?: string };

        if (!q) {
            return reply.status(400).send({ error: 'Query parameter required' });
        }

        const memories = await pixelMemoryService.searchMemories(
            user.userId,
            q,
            type as any
        );

        return reply.send({ memories });
    });

    // Get recent memories
    fastify.get('/api/pixel/memories', {
        preHandler: [authenticateRequest]
    }, async (request, reply) => {
        const user = (request as any).user;
        const { limit } = request.query as { limit?: string };

        const memories = await pixelMemoryService.getRecentMemories(
            user.userId,
            limit ? parseInt(limit) : 10
        );

        return reply.send({ memories });
    });

    // Add learning
    fastify.post('/api/pixel/learn', {
        preHandler: [authenticateRequest]
    }, async (request, reply) => {
        const user = (request as any).user;
        const { type, value } = request.body as { type: 'topic' | 'skill'; value: string };

        if (!type || !value) {
            return reply.status(400).send({ error: 'Type and value required' });
        }

        const success = await pixelMemoryService.addLearning(
            user.userId,
            type,
            value
        );

        if (!success) {
            return reply.status(500).send({ error: 'Failed to add learning' });
        }

        return reply.send({ success: true });
    });
}
