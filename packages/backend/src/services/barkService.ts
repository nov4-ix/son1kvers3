import axios from 'axios';
import { emitGenerationUpdate } from '../websocket/generationSocket';

interface BarkEnhancementParams {
  generationId: string;
  audioUrl: string;
  quality: 'standard' | 'high' | 'premium';
  enhanceVocals: boolean;
  enhanceHarmonics: boolean;
}

interface BarkResult {
  enhancedAudioUrl: string;
  quality: string;
  processingTime: number;
}

export class BarkService {
  private barkApiUrl: string;
  private enableEnhancement: boolean;

  constructor() {
    this.barkApiUrl = process.env.BARK_API_URL || 'http://localhost:8002';
    this.enableEnhancement = process.env.BARK_ENABLED === 'true';
  }

  async enhanceAudio(params: BarkEnhancementParams): Promise<BarkResult> {
    const startTime = Date.now();
    const { generationId, audioUrl, quality, enhanceVocals, enhanceHarmonics } = params;

    emitGenerationUpdate(generationId, 'processing', 50, undefined, undefined, 'Bark enhancement started');

    try {
      if (!this.enableEnhancement) {
        console.log('Bark enhancement disabled, returning original audio');
        return {
          enhancedAudioUrl: audioUrl,
          quality: 'standard',
          processingTime: 0
        };
      }

      const enhancementConfig = {
        audio_url: audioUrl,
        enhance_vocals: enhanceVocals,
        enhance_harmonics: enhanceHarmonics,
        target_quality: quality === 'premium' ? '320kbps' : quality === 'high' ? '256kbps' : '192kbps',
        vocal_clarity: quality === 'premium' ? 1.0 : quality === 'high' ? 0.8 : 0.5,
        harmonic_depth: quality === 'premium' ? 1.0 : quality === 'high' ? 0.7 : 0.4
      };

      const response = await axios.post(
        `${this.barkApiUrl}/api/enhance`,
        enhancementConfig,
        {
          timeout: 120000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const processingTime = Date.now() - startTime;

      emitGenerationUpdate(generationId, 'processing', 90, undefined, undefined, 'Bark enhancement completed');

      return {
        enhancedAudioUrl: response.data.enhanced_url || audioUrl,
        quality: quality,
        processingTime
      };

    } catch (error: any) {
      console.error('Bark enhancement error:', error.message);
      
      emitGenerationUpdate(
        generationId, 
        'processing', 
        100, 
        undefined, 
        undefined, 
        'Bark enhancement skipped due to error'
      );

      return {
        enhancedAudioUrl: audioUrl,
        quality: 'standard',
        processingTime: 0
      };
    }
  }

  async processVocals(audioUrl: string, voiceCloneId?: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.barkApiUrl}/api/vocal-processing`,
        {
          audio_url: audioUrl,
          voice_clone_id: voiceCloneId,
          apply_naturalness: true,
          apply_breathing: true,
          apply_emotion: true
        },
        {
          timeout: 90000
        }
      );

      return response.data.processed_url || audioUrl;
    } catch (error) {
      console.error('Vocal processing error:', error);
      return audioUrl;
    }
  }

  async generateVocals(
    text: string,
    voiceStyle: string,
    language: string = 'en'
  ): Promise<Buffer> {
    try {
      const response = await axios.post(
        `${this.barkApiUrl}/api/generate-vocals`,
        {
          text,
          voice_style: voiceStyle,
          language,
          sample_rate: 44100,
          semantic_temperature: 0.8,
          semantic_guidance_scale: 7.5,
          acoustic_guidance_scale: 3.5
        },
        {
          timeout: 180000,
          responseType: 'arraybuffer'
        }
      );

      return Buffer.from(response.data);
    } catch (error: any) {
      console.error('Vocal generation error:', error.message);
      throw new Error('Failed to generate vocals with Bark');
    }
  }
}

export const barkService = new BarkService();