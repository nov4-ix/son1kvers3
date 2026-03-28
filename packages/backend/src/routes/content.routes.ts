import { FastifyInstance } from 'fastify';
import { authenticateRequest, requireTier } from '../middleware/auth.middleware';
import { UserTier } from '../constants/tiers';
import { novaAI } from '../services/nova-ai.service';
import { ProfileAnalyzer, AlgorithmOptimizer } from '../services/profile-analyzer.service';
import { trendingService } from '../services/trending.service';
import { z } from 'zod';

const generateSchema = z.object({
    topic: z.string().min(1),
    platform: z.enum(['instagram', 'twitter', 'facebook', 'linkedin', 'tiktok', 'youtube']),
    tone: z.string(),
    targetAudience: z.string(),
    callToAction: z.string().optional(),
    hashtags: z.string().optional(),
    language: z.string().optional(),
    variations: z.number().min(1).max(5).optional()
});

const profileAnalyzer = new ProfileAnalyzer();
const algorithmOptimizer = new AlgorithmOptimizer();

export async function contentRoutes(fastify: FastifyInstance) {
    // Generate content with profile analysis (FREE: 5/day, PREMIUM: 50/day)
    fastify.post('/api/content/generate', {
        preHandler: [authenticateRequest]
    }, async (request, reply) => {
        const user = (request as any).user;
        const body = generateSchema.parse(request.body);

        try {
            // 1. Obtener historial de posts del usuario (from DB)
            // TODO: Implementar cuando tengamos persistencia
            const userPosts = []; // await db.getUserPosts(user.userId, { limit: 20 });

            // 2. Analizar perfil del usuario
            const profileAnalysis = await profileAnalyzer.analyzeUserProfile(userPosts);

            // 3. Obtener reglas del algoritmo de la plataforma
            const algorithmRules = algorithmOptimizer.getRules(body.platform);

            // 4. Obtener trending topics relevantes
            const trendingTopics = await trendingService.findRelevantTrends(
                body.topic,
                body.platform,
                3 // Top 3 trends relevantes
            );

            // 5. Generar recomendaciones
            const recommendations = algorithmRules
                ? algorithmOptimizer.generateRecommendations(body.platform, profileAnalysis)
                : [];

            // Añadir sugerencias de trends
            if (trendingTopics.length > 0) {
                recommendations.push(
                    `🔥 Trending: Use ${trendingTopics.map(t => t.hashtag).join(', ')} for extra reach`
                );
            }

            // 6. Generar contenido optimizado (con contexto de trends)
            const result = body.variations
                ? await novaAI.generateVariations(body, body.variations, profileAnalysis, algorithmRules, trendingTopics)
                : await novaAI.generateContent(body, profileAnalysis, algorithmRules, trendingTopics);

            // 7. Validar contra algoritmo
            let validation = { optimized: true, issues: [], suggestions: [] };
            if (!Array.isArray(result) && algorithmRules) {
                validation = algorithmOptimizer.optimizeForAlgorithm(
                    result.content,
                    body.platform
                );
            }

            return reply.send({
                success: true,
                data: result,
                metadata: {
                    profileAnalysis: {
                        contentType: profileAnalysis.contentType,
                        targetAudience: profileAnalysis.targetAudience,
                        predominantTone: profileAnalysis.predominantTone
                    },
                    algorithmInsights: {
                        platform: body.platform,
                        recommendations,
                        validation
                    },
                    trendingTopics: trendingTopics.map(t => ({
                        hashtag: t.hashtag,
                        context: t.context,
                        peakTime: t.peakTime
                    }))
                }
            });

        } catch (error: any) {
            return reply.status(500).send({
                error: 'Content generation failed',
                message: error.message
            });
        }
    });

    // Get algorithm rules for a platform
    fastify.get('/api/algorithm/:platform', async (request, reply) => {
        const { platform } = request.params as { platform: string };
        const rules = algorithmOptimizer.getRules(platform);

        if (!rules) {
            return reply.status(404).send({ error: 'Platform not found' });
        }

        return reply.send({ rules });
    });

    // Analyze user profile (PREMIUM+)
    fastify.post('/api/profile/analyze', {
        preHandler: [authenticateRequest, requireTier(UserTier.VANGUARD)]
    }, async (request, reply) => {
        const user = (request as any).user;

        // TODO: Fetch user's post history from database
        const userPosts = []; // await db.getUserPosts(user.userId);

        const analysis = await profileAnalyzer.analyzeUserProfile(userPosts);

        return reply.send({
            success: true,
            analysis
        });
    });

    // Health check for AI service
    fastify.get('/api/content/health', async (request, reply) => {
        const isHealthy = await novaAI.healthCheck();
        return reply.send({
            status: isHealthy ? 'online' : 'offline',
            service: 'Qwen 2.5 via Ollama',
            features: {
                profileAnalysis: true,
                algorithmOptimization: true,
                platforms: ['instagram', 'twitter', 'facebook', 'linkedin', 'tiktok', 'youtube']
            }
        });
    });
}
