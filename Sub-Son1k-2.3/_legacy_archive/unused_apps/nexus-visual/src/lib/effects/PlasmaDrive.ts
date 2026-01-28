import { BaseEffect } from './BaseEffect';

export class PlasmaDrive extends BaseEffect {
    private shaper: WaveShaperNode;
    private drive: number = 0;

    constructor(context: AudioContext) {
        super(context, 'Plasma Drive', 'saturation');

        this.shaper = context.createWaveShaper();
        this.shaper.oversample = '4x';
        this.updateCurve();

        // Internal Routing: Input -> Shaper -> WetGain -> Output
        // (BaseEffect connects Input -> DryGain -> Output automatically)

        this.input.connect(this.shaper);
        this.shaper.connect(this.wetGain);
    }

    setParam(param: string, value: number): void {
        switch (param) {
            case 'drive':
                this.drive = Math.max(0, Math.min(100, value));
                this.updateCurve();
                break;
            case 'output':
                // Adjust output gain to compensate for loudness
                this.wetGain.gain.value = value;
                break;
        }
    }

    private updateCurve() {
        // Sigmoid distortion curve
        const k = this.drive;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;

        for (let i = 0; i < n_samples; ++i) {
            const x = i * 2 / n_samples - 1;
            // Classic soft-clipping formula
            // (3 + k) * x * 20 * deg / (PI + k * abs(x))
            // Simplified version for "Plasma" feel:
            if (k === 0) {
                curve[i] = x;
            } else {
                // More aggressive distortion as k increases
                const amount = Math.min(k / 100, 0.99);
                const k_val = 2 * amount / (1 - amount);
                curve[i] = (1 + k_val) * x / (1 + k_val * Math.abs(x));
            }
        }
        this.shaper.curve = curve;
    }

    protected reconnectEffect(): void {
        this.input.connect(this.shaper);
        this.shaper.connect(this.wetGain);
    }
}
