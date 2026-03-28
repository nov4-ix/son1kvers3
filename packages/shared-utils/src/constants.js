"use strict";
/**
 * Constants for Super-Son1k-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERMISSIONS = exports.NOTIFICATION_TYPES = exports.PAGINATION = exports.CACHE_TTL = exports.HTTP_STATUS = exports.TIMEZONES = exports.SUPPORTED_LANGUAGES = exports.FILE_SIZE_LIMITS = exports.MUSICAL_STYLES = exports.INSTRUMENTS = exports.MUSICAL_MOODS = exports.MUSICAL_GENRES = exports.MUSICAL_KEYS = exports.VIDEO_FORMATS = exports.IMAGE_FORMATS = exports.AUDIO_FORMATS = exports.ANALYTICS_EVENTS = exports.NFT_STATUS = exports.COLLABORATION_ROLES = exports.GENERATION_STATUS = exports.TIERS = exports.RATE_LIMITS = exports.API = exports.ENVIRONMENTS = void 0;
exports.ENVIRONMENTS = {
    DEVELOPMENT: 'development',
    STAGING: 'staging',
    PRODUCTION: 'production'
};
exports.API = {
    VERSION: '2.0.0',
    BASE_URL: '/api',
    TIMEOUT: 30000
};
exports.RATE_LIMITS = {
    FREE: 10,
    PREMIUM: 100,
    ENTERPRISE: 1000
};
exports.TIERS = {
    FREE: 'FREE',
    PRO: 'PRO',
    PREMIUM: 'PREMIUM',
    ENTERPRISE: 'ENTERPRISE'
};
exports.GENERATION_STATUS = {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED'
};
exports.COLLABORATION_ROLES = {
    OWNER: 'OWNER',
    ADMIN: 'ADMIN',
    MEMBER: 'MEMBER'
};
exports.NFT_STATUS = {
    DRAFT: 'DRAFT',
    LISTED: 'LISTED',
    SOLD: 'SOLD',
    DELISTED: 'DELISTED'
};
exports.ANALYTICS_EVENTS = {
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
};
exports.AUDIO_FORMATS = {
    MP3: 'mp3',
    WAV: 'wav',
    FLAC: 'flac',
    AAC: 'aac'
};
exports.IMAGE_FORMATS = {
    JPEG: 'jpeg',
    PNG: 'png',
    WEBP: 'webp',
    SVG: 'svg'
};
exports.VIDEO_FORMATS = {
    MP4: 'mp4',
    WEBM: 'webm',
    MOV: 'mov'
};
exports.MUSICAL_KEYS = [
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];
exports.MUSICAL_GENRES = [
    'pop', 'rock', 'electronic', 'classical', 'jazz', 'hip-hop', 'ambient',
    'country', 'blues', 'folk', 'reggae', 'funk', 'soul', 'r&b', 'metal',
    'punk', 'indie', 'alternative', 'experimental', 'world', 'latin'
];
exports.MUSICAL_MOODS = [
    'happy', 'sad', 'energetic', 'calm', 'aggressive', 'peaceful', 'romantic',
    'melancholic', 'uplifting', 'dark', 'bright', 'mysterious', 'nostalgic',
    'dramatic', 'playful', 'serious', 'dreamy', 'intense', 'relaxed'
];
exports.INSTRUMENTS = [
    'piano', 'guitar', 'drums', 'bass', 'violin', 'synthesizer', 'saxophone',
    'trumpet', 'flute', 'cello', 'viola', 'harp', 'organ', 'keyboard',
    'electric-guitar', 'acoustic-guitar', 'bass-guitar', 'drum-kit',
    'percussion', 'strings', 'brass', 'woodwinds'
];
exports.MUSICAL_STYLES = [
    'modern', 'classical', 'electronic', 'acoustic', 'orchestral', 'minimalist',
    'maximalist', 'ambient', 'cinematic', 'experimental', 'fusion', 'traditional',
    'contemporary', 'retro', 'futuristic', 'organic', 'synthetic', 'hybrid'
];
exports.FILE_SIZE_LIMITS = {
    AUDIO: 50 * 1024 * 1024, // 50MB
    IMAGE: 10 * 1024 * 1024, // 10MB
    VIDEO: 100 * 1024 * 1024, // 100MB
    DOCUMENT: 5 * 1024 * 1024 // 5MB
};
exports.SUPPORTED_LANGUAGES = [
    'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'
];
exports.TIMEZONES = [
    'UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London',
    'Europe/Paris', 'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney'
];
exports.HTTP_STATUS = {
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
};
exports.CACHE_TTL = {
    SHORT: 300, // 5 minutes
    MEDIUM: 1800, // 30 minutes
    LONG: 3600, // 1 hour
    VERY_LONG: 86400 // 24 hours
};
exports.PAGINATION = {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    DEFAULT_OFFSET: 0
};
exports.NOTIFICATION_TYPES = {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error'
};
exports.PERMISSIONS = {
    READ: 'read',
    WRITE: 'write',
    DELETE: 'delete',
    ADMIN: 'admin'
};
//# sourceMappingURL=constants.js.map