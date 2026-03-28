import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../providers/AuthProvider';
import { 
  Upload, Music2, Play, Pause, Download, 
  Sparkles, RefreshCw, ChevronRight, Check,
  UploadCloud, FileAudio, Wand2, Volume2,
  Settings, AlertCircle
} from 'lucide-react';

interface AnalysisResult {
  bpm: number;
  key: string;
  duration: number;
  structure: string[];
  melody: string;
}

interface TransformResult {
  original: string;
  enhanced: string;
  comparison: boolean;
}

export default function GhostStudio() {
  const { user, userTier } = useAuth();
  const userId = user?.id || '';

  // Upload state
  const [demoFile, setDemoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  
  // Transform state
  const [transforming, setTransforming] = useState(false);
  const [result, setResult] = useState<TransformResult | null>(null);
  
  // Settings
  const [selectedStyle, setSelectedStyle] = useState('professional-pop');
  const [preserveMelody, setPreserveMelody] = useState(true);
  const [addHarmonies, setAddHarmonies] = useState(false);

  const canUseGhostStudio = ['CREATOR', 'PRO', 'STUDIO'].includes(userTier?.tier || '');
  const canUseUnlimited = userTier?.tier === 'STUDIO';

  const styles = [
    { id: 'professional-pop', name: 'Professional Pop', desc: 'Radio-ready pop production' },
    { id: 'electronic-dance', name: 'Electronic Dance', desc: 'Club-ready EDM vibes' },
    { id: 'rock-energetic', name: 'Energetic Rock', desc: 'Powerful rock production' },
    { id: 'acoustic-organic', name: 'Acoustic Organic', desc: 'Natural acoustic feel' },
    { id: 'cinematic', name: 'Cinematic', desc: 'Movie-score atmosphere' },
    { id: 'lo-fi-chill', name: 'Lo-Fi Chill', desc: 'Relaxed lo-fi production' },
  ];

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload MP3, WAV, M4A, or OGG files');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        alert('File size must be under 50MB');
        return;
      }
      setDemoFile(file);
      setAnalysis(null);
      setResult(null);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!demoFile) return;

    setAnalyzing(true);
    try {
      // Simulate analysis - in production, call backend API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setAnalysis({
        bpm: Math.floor(Math.random() * 40) + 100,
        key: ['C', 'G', 'D', 'A', 'E'][Math.floor(Math.random() * 5)] + ' major',
        duration: Math.floor(demoFile.size / 10000),
        structure: ['Intro', 'Verse', 'Chorus', 'Bridge', 'Outro'],
        melody: 'Detected: Melodic pattern in G major'
      });
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleTransform = async () => {
    if (!demoFile || !canUseGhostStudio) return;

    setTransforming(true);
    try {
      // Simulate transformation - in production, call backend API
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      setResult({
        original: '/demo/original.wav',
        enhanced: '/demo/enhanced.wav',
        comparison: true
      });
    } catch (error) {
      console.error('Transform error:', error);
    } finally {
      setTransforming(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Wand2 className="w-8 h-8 text-cian" />
          Ghost Studio
        </h1>
        <p className="text-gray-400 mt-2">
          Transform your rough demos into professional productions
        </p>
      </div>

      {/* Access Check */}
      {!canUseGhostStudio && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-amber-400 font-medium">Upgrade Required</p>
              <p className="text-sm text-gray-400">
                Ghost Studio is available for CREATOR, PRO, and STUDIO tiers.
              </p>
            </div>
            <a
              href="/pricing"
              className="ml-auto px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-medium hover:bg-amber-500/30"
            >
              Upgrade
            </a>
          </div>
        </motion.div>
      )}

      {/* Step 1: Upload Demo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-carbón-dark border border-cian/20 rounded-xl p-6 mb-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-cian/20 flex items-center justify-center text-cian font-bold">
            1
          </div>
          <h2 className="text-xl font-bold text-white">Upload Your Demo</h2>
        </div>

        {!demoFile ? (
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
            <UploadCloud className="w-12 h-12 text-gray-500 mx-auto mb- <p className="text-gray-4" />
           400 mb-4">
              Drop your demo here or click to browse
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-cian/20 text-cian rounded-lg cursor-pointer hover:bg-cian/30 transition-colors">
              <Upload className="w-4 h-4" />
              Choose File
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={!canUseGhostStudio}
              />
            </label>
            <p className="text-xs text-gray-500 mt-4">
              Supported: MP3, WAV, M4A, OGG (max 50MB)
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-4 p-4 bg-carbón rounded-lg">
            <FileAudio className="w-10 h-10 text-cian" />
            <div className="flex-1">
              <p className="text-white font-medium">{demoFile.name}</p>
              <p className="text-sm text-gray-400">
                {(demoFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={() => { setDemoFile(null); setAnalysis(null); setResult(null); }}
              className="p-2 text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}
      </motion.div>

      {/* Step 2: Analysis */}
      <AnimatePresence>
        {demoFile && !analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-carbón-dark border border-cian/20 rounded-xl p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-cian/20 flex items-center justify-center text-cian font-bold">
                2
              </div>
              <h2 className="text-xl font-bold text-white">Analyze Demo</h2>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={analyzing || !canUseGhostStudio}
              className={`
                w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2
                ${analyzing || !canUseGhostStudio
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-cian/20 text-cian hover:bg-cian/30'
                }
              `}
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Analyze Track
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analysis Results */}
      <AnimatePresence>
        {analysis && !result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-carbón-dark border border-cian/20 rounded-xl p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                <Check className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white">Analysis Results</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-carbón rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-cian">{analysis.bpm}</p>
                <p className="text-sm text-gray-400">BPM</p>
              </div>
              <div className="bg-carbón rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-cian">{analysis.key}</p>
                <p className="text-sm text-gray-400">Key</p>
              </div>
              <div className="bg-carbón rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-cian">{analysis.duration}s</p>
                <p className="text-sm text-gray-400">Duration</p>
              </div>
              <div className="bg-carbón rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-cian">{analysis.structure.length}</p>
                <p className="text-sm text-gray-400">Sections</p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-carbón rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Detected Melody</p>
              <p className="text-white">{analysis.melody}</p>
            </div>

            <button
              onClick={() => window.location.href = '/ghost-studio/transform'}
              className="w-full py-3 bg-gradient-to-r from-cian to-magenta text-white rounded-lg font-bold flex items-center justify-center gap-2"
            >
              Continue to Transform
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 3: Transform Settings */}
      <AnimatePresence>
        {analysis && !result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-carbón-dark border border-cian/20 rounded-xl p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-cian/20 flex items-center justify-center text-cian font-bold">
                3
              </div>
              <h2 className="text-xl font-bold text-white">Choose Style & Transform</h2>
            </div>

            {/* Style Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Production Style
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {styles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`
                      p-3 rounded-lg border text-left transition-all
                      ${selectedStyle === style.id
                        ? 'border-cian bg-cian/10'
                        : 'border-gray-700 hover:border-cian/50'
                      }
                    `}
                  >
                    <p className="font-medium text-white text-sm">{style.name}</p>
                    <p className="text-xs text-gray-400">{style.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4 mb-6">
              <label className="flex items-center justify-between p-3 bg-carbón rounded-lg cursor-pointer">
                <div>
                  <p className="text-white">Preserve Original Melody</p>
                  <p className="text-sm text-gray-400">Keep your original melody intact</p>
                </div>
                <button
                  onClick={() => setPreserveMelody(!preserveMelody)}
                  className={`
                    w-12 h-6 rounded-full transition-all relative
                    ${preserveMelody ? 'bg-cian' : 'bg-gray-600'}
                  `}
                >
                  <div className={`
                    absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all
                    ${preserveMelody ? 'left-6' : 'left-0.5'}
                  `} />
                </button>
              </label>

              {['PRO', 'STUDIO'].includes(userTier?.tier || '') && (
                <label className="flex items-center justify-between p-3 bg-carbón rounded-lg cursor-pointer">
                  <div>
                    <p className="text-white">Add Harmonies</p>
                    <p className="text-sm text-gray-400">Generate vocal harmonies</p>
                  </div>
                  <button
                    onClick={() => setAddHarmonies(!addHarmonies)}
                    className={`
                      w-12 h-6 rounded-full transition-all relative
                      ${addHarmonies ? 'bg-cian' : 'bg-gray-600'}
                    `}
                  >
                    <div className={`
                      absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all
                      ${addHarmonies ? 'left-6' : 'left-0.5'}
                    `} />
                  </button>
                </label>
              )}
            </div>

            <button
              onClick={handleTransform}
              disabled={transforming || !canUseGhostStudio}
              className={`
                w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2
                ${transforming || !canUseGhostStudio
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cian to-magenta text-white hover:shadow-lg hover:shadow-cian/50'
                }
              `}
            >
              {transforming ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Transforming...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Transform to Professional
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-carbón-dark border border-green-500/30 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Transformation Complete!</h2>
                <p className="text-sm text-gray-400">Your professional track is ready</p>
              </div>
            </div>

            {/* Comparison Player */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-carbón rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-3">Original Demo</p>
                <div className="flex items-center gap-3">
                  <button className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white hover:bg-gray-600">
                    <Play className="w-4 h-4 ml-0.5" />
                  </button>
                  <div className="flex-1 h-2 bg-gray-700 rounded overflow-hidden">
                    <div className="w-1/3 h-full bg-gray-500" />
                  </div>
                </div>
              </div>
              <div className="bg-carbón rounded-lg p-4 border border-cian/30">
                <p className="text-sm text-cian mb-3">Professional Version</p>
                <div className="flex items-center gap-3">
                  <button className="w-10 h-10 rounded-full bg-gradient-to-r from-cian to-magenta flex items-center justify-center text-white hover:shadow-lg">
                    <Play className="w-4 h-4 ml-0.5" />
                  </button>
                  <div className="flex-1 h-2 bg-gray-700 rounded overflow-hidden">
                    <div className="w-2/3 h-full bg-gradient-to-r from-cian to-magenta" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 py-3 bg-gradient-to-r from-cian to-magenta text-white rounded-lg font-bold flex items-center justify-center gap-2">
                <Download className="w-5 h-5" />
                Download Professional
              </button>
              <button className="px-4 py-3 bg-carbón border border-gray-700 text-white rounded-lg hover:border-cian/50">
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
