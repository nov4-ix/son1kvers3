import Fastify from 'fastify';
import cors from '@fastify/cors';

const fastify = Fastify({ logger: false });

async function start() {
  try {
    await fastify.register(cors, {
      origin: ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
    });

    fastify.get('/health', async () => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }));

    fastify.get('/api/test', async () => ({
      message: 'Backend funcionando',
      version: '1.0.0',
    }));

    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    console.log(`🚀 Backend test listening on ${host}:${port}`);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

start();
