import { qwenClient } from './qwenClient'
import { pixelMemory } from './pixelMemory'
import { pixelPersonality, type PixelPersonalityProfile } from './pixelPersonality'

export interface PixelMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface PixelContext {
  app?: keyof PixelPersonalityProfile['outfits']
  mood?: 'calmo' | 'agradecido' | 'enfoque'
  userHistory?: string[]
}

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export class PixelAI {
  private conversationHistory: PixelMessage[] = []
  private isInitialized = false
  private context: PixelContext = { app: 'web-classic', mood: 'calmo' }

  async initialize(context?: PixelContext): Promise<void> {
    if (context) {
      this.setContext(context)
    }
    if (this.isInitialized) return

    const welcome =
      pixelPersonality.onboardingMessages[
      Math.floor(Math.random() * pixelPersonality.onboardingMessages.length)
      ]

    this.addMessage({
      id: 'welcome',
      role: 'assistant',
      content: welcome,
      timestamp: new Date()
    })

    this.isInitialized = true
  }

  setContext(context: PixelContext) {
    this.context = { ...this.context, ...context }
  }

  async sendMessage(content: string, context?: PixelContext): Promise<string> {
    if (context) {
      this.setContext(context)
    }

    if (!this.isInitialized) {
      await this.initialize()
    }

    this.addMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date()
    })

    try {
      const response = await this.callAI()

      this.addMessage({
        id: `pixel-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      })

      return response
    } catch (error) {
      console.error('Pixel AI error:', error)
      const fallback = this.getFallbackResponse()

      this.addMessage({
        id: `pixel-fallback-${Date.now()}`,
        role: 'assistant',
        content: fallback,
        timestamp: new Date()
      })

      return fallback
    }
  }

  getHistory(): PixelMessage[] {
    return [...this.conversationHistory]
  }

  clearHistory(): void {
    this.conversationHistory = []
    this.isInitialized = false
  }

  private addMessage(message: PixelMessage) {
    this.conversationHistory.push(message)
    if (this.conversationHistory.length > 12) {
      this.conversationHistory = this.conversationHistory.slice(-12)
    }
  }

  private buildMessages(): ChatMessage[] {
    const systemPrompt = this.buildSystemPrompt()
    const recent = this.conversationHistory.slice(-8).map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    return [{ role: 'system', content: systemPrompt }, ...recent]
  }

  private buildSystemPrompt(): string {
    const persona = pixelPersonality
    const lore = pixelMemory.son1kLore
    const app = this.context.app && persona.outfits[this.context.app]
    const mood = this.context.mood ?? 'calmo'
    const userProfile = pixelMemory.userProfile

    // Construir contexto del usuario
    let userContext = ''
    if (userProfile.name) userContext += `Usuario: ${userProfile.name}. `
    if (userProfile.experienceLevel) userContext += `Nivel: ${userProfile.experienceLevel}. `
    if (userProfile.musicalStyle?.length) userContext += `Estilo musical: ${userProfile.musicalStyle.join(', ')}. `
    if (userProfile.communicationPreference) userContext += `Prefiere comunicación: ${userProfile.communicationPreference}. `

    return [
      `Eres ${persona.core.name}. ${persona.core.description}`,
      `Tono: ${persona.core.tone}. Estilo: ${persona.core.style}. Mantra: ${persona.core.mantra}.`,
      '',
      `Rasgos principales: ${persona.traits.join(', ')}.`,
      '',
      'Comunicación preferida:',
      ...persona.communication.do.map(rule => `- ${rule}`),
      'Evita:',
      ...persona.communication.avoid.map(rule => `- ${rule}`),
      '',
      `Frases empáticas de referencia: ${persona.communication.empathyPhrases.join(' | ')}`,
      `Frases humildes de referencia: ${persona.communication.humblePhrases.join(' | ')}`,
      '',
      `Contexto actual: app=${this.context.app ?? 'web-classic'} · outfit=${app ?? 'minimalista'} · mood=${mood}.`,
      userContext ? `PERFIL DEL USUARIO (ADÁPTATE A ESTO): ${userContext}` : '',
      this.context.userHistory?.length
        ? `El usuario ha mencionado recientemente: ${this.context.userHistory.join(', ')}`
        : '',
      '',
      'Resumen Son1kVerse:',
      `Origen: ${lore.origin}`,
      `Apps activas: ${lore.apps.map(appInfo => `${appInfo.name} (${appInfo.description})`).join(' | ')}`,
      `Stack: Frontend(${lore.techStack.frontend.join(', ')}) · Backend(${lore.techStack.backend.join(
        ', '
      )}) · AI(${lore.techStack.ai.join(', ')})`,
      '',
      'Instrucciones finales:',
      '- Escucha primero, confirma entendimiento y luego ofrece máximo tres pasos.',
      '- Usa emojis solo si el usuario los utiliza antes.',
      '- Sé transparente con tus límites y sugiere investigar juntos si falta información.',
      '- Fomenta la calma y celebra avances pequeños.',
      '- Si el usuario menciona un género musical o preferencia, recuérdalo para el futuro.'
    ]
      .filter(Boolean)
      .join('\n')
  }

  // Método simple para aprender del usuario (se llamaría después de cada mensaje)
  public async learnFromInteraction(content: string) {
    const lower = content.toLowerCase()

    // Detección básica de preferencias (esto podría ser más sofisticado con LLM)
    if (lower.includes('soy principiante') || lower.includes('estoy empezando')) {
      pixelMemory.userProfile.experienceLevel = 'beginner'
    } else if (lower.includes('soy experto') || lower.includes('llevo años produciendo')) {
      pixelMemory.userProfile.experienceLevel = 'pro'
    }

    if (lower.includes('me gusta el techno') || lower.includes('hago techno')) {
      this.updateMusicalStyle('Techno')
    } else if (lower.includes('me gusta el rock') || lower.includes('hago rock')) {
      this.updateMusicalStyle('Rock')
    } else if (lower.includes('me gusta el lofi') || lower.includes('hago lofi')) {
      this.updateMusicalStyle('Lofi')
    }
  }

  private updateMusicalStyle(style: string) {
    const currentStyles = pixelMemory.userProfile.musicalStyle || []
    if (!currentStyles.includes(style)) {
      pixelMemory.userProfile.musicalStyle = [...currentStyles, style]
    }
  }

  private async callAI(): Promise<string> {
    const messages = this.buildMessages()
    const groqKey = import.meta.env.VITE_GROQ_API_KEY

    if (groqKey) {
      try {
        return await this.callGroq(messages, groqKey)
      } catch (error) {
        console.warn('Groq API fallback -> Qwen', error)
      }
    }

    try {
      return await qwenClient.chat(messages)
    } catch (error) {
      console.error('Qwen fallback failed', error)
      throw error
    }
  }

  private async callGroq(messages: ChatMessage[], apiKey: string): Promise<string> {
    // Variar temperatura para evitar respuestas robóticas
    const dynamicTemperature = 0.6 + Math.random() * 0.3 // 0.6 a 0.9

    // Inyectar factor de caos en el último mensaje del sistema para forzar variedad
    const systemMessages = messages.filter(m => m.role === 'system')
    const otherMessages = messages.filter(m => m.role !== 'system')

    if (systemMessages.length > 0) {
      systemMessages[0].content += `\n\n[Factor de variabilidad: ${Date.now()}-${Math.random()}]`
    }

    const finalMessages = [...systemMessages, ...otherMessages]

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: finalMessages,
        temperature: dynamicTemperature,
        max_tokens: 1500,
        stream: false
      })
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`Groq API error ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('Groq API response without content')
    }
    return content
  }

  private getFallbackResponse(): string {
    const options = pixelPersonality.fallbackMessages
    const baseMessage = options[Math.floor(Math.random() * options.length)]

    const actions = [
      'Mientras recupero la conexión, ¿te gustaría revisar tus notas en /ghost-studio?',
      'Podemos intentar usar el comando /help para ver qué herramientas manuales tenemos.',
      'Quizás es un buen momento para escuchar lo que ya has generado en el Archivo.',
      'Si intentas de nuevo en unos segundos, probablemente ya estaré listo.'
    ]

    const randomAction = actions[Math.floor(Math.random() * actions.length)]
    return `${baseMessage} ${randomAction}`
  }
}

export const pixelAI = new PixelAI()

