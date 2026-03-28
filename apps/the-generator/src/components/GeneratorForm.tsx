import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../providers/AuthProvider';
import { useGeneration } from '@super-son1k/shared-hooks';
import { ProgressTracker } from './ProgressTracker';
import { AudioPlayer } from './AudioPlayer';
import { 
  Music2, Sparkles, Mic, Volume2, 
  Sliders, Crown, Play, Pause, Download,
  AlertCircle, CheckCircle
} from 'lucide-react';

interface GeneratorFormProps {
  onGenerationComplete?: (generationId: string) => void;
}

type Genre = 'pop' | 'rock' | 'electronic' | 'hip-hop' | 'ambient' | 'jazz' | 'classical' | 'latin' | 'country' | 'rnb' | 'metal' | 'indie';
type VocalStyle = 'emotional' | 'energetic' | 'calm' | 'powerful';
type Quality = 'standard' | 'high' | 'ultra';

export function GeneratorForm({ onGenerationComplete }: GeneratorFormProps) {
  const { user, userTier } = useAuth();
  const userId = user?.id || 'anonymous';
  
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState<Genre>('pop');
  const [duration, setDuration] = useState(180);
  const [quality, setQuality] = useState<Quality>('high');
  
  // Vocal options
  const [includeVocals, setIncludeVocals] = useState(false);
  const [lyrics, setLyrics] = useState('');
  const [vocalStyle, setVocalStyle] = useState<VocalStyle>('emotional');
  const [includeHarmonies, setIncludeHarmonies] = useState(false);
  
  // UI state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showLyricsModal, setShowLyricsModal] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<{
    url: string;
    metadata: Record<string, unknown>;
  } | null>(null);

  const canUseVoiceClone = ['PRO', 'STUDIO'].includes(userTier?.tier || '');
  const canUseHarmonies = ['PRO', 'STUDIO'].includes(userTier?.tier || '');
  const canUseUltra = ['PRO', 'STUDIO'].includes(userTier?.tier || '');

  const {
    isGenerating,
    error,
    limits,
    generate,
    clearError,
    canGenerate,
    remaining,
    tier,
    progress,
    stage,
    jobId
  } = useGeneration({
    userId,
    onLimitReached: () => setShowUpgradeModal(true),
    onGenerationComplete: (id) => {
      onGenerationComplete?.(id);
    }
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    if (includeVocals && !lyrics.trim()) {
      setShowLyricsModal(true);
      return;
    }

    setGeneratedAudio(null);
    
    const result = await generate(prompt, {
      genre,
      duration,
      quality: canUseUltra ? quality : 'standard',
      includeVocals,
      lyrics: includeVocals ? lyrics : undefined,
      includeHarmonies: canUseHarmonies && includeHarmonies,
      vocalStyle
    });

    if (result) {
      setPrompt('');
      if (!includeVocals) {
        setLyrics('');
      }
    }
  };

  const genres: { value: Genre; label: string; icon: string }[] = [
    { value: 'pop', label: 'Pop', icon: '🎤' },
    { value: 'rock', label: 'Rock', icon: '🎸' },
    { value: 'electronic', label: 'Electronic', icon: '🎹' },
    { value: 'hip-hop', label: 'Hip-Hop', icon: '🎧' },
    { value: 'ambient', label: 'Ambient', icon: '🌙' },
    { value: 'jazz', label: 'Jazz', icon: '🎷' },
    { value: 'classical', label: 'Classical', icon: '🎻' },
    { value: 'latin', label: 'Latin', icon: '💃' },
    { value: 'country', label: 'Country', icon: '🤠' },
    { value: 'rnb', label: 'R&B', icon: '🎵' },
    { value: 'metal', label: 'Metal', icon: '🤘' },
    { value: 'indie', label: 'Indie', icon: '🎸' },
  ];

  const qualityOptions = [
    { value: 'standard', label: 'Standard', tier: 'FREE', desc: 'Basic quality' },
    { value: 'high', label: 'High Quality', tier: 'CREATOR', desc: 'Professional quality' },
    { value: 'ultra', label: 'Ultra HD', tier: 'PRO', desc: 'Studio quality' }
  ];

  const vocalStyles: { value: VocalStyle; label: string; desc: string }[] = [
    { value: 'emotional', label: 'Emotional', desc: 'Deep, touching vocals' },
    { value: 'energetic', label: 'Energetic', desc: 'Powerful, dynamic vocals' },
    { value: 'calm', label: 'Calm', desc: 'Peaceful, gentle vocals' },
    { value: 'powerful', label: 'Powerful', desc: 'Strong, commanding vocals' },
  ];

  const isQualityAvailable = (requiredTier: string) => {
    const tierHierarchy = { FREE: 0, CREATOR: 1, PRO: 2, STUDIO: 3 };
    const required = tierHierarchy[requiredTier as keyof typeof tierHierarchy] || 0;
    const current = tierHierarchy[tier as keyof typeof tierHierarchy] || 0;
    return current >= required;
  };

  return (
    <div className="generator-form max-w-4xl mx-auto">
      {/* Limits Indicator */}
      {limits && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-carbón-dark border border-cian/20 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cian to-magenta flex items-center justify-center text-white font-bold text-xl">
                {remaining}
              </div>
              <div>
                <p className="text-white font-semibold">
                  {remaining} generation{remaining !== 1 ? 's' : ''} remaining
                </p>
                <p className="text-xs text-gray-400">
                  {tier} tier • Resets {new Date(limits.resetAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            {tier === 'FREE' && (
              <button
                onClick={() => window.location.href = '/pricing'}
                className="px-4 py-2 bg-gradient-to-r from-cian to-magenta text-white rounded-lg text-sm font-bold"
              >
                Upgrade
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Main Form */}
      <div className="bg-carbón-dark border border-cian/20 rounded-xl p-8">
        <h2 className="text-3xl font-bold mb-6">
          <span className="bg-gradient-to-r from-cian to-magenta bg-clip-text text-transparent">
            Create Original Music
          </span>
        </h2>

        {/* Progress Tracker */}
        {isGenerating && (
          <div className="mb-6">
            <ProgressTracker 
              stage={stage || 'queued'} 
              progress={progress || 0} 
            />
          </div>
        )}

        {/* Generated Audio Player */}
        {generatedAudio && !isGenerating && (
          <div className="mb-6 p-4 bg-carbón rounded-lg">
            <AudioPlayer 
              src={generatedAudio.url}
              metadata={generatedAudio.metadata}
            />
          </div>
        )}

        {/* Prompt Input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-white mb-2">
            Describe your music
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., An upbeat electronic dance track with tropical vibes, powerful synths, and energetic drops"
            className="w-full px-4 py-3 bg-carbón border border-cian/20 rounded-lg text-white placeholder-gray-500 focus:border-cian focus:outline-none resize-none"
            rows={3}
            disabled={isGenerating}
          />
        </div>

        {/* Genre Selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-white mb-2">
            Genre
          </label>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {genres.map((g) => (
              <button
                key={g.value}
                onClick={() => setGenre(g.value)}
                disabled={isGenerating}
                className={`
                  p-2 rounded-lg border text-center transition-all text-sm
                  ${genre === g.value 
                    ? 'border-cian bg-cian/20 text-white' 
                    : 'border-gray-700 text-gray-400 hover:border-cian/50'}
                  ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <span className="block text-lg mb-1">{g.icon}</span>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-white mb-2">
            Duration: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
          </label>
          <input
            type="range"
            min="30"
            max="300"
            step="15"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            disabled={isGenerating}
            className="w-full slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0:30</span>
            <span>5:00</span>
          </div>
        </div>

        {/* Quality Selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-white mb-2">
            Quality
          </label>
          <div className="grid grid-cols-3 gap-3">
            {qualityOptions.map((option) => {
              const available = isQualityAvailable(option.tier);
              return (
                <button
                  key={option.value}
                  onClick={() => available && setQuality(option.value as Quality)}
                  disabled={!available || isGenerating}
                  className={`
                    p-3 rounded-lg border-2 text-left transition-all
                    ${quality === option.value && available
                      ? 'border-cian bg-cian/10'
                      : available
                        ? 'border-gray-700 hover:border-cian/50'
                        : 'border-gray-700 opacity-40 cursor-not-allowed'
                    }
                  `}
                >
                  <div className="font-semibold text-white">{option.label}</div>
                  <div className="text-xs text-gray-400">{option.desc}</div>
                  {!available && (
                    <div className="text-xs text-amber-400 mt-1">
                      <Crown className="w-3 h-3 inline mr-1" />
                      {option.tier}+
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Vocal Options */}
        <div className="mb-6 p-4 bg-carbón rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-white">
              <Mic className="w-4 h-4" />
              Include Vocals
            </label>
            <button
              onClick={() => setIncludeVocals(!includeVocals)}
              disabled={isGenerating}
              className={`
                w-12 h-6 rounded-full transition-all relative
                ${includeVocals ? 'bg-cian' : 'bg-gray-600'}
              `}
            >
              <div className={`
                absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all
                ${includeVocals ? 'left-6' : 'left-0.5'}
              `} />
            </button>
          </div>

          {includeVocals && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-2">
                  Vocal Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {vocalStyles.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => setVocalStyle(style.value)}
                      className={`
                        p-2 rounded border text-xs text-left transition-all
                        ${vocalStyle === style.value
                          ? 'border-cian bg-cian/10'
                          : 'border-gray-700 hover:border-cian/50'}
                      `}
                    >
                      <div className="font-medium text-white">{style.label}</div>
                      <div className="text-gray-400">{style.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-2">
                  Lyrics (or leave blank for instrumental)
                </label>
                <textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder="Enter your lyrics here..."
                  className="w-full px-3 py-2 bg-carbón-dark border border-gray-700 rounded text-white text-sm"
                  rows={3}
                />
              </div>

              {/* Harmonies - PRO only */}
              {canUseHarmonies && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Include Harmonies</span>
                  <button
                    onClick={() => setIncludeHarmonies(!includeHarmonies)}
                    className={`
                      w-10 h-5 rounded-full transition-all relative
                      ${includeHarmonies ? 'bg-cian' : 'bg-gray-600'}
                    `}
                  >
                    <div className={`
                      absolute w-4 h-4 bg-white rounded-full top-0.5 transition-all
                      ${includeHarmonies ? 'left-5' : 'left-0.5'}
                    `} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <div className="flex-1">
                  <p className="text-red-400 font-medium">{error}</p>
                </div>
                <button onClick={clearError} className="text-red-400 hover:text-red-300">
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !canGenerate || !prompt.trim()}
          className={`
            w-full py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2
            ${isGenerating || !canGenerate || !prompt.trim()
              ? 'bg-gray-600 cursor-not-allowed text-gray-400'
              : 'bg-gradient-to-r from-cian to-magenta text-white hover:shadow-xl hover:shadow-cian/50'
            }
          `}
        >
          {isGenerating ? (
            <>
              <span className="animate-spin">⏳</span>
              Generating... {progress ? `(${Math.round(progress)}%)` : ''}
            </>
          ) : !canGenerate ? (
            'Limit Reached'
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Music
            </>
          )}
        </button>

        {/* Info */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Professional quality output • LUFS -14 • 44.1kHz/24-bit
          {tier !== 'FREE' && (
            <span className="text-cian ml-2">• 5% to Community Pool</span>
          )}
        </p>
      </div>

      {/* Lyrics Modal */}
      <AnimatePresence>
        {showLyricsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowLyricsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-carbón-dark border-2 border-cian rounded-xl p-6 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Add Lyrics</h3>
              <p className="text-gray-400 mb-4">
                You selected "Include Vocals" but haven't added lyrics.
              </p>
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                placeholder="Enter your lyrics here..."
                className="w-full px-4 py-3 bg-carbón border border-gray-700 rounded-lg text-white mb-4"
                rows={5}
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIncludeVocals(false);
                    setShowLyricsModal(false);
                    handleGenerate();
                  }}
                  className="flex-1 py-3 bg-gray-700 text-white rounded-lg"
                >
                  Skip (Instrumental)
                </button>
                <button
                  onClick={() => setShowLyricsModal(false)}
                  className="flex-1 py-3 bg-cian text-white rounded-lg font-bold"
                >
                  Continue with Lyrics
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowUpgradeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-carbón-dark border-2 border-cian rounded-xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <Crown className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">
                  Upgrade to Continue
                </h3>
                <p className="text-gray-400 mb-6">
                  {tier === 'FREE'
                    ? "You've used all your free generations. Upgrade to CREATOR for 50/month!"
                    : "You've reached your monthly limit. Upgrade for more!"}
                </p>
                <button
                  onClick={() => window.location.href = '/pricing'}
                  className="w-full py-3 bg-gradient-to-r from-cian to-magenta text-white rounded-lg font-bold"
                >
                  View Plans →
                </button>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full py-3 mt-2 text-gray-400"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
