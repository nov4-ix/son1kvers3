// apps/the-generator/src/hooks/usePolling.ts
import { useState, useEffect, useRef } from 'react';

interface PollingConfig {
    generationId: string;
    onComplete: (data: any) => void;
    onError: (error: string) => void;
    interval?: number;
    maxAttempts?: number;
    timeout?: number;
}

interface GenerationStatus {
    status: string;
    statusNormalized: string;
    running: boolean;
    audioUrl?: string;
    tracks?: any[];
    error?: string;
}

export function usePolling() {
    const [isPolling, setIsPolling] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const attemptsRef = useRef(0);
    const startTimeRef = useRef<number>(0);

    const stopPolling = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsPolling(false);
        attemptsRef.current = 0;
    };

    const startPolling = ({
        generationId,
        onComplete,
        onError,
        interval = 5000,
        maxAttempts = 60,
        timeout = 300000
    }: PollingConfig) => {

        stopPolling();

        setIsPolling(true);
        startTimeRef.current = Date.now();
        attemptsRef.current = 0;

        console.log(`[Polling] Iniciando para generación ${generationId}`);
        console.log(`[Polling] Config: interval=${interval}ms, maxAttempts=${maxAttempts}, timeout=${timeout}ms`);

        const poll = async () => {
            attemptsRef.current++;
            const elapsed = Date.now() - startTimeRef.current;

            console.log(`[Polling] Intento ${attemptsRef.current}/${maxAttempts} (${(elapsed / 1000).toFixed(1)}s)`);

            if (elapsed > timeout) {
                console.error(`[Polling] ⏱️ TIMEOUT alcanzado (${timeout}ms)`);
                stopPolling();
                onError('Timeout: La generación tardó demasiado. Por favor intenta de nuevo.');
                return;
            }

            if (attemptsRef.current > maxAttempts) {
                console.error(`[Polling] 🔄 MAX ATTEMPTS alcanzado (${maxAttempts})`);
                stopPolling();
                onError('Máximo de intentos alcanzado. Por favor intenta de nuevo.');
                return;
            }

            try {
                const response = await fetch(`/api/generation/${generationId}/status`);

                if (!response.ok) {
                    if ([401, 403, 404].includes(response.status)) {
                        console.error(`[Polling] ❌ HTTP ${response.status} - Error fatal`);
                        stopPolling();
                        onError(`Error HTTP ${response.status}`);
                        return;
                    }

                    console.warn(`[Polling] ⚠️ HTTP ${response.status} - Reintentando...`);
                    return;
                }

                const data = await response.json();
                const status: GenerationStatus = data.data;

                console.log(`[Polling] Status recibido:`, {
                    status: status.status,
                    statusNormalized: status.statusNormalized,
                    running: status.running,
                    hasAudioUrl: !!status.audioUrl,
                    hasTracks: !!status.tracks?.length
                });

                const hasValidTracks = status.tracks && Array.isArray(status.tracks) && status.tracks.length > 0;
                const hasAudioUrl = !!status.audioUrl;
                const isFailed = status.statusNormalized === 'failed' || status.status === 'FAILED';
                const isCompleted = status.statusNormalized === 'complete' || status.status === 'COMPLETED';

                const shouldStop = hasValidTracks || (isCompleted && hasAudioUrl) || isFailed;

                if (shouldStop) {
                    console.log(`[Polling] ✅ DETENIENDO - Razón: ${isFailed ? 'FAILED' :
                            hasValidTracks ? 'Has tracks' :
                                hasAudioUrl ? 'Has audioUrl' :
                                    'Completed'
                        }`);

                    stopPolling();

                    if (isFailed) {
                        onError(status.error || 'La generación falló');
                    } else {
                        onComplete(status);
                    }
                    return;
                }

                console.log(`[Polling] 🔄 Continuando... (running=${status.running}, status=${status.statusNormalized})`);

            } catch (error: any) {
                console.warn(`[Polling] ⚠️ Network error - Reintentando...`, error.message);

                if (attemptsRef.current >= maxAttempts) {
                    stopPolling();
                    onError('Error de red persistente. Por favor verifica tu conexión.');
                }
            }
        };

        poll();

        intervalRef.current = setInterval(poll, interval);
    };

    useEffect(() => {
        return () => {
            stopPolling();
        };
    }, []);

    return {
        isPolling,
        startPolling,
        stopPolling
    };
}
