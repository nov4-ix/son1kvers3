/**
 * Music Service - Centralized API calls for music generation and management
 * Separates API logic from components and hooks
 */
import type { 
  GenerationRequest, 
  GenerationResult, 
  MusicTrack, 
  PaginatedResponse,
  ApiResponse,
  MusicServiceConfig 
} from '@super-son1k/shared-types';

export class MusicService {
  private config: MusicServiceConfig;

  constructor(config?: Partial<MusicServiceConfig>) {
    // Support both Vite and Next.js environments
    const defaultBackendUrl = typeof window !== 'undefined'
      ? (import.meta?.env?.VITE_BACKEND_URL || 
         process.env?.NEXT_PUBLIC_BACKEND_URL || 
         'http://localhost:3001')
      : (process.env?.BACKEND_URL || 'http://localhost:3001');

    const defaultBackendSecret = typeof window !== 'undefined'
      ? (import.meta?.env?.VITE_BACKEND_SECRET || 
         process.env?.NEXT_PUBLIC_BACKEND_SECRET || 
         'dev-token')
      : (process.env?.BACKEND_SECRET || 'dev-token');

    this.config = {
      backendUrl: config?.backendUrl || defaultBackendUrl,
      backendSecret: config?.backendSecret || defaultBackendSecret,
    };
  }

  /**
   * Generate music track
   */
  async generateMusic(request: GenerationRequest): Promise<GenerationResult> {
    try {
      const response = await fetch(`${this.config.backendUrl}/api/generation/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.backendSecret}`
        },
        body: JSON.stringify({
          prompt: request.prompt,
          lyrics: request.lyrics,
          style: request.style || 'pop',
          duration: request.duration || 120,
          quality: request.quality || 'standard',
          voice: request.voice,
          instrumental: request.instrumental,
          customMode: request.customMode,
          tempo: request.tempo,
          key: request.key,
          genre: request.genre,
          mood: request.mood,
          complexity: request.complexity
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: { message: `HTTP error! status: ${response.status}` } 
        }));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<GenerationResult> = await response.json();

      if (!result.data?.generationId && !result.data?.taskId) {
        throw new Error('No generation ID received from server');
      }

      return {
        status: result.data?.status || 'pending',
        generationId: result.data?.generationId,
        taskId: result.data?.taskId,
        audioUrl: result.data?.audioUrl,
        audioUrls: result.data?.audioUrls,
        estimatedTime: result.data?.estimatedTime,
        message: result.data?.message
      };
    } catch (error) {
      console.error('MusicService.generateMusic error:', error);
      throw error;
    }
  }

  /**
   * Get music track status
   */
  async getTrackStatus(trackId: string, generationId?: string): Promise<GenerationResult> {
    try {
      const id = generationId || trackId;
      const response = await fetch(`${this.config.backendUrl}/api/generation/status/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.backendSecret}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get track status: ${response.status}`);
      }

      const result: ApiResponse<GenerationResult> = await response.json();
      return result.data || { status: 'pending' as any };
    } catch (error) {
      console.error('MusicService.getTrackStatus error:', error);
      throw error;
    }
  }

  /**
   * Get user's music tracks with pagination
   */
  async getUserMusic(
    userId: string, 
    options: {
      pageSize?: number;
      page?: number;
      lastDoc?: unknown;
    } = {}
  ): Promise<PaginatedResponse<MusicTrack>> {
    try {
      const { pageSize = 10, page = 1, lastDoc } = options;
      
      const url = new URL(`${this.config.backendUrl}/api/music/user/${userId}`);
      url.searchParams.set('pageSize', pageSize.toString());
      url.searchParams.set('page', page.toString());
      if (lastDoc) {
        url.searchParams.set('lastDoc', JSON.stringify(lastDoc));
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${this.config.backendSecret}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Failed to fetch music: ${response.status} - ${errorText}`);
      }

      const data: PaginatedResponse<MusicTrack> = await response.json();
      return data;
    } catch (error) {
      console.error('MusicService.getUserMusic error:', error);
      throw error;
    }
  }

  /**
   * Save music track to user's collection
   */
  async saveTrack(userId: string, track: MusicTrack): Promise<MusicTrack> {
    try {
      const response = await fetch(`${this.config.backendUrl}/api/music`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.backendSecret}`
        },
        body: JSON.stringify({
          userId,
          ...track
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save track: ${response.status}`);
      }

      const result: ApiResponse<MusicTrack> = await response.json();
      return result.data || track;
    } catch (error) {
      console.error('MusicService.saveTrack error:', error);
      throw error;
    }
  }

  /**
   * Delete music track
   */
  async deleteTrack(trackId: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.backendUrl}/api/music/${trackId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.backendSecret}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete track: ${response.status}`);
      }
    } catch (error) {
      console.error('MusicService.deleteTrack error:', error);
      throw error;
    }
  }

  /**
   * Update music track
   */
  async updateTrack(trackId: string, updates: Partial<MusicTrack>): Promise<MusicTrack> {
    try {
      const response = await fetch(`${this.config.backendUrl}/api/music/${trackId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.backendSecret}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed to update track: ${response.status}`);
      }

      const result: ApiResponse<MusicTrack> = await response.json();
      return result.data || updates as MusicTrack;
    } catch (error) {
      console.error('MusicService.updateTrack error:', error);
      throw error;
    }
  }
}

// Singleton instance
let musicServiceInstance: MusicService | null = null;

/**
 * Get or create MusicService instance
 */
export function getMusicService(config?: Partial<MusicServiceConfig>): MusicService {
  if (!musicServiceInstance) {
    musicServiceInstance = new MusicService(config);
  }
  return musicServiceInstance;
}

/**
 * Create a new MusicService instance (useful for testing)
 */
export function createMusicService(config?: Partial<MusicServiceConfig>): MusicService {
  return new MusicService(config);
}

export default MusicService;

