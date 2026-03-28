import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PixelWidgetProps {
    userId: string;
    onAction?: (action: string) => void;
}

export function PixelWidget({ userId, onAction }: PixelWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Array<{
        id: string;
        type: 'pixel' | 'user';
        content: string;
        timestamp: Date;
    }>>([]);
    const [currentSuggestion, setCurrentSuggestion] = useState<any>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        loadGreeting();
    }, [userId]);

    const loadGreeting = async () => {
        try {
            const apiUrl = (import.meta.env?.VITE_API_URL as string) || 'http://localhost:3000';
            const response = await fetch(
                `${apiUrl}/api/pixel/greeting/${userId}`
            );
            const data = await response.json();

            addPixelMessage(data.greeting);

            if (data.suggestion) {
                setTimeout(() => {
                    addPixelMessage(data.suggestion);
                }, 2000);
            }
        } catch (error) {
            console.error('Error loading greeting:', error);
            addPixelMessage("¡Hola! 👋 Soy Pixel, tu asistente musical.");
        }
    };

    const addPixelMessage = (content: string) => {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'pixel',
            content,
            timestamp: new Date()
        }]);
    };

    const addUserMessage = (content: string) => {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'user',
            content,
            timestamp: new Date()
        }]);
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage = inputValue;
        setInputValue('');
        addUserMessage(userMessage);

        setIsTyping(true);

        // Simulated AI response (replace with actual Groq API call)
        setTimeout(() => {
            const responses = [
                "¡Interesante! Te sugiero intentar con un prompt más específico.",
                "Basado en tu historial, creo que te gustaría probar este género...",
                "¿Qué tal si fusionamos dos de tus géneros favoritos?",
                "Veo que sueles crear en las tardes. ¡Perfecto momento para inspirarte!",
                "Tu último track quedó genial. ¿Quieres una variación?"
            ];

            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            addPixelMessage(randomResponse);
            setIsTyping(false);
        }, 1500);
    };

    const getSuggestion = async (context: string) => {
        try {
            const apiUrl = (import.meta.env?.VITE_API_URL as string) || 'http://localhost:3000';
            const response = await fetch(
                `${apiUrl}/api/pixel/suggest`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId, context })
                }
            );
            const data = await response.json();

            setCurrentSuggestion(data);
            addPixelMessage(`${data.emoji} ${data.message}`);
        } catch (error) {
            console.error('Error getting suggestion:', error);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-cian to-magenta rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                <PixelAvatar size="sm" animated={!isOpen} />

                {/* Notification badge */}
                {currentSuggestion && !isOpen && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        1
                    </div>
                )}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-24 right-6 z-50 w-96 h-[600px] bg-carbón-dark border-2 border-cian/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-cian/20 to-magenta/20 p-4 border-b border-cian/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <PixelAvatar size="sm" animated />
                                    <div>
                                        <h3 className="font-bold text-white">Pixel</h3>
                                        <p className="text-xs text-gray-400">AI Music Assistant</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`
                    max-w-[80%] px-4 py-2 rounded-2xl
                    ${message.type === 'user'
                                            ? 'bg-cian text-carbón rounded-tr-none'
                                            : 'bg-carbón border border-cian/20 text-white rounded-tl-none'
                                        }
                  `}>
                                        <p className="text-sm">{message.content}</p>
                                        <p className="text-xs opacity-60 mt-1">
                                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Typing indicator */}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-carbón border border-cian/20 px-4 py-2 rounded-2xl rounded-tl-none">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-cian rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                            <div className="w-2 h-2 bg-cian rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            <div className="w-2 h-2 bg-cian rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="px-4 py-2 border-t border-cian/20">
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                <QuickAction
                                    icon="💡"
                                    label="Tip"
                                    onClick={() => getSuggestion('tip')}
                                />
                                <QuickAction
                                    icon="🎵"
                                    label="Suggest"
                                    onClick={() => getSuggestion('generation')}
                                />
                                <QuickAction
                                    icon="📊"
                                    label="Stats"
                                    onClick={() => onAction?.('view_stats')}
                                />
                            </div>
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-cian/30 bg-carbón">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Pregúntame algo..."
                                    className="flex-1 px-4 py-2 bg-carbón-dark border border-cian/20 rounded-lg text-white placeholder-gray-500 focus:border-cian focus:outline-none"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!inputValue.trim()}
                                    className="px-4 py-2 bg-gradient-to-r from-cian to-magenta text-white rounded-lg font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function PixelAvatar({ size, animated }: { size: 'xs' | 'sm' | 'md'; animated?: boolean }) {
    const sizes = {
        xs: 'w-6 h-6',
        sm: 'w-10 h-10',
        md: 'w-16 h-16'
    };

    return (
        <div className={`${sizes[size]} relative`}>
            {/* Pixel face */}
            <div className={`
        w-full h-full rounded-full bg-gradient-to-br from-cian via-magenta to-cian bg-[length:200%_200%]
        flex items-center justify-center text-2xl
        ${animated ? 'animate-gradient-shift' : ''}
      `}>
                🤖
            </div>

            {/* Glow effect */}
            {animated && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cian/50 to-magenta/50 blur-lg animate-pulse -z-10"></div>
            )}
        </div>
    );
}

function QuickAction({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 px-3 py-1.5 bg-carbón-dark border border-cian/20 rounded-lg hover:border-cian/50 transition-colors whitespace-nowrap"
        >
            <span>{icon}</span>
            <span className="text-xs text-white">{label}</span>
        </button>
    );
}
