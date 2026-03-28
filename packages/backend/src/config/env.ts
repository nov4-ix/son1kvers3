import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // APIs
  GROQ_API_KEY: z.string().min(1).optional(),
  ELEVENLABS_API_KEY: z.string().min(1).optional(),
  BARK_API_URL: z.string().url().optional(),

  // Neural Engine (optional)
  NEURAL_ENGINE_POLLING_URL: z.string().url().optional(),
  NEURAL_ENGINE_API_URL: z.string().url().optional(),

  // Server
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Auth
  JWT_SECRET: z.string().min(32),

  // Redis (optional)
  REDIS_URL: z.string().url().optional(),

  // Frontend
  FRONTEND_URL: z.string().url().default('http://localhost:3005'),

  // Stripe (optional)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Backend
  BACKEND_SECRET: z.string().min(1).optional(),

  // MusicLab
  MUSIC_LAB_URL: z.string().url().optional(),
  ENABLE_MUSIC_LAB: z.boolean().default(true),
  ENABLE_SUNO_FALLBACK: z.boolean().default(false),

})

export type Env = z.infer<typeof envSchema>

let env: Env

export function validateEnv(): Env {
  try {
    env = envSchema.parse(process.env)
    console.log('✅ Environment variables validated successfully')
    return env
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:')
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
    }
    process.exit(1)
  }
}

export function getEnv(): Env {
  if (!env) {
    throw new Error('Environment not validated. Call validateEnv() first.')
  }
  return env
}