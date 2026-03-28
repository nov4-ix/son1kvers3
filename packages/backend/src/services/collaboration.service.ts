import { Server as SocketIOServer } from 'socket.io';
import Redis from 'ioredis';
import { createClient } from '@supabase/supabase-js';

// Types
export interface CollabUser {
    id: string;
    name: string;
    avatar?: string;
    color: string;
    joinedAt: number;
}

export interface CursorPosition {
    x: number;
    y: number;
    timestamp: number;
}

export interface StateChange {
    userId: string;
    path: string;
    value: any;
    timestamp: number;
}

export interface Room {
    id: string;
    name: string;
    users: Map<string, CollabUser>;
    cursors: Map<string, CursorPosition>;
    state: Record<string, any>;
    lastUpdate: number;
}

export class CollaborationService {
    private rooms: Map<string, Room> = new Map();
    private redis: Redis;
    private supabase: ReturnType<typeof createClient>;

    constructor(
        private io: SocketIOServer,
        redisUrl: string,
        supabaseUrl: string,
        supabaseKey: string
    ) {
        this.redis = new Redis(redisUrl);
        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.setupSocketHandlers();
        this.setupRedisSubscriptions();
    }

    private setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`[Collab] User connected: ${socket.id}`);

            // Join room (PREMIUM tier required)
            socket.on('room:join', async (data: { roomId: string; user: CollabUser }) => {
                const { roomId, user } = data;

                // Verify user tier
                const socketUser = (socket as any).user;
                if (!socketUser || socketUser.tier === 'FREE') {
                    socket.emit('error', {
                        code: 'TIER_RESTRICTED',
                        message: 'Collaboration features require PREMIUM tier',
                        upgradeUrl: '/pricing'
                    });
                    return;
                }

                // Get or create room
                let room = this.rooms.get(roomId);
                if (!room) {
                    room = await this.createRoom(roomId);
                }

                // Add user to room
                room.users.set(socket.id, { ...user, joinedAt: Date.now() });
                socket.join(roomId);

                // Broadcast to Redis for multi-instance sync
                await this.redis.publish(
                    `room:${roomId}:join`,
                    JSON.stringify({ socketId: socket.id, user })
                );

                // Send current room state to new user
                socket.emit('room:state', {
                    users: Array.from(room.users.values()),
                    state: room.state,
                    cursors: Object.fromEntries(room.cursors)
                });

                // Notify others
                socket.to(roomId).emit('user:joined', { user, socketId: socket.id });

                console.log(`[Collab] User ${user.name} joined room ${roomId}`);
            });

            // Leave room
            socket.on('room:leave', async (roomId: string) => {
                await this.handleUserLeave(socket.id, roomId);
            });

            // Cursor move
            socket.on('cursor:move', async (data: { roomId: string; position: CursorPosition }) => {
                const { roomId, position } = data;
                const room = this.rooms.get(roomId);

                if (room) {
                    room.cursors.set(socket.id, { ...position, timestamp: Date.now() });

                    // Broadcast cursor position (throttled by client)
                    socket.to(roomId).emit('cursor:update', {
                        userId: socket.id,
                        position
                    });
                }
            });

            // State update
            socket.on('state:update', async (data: { roomId: string; changes: StateChange[] }) => {
                const { roomId, changes } = data;
                const room = this.rooms.get(roomId);

                if (room) {
                    // Apply changes with conflict resolution (last-writer-wins)
                    changes.forEach(change => {
                        this.applyStateChange(room, change);
                    });

                    room.lastUpdate = Date.now();

                    // Persist to Redis
                    await this.redis.setex(
                        `room:${roomId}:state`,
                        3600, // 1 hour TTL
                        JSON.stringify(room.state)
                    );

                    // Broadcast to room
                    socket.to(roomId).emit('state:changed', { changes, userId: socket.id });

                    console.log(`[Collab] State updated in room ${roomId} by ${socket.id}`);
                }
            });

            // Disconnect
            socket.on('disconnect', async () => {
                // Find all rooms user was in
                const roomIds = Array.from(socket.rooms).filter(r => r !== socket.id);

                for (const roomId of roomIds) {
                    await this.handleUserLeave(socket.id, roomId);
                }

                console.log(`[Collab] User disconnected: ${socket.id}`);
            });
        });
    }

    private setupRedisSubscriptions() {
        const subscriber = this.redis.duplicate();

        // Subscribe to room join events from other instances
        subscriber.psubscribe('room:*:join', (err, count) => {
            if (err) console.error('Redis subscribe error:', err);
            console.log(`[Collab] Subscribed to ${count} patterns`);
        });

        subscriber.on('pmessage', (pattern, channel, message) => {
            const data = JSON.parse(message);
            const roomId = channel.split(':')[1];

            // Sync room state from other instances
            const room = this.rooms.get(roomId);
            if (room && !room.users.has(data.socketId)) {
                room.users.set(data.socketId, data.user);
            }
        });
    }

    private async createRoom(roomId: string): Promise<Room> {
        // Try to restore from Redis
        const cachedState = await this.redis.get(`room:${roomId}:state`);

        const room: Room = {
            id: roomId,
            name: `Room ${roomId}`,
            users: new Map(),
            cursors: new Map(),
            state: cachedState ? JSON.parse(cachedState) : {},
            lastUpdate: Date.now()
        };

        this.rooms.set(roomId, room);
        return room;
    }

    private async handleUserLeave(socketId: string, roomId: string) {
        const room = this.rooms.get(roomId);

        if (room) {
            const user = room.users.get(socketId);
            room.users.delete(socketId);
            room.cursors.delete(socketId);

            // Publish to Redis
            await this.redis.publish(
                `room:${roomId}:leave`,
                JSON.stringify({ socketId })
            );

            // Notify others
            this.io.to(roomId).emit('user:left', { userId: socketId, user });

            // Cleanup empty rooms
            if (room.users.size === 0) {
                this.rooms.delete(roomId);
                await this.redis.del(`room:${roomId}:state`);
                console.log(`[Collab] Room ${roomId} deleted (empty)`);
            }
        }
    }

    private applyStateChange(room: Room, change: StateChange) {
        // Simple dot-notation path resolver
        const parts = change.path.split('.');
        let target: any = room.state;

        for (let i = 0; i < parts.length - 1; i++) {
            if (!target[parts[i]]) {
                target[parts[i]] = {};
            }
            target = target[parts[i]];
        }

        target[parts[parts.length - 1]] = change.value;
    }

    // Public API
    async getRoomInfo(roomId: string) {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        return {
            id: room.id,
            name: room.name,
            userCount: room.users.size,
            users: Array.from(room.users.values()),
            lastUpdate: room.lastUpdate
        };
    }

    async listRooms() {
        return Array.from(this.rooms.values()).map(room => ({
            id: room.id,
            name: room.name,
            userCount: room.users.size,
            lastUpdate: room.lastUpdate
        }));
    }
}
