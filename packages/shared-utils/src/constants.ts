/**
 * Constants for Super-Son1k-2.0
 */

export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production'
} as const;

export const API = {
  VERSION: '2.0.0',
  BASE_URL: '/api',
  TIMEOUT: 30000
} as const;

export const RATE_LIMITS = {
  FREE: 10,
  PREMIUM: 100,
  ENTERPRISE: 1000
} as const;

export const TIERS = {
  FREE: 'FREE',
  PRO: 'PRO',
  PREMIUM: 'PREMIUM',
  ENTERPRISE: 'ENTERPRISE'
} as const;

export const GENERATION_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
} as const;

export const COLLABORATION_ROLES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER'
} as const;

export const NFT_STATUS = {
  DRAFT: 'DRAFT',
  LISTED: 'LISTED',
  SOLD: 'SOLD',
  DELISTED: 'DELISTED'
} as const;

export const ANALYTICS_EVENTS = {
  USER_REGISTERED: 'user_registered',
  USER_LOGIN: 'user_login',
  GENERATION_STARTED: 'generation_started',
  GENERATION_COMPLETED: 'generation_completed',
  GENERATION_FAILED: 'generation_failed',
  TOKEN_ADDED: 'token_added',
  TOKEN_REMOVED: 'token_removed',
  COLLABORATION_CREATED: 'collaboration_created',
  NFT_CREATED: 'nft_created',
  NFT_SOLD: 'nft_sold'
} as const;

export const AUDIO_FORMATS = {
  MP3: 'mp3',
  WAV: 'wav',
  FLAC: 'flac',
  AAC: 'aac'
} as const;

export const IMAGE_FORMATS = {
  JPEG: 'jpeg',
  PNG: 'png',
  WEBP: 'webp',
  SVG: 'svg'
} as const;

export const VIDEO_FORMATS = {
  MP4: 'mp4',
  WEBM: 'webm',
  MOV: 'mov'
} as const;

export const MUSICAL_KEYS = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
] as const;

export const MUSICAL_GENRES = [
  'pop', 'rock', 'electronic', 'classical', 'jazz', 'hip-hop', 'ambient',
  'country', 'blues', 'folk', 'reggae', 'funk', 'soul', 'r&b', 'metal',
  'punk', 'indie', 'alternative', 'experimental', 'world', 'latin'
] as const;

export const MUSICAL_MOODS = [
  'happy', 'sad', 'energetic', 'calm', 'aggressive', 'peaceful', 'romantic',
  'melancholic', 'uplifting', 'dark', 'bright', 'mysterious', 'nostalgic',
  'dramatic', 'playful', 'serious', 'dreamy', 'intense', 'relaxed'
] as const;

export const INSTRUMENTS = [
  'piano', 'guitar', 'drums', 'bass', 'violin', 'synthesizer', 'saxophone',
  'trumpet', 'flute', 'cello', 'viola', 'harp', 'organ', 'keyboard',
  'electric-guitar', 'acoustic-guitar', 'bass-guitar', 'drum-kit',
  'percussion', 'strings', 'brass', 'woodwinds'
] as const;

export const MUSICAL_STYLES = [
  'modern', 'classical', 'electronic', 'acoustic', 'orchestral', 'minimalist',
  'maximalist', 'ambient', 'cinematic', 'experimental', 'fusion', 'traditional',
  'contemporary', 'retro', 'futuristic', 'organic', 'synthetic', 'hybrid'
] as const;

export const FILE_SIZE_LIMITS = {
  AUDIO: 50 * 1024 * 1024, // 50MB
  IMAGE: 10 * 1024 * 1024, // 10MB
  VIDEO: 100 * 1024 * 1024, // 100MB
  DOCUMENT: 5 * 1024 * 1024 // 5MB
} as const;

export const SUPPORTED_LANGUAGES = [
  'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'
] as const;

export const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London',
  'Europe/Paris', 'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney'
] as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const;

export const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400 // 24 hours
} as const;

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_OFFSET: 0
} as const;

export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
} as const;

export const PERMISSIONS = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  ADMIN: 'admin'
} as const;
