// Generation Worker - Music Lab Integration
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import MusicGenerationService from '../services/musicGenerationService';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection: any = null;

const prisma = new PrismaClient();
let musicGenerationService: MusicGenerationService;

export function setGlobalInstances(mgs: MusicGenerationService) {
  musicGenerationService = mgs;
}

if (!musicGenerationService) {
  musicGenerationService = new MusicGenerationService(prisma);
}

const BASE_URL = process.env.MUSIC_LAB_URL || 'http://localhost:8001';
const MAX_RETRIES = 2;

let worker: Worker;

async function generateSongStructure(prompt: string, userStyle: string): Promise<{ title: string; lyrics: string; style: string }> {
    return {
        title: '',
        lyrics: '',
        style: userStyle
    };
}

async function processJob(job: Job) {
    const { generationId, prompt, params } = job.data;
    
    console.log(`Processing generation: ${generationId}`);
    
    try {
        await prisma.generation.update({
            where: { id: generationId },
            data: { status: 'processing' }
        });

        const response = await axios.post(
            `${BASE_URL}/generate/complete`,
            {
                job_id: generationId,
                prompt,
                genre: params.genre || 'pop',
                duration: params.duration || 180,
                quality: params.quality || 'high',
                include_vocals: params.includeVocals || false,
                lyrics: params.lyrics,
                voice_clone_id: params.voiceCloneId,
                include_harmonies: params.includeHarmonies || false,
                vocal_style: params.vocalStyle || 'emotional',
                user_tier: params.userTier || 'FREE'
            },
            { timeout: 600000 }
        );

        const { job_id, status } = response.data;

        await prisma.generation.update({
            where: { id: generationId },
            data: { 
                status: status === 'completed' ? 'completed' : 'processing',
                audioUrl: response.data.audio_url
            }
        });

        return { success: true, jobId: job_id };

    } catch (error) {
        console.error(`Generation failed: ${generationId}`, error);
        
        await prisma.generation.update({
            where: { id: generationId },
            data: { 
                status: 'failed',
                error: error instanceof Error ? error.message : 'Generation failed'
            }
        });

        throw error;
    }
}

export function startGenerationWorker() {
    try {
        worker = new Worker('music-generation', async (job) => {
            return await processJob(job);
        }, {
            connection,
            concurrency: 5,
            limiter: {
                max: 10,
                duration: 60000
            }
        });

        worker.on('completed', (job) => {
            console.log(`Job ${job.id} completed`);
        });

        worker.on('failed', (job, err) => {
            console.error(`Job ${job?.id} failed:`, err.message);
        });

        console.log('Generation Worker started');
    } catch (error) {
        console.warn('Failed to start Generation Worker:', error);
    }
}

export function stopGenerationWorker() {
    if (worker) {
        worker.close();
        console.log('Generation Worker stopped');
    }
}
