/**
 * Generation Queue
 * BullMQ queue for asynchronous music generation
 * Supports priority by user tier and retry logic
 */
import { Queue, QueueOptions } from 'bullmq';
import Redis from 'ioredis';

// Redis connection for queue - DISABLED FOR LOCAL DEV
// Uncomment when Redis is available
/*
const redisConnection = new Redis(process.env.REDIS_URL || process.env.REDIS_HOST || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});
*/
const redisConnection: any = null; // Placeholder for local dev without Redis

// Queue configuration
const queueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2s, then 4s, then 8s
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 10000, // Increased from 1000 to 10000 for scale
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
      count: 5000, // Increased from 500 to 5000 for scale
    },
  },
};

// Create generation queue
export const generationQueue = new Queue('generation', queueOptions);

/**
 * Get job priority based on user tier
 * Lower number = higher priority
 */
export function getJobPriority(tier: string): number {
  switch (tier?.toUpperCase()) {
    case 'ENTERPRISE':
      return 1;
    case 'PREMIUM':
      return 5;
    case 'PRO':
      return 10;
    case 'FREE':
    default:
      return 20;
  }
}

/**
 * Add generation job to queue
 */
export interface GenerationJobData {
  generationId: string;
  userId: string; // Required - all generations must be associated with a user
  prompt: string;
  style?: string;
  duration?: number;
  quality?: string;
  tier?: string;
}

export async function addGenerationJob(data: GenerationJobData) {
  if (!data.userId) {
    throw new Error('userId is required for all generations');
  }

  return await generationQueue.add(
    'generate',
    {
      generationId: data.generationId,
      userId: data.userId,
      prompt: data.prompt,
      style: data.style || 'pop',
      duration: data.duration || 60,
      quality: data.quality || 'standard',
    },
    {
      priority: getJobPriority(data.tier || 'FREE'),
      jobId: data.generationId, // Use generationId as jobId for idempotency
      delay: 0, // Process immediately
    }
  );
}

/**
 * Get job status
 */
export async function getJobStatus(generationId: string) {
  const job = await generationQueue.getJob(generationId);
  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress as number || 0;

  return {
    id: job.id,
    state,
    progress,
    data: job.data,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason,
  };
}

/**
 * Cancel job
 */
export async function cancelJob(generationId: string) {
  const job = await generationQueue.getJob(generationId);
  if (job) {
    await job.remove();
    return true;
  }
  return false;
}

/**
 * Get queue stats
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    generationQueue.getWaitingCount(),
    generationQueue.getActiveCount(),
    generationQueue.getCompletedCount(),
    generationQueue.getFailedCount(),
    generationQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

/**
 * Cleanup queue connection
 */
export async function closeQueue() {
  await generationQueue.close();
  await redisConnection.quit();
}

