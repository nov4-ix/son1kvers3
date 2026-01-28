// analyzer.worker.ts
// Worker para análisis de audio pesado (BPM, Features)

self.onmessage = async (e: MessageEvent) => {
    const { type, audioBuffer, sampleRate } = e.data;

    if (type === 'analyze') {
        try {
            // Convertir ArrayBuffer a Float32Array si es necesario
            // Nota: audioBuffer aquí es probablemente un ArrayBuffer del canal de audio
            // En una implementación real completa, necesitaríamos decodificar, 
            // pero asumiremos que recibimos los datos PCM crudos del canal principal (mono)

            // Si recibimos el buffer decodificado de AudioContext.decodeAudioData en el main thread,
            // tendríamos que haber pasado el channel data. 
            // Vamos a asumir que 'audioBuffer' es el channelData (Float32Array) o un ArrayBuffer convertible.

            let pcmData: Float32Array;

            if (audioBuffer instanceof ArrayBuffer) {
                pcmData = new Float32Array(audioBuffer);
            } else if (audioBuffer instanceof Float32Array) {
                pcmData = audioBuffer;
            } else {
                throw new Error('Formato de audio no soportado en worker');
            }

            // 1. Calcular Energía (RMS)
            const rms = calculateRMS(pcmData);

            // 2. Detectar BPM (Algoritmo simple de picos)
            const bpm = detectBPM(pcmData, sampleRate);

            // 3. Calcular otras características simples
            const zeroCrossingRate = calculateZeroCrossingRate(pcmData);

            // Enviar resultados
            self.postMessage({
                type: 'analysis',
                data: {
                    bpm,
                    confidence: 0.8, // Simulado por ahora
                    featuresSummary: {
                        energy: rms,
                        density: rms * 1.5, // Heurística simple
                        spectralCentroid: 0, // Requiere FFT, omitido por simplicidad en worker puro
                        spectralRolloff: 0,
                        zeroCrossingRate
                    }
                }
            });

        } catch (error: any) {
            self.postMessage({
                type: 'error',
                error: error.message || 'Error desconocido en análisis'
            });
        }
    }
};

function calculateRMS(data: Float32Array): number {
    let sum = 0;
    // Submuestreo para velocidad
    const step = 100;
    for (let i = 0; i < data.length; i += step) {
        sum += data[i] * data[i];
    }
    return Math.sqrt(sum / (data.length / step));
}

function calculateZeroCrossingRate(data: Float32Array): number {
    let crossings = 0;
    const step = 100;
    for (let i = step; i < data.length; i += step) {
        if ((data[i] >= 0 && data[i - step] < 0) || (data[i] < 0 && data[i - step] >= 0)) {
            crossings++;
        }
    }
    return crossings / (data.length / step);
}

function detectBPM(data: Float32Array, sampleRate: number): number {
    // Algoritmo simplificado de detección de BPM basado en picos de energía
    // 1. Dividir en ventanas
    // 2. Calcular energía por ventana
    // 3. Encontrar picos
    // 4. Calcular intervalos

    try {
        // Ventana de 0.1s
        const windowSize = Math.floor(sampleRate * 0.1);
        const peaks: number[] = [];

        // Encontrar picos de volumen
        for (let i = 0; i < data.length; i += windowSize) {
            let max = 0;
            for (let j = 0; j < windowSize && i + j < data.length; j++) {
                const val = Math.abs(data[i + j]);
                if (val > max) max = val;
            }
            peaks.push(max);
        }

        // Umbral dinámico
        const threshold = peaks.reduce((a, b) => a + b, 0) / peaks.length * 1.5;
        const beatIndices: number[] = [];

        for (let i = 0; i < peaks.length; i++) {
            if (peaks[i] > threshold) {
                // Debouncing simple (no contar picos muy cercanos)
                if (beatIndices.length === 0 || i - beatIndices[beatIndices.length - 1] > 2) {
                    beatIndices.push(i);
                }
            }
        }

        if (beatIndices.length < 2) return 120; // Fallback

        // Calcular intervalos promedio
        let intervalSum = 0;
        for (let i = 1; i < beatIndices.length; i++) {
            intervalSum += beatIndices[i] - beatIndices[i - 1];
        }

        const avgIntervalWindows = intervalSum / (beatIndices.length - 1);
        const avgIntervalSeconds = avgIntervalWindows * 0.1; // 0.1s por ventana

        const bpm = 60 / avgIntervalSeconds;

        // Restringir a rango razonable (60-180)
        if (bpm < 60) return bpm * 2;
        if (bpm > 180) return bpm / 2;

        return Math.round(bpm);
    } catch (e) {
        console.error('Error BPM:', e);
        return 120;
    }
}
