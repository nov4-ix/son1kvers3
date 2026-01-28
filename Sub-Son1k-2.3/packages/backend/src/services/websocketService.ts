/**
 * WebSocket Service
 * Handles real-time communication for collaboration features
 */

import { Server as SocketIOServer } from 'socket.io';
import { CollaborationService } from './collaborationService';
import { AnalyticsService } from './analyticsService';

export interface SocketUser {
  id: string;
  username: string;
  tier: string;
  roomId?: string;
}

export interface CollaborationEvent {
  type: 'join' | 'leave' | 'message' | 'generation' | 'update';
  data: any;
  timestamp: Date;
  userId: string;
}

export function setupWebSocket(
  io: SocketIOServer,
  collaborationService: CollaborationService,
  analyticsService: AnalyticsService
) {
  // Store connected users
  const connectedUsers = new Map<string, SocketUser>();
  const userSockets = new Map<string, string>(); // userId -> socketId

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle user authentication
    socket.on('authenticate', async (data: { userId: string; username: string; tier: string }) => {
      try {
        const user: SocketUser = {
          id: data.userId,
          username: data.username,
          tier: data.tier
        };

        connectedUsers.set(socket.id, user);
        userSockets.set(data.userId, socket.id);

        // Join user to their personal room
        socket.join(`user:${data.userId}`);

        // Track connection event
        await analyticsService.trackEvent({
          userId: data.userId,
          eventType: 'websocket_connected',
          properties: { socketId: socket.id },
          timestamp: new Date()
        });

        socket.emit('authenticated', { success: true });
        console.log(`User authenticated: ${data.username} (${data.userId})`);

      } catch (error) {
        console.error('Authentication error:', error);
        socket.emit('error', { message: 'Authentication failed' });
      }
    });

    // Handle joining collaboration room
    socket.on('join_room', async (data: { roomId: string }) => {
      try {
        const user = connectedUsers.get(socket.id);
        if (!user) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        const result = await collaborationService.joinRoom(data.roomId, user.id);
        
        if (result.success && result.room) {
          socket.join(`room:${data.roomId}`);
          user.roomId = data.roomId;

          // Notify other users in the room
          socket.to(`room:${data.roomId}`).emit('user_joined', {
            user: {
              id: user.id,
              username: user.username,
              tier: user.tier
            },
            timestamp: new Date()
          });

          // Send room info to the user
          socket.emit('room_joined', {
            room: result.room,
            timestamp: new Date()
          });

          // Track room join event
          await analyticsService.trackEvent({
            userId: user.id,
            eventType: 'room_joined',
            properties: { roomId: data.roomId },
            timestamp: new Date()
          });

        } else {
          socket.emit('error', { message: result.message || 'Failed to join room' });
        }

      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Handle leaving collaboration room
    socket.on('leave_room', async (data: { roomId: string }) => {
      try {
        const user = connectedUsers.get(socket.id);
        if (!user) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        await collaborationService.leaveRoom(data.roomId, user.id);
        
        socket.leave(`room:${data.roomId}`);
        user.roomId = undefined;

        // Notify other users in the room
        socket.to(`room:${data.roomId}`).emit('user_left', {
          user: {
            id: user.id,
            username: user.username
          },
          timestamp: new Date()
        });

        socket.emit('room_left', {
          roomId: data.roomId,
          timestamp: new Date()
        });

        // Track room leave event
        await analyticsService.trackEvent({
          userId: user.id,
          eventType: 'room_left',
          properties: { roomId: data.roomId },
          timestamp: new Date()
        });

      } catch (error) {
        console.error('Leave room error:', error);
        socket.emit('error', { message: 'Failed to leave room' });
      }
    });

    // Handle collaboration messages
    socket.on('collaboration_message', async (data: { roomId: string; message: string; type: string }) => {
      try {
        const user = connectedUsers.get(socket.id);
        if (!user) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        if (!user.roomId || user.roomId !== data.roomId) {
          socket.emit('error', { message: 'Not in this room' });
          return;
        }

        const messageData = {
          id: generateMessageId(),
          userId: user.id,
          username: user.username,
          roomId: data.roomId,
          message: data.message,
          type: data.type || 'text',
          timestamp: new Date()
        };

        // Broadcast to all users in the room
        io.to(`room:${data.roomId}`).emit('collaboration_message', messageData);

        // Track message event
        await analyticsService.trackEvent({
          userId: user.id,
          eventType: 'collaboration_message',
          properties: { 
            roomId: data.roomId, 
            messageType: data.type,
            messageLength: data.message.length
          },
          timestamp: new Date()
        });

      } catch (error) {
        console.error('Collaboration message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle generation updates
    socket.on('generation_update', async (data: { generationId: string; status: string; progress?: number }) => {
      try {
        const user = connectedUsers.get(socket.id);
        if (!user) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        const updateData = {
          generationId: data.generationId,
          status: data.status,
          progress: data.progress,
          timestamp: new Date()
        };

        // Send to user's personal room
        socket.emit('generation_update', updateData);

        // If user is in a collaboration room, broadcast to room
        if (user.roomId) {
          socket.to(`room:${user.roomId}`).emit('user_generation_update', {
            user: {
              id: user.id,
              username: user.username
            },
            ...updateData
          });
        }

        // Track generation update event
        await analyticsService.trackEvent({
          userId: user.id,
          eventType: 'generation_update',
          properties: { 
            generationId: data.generationId,
            status: data.status,
            progress: data.progress
          },
          timestamp: new Date()
        });

      } catch (error) {
        console.error('Generation update error:', error);
        socket.emit('error', { message: 'Failed to update generation' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data: { roomId: string }) => {
      const user = connectedUsers.get(socket.id);
      if (user && user.roomId === data.roomId) {
        socket.to(`room:${data.roomId}`).emit('user_typing', {
          userId: user.id,
          username: user.username,
          isTyping: true
        });
      }
    });

    socket.on('typing_stop', (data: { roomId: string }) => {
      const user = connectedUsers.get(socket.id);
      if (user && user.roomId === data.roomId) {
        socket.to(`room:${data.roomId}`).emit('user_typing', {
          userId: user.id,
          username: user.username,
          isTyping: false
        });
      }
    });

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        const user = connectedUsers.get(socket.id);
        
        if (user) {
          // Leave collaboration room if in one
          if (user.roomId) {
            await collaborationService.leaveRoom(user.roomId, user.id);
            
            // Notify other users in the room
            socket.to(`room:${user.roomId}`).emit('user_left', {
              user: {
                id: user.id,
                username: user.username
              },
              timestamp: new Date()
            });
          }

          // Track disconnection event
          await analyticsService.trackEvent({
            userId: user.id,
            eventType: 'websocket_disconnected',
            properties: { socketId: socket.id },
            timestamp: new Date()
          });

          // Clean up user data
          connectedUsers.delete(socket.id);
          userSockets.delete(user.id);

          console.log(`User disconnected: ${user.username} (${user.id})`);
        }

      } catch (error) {
        console.error('Disconnect error:', error);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Broadcast system-wide notifications
  function broadcastNotification(message: string, type: string = 'info') {
    io.emit('system_notification', {
      message,
      type,
      timestamp: new Date()
    });
  }

  // Send notification to specific user
  function sendUserNotification(userId: string, message: string, type: string = 'info') {
    const socketId = userSockets.get(userId);
    if (socketId) {
      io.to(socketId).emit('notification', {
        message,
        type,
        timestamp: new Date()
      });
    }
  }

  // Send notification to room
  function sendRoomNotification(roomId: string, message: string, type: string = 'info') {
    io.to(`room:${roomId}`).emit('room_notification', {
      message,
      type,
      timestamp: new Date()
    });
  }

  // Get connected users count
  function getConnectedUsersCount(): number {
    return connectedUsers.size;
  }

  // Get users in room
  function getRoomUsers(roomId: string): SocketUser[] {
    const room = io.sockets.adapter.rooms.get(`room:${roomId}`);
    if (!room) return [];

    return Array.from(room).map(socketId => connectedUsers.get(socketId)).filter(Boolean) as SocketUser[];
  }

  // Export utility functions
  return {
    broadcastNotification,
    sendUserNotification,
    sendRoomNotification,
    getConnectedUsersCount,
    getRoomUsers
  };
}

/**
 * Generate unique message ID
 */
function generateMessageId(): string {
  return 'msg_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}
