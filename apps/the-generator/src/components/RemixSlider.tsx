import React, { useState, useEffect } from 'react';
import { Music, Sliders, Loader2, Play, Download, RefreshCw } from 'lucide-react';

interface RemixResult {
  job_id: string;
  status: string;
  mode: string;
  progress: number;
  output_url?: string;
}

interface RemixSliderProps {
  apiUrl?: string;
  userTier?: 'free' | 'basic' | 'pro' | 'enterprise';
  audioFile?: File;
  analysisData?: {
    bpm: number;
    key: string;
    genre: string;
    duration: number;
  };
  onRemixComplete?: (result: RemixResult) => void;
}

const TIER_MODES = {
  free: [
    { id: 'remix', label: 'Remix', min: 0, max: 33, description: 'Reimaginación completa' }
  ],
  basic: [
    { id: 'remix', label: 'Remix', min: 0, max: 33, description: 'Reimaginación completa' },
    { id: 'cover', label: 'Cover', min: 34, max: 66, description: 'Mantener melodía' }
  ],
  pro: [
    { id: 'remix', label: 'Remix', min: 0, max: 33, description: 'Reimaginación completa' },
    { id: 'cover', label: 'Cover', min: 34, max: 66, description: 'Mantener melodía' },
    { id: 'upgrade', label: 'Upgrade', min: 67, max: 100, description: 'Mejorar calidad' }
  ],
  enterprise: [
    { id: 'remix', label: 'Remix', min: 0, max: 33, description: 'Reimaginación completa' },
    { id: 'cover', label: 'Cover', min: 34, max: 66, description: 'Mantener melodía' },
    { id: 'upgrade', label: 'Upgrade', min: 67, max: 100, description: 'Mejorar calidad' }
  ]
};

export function RemixSlider({
  apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001',
  userTier = 'free',
  audioFile,
  analysisData,
  onRemixComplete
}: RemixSliderProps) {
  const [fidelity, setFidelity] = useState(15);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<RemixResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  const availableModes = TIER_MODES[userTier] || TIER_MODES.free;

  const getModeFromFidelity = (value: number) => {
    if (value <= 33) return 'remix';
    if (value <= 66) return 'cover';
    return 'upgrade';
  };

  const getModeLabel = (value: number) => {
    const mode = getModeFromFidelity(value);
    const modeInfo = availableModes.find(m => m.id === mode);
    return modeInfo?.label || 'Remix';
  };

  const getModeDescription = (value: number) => {
    const mode = getModeFromFidelity(value);
    const modeInfo = availableModes.find(m => m.id === mode);
    return modeInfo?.description || '';
  };

  const isModeAvailable = (modeId: string) => {
    return availableModes.some(m => m.id === modeId);
  };

  const getFidelityColor = (value: number) => {
    if (value <= 33) return 'from-blue-500 to-purple-500';
    if (value <= 66) return 'from-purple-500 to-pink-500';
    return 'from-pink-500 to-orange-500';
  };

  const handleRemix = async () => {
    if (!audioFile) return;

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('fidelity', String(fidelity));
      formData.append('tier', userTier);

      const response = await fetch(`${apiUrl}/api/remix`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Remix failed');

      const data = await response.json();
      setResult(data);

      // Poll for status
      const interval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${apiUrl}/api/remix/${data.job_id}`);
          const statusData = await statusResponse.json();
          
          setProgress(statusData.progress);
          
          if (statusData.status === 'completed') {
            clearInterval(interval);
            setProcessing(false);
            setResult(statusData);
            onRemixComplete?.(statusData);
          } else if (statusData.status === 'failed') {
            clearInterval(interval);
            setProcessing(false);
            setError(statusData.error || 'Remix failed');
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 2000);

      setPollInterval(interval);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Remix failed');
      setProcessing(false);
    }
  };

  useEffect(() => {
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [pollInterval]);

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
          <Sliders className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Remix & Production</h2>
          <p className="text-sm text-gray-400">Mejora tu maqueta con IA</p>
        </div>
      </div>

      {/* Analysis Info */}
      {analysisData && (
        <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Análisis detectado</p>
          <div className="flex gap-4 text-sm">
            <span className="text-white">{analysisData.bpm} BPM</span>
            <span className="text-white">{analysisData.key}</span>
            <span className="text-purple-400 capitalize">{analysisData.genre}</span>
          </div>
        </div>
      )}

      {/* Mode Indicators */}
      <div className="flex gap-2 mb-6">
        {TIER_MODES.pro.map((mode) => {
          const isActive = getModeFromFidelity(fidelity) === mode.id;
          const isLocked = !isModeAvailable(mode.id);
          
          return (
            <button
              key={mode.id}
              onClick={() => {
                if (!isLocked) {
                  setFidelity((mode.min + mode.max) / 2);
                }
              }}
              disabled={isLocked}
              className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
                isActive
                  ? 'bg-gradient-to-r ' + getFidelityColor(fidelity) + ' text-white'
                  : isLocked
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {mode.label}
              {isLocked && ' 🔒'}
            </button>
          );
        })}
      </div>

      {/* Slider */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-sm">Fidelidad</span>
          <span className={`text-lg font-bold bg-gradient-to-r ${getFidelityColor(fidelity)} bg-clip-text text-transparent`}>
            {fidelity}%
          </span>
        </div>
        
        <input
          type="range"
          min="0"
          max="100"
          value={fidelity}
          onChange={(e) => setFidelity(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
          disabled={processing}
        />

        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>0% - Remix</span>
          <span>50% - Cover</span>
          <span>100% - Upgrade</span>
        </div>
      </div>

      {/* Mode Description */}
      <div className="mb-6 p-3 bg-gray-800/50 rounded-lg text-center">
        <p className="text-white font-medium">{getModeLabel(fidelity)}</p>
        <p className="text-gray-400 text-sm">{getModeDescription(fidelity)}</p>
      </div>

      {/* Progress */}
      {processing && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Procesando...</span>
            <span>{(progress * 100).toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${getFidelityColor(fidelity)} transition-all duration-500`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Result */}
      {result && result.status === 'completed' && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-green-400 text-sm font-medium">✓ Remix completado</span>
            <span className="text-gray-500 text-xs capitalize">{result.mode}</span>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2">
              <Play className="w-4 h-4" />
              Reproducir
            </button>
            <button className="px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleRemix}
        disabled={processing || !audioFile}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <RefreshCw className="w-5 h-5" />
            Generar {getModeLabel(fidelity)}
          </>
        )}
      </button>

      {!audioFile && (
        <p className="text-center text-gray-500 text-sm mt-2">
          Sube una maqueta para continuar
        </p>
      )}
    </div>
  );
}

export default RemixSlider;
