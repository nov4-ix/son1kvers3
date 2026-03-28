/**
 * Audio utilities for Super-Son1k-2.0
 */
/**
 * Audio format validation
 */
export declare function isValidAudioFormat(format: string): boolean;
/**
 * Get audio format from filename
 */
export declare function getAudioFormat(filename: string): string | null;
/**
 * Validate audio duration
 */
export declare function isValidDuration(duration: number): boolean;
/**
 * Convert seconds to MM:SS format
 */
export declare function formatAudioDuration(seconds: number): string;
/**
 * Convert MM:SS format to seconds
 */
export declare function parseAudioDuration(durationString: string): number;
/**
 * Validate audio quality settings
 */
export declare function isValidQuality(quality: string): boolean;
/**
 * Get quality settings for audio generation
 */
export declare function getQualitySettings(quality: string): {
    bitrate: number;
    sampleRate: number;
    channels: number;
};
/**
 * Validate musical key
 */
export declare function isValidMusicalKey(key: string): boolean;
/**
 * Validate musical tempo
 */
export declare function isValidTempo(tempo: number): boolean;
/**
 * Validate musical genre
 */
export declare function isValidGenre(genre: string): boolean;
/**
 * Validate musical mood
 */
export declare function isValidMood(mood: string): boolean;
/**
 * Validate instruments
 */
export declare function isValidInstrument(instrument: string): boolean;
/**
 * Generate audio metadata
 */
export declare function generateAudioMetadata(params: {
    prompt: string;
    duration: number;
    quality: string;
    genre?: string;
    mood?: string;
    key?: string;
    tempo?: number;
    instruments?: string[];
}): Record<string, any>;
/**
 * Validate audio file size
 */
export declare function isValidAudioFileSize(sizeInBytes: number): boolean;
/**
 * Calculate estimated file size
 */
export declare function calculateAudioFileSize(duration: number, quality: string): number;
/**
 * Generate audio filename
 */
export declare function generateAudioFilename(prompt: string, format?: string): string;
/**
 * Parse audio filename
 */
export declare function parseAudioFilename(filename: string): {
    name: string;
    format: string;
    timestamp?: string;
};
/**
 * Validate audio URL
 */
export declare function isValidAudioUrl(url: string): boolean;
/**
 * Get audio format MIME type
 */
export declare function getAudioMimeType(format: string): string;
/**
 * Validate audio generation parameters
 */
export declare function validateAudioGenerationParams(params: any): {
    valid: boolean;
    errors: string[];
    data?: any;
};
//# sourceMappingURL=audio.d.ts.map