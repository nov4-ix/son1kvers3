import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Minimize2, Send, Sparkles, Zap } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface PixelAssistantProps {
  userId: string;
  onClose?: () => void;
}

type PixelState = 'open' | 'minimized' | 'closed';

export function PixelAssistant({ userId, onClose }: PixelAssistantProps) {
  const [state, setState] = useState<PixelState>('minimized');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selloVisible, setSelloVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (state === 'minimized') {
      setSelloVisible(true);
      const timer = setTimeout(() => setSelloVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const toggleState = () => {
    const nextState: Record<PixelState, PixelState> = {
      'closed': 'minimized',
      'minimized': 'open',
      'open': 'closed'
    };
    setState(nextState[state]);
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setSelloVisible(true);

    try {
      const response = await fetch('/api/pixel/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          userId,
          message: input,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response || 'No pude procesar tu mensaje. ◉⚡',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Tuve un problema técnico. Intenta de nuevo. ◉⚡',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setTimeout(() => setSelloVisible(false), 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMinimize = () => setState('minimized');
  const handleClose = () => {
    setState('closed');
    onClose?.();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      <AnimatePresence mode="wait">
        {state === 'closed' && (
          <motion.button
            key="trigger-closed"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleState}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30 flex items-center justify-center border-2 border-white/20"
          >
            <Sparkles className="w-7 h-7 text-white" />
          </motion.button>
        )}

        {state === 'minimized' && (
          <motion.div
            key="bubble-minimized"
            initial={{ scale: 0.8, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 20, opacity: 0 }}
            className="relative"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleState}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30 flex items-center justify-center border-2 border-white/20"
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.button>

            <AnimatePresence>
              {selloVisible && (
                <motion.div
                  key="sello-bubble"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -top-8 -left-4 text-2xl font-bold"
                >
                  ◉⚡
                </motion.div>
              )}
            </AnimatePresence>

            {messages.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
              >
                {messages.filter(m => m.role === 'user').length}
              </motion.span>
            )}
          </motion.div>
        )}

        {state === 'open' && (
          <motion.div
            key="chat-full"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-96 h-[500px] bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-violet-500/20 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-violet-700/50 to-fuchsia-700/50 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Pixel</h3>
                  <p className="text-violet-300 text-xs">Asistente Creativo</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <AnimatePresence>
                  {selloVisible && (
                    <motion.span
                      key="sello-header"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="text-lg mr-2"
                    >
                      ◉⚡
                    </motion.span>
                  )}
                </AnimatePresence>
                <button
                  onClick={handleMinimize}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Minimize2 className="w-4 h-4 text-white/70" />
                </button>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white/70" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-4xl mb-3"
                  >
                    ◉⚡
                  </motion.div>
                  <h4 className="text-white font-medium mb-1">Soy Pixel</h4>
                  <p className="text-white/50 text-sm">
                    Tu espejo creativo. Comparte una idea, pregunta o simplemente habla.
                  </p>
                </div>
              ) : (
                messages.map(message => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                          : 'bg-white/10 text-white/90'
                      }`}
                    >
                      {message.content}
                    </div>
                  </motion.div>
                ))
              )}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white animate-pulse" />
                  </div>
                  <span className="text-white/50 text-sm">Pixel está pensando...</span>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10">
              <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 bg-transparent text-white placeholder-white/30 text-sm outline-none"
                  disabled={isTyping}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="p-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}