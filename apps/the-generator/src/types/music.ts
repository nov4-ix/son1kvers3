// Simple types for the frontend
export interface MusicTrack {
  id: string;
  prompt: string;
  audioUrl: string;
  duration: number;
  status: string;
  createdAt: string;
  generationId?: string;
  taskId?: string;
  style?: string;
  creativeIntensity?: number;
  emotionalDepth?: number;
  experimentalLevel?: number;
  narrativeStyle?: number;
}