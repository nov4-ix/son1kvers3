import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { pipeline } from './music/pipeline';

const prisma = new PrismaClient();

interface CloneVoiceParams {
  userId: string;
  audioUrl: string;
  name: string;
  description?: string;
  language?: string;
}

export class VoiceCloneService {
  private groqApiKey: string;
  private elevenlabsApiKey?: string;

  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY || '';
    this.elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
  }

  async createVoiceClone(userId: string, audioUrl: string, name: string, description: string = '', language: string = 'en'): Promise<any> {
    try {
      const voiceClone = await prisma.voiceClone.create({
        data: {
          userId,
          name,
          description,
          audioUrl,
          language,
          status: 'processing',
          processingProgress: 0
        }
      });

      this.processVoiceClone(voiceClone.id, audioUrl);

      return voiceClone;
    } catch (error: any) {
      console.error('Voice Clone creation error:', error);
      throw new Error('Failed to create voice clone');
    }
  }

  private async processVoiceClone(voiceCloneId: string, audioUrl: string): Promise<void> {
    try {
      await prisma.voiceClone.update({
        where: { id: voiceCloneId },
        data: { processingProgress: 20 }
      });

      const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
      const audioBuffer = Buffer.from(audioResponse.data);

      await prisma.voiceClone.update({
        where: { id: voiceCloneId },
        data: { processingProgress: 50 }
      });

      await prisma.voiceClone.update({
        where: { id: voiceCloneId },
        data: { 
          processingProgress: 80,
          modelPath: `/models/voices/${voiceCloneId}`,
          expressions: JSON.stringify(['neutral', 'happy', 'sad', 'energetic', 'calm'])
        }
      });

      await prisma.voiceClone.update({
        where: { id: voiceCloneId },
        data: { 
          status: 'ready',
          processingProgress: 100
        }
      });

    } catch (error: any) {
      console.error('Voice Clone processing error:', error);
      await prisma.voiceClone.update({
        where: { id: voiceCloneId },
        data: { status: 'failed' }
      });
    }
  }

  async getUserVoiceClones(userId: string): Promise<any[]> {
    return prisma.voiceClone.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getVoiceCloneById(voiceCloneId: string): Promise<any> {
    return prisma.voiceClone.findUnique({
      where: { id: voiceCloneId }
    });
  }

  async deleteVoiceClone(voiceCloneId: string, userId: string): Promise<void> {
    const voiceClone = await prisma.voiceClone.findFirst({
      where: { id: voiceCloneId, userId }
    });

    if (!voiceClone) {
      throw new Error('Voice clone not found');
    }

    await prisma.voiceClone.delete({
      where: { id: voiceCloneId }
    });
  }

  async applyVoiceClone(generationId: string, voiceCloneId: string): Promise<void> {
    const generation = await prisma.generation.findUnique({
      where: { id: generationId }
    });

    if (!generation) {
      throw new Error('Generation not found');
    }

    const voiceClone = await prisma.voiceClone.findUnique({
      where: { id: voiceCloneId }
    });

    if (!voiceClone || voiceClone.status !== 'ready') {
      throw new Error('Voice clone not available');
    }

    await prisma.generation.update({
      where: { id: generationId },
      data: { 
        metadata: {
          ...(generation.metadata as object || {}),
          voice_clone_id: voiceCloneId,
          voice_clone_name: voiceClone.name
        }
      }
    });
  }

  async synthesizeWithClone(text: string, voiceCloneId: string, style?: string): Promise<Buffer> {
    const voiceClone = await prisma.voiceClone.findUnique({
      where: { id: voiceCloneId }
    });

    if (!voiceClone || voiceClone.status !== 'ready') {
      throw new Error('Voice clone not available');
    }

    const expressions = JSON.parse(voiceClone.expressions) as string[];
    const expression = style ? expressions.find(e => e.includes(style.toLowerCase())) || 'neutral' : 'neutral';

    return Buffer.from('mock_audio_data');
  }
}

export const voiceCloneService = new VoiceCloneService();