'use client'

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Music, Sparkles, Play, Download, Loader2, Mic2, User, Users, Shuffle, Wand2, Settings, BookOpen, Heart, Zap, Palette, Pause, Volume2, VolumeX, SkipForward, SkipBack, Radio } from 'lucide-react'
import { useGeneratorStore } from '../../lib/store/generatorStore'
import { useGenerationProgress } from '../../lib/hooks/useGenerationProgress'
import { NexusCard } from '../../components/ui/NexusCard'
import { AudioVisualizer } from '../../components/ui/AudioVisualizer'

// Lazy load heavy components with code splitting
const Knob = dynamic(() => import('../../lib/components/ui/Knob').then(mod => ({ default: mod.Knob })), {
  loading: () => <div className="w-16 h-16 bg-gray-700/50 rounded-full animate-pulse" />,
  ssr: false
})

export default function GeneratorPage() {
  const { knobs, setKnobs, isCustomMode, toggleMode } = useGeneratorStore()

  const [lyricsInput, setLyricsInput] = useState('')
  const [generatedLyrics, setGeneratedLyrics] = useState('')
  const [musicPrompt, setMusicPrompt] = useState('')
  const [voice, setVoice] = useState<'male' | 'female' | 'random' | 'duet'>('male')
  const [instrumental, setInstrumental] = useState(false)
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false)
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false)
  const [trackUrls, setTrackUrls] = useState<string[]>([])
  const [error, setError] = useState('')
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationMessage, setGenerationMessage] = useState('')
  const [cancelGeneration, setCancelGeneration] = useState(false)
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null)

  // WebSocket integration for real-time progress
  const { progress: wsProgress, isConnected: wsConnected } = useGenerationProgress(currentGenerationId)

  // Update progress from WebSocket
  useEffect(() => {
    if (wsProgress) {
      setGenerationProgress(wsProgress.progress)
      setGenerationMessage(wsProgress.message || 'Generando música...')

      if (wsProgress.status === 'completed' && wsProgress.audioUrl) {
        setTrackUrls([wsProgress.audioUrl])
        setIsGeneratingMusic(false)
        setGenerationProgress(100)
        setGenerationMessage('🎉 ¡Música generada exitosamente!')
        setCurrentTrack('track1')
        setIsPlaying(true)
        setCurrentGenerationId(null) // Reset
      } else if (wsProgress.status === 'failed') {
        setIsGeneratingMusic(false)
        setError(wsProgress.error || 'Error en la generación')
        setCurrentGenerationId(null) // Reset
        setTimeout(() => setError(''), 5000)
      }
    }
  }, [wsProgress])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<string | null>(null)
  const [volume, setVolume] = useState(75)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(180)
  const audioRef = React.useRef<HTMLAudioElement>(null)

  // Memoize tracks to prevent unnecessary re-renders
  const tracks = useMemo(() => [
    { id: 'track1', name: trackUrls[0] ? 'Pista 1' : 'Generando...', url: trackUrls[0] || '', duration: 180 },
    { id: 'track2', name: trackUrls[1] ? 'Pista 2' : 'Generando...', url: trackUrls[1] || '', duration: 180 }
  ], [trackUrls])

  // Memoize estimated time calculation
  const estimatedTime = useMemo(() => {
    return Math.max(0, Math.round((100 - generationProgress) / 100 * 120))
  }, [generationProgress])

  useEffect(() => {
    if (!audioRef.current) return
    const audio = audioRef.current
    if (isPlaying) {
      audio.play().catch(err => console.error('Error playing:', err))
    } else {
      audio.pause()
    }
  }, [isPlaying])

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = volume / 100
  }, [volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const updateTime = () => setPosition(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration || 180)
    const handleEnded = () => setIsPlaying(false)
    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)
    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [currentTrack])

  // Memoize handlers to prevent unnecessary re-renders
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = parseFloat(e.target.value)
    setPosition(newPosition)
    if (audioRef.current) {
      audioRef.current.currentTime = newPosition
    }
  }, [])

  const currentTrackUrl = tracks.find(t => t.id === currentTrack)?.url || ''

  // Memoize literary prompt generation to avoid recalculation
  const getLiteraryPrompt = useCallback(() => {
    const settings = knobs
    let prompt = ''
    if (settings.emotionalIntensity >= 8) prompt += 'Usa emociones intensas y dramáticas. '
    else if (settings.emotionalIntensity <= 3) prompt += 'Mantén un tono emocional sutil y delicado. '
    else prompt += 'Usa emociones moderadas y equilibradas. '

    if (settings.poeticStyle >= 8) prompt += 'Emplea metáforas complejas y lenguaje poético sofisticado. '
    else if (settings.poeticStyle <= 3) prompt += 'Usa lenguaje directo y simple, sin metáforas complejas. '
    else prompt += 'Combina elementos poéticos con lenguaje accesible. '

    if (settings.rhymeComplexity >= 8) prompt += 'Crea patrones de rima complejos y variados. '
    else if (settings.rhymeComplexity <= 3) prompt += 'Usa rimas simples o evita rimas complejas. '
    else prompt += 'Incluye rimas moderadas y naturales. '

    if (settings.narrativeDepth >= 8) prompt += 'Desarrolla una historia profunda con múltiples capas. '
    else if (settings.narrativeDepth <= 3) prompt += 'Mantén la narrativa simple y directa. '
    else prompt += 'Incluye elementos narrativos moderados. '

    if (settings.languageStyle >= 8) prompt += 'Usa un lenguaje formal y elaborado. '
    else if (settings.languageStyle <= 3) prompt += 'Usa lenguaje coloquial y cotidiano. '
    else prompt += 'Combina lenguaje formal y coloquial. '

    if (settings.themeIntensity >= 8) prompt += 'Enfócate intensamente en el tema central. '
    else if (settings.themeIntensity <= 3) prompt += 'Trata el tema de manera sutil y secundaria. '
    else prompt += 'Desarrolla el tema de manera equilibrada. '

    return prompt.trim()
  }, [knobs])

  const handleGenerateLyrics = async () => {
    if (!lyricsInput?.trim()) {
      setError('Escribe algunas palabras o ideas')
      setTimeout(() => setError(''), 3000)
      return
    }
    setIsGeneratingLyrics(true)
    setError('')
    try {
      const literaryPrompt = getLiteraryPrompt()
      const fullPrompt = `${lyricsInput.trim()}\n\nConfiguración literaria: ${literaryPrompt}`
      const res = await fetch('/api/generate-lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: fullPrompt })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGeneratedLyrics(data.lyrics)
    } catch (err: any) {
      setError(err.message)
      setTimeout(() => setError(''), 5000)
    } finally {
      setIsGeneratingLyrics(false)
    }
  }

  const handleGeneratePrompt = async () => {
    if (!musicPrompt?.trim()) {
      setError('Describe el estilo musical')
      setTimeout(() => setError(''), 3000)
      return
    }
    setIsGeneratingPrompt(true)
    setError('')
    try {
      const res = await fetch('/api/generator-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: musicPrompt.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMusicPrompt(data.prompt)
    } catch (err: any) {
      setError(err.message)
      setTimeout(() => setError(''), 5000)
    } finally {
      setIsGeneratingPrompt(false)
    }
  }

  const handleGenerateMusic = async () => {
    if (!instrumental && !generatedLyrics?.trim()) {
      setError('Genera letra primero o activa instrumental')
      setTimeout(() => setError(''), 3000)
      return
    }
    if (!musicPrompt?.trim()) {
      setError('Genera el prompt musical primero')
      setTimeout(() => setError(''), 3000)
      return
    }

    setIsGeneratingMusic(true)
    setError('')
    setTrackUrls([])
    setGenerationProgress(0)
    setGenerationMessage('🚀 Iniciando generación...')

    const requestBody = {
      lyrics: instrumental ? '' : musicPrompt.trim(),
      prompt: instrumental ? musicPrompt.trim() : (generatedLyrics?.trim() || ''),
      voice,
      instrumental
    }

    try {
      const res = await fetch('/api/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (data.success && data.audioUrls && data.audioUrls.length > 0) {
        setTrackUrls(data.audioUrls)
        setGenerationProgress(100)
        setGenerationMessage('¡Música generada exitosamente!')
        if (data.audioUrls.length > 0) {
          setCurrentTrack('track1')
        }
        setTimeout(() => {
          setGenerationMessage('')
          setIsGeneratingMusic(false)
        }, 3000)
      } else if (data.generationId) {
        // Use WebSocket for real-time updates if generationId is available
        setCurrentGenerationId(data.generationId)
        // Fallback to polling if WebSocket not connected
        if (!wsConnected) {
          const cleanup = pollTrackStatus(data.trackId || data.sunoId, data.generationId)
          if (cleanup) {
            // Cleanup handled automatically
          }
        }
      } else if (data.trackId || data.sunoId) {
        // Fallback to polling for old API format
        const cleanup = pollTrackStatus(data.trackId || data.sunoId)
        if (cleanup) {
          // Cleanup handled automatically
        }
      } else {
        throw new Error('No se generó música')
      }
    } catch (err: any) {
      setError(err.message)
      setTimeout(() => setError(''), 5000)
      setIsGeneratingMusic(false)
    }
  }

  const pollTrackStatus = useCallback(async (trackId: string, generationId?: string) => {
    let cancelled = false
    let attempts = 0
    const startTime = Date.now()
    const maxTime = 5 * 60 * 1000 // 5 minutos máximo
    const getNextInterval = (elapsed: number): number => {
      if (elapsed < 10000) return 2000
      if (elapsed < 30000) return 3000
      if (elapsed < 60000) return 5000
      return 10000
    }
    const checkStatus = async (): Promise<boolean> => {
      if (cancelled) return false
      try {
        attempts++
        const elapsed = Date.now() - startTime
        if (elapsed > maxTime) {
          throw new Error('La generación tardó más de 5 minutos. Por favor, intenta de nuevo.')
        }

        const queryParam = generationId
          ? `generationId=${generationId}&trackId=${trackId || ''}`
          : `trackId=${trackId}`
        const res = await fetch(`/api/track-status?${queryParam}`)
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        const progress = data.progress || 30
        setGenerationProgress(progress)
        if (progress < 20) setGenerationMessage('🎼 Analizando estructura musical...')
        else if (progress < 40) setGenerationMessage('🎹 Creando instrumentación...')
        else if (progress < 60) setGenerationMessage('🎤 Generando vocales...')
        else if (progress < 80) setGenerationMessage('🎚️ Aplicando mezcla final...')
        else if (progress < 100) setGenerationMessage('✨ Finalizando tu canción...')
        else setGenerationMessage('🎉 ¡Completado!')

        if (data.status === 'first_ready' && data.audioUrls && data.audioUrls.length > 0) {
          setTrackUrls([data.audioUrls[0]])
          setGenerationProgress(75)
          setGenerationMessage('⚡ Primer track listo! Esperando segundo...')
          setCurrentTrack('track1')
          setIsPlaying(true)
          if (elapsed < maxTime) {
            setTimeout(() => checkStatus(), getNextInterval(elapsed))
          }
          return
        }

        if (data.status === 'complete') {
          if (data.audioUrls && Array.isArray(data.audioUrls) && data.audioUrls.length > 0) {
            setTrackUrls(data.audioUrls)
            setIsGeneratingMusic(false)
            setGenerationProgress(100)
            setGenerationMessage('🎉 ¡Ambos tracks listos!')
            if (!isPlaying) {
              setCurrentTrack('track1')
              setIsPlaying(true)
            }
            return
          } else if (data.audioUrl) {
            setTrackUrls([data.audioUrl])
            setIsGeneratingMusic(false)
            setGenerationProgress(100)
            setGenerationMessage('🎉 ¡Track listo!')
            setCurrentTrack('track1')
            setIsPlaying(true)
            return
          }
        }

        if (data.status === 'error') throw new Error('Error en la generación de música')

        if (elapsed < maxTime && !cancelled) {
          const nextInterval = getNextInterval(elapsed)
          setTimeout(() => {
            if (!cancelled) checkStatus()
          }, nextInterval)
        } else {
          throw new Error('La generación tardó más de 3 minutos. La música podría estar procesándose aún. Intenta de nuevo en unos momentos.')
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Error desconocido en la generación')
          setTimeout(() => setError(''), 8000)
          setIsGeneratingMusic(false)
          setGenerationProgress(0)
          setGenerationMessage('')
        }
      }
    }

    checkStatus()

    return () => {
      cancelled = true
    }
  }, [wsConnected])

  return (
    <div className="min-h-screen bg-[#0A0C10] relative overflow-hidden text-white font-sans selection:bg-[#00FFE7] selection:text-black">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#B84DFF]/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#00FFE7]/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-3 mb-4 relative">
            <div className="absolute inset-0 bg-[#00FFE7]/20 blur-xl rounded-full"></div>
            <Music className="w-10 h-10 text-[#00FFE7] relative z-10" />
            <h1 className="text-5xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#00FFE7] via-white to-[#B84DFF] font-mono tracking-tighter relative z-10">
              THE GENERATOR
            </h1>
          </div>
          <p className="text-[#9AF7EE] text-lg font-light tracking-widest uppercase opacity-80">
            Son1kvers3 AI Audio Synthesis
          </p>
        </div>

        {error && (
          <div className="mb-8 bg-red-500/10 border border-red-500/50 rounded-2xl p-4 backdrop-blur-md animate-shake">
            <p className="text-red-200 text-center font-mono flex items-center justify-center gap-2">
              <span className="text-red-500">⚠</span> {error}
            </p>
          </div>
        )}

        {/* Control Literario */}
        <NexusCard
          title="Control Literario"
          icon={<Settings className="w-6 h-6 text-white" />}
          className="mb-8"
          borderColor="border-[#B84DFF]/30"
        >
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
            <Knob label="Intensidad Emocional" value={knobs.emotionalIntensity} onChange={(value) => setKnobs({ emotionalIntensity: value })} icon={<Heart className="w-4 h-4" />} color="text-[#FF1744]" tooltip="Sutil → Dramático" />
            <Knob label="Estilo Poético" value={knobs.poeticStyle} onChange={(value) => setKnobs({ poeticStyle: value })} icon={<BookOpen className="w-4 h-4" />} color="text-[#B84DFF]" tooltip="Simple → Sofisticado" />
            <Knob label="Complejidad de Rimas" value={knobs.rhymeComplexity} onChange={(value) => setKnobs({ rhymeComplexity: value })} icon={<Zap className="w-4 h-4" />} color="text-[#FFD700]" tooltip="Libre → Complejo" />
            <Knob label="Profundidad Narrativa" value={knobs.narrativeDepth} onChange={(value) => setKnobs({ narrativeDepth: value })} icon={<BookOpen className="w-4 h-4" />} color="text-[#00FFE7]" tooltip="Directo → Profundo" />
            <Knob label="Estilo de Lenguaje" value={knobs.languageStyle} onChange={(value) => setKnobs({ languageStyle: value })} icon={<Palette className="w-4 h-4" />} color="text-[#9AF7EE]" tooltip="Coloquial → Formal" />
            <Knob label="Intensidad del Tema" value={knobs.themeIntensity} onChange={(value) => setKnobs({ themeIntensity: value })} icon={<Zap className="w-4 h-4" />} color="text-[#B84DFF]" tooltip="Sutil → Intenso" />
          </div>
        </NexusCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Letra Section */}
          <NexusCard
            title="Letra"
            icon={<Mic2 className="w-6 h-6 text-white" />}
            borderColor="border-[#00FFE7]/30"
          >
            <textarea
              value={lyricsInput}
              onChange={e => setLyricsInput(e.target.value || '')}
              disabled={instrumental || isGeneratingLyrics}
              placeholder="Escribe palabras o ideas..."
              className="w-full h-48 px-4 py-3 bg-[#0A0C10]/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#00FFE7] focus:ring-1 focus:ring-[#00FFE7]/50 disabled:opacity-50 resize-none mb-4 font-mono text-sm transition-all"
            />
            {generatedLyrics && (
              <div className="mb-4 p-4 bg-[#B84DFF]/10 rounded-xl border border-[#B84DFF]/30 max-h-60 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 mb-2 sticky top-0 bg-[#B84DFF]/10 backdrop-blur-md p-2 rounded-lg -mx-2 -mt-2">
                  <Sparkles className="w-4 h-4 text-[#B84DFF]" />
                  <p className="text-xs font-bold text-[#B84DFF] uppercase tracking-wider">AI Generated Lyrics</p>
                </div>
                <pre className="text-gray-200 whitespace-pre-wrap text-sm font-mono leading-relaxed">{generatedLyrics}</pre>
              </div>
            )}
            <button
              onClick={handleGenerateLyrics}
              disabled={isGeneratingLyrics || instrumental}
              className="w-full bg-gradient-to-r from-[#B84DFF] to-[#00FFE7] hover:from-[#B84DFF]/80 hover:to-[#00FFE7]/80 disabled:from-gray-800 disabled:to-gray-900 text-black font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(184,77,255,0.3)]"
            >
              {isGeneratingLyrics ? <><Loader2 className="w-5 h-5 animate-spin" /><span>PROCESANDO...</span></> : <><Wand2 className="w-5 h-5" /><span>GENERAR LETRA</span></>}
            </button>
          </NexusCard>

          {/* Estilo Section */}
          <NexusCard
            title="Estilo Musical"
            icon={<Music className="w-6 h-6 text-white" />}
            borderColor="border-[#9AF7EE]/30"
          >
            <textarea
              value={musicPrompt}
              onChange={e => setMusicPrompt(e.target.value || '')}
              disabled={isGeneratingPrompt}
              placeholder="Describe el estilo musical (ej: Cyberpunk Dark Synthwave con bajos profundos...)"
              maxLength={180}
              className="w-full h-48 px-4 py-3 bg-[#0A0C10]/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#00FFE7] focus:ring-1 focus:ring-[#00FFE7]/50 disabled:opacity-50 resize-none mb-4 font-mono text-sm transition-all"
            />
            <div className="text-right text-xs text-gray-500 mb-2 font-mono">
              {musicPrompt.length}/180 CHARS
            </div>
            <button
              onClick={handleGeneratePrompt}
              disabled={isGeneratingPrompt}
              className="w-full bg-gradient-to-r from-[#00FFE7] to-[#9AF7EE] hover:from-[#00FFE7]/80 hover:to-[#9AF7EE]/80 disabled:from-gray-800 disabled:to-gray-900 text-black font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,231,0.3)]"
            >
              {isGeneratingPrompt ? <><Loader2 className="w-5 h-5 animate-spin" /><span>OPTIMIZANDO...</span></> : <><Sparkles className="w-5 h-5" /><span>MEJORAR PROMPT</span></>}
            </button>
          </NexusCard>
        </div>

        {/* Configuration */}
        <NexusCard className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-[#B84DFF]" />
            <h3 className="text-xl font-bold text-white">Configuración de Voz</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { id: 'male', icon: User, label: 'Hombre', color: 'from-[#00FFE7] to-[#9AF7EE]' },
              { id: 'female', icon: User, label: 'Mujer', color: 'from-[#B84DFF] to-[#FF1744]' },
              { id: 'random', icon: Shuffle, label: 'Random', color: 'from-[#FFD700] to-[#B84DFF]' },
              { id: 'duet', icon: Users, label: 'Dueto', color: 'from-[#B84DFF] to-[#00FFE7]' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setVoice(opt.id as any)}
                disabled={instrumental}
                className={`p-4 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition-all ${voice === opt.id && !instrumental
                    ? `bg-gradient-to-br ${opt.color} border-transparent text-black shadow-[0_0_15px_rgba(255,255,255,0.2)] scale-105`
                    : 'bg-[#1a1d29]/30 border-white/10 text-gray-400 hover:bg-[#1a1d29]/50 hover:border-white/20'
                  } disabled:opacity-30 disabled:scale-100`}
              >
                <opt.icon className="w-4 h-4" /><span>{opt.label}</span>
              </button>
            ))}
            <button
              onClick={() => { setInstrumental(!instrumental); if (!instrumental) { setGeneratedLyrics(''); setLyricsInput('') } }}
              className={`p-4 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition-all ${instrumental
                  ? 'bg-gradient-to-br from-[#FF1744] to-[#FFD700] border-transparent text-black shadow-[0_0_15px_rgba(255,23,68,0.3)] scale-105'
                  : 'bg-[#1a1d29]/30 border-white/10 text-gray-400 hover:bg-[#1a1d29]/50 hover:border-white/20'
                }`}
            >
              <Music className="w-4 h-4" /><span>Instrumental</span>
            </button>
          </div>
        </NexusCard>

        {/* Generate Button */}
        <button
          onClick={handleGenerateMusic}
          disabled={isGeneratingMusic}
          className="w-full group relative overflow-hidden bg-transparent text-white text-2xl font-black py-8 rounded-3xl transition-all mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#00FFE7] via-[#B84DFF] to-[#00FFE7] opacity-80 group-hover:opacity-100 transition-opacity duration-300 animate-gradient-x"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="relative z-10 flex items-center justify-center gap-4 drop-shadow-lg">
            {isGeneratingMusic ? (
              <><Loader2 className="w-8 h-8 animate-spin" /><span>GENERANDO {generationProgress}%</span></>
            ) : (
              <><Play className="w-8 h-8 fill-current" /><span>THE GENERATOR</span></>
            )}
          </div>
        </button>

        {/* Generation Status */}
        {isGeneratingMusic && (
          <NexusCard className="mb-8 border-[#B84DFF]/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#B84DFF] blur-lg animate-pulse"></div>
                  <Loader2 className="w-6 h-6 text-white relative z-10 animate-spin" />
                </div>
                <span className="text-lg font-mono text-[#00FFE7] animate-pulse">{generationMessage}</span>
              </div>
              <button
                onClick={() => {
                  setIsGeneratingMusic(false)
                  setGenerationProgress(0)
                  setGenerationMessage('')
                  setError('Generación cancelada por el usuario')
                  setTimeout(() => setError(''), 3000)
                }}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 text-red-200 text-xs font-bold rounded-lg transition-all uppercase tracking-wider"
              >
                Abortar
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-6 bg-[#0A0C10] rounded-full overflow-hidden border border-white/10 relative">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
              <div
                className="h-full bg-gradient-to-r from-[#00FFE7] via-[#B84DFF] to-[#FF1744] transition-all duration-500 relative"
                style={{ width: `${generationProgress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
              </div>
            </div>

            <div className="flex justify-between mt-2 text-xs font-mono text-gray-500">
              <span>ESTIMATED TIME: {estimatedTime}s</span>
              <span>{generationProgress}% COMPLETED</span>
            </div>
          </NexusCard>
        )}

        {/* Player Section */}
        <NexusCard
          title="Reproductor de Tracks"
          icon={<Radio className="w-6 h-6 text-white" />}
          className="border-[#00FFE7]/50"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Track List */}
            <div className="space-y-3">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  onClick={() => setCurrentTrack(track.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer group relative overflow-hidden ${currentTrack === track.id
                      ? 'bg-[#B84DFF]/20 border-[#B84DFF] shadow-[0_0_15px_rgba(184,77,255,0.2)]'
                      : 'bg-[#1a1d29]/30 border-white/5 hover:bg-[#1a1d29]/50 hover:border-white/20'
                    }`}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={`p-3 rounded-lg ${currentTrack === track.id ? 'bg-[#B84DFF] text-white' : 'bg-white/5 text-gray-400'}`}>
                      <Music className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-bold ${currentTrack === track.id ? 'text-white' : 'text-gray-300'}`}>{track.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`w-2 h-2 rounded-full ${track.url ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-yellow-500 animate-pulse'}`}></span>
                        <span className="text-xs text-gray-500 font-mono">{track.url ? 'READY' : 'PROCESSING'}</span>
                      </div>
                    </div>
                    {currentTrack === track.id && <div className="w-2 h-2 bg-[#00FFE7] rounded-full shadow-[0_0_10px_#00FFE7]"></div>}
                  </div>
                </div>
              ))}
            </div>

            {/* Visualizer & Controls */}
            <div className="bg-[#0A0C10]/50 rounded-2xl p-6 border border-white/5 flex flex-col justify-between">
              <div className="mb-6">
                <AudioVisualizer isPlaying={isPlaying} color={currentTrack === 'track1' ? '#00FFE7' : '#B84DFF'} />
              </div>

              {currentTrack && (
                <div className="space-y-4">
                  {/* Seek Bar */}
                  <div className="w-full group">
                    <input
                      type="range"
                      min="0"
                      max={duration}
                      value={position}
                      onChange={handleSeek}
                      className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#00FFE7]"
                      style={{
                        background: `linear-gradient(to right, #00FFE7 0%, #00FFE7 ${(position / duration) * 100}%, rgba(255,255,255,0.1) ${(position / duration) * 100}%, rgba(255,255,255,0.1) 100%)`
                      }}
                    />
                    <div className="flex justify-between text-[10px] text-gray-500 mt-2 font-mono">
                      <span>{Math.floor(position / 60)}:{(position % 60).toFixed(0).padStart(2, '0')}</span>
                      <span>{Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-4">
                    <button onClick={() => setPosition(Math.max(0, position - 10))} className="p-2 text-gray-400 hover:text-white transition-colors">
                      <SkipBack className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      disabled={!currentTrackUrl}
                      className="w-14 h-14 bg-gradient-to-br from-[#00FFE7] to-[#B84DFF] rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(0,255,231,0.4)] hover:scale-110 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                    </button>
                    <button onClick={() => setPosition(Math.min(duration, position + 10))} className="p-2 text-gray-400 hover:text-white transition-colors">
                      <SkipForward className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex justify-center pt-2">
                    <a
                      href={currentTrackUrl}
                      download={`track-${currentTrack}.mp3`}
                      className={`text-xs font-bold text-[#00FFE7] hover:text-[#B84DFF] transition-colors flex items-center gap-2 ${!currentTrackUrl ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <Download className="w-4 h-4" />
                      DOWNLOAD MP3
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </NexusCard>
      </div>

      <audio ref={audioRef} src={currentTrackUrl} preload="metadata" className="hidden" />
    </div>
  )
}
