import { FastifyInstance } from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import Redis from 'ioredis';

interface GenerationProgress {
    generationId: string;
    status: 'queued' | 'processing' | 'ready' | 'complete' | 'failed';
    progress: number; // 0-100
    audioUrl?: string;
    previewUrl?: string;
    error?: string;
}

export async function generationWebSocketRoutes(
    fastify: FastifyInstance,
    redis: Redis
) {
    await fastify.register(fastifyWebsocket);

    fastify.route({
        method: 'GET',
        url: '/ws/generation/:generationId',
        handler: (request, reply) => {
            // HTTP handler (non-websocket)
            reply.send({ error: 'Use WebSocket connection' });
        },
        wsHandler: async (connection, request) => {
            const { generationId } = request.params as { generationId: string };
            const { socket } = connection;

            console.log(`[WS] Client connected to generation ${generationId}`);

            // Subscribe to Redis updates for this generation
            const subscriber = redis.duplicate();
            await subscriber.subscribe(`generation:${generationId}:progress`);

            subscriber.on('message', (channel, message) => {
                const progress: GenerationProgress = JSON.parse(message);
                socket.send(JSON.stringify({
                    type: 'generation:progress',
                    data: progress
                }));

                // Auto-close when complete or failed
                if (progress.status === 'complete' || progress.status === 'failed') {
                    setTimeout(() => socket.close(), 2000);
                }
            });

            // Send initial status
            const cachedProgress = await redis.get(`generation:${generationId}:status`);
            if (cachedProgress) {
                socket.send(JSON.stringify({
                    type: 'generation:progress',
                    data: JSON.parse(cachedProgress)
                }));
            } else {
                socket.send(JSON.stringify({
                    type: 'generation:progress',
                    data: {
                        generationId,
                        status: 'queued',
                        progress: 0
                    }
                }));
            }

            // Heartbeat
            const pingInterval = setInterval(() => {
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: 'ping' }));
                }
            }, 30000);

            socket.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'pong') {
                        // Acknowledge pong
                    }
                } catch (err) {
                    console.error('[WS] Invalid message:', err);
                }
            });

            socket.on('close', async () => {
                clearInterval(pingInterval);
                await subscriber.quit();
                console.log(`[WS] Client disconnected from generation ${generationId}`);
            });

            socket.on('error', (err) => {
                console.error('[WS] Socket error:', err);
            });
        }
    });
}

// Helper function to publish progress updates (called from generation service)
export async function publishGenerationProgress(
    redis: Redis,
    generationId: string,
    progress: GenerationProgress
) {
    // Publish to channel
    await redis.publish(
        `generation:${generationId}:progress`,
        JSON.stringify(progress)
    );

    // Cache latest status
    await redis.setex(
        `generation:${generationId}:status`,
        3600, // 1 hour
        JSON.stringify(progress)
    );
}
