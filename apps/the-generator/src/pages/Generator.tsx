import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Music,
  Play,
  Pause,
  Download,
  Share2,
  Settings,
  Wand2,
  Volume2,
  Clock,
  Heart,
  User,
  LogOut,
  History,
  Sparkles
} from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import type { MusicTrack } from '../types/music'
import { useAuth } from '../providers/AuthProvider'
import { useGenerationStatus } from '../services/websocket'
import { AuthModal } from '../components/AuthModal'
import { NeuralEngineConnect } from '../components/NeuralEngineConnect'
import { translateToEnglish } from '../lib/translate'
import GenerationHistory from '../components/GenerationHistory'
import { config } from '../lib/config/env'
import { useAudioStore } from '../store/audioStore'
import { Logo } from '@super-son1k/shared-ui'

const generationSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(2000, 'Prompt too long'),
  lyrics: z.string().optional(),
  isInstrumental: z.boolean().optional(),
  creativeIntensity: z.number().min(0).max(1).optional(),
  emotionalDepth: z.number().min(0).max(1).optional(),
  experimentalLevel: z.number().min(0).max(1).optional(),
  narrativeStyle: z.number().min(0).max(1).optional(),
})

type GenerationForm = z.infer<typeof generationSchema>

export function TheGenerator() {
  const { user, userTier, session, isAuthenticated, isLoading, signOut, showAuthModal, setShowAuthModal } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedTrack, setGeneratedTrack] = useState<MusicTrack | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [lyrics, setLyrics] = useState<string>('')
  const [generationId, setGenerationId] = useState<string | null>(null)

  // WebSocket hook for real-time updates
  const { update: wsUpdate, connected: wsConnected } = useGenerationStatus(generationId)

  // Use global audio store to prevent multiple audios playing
  const { currentTrackId, isPlaying, play, pause } = useAudioStore()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<GenerationForm>({
    resolver: zodResolver(generationSchema),
    defaultValues: {
      prompt: '',
      lyrics: '',
      isInstrumental: false,
      creativeIntensity: 0.7,
      emotionalDepth: 0.6,
      experimentalLevel: 0.4,
      narrativeStyle: 0.5
    }
  })

  const generateLyrics = async () => {
    const prompt = watch('prompt')
    if (!prompt.trim()) {
      toast.error('Escribe un prompt musical primero')
      return
    }

    try {
      const backendUrl = config.backendUrl
      const response = await fetch(`${backendUrl}/api/lyrics/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          prompt,
          style: 'creative',
          length: 'medium'
        })
      })

      if (response.ok) {
        const data = await response.json()
        const generatedLyrics = data.lyrics || data.text || 'Letras generadas automáticamente...'
        setValue('lyrics', generatedLyrics)
        setLyrics(generatedLyrics)
        toast.success('Letras generadas automáticamente!')
      } else {
        toast.error('Error generando letras')
      }
    } catch (error) {
      toast.error('Error de conexión')
      console.error(error)
    }
  }

  const generateCreativePrompt = () => {
    const creativePrompts = [
      "Crea una sinfonía que narre el viaje de una estrella fugaz a través del cosmos infinito",
      "Una melodía que capture la esencia de un bosque encantado al atardecer",
      "Sonidos que representan la evolución de una mariposa desde oruga hasta vuelo majestuoso",
      "Ritmos que expresan la tensión y liberación de una tormenta eléctrica",
      "Música que describe el primer encuentro entre dos almas gemelas en un universo paralelo",
      "Una composición que evoca el misterio de antiguas ruinas olvidadas por el tiempo",
      "Sonidos que pintan el paisaje sonoro de una ciudad futurista bajo la lluvia",
      "Melodías que cuentan la historia de un inventor loco creando vida artificial",
      "Ritmos que expresan la danza caótica de partículas subatómicas",
      "Música que captura la serenidad de un océano profundo en calma absoluta"
    ]

    const randomPrompt = creativePrompts[Math.floor(Math.random() * creativePrompts.length)]
    setValue('prompt', randomPrompt)
    toast.success('Prompt creativo generado!')
  }

  const onSubmit = async (data: GenerationForm) => {
    // Validate authentication
    if (!isAuthenticated || !session) {
      setShowAuthModal(true)
      toast.error('Please sign in to generate music')
      return
    }

    setIsGenerating(true)
    setError(null) // Limpiar errores anteriores

    try {
      // Translate prompt to English before sending
      const translatedPrompt = await translateToEnglish(data.prompt)

      // Call backend API with Supabase session token
      const backendUrl = config.backendUrl
      const response = await fetch(`${backendUrl}/api/generation/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          prompt: translatedPrompt,
          creativeIntensity: data.creativeIntensity || 0.7,
          emotionalDepth: data.emotionalDepth || 0.6,
          experimentalLevel: data.experimentalLevel || 0.4,
          narrativeStyle: data.narrativeStyle || 0.5,
          quality: 'standard'
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Failed to generate track' } }))
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.data?.generationId) {
        throw new Error('No generation ID received from server')
      }

      const track: MusicTrack = {
        id: result.data.generationId,
        prompt: data.prompt,
        audioUrl: result.data.audioUrl || '',
        duration: 60, // Default duration
        status: result.data.status || 'pending',
        createdAt: new Date().toISOString(),
        generationId: result.data.generationId,
        taskId: result.data.generationTaskId || result.data.taskId,
        style: 'creative' // Creative style
      }

      setGeneratedTrack(track)
      setGenerationId(track.generationId!)

      // Guardar en historial local
      const history = JSON.parse(localStorage.getItem('generation_history') || '[]');
      history.unshift(track);
      localStorage.setItem('generation_history', JSON.stringify(history.slice(0, 50))); // Máximo 50

      toast.success('Track generation started!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate track. Please try again.'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error generating track:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle WebSocket updates
  useEffect(() => {
    if (wsUpdate && generatedTrack) {
      console.log('📡 WebSocket update received:', wsUpdate)

      // Update track with WebSocket data
      const updatedTrack: MusicTrack = {
        ...generatedTrack,
        status: wsUpdate.status as any,
        audioUrl: wsUpdate.audioUrl || generatedTrack.audioUrl || '',
      }

      setGeneratedTrack(updatedTrack)

      // Handle completion states
      if (wsUpdate.status === 'completed' && (wsUpdate.tracks?.length || wsUpdate.audioUrl)) {
        toast.success('🎵 ¡Música generada exitosamente!')
        setIsGenerating(false)
      } else if (wsUpdate.status === 'failed') {
        toast.error('❌ Error en la generación de música')
        setIsGenerating(false)
        setError(wsUpdate.error || 'Generation failed')
      }
    }
  }, [wsUpdate, generatedTrack])

  // Connection status indicator
  useEffect(() => {
    if (wsConnected) {
      console.log('🔗 Conectado a actualizaciones en tiempo real')
    } else {
      console.log('📡 Usando modo polling (WebSocket no disponible)')
    }
  }, [wsConnected])

  const handlePlay = async () => {
    if (!generatedTrack?.audioUrl) {
      toast.error('Audio not ready yet')
      return
    }

    const trackId = generatedTrack.id || generatedTrack.generationId || 'current'

    // Si es la misma canción, toggle play/pause
    if (currentTrackId === trackId && isPlaying) {
      pause()
      toast.success('Paused')
    } else {
      // Reproducir nueva canción (el store detendrá cualquier audio anterior)
      await play(trackId, generatedTrack.audioUrl)
      toast.success('Playing')
    }
  }

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      const { cleanup } = useAudioStore.getState()
      cleanup()
    }
  }, [])

  const handleDownload = () => {
    if (generatedTrack?.audioUrl) {
      const link = document.createElement('a');
      link.href = generatedTrack.audioUrl;
      link.download = `track-${generatedTrack.id}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started!');
    } else {
      toast.error('Audio not ready yet');
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0b0d] via-[#0f121a] to-[#0b0b0d] text-white p-6 relative overflow-hidden">
      {/* Cyberpunk grid background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(0, 191, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 191, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1"></div>
            <div className="flex-1">
              <div className="flex items-center justify-center">
                <Logo size={50} showText={false} />
                <div className="ml-4">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00bfff] via-[#ff49c3] to-[#44ff44] bg-clip-text text-transparent">
                    THE GENERATOR
                  </h1>
                  <p className="text-[#b9b9c2] text-sm mt-1">
                    AI-Powered Creative Music Generation
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1 flex justify-end items-center gap-2">
               {/* Connection Status Indicator */}
               <div className="flex items-center gap-2 mr-4">
                 <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
                 <span className="text-xs text-gray-400">
                   {wsConnected ? 'Real-time' : 'Polling'}
                 </span>
               </div>
               <Link to="/pricing" className="mr-2 text-[#00bfff] hover:text-white transition-colors font-semibold">
                 Pricing
               </Link>
              {isAuthenticated && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowHistory(!showHistory)}
                  className="bg-[#0f121a] border border-[#00bfff]/30 rounded-lg px-3 py-2 text-[#00bfff] hover:bg-[#0f121a]/80 transition-all flex items-center gap-2"
                  title="View history"
                >
                  <History size={18} />
                </motion.button>
              )}
              {isAuthenticated ? (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-3 bg-[#0f121a] border border-[#00bfff]/30 rounded-lg px-4 py-2"
                >
                  <div className="flex items-center gap-2">
                    <User size={20} className="text-[#00bfff]" />
                    <span className="text-sm text-gray-300">{user?.email}</span>
                  </div>
                  <button
                    onClick={signOut}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Sign out"
                  >
                    <LogOut size={18} />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAuthModal(true)}
                  className="bg-gradient-to-r from-[#00bfff] to-[#ff49c3] text-white font-semibold px-4 py-2 rounded-lg hover:from-[#00a8e6] hover:to-[#ff3dba] transition-all flex items-center gap-2"
                >
                  <User size={18} />
                  Sign In
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Neural Engine Connection (Stealth) */}
        {isAuthenticated && user && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <NeuralEngineConnect userId={user.id} userTier={userTier?.tier || 'FREE'} />
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Generation Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-[#0f121a] to-[#1b1b21] border-2 border-[#00bfff]/30 rounded-xl p-6 shadow-lg shadow-[#00bfff]/10"
          >
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-[#00bfff] to-[#ff49c3] bg-clip-text text-transparent">
              GENERATION PARAMETERS
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Prompt Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-lg font-medium text-gray-200">
                    Prompt Musical Creativo
                  </label>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={generateCreativePrompt}
                      className="px-4 py-2 bg-[#00bfff]/20 border border-[#00bfff]/50 rounded-lg text-[#00bfff] hover:bg-[#00bfff]/30 transition-all text-sm font-medium flex items-center gap-2"
                    >
                      <Wand2 size={16} />
                      Prompt Creativo
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={generateLyrics}
                      className="px-4 py-2 bg-[#ff49c3]/20 border border-[#ff49c3]/50 rounded-lg text-[#ff49c3] hover:bg-[#ff49c3]/30 transition-all text-sm font-medium flex items-center gap-2"
                    >
                      <Music size={16} />
                      Generar Letra
                    </motion.button>
                  </div>
                </div>

                <textarea
                  {...register('prompt')}
                  className="w-full h-40 px-6 py-4 bg-[#0b0b0d] border-2 border-[#1b1b21] rounded-xl text-[#e7e7ea] placeholder-[#7a8a9a] focus:outline-none focus:border-[#00bfff] focus:ring-2 focus:ring-[#00bfff]/50 resize-none transition-all text-lg leading-relaxed"
                  placeholder="Describe tu visión musical... Sé tan creativo como quieras. No hay límites de género, tempo o estilo. Crea sonidos que pinten emociones, cuenten historias, o expresen ideas abstractas..."
                />
                {errors.prompt && (
                  <p className="text-red-400 text-sm mt-1">{errors.prompt.message}</p>
                )}
              </div>

              {/* Lyrics Display */}
              {lyrics && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0f121a] border border-[#ff49c3]/30 rounded-lg p-4"
                >
                  <h3 className="text-[#ff49c3] font-medium mb-2">Letras Generadas:</h3>
                  <p className="text-gray-300 text-sm whitespace-pre-line">{lyrics}</p>
                </motion.div>
              )}

              {/* Perillas Literarias */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-200 border-b border-[#00bfff]/30 pb-2">
                  🎛️ Perillas Literarias
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Intensidad Creativa */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-300">
                        Intensidad Creativa
                      </label>
                      <span className="text-[#00bfff] font-mono text-sm">
                        {(watch('creativeIntensity') || 0.7).toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      {...register('creativeIntensity', { valueAsNumber: true })}
                      className="w-full h-3 bg-[#333] rounded-lg appearance-none cursor-pointer slider accent-[#00bfff]"
                      min="0"
                      max="1"
                      step="0.1"
                    />
                    <p className="text-xs text-gray-500">
                      Baja: Tradicional • Alta: Experimental
                    </p>
                  </div>

                  {/* Profundidad Emocional */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-300">
                        Profundidad Emocional
                      </label>
                      <span className="text-[#ff49c3] font-mono text-sm">
                        {(watch('emotionalDepth') || 0.6).toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      {...register('emotionalDepth', { valueAsNumber: true })}
                      className="w-full h-3 bg-[#333] rounded-lg appearance-none cursor-pointer slider accent-[#ff49c3]"
                      min="0"
                      max="1"
                      step="0.1"
                    />
                    <p className="text-xs text-gray-500">
                      Baja: Superficial • Alta: Profunda
                    </p>
                  </div>

                  {/* Nivel Experimental */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-300">
                        Nivel Experimental
                      </label>
                      <span className="text-[#44ff44] font-mono text-sm">
                        {(watch('experimentalLevel') || 0.4).toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      {...register('experimentalLevel', { valueAsNumber: true })}
                      className="w-full h-3 bg-[#333] rounded-lg appearance-none cursor-pointer slider accent-[#44ff44]"
                      min="0"
                      max="1"
                      step="0.1"
                    />
                    <p className="text-xs text-gray-500">
                      Baja: Convencional • Alta: Avant-garde
                    </p>
                  </div>

                  {/* Estilo Narrativo */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-300">
                        Estilo Narrativo
                      </label>
                      <span className="text-[#ffff44] font-mono text-sm">
                        {(watch('narrativeStyle') || 0.5).toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      {...register('narrativeStyle', { valueAsNumber: true })}
                      className="w-full h-3 bg-[#333] rounded-lg appearance-none cursor-pointer slider accent-[#ffff44]"
                      min="0"
                      max="1"
                      step="0.1"
                    />
                    <p className="text-xs text-gray-500">
                      Baja: Abstracto • Alta: Cinematográfico
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Generate Button */}
              <div className="pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-[#00bfff] via-[#ff49c3] to-[#44ff44] text-white font-bold py-5 px-8 rounded-xl hover:from-[#00a8e6] hover:via-[#ff3dba] hover:to-[#22dd22] transition-all transform hover:scale-105 shadow-2xl shadow-[#00bfff]/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Creando tu música...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={24} />
                      <span>Generar Música Creativa</span>
                      <Sparkles size={24} />
                    </>
                  )}
                </motion.button>

                <p className="text-center text-gray-500 text-sm mt-3">
                  Tu visión musical se convertirá en realidad con IA avanzada
                </p>
              </div>
            </form>
          </motion.div>

          {/* Generated Track */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold mb-4 text-[#00FFE7]">
              Generated Track
            </h2>

            {generatedTrack ? (
              <div className="space-y-4">
                {/* Track Cover */}
                <div className="aspect-square bg-[#333] rounded-lg flex items-center justify-center">
                  <Music size={48} className="text-gray-400" />
                </div>

                  {/* Track Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {generatedTrack.prompt}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Wand2 size={14} />
                        Creatividad: {((generatedTrack as any).creativeIntensity || 0.7).toFixed(1)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart size={14} />
                        Emoción: {((generatedTrack as any).emotionalDepth || 0.6).toFixed(1)}
                      </div>
                    </div>

                    {/* Status & Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">
                          Status: <span className={`capitalize ${
                            generatedTrack.status === 'completed' ? 'text-green-400' :
                            generatedTrack.status === 'failed' ? 'text-red-400' :
                            generatedTrack.status === 'processing' ? 'text-blue-400' : 'text-yellow-400'
                          }`}>
                            {generatedTrack.status || 'pending'}
                          </span>
                        </span>
                        {generatedTrack.status === 'processing' && (
                          <span className="text-xs text-gray-500">Real-time updates active</span>
                        )}
                      </div>

                      {generatedTrack.status === 'processing' && (
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                        </div>
                      )}
                    </div>
                  </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePlay}
                    className="bg-[#00FFE7] text-black p-2 rounded-lg hover:bg-[#00FFE7]/90 transition-colors"
                    aria-label={isPlaying && currentTrackId === (generatedTrack.id || generatedTrack.generationId || 'current') ? `Pause ${generatedTrack.prompt}` : `Play ${generatedTrack.prompt}`}
                    aria-pressed={isPlaying && currentTrackId === (generatedTrack.id || generatedTrack.generationId || 'current')}
                  >
                    {isPlaying && currentTrackId === (generatedTrack.id || generatedTrack.generationId || 'current') ? <Pause size={20} /> : <Play size={20} />}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownload}
                    className="bg-[#333] text-white p-2 rounded-lg hover:bg-[#444] transition-colors"
                    aria-label={`Download ${generatedTrack.prompt}`}
                  >
                    <Download size={20} />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShare}
                    className="bg-[#333] text-white p-2 rounded-lg hover:bg-[#444] transition-colors"
                  >
                    <Share2 size={20} />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-[#333] text-white p-2 rounded-lg hover:bg-[#444] transition-colors ml-auto"
                  >
                    <Heart size={20} />
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <div className="text-center">
                  <Music size={48} className="mx-auto mb-4" />
                  <p>Generate a track to see it here</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* History Modal */}
      {showHistory && isAuthenticated && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowHistory(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0f121a] border-2 border-[#00bfff]/30 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-[#00bfff] to-[#ff49c3] bg-clip-text text-transparent">
                Generation History
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <GenerationHistory
              userId={user?.id}
              onSelectTrack={(track) => {
                setGeneratedTrack(track);
                setShowHistory(false);
              }}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  )
}

export default TheGenerator
