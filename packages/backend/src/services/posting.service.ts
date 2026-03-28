import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

export interface ScheduledPost {
    userId: string;
    content: string;
    platform: string;
    scheduledTime: Date;
    status: 'scheduled' | 'published' | 'failed';
    metadata?: any;
}

export class PostingService {
    private queue: Queue;
    private worker: Worker;
    private redisConnection: Redis;

    constructor() {
        // Use existing Redis connection or create new one
        this.redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
            maxRetriesPerRequest: null
        });

        this.queue = new Queue('nova-posting-queue', {
            connection: this.redisConnection
        });

        this.worker = new Worker('nova-posting-queue', this.processJob.bind(this), {
            connection: this.redisConnection
        });

        this.worker.on('completed', (job) => {
            console.log(`Job ${job.id} completed! Post published.`);
        });

        this.worker.on('failed', (job, err) => {
            console.error(`Job ${job?.id} failed: ${err.message}`);
        });
    }

    /**
     * Schedule a post for future publication
     */
    async schedulePost(post: ScheduledPost): Promise<string> {
        const delay = post.scheduledTime.getTime() - Date.now();

        if (delay < 0) {
            throw new Error('Cannot schedule post in the past');
        }

        const job = await this.queue.add('publish-post', post, {
            delay,
            removeOnComplete: true
        });

        return job.id || '';
    }

    /**
     * Process the publishing job (Simulation)
     */
    private async processJob(job: Job<ScheduledPost>): Promise<any> {
        const { content, platform, userId } = job.data;

        console.log(`🚀 Publishing to ${platform} for user ${userId}...`);
        console.log(`Content: ${content.substring(0, 50)}...`);

        // Simulate API latency
        await new Promise(resolve => setTimeout(resolve, 2000));

        // In a real app, we would call the platform's API here
        // await socialMediaApi.publish(platform, content, tokens);

        return { publishedAt: new Date(), platformId: 'simulated-id-123' };
    }

    /**
     * Get scheduled posts for a user (Mock implementation for now, ideally from DB)
     */
    async getScheduledPosts(userId: string): Promise<ScheduledPost[]> {
        // In a real implementation, we would query the database where we store the schedule
        // For now, we'll return a mock list + what's in the queue if possible
        // Note: BullMQ doesn't easily support querying by payload content (userId) without a separate DB

        return [];
    }

    async close() {
        await this.queue.close();
        await this.worker.close();
        await this.redisConnection.quit();
    }
}

export const postingService = new PostingService();
