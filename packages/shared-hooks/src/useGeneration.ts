import { useState, useEffect, useCallback, useRef } from 'react';

interface UsageLimits {
    tier: string;
    canGenerate: boolean;
    remaining: number;
    resetAt: string;
    reason?: string;
    limits?: {
        generations_per_day?: number;
        generations_per_month?: number;
        quality?: string[];
    };
}

interface GenerationOptions {
    genre?: string;
    duration?: number;
    quality?: 'standard' | 'high' | 'ultra';
    includeVocals?: boolean;
    lyrics?: string;
    voiceCloneId?: string;
    includeHarmonies?: boolean;
    vocalStyle?: 'emotional' | 'energetic' | 'calm' | 'powerful';
}

interface UseGenerationOptions {
    userId: string;
    onLimitReached?: (limits: UsageLimits) => void;
    onGenerationComplete?: (generationId: string) => void;
}

interface GenerationState {
    isGenerating: boolean;
    error: string | null;
    limits: UsageLimits | null;
    generationId: string | null;
    progress: number;
    stage: string;
    jobId: string | null;
}

export function useGeneration({
    userId,
    onLimitReached,
    onGenerationComplete
}: UseGenerationOptions) {
    const [state, setState] = useState<GenerationState>({
        isGenerating: false,
        error: null,
        limits: null,
        generationId: null,
        progress: 0,
        stage: '',
        jobId: null
    });

    const wsRef = useRef<WebSocket | null>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    useEffect(() => {
        if (userId) {
            fetchLimits();
        }
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (pollRef.current) {
                clearInterval(pollRef.current);
            }
        };
    }, [userId]);

    const fetchLimits = useCallback(async () => {
        if (!userId) return;

        try {
            const response = await fetch(`${backendUrl}/api/tiers/limits/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch limits');
            
            const data = await response.json();
            setState(prev => ({ 
                ...prev, 
                limits: {
                    tier: data.tier || 'FREE',
                    canGenerate: data.limits?.canGenerate ?? true,
                    remaining: data.limits?.remaining ?? 3,
                    resetAt: data.limits?.resetAt ?? new Date().toISOString(),
                    reason: data.limits?.reason,
                    limits: data.config
                }
            }));
        } catch (error) {
            console.error('Error fetching limits:', error);
            setState(prev => ({
                ...prev,
                limits: {
                    tier: 'FREE',
                    canGenerate: true,
                    remaining: 3,
                    resetAt: new Date().toISOString()
                }
            }));
        }
    }, [userId, backendUrl]);

    const connectWebSocket = useCallback((jobId: string) => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = backendUrl.replace(/^https?:\/\//, '');
        const wsUrl = `${protocol}//${wsHost}/ws/generation/${jobId}`;

        try {
            const ws = new WebSocket(wsUrl);
            
            ws.onopen = () => {
                console.log('WebSocket connected for job:', jobId);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.status === 'completed') {
                        setState(prev => ({
                            ...prev,
                            isGenerating: false,
                            progress: 100,
                            stage: 'complete'
                        }));
                        
                        if (data.job_id) {
                            onGenerationComplete?.(data.job_id);
                        }
                    } else if (data.status === 'failed') {
                        setState(prev => ({
                            ...prev,
                            isGenerating: false,
                            error: data.error || 'Generation failed'
                        }));
                    } else {
                        setState(prev => ({
                            ...prev,
                            progress: data.progress || 0,
                            stage: data.stage || 'processing'
                        }));
                    }
                } catch (e) {
                    console.error('Error parsing WebSocket message:', e);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            ws.onclose = () => {
                console.log('WebSocket disconnected');
            };

            wsRef.current = ws;
        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
            startPolling(jobId);
        }
    }, [backendUrl, onGenerationComplete]);

    const startPolling = useCallback((jobId: string) => {
        pollRef.current = setInterval(async () => {
            try {
                const response = await fetch(`${backendUrl}/api/generation/status/${jobId}`);
                if (!response.ok) return;
                
                const data = await response.json();
                
                if (data.status === 'completed') {
                    clearInterval(pollRef.current!);
                    setState(prev => ({
                        ...prev,
                        isGenerating: false,
                        progress: 100,
                        stage: 'complete'
                    }));
                    onGenerationComplete?.(jobId);
                } else if (data.status === 'failed') {
                    clearInterval(pollRef.current!);
                    setState(prev => ({
                        ...prev,
                        isGenerating: false,
                        error: data.error || 'Generation failed'
                    }));
                } else {
                    setState(prev => ({
                        ...prev,
                        progress: data.progress || 0,
                        stage: data.stage || 'processing'
                    }));
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 2000);
    }, [backendUrl, onGenerationComplete]);

    const generate = useCallback(async (
        prompt: string,
        options: GenerationOptions = {}
    ): Promise<string | null> => {
        if (!state.limits?.canGenerate) {
            const reason = state.limits?.reason || 'limit_reached';
            setState(prev => ({ ...prev, error: 'Generation limit reached' }));
            onLimitReached?.(state.limits!);
            return null;
        }

        setState(prev => ({
            ...prev,
            isGenerating: true,
            error: null,
            progress: 0,
            stage: 'instrumental',
            generationId: null,
            jobId: null
        }));

        try {
            const response = await fetch(`${backendUrl}/api/generation/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    genre: options.genre || 'pop',
                    duration: options.duration || 180,
                    quality: options.quality || 'standard',
                    include_vocals: options.includeVocals || false,
                    lyrics: options.lyrics,
                    voice_clone_id: options.voiceCloneId,
                    include_harmonies: options.includeHarmonies || false,
                    vocal_style: options.vocalStyle || 'emotional',
                    user_id: userId
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Generation failed');
            }

            const data = await response.json();
            const jobId = data.job_id;

            setState(prev => ({
                ...prev,
                generationId: data.generation_id || jobId,
                jobId
            }));

            // Connect to WebSocket for real-time updates
            connectWebSocket(jobId);

            // Also start polling as fallback
            startPolling(jobId);

            // Refresh limits after generation starts
            await fetchLimits();

            return jobId;

        } catch (error: any) {
            setState(prev => ({
                ...prev,
                isGenerating: false,
                error: error.message || 'Generation failed'
            }));
            return null;
        }
    }, [userId, state.limits, backendUrl, connectWebSocket, startPolling, fetchLimits, onLimitReached, onGenerationComplete]);

    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    const canGenerate = state.limits?.canGenerate ?? true;
    const remaining = state.limits?.remaining ?? 0;
    const tier = state.limits?.tier ?? 'FREE';

    return {
        isGenerating: state.isGenerating,
        error: state.error,
        limits: state.limits,
        generate,
        clearError,
        canGenerate,
        remaining,
        tier,
        refreshLimits: fetchLimits,
        generationId: state.generationId,
        jobId: state.jobId,
        progress: state.progress,
        stage: state.stage
    };
}
