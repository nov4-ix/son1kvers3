import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { PrismaClient } from '@prisma/client';
import { CreditService } from './services/creditService';
import MusicGenerationService from './services/musicGenerationService';
import { AnalyticsService } from './services/analyticsService';
import { generationRoutes } from './routes/generation';
import { paypalWebhookRoutes } from './routes/webhooks/paypal';
import { startGenerationWorker } from './workers/generation.worker';
import { globalRateLimit, generationRateLimit, authRateLimit } from './middleware/rateLimiter';
import { validateEnv, getEnv } from './config/env';
import { healthRoutes } from './routes/health';
import { setupWebSocket } from './websocket/generationSocket';
import { metricsMiddleware } from './middleware/metricsMiddleware';
import { metricsRoutes } from './routes/metrics';
import { pixelRoutes } from './routes/pixel';
import { voiceCloneRoutes } from './routes/voiceClone';
import { barkRoutes } from './routes/bark';


validateEnv()
const env = getEnv()

import { logger } from './config/logger'

const fastify = Fastify({
  logger: logger
});

let creditService: CreditService;
let musicGenerationService: MusicGenerationService;
let analyticsService: AnalyticsService;

async function registerPlugins() {
  await fastify.register(cors, {
    origin: [
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*\.son1kvers3\.com$/,
      'https://www.son1kvers3.com',
      'https://ghost-studio-lovat.vercel.app',
      'https://web-classic-son1kvers3s-projects-c3cdfb54.vercel.app',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3004',
      'http://localhost:3005',
      'http://localhost:4173',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  });

  await fastify.register(rateLimit, globalRateLimit)

  fastify.addHook('onRequest', metricsMiddleware)

  await setupWebSocket(fastify)
}

fastify.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      musicGeneration: !!musicGenerationService,
      neuralEngine: 'active'
    },
  };
});

async function start() {
  try {
    await registerPlugins();
    fastify.log.info('Plugins registered');

    const prisma = new PrismaClient();

    creditService = new CreditService(prisma);
    fastify.log.info('CreditService initialized');

    analyticsService = new AnalyticsService(prisma);
    fastify.log.info('AnalyticsService initialized');

    musicGenerationService = new MusicGenerationService(prisma);
    fastify.log.info('MusicGenerationService initialized');



    await fastify.register(async function (instance: any) {
      instance.addHook('preHandler', async (req: any, reply: any) => {
        await instance.rateLimit({
          ...generationRateLimit
        })(req, reply)
      })

      await instance.register(generationRoutes(musicGenerationService, analyticsService))
    }, { prefix: '/api/generation' })
    fastify.log.info('Generation Routes registered with rate limiting')

    await fastify.register(paypalWebhookRoutes, {
      prefix: '/api/webhooks/paypal',
      analyticsService
    });
    fastify.log.info('PayPal Webhook Routes registered');

    await fastify.register(healthRoutes);
    fastify.log.info('Health Check Routes registered');

    await fastify.register(metricsRoutes);
    fastify.log.info('Metrics Routes registered');

    await fastify.register(pixelRoutes);
    fastify.log.info('Pixel Routes registered');

    await fastify.register(voiceCloneRoutes);
    fastify.log.info('Voice Clone Routes registered');

    await fastify.register(barkRoutes);
    fastify.log.info('Bark Routes registered');

    try {
      const { setGlobalInstances } = await import('./workers/generation.worker');
      setGlobalInstances(musicGenerationService);
      startGenerationWorker();
      fastify.log.info('Generation Worker started');
    } catch (workerError) {
      fastify.log.error(workerError, 'Generation Worker failed to start:');
    }

    const port = env.PORT;
    const host = process.env.HOST || '0.0.0.0';
    await fastify.listen({ port, host });

    fastify.log.info(`Server listening on ${host}:${port}`);
    fastify.log.info(`Music Generation: ACTIVE (HeartMuLa Pipeline)`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();

const signals = ['SIGTERM', 'SIGINT'];
signals.forEach(signal => {
  process.on(signal, async () => {
    console.log(`${signal} received, closing server...`);
    try {
      await fastify.close();
      console.log('Server closed');
    } catch (err) {
      console.error('Error closing server:', err);
    }
    process.exit(0);
  });
});
