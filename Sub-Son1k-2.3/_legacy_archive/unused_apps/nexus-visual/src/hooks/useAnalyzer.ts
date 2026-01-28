import { useState, useCallback, useRef } from 'react';

export interface AnalysisResult {
    bpm: number;
    key: string;
    genre: string;
    energy: number;
    confidence: number;
    tags: string[];
    instruments: string[];
}

export function useAnalyzer() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const analyzerWorkerRef = useRef<Worker | null>(null);
    const genreWorkerRef = useRef<Worker | null>(null);

    const initializeWorkers = useCallback(() => {
        if (!analyzerWorkerRef.current) {
            analyzerWorkerRef.current = new Worker(
                new URL('../workers/analyzer.worker.ts', import.meta.url),
                { type: 'module' }
            );
        }

        if (!genreWorkerRef.current) {
            genreWorkerRef.current = new Worker(
                new URL('../workers/genre.worker.ts', import.meta.url),
                { type: 'module' }
            );
        }
    }, []);

    const runAnalysis = useCallback(async (audioBuffer: AudioBuffer): Promise<AnalysisResult | null> => {
        try {
            setIsLoading(true);
            setError(null);
            initializeWorkers();

            const sampleRate = audioBuffer.sampleRate;
            const pcmData = audioBuffer.getChannelData(0);

            // 1. Analyze (BPM, Features)
            const analysisData = await new Promise<any>((resolve, reject) => {
                if (!analyzerWorkerRef.current) return reject('Worker not init');

                const handler = (e: MessageEvent) => {
                    if (e.data.type === 'analysis') {
                        analyzerWorkerRef.current?.removeEventListener('message', handler);
                        resolve(e.data.data);
                    } else if (e.data.type === 'error') {
                        reject(e.data.error);
                    }
                };

                analyzerWorkerRef.current.addEventListener('message', handler);
                analyzerWorkerRef.current.postMessage({
                    type: 'analyze',
                    audioBuffer: pcmData,
                    sampleRate
                });
            });

            // 2. Classify (Genre, Tags)
            const genreData = await new Promise<any>((resolve, reject) => {
                if (!genreWorkerRef.current) return reject('Worker not init');

                const handler = (e: MessageEvent) => {
                    if (e.data.type === 'style') {
                        genreWorkerRef.current?.removeEventListener('message', handler);
                        resolve(e.data.data);
                    } else if (e.data.type === 'error') {
                        reject(e.data.error);
                    }
                };

                genreWorkerRef.current.addEventListener('message', handler);
                genreWorkerRef.current.postMessage({
                    type: 'tag',
                    data: {
                        bpm: analysisData.bpm,
                        featuresSummary: analysisData.featuresSummary
                    }
                });
            });

            return {
                bpm: analysisData.bpm,
                key: 'C', // Placeholder, analyzer worker doesn't do key yet
                genre: 'Electronic', // Placeholder based on tags
                energy: analysisData.featuresSummary.energy,
                confidence: analysisData.confidence,
                tags: genreData.styleTags,
                instruments: genreData.probableInstruments
            };

        } catch (err: any) {
            setError(err.message || 'Analysis failed');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [initializeWorkers]);

    return { runAnalysis, isLoading, error };
}
