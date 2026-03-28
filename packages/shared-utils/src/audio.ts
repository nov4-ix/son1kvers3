/**
 * Audio utilities for Super-Son1k-2.0
 */

/**
 * Audio format validation
 */
export function isValidAudioFormat(format: string): boolean {
  const validFormats = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'];
  return validFormats.includes(format.toLowerCase());
}

/**
 * Get audio format from filename
 */
export function getAudioFormat(filename: string): string | null {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension && isValidAudioFormat(extension) ? extension : null;
}

/**
 * Validate audio duration
 */
export function isValidDuration(duration: number): boolean {
  return duration > 0 && duration <= 600; // Max 10 minutes
}

/**
 * Convert seconds to MM:SS format
 */
export function formatAudioDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Convert MM:SS format to seconds
 */
export function parseAudioDuration(durationString: string): number {
  const parts = durationString.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid duration format. Use MM:SS');
  }
  
  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);
  
  if (isNaN(minutes) || isNaN(seconds) || minutes < 0 || seconds < 0 || seconds >= 60) {
    throw new Error('Invalid duration values');
  }
  
  return minutes * 60 + seconds;
}

/**
 * Validate audio quality settings
 */
export function isValidQuality(quality: string): boolean {
  const validQualities = ['standard', 'high', 'premium', 'enterprise'];
  return validQualities.includes(quality.toLowerCase());
}

/**
 * Get quality settings for audio generation
 */
export function getQualitySettings(quality: string): {
  bitrate: number;
  sampleRate: number;
  channels: number;
} {
  const settings = {
    standard: { bitrate: 128, sampleRate: 44100, channels: 2 },
    high: { bitrate: 256, sampleRate: 44100, channels: 2 },
    premium: { bitrate: 320, sampleRate: 48000, channels: 2 },
    enterprise: { bitrate: 320, sampleRate: 96000, channels: 2 }
  };
  
  return settings[quality.toLowerCase() as keyof typeof settings] || settings.standard;
}

/**
 * Validate musical key
 */
export function isValidMusicalKey(key: string): boolean {
  const validKeys = [
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
    'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'
  ];
  return validKeys.includes(key);
}

/**
 * Validate musical tempo
 */
export function isValidTempo(tempo: number): boolean {
  return tempo >= 60 && tempo <= 200;
}

/**
 * Validate musical genre
 */
export function isValidGenre(genre: string): boolean {
  const validGenres = [
    'pop', 'rock', 'electronic', 'classical', 'jazz', 'hip-hop', 'ambient',
    'country', 'blues', 'folk', 'reggae', 'funk', 'soul', 'r&b', 'metal',
    'punk', 'indie', 'alternative', 'experimental', 'world', 'latin'
  ];
  return validGenres.includes(genre.toLowerCase());
}

/**
 * Validate musical mood
 */
export function isValidMood(mood: string): boolean {
  const validMoods = [
    'happy', 'sad', 'energetic', 'calm', 'aggressive', 'peaceful', 'romantic',
    'melancholic', 'uplifting', 'dark', 'bright', 'mysterious', 'nostalgic',
    'dramatic', 'playful', 'serious', 'dreamy', 'intense', 'relaxed'
  ];
  return validMoods.includes(mood.toLowerCase());
}

/**
 * Validate instruments
 */
export function isValidInstrument(instrument: string): boolean {
  const validInstruments = [
    'piano', 'guitar', 'drums', 'bass', 'violin', 'synthesizer', 'saxophone',
    'trumpet', 'flute', 'cello', 'viola', 'harp', 'organ', 'keyboard',
    'electric-guitar', 'acoustic-guitar', 'bass-guitar', 'drum-kit',
    'percussion', 'strings', 'brass', 'woodwinds'
  ];
  return validInstruments.includes(instrument.toLowerCase());
}

/**
 * Generate audio metadata
 */
export function generateAudioMetadata(params: {
  prompt: string;
  duration: number;
  quality: string;
  genre?: string;
  mood?: string;
  key?: string;
  tempo?: number;
  instruments?: string[];
}): Record<string, any> {
  const metadata: Record<string, any> = {
    prompt: params.prompt,
    duration: params.duration,
    quality: params.quality,
    generatedAt: new Date().toISOString(),
    version: '2.0.0'
  };
  
  if (params.genre) metadata.genre = params.genre;
  if (params.mood) metadata.mood = params.mood;
  if (params.key) metadata.key = params.key;
  if (params.tempo) metadata.tempo = params.tempo;
  if (params.instruments && params.instruments.length > 0) {
    metadata.instruments = params.instruments;
  }
  
  return metadata;
}

/**
 * Validate audio file size
 */
export function isValidAudioFileSize(sizeInBytes: number): boolean {
  const maxSize = 50 * 1024 * 1024; // 50MB
  return sizeInBytes > 0 && sizeInBytes <= maxSize;
}

/**
 * Calculate estimated file size
 */
export function calculateAudioFileSize(duration: number, quality: string): number {
  const settings = getQualitySettings(quality);
  const bitrate = settings.bitrate * 1000; // Convert to bits per second
  const sizeInBits = bitrate * duration;
  return Math.ceil(sizeInBits / 8); // Convert to bytes
}

/**
 * Generate audio filename
 */
export function generateAudioFilename(prompt: string, format: string = 'mp3'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sanitizedPrompt = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  
  return `${sanitizedPrompt}-${timestamp}.${format}`;
}

/**
 * Parse audio filename
 */
export function parseAudioFilename(filename: string): {
  name: string;
  format: string;
  timestamp?: string;
} {
  const parts = filename.split('.');
  const format = parts.pop() || '';
  const nameWithoutExt = parts.join('.');
  
  // Try to extract timestamp
  const timestampMatch = nameWithoutExt.match(/-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)$/);
  const timestamp = timestampMatch ? timestampMatch[1].replace(/-/g, ':').replace('T', 'T').replace('Z', 'Z') : undefined;
  const name = timestampMatch ? nameWithoutExt.replace(timestampMatch[0], '') : nameWithoutExt;
  
  return { name, format, timestamp };
}

/**
 * Validate audio URL
 */
export function isValidAudioUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const validProtocols = ['http:', 'https:'];
    const validExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'];
    
    if (!validProtocols.includes(urlObj.protocol)) {
      return false;
    }
    
    const pathname = urlObj.pathname.toLowerCase();
    return validExtensions.some(ext => pathname.endsWith(ext));
  } catch {
    return false;
  }
}

/**
 * Get audio format MIME type
 */
export function getAudioMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'flac': 'audio/flac',
    'aac': 'audio/aac',
    'ogg': 'audio/ogg',
    'm4a': 'audio/mp4'
  };
  
  return mimeTypes[format.toLowerCase()] || 'audio/mpeg';
}

/**
 * Validate audio generation parameters
 */
export function validateAudioGenerationParams(params: any): {
  valid: boolean;
  errors: string[];
  data?: any;
} {
  const errors: string[] = [];
  
  if (!params.prompt || typeof params.prompt !== 'string' || params.prompt.trim().length === 0) {
    errors.push('Prompt is required and must be a non-empty string');
  }
  
  if (params.duration && (!isValidDuration(params.duration))) {
    errors.push('Duration must be between 1 and 600 seconds');
  }
  
  if (params.quality && !isValidQuality(params.quality)) {
    errors.push('Quality must be one of: standard, high, premium, enterprise');
  }
  
  if (params.genre && !isValidGenre(params.genre)) {
    errors.push('Invalid genre');
  }
  
  if (params.mood && !isValidMood(params.mood)) {
    errors.push('Invalid mood');
  }
  
  if (params.key && !isValidMusicalKey(params.key)) {
    errors.push('Invalid musical key');
  }
  
  if (params.tempo && !isValidTempo(params.tempo)) {
    errors.push('Tempo must be between 60 and 200 BPM');
  }
  
  if (params.instruments && Array.isArray(params.instruments)) {
    const invalidInstruments = params.instruments.filter((inst: string) => !isValidInstrument(inst));
    if (invalidInstruments.length > 0) {
      errors.push(`Invalid instruments: ${invalidInstruments.join(', ')}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? params : undefined
  };
}
