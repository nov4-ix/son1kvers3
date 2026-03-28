import { FastifyInstance } from 'fastify';
import { CollaborationService } from '../services/collaboration.service';
import { authenticateRequest, requireTier } from '../middleware/auth.middleware';
import { UserTier } from '../constants/tiers';

export async function collaborationRoutes(
    fastify: FastifyInstance,
    collabService: CollaborationService
) {
    // Create new room (PREMIUM required)
    fastify.post('/api/rooms', {
        preHandler: [authenticateRequest, requireTier(UserTier.VANGUARD)]
    }, async (request, reply) => {
        const { name } = request.body as { name?: string };
        const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        return reply.send({ roomId, name: name || `Room ${roomId}` });
    });

    // Get room info (PREMIUM required)
    fastify.get('/api/rooms/:roomId', {
        preHandler: [authenticateRequest, requireTier(UserTier.VANGUARD)]
    }, async (request, reply) => {
        const { roomId } = request.params as { roomId: string };
        const roomInfo = await collabService.getRoomInfo(roomId);

        if (!roomInfo) {
            return reply.status(404).send({ error: 'Room not found' });
        }

        return reply.send(roomInfo);
    });

    // List active rooms (PREMIUM required)
    fastify.get('/api/rooms', {
        preHandler: [authenticateRequest, requireTier(UserTier.VANGUARD)]
    }, async (request, reply) => {
        const rooms = await collabService.listRooms();
        return reply.send({ rooms });
    });

    // Join room (PREMIUM required)
    fastify.post('/api/rooms/:roomId/join', {
        preHandler: [authenticateRequest, requireTier(UserTier.VANGUARD)]
    }, async (request, reply) => {
        const { roomId } = request.params as { roomId: string };
        const { userId, name } = request.body as { userId: string; name: string };

        return reply.send({
            ok: true,
            roomId,
            message: 'Connect to Socket.io with roomId to join'
        });
    });
}
