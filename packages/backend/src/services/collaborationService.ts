/**
 * Collaboration Service
 * Handles real-time collaboration features
 */

import { PrismaClient } from '@prisma/client';


export interface CollaborationRoom {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  ownerId: string;
  members: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface JoinRoomResult {
  success: boolean;
  room?: CollaborationRoom;
  message?: string;
}

export class CollaborationService {
  constructor(
    private prisma: PrismaClient
  ) {}

  /**
   * Create a new collaboration room
   */
  async createRoom(data: {
    name: string;
    description: string;
    isPublic: boolean;
    ownerId: string;
  }): Promise<CollaborationRoom> {
    const room = await this.prisma.collaborationRoom.create({
      data: {
        name: data.name,
        description: data.description,
        isPublic: data.isPublic,
        ownerId: data.ownerId,
        members: JSON.stringify([data.ownerId]) // Convert array to JSON string
      }
    });

    // Parse members from JSON string
    const members = room.members ? JSON.parse(room.members) : [];

    return {
      id: room.id,
      name: room.name,
      description: room.description,
      isPublic: room.isPublic,
      ownerId: room.ownerId,
      members,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt
    };
  }

  /**
   * Join a collaboration room
   */
  async joinRoom(roomId: string, userId: string): Promise<JoinRoomResult> {
    try {
      const room = await this.prisma.collaborationRoom.findUnique({
        where: { id: roomId }
      });

      if (!room) {
        return {
          success: false,
          message: 'Room not found'
        };
      }

      // Parse members from JSON string
      const members: string[] = room.members ? JSON.parse(room.members) : [];

      if (!room.isPublic && room.ownerId !== userId && !members.includes(userId)) {
        return {
          success: false,
          message: 'Room is private and you are not invited'
        };
      }

      // Add user to members if not already a member
      if (!members.includes(userId)) {
        members.push(userId);
        await this.prisma.collaborationRoom.update({
          where: { id: roomId },
          data: {
            members: JSON.stringify(members) // Convert array to JSON string
          }
        });
      }

      return {
        success: true,
        room: {
          id: room.id,
          name: room.name,
          description: room.description,
          isPublic: room.isPublic,
          ownerId: room.ownerId,
          members,
          createdAt: room.createdAt,
          updatedAt: room.updatedAt
        }
      };

    } catch (error) {
      console.error('Join room error:', error);
      return {
        success: false,
        message: 'Failed to join room'
      };
    }
  }

  /**
   * Leave a collaboration room
   */
  async leaveRoom(roomId: string, userId: string): Promise<boolean> {
    try {
      const room = await this.prisma.collaborationRoom.findUnique({
        where: { id: roomId }
      });

      if (!room) {
        return false;
      }

      // Parse members from JSON string
      const members: string[] = room.members ? JSON.parse(room.members) : [];

      // Remove user from members
      const updatedMembers = members.filter(memberId => memberId !== userId);

      await this.prisma.collaborationRoom.update({
        where: { id: roomId },
        data: {
          members: JSON.stringify(updatedMembers) // Convert array to JSON string
        }
      });

      return true;

    } catch (error) {
      console.error('Leave room error:', error);
      return false;
    }
  }

  /**
   * Get room details
   */
  async getRoom(roomId: string, userId: string): Promise<CollaborationRoom | null> {
    try {
      const room = await this.prisma.collaborationRoom.findUnique({
        where: { id: roomId }
      });

      if (!room) {
        return null;
      }

      // Parse members from JSON string
      const members: string[] = room.members ? JSON.parse(room.members) : [];

      // Check if user has access
      if (!room.isPublic && room.ownerId !== userId && !members.includes(userId)) {
        return null;
      }

      return {
        id: room.id,
        name: room.name,
        description: room.description,
        isPublic: room.isPublic,
        ownerId: room.ownerId,
        members,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt
      };

    } catch (error) {
      console.error('Get room error:', error);
      return null;
    }
  }

  /**
   * Get user's rooms
   */
  async getUserRooms(userId: string, options: { page: number; limit: number }) {
    try {
      const skip = (options.page - 1) * options.limit;

      // Get all rooms and filter by userId in members (since members is a JSON string)
      const allRooms = await this.prisma.collaborationRoom.findMany({
        skip,
        take: options.limit * 2, // Get more to filter
        orderBy: { updatedAt: 'desc' }
      });

      // Filter rooms where user is owner or member
      const filteredRooms = allRooms.filter(room => {
        if (room.ownerId === userId) return true;
        try {
          const members: string[] = room.members ? JSON.parse(room.members) : [];
          return members.includes(userId);
        } catch {
          return false;
        }
      }).slice(0, options.limit);

      const total = await this.prisma.collaborationRoom.count({
        where: {
          OR: [
            { ownerId: userId }
          ]
        }
      });

      return {
        rooms: filteredRooms.map(room => {
          const members: string[] = room.members ? JSON.parse(room.members) : [];
          return {
            id: room.id,
            name: room.name,
            description: room.description,
            isPublic: room.isPublic,
            ownerId: room.ownerId,
            members,
            createdAt: room.createdAt,
            updatedAt: room.updatedAt
          };
        }),
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          pages: Math.ceil(total / options.limit)
        }
      };

    } catch (error) {
      console.error('Get user rooms error:', error);
      throw error;
    }
  }

  /**
   * Update room settings
   */
  async updateRoom(
    roomId: string, 
    userId: string, 
    updates: {
      name?: string;
      description?: string;
      isPublic?: boolean;
    }
  ): Promise<CollaborationRoom | null> {
    try {
      const room = await this.prisma.collaborationRoom.findUnique({
        where: { id: roomId }
      });

      if (!room || room.ownerId !== userId) {
        return null;
      }

      const updatedRoom = await this.prisma.collaborationRoom.update({
        where: { id: roomId },
        data: {
          name: updates.name || room.name,
          description: updates.description || room.description,
          isPublic: updates.isPublic !== undefined ? updates.isPublic : room.isPublic,
          updatedAt: new Date()
        }
      });

      // Parse members from JSON string
      const members: string[] = updatedRoom.members ? JSON.parse(updatedRoom.members) : [];

      return {
        id: updatedRoom.id,
        name: updatedRoom.name,
        description: updatedRoom.description,
        isPublic: updatedRoom.isPublic,
        ownerId: updatedRoom.ownerId,
        members,
        createdAt: updatedRoom.createdAt,
        updatedAt: updatedRoom.updatedAt
      };

    } catch (error) {
      console.error('Update room error:', error);
      return null;
    }
  }

  /**
   * Delete room
   */
  async deleteRoom(roomId: string, userId: string): Promise<boolean> {
    try {
      const room = await this.prisma.collaborationRoom.findUnique({
        where: { id: roomId }
      });

      if (!room || room.ownerId !== userId) {
        return false;
      }

      await this.prisma.collaborationRoom.delete({
        where: { id: roomId }
      });

      return true;

    } catch (error) {
      console.error('Delete room error:', error);
      return false;
    }
  }

  /**
   * Get public rooms
   */
  async getPublicRooms(options: { page: number; limit: number; search?: string }) {
    try {
      const skip = (options.page - 1) * options.limit;
      const where: any = { isPublic: true };

      if (options.search) {
        where.OR = [
          { name: { contains: options.search } },
          { description: { contains: options.search } }
        ];
      }

      const [rooms, total] = await Promise.all([
        this.prisma.collaborationRoom.findMany({
          where,
          skip,
          take: options.limit,
          orderBy: { createdAt: 'desc' },
          include: {
            owner: {
              select: {
                id: true,
                username: true,
                tier: true
              }
            }
          }
        }),
        this.prisma.collaborationRoom.count({ where })
      ]);

      return {
        rooms: rooms.map(room => {
          // Parse members from JSON string
          const members: string[] = room.members ? JSON.parse(room.members) : [];
          return {
            id: room.id,
            name: room.name,
            description: room.description,
            isPublic: room.isPublic,
            ownerId: room.ownerId,
            owner: room.owner,
            memberCount: members.length,
            createdAt: room.createdAt,
            updatedAt: room.updatedAt
          };
        }),
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          pages: Math.ceil(total / options.limit)
        }
      };

    } catch (error) {
      console.error('Get public rooms error:', error);
      throw error;
    }
  }

  /**
   * Health check for collaboration service
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Collaboration service health check failed:', error);
      return false;
    }
  }

  /**
   * Close service and cleanup
   */
  async close() {
    await this.prisma.$disconnect();
  }
}
