'use client';

import { useState } from 'react';
import { sunoService } from '@/lib/SunoService';
import LyricsStudio from '@/components/LyricsStudio';
import { Music, Sparkles, Download, Loader2 } from 'lucide-react';

export default function TheGenerator() {
  const [prompt, setPrompt] = useState('');
  const [tags, setTags] = useState('');
  const [title, setTitle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [pollingAttempt, setPollingAttempt] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Lyrics Studio state
  const [showLyricsStudio, setShowLyricsStudio] = useState(false);
  const [generatedLyrics, setGeneratedLyrics] = useState('');
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedStyle, setGeneratedStyle] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Por favor escribe un prompt');
      return;
    }

    setGenerating(true);
    setError(null);
    setResult(null);
    setPollingAttempt(0);

    // Secuencia de mensajes de carga "inteligente"
    const steps = [
      "🧠 Pixel AI analizando tu idea...",
      "✍️ Componiendo letra y estructura...",
      "🎹 Optimizando arreglo musical...",
    ];

    let stepIndex = 0;
    setProgress(steps[0]);

    // Rotar mensajes cada 2s mientras Groq genera
    const loadingInterval = setInterval(() => {
      stepIndex = (stepIndex + 1) % steps.length;
      if (stepIndex < steps.length) {
        setProgress(steps[stepIndex]);
      }
    }, 2000);

    try {
      // Paso 1: Generar SOLO LETRAS con Groq
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
      const lyricsResponse = await fetch(`${backendUrl}/api/generation/lyrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style: tags || 'any'
        })
      });

      if (!lyricsResponse.ok) {
        throw new Error('Failed to generate lyrics');
      }

      const lyricsData = await lyricsResponse.json();
      clearInterval(loadingInterval);

      // Guardar letras generadas y mostrar Lyrics Studio
      setGeneratedLyrics(lyricsData.data.lyrics);
      setGeneratedTitle(lyricsData.data.title);
      setGeneratedStyle(lyricsData.data.style);
      setShowLyricsStudio(true);
      setGenerating(false);

    } catch (err: any) {
      clearInterval(loadingInterval);
      console.error('[Generator] Error:', err);
      setError(err.message || 'Error al generar letras');
      setGenerating(false);
      setProgress('');
    }
  };

  // Handler para regenerar letras
  const handleRegenerateLyrics = async () => {
    setShowLyricsStudio(false);
    handleGenerate(); // Volver a generar
  };

  // Handler para aprobar y generar música
  const handleApproveLyrics = async (finalLyrics: string, finalTitle: string) => {
    setShowLyricsStudio(false);
    setGenerating(true);
    setProgress('🚀 Son1k Neural Engine renderizando audio...');

    try {
      // Ahora enviamos las letras aprobadas a Suno
      const taskId = await sunoService.generate({
        prompt: finalLyrics, // Letras como prompt (custom mode)
        tags: generatedStyle,
        title: finalTitle,
        make_instrumental: false
      });

      // Polling
      const pollInterval = setInterval(() => {
        setPollingAttempt(prev => prev + 1);
      }, 5000);

      const completedTrack = await sunoService.pollUntilComplete(taskId);

      clearInterval(pollInterval);

      setProgress('✅ ¡Completado!');
      setResult(completedTrack);
      setGenerating(false);

    } catch (err: any) {
      console.error('[Generator] Error:', err);
      setError(err.message || 'Error desconocido');
      setGenerating(false);
      setProgress('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-white">
      {/* Lyrics Studio Modal */}
      {showLyricsStudio && (
        <LyricsStudio
          initialLyrics={generatedLyrics}
          initialTitle={generatedTitle}
          initialStyle={generatedStyle}
          onApprove={handleApproveLyrics}
          onRegenerate={handleRegenerateLyrics}
          onClose={() => {
            setShowLyricsStudio(false);
            setGenerating(false);
          }}
        />
      )}

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Music className="w-12 h-12 text-purple-400" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              The Generator
            </h1>
          </div>
          <p className="text-gray-300 text-lg">
            Son1kvers3 - Plataforma de Generación Musical con IA
          </p>
        </header>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500 rounded-lg p-4">
            <p className="text-red-200">❌ {error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-300 hover:text-red-100 underline"
            >
              Cerrar
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Input */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <label className="block text-sm font-medium mb-2">
                🎤 Prompt de Generación
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe tu canción: estilo, emociones, historia..."
                className="w-full h-32 bg-black/30 rounded-lg p-4 text-white placeholder-gray-400 border border-white/10 focus:border-purple-400 focus:outline-none resize-none"
                disabled={generating}
              />

              <label className="block text-sm font-medium mb-2 mt-4">
                🎸 Género/Estilo (opcional)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="rock, energetic, male vocals"
                className="w-full bg-black/30 rounded-lg p-3 text-white placeholder-gray-400 border border-white/10 focus:border-purple-400 focus:outline-none"
                disabled={generating}
              />

              <label className="block text-sm font-medium mb-2 mt-4">
                📝 Título (opcional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título de la canción"
                className="w-full bg-black/30 rounded-lg p-3 text-white placeholder-gray-400 border border-white/10 focus:border-purple-400 focus:outline-none"
                disabled={generating}
              />

              <button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className="mt-6 w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-4 font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    Generar Música
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel - Output */}
          <div className="space-y-6">
            {/* Progress */}
            {generating && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold mb-4">Progreso</h3>
                <div className="space-y-3">
                  <p className="text-gray-300">{progress}</p>
                  {pollingAttempt > 0 && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">
                        Intento de polling: {pollingAttempt} / 60
                      </p>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${(pollingAttempt / 60) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-yellow-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Esto puede tardar 1-2 minutos...
                  </div>
                </div>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Music className="w-5 h-5 text-green-400" />
                  ✅ ¡Música Generada!
                </h3>

                {result.image_url && (
                  <img
                    src={result.image_url}
                    alt="Cover"
                    className="w-full rounded-lg mb-4"
                  />
                )}

                <div className="space-y-3">
                  {result.title && (
                    <p className="text-xl font-bold text-purple-300">
                      {result.title}
                    </p>
                  )}

                  {result.tags && (
                    <p className="text-sm text-gray-400">{result.tags}</p>
                  )}

                  {result.audio_url && (
                    <>
                      <audio
                        controls
                        className="w-full"
                        src={result.audio_url}
                      />

                      <div className="flex gap-2">
                        <a
                          href={result.audio_url}
                          download
                          className="flex-1 bg-purple-600 hover:bg-purple-700 rounded-lg py-3 flex items-center justify-center gap-2 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Descargar MP3
                        </a>

                        {result.video_url && (
                          <a
                            href={result.video_url}
                            download
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 rounded-lg py-3 flex items-center justify-center gap-2 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Descargar Video
                          </a>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!generating && !result && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-12 border border-white/20 text-center">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400">
                  La música generada aparecerá aquí
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-400 text-sm">
          <p className="font-semibold text-lg text-white mb-2">
            Son1kvers3 - Democratización Musical Global
          </p>
          <p>Powered by Claude AI + Suno AI</p>
        </footer>
      </div>
    </div>
  );
}
