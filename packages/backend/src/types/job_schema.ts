/**
 * Job Schema - Type Definitions for Compute Jobs
 */

import { z } from 'zod';

// ============================================
// ENUMS
// ============================================

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
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum UserTier {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

// ============================================
// BASE SCHEMAS
// ============================================

export const BaseJobSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  tier: z.nativeEnum(ComputeTier),
  priority: z.nativeEnum(JobPriority),
  status: z.nativeEnum(JobStatus),
  userId: z.string().optional(),
  userTier: z.nativeEnum(UserTier),
  createdAt: z.string().datetime(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  runtime: z.number().optional(),
  gpuUsed: z.boolean().optional(),
  cacheHit: z.boolean().optional(),
  error: z.string().optional()
});

export const JobMetadataSchema = z.object({
  computeTier: z.nativeEnum(ComputeTier),
  queueTime: z.number().optional(),
  processTime: z.number().optional(),
  gpuMemory: z.number().optional(),
  retryCount: z.number().optional(),
  batchSize: z.number().optional()
});

// ============================================
// ANALYZE JOB
// ============================================

export const AnalyzeJobPayloadSchema = z.object({
  audioUrl: z.string().url(),
  detectLyrics: z.boolean().default(true),
  separateStems: z.boolean().default(false),
  language: z.string().default('es')
});

export const AnalyzeJobResultSchema = z.object({
  analysisId: z.string(),
  duration: z.number(),
  bpm: z.number(),
  key: z.string(),
  genre: z.string(),
  hasVocals: z.boolean(),
  sections: z.number(),
  energy: z.number(),
  stems: z.record(z.string(), z.string()).optional()
});

// ============================================
// GENERATE JOB
// ============================================

export const GenerateJobPayloadSchema = z.object({
  prompt: z.string().min(1).max(1000),
  genre: z.string().default('electronic'),
  mood: z.string().default('energetic'),
  duration: z.number().min(10).max(180).default(60),
  language: z.string().default('en'),
  quality: z.enum(['standard', 'high', 'premium']).default('standard')
});

export const GenerateJobResultSchema = z.object({
  audioId: z.string(),
  audioUrl: z.string(),
  duration: z.number(),
  lufs: z.number(),
  qualityScore: z.number()
});

// ============================================
// REMIX JOB
// ============================================

export const RemixJobPayloadSchema = z.object({
  audioUrl: z.string().url(),
  fidelity: z.number().min(0).max(100),
  tier: z.nativeEnum(UserTier),
  language: z.string().default('es'),
  keepVocals: z.boolean().default(true)
});

export const RemixJobResultSchema = z.object({
  jobId: z.string(),
  outputUrl: z.string().optional(),
  stems: z.record(z.string(), z.string()).optional(),
  fidelity: z.number()
});

// ============================================
// VOICE CLONE JOB
// ============================================

export const VoiceCloneJobPayloadSchema = z.object({
  text: z.string().min(1).max(5000),
  voiceSampleUrl: z.string().url().optional(),
  engine: z.enum(['coqui', 'bark', 'xtts']).default('coqui'),
  language: z.string().default('es'),
  speed: z.number().min(0.5).max(2.0).default(1.0)
});

export const VoiceCloneJobResultSchema = z.object({
  voiceId: z.string(),
  audioUrl: z.string(),
  duration: z.number(),
  engine: z.string()
});

// ============================================
// FINE-TUNE JOB
// ============================================

export const FineTuneJobPayloadSchema = z.object({
  userId: z.string(),
  voiceSamples: z.array(z.string().url()).min(10).max(100),
  language: z.string().default('es')
});

export const FineTuneJobResultSchema = z.object({
  modelId: z.string(),
  modelPath: z.string(),
  trainingSteps: z.number()
});

// ============================================
// STEM SEPARATION JOB
// ============================================

export const StemSeparateJobPayloadSchema = z.object({
  audioUrl: z.string().url(),
  model: z.enum(['htdemucs', 'demucs']).default('htdemucs'),
  stems: z.array(z.enum(['drums', 'bass', 'other', 'vocals'])).default(['drums', 'bass', 'other', 'vocals'])
});

export const StemSeparateJobResultSchema = z.object({
  stems: z.record(z.string(), z.string()),
  audioDuration: z.number()
});

// ============================================
// JOB RESPONSE
// ============================================

export const JobResponseSchema = z.object({
  jobId: z.string(),
  status: z.nativeEnum(JobStatus),
  progress: z.number().min(0).max(1).optional(),
  result: z.record(z.unknown()).optional(),
  error: z.string().optional(),
  metadata: JobMetadataSchema.optional()
});

// ============================================
// TYPE EXPORTS
// ============================================

export type BaseJob = z.infer<typeof BaseJobSchema>;
export type JobMetadata = z.infer<typeof JobMetadataSchema>;
export type AnalyzeJobPayload = z.infer<typeof AnalyzeJobPayloadSchema>;
export type AnalyzeJobResult = z.infer<typeof AnalyzeJobResultSchema>;
export type GenerateJobPayload = z.infer<typeof GenerateJobPayloadSchema>;
export type GenerateJobResult = z.infer<typeof GenerateJobResultSchema>;
export type RemixJobPayload = z.infer<typeof RemixJobPayloadSchema>;
export type RemixJobResult = z.infer<typeof RemixJobResultSchema>;
export type VoiceCloneJobPayload = z.infer<typeof VoiceCloneJobPayloadSchema>;
export type VoiceCloneJobResult = z.infer<typeof VoiceCloneJobResultSchema>;
export type FineTuneJobPayload = z.infer<typeof FineTuneJobPayloadSchema>;
export type FineTuneJobResult = z.infer<typeof FineTuneJobResultSchema>;
export type StemSeparateJobPayload = z.infer<typeof StemSeparateJobPayloadSchema>;
export type StemSeparateJobResult = z.infer<typeof StemSeparateJobResultSchema>;
export type JobResponse = z.infer<typeof JobResponseSchema>;

// ============================================
// JOB TYPE MAPPING
// ============================================

export interface JobTypeMap {
  'analyze': { payload: AnalyzeJobPayload; result: AnalyzeJobResult };
  'generate': { payload: GenerateJobPayload; result: GenerateJobResult };
  'remix': { payload: RemixJobPayload; result: RemixJobResult };
  'voice_clone': { payload: VoiceCloneJobPayload; result: VoiceCloneJobResult };
  'voice_finetune': { payload: FineTuneJobPayload; result: FineTuneJobResult };
  'stem_separate': { payload: StemSeparateJobPayload; result: StemSeparateJobResult };
}

export type JobType = keyof JobTypeMap;
export type JobPayload<T extends JobType> = JobTypeMap[T]['payload'];
export type JobResult<T extends JobType> = JobTypeMap[T]['result'];
