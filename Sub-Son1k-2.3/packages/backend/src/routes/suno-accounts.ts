// packages/backend/src/routes/suno-accounts.ts
import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { TokenManager } from '../services/tokenManager';
import { getHarvester } from '../services/TokenHarvester';

puppeteer.use(StealthPlugin());

interface SunoAccountsPluginOptions {
  prisma: PrismaClient;
  tokenManager: TokenManager;
}

const sunoAccountsRoutes: FastifyPluginAsync<SunoAccountsPluginOptions> = async (fastify, options) => {
  const { prisma, tokenManager } = options;

  function encrypt(text: string): string {
    const key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
    if (key.length !== 32) {
        throw new Error('ENCRYPTION_KEY debe ser 32 bytes (64 caracteres hex)');
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
}

  async function verifyCredentials(email: string, password: string): Promise<boolean> {
    let browser;

    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.goto('https://suno.com/login', { waitUntil: 'networkidle2', timeout: 30000 });

        await page.waitForSelector('input[type="email"]', { timeout: 10000 });
        await page.type('input[type="email"]', email);
        await page.type('input[type="password"]', password);
        await page.click('button[type="submit"]');

        await page.waitForNavigation({ timeout: 15000 });

        const isValid = page.url().includes('dashboard') || page.url().includes('home');

        await browser.close();
        return isValid;

    } catch (error) {
        console.error('Error verificando credenciales:', error);
        if (browser) await browser.close();
        return false;
    }
}

  fastify.post('/link', async (request, reply) => {
    try {
        const { userId, sunoEmail, sunoPassword } = request.body as any;

        if (!userId || !sunoEmail || !sunoPassword) {
            return reply.status(400).send({
                error: 'Faltan campos requeridos: userId, sunoEmail, sunoPassword'
            });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return reply.status(404).send({ error: 'Usuario no encontrado' });
        }

        const linkedCount = await prisma.linkedSunoAccount.count({
            where: { userId, isActive: true }
        });

        const maxAccounts = {
            FREE: 1,
            CREATOR: 2,
            PRO: 3,
            STUDIO: 5
        }[user.tier] || 1;

        if (linkedCount >= maxAccounts) {
            return reply.status(400).send({
                error: `Límite alcanzado. Tu tier ${user.tier} permite máx ${maxAccounts} cuenta(s)`
            });
        }

        const existing = await prisma.linkedSunoAccount.findFirst({
            where: { email: sunoEmail, isActive: true }
        });

        if (existing) {
            return reply.status(400).send({
                error: 'Esta cuenta ya está vinculada a un usuario'
            });
        }

        console.log(`🔐 Verificando credenciales de ${sunoEmail}...`);
        const isValid = await verifyCredentials(sunoEmail, sunoPassword);

        if (!isValid) {
            return reply.status(401).send({
                error: 'Credenciales inválidas de Suno'
            });
        }

        const encryptedPassword = encrypt(sunoPassword);

        const linkedAccount = await prisma.linkedSunoAccount.create({
            data: {
                userId,
                email: sunoEmail,
                encryptedPassword,
                isActive: true,
                tier: user.tier
            }
        });

        console.log(`✅ Cuenta ${sunoEmail} vinculada a usuario ${userId}`);

        return reply.send({
            success: true,
            message: 'Cuenta vinculada exitosamente. Comenzaremos a recolectar tokens automáticamente.',
            account: {
                id: linkedAccount.id,
                email: linkedAccount.email,
                tier: linkedAccount.tier
            }
        });

    } catch (error: any) {
        console.error('❌ Error vinculando cuenta:', error);
        return reply.status(500).send({ error: error.message });
    }
  });

  fastify.get('/linked/:userId', async (request, reply) => {
    try {
        const { userId } = request.params as any;

        const accounts = await prisma.linkedSunoAccount.findMany({
            where: { userId },
            select: {
                id: true,
                email: true,
                isActive: true,
                tier: true,
                lastHarvest: true,
                tokensCollected: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return reply.send({
            success: true,
            accounts
        });

    } catch (error: any) {
        console.error('❌ Error obteniendo cuentas:', error);
        return reply.status(500).send({ error: error.message });
    }
  });

  fastify.delete('/link/:accountId', async (request, reply) => {
    try {
        const { accountId } = request.params as any;

        await prisma.linkedSunoAccount.update({
            where: { id: accountId },
            data: { isActive: false }
        });

        console.log(`🗑️  Cuenta ${accountId} desvinculada`);

        return reply.send({
            success: true,
            message: 'Cuenta desvinculada exitosamente'
        });

    } catch (error: any) {
        console.error('❌ Error desvinculando cuenta:', error);
        return reply.status(500).send({ error: error.message });
    }
  });

  fastify.get('/harvester/stats', async (request, reply) => {
    try {
        const harvester = getHarvester(tokenManager);
        const stats = await harvester.getStats();

        return reply.send({
            success: true,
            stats
        });

    } catch (error: any) {
        console.error('❌ Error obteniendo stats:', error);
        return reply.status(500).send({ error: error.message });
    }
  });

  fastify.post('/harvester/start', async (request, reply) => {
    try {
        const { intervalMinutes = 5 } = request.body as any;

        const harvester = getHarvester(tokenManager, intervalMinutes);
        await harvester.start();

        return reply.send({
            success: true,
            message: `Harvester iniciado (intervalo: ${intervalMinutes} min)`
        });

    } catch (error: any) {
        console.error('❌ Error iniciando harvester:', error);
        return reply.status(500).send({ error: error.message });
    }
  });

  fastify.post('/harvester/stop', async (request, reply) => {
    try {
        const harvester = getHarvester(tokenManager);
        await harvester.stop();

        return reply.send({
            success: true,
            message: 'Harvester detenido'
        });

    } catch (error: any) {
        console.error('❌ Error deteniendo harvester:', error);
        return reply.status(500).send({ error: error.message });
    }
  });

};

export default sunoAccountsRoutes;
