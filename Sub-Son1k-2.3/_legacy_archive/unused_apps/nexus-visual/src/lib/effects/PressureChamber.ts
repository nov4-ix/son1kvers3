import { BaseEffect } from './BaseEffect';

export class PressureChamber extends BaseEffect {
    private compressor: DynamicsCompressorNode;

    constructor(context: AudioContext) {
        super(context, 'Pressure Chamber', 'compressor');

        this.compressor = context.createDynamicsCompressor();
        this.compressor.threshold.value = -24;
        this.compressor.knee.value = 30;
        this.compressor.ratio.value = 12;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.25;

        this.reconnectEffect();
    }

    protected reconnectEffect() {
        this.input.connect(this.compressor);
        this.compressor.connect(this.wetGain);
    }

    setParam(param: string, value: number) {
        switch (param) {
            case 'force': // Threshold + Ratio combo
                // Value 0-100
                // Threshold: -10 to -50
                // Ratio: 2 to 20
                this.compressor.threshold.value = -10 - (value * 0.4);
                this.compressor.ratio.value = 2 + (value * 0.18);
                break;
            case 'release':
                this.compressor.release.value = value; // 0.01 to 1
                break;
        }
    }
}
