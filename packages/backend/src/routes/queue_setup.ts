/**
 * Queue Setup - BullMQ Configuration
 * Configures job queues for each compute tier
 */

import { Queue, Worker, FlowProducer, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { ComputeTier, ComputeJob, JobStatus } from './compute_router';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export interface QueueConfig {
  name: string;
  tier: ComputeTier;
  connection: Redis;
  defaultJobOptions: {
    attempts: number;
    backoff: {
      type: 'exponential';
      delay: number;
    };
    removeOnComplete: { count: number };
    removeOnFail: { count: number };
  };
  limiter?: {
    max: number;
    duration: number;
  };
}

export const QUEUE_CONFIGS: Record<ComputeTier, QueueConfig> = {
  [ComputeTier.LIGHT_CPU]: {
    name: 'light-cpu-queue',
    tier: ComputeTier.LIGHT_CPU,
    connection: new Redis(REDIS_URL),
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 200 }
    },
    limiter: {
      max: 50,
      duration: 1000 // 50 jobs per second
    }
  },
  [ComputeTier.MEDIUM_GPU]: {
    name: 'medium-gpu-queue',
    tier: ComputeTier.MEDIUM_GPU,
    connection: new Redis(REDIS_URL),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 100 }
    },
    limiter: {
      max: 10,
      duration: 60000 // 10 jobs per minute
    }
  },
  [ComputeTier.HEAVY_GPU]: {
    name: 'heavy-gpu-queue',
    tier: ComputeTier.HEAVY_GPU,
    connection: new Redis(REDIS_URL),
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'exponential', delay: 30000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 }
    },
    limiter: {
      max: 2,
      duration: 60000 // 2 jobs per minute
    }
  }
};

export class QueueManager {
  private queues: Map<ComputeTier, Queue>;
  private workers: Map<ComputeTier, Worker>;
  private flowProducer: FlowProducer;
  private queueEvents: Map<ComputeTier, QueueEvents>;

  constructor() {
    this.queues = new Map();
    this.workers = new Map();
    this.flowProducer = new FlowProducer({ connection: new Redis(REDIS_URL) });
    this.queueEvents = new Map();
  }

  /**
   * Initialize all queues
   */
  async initialize(): Promise<void> {
    for (const [tier, config] of Object.entries(QUEUE_CONFIGS)) {
      // Create queue
      const queue = new Queue(config.name, {
        connection: config.connection,
        defaultJobOptions: config.defaultJobOptions,
        limiter: config.limiter
      });
      this.queues.set(tier as ComputeTier, queue);

      // Create queue events
      const events = new QueueEvents(config.name, {
        connection: config.connection
      });
      this.queueEvents.set(tier as ComputeTier, events);
    }
  }

  /**
   * Get queue for compute tier
   */
  getQueue(tier: ComputeTier): Queue | undefined {
    return this.queues.get(tier);
  }

  /**
   * Add job to queue
   */
  async addJob(
    tier: ComputeTier,
    jobName: string,
    data: ComputeJob,
    options?: {
      priority?: number;
      delay?: number;
      repeat?: { pattern: string };
    }
  ): Promise<void> {
    const queue = this.queues.get(tier);
    if (!queue) {
      throw new Error(`Queue not found for tier: ${tier}`);
    }

    await queue.add(jobName, data, {
      priority: options?.priority,
      delay: options?.delay,
      repeat: options?.repeat
    });
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<Record<ComputeTier, {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }>> {
    const stats: Record<ComputeTier, any> = {
      [ComputeTier.LIGHT_CPU]: { waiting: 0, active: 0, completed: 0, failed: 0 },
      [ComputeTier.MEDIUM_GPU]: { waiting: 0, active: 0, completed: 0, failed: 0 },
      [ComputeTier.HEAVY_GPU]: { waiting: 0, active: 0, completed: 0, failed: 0 }
    };

    for (const [tier this.queues), queue] of {
      const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed');
      stats[tier] = counts;
    }

    return stats;
  }

  /**
   * Pause queue
   */
  async pauseQueue(tier: ComputeTier): Promise<void> {
    const queue = this.queues.get(tier);
    if (queue) {
      await queue.pause();
    }
  }

  /**
   * Resume queue
   */
  async resumeQueue(tier: ComputeTier): Promise<void> {
    const queue = this.queues.get(tier);
    if (queue) {
      await queue.resume();
    }
  }

  /**
   * Drain queue (process all waiting jobs)
   */
  async drainQueue(tier: ComputeTier): Promise<void> {
    const queue = this.queues.get(tier);
    if (queue) {
      await queue.drain();
    }
  }

  /**
   * Clean old jobs
   */
  async cleanOldJobs(
    tier: ComputeTier,
    grace: number = 86400000, // 24 hours
    status: 'completed' | 'failed' = 'completed'
  ): Promise<number> {
    const queue = this.queues.get(tier);
    if (!queue) return 0;

    const jobs = await queue.clean(grace, 100, status);
    return jobs.length;
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    for (const worker of this.workers.values()) {
      await worker.close();
    }
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    for (const events of this.queueEvents.values()) {
      await events.close();
    }
    await this.flowProducer.close();
  }
}

// Singleton
let queueManager: QueueManager | null = null;

export function getQueueManager(): QueueManager {
  if (!queueManager) {
    queueManager = new QueueManager();
  }
  return queueManager;
}

export default QueueManager;
