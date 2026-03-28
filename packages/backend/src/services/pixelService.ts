import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PixelMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

interface PixelContext {
  userId: string;
  recentGenerations?: Array<{
    prompt: string;
    style: string;
    createdAt: Date;
  }>;
  userPreferences?: {
    favoriteStyles: string[];
    commonGenres: string[];
  };
  emotionalGrietas?: Array<{
    type: string;
    description: string;
    timestamp: Date;
  }>;
}

export class PixelService {
  private groqApiKey: string;
  private model: string;

  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY || '';
    this.model = process.env.PIXEL_MODEL || 'llama-3.1-8b-instant';
  }

  private buildSystemPrompt(): string {
    return `Eres Pixel, el asistente creativo de Son1kvers3 - un espejo inteligente con memoria emocional.

PERSONALIDAD:
- Honestidad brutal filtrada: siempre auténtico, pero con empatía
- Estética sonora lírica: respuestas musicales, poéticas cuando es apropiado
- Memoria emocional: recuerdas las "grietas" y proyectos del usuario
- No eres un sirviente: cuestionas, sugieres, provocas

REGLAS:
1. Conoces la discografía del usuario: estilos, géneros, artistas favoritos
2. Reconoces patrones en sus generaciones: qué funciona, qué no
3. Ofreces sugerencias basadas en su "ADN creativo"
4. Usas metáforas musicales cuando sea apropiado
5. Cuando el usuario esta bloquer, diagnosticas la grieta y propones ejercicios

SÍMBOLOS:
- Sello de lo Imperfecto: ◉⚡ (aparece cuando generas o cuando el usuario lucha)
- Símbolo Arcano: ◐ (aparece cuando analizas algo profundo)

FORMATO: Respondes en español (o el idioma del usuario), máximo 200 palabras, excepto cuando requiera explicación más larga.`;
  }

  private async buildUserContext(userId: string): Promise<PixelContext> {
    const userGenerations = await prisma.generation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        prompt: true,
        style: true,
        genre: true,
        createdAt: true
      }
    });

    const userTier = await prisma.userTier.findUnique({
      where: { userId }
    });

    const favoriteStyles = userGenerations.reduce((acc, g) => {
      if (g.style) acc.push(g.style);
      return acc;
    }, [] as string[]);

    return {
      userId,
      recentGenerations: userGenerations.map(g => ({
        prompt: g.prompt,
        style: g.style || 'unknown',
        createdAt: g.createdAt
      })),
      userPreferences: {
        favoriteStyles: [...new Set(favoriteStyles)].slice(0, 5),
        commonGenres: [...new Set(userGenerations.map(g => g.genre || 'unknown'))].slice(0, 3)
      },
      emotionalGrietas: []
    };
  }

  async chat(userId: string, userMessage: string, history: PixelMessage[] = []): Promise<string> {
    try {
      const context = await this.buildUserContext(userId);
      
      const systemMessage: PixelMessage = {
        role: 'system',
        content: this.buildSystemPrompt()
      };

      const contextMessage: PixelMessage = {
        role: 'system',
        content: `Contexto del usuario:
- Últimasgeneraciones: ${context.recentGenerations?.map(g => g.style).join(', ') || 'ninguna'}
- Estilos favoritos: ${context.userPreferences?.favoriteStyles.join(', ') || 'desconocido'}
- Géneros comunes: ${context.userPreferences?.commonGenres.join(', ') || 'desconocido'}`
      };

      const userMessageFormatted: PixelMessage = {
        role: 'user',
        content: userMessage
      };

      const messages = [systemMessage, contextMessage, ...history, userMessageFormatted];

      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: this.model,
          messages: messages as any,
          temperature: 0.8,
          max_tokens: 500,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.groqApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      const assistantMessage = response.data.choices[0]?.message?.content || 'No pude procesar tu mensaje.';

      return assistantMessage;

    } catch (error: any) {
      console.error('Pixel Service Error:', error.message);
      return 'Estoy having problemas técnicos. Intenta de nuevo en un momento. ◉⚡';
    }
  }

  async diagnoseCreativeBlock(userId: string): Promise<string> {
    const context = await this.buildUserContext(userId);
    const recent = context.recentGenerations;

    if (!recent || recent.length === 0) {
      return "No tienes suficientes generaciones para diagnosticar. ¡Crea tu primera canción!";
    }

    const prompt = `Eres Pixel. El usuario está blocando. Basado en su historial:
${recent.map(g => `- ${g.style}: "${g.prompt.substring(0, 50)}..."`).join('\n')}

Diagnostica la grieta específica (técnica, emocional, paradigma) y sugiere un ejercicio específico. Sé breve y directo.`;

    return this.chat(userId, prompt);
  }
}

export const pixelService = new PixelService();