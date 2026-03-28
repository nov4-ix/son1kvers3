import './index.css'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Zap,
  Target,
  TrendingUp,
  Users,
  Calendar,
  Send,
  Copy,
  Download,
  Share2,
  BarChart3,
  Brain,
  Sparkles,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useContentGeneration } from './hooks/useContentGeneration'
import { ViralSuggestionsPanel } from './components/ViralSuggestionsPanel'
import { ContentCalendar } from './components/ContentCalendar'
import { ImpactMetricsPanel } from './components/ImpactMetricsPanel'
import { Logo } from '@super-son1k/shared-ui'

// Mock Premium Paywall component (TODO: move to shared-ui)
function PremiumPaywall({ feature, description, currentTier, requiredTier }: {
  feature: string;
  description: string;
  currentTier?: string;
  requiredTier: string;
}) {
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 text-center">
      <div className="text-4xl mb-4">🔒</div>
      <h3 className="text-lg font-bold text-white mb-2">{feature}</h3>
      <p className="text-sm text-gray-400 mb-4">{description}</p>
      <p className="text-xs text-gray-500">Requires {requiredTier} tier</p>
    </div>
  );
}

// Mock useAuth hook (TODO: move to shared-hooks)
function useAuth() {
  return {
    isPremium: true,
    isUltimate: true,
    tier: 'VANGUARD'
  };
}

const postSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  platform: z.string().min(1, 'Platform is required'),
  tone: z.string().min(1, 'Tone is required'),
  targetAudience: z.string().min(1, 'Target audience is required'),
  callToAction: z.string().optional(),
  hashtags: z.string().optional(),
})

type PostForm = z.infer<typeof postSchema>

const platforms = [
  { id: 'instagram', name: 'Instagram', icon: '📸' },
  { id: 'twitter', name: 'Twitter', icon: '🐦' },
  { id: 'facebook', name: 'Facebook', icon: '📘' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵' },
  { id: 'youtube', name: 'YouTube', icon: '📺' }
]

const tones = [
  'Professional', 'Casual', 'Friendly', 'Authoritative', 'Play',
  'Inspirational', 'Educational', 'Humorous', 'Motivational', 'Trendy'
]

const targetAudiences = [
  'Gen Z (18-26)', 'Millennials (27-42)', 'Gen X (43-58)',
  'Baby Boomers (59-77)', 'Small Business Owners', 'Entrepreneurs',
  'Students', 'Professionals', 'Creatives', 'Tech Enthusiasts'
]

interface GeneratedPost {
  id: string
  content: string
  hashtags: string[]
  engagement: {
    likes: number
    comments: number
    shares: number
    reach: number
  }
  platform: string
  createdAt: string
  metadata: any // Add metadata property
}

import { useTranslation } from 'react-i18next';

export function NovaPostPilot() {
  const { t } = useTranslation();
  const { isPremium, isUltimate, tier } = useAuth();
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([])
  const [selectedPost, setSelectedPost] = useState<GeneratedPost | null>(null)
  const [aiOnline, setAiOnline] = useState(true)

  const { generateContent, checkHealth, isGenerating, error } = useContentGeneration()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<PostForm>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      platform: 'instagram',
      tone: 'Professional',
      targetAudience: 'Millennials (27-42)'
    }
  })

  // Check AI service health on mount
  useEffect(() => {
    checkHealth().then(setAiOnline)
  }, [])

  const onSubmit = async (data: PostForm) => {
    if (!aiOnline) {
      toast.error('AI service is offline. Please check Ollama server.')
      return
    }

    try {
      const result = await generateContent(data)

      if (!result) {
        toast.error(error || 'Failed to generate content')
        return
      }

      // Handle single or multiple results
      const contents = Array.isArray(result.data) ? result.data : [result.data]

      const newPosts = contents.map(content => ({
        id: Math.random().toString(36).substr(2, 9),
        content: content.content,
        hashtags: content.hashtags,
        engagement: {
          // Mock engagement for now
          likes: Math.floor(Math.random() * 1000) + 100,
          comments: Math.floor(Math.random() * 100) + 10,
          shares: Math.floor(Math.random() * 50) + 5,
          reach: Math.floor(Math.random() * 5000) + 500
        },
        platform: data.platform,
        createdAt: new Date().toISOString(),
        metadata: result.metadata // Save metadata
      }))

      setGeneratedPosts([...newPosts, ...generatedPosts])
      setSelectedPost(newPosts[0])
      toast.success('Post generated with AI insights! ✨')
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Generation failed. Please try again.')
    }
  }

  const handleCopyPost = (post: GeneratedPost) => {
    navigator.clipboard.writeText(post.content)
    toast.success('Post copied to clipboard!')
  }

  const handleSchedulePost = (post: GeneratedPost) => {
    toast.success('Post scheduled successfully!')
  }

  const handleDownloadPost = (post: GeneratedPost) => {
    const blob = new Blob([post.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `post-${post.id}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Post downloaded!')
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Logo size={45} showText={false} />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#00bfff] to-[#ff49c3] bg-clip-text text-transparent">
                  Nova Post Pilot
                </h1>
                <p className="text-sm text-gray-400">
                  Marketing Intelligence & AI Content Strategy
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wider">AI Status</p>
              <div className="flex items-center justify-end gap-2">
                <div className={`w-2 h-2 rounded-full ${aiOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">{aiOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN: Strategy & Creation (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Viral Hooks Panel */}
            {isPremium ? (
              <ViralSuggestionsPanel />
            ) : (
              <PremiumPaywall
                feature="Viral Hooks AI"
                description="Unlock weekly viral hooks generated by AI based on current trends."
                currentTier={tier}
                requiredTier="VANGUARD"
              />
            )}

            {/* Generation Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6"
            >
              <h2 className="text-xl font-semibold mb-4 text-[#00FFE7] flex items-center gap-2">
                <Brain size={20} />
                {t('generator.title')}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Topic */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('generator.topic')}</label>
                  <textarea
                    {...register('topic')}
                    className="w-full h-24 px-3 py-2 bg-[#333] border border-[#555] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#00FFE7] focus:ring-1 focus:ring-[#00FFE7] resize-none text-sm"
                    placeholder={t('generator.topicPlaceholder')}
                  />
                  {errors.topic && <p className="text-red-400 text-xs mt-1">{errors.topic.message}</p>}
                </div>

                {/* Platform & Tone Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">{t('generator.platform')}</label>
                    <select
                      {...register('platform')}
                      className="w-full px-2 py-1.5 bg-[#333] border border-[#555] rounded-lg text-white text-sm focus:outline-none focus:border-[#00FFE7]"
                    >
                      {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">{t('generator.tone')}</label>
                    <select
                      {...register('tone')}
                      className="w-full px-2 py-1.5 bg-[#333] border border-[#555] rounded-lg text-white text-sm focus:outline-none focus:border-[#00FFE7]"
                    >
                      {tones.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Audience */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">{t('generator.audience')}</label>
                  <select
                    {...register('targetAudience')}
                    className="w-full px-2 py-1.5 bg-[#333] border border-[#555] rounded-lg text-white text-sm focus:outline-none focus:border-[#00FFE7]"
                  >
                    {targetAudiences.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isGenerating}
                  className="w-full bg-[#00FFE7] text-black font-bold py-3 px-6 rounded-lg hover:bg-[#00FFE7]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      {t('generator.button.generating')}
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      {t('generator.button.default')}
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>

          {/* MIDDLE COLUMN: Calendar & Feed (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Content Calendar */}
            <div className="h-[400px]">
              <ContentCalendar />
            </div>

            {/* Generated Posts Feed */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 size={18} className="text-[#00FFE7]" />
                Recent Generations
              </h3>

              {generatedPosts.length === 0 ? (
                <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8 text-center">
                  <Target size={48} className="mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">Ready to generate viral content?</p>
                </div>
              ) : (
                generatedPosts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-[#1a1a1a] border rounded-xl p-5 cursor-pointer transition-all ${selectedPost?.id === post.id ? 'border-[#00FFE7] shadow-[0_0_20px_rgba(0,255,231,0.1)]' : 'border-[#333] hover:border-[#555]'}`}
                    onClick={() => setSelectedPost(post)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#00FFE7]/10 rounded-full flex items-center justify-center text-[#00FFE7]">
                          {platforms.find(p => p.id === post.platform)?.icon}
                        </div>
                        <div>
                          <p className="font-medium text-white">{platforms.find(p => p.id === post.platform)?.name}</p>
                          <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); handleCopyPost(post); }} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white"><Copy size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleSchedulePost(post); }} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white"><Calendar size={14} /></button>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed mb-3 line-clamp-3">{post.content}</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {post.hashtags.map((tag, i) => (
                        <span key={i} className="text-xs text-[#00FFE7]/80 bg-[#00FFE7]/5 px-2 py-0.5 rounded">{tag}</span>
                      ))}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Insights & Analytics (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            {selectedPost?.metadata ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                {/* AI Insights Card */}
                <div className="bg-gradient-to-b from-[#00FFE7]/10 to-transparent border border-[#00FFE7]/30 rounded-xl p-5">
                  <h3 className="font-bold text-[#00FFE7] mb-4 flex items-center gap-2">
                    <Sparkles size={18} /> AI Insights
                  </h3>

                  {selectedPost.metadata.profileAnalysis && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Voice Analysis</p>
                      <div className="bg-black/40 rounded-lg p-3 text-sm">
                        <p className="text-white mb-1">Tone: <span className="text-[#00FFE7]">{selectedPost.metadata.profileAnalysis.predominantTone}</span></p>
                        <p className="text-gray-400 text-xs">{selectedPost.metadata.profileAnalysis.targetAudience}</p>
                      </div>
                    </div>
                  )}

                  {selectedPost.metadata.algorithmInsights && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Algorithm Tips</p>
                      <ul className="space-y-2">
                        {selectedPost.metadata.algorithmInsights.recommendations.slice(0, 3).map((rec: string, i: number) => (
                          <li key={i} className="text-xs text-gray-300 flex gap-2">
                            <span className="text-[#00FFE7]">•</span> {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Trending Context */}
                {selectedPost.metadata.trendingTopics && (
                  <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                      <TrendingUp size={18} className="text-pink-500" /> Trending Context
                    </h3>
                    <div className="space-y-3">
                      {selectedPost.metadata.trendingTopics.slice(0, 3).map((t: any, i: number) => (
                        <div key={i} className="text-sm">
                          <p className="text-pink-400 font-medium">{t.hashtag}</p>
                          <p className="text-xs text-gray-500">{t.context}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="bg-[#1a1a1a] border border-[#333] border-dashed rounded-xl p-8 text-center">
                <p className="text-gray-500 text-sm">Select a post to view AI insights</p>
              </div>
            )}

            {/* Impact Metrics Panel */}
            {isUltimate ? (
              <ImpactMetricsPanel />
            ) : (
              <PremiumPaywall
                feature="Growth Analytics"
                description="Projected growth metrics and strategic insights."
                currentTier={tier}
                requiredTier="COMMANDER"
              />
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default NovaPostPilot
