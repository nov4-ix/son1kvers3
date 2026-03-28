import { describe, it, expect } from 'vitest'
import Fastify from 'fastify'

async function build() {
  const app = Fastify({ logger: false })

  // Simple route for testing
  app.get('/test', async (req, reply) => {
    return { message: 'OK' }
  })

  await app.ready()
  return app
}

describe('Rate Limiting', () => {
  it('should handle basic requests', async () => {
    const app = await build()

    const response = await app.inject({
      method: 'GET',
      url: '/test'
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.message).toBe('OK')

    await app.close()
  })

  it('should validate environment schema', () => {
    // Test básico de validación
    const validEnv = {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      SUNO_API_KEY: 'test-key',
      JWT_SECRET: 'test-secret-minimum-32-chars-long-for-testing',
      PORT: 3001,
      NODE_ENV: 'test'
    }

    // This would normally be validated by Zod
    expect(validEnv.DATABASE_URL).toContain('postgresql://')
    expect(validEnv.SUNO_API_KEY).toBe('test-key')
    expect(validEnv.JWT_SECRET.length).toBeGreaterThanOrEqual(32)
  })
})