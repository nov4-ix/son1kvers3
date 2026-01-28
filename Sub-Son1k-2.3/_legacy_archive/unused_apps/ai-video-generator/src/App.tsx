import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Video,
  Play,
  Pause,
  Download,
  Share2,
  Palette,
  Music,
  Film,
  Clock,
  Eye,
  Volume2,
  Upload
} from 'lucide-react'
import toast from 'react-hot-toast'

interface VideoStyle {
  id: string
  name: string
  description: string
  preview: string
  category: 'abstract' | 'cinematic' | 'vintage' | 'modern' | 'artistic'
}

interface GeneratedVideo {
  id: string
  title: string
  audioFile: string
  style: string
  duration: number
  resolution: string
  fps: number
  createdAt: string
  thumbnail: string
}

// Define static asset paths for better maintainability
const ASSET_PATHS = {
  styleCyberpunk: '/style-cyberpunk.jpg',
  styleVintage: '/style-vintage.jpg',
  styleAbstract: '/style-abstract.jpg',
  styleCinematic: '/style-cinematic.jpg',
  styleParticles: '/style-particles.jpg',
  styleWaveform: '/style-waveform.jpg',
  videoThumbnailGenerated: '/video-thumb-generated.jpg',
}

export function AIVideoGenerator() {
  const [selectedAudio, setSelectedAudio] = useState<File | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioPreview, setAudioPreview] = useState<string | null>(null)
  const [generationProgress, setGenerationProgress] = useState(0)

  // Effect to revoke the object URL when audioPreview changes or component unmounts
  useEffect(() => {
    return () => {
      if (audioPreview) {
        URL.revokeObjectURL(audioPreview)
      }
    }
  }, [audioPreview])

  const videoStyles: VideoStyle[] = [
    {
      id: 'cyberpunk',
      name: 'Cyberpunk',
      description: 'Neon lights, glitch effects, futuristic atmosphere',
      preview: ASSET_PATHS.styleCyberpunk,
      category: 'modern'
    },
    {
      id: 'vintage-film',
      name: 'Vintage Film',
      description: 'Classic film grain, warm colors, retro aesthetics',
      preview: ASSET_PATHS.styleVintage,
      category: 'vintage'
    },
    {
      id: 'abstract-art',
      name: 'Abstract Art',
      description: 'Fluid shapes, color gradients, artistic expression',
      preview: ASSET_PATHS.styleAbstract,
      category: 'abstract'
    },
    {
      id: 'cinematic',
      name: 'Cinematic',
      description: 'Movie-like quality, dramatic lighting, professional look',
      preview: ASSET_PATHS.styleCinematic,
      category: 'cinematic'
    },
    {
      id: 'particle-dance',
      name: 'Particle Dance',
      description: 'Dynamic particles synchronized with audio',
      preview: ASSET_PATHS.styleParticles,
      category: 'abstract'
    },
    {
      id: 'waveform',
      name: 'Waveform Visualizer',
      description: 'Audio-reactive waveforms and frequency visualization',
      preview: ASSET_PATHS.styleWaveform,
      category: 'modern'
    }
  ]

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('audio/')) {
      setSelectedAudio(file)
      // If there's an existing preview URL, revoke it before creating a new one
      if (audioPreview) {
        URL.revokeObjectURL(audioPreview)
      }
      const url = URL.createObjectURL(file)
      setAudioPreview(url)
      toast.success('Audio file uploaded successfully!')
    } else {
      toast.error('Please select a valid audio file')
    }
  }

  const generateVideo = async () => {
    if (!selectedAudio || !selectedStyle) {
      toast.error('Please select an audio file and video style')
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)

    // Simulate generation progress
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + Math.random() * 15
      })
    }, 500)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 8000))

      const newVideo: GeneratedVideo = {
        id: Math.random().toString(36).substr(2, 9),
        title: `Video for ${selectedAudio.name}`,
        audioFile: selectedAudio.name,
        style: selectedStyle,
        duration: 180, // 3 minutes
        resolution: '1920x1080',
        fps: 30,
        createdAt: new Date().toISOString(),
        thumbnail: ASSET_PATHS.videoThumbnailGenerated // Using constant here
      }

      setGeneratedVideo(newVideo)
      setGenerationProgress(100)
      toast.success('Video generated successfully!')
    } catch (error) {
      toast.error('Failed to generate video')
    } finally {
      setIsGenerating(false)
      clearInterval(progressInterval)
    }
  }

  const handlePlay = () => {
    setIsPlaying(!isPlaying)
    toast.success(isPlaying ? 'Paused' : 'Playing video')
  }

  const handleDownload = () => {
    toast.success('Video download started!')
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-[#00FFE7] mb-2 flex items-center justify-center gap-2">
            <Film size={32} />
            AI Video Generator
          </h1>
          <p className="text-gray-400">
            Create stunning music videos with AI-powered visuals
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Generation Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 sticky top-6">
              <h2 className="text-xl font-semibold mb-4 text-[#00FFE7] flex items-center gap-2">
                <Palette size={20} />
                Generate Video
              </h2>

              {/* Audio Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Audio File *
                </label>
                <div className="border-2 border-dashed border-[#333] rounded-lg p-4 text-center hover:border-[#00FFE7] transition-colors">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioUpload}
                    className="hidden"
                    id="audio-upload"
                  />
                  <label htmlFor="audio-upload" className="cursor-pointer">
                    {selectedAudio ? (
                      <div>
                        <Music size={24} className="mx-auto mb-2 text-[#00FFE7]" />
                        <p className="text-sm font-medium">{selectedAudio.name}</p>
                        <p className="text-xs text-gray-400">
                          {(selectedAudio.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-400">Click to upload audio file</p>
                        <p className="text-xs text-gray-500">MP3, WAV, FLAC supported</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Audio Preview */}
              {audioPreview && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Audio Preview</h3>
                  <audio
                    controls
                    src={audioPreview}
                    className="w-full h-10"
                  />
                </div>
              )}

              {/* Video Styles */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Video Style *</h3>
                <div className="space-y-3">
                  {videoStyles.map((style) => (
                    <motion.div
                      key={style.id}
                      whileHover={{ scale: 1.02 }}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedStyle === style.id
                          ? 'border-[#00FFE7] bg-[#00FFE7]/10'
                          : 'border-[#333] hover:border-[#555]'
                      }`}
                      onClick={() => setSelectedStyle(style.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#333] rounded-lg flex items-center justify-center overflow-hidden">
                          {style.preview ? (
                            <img src={style.preview} alt={`${style.name} preview`} className="w-full h-full object-cover" />
                          ) : (
                            <Palette size={20} className="text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{style.name}</h4>
                          <p className="text-xs text-gray-400">{style.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Generation Progress */}
              {isGenerating && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">Generating Video...</span>
                    <span className="text-sm text-[#00FFE7]">{Math.round(generationProgress)}%</span>
                  </div>
                  <div className="w-full bg-[#333] rounded-full h-2">
                    <div
                      className="bg-[#00FFE7] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${generationProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generateVideo}
                disabled={isGenerating || !selectedAudio || !selectedStyle}
                className="w-full bg-[#00FFE7] text-black font-semibold py-3 px-6 rounded-lg hover:bg-[#00FFE7]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Generating Video...
                  </>
                ) : (
                  <>
                    <Video size={20} />
                    Generate Video
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* Generated Video */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-[#333] flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#00FFE7]">Generated Video</h2>
                {generatedVideo && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">
                      {generatedVideo.resolution} • {generatedVideo.fps}fps
                    </span>
                  </div>
                )}
              </div>

              <div className="aspect-video bg-[#000] relative flex items-center justify-center">
                {generatedVideo ? (
                  <div className="text-center">
                    <div className="w-32 h-32 bg-[#00FFE7] rounded-full flex items-center justify-center mb-4">
                      <Video size={48} className="text-black" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{generatedVideo.title}</h3>
                    <p className="text-gray-400 mb-4">Style: {videoStyles.find(s => s.id === generatedVideo.style)?.name}</p>

                    <div className="flex items-center justify-center gap-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePlay}
                        className="bg-[#00FFE7] text-black p-3 rounded-lg hover:bg-[#00FFE7]/90 transition-colors"
                      >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleDownload}
                        className="bg-[#333] text-white p-3 rounded-lg hover:bg-[#444] transition-colors"
                      >
                        <Download size={20} />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleShare}
                        className="bg-[#333] text-white p-3 rounded-lg hover:bg-[#444] transition-colors"
                      >
                        <Share2 size={20} />
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <Film size={48} className="mx-auto mb-4" />
                    <p>Generate a video to see it here</p>
                  </div>
                )}
              </div>

              {generatedVideo && (
                <div className="p-4 border-t border-[#333]">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                        <Clock size={14} />
                        <span className="text-sm">Duration</span>
                      </div>
                      <div className="text-lg font-semibold text-[#00FFE7]">
                        {Math.floor(generatedVideo.duration / 60)}:{(generatedVideo.duration % 60).toString().padStart(2, '0')}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                        <Eye size={14} />
                        <span className="text-sm">Resolution</span>
                      </div>
                      <div className="text-lg font-semibold text-[#00FFE7]">
                        {generatedVideo.resolution}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                        <Volume2 size={14} />
                        <span className="text-sm">FPS</span>
                      </div>
                      <div className="text-lg font-semibold text-[#00FFE7]">
                        {generatedVideo.fps}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                        <Palette size={14} />
                        <span className="text-sm">Style</span>
                      </div>
                      <div className="text-lg font-semibold text-[#00FFE7]">
                        {videoStyles.find(s => s.id === generatedVideo.style)?.name}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Video Styles Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <h2 className="text-2xl font-bold text-[#00FFE7] mb-6">Available Video Styles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videoStyles.map((style) => (
              <motion.div
                key={style.id}
                whileHover={{ scale: 1.02 }}
                className={`bg-[#1a1a1a] border rounded-xl overflow-hidden cursor-pointer transition-colors ${
                  selectedStyle === style.id
                    ? 'border-[#00FFE7] bg-[#00FFE7]/10'
                    : 'border-[#333] hover:border-[#555]'
                }`}
                onClick={() => setSelectedStyle(style.id)}
              >
                <div className="aspect-video bg-[#333] flex items-center justify-center overflow-hidden">
                  {style.preview ? (
                    <img src={style.preview} alt={`${style.name} preview`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-gray-400">
                      <Palette size={32} className="mx-auto mb-2" />
                      <p className="text-sm">{style.name}</p>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">{style.name}</h3>
                  <p className="text-gray-400 text-sm">{style.description}</p>
                  <div className="mt-2">
                    <span className="text-xs text-[#00FFE7] capitalize">{style.category}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AIVideoGenerator