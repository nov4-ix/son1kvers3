import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, X, Sparkles, Minimize2, Maximize2, Command } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { pixelAI } from '../lib/pixelAI'
import { pixelPersonality } from '../lib/pixelPersonality'
import { parseCommand, executeCommand } from '../lib/pixelCommands'
import { PixelCommandPalette } from './PixelCommandPalette'

type PixelAppContext = keyof typeof pixelPersonality.outfits

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface PixelChatAdvancedProps {
  currentApp?: PixelAppContext
  isOpen: boolean
  onClose: () => void
}

export function PixelChatAdvanced({
  currentApp = 'web-classic',
  isOpen,
  onClose
}: PixelChatAdvancedProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    checkConnection()
    if (messages.length === 0) {
      addWelcomeMessage()
    }
  }, [])

  useEffect(() => {
    pixelAI.setContext({ app: currentApp })
  }, [currentApp])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const checkConnection = async () => {
    try {
      // ✅ Verificar si Groq API está configurada
      const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''
      if (GROQ_API_KEY) {
        setIsConnected(true)
        return
      }

      // Fallback: Intentar Ollama local (solo para desarrollo)
      if (import.meta.env.DEV) {
        const response = await fetch('http://localhost:11434/api/tags', {
          method: 'GET',
          signal: AbortSignal.timeout(2000)
        })
        setIsConnected(response.ok)
      } else {
        setIsConnected(false)
      }
    } catch {
      setIsConnected(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const addWelcomeMessage = () => {
    const welcomeMessages = pixelPersonality.onboardingMessages
    const welcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]

    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: welcome,
        timestamp: new Date(),
      },
    ])
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Aprender del usuario
    pixelAI.learnFromInteraction(userMessage.content)

    try {
      let response: string

      // Verificar si es comando
      const cmd = parseCommand(userMessage.content)
      if (cmd.isCommand && cmd.command) {
        response = await executeCommand(cmd.command, cmd.args || [], { app: currentApp })
      } else {
        response = await pixelAI.sendMessage(userMessage.content, { app: currentApp })
      }

      // Manejar flags especiales
      if (response.startsWith('GENERATE_MUSIC:')) {
        const prompt = response.replace('GENERATE_MUSIC:', '').trim()
        toast.success(`🎵 Iniciando generador con: ${prompt}`)
        navigate('/generator')
        // Aquí idealmente pasaríamos el prompt al estado global o query param
        response = `¡Entendido! Te llevo al generador para crear música sobre: "${prompt}".`
      } else if (response.startsWith('CHANGE_MOOD:')) {
        const mood = response.replace('CHANGE_MOOD:', '').trim()
        response = `Mood cambiado a: ${mood}. Me adaptaré a esta energía.`
      } else if (response === 'CLEAR_HISTORY') {
        setMessages([])
        pixelAI.clearHistory()
        return
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Oops, parece que perdí la conexión con mi cerebro digital. ¿Podrías intentarlo de nuevo?',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`fixed ${isMinimized ? 'bottom-4 right-4 w-80 h-16' : 'bottom-4 right-4 w-96 h-[600px]'
        } bg-[#171925]/95 backdrop-blur-xl border border-[#40FDAE]/30 rounded-2xl shadow-[0_0_30px_rgba(64,253,174,0.3)] transition-all duration-300 z-50`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-r from-[#40FDAE] to-[#B858FE] rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#171925]" />
            </div>
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'
              } border-2 border-[#171925]`} />
          </div>
          <div>
            <h3 className="text-white font-bold">Pixel</h3>
            <p className="text-white/60 text-xs">
              {isConnected ? 'Online' : 'Offline'} • {currentApp}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-white/60 hover:text-white transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
          </button>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(100% - 140px)' }}>
            <AnimatePresence mode="wait">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 ${message.role === 'user'
                      ? 'bg-[#40FDAE]/20 text-white border border-[#40FDAE]/30'
                      : 'bg-white/5 text-white/90 border border-white/10'
                      }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className="text-xs text-white/40 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-[#40FDAE] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-[#40FDAE] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-[#40FDAE] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pregúntale a Pixel..."
                disabled={!isConnected || isLoading}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-[#40FDAE]/50 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || !isConnected || isLoading}
                className="bg-gradient-to-r from-[#40FDAE] to-[#B858FE] text-[#171925] p-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            {!isConnected && (
              <p className="text-xs text-red-400 mt-2">
                Pixel AI no está configurado. Configura VITE_GROQ_API_KEY en producción.
              </p>
            )}
          </div>
        </>
      )}
    </motion.div>
  )
}
