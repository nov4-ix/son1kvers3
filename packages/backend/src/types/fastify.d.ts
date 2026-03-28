/**
 * Fastify type declarations
 */

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    analyticsService: any;
    tokenManager: any;
    collaborationService: any;
    userExtensionService: any;
    tokenPoolService: any;
    musicGenerationService: any;
  }
}
