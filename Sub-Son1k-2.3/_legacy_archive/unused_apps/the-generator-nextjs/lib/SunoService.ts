import { backendAPI, type GenerationParams } from './BackendAPI';

/**
 * SunoService simplificado - Delega todo al backend Railway
 * Ya NO maneja tokens ni hace requests directos a Suno
 */

export interface GenerationResponse {
    id: string;
    status: 'pending' | 'running' | 'complete' | 'error';
    audio_url?: string;
    video_url?: string;
    image_url?: string;
    title?: string;
    tags?: string;
}

class SunoService {
    constructor() {
        console.log('[Suno] Service initialized (using backend)');
    }

    /**
     * Generar música (delega al backend)
     */
    async generate(params: GenerationParams): Promise<string> {
        console.log('[Suno] Starting generation via backend...');

        try {
            const response = await backendAPI.generateMusic(params);
            console.log('[Suno] ✅ Generation started with taskId:', response.taskId);
            return response.taskId;
        } catch (error: any) {
            console.error('[Suno] Generation failed:', error);
            throw error;
        }
    }

    /**
     * Hacer polling hasta que esté completo
     */
    async pollUntilComplete(taskId: string): Promise<GenerationResponse[]> {
        console.log('[Suno] Starting polling for taskId:', taskId);

        try {
            const result = await backendAPI.pollUntilComplete(taskId);

            if (!result.tracks || result.tracks.length === 0) {
                throw new Error('No tracks generated');
            }

            console.log(`[Suno] ✅ Polling complete! ${result.tracks.length} tracks`);

            // Convertir al formato esperado por el frontend
            return result.tracks.map((track) => ({
                id: track.id,
                status: 'complete',
                audio_url: track.audio_url,
                video_url: track.video_url,
                image_url: track.image_url,
                title: track.title,
                tags: track.tags,
            }));
        } catch (error: any) {
            console.error('[Suno] Polling failed:', error);
            throw error;
        }
    }

    /**
     * Verificar salud del servicio
     */
    async healthCheck(): Promise<boolean> {
        return await backendAPI.healthCheck();
    }
}

export default SunoService;
export const sunoService = new SunoService();
