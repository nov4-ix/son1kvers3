'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Music, Sparkles, Play, Download, Loader2, Wrench, BookOpen, Heart, Zap, Palette, Pause, Volume2, VolumeX, SkipForward, SkipBack, Wand2, Shuffle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'

// Schemas de validación
const knobsSchema = z.object({
  emotionalIntensity: z.number().min(0).max(10),
  poeticStyle: z.number().min(0).max(10),
  rhymeComplexity: z.number().min(0).max(10),
  narrativeDepth: z.number().min(0).max(10),
  languageStyle: z.number().min(0).max(10),
  themeIntensity: z.number().min(0).max(10),
})

type KnobsForm = z.infer<typeof knobsSchema>

// Store de Zustand para knobs
const useKnobsStore = (() => {
  let knobs: KnobsForm = {
    emotionalIntensity: 5,
    poeticStyle: 5,
    rhymeComplexity: 5,
    narrativeDepth: 5,
    languageStyle: 5,
    themeIntensity: 5,
  }
  const listeners: Array<() => void> = []

  return {
    getKnobs: () => knobs,
    setKnobs: (update: Partial<KnobsForm>) => {
      knobs = { ...knobs, ...update }
      listeners.forEach(listener => listener())
    },
    subscribe: (listener: () => void) => {
      listeners.push(listener)
      return () => {
        const index = listeners.indexOf(listener)
        if (index > -1) listeners.splice(index, 1)
      }
    }
  }
})()

export function TheGeneratorPage() {
  // Estados básicos
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

  // Estados del reproductor
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<string | null>(null)
  const [volume, setVolume] = useState(75)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(180)
  const audioRef = React.useRef<HTMLAudioElement>(null)

  // Formulario de knobs
  const { register, setValue, watch } = useForm<KnobsForm>({
    resolver: zodResolver(knobsSchema),
    defaultValues: useKnobsStore.getKnobs()
  })

  // Subscribe to store changes
  useEffect(() => {
    const unsubscribe = useKnobsStore.subscribe(() => {
      const knobs = useKnobsStore.getKnobs()
      setValue('emotionalIntensity', knobs.emotionalIntensity)
      setValue('poeticStyle', knobs.poeticStyle)
      setValue('rhymeComplexity', knobs.rhymeComplexity)
      setValue('narrativeDepth', knobs.narrativeDepth)
      setValue('languageStyle', knobs.languageStyle)
      setValue('themeIntensity', knobs.themeIntensity)
    })
    return unsubscribe
  }, [setValue])

  // URLs de tracks generados (se llenan con URLs reales del backend)
  const [demoUrls] = useState<string[]>([]) // Mantener por compatibilidad pero ya no se usan

  const tracks = [
    {
      id: 'track1',
      name: trackUrls[0] ? 'Pista 1' : 'Generando...',
      url: trackUrls[0] || '',
      duration: 180
    },
    {
      id: 'track2',
      name: trackUrls[1] ? 'Pista 2' : 'Generando...',
      url: trackUrls[1] || '',
      duration: 180
    }
  ]

  const handleGenerateLyrics = async () => {
    if (!lyricsInput?.trim()) {
      setError('Escribe algunas palabras o ideas')
      setTimeout(() => setError(''), 3000)
      return
    }
    setIsGeneratingLyrics(true)
    setError('')

    try {
      // ✅ CONECTAR CON GROQ para generación inteligente de letra
      const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

      if (!GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY no configurada. Configura VITE_GROQ_API_KEY en .env')
      }

      // Construir prompt inteligente basado en knobs literarios
      const literaryPrompt = getLiteraryPrompt()

      const fullPrompt = `Crea letra de canción completa basada en: "${lyricsInput}"

${literaryPrompt}

REGLAS OBLIGATORIAS:
1. EMPIEZA DIRECTO con [Verse 1] - NO escribas título, NO escribas intro con letra
2. Usa SOLO estas etiquetas: [Verse 1], [Chorus], [Verse 2], [Bridge], [Outro]
3. NO uses markdown (**), NO uses títulos, NO uses paréntesis ()
4. Solo letra pura cantable
5. ⚠️ CRÍTICO: LÍNEAS CORTAS (máximo 6-8 palabras por línea)
6. Versos respirables, NO atropellados
7. Cada línea debe ser cantable en 2-3 segundos

ESTRUCTURA EXACTA:

[Verse 1]
línea corta (6-8 palabras)
línea corta (6-8 palabras)
línea corta (6-8 palabras)
línea corta (6-8 palabras)

[Chorus]
línea corta y pegajosa
línea corta y pegajosa
línea corta y pegajosa

[Verse 2]
línea corta (6-8 palabras)
línea corta (6-8 palabras)
línea corta (6-8 palabras)
línea corta (6-8 palabras)

[Chorus]

[Bridge]
línea corta (6-8 palabras)
línea corta (6-8 palabras)

[Chorus]

[Outro]
línea final corta

EMPIEZA DIRECTAMENTE CON [Verse 1]. Nada antes. LÍNEAS CORTAS Y CANTABLES.`

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: fullPrompt }],
          max_tokens: 1200,
          temperature: 0.9
        })
      })

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`)
      }

      const data = await response.json()
      let lyrics = data.choices[0].message.content.trim()

      // Limpiar cualquier cosa antes de [Verse 1]
      const verse1Index = lyrics.indexOf('[Verse 1]')
      if (verse1Index > 0) {
        lyrics = lyrics.substring(verse1Index)
      }

      // Limpiar formato extra
      lyrics = lyrics.replace(/^\*\*.*?\*\*\s*/gm, '')
      lyrics = lyrics.replace(/^#.*$/gm, '')
      lyrics = lyrics.replace(/\(.*?\)/g, '')
      lyrics = lyrics.replace(/^Canción:.*$/gm, '')
      lyrics = lyrics.replace(/^\[Intro\][\s\S]*?(?=\[Verse 1\])/m, '')

      // Acortar líneas largas
      lyrics = lyrics.split('\n').map(line => {
        if (line.trim().startsWith('[') && line.trim().endsWith(']')) {
          return line
        }
        if (!line.trim()) {
          return line
        }
        const words = line.trim().split(/\s+/)
        if (words.length > 10) {
          const chunks = []
          for (let i = 0; i < words.length; i += 8) {
            chunks.push(words.slice(i, i + 8).join(' '))
          }
          return chunks.join('\n')
        }
        return line
      }).join('\n')

      setGeneratedLyrics(lyrics.trim())
      toast.success('Letra generada con Groq AI!')
    } catch (err: any) {
      console.error('Error generando letra:', err)
      setError(err.message || 'Error generando letra')
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
      // ✅ CONECTAR CON GROQ para generación inteligente de prompt musical
      const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

      if (!GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY no configurada. Configura VITE_GROQ_API_KEY en .env')
      }

      const knobs = useKnobsStore.getKnobs()

      const promptRequest = `Basado en esta descripción musical: "${musicPrompt}"

Genera un prompt musical optimizado para Suno AI con estas características:
- Intensidad emocional: ${knobs.emotionalIntensity}/10
- Estilo poético: ${knobs.poeticStyle}/10
- Intensidad del tema: ${knobs.themeIntensity}/10

REGLAS:
1. Máximo 120 caracteres
2. Incluye género musical, tempo, y mood
3. Usa términos musicales precisos (BPM, tonalidad si aplica)
4. NO incluyas letra, solo descripción musical
5. Formato: [género], [tempo], [instrumentos clave], [mood/atmósfera]

EJEMPLOS:
- "upbeat pop, 128 BPM, synth-heavy, euphoric vibes"
- "melancholic indie rock, slow tempo, acoustic guitar, introspective"
- "energetic EDM, 140 BPM, heavy bass, festival anthem"

Genera SOLO el prompt musical, sin explicaciones adicionales.`

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: promptRequest }],
          max_tokens: 150,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`)
      }

      const data = await response.json()
      const enhancedPrompt = data.choices[0].message.content.trim()

      // Limitar a 180 caracteres
      const finalPrompt = enhancedPrompt.length > 180
        ? enhancedPrompt.substring(0, 177) + '...'
        : enhancedPrompt

      setMusicPrompt(finalPrompt)
      toast.success('Prompt musical generado con Groq AI!')
    } catch (err: any) {
      console.error('Error generando prompt:', err)
      setError(err.message || 'Error generando prompt')
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

    console.log('🎵 Iniciando generación de música...')
    setIsGeneratingMusic(true)
    setError('')
    setTrackUrls([])
    setGenerationProgress(0)
    setGenerationMessage('🚀 Iniciando generación...')

    try {
      // ✅ CONECTAR AL BACKEND PROPIO (igual que The Generator Next.js)
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
      const BACKEND_SECRET = import.meta.env.VITE_BACKEND_SECRET || 'dev-token'

      // Preparar prompt completo (igual que Next.js)
      const finalPrompt = instrumental
        ? `[${musicPrompt}]`
        : `[${musicPrompt}]\n\n${generatedLyrics?.trim() || ""}`

      setGenerationMessage('📡 Conectando con backend...')
      setGenerationProgress(10)

      // Llamar al backend
      const response = await fetch(`${BACKEND_URL}/api/generation/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BACKEND_SECRET}`
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          style: musicPrompt || 'pop',
          duration: 120,
          quality: 'standard',
          custom_mode: !instrumental && generatedLyrics?.trim().length > 0,
          tags: []
        })
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(`Backend error ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      const generationId = data.data?.generationId || data.generationId
      const sunoId = data.data?.sunoId || data.sunoId

      if (!generationId) {
        throw new Error('No se recibió generationId del backend')
      }

      setGenerationProgress(30)
      setGenerationMessage('⏳ Generación iniciada, esperando resultados...')

      // ✅ POLLING del estado (igual que Next.js)
      pollTrackStatus(sunoId || generationId, generationId)

    } catch (err: any) {
      console.error('❌ Error generando música:', err)
      setError(err.message || 'Error generando música')
      setTimeout(() => setError(''), 5000)
      setIsGeneratingMusic(false)
      setGenerationProgress(0)
      setGenerationMessage('')
    }
  }

  // ✅ Función de polling (igual que Next.js)
  const pollTrackStatus = async (trackId: string, generationId?: string) => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
    const BACKEND_SECRET = import.meta.env.VITE_BACKEND_SECRET || 'dev-token'

    const maxAttempts = 60 // 5 minutos máximo (5s * 60)
    let attempts = 0

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setError('Tiempo de espera agotado')
        setIsGeneratingMusic(false)
        return
      }

      attempts++
      setGenerationProgress(30 + Math.min(attempts * 2, 60))
      setGenerationMessage(`🔄 Verificando estado... (${attempts}/${maxAttempts})`)

      try {
        // Priorizar backend si tenemos generationId
        let response
        if (generationId) {
          response = await fetch(`${BACKEND_URL}/api/generation/${generationId}/status`, {
            headers: {
              'Authorization': `Bearer ${BACKEND_SECRET}`
            }
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success && data.data) {
              const gen = data.data

              if (gen.status === 'completed' && gen.audioUrl) {
                // ✅ Música lista
                setTrackUrls([gen.audioUrl])
                setCurrentTrack('track1')
                setGenerationProgress(100)
                setGenerationMessage('🎉 ¡Música generada exitosamente!')
                toast.success('¡Música generada exitosamente!')
                setIsGeneratingMusic(false)
                return
              } else if (gen.status === 'failed') {
                throw new Error(gen.error || 'Generación falló')
              } else {
                // Sigue procesando
                setTimeout(poll, 5000)
                return
              }
            }
          }
        }

        // Fallback: consultar directamente a Suno si backend falla
        if (trackId) {
          response = await fetch(`https://usa.imgkits.com/node-api/suno/get_mj_status/${trackId}`, {
            headers: {
              'authorization': 'Bearer placeholder', // No crítico para status
              'channel': 'node-api',
              'origin': 'https://www.livepolls.app',
              'referer': 'https://www.livepolls.app/'
            }
          })

          if (response.ok) {
            const data = await response.json()

            if (data.running === false && data.audio_url) {
              // ✅ Música lista
              setTrackUrls([data.audio_url])
              setCurrentTrack('track1')
              setGenerationProgress(100)
              setGenerationMessage('🎉 ¡Música generada exitosamente!')
              toast.success('¡Música generada exitosamente!')
              setIsGeneratingMusic(false)
              return
            } else if (data.running === true) {
              // Sigue procesando
              setTimeout(poll, 5000)
              return
            }
          }
        }

        // Continuar polling
        setTimeout(poll, 5000)

      } catch (error: any) {
        console.error('Error en polling:', error)
        setError(error.message || 'Error consultando estado')
        setIsGeneratingMusic(false)
      }
    }

    // Iniciar polling
    setTimeout(poll, 3000) // Esperar 3s antes del primer check
  }

  // Control de audio
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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = parseFloat(e.target.value)
    setPosition(newPosition)
    if (audioRef.current) {
      audioRef.current.currentTime = newPosition
    }
  }

  const currentTrackUrl = tracks.find(t => t.id === currentTrack)?.url || ''

  const getLiteraryPrompt = () => {
    const knobs = useKnobsStore.getKnobs()
    let prompt = ''

    if (knobs.emotionalIntensity >= 8) {
      prompt += 'Usa emociones intensas y dramáticas. '
    } else if (knobs.emotionalIntensity <= 3) {
      prompt += 'Mantén un tono emocional sutil y delicado. '
    } else {
      prompt += 'Usa emociones moderadas y equilibradas. '
    }

    if (knobs.poeticStyle >= 8) {
      prompt += 'Emplea metáforas complejas y lenguaje poético sofisticado. '
    } else if (knobs.poeticStyle <= 3) {
      prompt += 'Usa lenguaje directo y simple. '
    } else {
      prompt += 'Combina elementos poéticos con lenguaje accesible. '
    }

    if (knobs.rhymeComplexity >= 8) {
      prompt += 'Crea patrones de rima complejos y variados. '
    } else if (knobs.rhymeComplexity <= 3) {
      prompt += 'Usa rimas simples. '
    } else {
      prompt += 'Incluye rimas moderadas y naturales. '
    }

    return prompt.trim()
  }

  const knobs = useKnobsStore.getKnobs()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0C10] via-[#1a1d29] to-[#0A0C10] relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-96 h-96 bg-[#B84DFF] rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#00FFE7] rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-8 md:mb-12">
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-3 md:mb-4">
            <Music className="w-8 h-8 md:w-12 md:h-12 text-[#00FFE7]" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-[#00FFE7] via-[#B84DFF] to-[#9AF7EE] bg-clip-text text-transparent font-mono tracking-wider">THE GENERATOR</h1>
          </div>
          <p className="text-[#9AF7EE] text-sm md:text-base lg:text-lg px-4">Crea música profesional con IA</p>
        </div>
        {error && (
          <div className="mb-6 bg-red-500/20 border-2 border-red-500 rounded-2xl p-4 backdrop-blur-sm">
            <p className="text-red-200 text-center font-semibold">{error}</p>
          </div>
        )}

        {/* Panel de Control Literario */}
        <div className="bg-[#1a1d29]/50 backdrop-blur-xl rounded-3xl p-6 border-2 border-[#00FFE7]/20 shadow-2xl mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-[#B84DFF] to-[#00FFE7] rounded-xl">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">Control Literario</h3>
            <span className="text-sm text-[#9AF7EE]">Control total del estilo</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4">
            {[ // Array of knob configurations
              {
                label: "Intensidad Emocional",
                value: knobs.emotionalIntensity,
                onChange: (value: number) => useKnobsStore.setKnobs({ emotionalIntensity: value }),
                icon: Heart,
                color: "text-[#FF1744]",
                tooltip: "Sutil → Dramático"
              },
              {
                label: "Estilo Poético",
                value: knobs.poeticStyle,
                onChange: (value: number) => useKnobsStore.setKnobs({ poeticStyle: value }),
                icon: BookOpen,
                color: "text-[#B84DFF]",
                tooltip: "Simple → Sofisticado"
              },
              {
                label: "Complejidad de Rimas",
                value: knobs.rhymeComplexity,
                onChange: (value: number) => useKnobsStore.setKnobs({ rhymeComplexity: value }),
                icon: Zap,
                color: "text-[#FFD700]",
                tooltip: "Libre → Complejo"
              },
              {
                label: "Profundidad Narrativa",
                value: knobs.narrativeDepth,
                onChange: (value: number) => useKnobsStore.setKnobs({ narrativeDepth: value }),
                icon: BookOpen,
                color: "text-[#00FFE7]",
                tooltip: "Directo → Profundo"
              },
              {
                label: "Estilo de Lenguaje",
                value: knobs.languageStyle,
                onChange: (value: number) => useKnobsStore.setKnobs({ languageStyle: value }),
                icon: Palette,
                color: "text-[#9AF7EE]",
                tooltip: "Coloquial → Formal"
              },
              {
                label: "Intensidad del Tema",
                value: knobs.themeIntensity,
                onChange: (value: number) => useKnobsStore.setKnobs({ themeIntensity: value }),
                icon: Zap,
                color: "text-[#B84DFF]",
                tooltip: "Sutil → Intenso"
              }
            ].map((knob, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#1a1d29]/30 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <knob.icon className={`w-4 h-4 ${knob.color}`} />
                  <label className="text-sm font-medium text-white">{knob.label}</label>
                </div>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={knob.value}
                    onChange={(e) => knob.onChange(parseFloat(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer slider bg-[#333] slider-thumb:bg-[#00FFE7]"
                  />
                  <div className="text-center text-sm text-gray-400">{knob.value}/10</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          <div className="bg-[#1a1d29]/50 backdrop-blur-xl rounded-3xl p-6 border-2 border-[#00FFE7]/20 shadow-2xl hover:border-[#B84DFF]/50 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-[#B84DFF] to-[#00FFE7] rounded-xl">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Letra</h2>
            </div>
            <textarea
              value={lyricsInput}
              onChange={e => setLyricsInput(e.target.value || '')}
              disabled={instrumental || isGeneratingLyrics}
              placeholder="Escribe palabras o ideas..."
              className="w-full h-40 px-4 py-3 bg-black/30 border-2 border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 disabled:opacity-50 resize-none mb-4"
            />
            {generatedLyrics && (
              <div className="mb-4 p-4 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl border border-purple-500/30 max-h-60 overflow-y-auto">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <p className="text-sm font-semibold text-purple-300">Letra Generada</p>
                </div>
                <pre className="text-white whitespace-pre-wrap text-sm">{generatedLyrics}</pre>
              </div>
            )}
            <button onClick={handleGenerateLyrics} disabled={isGeneratingLyrics || instrumental} className="w-full bg-gradient-to-r from-[#B84DFF] to-[#00FFE7] hover:from-[#B84DFF]/80 hover:to-[#00FFE7]/80 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2">
              {isGeneratingLyrics ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Generando...</span></> : <><Wand2 className="w-5 h-5" /><span>Generar Letra</span></>}
            </button>
          </div>
          <div className="bg-[#1a1d29]/50 backdrop-blur-xl rounded-3xl p-6 border-2 border-[#00FFE7]/20 shadow-2xl hover:border-[#9AF7EE]/50 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-[#00FFE7] to-[#9AF7EE] rounded-xl">
                <Music className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Estilo</h2>
            </div>
            <textarea
              value={musicPrompt}
              onChange={e => setMusicPrompt(e.target.value || '')}
              disabled={isGeneratingPrompt}
              placeholder="Describe el estilo musical..."
              maxLength={180}
              className="w-full h-40 px-4 py-3 bg-black/30 border-2 border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 resize-none mb-4"
            />
            <div className="text-right text-sm text-gray-400 mb-2">
              {musicPrompt.length}/180 caracteres
            </div>
            <button onClick={handleGeneratePrompt} disabled={isGeneratingPrompt} className="w-full bg-gradient-to-r from-[#00FFE7] to-[#9AF7EE] hover:from-[#00FFE7]/80 hover:to-[#9AF7EE]/80 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2">
              {isGeneratingPrompt ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Generando...</span></> : <><Sparkles className="w-5 h-5" /><span>Prompt Creativo</span></>}
            </button>
          </div>
        </div>
        <div className="bg-[#1a1d29]/50 backdrop-blur-xl rounded-3xl p-6 border-2 border-[#00FFE7]/20 shadow-2xl mb-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Palette className="w-6 h-6 text-[#B84DFF]" />Configuración
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
            <button onClick={() => setVoice('male')} disabled={instrumental} className={`p-3 md:p-4 rounded-xl text-sm md:text-base font-semibold border-2 flex items-center justify-center gap-2 ${voice === 'male' && !instrumental ? 'bg-gradient-to-br from-[#00FFE7] to-[#9AF7EE] border-[#00FFE7] text-white scale-105' : 'bg-[#1a1d29]/30 border-[#00FFE7]/20 text-gray-300 hover:bg-[#1a1d29]/50'} disabled:opacity-50`}>
              <BookOpen className="w-5 h-5" /><span>Hombre</span>
            </button>
            <button onClick={() => setVoice('female')} disabled={instrumental} className={`p-4 rounded-xl font-semibold border-2 flex items-center justify-center gap-2 ${voice === 'female' && !instrumental ? 'bg-gradient-to-br from-[#B84DFF] to-[#FF1744] border-[#B84DFF] text-white scale-105' : 'bg-[#1a1d29]/30 border-[#00FFE7]/20 text-gray-300 hover:bg-[#1a1d29]/50'} disabled:opacity-50`}>
              <BookOpen className="w-5 h-5" /><span>Mujer</span>
            </button>
            <button onClick={() => setVoice('random')} disabled={instrumental} className={`p-4 rounded-xl font-semibold border-2 flex items-center justify-center gap-2 ${voice === 'random' && !instrumental ? 'bg-gradient-to-br from-[#FFD700] to-[#B84DFF] border-[#FFD700] text-white scale-105' : 'bg-[#1a1d29]/30 border-[#00FFE7]/20 text-gray-300 hover:bg-[#1a1d29]/50'} disabled:opacity-50`}>
              <Shuffle className="w-5 h-5" /><span>Random</span>
            </button>
            <button onClick={() => setVoice('duet')} disabled={instrumental} className={`p-4 rounded-xl font-semibold border-2 flex items-center justify-center gap-2 ${voice === 'duet' && !instrumental ? 'bg-gradient-to-br from-[#B84DFF] to-[#00FFE7] border-[#B84DFF] text-white scale-105' : 'bg-[#1a1d29]/30 border-[#00FFE7]/20 text-gray-300 hover:bg-[#1a1d29]/50'} disabled:opacity-50`}>
              <Zap className="w-5 h-5" /><span>Dueto</span>
            </button>
            <button onClick={() => { setInstrumental(!instrumental); if (!instrumental) { setGeneratedLyrics(''); setLyricsInput('') } }} className={`p-4 rounded-xl font-semibold border-2 flex items-center justify-center gap-2 ${instrumental ? 'bg-gradient-to-br from-[#FF1744] to-[#FFD700] border-[#FF1744] text-white scale-105' : 'bg-[#1a1d29]/30 border-[#00FFE7]/20 text-gray-300 hover:bg-[#1a1d29]/50'}`}>
              <Music className="w-5 h-5" /><span>Instrumental</span>
            </button>
          </div>
        </div>

        <button onClick={handleGenerateMusic} disabled={isGeneratingMusic} className="w-full bg-gradient-to-r from-[#00FFE7] via-[#B84DFF] to-[#FF1744] hover:from-[#00FFE7]/80 hover:via-[#B84DFF]/80 hover:to-[#FF1744]/80 disabled:from-gray-600 disabled:to-gray-700 text-white text-xl font-black py-8 rounded-3xl transition-all transform hover:scale-105 disabled:hover:scale-100 shadow-2xl flex items-center justify-center gap-3 mb-6 font-mono">
          {isGeneratingMusic ? <><Loader2 className="w-8 h-8 animate-spin" /><span>Generando {generationProgress}%</span></> : <><Play className="w-8 h-8" /><span>The Generator</span></>}
        </button>

        {isGeneratingMusic && (
          <div className="mb-6 bg-[#1a1d29]/50 backdrop-blur-xl rounded-2xl p-6 border-2 border-[#B84DFF]/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 text-[#B84DFF] animate-spin" />
                <span className="text-lg font-semibold text-[#9AF7EE]">{generationMessage}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-white">{generationProgress}%</span>
                <button
                  onClick={() => {
                    setIsGeneratingMusic(false)
                    setGenerationProgress(0)
                    setGenerationMessage('')
                    setError('Generación cancelada por el usuario')
                    setTimeout(() => setError(''), 3000)
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
            <div className="w-full h-4 bg-black/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#00FFE7] via-[#B84DFF] to-[#FF1744] transition-all duration-500 rounded-full" style={{ width: `${generationProgress}%` }} />
            </div>
            <p className="mt-3 text-center text-sm text-gray-400">
              Tiempo estimado: {Math.max(0, Math.round((100 - generationProgress) / 100 * 120))}s
              {generationProgress === 50 && (
                <span className="block text-yellow-400 mt-1">
                  ⚠️ Si se queda atascado en 50%, cancela e intenta de nuevo
                </span>
              )}
            </p>
          </div>
        )}

        {/* REPRODUCTOR PROFESIONAL PARA TRACKS */}
        <div className="bg-gradient-to-br from-[#1a1d29]/50 via-[#0A0C10]/30 to-[#1a1d29]/50 backdrop-blur-xl rounded-3xl p-8 border-2 border-[#00FFE7]/50 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-4 bg-gradient-to-br from-[#00FFE7] to-[#B84DFF] rounded-xl">
              <Play className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-white">🔊 Reproductor de Tracks</h3>
            <span className="text-sm text-[#9AF7EE]">Escucha tus creaciones</span>
          </div>

          {/* Track Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
            {tracks.map((track, index) => (
              <div
                key={track.id}
                onClick={() => setCurrentTrack(track.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${currentTrack === track.id
                    ? 'bg-gradient-to-br from-[#B84DFF] to-[#00FFE7] border-[#B84DFF] text-white'
                    : 'bg-[#1a1d29]/30 border-[#00FFE7]/20 text-gray-300 hover:bg-[#1a1d29]/50'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-[#B84DFF] to-[#00FFE7] rounded-lg">
                    <Play className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">{track.name}</h4>
                    <p className="text-sm opacity-75">
                      {track.url ? '✅ Listo para reproducir' : '⏳ Procesando...'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Audio Controls */}
          {currentTrack && (
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="w-full">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={position}
                  onChange={handleSeek}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #00FFE7 0%, #00FFE7 ${(position / duration) * 100}%, rgba(255,255,255,0.2) ${(position / duration) * 100}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />
                <div className="flex justify-between text-sm text-gray-400 mt-1">
                  <span>{Math.floor(position / 60)}:{(position % 60).toFixed(0).padStart(2, '0')}</span>
                  <span>{Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setPosition(Math.max(0, position - 10))}
                  className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
                >
                  <SkipBack className="w-5 h-5 text-white" />
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={!currentTrackUrl}
                  className="p-4 bg-gradient-to-r from-[#B84DFF] to-[#00FFE7] rounded-xl hover:from-[#B84DFF]/80 hover:to-[#00FFE7]/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white" />
                  )}
                </button>

                <button
                  onClick={() => setPosition(Math.min(duration, position + 10))}
                  className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
                >
                  <SkipForward className="w-5 h-5 text-white" />
                </button>

                <button
                  onClick={() => setVolume(volume === 0 ? 75 : 0)}
                  className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
                >
                  {volume === 0 ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>

              {/* Download Button */}
              <div className="flex justify-center">
                <a
                  href={currentTrackUrl}
                  download={`track-${currentTrack}.mp3`}
                  className={`px-6 py-3 bg-gradient-to-r from-[#B84DFF] to-[#00FFE7] hover:from-[#B84DFF]/80 hover:to-[#00FFE7]/80 text-white font-bold rounded-xl transition-all flex items-center gap-2 ${!currentTrackUrl ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Track</span>
                </a>
              </div>
            </div>
          )}

          {/* Estado de los tracks */}
          <div className="mt-6 p-4 bg-black/20 rounded-xl">
            <h4 className="text-lg font-semibold text-white mb-2">Estado de Generación:</h4>
            <div className="space-y-2">
              {tracks.map((track, index) => (
                <div key={track.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{track.name}:</span>
                  <span className={track.url ? 'text-green-400' : 'text-yellow-400'}>
                    {track.url ? '✅ Completado' : '⏳ Procesando...'}
                  </span>
                </div>
              ))}
            </div>
            {trackUrls.length === 0 && (
              <p className="text-gray-400 text-sm mt-2">
                Genera música para ver los tracks aquí
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Audio Element Real */}
      <audio
        ref={audioRef}
        src={currentTrackUrl}
        preload="metadata"
        className="hidden"
      />
    </div>
  )
}
