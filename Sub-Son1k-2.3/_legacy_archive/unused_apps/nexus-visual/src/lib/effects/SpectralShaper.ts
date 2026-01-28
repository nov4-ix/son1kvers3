import { BaseEffect } from './BaseEffect';

export class SpectralShaper extends BaseEffect {
    private lowShelf: BiquadFilterNode;
    private peaking: BiquadFilterNode;
    private highShelf: BiquadFilterNode;

    constructor(context: AudioContext) {
        super(context, 'Spectral Shaper', 'eq');

        this.lowShelf = context.createBiquadFilter();
        this.lowShelf.type = 'lowshelf';
        this.lowShelf.frequency.value = 100;

        this.peaking = context.createBiquadFilter();
        this.peaking.type = 'peaking';
        this.peaking.frequency.value = 1000;
        this.peaking.Q.value = 1;

        this.highShelf = context.createBiquadFilter();
        this.highShelf.type = 'highshelf';
        this.highShelf.frequency.value = 8000;

        this.reconnectEffect();
    }

    protected reconnectEffect() {
        // Input -> Low -> Peak -> High -> WetGain
        this.input.connect(this.lowShelf);
        this.lowShelf.connect(this.peaking);
        this.peaking.connect(this.highShelf);
        this.highShelf.connect(this.wetGain);
    }

    setParam(param: string, value: number) {
        switch (param) {
            case 'lowGain':
                this.lowShelf.gain.value = value; // -12 to 12
                break;
            case 'midGain':
                this.peaking.gain.value = value; // -12 to 12
                break;
            case 'highGain':
                this.highShelf.gain.value = value; // -12 to 12
                break;
            case 'midFreq':
                this.peaking.frequency.value = value; // 200 to 4000
                break;
        }
    }
}
