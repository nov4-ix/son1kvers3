/**
 * Cliente API para comunicarse con el backend Railway
 * Maneja toda la comunicación sin necesidad de tokens en el frontend
 */

export interface GenerationParams {
    prompt: string;
    style?: string;
    make_instrumental?: boolean;
    tags?: string;
    title?: string;
}

export interface GenerationResponse {
    taskId: string;
    status: string;
    message?: string;
}

export interface GenerationStatus {
    status: 'pending' | 'running' | 'complete' | 'failed';
    tracks?: Array<{
        id: string;
        audio_url?: string;
        video_url?: string;
        image_url?: string;
        title?: string;
        tags?: string;
    }>;
    error?: string;
}

export class BackendAPI {
    private readonly baseURL: string;

    constructor() {
        // Backend Railway URL
        this.baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
        console.log('[BackendAPI] Initialized with URL:', this.baseURL);
    }

    /**
     * Generar música vía backend (sin tokens en frontend)
     */
    async generateMusic(params: GenerationParams): Promise<GenerationResponse> {
        console.log('[BackendAPI] Generating music:', params);

        try {
            const response = await fetch(`${this.baseURL}/api/generation/create-public`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: params.prompt,
                    style: params.style || 'pop',
                    make_instrumental: params.make_instrumental || false,
                    tags: params.tags,
                    title: params.title,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to generate: ${response.status}`);
            }

            const data = await response.json();
            console.log('[BackendAPI] Generation started:', data);

            return {
                taskId: data.taskId,
                status: data.status || 'pending',
                message: data.message,
            };
        } catch (error: any) {
            console.error('[BackendAPI] Generation error:', error);
            throw new Error(error.message || 'Failed to start generation');
        }
    }

    /**
     * Obtener estado de generación
     */
    async getGenerationStatus(taskId: string): Promise<GenerationStatus> {
        try {
            const response = await fetch(`${this.baseURL}/api/generation/${taskId}/status`);

            if (!response.ok) {
                throw new Error(`Failed to get status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error: any) {
            console.error('[BackendAPI] Status check error:', error);
            throw error;
        }
    }

    /**
     * Polling hasta que esté completo (con polling adaptativo)
     */
    async pollUntilComplete(
        taskId: string,
        maxAttempts = 60
    ): Promise<GenerationStatus> {
        console.log('[BackendAPI Polling] Starting for taskId:', taskId);

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const status = await this.getGenerationStatus(taskId);

                console.log(`[BackendAPI Polling] Attempt ${attempt}:`, {
                    status: status.status,
                    hasTrack: !!status.tracks?.length,
                });

                // Verificar si ya está completo
                if (status.status === 'complete' && status.tracks && status.tracks.length > 0) {
                    console.log('[BackendAPI Polling] ✅ Complete!');
                    return status;
                }

                // Verificar si hubo error
                if (status.status === 'failed') {
                    throw new Error(status.error || 'Generation failed');
                }

                // Polling adaptativo
                // Fast: primeros 5 intentos (3s)
                // Medium: intentos 6-15 (4s)
                // Normal: intentos 16+ (5s)
                const delay = attempt < 5 ? 3000 : attempt < 15 ? 4000 : 5000;

                console.log(`[BackendAPI Polling] Status: ${status.status}, waiting ${delay}ms...`);
                await this.sleep(delay);
            } catch (error: any) {
                console.error(`[BackendAPI Polling] Attempt ${attempt} error:`, error);

                // Si es el último intento, lanzar error
                if (attempt === maxAttempts) {
                    throw new Error(`Polling failed after ${maxAttempts} attempts: ${error.message}`);
                }

                // Esperar antes de reintentar
                await this.sleep(5000);
            }
        }

        throw new Error(`Timeout: Generation took too long (${maxAttempts} attempts)`);
    }

    /**
     * Verificar salud del backend
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            return response.ok;
        } catch {
            return false;
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

// Singleton instance
export const backendAPI = new BackendAPI();
