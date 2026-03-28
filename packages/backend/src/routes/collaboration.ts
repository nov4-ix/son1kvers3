/**
 * Collaboration Routes
 * Handles real-time collaboration features with WebSocket support
 */

import { FastifyInstance } from 'fastify';
import { CollaborationService } from '../services/collaborationService';
import { authMiddleware } from '../middleware/auth';

export function collaborationRoutes(collaborationService: CollaborationService) {
  return async function(fastify: FastifyInstance) {
    // Create collaboration room
    fastify.post('/rooms', {
      preHandler: [authMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;
      const { name, description, isPublic } = request.body as any;

      try {
        const room = await collaborationService.createRoom({
          name: name || 'Untitled Room',
          description: description || '',
          isPublic: isPublic || false,
          ownerId: user.id
        });

        return {
          success: true,
          data: room
        };

      } catch (error) {
        console.error('Room creation error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'ROOM_CREATION_FAILED',
            message: 'Failed to create collaboration room'
          }
        });
      }
    });

    // Join collaboration room
    fastify.post('/rooms/:roomId/join', {
      preHandler: [authMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;
      const { roomId } = request.params as any;

      try {
        const result = await collaborationService.joinRoom(roomId, user.id);

        if (!result.success) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'JOIN_FAILED',
              message: result.message
            }
          });
        }

        return {
          success: true,
          data: result.room
        };

      } catch (error) {
        console.error('Join room error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'JOIN_ROOM_FAILED',
            message: 'Failed to join collaboration room'
          }
        });
      }
    });

    // Leave collaboration room
    fastify.post('/rooms/:roomId/leave', {
      preHandler: [authMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;
      const { roomId } = request.params as any;

      try {
        await collaborationService.leaveRoom(roomId, user.id);

        return {
          success: true,
          data: {
            message: 'Left room successfully'
          }
        };

      } catch (error) {
        console.error('Leave room error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'LEAVE_ROOM_FAILED',
            message: 'Failed to leave collaboration room'
          }
        });
      }
    });

    // Get room details
    fastify.get('/rooms/:roomId', {
      preHandler: [authMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;
      const { roomId } = request.params as any;

      try {
        const room = await collaborationService.getRoom(roomId, user.id);

        if (!room) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'ROOM_NOT_FOUND',
              message: 'Room not found'
            }
          });
        }

        return {
          success: true,
          data: room
        };

      } catch (error) {
        console.error('Get room error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'GET_ROOM_FAILED',
            message: 'Failed to get room details'
          }
        });
      }
    });

    // Get user's rooms
    fastify.get('/rooms', {
      preHandler: [authMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;
      const { page = 1, limit = 20 } = request.query as any;

      try {
        const rooms = await collaborationService.getUserRooms(user.id, {
          page: parseInt(page),
          limit: parseInt(limit)
        });

        return {
          success: true,
          data: rooms
        };

      } catch (error) {
        console.error('Get rooms error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'GET_ROOMS_FAILED',
            message: 'Failed to get user rooms'
          }
        });
      }
    });

    // Update room settings
    fastify.put('/rooms/:roomId', {
      preHandler: [authMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;
      const { roomId } = request.params as any;
      const { name, description, isPublic } = request.body as any;

      try {
        const room = await collaborationService.updateRoom(roomId, user.id, {
          name,
          description,
          isPublic
        });

        if (!room) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'ROOM_NOT_FOUND',
              message: 'Room not found'
            }
          });
        }

        return {
          success: true,
          data: room
        };

      } catch (error) {
        console.error('Update room error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'UPDATE_ROOM_FAILED',
            message: 'Failed to update room'
          }
        });
      }
    });

    // Delete room
    fastify.delete('/rooms/:roomId', {
      preHandler: [authMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;
      const { roomId } = request.params as any;

      try {
        const success = await collaborationService.deleteRoom(roomId, user.id);

        if (!success) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'ROOM_NOT_FOUND',
              message: 'Room not found or insufficient permissions'
            }
          });
        }

        return {
          success: true,
          data: {
            message: 'Room deleted successfully'
          }
        };

      } catch (error) {
        console.error('Delete room error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'DELETE_ROOM_FAILED',
            message: 'Failed to delete room'
          }
        });
      }
    });
  };
}
