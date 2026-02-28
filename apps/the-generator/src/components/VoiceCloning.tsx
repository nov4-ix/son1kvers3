import React, { useState, useCallback } from 'react';
import { Upload, Mic, Loader2, Play, Pause, Volume2, Settings, Sparkles } from 'lucide-react';

interface VoiceCloneResult {
  voice_id: string;
  status: string;
  audio_url: string;
  duration: number;
}

interface VoiceCloneProps {
  apiUrl?: string;
  userTier?: 'free' | 'basic' | 'pro' | 'enterprise';
  onCloneComplete?: (result: VoiceCloneResult) => void;
}

const VOICE_ENGINES = [
  {
    id: 'coqui',
    name: 'Coqui TTS',
    description: 'Rápido y buena calidad',
    languages: ['es', 'en', 'de', 'fr', 'it', 'pt', 'ja', 'ko', 'zh'],
    tier: 'basic'
  },
  {
    id: 'bark',
    name: 'Bark',
    description: 'Más expresivo',
    languages: ['es', 'en', 'de', 'fr'],
    tier: 'pro'
  },
  {
    id: 'xtts',
    name: 'XTTS v2',
    description: 'Mejor clonación',
    languages: ['es', 'en'],
    tier: 'pro'
  }
];

export function VoiceCloning({ 
  apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001',
  userTier = 'free',
  onCloneComplete 
}: VoiceCloneProps) {
  const [mode, setMode] = useState<'sample' | 'text'>('text');
  const [voiceSample, setVoiceSample] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [engine, setEngine] = useState('coqui');
  const [language, setLanguage] = useState('es');
  const [speed, setSpeed] = useState(1.0);
  const [cloning, setCloning] = useState(false);
  const [result, setResult] = useState<VoiceCloneResult | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tierOrder = { free: 0, basic: 1, pro: 2, enterprise: 3 };
  const userTierLevel = tierOrder[userTier];

  const canUseEngine = (engineTier: string) => {
    return tierOrder[engineTier as keyof typeof tierOrder] <= userTierLevel;
  };

  const handleSampleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVoiceSample(file);
      setResult(null);
    }
  }, []);

  const handleClone = async () => {
    if (!text && !voiceSample) return;
    
    setCloning(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('engine', engine);
      formData.append('language', language);
      formData.append('speed', String(speed));
      
      if (voiceSample) {
        formData.append('voice_sample', voiceSample);
      }

      const response = await fetch(`${apiUrl}/api/voice/clone`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Voice cloning failed');

      const data = await response.json();
      setResult(data);
      onCloneComplete?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cloning failed');
    } finally {
      setCloning(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-pink-500/20 rounded-lg">
          <Mic className="w-6 h-6 text-pink-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Voice Cloning</h2>
          <p className="text-sm text-gray-400">Clona tu voz para generar audio</p>
        </div>
        {userTier === 'enterprise' && (
          <span className="ml-auto px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full">
            ENTERPRISE
          </span>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('text')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
            mode === 'text' 
              ? 'bg-pink-600 text-white' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Texto a Voz
        </button>
        <button
          onClick={() => setMode('sample')}
          disabled={!canUseEngine('basic')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
            mode === 'sample'
              ? 'bg-pink-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          } ${!canUseEngine('basic') && 'opacity-50 cursor-not-allowed'}`}
        >
          Con Muestra
          {!canUseEngine('basic') && <span className="block text-xs">Basic+</span>}
        </button>
      </div>

      {/* Engine Selection */}
      <div className="mb-6">
        <label className="text-gray-400 text-sm mb-2 block">Motor de Voz</label>
        <div className="grid grid-cols-3 gap-2">
          {VOICE_ENGINES.map((eng) => (
            <button
              key={eng.id}
              onClick={() => setEngine(eng.id)}
              disabled={!canUseEngine(eng.tier)}
              className={`p-3 rounded-lg border transition-all ${
                engine === eng.id
                  ? 'border-pink-500 bg-pink-500/10'
                  : 'border-gray-700 bg-gray-800'
              } ${!canUseEngine(eng.tier) && 'opacity-40 cursor-not-allowed'}`}
            >
              <div className="text-white font-medium text-sm">{eng.name}</div>
              <div className="text-gray-500 text-xs">{eng.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Voice Sample Upload */}
      {mode === 'sample' && (
        <div className="mb-6">
          <label className="text-gray-400 text-sm mb-2 block">Subir muestra de voz (10-30s)</label>
          <div className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:border-pink-500 transition-colors">
            <input
              type="file"
              accept="audio/*"
              onChange={handleSampleChange}
              className="hidden"
              id="voice-sample"
            />
            <label htmlFor="voice-sample" className="cursor-pointer">
              <Upload className="w-10 h-10 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-300 text-sm">
                {voiceSample ? voiceSample.name : 'Arrastra o selecciona audio'}
              </p>
              <p className="text-gray-500 text-xs mt-1">WAV, MP3 hasta 10MB</p>
            </label>
          </div>
        </div>
      )}

      {/* Text Input */}
      <div className="mb-6">
        <label className="text-gray-400 text-sm mb-2 block">Texto a generar</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe el texto que quieres que se reproduzca con tu voz clonada..."
          className="w-full h-32 bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-pink-500 focus:outline-none resize-none"
        />
      </div>

      {/* Settings */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-gray-400 text-sm mb-2 block">Idioma</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
            <option value="fr">Français</option>
            <option value="it">Italiano</option>
            <option value="pt">Português</option>
          </select>
        </div>
        <div>
          <label className="text-gray-400 text-sm mb-2 block">Velocidad: {speed}x</label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full accent-pink-500"
          />
        </div>
      </div>

      {/* Clone Button */}
      <button
        onClick={handleClone}
        disabled={cloning || (!text && !voiceSample)}
        className="w-full py-3 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
      >
        {cloning ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Clonando voz...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generar Voz
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-green-400 text-sm font-medium">✓ Voz generada</span>
            <span className="text-gray-500 text-xs">{result.duration?.toFixed(1)}s</span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setPlaying(!playing)}
              className="flex-1 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg flex items-center justify-center gap-2"
            >
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {playing ? 'Pausar' : 'Reproducir'}
            </button>
            <button className="px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VoiceCloning;
