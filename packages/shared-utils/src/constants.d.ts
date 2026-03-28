/**
 * Constants for Super-Son1k-2.0
 */
export declare const ENVIRONMENTS: {
    readonly DEVELOPMENT: "development";
    readonly STAGING: "staging";
    readonly PRODUCTION: "production";
};
export declare const API: {
    readonly VERSION: "2.0.0";
    readonly BASE_URL: "/api";
    readonly TIMEOUT: 30000;
};
export declare const RATE_LIMITS: {
    readonly FREE: 10;
    readonly PREMIUM: 100;
    readonly ENTERPRISE: 1000;
};
export declare const TIERS: {
    readonly FREE: "FREE";
    readonly PRO: "PRO";
    readonly PREMIUM: "PREMIUM";
    readonly ENTERPRISE: "ENTERPRISE";
};
export declare const GENERATION_STATUS: {
    readonly PENDING: "PENDING";
    readonly PROCESSING: "PROCESSING";
    readonly COMPLETED: "COMPLETED";
    readonly FAILED: "FAILED";
};
export declare const COLLABORATION_ROLES: {
    readonly OWNER: "OWNER";
    readonly ADMIN: "ADMIN";
    readonly MEMBER: "MEMBER";
};
export declare const NFT_STATUS: {
    readonly DRAFT: "DRAFT";
    readonly LISTED: "LISTED";
    readonly SOLD: "SOLD";
    readonly DELISTED: "DELISTED";
};
export declare const ANALYTICS_EVENTS: {
    readonly USER_REGISTERED: "user_registered";
    readonly USER_LOGIN: "user_login";
    readonly GENERATION_STARTED: "generation_started";
    readonly GENERATION_COMPLETED: "generation_completed";
    readonly GENERATION_FAILED: "generation_failed";
    readonly TOKEN_ADDED: "token_added";
    readonly TOKEN_REMOVED: "token_removed";
    readonly COLLABORATION_CREATED: "collaboration_created";
    readonly NFT_CREATED: "nft_created";
    readonly NFT_SOLD: "nft_sold";
};
export declare const AUDIO_FORMATS: {
    readonly MP3: "mp3";
    readonly WAV: "wav";
    readonly FLAC: "flac";
    readonly AAC: "aac";
};
export declare const IMAGE_FORMATS: {
    readonly JPEG: "jpeg";
    readonly PNG: "png";
    readonly WEBP: "webp";
    readonly SVG: "svg";
};
export declare const VIDEO_FORMATS: {
    readonly MP4: "mp4";
    readonly WEBM: "webm";
    readonly MOV: "mov";
};
export declare const MUSICAL_KEYS: readonly ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export declare const MUSICAL_GENRES: readonly ["pop", "rock", "electronic", "classical", "jazz", "hip-hop", "ambient", "country", "blues", "folk", "reggae", "funk", "soul", "r&b", "metal", "punk", "indie", "alternative", "experimental", "world", "latin"];
export declare const MUSICAL_MOODS: readonly ["happy", "sad", "energetic", "calm", "aggressive", "peaceful", "romantic", "melancholic", "uplifting", "dark", "bright", "mysterious", "nostalgic", "dramatic", "playful", "serious", "dreamy", "intense", "relaxed"];
export declare const INSTRUMENTS: readonly ["piano", "guitar", "drums", "bass", "violin", "synthesizer", "saxophone", "trumpet", "flute", "cello", "viola", "harp", "organ", "keyboard", "electric-guitar", "acoustic-guitar", "bass-guitar", "drum-kit", "percussion", "strings", "brass", "woodwinds"];
export declare const MUSICAL_STYLES: readonly ["modern", "classical", "electronic", "acoustic", "orchestral", "minimalist", "maximalist", "ambient", "cinematic", "experimental", "fusion", "traditional", "contemporary", "retro", "futuristic", "organic", "synthetic", "hybrid"];
export declare const FILE_SIZE_LIMITS: {
    readonly AUDIO: number;
    readonly IMAGE: number;
    readonly VIDEO: number;
    readonly DOCUMENT: number;
};
export declare const SUPPORTED_LANGUAGES: readonly ["en", "es", "fr", "de", "it", "pt", "ru", "ja", "ko", "zh"];
export declare const TIMEZONES: readonly ["UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Tokyo", "Asia/Shanghai", "Australia/Sydney"];
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly ACCEPTED: 202;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly BAD_GATEWAY: 502;
    readonly SERVICE_UNAVAILABLE: 503;
    readonly GATEWAY_TIMEOUT: 504;
};
export declare const CACHE_TTL: {
    readonly SHORT: 300;
    readonly MEDIUM: 1800;
    readonly LONG: 3600;
    readonly VERY_LONG: 86400;
};
export declare const PAGINATION: {
    readonly DEFAULT_LIMIT: 20;
    readonly MAX_LIMIT: 100;
    readonly DEFAULT_OFFSET: 0;
};
export declare const NOTIFICATION_TYPES: {
    readonly INFO: "info";
    readonly SUCCESS: "success";
    readonly WARNING: "warning";
    readonly ERROR: "error";
};
export declare const PERMISSIONS: {
    readonly READ: "read";
    readonly WRITE: "write";
    readonly DELETE: "delete";
    readonly ADMIN: "admin";
};
//# sourceMappingURL=constants.d.ts.map