/**
 * Analytics Routes
 * Handles analytics and monitoring endpoints
 */

import { FastifyInstance } from 'fastify';
import { AnalyticsService } from '../services/analyticsService';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

export function analyticsRoutes(analyticsService: AnalyticsService) {
  return async function (fastify: FastifyInstance) {
    // Get user analytics
    fastify.get('/user', {
      preHandler: [authMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;
      const { period = '30d' } = request.query as any;

      try {
        const analytics = await analyticsService.getUserAnalytics(user.id, period);

        return {
          success: true,
          data: analytics
        };

      } catch (error) {
        console.error('User analytics error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'ANALYTICS_FETCH_FAILED',
            message: 'Failed to fetch user analytics'
          }
        });
      }
    });

    // Get generation analytics
    fastify.get('/generations', {
      preHandler: [authMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;
      const { period = '30d' } = request.query as any;

      try {
        const analytics = await analyticsService.getGenerationAnalytics(user.id, period);

        return {
          success: true,
          data: analytics
        };

      } catch (error) {
        console.error('Generation analytics error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'GENERATION_ANALYTICS_FAILED',
            message: 'Failed to fetch generation analytics'
          }
        });
      }
    });

    // Get token usage analytics
    fastify.get('/tokens', {
      preHandler: [authMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;
      const { period = '30d' } = request.query as any;

      try {
        const analytics = await analyticsService.getTokenAnalytics(user.id, period);

        return {
          success: true,
          data: analytics
        };

      } catch (error) {
        console.error('Token analytics error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'TOKEN_ANALYTICS_FAILED',
            message: 'Failed to fetch token analytics'
          }
        });
      }
    });

    // Get metrics endpoint
    fastify.get('/metrics', {
      preHandler: [authMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;
      const { period = '7d' } = request.query as any;

      try {
        // Get generations by day/week
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 1;
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const generations = await fastify.prisma.generation.findMany({
          where: {
            userId: user.id,
            createdAt: {
              gte: startDate,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        // Group by day
        const generationsByDay: Record<string, number> = {};
        const successCount = generations.filter((g) => g.status === 'COMPLETED').length;
        const errorCount = generations.filter((g) => g.status === 'FAILED').length;
        const totalCount = generations.length;

        generations.forEach((gen) => {
          const day = gen.createdAt.toISOString().split('T')[0];
          generationsByDay[day] = (generationsByDay[day] || 0) + 1;
        });

        // Get most used tokens (if available)
        const tokenUsage = await fastify.prisma.tokenUsage.findMany({
          where: {
            timestamp: {
              gte: startDate,
            },
          },
          include: {
            token: {
              select: {
                id: true,
                tier: true,
              },
            },
          },
          orderBy: {
            timestamp: 'desc',
          },
          take: 100,
        });

        const tokenUsageCount: Record<string, number> = {};
        tokenUsage.forEach((usage) => {
          const tokenId = usage.tokenId;
          tokenUsageCount[tokenId] = (tokenUsageCount[tokenId] || 0) + 1;
        });

        const mostUsedTokens = Object.entries(tokenUsageCount)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([tokenId, count]) => ({
            tokenId,
            usageCount: count,
          }));

        // Calculate success/error rate
        const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 100;
        const errorRate = totalCount > 0 ? (errorCount / totalCount) * 100 : 0;

        // Get most active users (admin only)
        let mostActiveUsers: any[] = [];
        if (user.isAdmin) {
          const userGenerations = await fastify.prisma.generation.groupBy({
            by: ['userId'],
            _count: {
              userId: true,
            },
            where: {
              createdAt: {
                gte: startDate,
              },
            },
            orderBy: {
              _count: {
                userId: 'desc' as const,
              },
            },
            take: 10,
          });

          mostActiveUsers = await Promise.all(
            userGenerations.map(async (ug) => {
              const userData = await fastify.prisma.user.findUnique({
                where: { id: ug.userId },
                select: {
                  id: true,
                  email: true,
                  username: true,
                  tier: true,
                },
              });

              return {
                user: userData,
                generationCount: ug._count.userId,
              };
            })
          );
        }

        return {
          success: true,
          data: {
            period,
            generations: {
              total: totalCount,
              success: successCount,
              failed: errorCount,
              successRate: Math.round(successRate * 100) / 100,
              errorRate: Math.round(errorRate * 100) / 100,
              byDay: generationsByDay,
            },
            tokens: {
              mostUsed: mostUsedTokens,
            },
            ...(user.isAdmin && {
              users: {
                mostActive: mostActiveUsers,
              },
            }),
          },
        };
      } catch (error) {
        console.error('Metrics error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'METRICS_FETCH_FAILED',
            message: 'Failed to fetch metrics',
          },
        });
      }
    });

    // Admin: Get system analytics
    fastify.get('/admin/system', {
      preHandler: [adminMiddleware]
    }, async (request, reply) => {
      const { period = '30d' } = request.query as any;

      try {
        const analytics = await analyticsService.getSystemAnalytics(period);

        return {
          success: true,
          data: analytics
        };

      } catch (error) {
        console.error('System analytics error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'SYSTEM_ANALYTICS_FAILED',
            message: 'Failed to fetch system analytics'
          }
        });
      }
    });

    // Admin: Get user statistics
    fastify.get('/admin/users', {
      preHandler: [adminMiddleware]
    }, async (request, reply) => {
      const { period = '30d' } = request.query as any;

      try {
        const analytics = await analyticsService.getUserStatistics(period);

        return {
          success: true,
          data: analytics
        };

      } catch (error) {
        console.error('User statistics error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'USER_STATISTICS_FAILED',
            message: 'Failed to fetch user statistics'
          }
        });
      }
    });

    // Admin: Get generation statistics
    fastify.get('/admin/generations', {
      preHandler: [adminMiddleware]
    }, async (request, reply) => {
      const { period = '30d' } = request.query as any;

      try {
        const analytics = await analyticsService.getGenerationStatistics(period);

        return {
          success: true,
          data: analytics
        };

      } catch (error) {
        console.error('Generation statistics error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'GENERATION_STATISTICS_FAILED',
            message: 'Failed to fetch generation statistics'
          }
        });
      }
    });

    // Admin: Get token pool statistics
    fastify.get('/admin/tokens', {
      preHandler: [adminMiddleware]
    }, async (request, reply) => {
      try {
        const analytics = await analyticsService.getTokenPoolStatistics();

        return {
          success: true,
          data: analytics
        };

      } catch (error) {
        console.error('Token pool statistics error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'TOKEN_POOL_STATISTICS_FAILED',
            message: 'Failed to fetch token pool statistics'
          }
        });
      }
    });

    // Admin: Get performance metrics
    fastify.get('/admin/performance', {
      preHandler: [adminMiddleware]
    }, async (request, reply) => {
      const { period = '24h' } = request.query as any;

      try {
        const analytics = await analyticsService.getPerformanceMetrics(period);

        return {
          success: true,
          data: analytics
        };

      } catch (error) {
        console.error('Performance metrics error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'PERFORMANCE_METRICS_FAILED',
            message: 'Failed to fetch performance metrics'
          }
        });
      }
    });

    // Track custom event
    fastify.post('/track', {
      preHandler: [authMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;
      const { event, properties } = request.body as any;

      try {
        if (!event) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'EVENT_REQUIRED',
              message: 'Event name is required'
            }
          });
        }

        await analyticsService.trackEvent({
          userId: user.id,
          eventType: event,
          properties: properties || {},
          timestamp: new Date()
        });

        return {
          success: true,
          data: {
            message: 'Event tracked successfully'
          }
        };

      } catch (error) {
        console.error('Event tracking error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'EVENT_TRACKING_FAILED',
            message: 'Failed to track event'
          }
        });
      }
    });

    // Get real-time metrics
    fastify.get('/realtime', {
      preHandler: [adminMiddleware]
    }, async (request, reply) => {
      try {
        const metrics = await analyticsService.getRealtimeMetrics();

        return {
          success: true,
          data: metrics
        };

      } catch (error) {
        console.error('Realtime metrics error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'REALTIME_METRICS_FAILED',
            message: 'Failed to fetch realtime metrics'
          }
        });
      }
    });
  };
}
