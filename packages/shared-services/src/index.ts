/**
 * Shared Services for Super-Son1k platform
 * Centralized API logic
 */
export { getMusicService, createMusicService, MusicService } from './musicService';
export type { MusicService as IMusicService } from './musicService';
export { ApiService } from './apiService';
export type { ApiServiceConfig } from './apiService';
// Re-export MusicServiceConfig from shared-types for convenience
export type { MusicServiceConfig } from '@super-son1k/shared-types';

