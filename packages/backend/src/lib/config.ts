/**
 * Environment Configuration
 * Centralized validation of all environment variables
 * Prevents crashes from missing API keys in production
 */

import { z } from 'zod';

const envSchema = z.object({
  // Database (requerida)
  DATABASE_URL: z.string().min(1, 'DATABASE_URL requerida'),

  // Redis
  REDIS_URL: z.string().url().optional().or(z.string().startsWith('redis://')),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),

  // JWT (opcional en desarrollo, requerido en producción)
  JWT_SECRET: z.string().min(1, 'JWT_SECRET requerido').optional(),

  // Supabase (opcional - puede usar tokens del pool)
  SUPABASE_URL: z.string().url('Supabase URL inválida').optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key requerida').optional(),

  // Generation API 
  GENERATION_API_URL: z.string().url().optional(),
  GENERATION_POLLING_URL: z.string().url().optional(),
  COVER_API_URL: z.string().url().optional(),
  NEURAL_ENGINE_API_URL: z.string().url().optional(),
  NEURAL_ENGINE_POLLING_URL: z.string().url().optional(),

  // Frontend (opcional en desarrollo)
  FRONTEND_URL: z.string().min(1, 'Frontend URL requerida').optional(),

  // Backend Secret (opcional en desarrollo)
  BACKEND_SECRET: z.string().min(1, 'BACKEND_SECRET requerido').optional(),

  // Queue Configuration
  GENERATION_CONCURRENCY: z.string().optional(),
  GENERATION_RATE_LIMIT: z.string().optional(),

  // Stripe (opcional)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRO_PRICE_ID: z.string().optional(),
  STRIPE_PREMIUM_PRICE_ID: z.string().optional(),
  STRIPE_ENTERPRISE_PRICE_ID: z.string().optional(),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  HOST: z.string().optional(),
});

// Validar variables de entorno (modo flexible para permitir deploy)
function validateEnv() {
  try {
    // Usar safeParse para no fallar si faltan variables opcionales
    const result = envSchema.safeParse({
      DATABASE_URL: process.env.DATABASE_URL,
      REDIS_URL: process.env.REDIS_URL,
      REDIS_HOST: process.env.REDIS_HOST,
      REDIS_PORT: process.env.REDIS_PORT,
      REDIS_PASSWORD: process.env.REDIS_PASSWORD,
      JWT_SECRET: process.env.JWT_SECRET,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      GENERATION_API_URL: process.env.GENERATION_API_URL,
      NEURAL_ENGINE_POLLING_URL: process.env.NEURAL_ENGINE_POLLING_URL,
      FRONTEND_URL: process.env.FRONTEND_URL,
      BACKEND_SECRET: process.env.BACKEND_SECRET,
      GENERATION_CONCURRENCY: process.env.GENERATION_CONCURRENCY,
      GENERATION_RATE_LIMIT: process.env.GENERATION_RATE_LIMIT,

      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      STRIPE_PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID,
      STRIPE_PREMIUM_PRICE_ID: process.env.STRIPE_PREMIUM_PRICE_ID,
      STRIPE_ENTERPRISE_PRICE_ID: process.env.STRIPE_ENTERPRISE_PRICE_ID,
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      LOG_LEVEL: process.env.LOG_LEVEL,
      HOST: process.env.HOST,
    });

    if (!result.success) {
      // Solo mostrar warnings, no fallar (permite deploy)
      const missingVars = result.error.issues
        .filter(e => !e.path.includes('SUPABASE') && !e.path.includes('FRONTEND_URL') && !e.path.includes('BACKEND_SECRET'))
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join('\n');

      if (missingVars) {
        console.warn('⚠️ WARNING: Algunas variables de entorno faltantes:\n', missingVars);
      }

      // Retornar valores con defaults para variables opcionales
      return {
        DATABASE_URL: process.env.DATABASE_URL || '',
        REDIS_URL: process.env.REDIS_URL,
        REDIS_HOST: process.env.REDIS_HOST,
        REDIS_PORT: process.env.REDIS_PORT,
        REDIS_PASSWORD: process.env.REDIS_PASSWORD,
        JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-min-32-chars-for-development-only',
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        GENERATION_API_URL: process.env.GENERATION_API_URL,
        GENERATION_POLLING_URL: process.env.GENERATION_POLLING_URL,
        COVER_API_URL: process.env.COVER_API_URL,
        NEURAL_ENGINE_API_URL: process.env.NEURAL_ENGINE_API_URL,
        NEURAL_ENGINE_POLLING_URL: process.env.NEURAL_ENGINE_POLLING_URL,
        FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
        BACKEND_SECRET: process.env.BACKEND_SECRET || 'dev-backend-secret-min-32-chars-for-development',
        GENERATION_CONCURRENCY: process.env.GENERATION_CONCURRENCY,
        GENERATION_RATE_LIMIT: process.env.GENERATION_RATE_LIMIT,

        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
        STRIPE_PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID,
        STRIPE_PREMIUM_PRICE_ID: process.env.STRIPE_PREMIUM_PRICE_ID,
        STRIPE_ENTERPRISE_PRICE_ID: process.env.STRIPE_ENTERPRISE_PRICE_ID,
        NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
        PORT: process.env.PORT || '3001',
        LOG_LEVEL: (process.env.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug') || 'info',
        HOST: process.env.HOST,
      } as z.infer<typeof envSchema>;
    }

    return result.data;
  } catch (error) {
    console.error('❌ ERROR validando variables de entorno:', error);
    // En caso de error crítico, usar defaults
    throw error;
  }
}

// Exportar env validado
export const env = validateEnv();

// Helper para verificar si una variable está configurada
export function requireEnv(key: keyof typeof env): string {
  const value = env[key];
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value as string;
}

// Log de validación exitosa (solo en desarrollo)
if (env.NODE_ENV === 'development') {
  console.log('✅ Environment variables validated successfully');
}

