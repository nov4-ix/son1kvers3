'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, X, Sparkles, Minimize2, Maximize2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { pixelAI } from '../lib/pixelAI'
import { pixelPersonality } from '../lib/pixelPersonality'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

export function FloatingPixel() {
    const [isOpen, setIsOpen] = useState(true)
    const [isMinimized, setIsMinimized] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isConnected, setIsConnected] = useState(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    useEffect(() => {
        checkConnection()
        if (messages.length === 0) {
            addWelcomeMessage()
        }
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const checkConnection = async () => {
        // Check if API key is present (client-side specific for safety demo)
        // Production should use server actions/api route proxy
        if (process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY) {
            setIsConnected(true)
        } else {
            // Allow demo mode even without key
            setIsConnected(true)
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

        try {
            // Use Pixel AI Logic
            const response = await pixelAI.sendMessage(userMessage.content, { app: 'the-generator' })

            // Special Commands Handling
            if (response.startsWith('GENERATE_MUSIC:')) {
                const prompt = response.replace('GENERATE_MUSIC:', '').trim()
                toast.success(`🎵 Configurando generador para: ${prompt}`)
                // router.push(`/generator?prompt=${encodeURIComponent(prompt)}`)
                // For now just notify user
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
            setMessages((prev) => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: 'Connection glitch... try again?',
                timestamp: new Date()
            }])
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

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 z-50 w-14 h-14 bg-gradient-to-r from-[#40FDAE] to-[#B858FE] rounded-full shadow-[0_0_20px_rgba(64,253,174,0.4)] flex items-center justify-center hover:scale-110 transition-transform cursor-pointer animate-float"
            >
                <span className="text-xl">👾</span>
            </button>
        )
    }

    return (
        <>
            <Toaster position="top-center" />
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className={`fixed ${isMinimized ? 'bottom-4 right-4 w-80 h-16' : 'bottom-4 right-4 w-96 h-[500px]'
                    } bg-[#171925]/95 backdrop-blur-xl border border-[#40FDAE]/30 rounded-2xl shadow-[0_0_30px_rgba(64,253,174,0.3)] transition-all duration-300 z-50 font-sans`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 h-16">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-r from-[#40FDAE] to-[#B858FE] rounded-xl flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-[#171925]" />
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'
                                } border-2 border-[#171925]`} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm">Pixel AI</h3>
                            {!isMinimized && <p className="text-white/60 text-[10px] uppercase tracking-wider">The Generator Assistant</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="text-white/60 hover:text-white transition-colors p-1"
                        >
                            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/60 hover:text-white transition-colors p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {!isMinimized && (
                    <>
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100%-128px)] custom-scrollbar">
                            <AnimatePresence mode="wait">
                                {messages.map((message) => (
                                    <motion.div
                                        key={message.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[85%] rounded-2xl p-3 text-sm ${message.role === 'user'
                                                ? 'bg-[#40FDAE]/20 text-white border border-[#40FDAE]/30'
                                                : 'bg-white/5 text-white/90 border border-white/10'
                                                }`}
                                        >
                                            <p className="leading-relaxed">{message.content}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 bg-[#40FDAE] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-1.5 h-1.5 bg-[#40FDAE] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-1.5 h-1.5 bg-[#40FDAE] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-[#171925]/95 backdrop-blur-xl rounded-b-2xl">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask Pixel to generate music..."
                                    disabled={isLoading}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#40FDAE]/50"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading}
                                    className="bg-gradient-to-r from-[#40FDAE] to-[#B858FE] text-[#171925] p-2 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </motion.div>
        </>
    )
}
