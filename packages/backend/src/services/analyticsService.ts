/**
 * Analytics Service
 * Handles analytics and monitoring
 */

import { PrismaClient } from '@prisma/client';

export interface AnalyticsEvent {
  userId: string;
  eventType: string;
  properties: Record<string, any>;
  timestamp: Date;
}

export interface GenerationAnalytics {
  userId: string;
  generationId: string;
  prompt: string;
  style: string;
  duration: number;
  quality: string;
  timestamp: Date;
}

export interface RequestAnalytics {
  userId?: string;
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: Date;
}

export class AnalyticsService {
  constructor(private prisma: PrismaClient) { }

  /**
   * Track a custom event
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      await this.prisma.analyticsEvent.create({
        data: {
          userId: event.userId,
          eventType: event.eventType,
          properties: JSON.stringify(event.properties), // Convert to JSON string
          timestamp: event.timestamp
        }
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Track generation analytics
   */
  async trackGeneration(generation: GenerationAnalytics): Promise<void> {
    try {
      await this.prisma.generationAnalytics.create({
        data: {
          userId: generation.userId,
          generationId: generation.generationId,
          prompt: generation.prompt,
          style: generation.style,
          duration: generation.duration,
          quality: generation.quality,
          timestamp: generation.timestamp
        }
      });
    } catch (error) {
      console.error('Failed to track generation analytics:', error);
    }
  }

  /**
   * Track request analytics
   */
  async trackRequest(request: RequestAnalytics): Promise<void> {
    try {
      await this.prisma.requestAnalytics.create({
        data: {
          userId: request.userId,
          endpoint: request.endpoint,
          method: request.method,
          statusCode: request.statusCode,
          duration: request.duration,
          timestamp: request.timestamp
        }
      });
    } catch (error) {
      console.error('Failed to track request analytics:', error);
    }
  }

  /**
   * Track subscription changes
   */
  async trackSubscriptionChange(userId: string, plan: string, provider: string): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: 'SUBSCRIPTION_CHANGE',
      properties: { plan, provider },
      timestamp: new Date()
    });
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(userId: string, period: string = '30d') {
    try {
      const startDate = this.getStartDate(period);

      const [events, generations, requests] = await Promise.all([
        this.prisma.analyticsEvent.findMany({
          where: {
            userId,
            timestamp: { gte: startDate }
          },
          orderBy: { timestamp: 'desc' },
          take: 100
        }),
        this.prisma.generationAnalytics.findMany({
          where: {
            userId,
            timestamp: { gte: startDate }
          },
          orderBy: { timestamp: 'desc' },
          take: 50
        }),
        this.prisma.requestAnalytics.findMany({
          where: {
            userId,
            timestamp: { gte: startDate }
          },
          orderBy: { timestamp: 'desc' },
          take: 100
        })
      ]);

      // Process analytics data
      const eventCounts = events.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);


      const generationStats = {
        total: generations.length,
        byStyle: generations.reduce((acc, gen) => {
          acc[gen.style] = (acc[gen.style] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byQuality: generations.reduce((acc, gen) => {
          acc[gen.quality] = (acc[gen.quality] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        averageDuration: generations.length > 0
          ? generations.reduce((sum, gen) => sum + gen.duration, 0) / generations.length
          : 0
      };

      const requestStats = {
        total: requests.length,
        byEndpoint: requests.reduce((acc, req) => {
          acc[req.endpoint] = (acc[req.endpoint] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byStatusCode: requests.reduce((acc, req) => {
          const statusGroup = Math.floor(req.statusCode / 100) * 100;
          acc[statusGroup] = (acc[statusGroup] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        averageDuration: requests.length > 0
          ? requests.reduce((sum, req) => sum + req.duration, 0) / requests.length
          : 0
      };

      return {
        period,
        events: {
          total: events.length,
          counts: eventCounts,
          recent: events.slice(0, 10)
        },
        generations: generationStats,
        requests: requestStats,
        recentActivity: [
          ...events.slice(0, 5).map((e: any) => ({ type: 'event', data: e })),
          ...generations.slice(0, 5).map((g: any) => ({ type: 'generation', data: g })),
          ...requests.slice(0, 5).map((r: any) => ({ type: 'request', data: r }))
        ].sort((a: any, b: any) => b.data.timestamp.getTime() - a.data.timestamp.getTime()).slice(0, 10)
      };

    } catch (error) {
      console.error('Failed to get user analytics:', error);
      throw error;
    }
  }

  /**
   * Get generation analytics
   */
  async getGenerationAnalytics(userId: string, period: string = '30d') {
    try {
      const startDate = this.getStartDate(period);

      const generations = await this.prisma.generationAnalytics.findMany({
        where: {
          userId,
          timestamp: { gte: startDate }
        },
        orderBy: { timestamp: 'desc' }
      });

      return {
        period,
        total: generations.length,
        byStyle: generations.reduce((acc, gen) => {
          acc[gen.style] = (acc[gen.style] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byQuality: generations.reduce((acc, gen) => {
          acc[gen.quality] = (acc[gen.quality] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        averageDuration: generations.length > 0
          ? generations.reduce((sum, gen) => sum + gen.duration, 0) / generations.length
          : 0,
        recent: generations.slice(0, 20)
      };

    } catch (error) {
      console.error('Failed to get generation analytics:', error);
      throw error;
    }
  }

  /**
   * Get token analytics
   */
  async getTokenAnalytics(userId: string, period: string = '30d') {
    try {
      const startDate = this.getStartDate(period);

      const tokenUsage = await this.prisma.tokenUsage.findMany({
        where: {
          token: {
            userId
          },
          timestamp: { gte: startDate }
        },
        include: {
          token: {
            select: {
              id: true,
              tier: true
            }
          }
        },
        orderBy: { timestamp: 'desc' }
      });

      return {
        period,
        totalRequests: tokenUsage.length,
        successfulRequests: tokenUsage.filter(u => u.statusCode >= 200 && u.statusCode < 300).length,
        averageResponseTime: tokenUsage.length > 0
          ? tokenUsage.reduce((sum, u) => sum + u.responseTime, 0) / tokenUsage.length
          : 0,
        byTier: tokenUsage.reduce((acc, u) => {
          const tier = u.token.tier;
          acc[tier] = (acc[tier] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        recent: tokenUsage.slice(0, 20)
      };

    } catch (error) {
      console.error('Failed to get token analytics:', error);
      throw error;
    }
  }

  /**
   * Get system analytics (admin only)
   */
  async getSystemAnalytics(period: string = '30d') {
    try {
      const startDate = this.getStartDate(period);

      const [users, generations, requests, events] = await Promise.all([
        this.prisma.user.count({
          where: {
            createdAt: { gte: startDate }
          }
        }),
        this.prisma.generationAnalytics.count({
          where: {
            timestamp: { gte: startDate }
          }
        }),
        this.prisma.requestAnalytics.count({
          where: {
            timestamp: { gte: startDate }
          }
        }),
        this.prisma.analyticsEvent.count({
          where: {
            timestamp: { gte: startDate }
          }
        })
      ]);

      return {
        period,
        users: {
          total: users,
          new: users
        },
        generations: {
          total: generations
        },
        requests: {
          total: requests
        },
        events: {
          total: events
        }
      };

    } catch (error) {
      console.error('Failed to get system analytics:', error);
      throw error;
    }
  }

  /**
   * Get user statistics (admin only)
   */
  async getUserStatistics(period: string = '30d') {
    try {
      const startDate = this.getStartDate(period);

      const [totalUsers, activeUsers, newUsers] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({
          where: {
            lastLoginAt: { gte: startDate }
          }
        }),
        this.prisma.user.count({
          where: {
            createdAt: { gte: startDate }
          }
        })
      ]);

      const usersByTier = await this.prisma.user.groupBy({
        by: ['tier'],
        _count: { tier: true }
      });

      return {
        period,
        total: totalUsers,
        active: activeUsers,
        new: newUsers,
        byTier: usersByTier.reduce((acc, user) => {
          acc[user.tier] = user._count.tier;
          return acc;
        }, {} as Record<string, number>)
      };

    } catch (error) {
      console.error('Failed to get user statistics:', error);
      throw error;
    }
  }

  /**
   * Get generation statistics (admin only)
   */
  async getGenerationStatistics(period: string = '30d') {
    try {
      const startDate = this.getStartDate(period);

      const generations = await this.prisma.generationAnalytics.findMany({
        where: {
          timestamp: { gte: startDate }
        }
      });

      return {
        period,
        total: generations.length,
        byStyle: generations.reduce((acc, gen) => {
          acc[gen.style] = (acc[gen.style] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byQuality: generations.reduce((acc, gen) => {
          acc[gen.quality] = (acc[gen.quality] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        averageDuration: generations.length > 0
          ? generations.reduce((sum, gen) => sum + gen.duration, 0) / generations.length
          : 0
      };

    } catch (error) {
      console.error('Failed to get generation statistics:', error);
      throw error;
    }
  }

  /**
   * Get token pool statistics (admin only)
   * DEPRECATED - Token pool system removed
   */
  async getTokenPoolStatistics() {
    return {
      totalTokens: 0,
      activeTokens: 0,
      healthyTokens: 0,
      message: 'Token pool system removed - using Music Lab API'
    };
  }


  /**
   * Get performance metrics (admin only)
   */
  async getPerformanceMetrics(period: string = '24h') {
    try {
      const startDate = this.getStartDate(period);

      const requests = await this.prisma.requestAnalytics.findMany({
        where: {
          timestamp: { gte: startDate }
        }
      });

      const averageResponseTime = requests.length > 0
        ? requests.reduce((sum, req) => sum + req.duration, 0) / requests.length
        : 0;

      const successRate = requests.length > 0
        ? (requests.filter(req => req.statusCode >= 200 && req.statusCode < 300).length / requests.length) * 100
        : 100;

      return {
        period,
        totalRequests: requests.length,
        averageResponseTime,
        successRate,
        requestsPerHour: requests.length / (this.getPeriodHours(period))
      };

    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get realtime metrics (admin only)
   */
  async getRealtimeMetrics() {
    try {
      const now = new Date();
      const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

      const [activeUsers, recentGenerations, recentRequests] = await Promise.all([
        this.prisma.user.count({
          where: {
            lastLoginAt: { gte: lastHour }
          }
        }),
        this.prisma.generationAnalytics.count({
          where: {
            timestamp: { gte: lastHour }
          }
        }),
        this.prisma.requestAnalytics.count({
          where: {
            timestamp: { gte: lastHour }
          }
        })
      ]);

      return {
        activeUsers,
        recentGenerations,
        recentRequests,
        timestamp: now
      };

    } catch (error) {
      console.error('Failed to get realtime metrics:', error);
      throw error;
    }
  }

  /**
   * Get active user count
   */
  /**
   * Get recent generations
   */
  async getRecentGenerations(hours: number = 24): Promise<any[]> {
    try {
      const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

      const generations = await this.prisma.generation.findMany({
        where: {
          createdAt: {
            gte: startDate
          }
        },
        select: {
          id: true,
          userId: true,
          status: true,
          createdAt: true,
          prompt: true,
          style: true,
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 1000
      });

      return generations;
    } catch (error) {
      console.error('Failed to get recent generations:', error);
      return [];
    }
  }

  async getActiveUserCount(): Promise<number> {
    try {
      const lastHour = new Date(Date.now() - 60 * 60 * 1000);

      return await this.prisma.user.count({
        where: {
          lastLoginAt: { gte: lastHour }
        }
      });
    } catch (error) {
      console.error('Failed to get active user count:', error);
      return 0;
    }
  }

  /**
   * Health check for analytics service
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Analytics service health check failed:', error);
      return false;
    }
  }

  /**
   * Get start date based on period
   */
  private getStartDate(period: string): Date {
    const now = new Date();

    switch (period) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Get period in hours
   */
  private getPeriodHours(period: string): number {
    switch (period) {
      case '1h':
        return 1;
      case '24h':
        return 24;
      case '7d':
        return 7 * 24;
      case '30d':
        return 30 * 24;
      case '90d':
        return 90 * 24;
      default:
        return 24;
    }
  }

  /**
   * Close service and cleanup
   */
  async close() {
    await this.prisma.$disconnect();
  }
}
