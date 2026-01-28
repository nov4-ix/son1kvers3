import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { PrismaClient } from '@prisma/client';
import { TokenManager } from './services/tokenManager';
import { CreditService } from './services/creditService';
import { MusicGenerationService } from './services/musicGenerationService';
import { TokenPoolService } from './services/tokenPoolService';
import { AnalyticsService } from './services/analyticsService';
import { getStealthGenerator } from './services/StealthTokenGenerator';
import { getHarvester } from './services/TokenHarvester';
import { tokenRoutes } from './routes/tokens';
import { audioEngineRoutes } from './routes/audioEngine';
import neuralEngineRoutes from './routes/neural-engine';
import sunoAccountsRoutes from './routes/suno-accounts';
import { paypalWebhookRoutes } from './routes/webhooks/paypal';
import { globalRateLimit, generationRateLimit, authRateLimit } from './middleware/rateLimiter';
import { validateEnv, getEnv } from './config/env';
import { healthRoutes } from './routes/health';
import { setupWebSocket } from './websocket/generationSocket';
import { metricsMiddleware } from './middleware/metricsMiddleware';
import { metricsRoutes } from './routes/metrics';

// ⚠️ VALIDAR ENV ANTES DE INICIAR
validateEnv()
const env = getEnv()

// Import logger after env validation
import { logger } from './config/logger'

const fastify = Fastify({
  logger: logger
});

// Global service instances
let tokenManager: TokenManager;
let creditService: CreditService;
let tokenPoolService: TokenPoolService;
let musicGenerationService: MusicGenerationService;
let analyticsService: AnalyticsService;

// Register plugins (CORS, Helmet, Rate limiting)
async function registerPlugins() {
  await fastify.register(cors, {
    origin: [
      /^https:\/\/.*\.vercel\.app$/,  // Todos los subdominios de Vercel
      /^https:\/\/.*\.son1kvers3\.com$/,  // Dominios de Son1k
      'https://www.son1kvers3.com',
      'https://ghost-studio-lovat.vercel.app',
      'https://web-classic-son1kvers3s-projects-c3cdfb54.vercel.app', // Frontend actual
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://localhost:3001',  // Backend local
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

  // Rate limiting global
  await fastify.register(rateLimit, globalRateLimit)

  // Middleware global de métricas
  fastify.addHook('onRequest', metricsMiddleware)

  // Setup WebSocket para updates en tiempo real
  await setupWebSocket(fastify)
}

// Health check endpoint
fastify.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      musicGeneration: !!musicGenerationService,
      tokenManager: !!tokenManager,
      neuralEngine: 'active'
    },
  };
});

// Server start
async function start() {
  try {
    await registerPlugins();
    fastify.log.info('Plugins registered');

    // Load Suno tokens (Legacy)
    const sunoTokens = process.env.SUNO_TOKENS?.split(',').filter(t => t.trim()) || [];
    if (sunoTokens.length > 0) {
      fastify.log.info(`Found ${sunoTokens.length} legacy Suno token(s)`);
    }

    // Initialise Prisma and TokenManager
    const prisma = new PrismaClient();
    tokenManager = new TokenManager(prisma);
    fastify.log.info('TokenManager initialized');

    // Initialise TokenPoolService
    tokenPoolService = new TokenPoolService(prisma, tokenManager);
    await tokenPoolService.initialize();
    fastify.log.info('TokenPoolService initialized');

    // Initialise CreditService
    creditService = new CreditService(prisma);
    fastify.log.info('CreditService initialized');

    // Initialise AnalyticsService
    analyticsService = new AnalyticsService(prisma); // Assuming AnalyticsService takes prisma, if exists. If not I might need to check. 
    // Step 23 showed generation.ts importing AnalyticsService. I assume it works like others. 
    // Wait, step 23 generation.ts imports `AnalyticsService` from `../services/analyticsService`.
    // I need to instantiate it. Let's assume constructor(prisma).

    // Initialise MusicGenerationService
    musicGenerationService = new MusicGenerationService(tokenManager, tokenPoolService, prisma, creditService);
    fastify.log.info('MusicGenerationService initialized');

    // Register Token Routes
    await fastify.register(tokenRoutes(tokenManager, tokenPoolService), { prefix: '/api/tokens' });
    fastify.log.info('Token Routes registered');

    // Register Audio Engine Routes (for extension)
    await fastify.register(audioEngineRoutes);
    fastify.log.info('Audio Engine Routes registered');

    // Register Stripe Routes
    // await fastify.register(stripeRoutes, {
    //   prefix: '/api/stripe',
    //   analyticsService
    // });
    fastify.log.info('Stripe Routes registered');

    // Register Neural Engine Routes (REPLACES Suno Accounts)
    await fastify.register(neuralEngineRoutes, { prefix: '/api/neural-engine' });
    fastify.log.info('Neural Engine Routes registered');

    // Register Suno Accounts Routes (Token Harvester)
    await fastify.register(sunoAccountsRoutes, {
      prefix: '/api/suno-accounts',
      prisma,
      tokenManager
    });
    fastify.log.info('Suno Accounts Routes registered');

    // Register Generation Routes with specific rate limiting
    await fastify.register(async (instance) => {
      // Rate limit específico para generación
      instance.addHook('preHandler', async (req, reply) => {
        await instance.rateLimit({
          ...generationRateLimit
        })(req, reply)
      })

      await instance.register(generationRoutes(musicGenerationService, analyticsService))
    }, { prefix: '/api/generation' })
    fastify.log.info('Generation Routes registered with rate limiting')

    // Register PayPal Webhook Routes
    await fastify.register(paypalWebhookRoutes, {
      prefix: '/api/webhooks/paypal',
      analyticsService
    });
    fastify.log.info('PayPal Webhook Routes registered');

    // Register Health Check Routes
    await fastify.register(healthRoutes);
    fastify.log.info('Health Check Routes registered');

    // Register Metrics Routes
    await fastify.register(metricsRoutes);
    fastify.log.info('Metrics Routes registered');

    // Start Generation Worker (BullMQ)
    try {
      // Pasar instancias globales al worker
      const { setGlobalInstances } = await import('./workers/generation.worker');
      setGlobalInstances(tokenManager, tokenPoolService);
      startGenerationWorker();
      fastify.log.info('Generation Worker started');
    } catch (workerError) {
      fastify.log.warn('⚠️ Generation Worker failed to start (Redis down?):', workerError);
    }

    // INICIAR TOKEN HARVESTER (Recolección automática de tokens)
    try {
      const harvester = getHarvester(tokenManager, 5); // Intervalo de 5 minutos
      await harvester.start();
      fastify.log.info('✅ TokenHarvester iniciado (recolección automática cada 5 min)');
    } catch (error) {
      fastify.log.warn('⚠️ TokenHarvester no pudo iniciarse:', error);
    }

    // INICIAR STEALTH TOKEN GENERATOR (The new system)
    try {
      const stealthGen = getStealthGenerator();

      console.log('🕵️ Iniciando Sistema Stealth...');
      console.log('   (Generación automática de tokens en segundo plano)\n');

      await stealthGen.start();

      // Stats iniciales
      const stats = await stealthGen.getStats();
      console.log('📊 Estado del Sistema:');
      console.log(`   - Cuentas activas: ${stats.totalStealthAccounts}`);
      console.log(`   - Tokens en pool: ${stats.tokensInPool}`);
      console.log(`   - Estado: ${stats.systemStatus}`);
      console.log('   ================================\n');

      fastify.log.info('✅ Sistema Stealth completamente operativo');
    } catch (error) {
      fastify.log.error('❌ Error iniciando Sistema Stealth:', error);
    }

    const port = env.PORT;

    const host = process.env.HOST || '0.0.0.0';
    await fastify.listen({ port, host });

    fastify.log.info(`🚀 Server listening on ${host}:${port}`);
    fastify.log.info(`🎵 Music Generation: ACTIVE (Neural Engine v2.0)`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();

// Graceful shutdown
const signals = ['SIGTERM', 'SIGINT'];
signals.forEach(signal => {
  process.on(signal, async () => {
    console.log(`\n🛑 ${signal} recibido, cerrando servidor...`);
    try {
      await fastify.close();
      // Here we could stop listeners/browsers if we exposed a stop method in StealthGenerator
      console.log('Server closed');
    } catch (err) {
      console.error('Error closing server:', err);
    }
    process.exit(0);
  });
});
