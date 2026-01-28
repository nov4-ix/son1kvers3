import { FastifyInstance } from 'fastify';
import { SunoService } from '../services/suno.service';
import { tokenPool } from '../services/token-pool-manager';
import { env } from '../lib/config';

export async function sunoRoutes(fastify: FastifyInstance) {
    const sunoService = new SunoService();

    /**
     * POST /api/generate
     * Generación simple con prompt
     */
    fastify.post('/generate', async (request, reply) => {
        const { prompt, make_instrumental, wait_audio } = request.body as any;

        if (!prompt) {
            return reply.code(400).send({ error: 'Prompt is required' });
        }

        try {
            const token = await tokenPool.getOptimalToken();

            console.log(`🚀 Starting generation with token ${token.sessionId}`);

            const result = await sunoService.generate({
                gpt_description_prompt: prompt,
                make_instrumental: make_instrumental ?? false,
                wait_audio: wait_audio ?? false
            }, token);

            return reply.send(result);
        } catch (error: any) {
            console.error('Generation failed:', error);
            return reply.status(500).send({
                error: 'Generation failed',
                details: error.message
            });
        }
    });

    /**
     * POST /api/custom_generate
     * Generación personalizada con lyrics y estilo
     */
    fastify.post('/custom_generate', async (request, reply) => {
        const {
            prompt,           // Lyrics
            tags,            // Estilo musical
            title,           // Título de la canción
            make_instrumental,
            continue_clip_id, // Para extender audio
            continue_at      // Timestamp para continuar
        } = request.body as any;

        try {
            const token = await tokenPool.getOptimalToken();

            const result = await sunoService.customGenerate({
                prompt,
                tags,
                title,
                make_instrumental: make_instrumental ?? false,
                continue_clip_id,
                continue_at
            }, token);

            return reply.send(result);
        } catch (error: any) {
            return reply.status(500).send({
                error: 'Custom generation failed',
                details: error.message
            });
        }
    });

    /**
     * GET /api/get
     * Obtener información de clips generados
     */
    fastify.get('/get', async (request, reply) => {
        const { ids } = request.query as any;

        try {
            const token = await tokenPool.getOptimalToken();

            if (ids) {
                // Obtener clips específicos
                const clipIds = ids.split(',');
                const clips = await Promise.all(
                    clipIds.map((id: string) => sunoService.getClip(id, token))
                );
                return reply.send(clips);
            } else {
                // Obtener todos los clips
                const allClips = await sunoService.getAllClips(token);
                return reply.send(allClips);
            }
        } catch (error: any) {
            return reply.status(500).send({
                error: 'Failed to fetch clips',
                details: error.message
            });
        }
    });

    /**
     * GET /api/get_limit
     * Obtener información de créditos
     */
    fastify.get('/get_limit', async (request, reply) => {
        try {
            const token = await tokenPool.getOptimalToken();
            const credits = await sunoService.getCredits(token);

            return reply.send({
                credits_left: credits.remaining,
                period: credits.period,
                monthly_limit: credits.limit,
                monthly_usage: credits.usage
            });
        } catch (error: any) {
            return reply.status(500).send({
                error: 'Failed to fetch credits',
                details: error.message
            });
        }
    });

    /**
     * POST /api/generate_lyrics
     * Generar letras con AI
     */
    fastify.post('/generate_lyrics', async (request, reply) => {
        const { prompt } = request.body as any;

        try {
            const token = await tokenPool.getOptimalToken();
            const lyrics = await sunoService.generateLyrics(prompt, token);

            return reply.send({
                text: lyrics.text,
                title: lyrics.title
            });
        } catch (error: any) {
            return reply.status(500).send({
                error: 'Lyrics generation failed',
                details: error.message
            });
        }
    });

    /**
     * GET /api/pool/status
     * Monitor del estado del pool
     */
    fastify.get('/pool/status', async (request, reply) => {
        const status = {
            totalTokens: tokenPool.tokens.length,
            validTokens: tokenPool.tokens.filter(t => t.isValid).length,
            tokens: tokenPool.tokens.map(t => ({
                id: t.sessionId.slice(0, 8),
                isValid: t.isValid,
                credits: t.credits,
                usageCount: t.usageCount,
                lastUsed: t.lastUsed,
                lastValidated: t.lastValidated
            }))
        };

        return reply.send(status);
    });
}
