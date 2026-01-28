// genre.worker.ts
// Worker para clasificación heurística de género

self.onmessage = async (e: MessageEvent) => {
    const { type, data } = e.data;

    if (type === 'tag') {
        try {
            const { bpm, featuresSummary } = data;

            const result = classifyGenre(bpm, featuresSummary);

            self.postMessage({
                type: 'style',
                data: result
            });

        } catch (error: any) {
            self.postMessage({
                type: 'error',
                error: error.message || 'Error en clasificación de género'
            });
        }
    }
};

function classifyGenre(bpm: number, features: any) {
    // Heurística simple basada en BPM y Energía
    // En un sistema real, esto usaría un modelo ML (TensorFlow.js)

    let genre = 'Pop';
    let styleTags: string[] = [];
    let probableInstruments: string[] = ['Synthesizer', 'Drums', 'Bass'];
    let description = '';

    const energy = features?.energy || 0.5;
    const zcr = features?.zeroCrossingRate || 0.1; // Zero Crossing Rate (brillo/ruido)

    // Clasificación por BPM
    if (bpm < 70) {
        genre = 'Ambient / Downtempo';
        styleTags = ['Slow', 'Atmospheric', 'Chill'];
        probableInstruments = ['Pads', 'Piano', 'Sub-bass'];
    } else if (bpm < 95) {
        if (energy > 0.6) {
            genre = 'Hip Hop / Trap';
            styleTags = ['Urban', 'Rhythmic', 'Heavy Bass'];
            probableInstruments = ['808 Bass', 'Hi-hats', 'Kick'];
        } else {
            genre = 'Lo-Fi / R&B';
            styleTags = ['Relaxed', 'Groovy', 'Smooth'];
            probableInstruments = ['Electric Piano', 'Soft Drums', 'Guitar'];
        }
    } else if (bpm < 115) {
        if (zcr > 0.2) {
            genre = 'Rock / Indie';
            styleTags = ['Energetic', 'Raw', 'Live'];
            probableInstruments = ['Electric Guitar', 'Live Drums', 'Bass Guitar'];
        } else {
            genre = 'Pop / Reggaeton';
            styleTags = ['Danceable', 'Catchy', 'Modern'];
            probableInstruments = ['Synth', 'Drum Machine', 'Vocals'];
        }
    } else if (bpm < 135) {
        if (energy > 0.7) {
            genre = 'House / EDM';
            styleTags = ['Club', 'Electronic', 'Driving'];
            probableInstruments = ['Kick 4/4', 'Bassline', 'Synths'];
        } else {
            genre = 'Disco / Funk';
            styleTags = ['Groovy', 'Upbeat', 'Classic'];
            probableInstruments = ['Bass Guitar', 'Brass', 'Rhythm Guitar'];
        }
    } else if (bpm < 160) {
        if (zcr > 0.3) {
            genre = 'Dubstep / Bass Music';
            styleTags = ['Aggressive', 'Heavy', 'Electronic'];
            probableInstruments = ['Wobble Bass', 'Heavy Drums', 'FX'];
        } else {
            genre = 'Trance / Techno';
            styleTags = ['Hypnotic', 'Fast', 'Repetitive'];
            probableInstruments = ['Arpeggios', '909 Drums', 'Pads'];
        }
    } else {
        genre = 'Drum & Bass / Metal';
        styleTags = ['Very Fast', 'Intense', 'High Energy'];
        probableInstruments = ['Fast Breakbeats', 'Distorted Bass', 'High Tempo'];
    }

    // Ajuste por energía
    if (energy > 0.8) {
        styleTags.push('High Energy');
        description = `Una pista de ${genre} muy energética y potente.`;
    } else if (energy < 0.3) {
        styleTags.push('Minimal');
        description = `Una composición de ${genre} minimalista y sutil.`;
    } else {
        description = `Una pista de ${genre} con energía balanceada.`;
    }

    return {
        genreDescription: genre,
        instrumentDescription: probableInstruments.join(', '),
        styleTags,
        probableInstruments
    };
}
