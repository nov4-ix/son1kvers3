/**
 * Admin Routes
 * Dashboard and administrative endpoints
 */

import { FastifyInstance } from 'fastify';
import { adminMiddleware } from '../middleware/auth';
import { AnalyticsService } from '../services/analyticsService';

export function adminRoutes(analyticsService: AnalyticsService) {
  return async function (fastify: FastifyInstance) {
    // Admin dashboard endpoint
    fastify.get('/dashboard', {
      preHandler: [adminMiddleware],
    }, async (request, reply) => {
      try {
        // Get analytics
        const activeUsers = await analyticsService.getActiveUserCount();
        const recentGenerations = await analyticsService.getRecentGenerations(24);

        const generationsLast24h = recentGenerations.length;
        const successRate = recentGenerations.length > 0
          ? (recentGenerations.filter((g: any) => g.status === 'COMPLETED').length / recentGenerations.length) * 100
          : 100;

        return {
          success: true,
          data: {
            activeUsers,
            generationsLast24h,
            successRate,
            systemStatus: 'online',
            message: 'Using Music Lab API for generation'
          }
        };
      } catch (error) {
        reply.code(500);
        return { success: false, error: 'Failed to load dashboard' };
      }
    });

    // Health check endpoint
    fastify.get('/health', async (request, reply) => {
      return {
        status: 'healthy',
        system: 'son1kvers3',
        generation: 'music-lab',
        timestamp: new Date().toISOString()
      };
    });
  };
}
