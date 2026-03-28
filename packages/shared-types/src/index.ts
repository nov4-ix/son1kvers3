/**
 * Shared TypeScript types for Super-Son1k platform
 * Centralized type definitions to replace all `any` usage
 */

// ============================================
// Music Generation Types
// ============================================

export interface MusicTrack {
  id: string;
  prompt: string;
  audioUrl: string;
  audio_url?: string; // Alternative field name from API
  createdAt: string | Date | any; // Firestore Timestamp
  userId?: string;
  duration?: number;
  status?: TrackStatus;
  title?: string;
  style?: string;
  genre?: string;
  mood?: string;
  bpm?: number;
  key?: string;
  complexity?: number;
  generationId?: string;
  sunoId?: string;
  taskId?: string;
}

export type TrackStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'error' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'ERROR';

export interface GenerationRequest {
  prompt: string;
  lyrics?: string;
  style?: string;
  duration?: number;
  quality?: 'standard' | 'premium' | 'ultra';
  voice?: 'male' | 'female' | 'random' | 'duet';
  instrumental?: boolean;
  customMode?: boolean;
  userId?: string;
  tempo?: number;
  key?: string;
  genre?: string;
  mood?: string;
  complexity?: number;
}

export interface GenerationResult {
  status: TrackStatus;
  generationId?: string;
  sunoId?: string;
  taskId?: string;
  audioUrl?: string;
  audioUrls?: string[];
  error?: string;
  estimatedTime?: number;
  message?: string;
}

// ============================================
// Cover Generation Types
// ============================================

export interface CoverResult {
  status: string;
  taskId?: string;
  audio_url?: string;
  error?: string;
  running?: boolean;
}

export interface CoverRequest {
  audioFile: File;
  prompt: string;
  style?: string;
  customMode?: boolean;
}

// ============================================
// Prompt Builder Types
// ============================================

export interface PromptData {
  prompt: string;
  style?: string;
  title?: string;
  negativePrompt?: string;
  metadata?: Record<string, unknown>;
}

export interface AudioAnalysis {
  bpm: number;
  key: string;
  scale: string;
  genre: string;
  energy?: number;
  duration?: number;
  waveform?: number[];
}

export interface KnobSettings {
  emotionalIntensity?: number;
  poeticStyle?: number;
  rhymeComplexity?: number;
  narrativeDepth?: number;
  languageStyle?: number;
  themeIntensity?: number;
  [key: string]: number | undefined;
}

// ============================================
// Generator Data Types
// ============================================

export interface GeneratorData {
  generatedAudio?: string;
  style?: string;
  prompt?: string;
  trackId?: string;
  [key: string]: unknown;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  lastDoc?: unknown; // Firestore DocumentSnapshot
}

// ============================================
// Error Types
// ============================================

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: unknown;
}

// ============================================
// User Types
// ============================================

export interface User {
  id: string;
  email: string;
  tier?: 'free' | 'pro' | 'premium' | 'enterprise';
  createdAt?: string | Date;
}

// ============================================
// Service Configuration Types
// ============================================

export interface MusicServiceConfig {
  backendUrl: string;
  backendSecret: string;
}

