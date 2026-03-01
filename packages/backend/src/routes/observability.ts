/**
 * Observability - Job Metadata & Metrics
 * Tracks compute tier, runtime, GPU usage, cache hit/miss
 */

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface JobMetrics {
  jobId: string;
  computeTier: string;
  userId?: string;
  userTier: string;
  queueTime: number;
  processTime: number;
  totalTime: number;
  gpuUsed: boolean;
  gpuMemory?: number;
  cacheHit: boolean;
  status: string;
  error?: string;
  endpoint: string;
}

export class JobObservability {
  /**
   * Record job metrics to database
   */
  static async recordMetrics(metrics: JobMetrics): Promise<void> {
    try {
      await prisma.jobMetrics.create({
        data: {
          jobId: metrics.jobId,
          computeTier: metrics.computeTier,
          userId: metrics.userId,
          userTier: metrics.userTier,
          queueTime: metrics.queueTime,
          processTime: metrics.processTime,
          totalTime: metrics.totalTime,
          gpuUsed: metrics.gpuUsed,
          gpuMemory: metrics.gpuMemory,
          cacheHit: metrics.cacheHit,
          status: metrics.status,
          error: metrics.error,
          endpoint: metrics.endpoint,
          createdAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to record metrics:', error);
    }
  }

  /**
   * Get job metrics
   */
  static async getJobMetrics(jobId: string): Promise<JobMetrics | null> {
    try {
      const metrics = await prisma.jobMetrics.findUnique({
        where: { jobId }
      });
      return metrics as JobMetrics | null;
    } catch (error) {
      console.error('Failed to get metrics:', error);
      return null;
    }
  }

  /**
   * Get aggregated stats
   */
  static async getAggregateStats(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalJobs: number;
    avgQueueTime: number;
    avgProcessTime: number;
    cacheHitRate: number;
    gpuUsage: number;
    jobsByTier: Record<string, number>;
    jobsByStatus: Record<string, number>;
    jobsByEndpoint: Record<string, number>;
  }> {
    try {
      const jobs = await prisma.jobMetrics.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const totalJobs = jobs.length;
      const avgQueueTime = jobs.reduce((sum, j) => sum + j.queueTime, 0) / totalJobs || 0;
      const avgProcessTime = jobs.reduce((sum, j) => sum + j.processTime, 0) / totalJobs || 0;
      const cacheHits = jobs.filter(j => j.cacheHit).length;
      const cacheHitRate = cacheHits / totalJobs || 0;
      const gpuUsed = jobs.filter(j => j.gpuUsed).length;
      const gpuUsage = gpuUsed / totalJobs || 0;

      const jobsByTier = jobs.reduce((acc, j) => {
        acc[j.computeTier] = (acc[j.computeTier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const jobsByStatus = jobs.reduce((acc, j) => {
        acc[j.status] = (acc[j.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const jobsByEndpoint = jobs.reduce((acc, j) => {
        acc[j.endpoint] = (acc[j.endpoint] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalJobs,
        avgQueueTime,
        avgProcessTime,
        cacheHitRate,
        gpuUsage,
        jobsByTier,
        jobsByStatus,
        jobsByEndpoint
      };
    } catch (error) {
      console.error('Failed to get aggregate stats:', error);
      return {
        totalJobs: 0,
        avgQueueTime: 0,
        avgProcessTime: 0,
        cacheHitRate: 0,
        gpuUsage: 0,
        jobsByTier: {},
        jobsByStatus: {},
        jobsByEndpoint: {}
      };
    }
  }

  /**
   * Get cost analysis
   */
  static async getCostAnalysis(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalComputeCost: number;
    gpuComputeMinutes: number;
    estimatedSavings: number;
    tierBreakdown: Record<string, { jobs: number; cost: number }>;
  }> {
    // Cost constants (example)
    const COSTS = {
      light_cpu: 0.001,  // per job
      medium_gpu: 0.05,   // per minute
      heavy_gpu: 0.15      // per minute
    };

    const stats = await this.getAggregateStats(startDate, endDate);

    const tierBreakdown: Record<string, { jobs: number; cost: number }> = {};
    let gpuComputeMinutes = 0;

    for (const [tier, jobs] of Object.entries(stats.jobsByTier)) {
      const cost = tier === 'light_cpu' 
        ? jobs * COSTS.light_cpu 
        : jobs * (stats.avgProcessTime / 60) * COSTS[tier as keyof typeof COSTS];
      
      tierBreakdown[tier] = { jobs, cost };
      
      if (tier !== 'light_cpu') {
        gpuComputeMinutes += jobs * (stats.avgProcessTime / 60);
      }
    }

    const totalComputeCost = Object.values(tierBreakdown).reduce(
      (sum, t) => sum + t.cost, 0
    );

    // Estimate savings from caching
    const cacheSavings = stats.cacheHitRate * totalComputeCost * 0.5;

    return {
      totalComputeCost,
      gpuComputeMinutes,
      estimatedSavings: cacheSavings,
      tierBreakdown
    };
  }

  /**
   * Get user tier usage
   */
  static async getUserTierUsage(
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, {
    jobs: number;
    avgTime: number;
    gpuUsage: number;
  }>> {
    try {
      const jobs = await prisma.jobMetrics.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      });

      const byTier = jobs.reduce((acc, j) => {
        const tier = j.userTier;
        if (!acc[tier]) {
          acc[tier] = { jobs: 0, totalTime: 0, gpuJobs: 0 };
        }
        acc[tier].jobs++;
        acc[tier].totalTime += j.totalTime;
        if (j.gpuUsed) acc[tier].gpuJobs++;

        return acc;
      }, {} as Record<string, { jobs: number; totalTime: number; gpuJobs: number }>);

      return Object.entries(byTier).reduce((acc, [tier, data]) => {
        acc[tier] = {
          jobs: data.jobs,
          avgTime: data.totalTime / data.jobs,
          gpuUsage: data.gpuJobs / data.jobs
        };
        return acc;
      }, {} as Record<string, { jobs: number; avgTime: number; gpuUsage: number }>);
    } catch (error) {
      console.error('Failed to get tier usage:', error);
      return {};
    }
  }

  /**
   * Register observability routes
   */
  static registerRoutes(fastify: FastifyInstance): void {
    // Get job metrics
    fastify.get('/api/observability/job/:jobId', async (request, reply) => {
      const { jobId } = request.params as { jobId: string };
      const metrics = await this.getJobMetrics(jobId);
      
      if (!metrics) {
        return reply.status(404).send({ error: 'Job not found' });
      }
      
      return metrics;
    });

    // Get aggregate stats
    fastify.get('/api/observability/stats', async (request, reply) => {
      const { start, end } = request.query as { start?: string; end?: string };
      
      const startDate = start ? new Date(start) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = end ? new Date(end) : new Date();
      
      const stats = await this.getAggregateStats(startDate, endDate);
      return stats;
    });

    // Get cost analysis
    fastify.get('/api/observability/costs', async (request, reply) => {
      const { start, end } = request.query as { start?: string; end?: string };
      
      const startDate = start ? new Date(start) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = end ? new Date(end) : new Date();
      
      const costs = await this.getCostAnalysis(startDate, endDate);
      return costs;
    });

    // Get tier usage
    fastify.get('/api/observability/tiers', async (request, reply) => {
      const { start, end } = request.query as { start?: string; end?: string };
      
      const startDate = start ? new Date(start) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = end ? new Date(end) : new Date();
      
      const usage = await this.getUserTierUsage(startDate, endDate);
      return usage;
    });
  }
}

export default JobObservability;
