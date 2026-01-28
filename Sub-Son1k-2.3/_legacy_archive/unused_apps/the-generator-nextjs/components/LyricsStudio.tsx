'use client';

import { useState } from 'react';
import { Sparkles, RefreshCw, Music, X } from 'lucide-react';

interface LyricsStudioProps {
    initialLyrics: string;
    initialTitle: string;
    initialStyle: string;
    onApprove: (lyrics: string, title: string) => void;
    onRegenerate: () => void;
    onClose: () => void;
}

export default function LyricsStudio({
    initialLyrics,
    initialTitle,
    initialStyle,
    onApprove,
    onRegenerate,
    onClose,
}: LyricsStudioProps) {
    const [lyrics, setLyrics] = useState(initialLyrics);
    const [title, setTitle] = useState(initialTitle);
    const [isEditing, setIsEditing] = useState(false);

    const handleApprove = () => {
        onApprove(lyrics, title);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-purple-900/90 via-indigo-900/90 to-black/90 rounded-2xl border border-purple-500/30 max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-purple-500/30">
                    <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            ✍️ Lyrics Studio
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">Revisa y edita tu composición</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            📝 Título
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-black/30 rounded-lg p-3 text-white border border-purple-500/30 focus:border-purple-400 focus:outline-none"
                            placeholder="Título de la canción"
                        />
                    </div>

                    {/* Style Info */}
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                        <p className="text-sm text-gray-300">
                            <span className="font-semibold text-purple-400">🎸 Estilo:</span> {initialStyle}
                        </p>
                    </div>

                    {/* Lyrics */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-300">
                                🎤 Letra
                            </label>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="text-xs text-purple-400 hover:text-purple-300 underline"
                            >
                                {isEditing ? 'Vista previa' : 'Modo edición'}
                            </button>
                        </div>

                        {isEditing ? (
                            <textarea
                                value={lyrics}
                                onChange={(e) => setLyrics(e.target.value)}
                                className="w-full h-96 bg-black/30 rounded-lg p-4 text-white border border-purple-500/30 focus:border-purple-400 focus:outline-none resize-none font-mono text-sm"
                                placeholder="Letra de la canción..."
                            />
                        ) : (
                            <div className="w-full h-96 bg-black/30 rounded-lg p-4 text-white border border-purple-500/30 overflow-y-auto">
                                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                                    {lyrics}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-6 border-t border-purple-500/30">
                    <button
                        onClick={onRegenerate}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 rounded-lg py-3 font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Regenerar con IA
                    </button>
                    <button
                        onClick={handleApprove}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg py-3 font-semibold flex items-center justify-center gap-2 transition-all shadow-lg"
                    >
                        <Music className="w-5 h-5" />
                        Generar Música
                    </button>
                </div>
            </div>
        </div>
    );
}
