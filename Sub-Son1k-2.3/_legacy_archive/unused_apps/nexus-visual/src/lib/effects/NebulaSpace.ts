import { BaseEffect } from './BaseEffect';

export class NebulaSpace extends BaseEffect {
    private convolver: ConvolverNode;
    private delay: DelayNode;
    private feedback: GainNode;
    private mixNode: GainNode;

    constructor(context: AudioContext) {
        super(context, 'Nebula Space', 'reverb');

        this.convolver = context.createConvolver();
        this.generateImpulse(2); // 2 seconds default

        this.delay = context.createDelay(5.0);
        this.delay.delayTime.value = 0.3;

        this.feedback = context.createGain();
        this.feedback.gain.value = 0.4;

        this.mixNode = context.createGain();

        this.reconnectEffect();
    }

    private generateImpulse(duration: number) {
        const rate = this.context.sampleRate;
        const length = rate * duration;
        const impulse = this.context.createBuffer(2, length, rate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);

        for (let i = 0; i < length; i++) {
            // Exponential decay
            const decay = Math.pow(1 - i / length, 2);
            left[i] = (Math.random() * 2 - 1) * decay;
            right[i] = (Math.random() * 2 - 1) * decay;
        }

        this.convolver.buffer = impulse;
    }

    protected reconnectEffect() {
        // Parallel processing: Reverb + Delay

        // Reverb path
        this.input.connect(this.convolver);
        this.convolver.connect(this.mixNode);

        // Delay path (with feedback)
        this.input.connect(this.delay);
        this.delay.connect(this.feedback);
        this.feedback.connect(this.delay);
        this.delay.connect(this.mixNode);

        this.mixNode.connect(this.wetGain);
    }

    setParam(param: string, value: number) {
        switch (param) {
            case 'dimension': // Reverb duration
                this.generateImpulse(value); // 0.5 to 5s
                break;
            case 'echo': // Delay time
                this.delay.delayTime.value = value; // 0 to 1s
                break;
            case 'density': // Mix
                this.mixNode.gain.value = value; // 0 to 1
                break;
        }
    }
}
