interface QwenMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface QwenResponse {
  model: string
  created_at: string
  message: {
    role: string
    content: string
  }
  done: boolean
}

export class QwenClient {
  private readonly baseUrl: string
  private readonly model: string

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'qwen2.5:latest') {
    this.baseUrl = baseUrl
    this.model = model
  }

  async chat(messages: QwenMessage[]): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: false
      })
    })

    if (!response.ok) {
      throw new Error(`Qwen API error: ${response.status}`)
    }

    const data: QwenResponse = await response.json()
    return data.message.content
  }

  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: QwenMessage[] = []

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }

    messages.push({ role: 'user', content: prompt })

    return this.chat(messages)
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      return response.ok
    } catch {
      return false
    }
  }
}

export const qwenClient = new QwenClient()


