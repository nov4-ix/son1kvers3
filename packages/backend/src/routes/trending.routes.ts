import { FastifyInstance } from 'fastify';
import { trendingService } from '../services/trending.service';

export async function trendingRoutes(fastify: FastifyInstance) {
    // Get current trends for a platform
    fastify.get('/api/trending/:platform', async (request, reply) => {
        const { platform } = request.params as { platform: string };

        try {
            const trends = await trendingService.getTrends(platform);

            return reply.send({
                success: true,
                platform,
                trends: trends.slice(0, 20), // Top 20
                lastUpdate: Date.now()
            });
        } catch (error: any) {
            return reply.status(500).send({
                error: 'Failed to fetch trends',
                message: error.message
            });
        }
    });

    // Find relevant trends for a topic
    fastify.post('/api/trending/relevant', async (request, reply) => {
        const { topic, platform, maxResults } = request.body as {
            topic: string;
            platform: string;
            maxResults?: number;
        };

        try {
            const relevantTrends = await trendingService.findRelevantTrends(
                topic,
                platform,
                maxResults || 5
            );

            return reply.send({
                success: true,
                topic,
                platform,
                suggestions: relevantTrends
            });
        } catch (error: any) {
            return reply.status(500).send({
                error: 'Failed to find relevant trends',
                message: error.message
            });
        }
    });
}
