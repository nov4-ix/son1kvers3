export interface AudioPlugin {
    id: string;
    name: string;
    type: 'eq' | 'compressor' | 'reverb' | 'saturation';
    input: AudioNode;
    output: AudioNode;
    bypass: boolean;
    setBypass(bypass: boolean): void;
    setParam(param: string, value: number): void;
}

export abstract class BaseEffect implements AudioPlugin {
    id: string;
    name: string;
    type: 'eq' | 'compressor' | 'reverb' | 'saturation';
    input: GainNode;
    output: GainNode;
    bypass: boolean = false;
    protected context: AudioContext;
    protected dryGain: GainNode;
    protected wetGain: GainNode;

    constructor(context: AudioContext, name: string, type: 'eq' | 'compressor' | 'reverb' | 'saturation') {
        this.context = context;
        this.name = name;
        this.type = type;
        this.id = Math.random().toString(36).substr(2, 9);

        this.input = context.createGain();
        this.output = context.createGain();
        this.dryGain = context.createGain();
        this.wetGain = context.createGain();

        // Default routing: Input -> Dry/Wet -> Output
        this.input.connect(this.dryGain);
        this.dryGain.connect(this.output);
        this.wetGain.connect(this.output);

        // Default mix: 100% Wet (subclasses should handle internal routing)
        this.dryGain.gain.value = 0;
        this.wetGain.gain.value = 1;
    }

    setBypass(bypass: boolean) {
        this.bypass = bypass;
        // Simple bypass logic: if bypassed, input connects directly to output (conceptually)
        // In practice, we might just crossfade dry/wet or disable processing nodes
        if (bypass) {
            this.input.disconnect();
            this.input.connect(this.output);
        } else {
            this.input.disconnect();
            this.input.connect(this.dryGain);
            // Subclasses need to reconnect their processing chain
            this.reconnectEffect();
        }
    }

    abstract setParam(param: string, value: number): void;
    protected abstract reconnectEffect(): void;
}
