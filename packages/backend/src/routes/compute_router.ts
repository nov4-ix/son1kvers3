/**
 * Compute Router - Cost-Aware Job Routing Layer
 * Routes jobs to appropriate compute tiers based on complexity
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import crypto from 'crypto';

export enum ComputeTier {
  LIGHT_CPU = 'light_cpu',
  MEDIUM_GPU = 'medium_gpu',
  HEAVY_GPU = 'heavy_gpu'
}

export enum JobPriority {
  LOW = 1,
  STANDARD = 2,
  HIGH = 3
}

export enum JobStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface ComputeJob {
  id: string;
  type: string;
  tier: ComputeTier;
  priority: JobPriority;
  userId?: string;
  tier: 'free' | 'basic' | 'pro' | 'enterprise';
  payload: Record<string, unknown>;
  status: JobStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: Record<string, unknown>;
  error?: string;
  computeTier: ComputeTier;
  runtime?: number;
  gpuUsed?: boolean;
  cacheHit?: boolean;
}

export interface ComputeRoute {
  endpoint: string;
  tier: ComputeTier;
  requiresAuth: boolean;
  cacheable: boolean;
  batchable: boolean;
  priority: JobPriority;
}

export class ComputeRouter {
  private redis: Redis;
  private queues: Map<ComputeTier, Queue>;
  private routes: Map<string, ComputeRoute>;

  constructor(redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379') {
    this.redis = new Redis(redisUrl);
    this.queues = new Map();
    this.routes = new Map();
    this.initializeRoutes();
    this.initializeQueues(redisUrl);
  }

  private initializeRoutes(): void {
    // LIGHT_CPU - Fast analysis tasks
    this.routes.set('POST:/api/analyze', {
      endpoint: 'POST:/api/analyze',
      tier: ComputeTier.LIGHT_CPU,
      requiresAuth: true,
      cacheable: true,
      batchable: false,
      priority: JobPriority.STANDARD
    });

    this.routes.set('POST:/api/preprocess', {
      endpoint: 'POST:/api/preprocess',
      tier: ComputeTier.LIGHT_CPU,
      requiresAuth: true,
      cacheable: true,
      batchable: false,
      priority: JobPriority.HIGH
    });

    // MEDIUM_GPU - Music generation and low-fidelity remix
    this.routes.set('POST:/api/generate', {
      endpoint: 'POST:/api/generate',
      tier: ComputeTier.MEDIUM_GPU,
      requiresAuth: true,
      cacheable: true,
      batchable: true,
      priority: JobPriority.STANDARD
    });

    this.routes.set('POST:/api/remix', {
      endpoint: 'POST:/api/remix',
      tier: ComputeTier.MEDIUM_GPU,
      requiresAuth: true,
      cacheable: false,
      batchable: true,
      priority: JobPriority.STANDARD
    });

    // HEAVY_GPU - Voice cloning, stem separation, high-fidelity remix
    this.routes.set('POST:/api/voice/clone', {
      endpoint: 'POST:/api/voice/clone',
      tier: ComputeTier.HEAVY_GPU,
      requiresAuth: true,
      cacheable: false,
      batchable: true,
      priority: JobPriority.STANDARD
    });

    this.routes.set('POST:/api/voice/finetune', {
      endpoint: 'POST:/api/voice/finetune',
      tier: ComputeTier.HEAVY_GPU,
      requiresAuth: true,
      cacheable: false,
      batchable: false,
      priority: JobPriority.LOW
    });

    this.routes.set('POST:/api/stems/separate', {
      endpoint: 'POST:/api/stems/separate',
      tier: ComputeTier.HEAVY_GPU,
      requiresAuth: true,
      cacheable: true,
      batchable: true,
      priority: JobPriority.STANDARD
    });
  }

  private async initializeQueues(redisUrl: string): Promise<void> {
    const connection = new Redis(redisUrl);

    // Initialize queues for each tier
    this.queues.set(ComputeTier.LIGHT_CPU, new Queue('light-cpu-queue', { connection }));
    this.queues.set(ComputeTier.MEDIUM_GPU, new Queue('medium-gpu-queue', { connection }));
    this.queues.set(ComputeTier.HEAVY_GPU, new Queue('heavy-gpu-queue', { connection }));
  }

  /**
   * Determine compute tier based on request
   */
  public determineTier(endpoint: string, payload: Record<string, unknown>): ComputeTier {
    const route = this.routes.get(endpoint);
    if (!route) return ComputeTier.MEDIUM_GPU;

    // Special routing logic for remix based on fidelity
    if (endpoint === 'POST:/api/remix' && payload.fidelity !== undefined) {
      const fidelity = Number(payload.fidelity);
      if (fidelity >= 70) return ComputeTier.HEAVY_GPU;
      return ComputeTier.MEDIUM_GPU;
    }

    return route.tier;
  }

  /**
   * Get priority based on user tier
   */
  public getPriority(userTier: string): JobPriority {
    switch (userTier) {
      case 'enterprise': return JobPriority.HIGH;
      case 'pro': return JobPriority.STANDARD;
      case 'basic': return JobPriority.STANDARD;
      default: return JobPriority.LOW;
    }
  }

  /**
   * Route a job to the appropriate queue
   */
  public async routeJob(
    endpoint: string,
    payload: Record<string, unknown>,
    userId?: string,
    userTier: string = 'free'
  ): Promise<ComputeJob> {
    const tier = this.determineTier(endpoint, payload);
    const priority = this.getPriority(userTier);
    const route = this.routes.get(endpoint);

    const job: ComputeJob = {
      id: crypto.randomUUID(),
      type: endpoint,
      tier: tier,
      priority,
      userId,
      tier: userTier as 'free' | 'basic' | 'pro' | 'enterprise',
      payload,
      status: JobStatus.QUEUED,
      createdAt: new Date(),
      computeTier: tier
    };

    // Add to appropriate queue
    const queue = this.queues.get(tier);
    if (!queue) {
      throw new Error(`Queue not found for tier: ${tier}`);
    }

    await queue.add(endpoint, job, {
      priority,
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 500 }
    });

    // Store job metadata in Redis
    await this.redis.setex(
      `job:${job.id}`,
      86400, // 24 hours
      JSON.stringify(job)
    );

    return job;
  }

  /**
   * Get job status
   */
  public async getJobStatus(jobId: string): Promise<ComputeJob | null> {
    const data = await this.redis.get(`job:${jobId}`);
    if (!data) return null;
    return JSON.parse(data) as ComputeJob;
  }

  /**
   * Update job status
   */
  public async updateJobStatus(
    jobId: string,
    status: JobStatus,
    result?: Record<string, unknown>,
    error?: string
  ): Promise<void> {
    const job = await this.getJobStatus(jobId);
    if (!job) return;

    job.status = status;
    if (status === JobStatus.PROCESSING) {
      job.startedAt = new Date();
    }
    if (status === JobStatus.COMPLETED || status === JobStatus.FAILED) {
      job.completedAt = new Date();
      job.runtime = job.completedAt.getTime() - job.createdAt.getTime();
    }
    if (result) job.result = result;
    if (error) job.error = error;

    await this.redis.setex(`job:${jobId}`, 86400, JSON.stringify(job));
  }

  /**
   * Generate cache key for job
   */
  public generateCacheKey(type: string, payload: Record<string, unknown>): string {
    const hash = crypto.createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');
    return `cache:${type}:${hash.substring(0, 16)}`;
  }

  /**
   * Check if job is cacheable
   */
  public isCacheable(endpoint: string): boolean {
    const route = this.routes.get(endpoint);
    return route?.cacheable ?? false;
  }

  /**
   * Get queue stats
   */
  public async getQueueStats(): Promise<Record<ComputeTier, { waiting: number; active: number }>> {
    const stats: Record<ComputeTier, { waiting: number; active: number }> = {
      [ComputeTier.LIGHT_CPU]: { waiting: 0, active: 0 },
      [ComputeTier.MEDIUM_GPU]: { waiting: 0, active: 0 },
      [ComputeTier.HEAVY_GPU]: { waiting: 0, active: 0 }
    };

    for (const [tier, queue] of this.queues) {
      const counts = await queue.getJobCounts('waiting', 'active');
      stats[tier] = { waiting: counts.waiting, active: counts.active };
    }

    return stats;
  }

  /**
   * Cleanup
   */
  public async disconnect(): Promise<void> {
    await this.redis.quit();
    for (const queue of this.queues.values()) {
      await queue.close();
    }
  }
}

// Singleton instance
let computeRouter: ComputeRouter | null = null;

export function getComputeRouter(): ComputeRouter {
  if (!computeRouter) {
    computeRouter = new ComputeRouter();
  }
  return computeRouter;
}

export default ComputeRouter;
