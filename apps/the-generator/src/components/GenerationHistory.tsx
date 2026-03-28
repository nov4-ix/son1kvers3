'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, Play, Download, Trash2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import type { MusicTrack } from '@super-son1k/shared-types';

interface GenerationHistoryProps {
  userId?: string;
  onSelectTrack?: (track: MusicTrack) => void;
}

export default function GenerationHistory({ userId, onSelectTrack }: GenerationHistoryProps) {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      loadHistory();
    }
  }, [userId]);

  const loadHistory = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      if (!backendUrl) {
        console.error('VITE_BACKEND_URL not configured');
        toast.error('Backend URL not configured');
        return;
      }
      const response = await fetch(`${backendUrl}/api/generation/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase_token') || ''}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTracks(data.data || []);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      // Fallback: cargar desde localStorage
      const localHistory = localStorage.getItem('generation_history');
      if (localHistory) {
        setTracks(JSON.parse(localHistory));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (track: MusicTrack) => {
    if (track.audioUrl) {
      const link = document.createElement('a');
      link.href = track.audioUrl;
      link.download = `track-${track.id}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started!');
    }
  };

  const handleDelete = async (trackId: string) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      if (!backendUrl) {
        toast.error('Backend URL not configured');
        return;
      }
      await fetch(`${backendUrl}/api/generation/${trackId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase_token') || ''}`
        }
      });

      setTracks(tracks.filter(t => t.id !== trackId));
      toast.success('Track deleted');
    } catch (error) {
      // Fallback: eliminar de localStorage
      const localHistory = tracks.filter(t => t.id !== trackId);
      localStorage.setItem('generation_history', JSON.stringify(localHistory));
      setTracks(localHistory);
      toast.success('Track deleted');
    }
  };

  if (isLoading) {
    return (
      <div className="glass-panel rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <History className="w-5 h-5 text-mint" />
        <h3 className="text-lg font-semibold text-mint">Historial de Generaciones</h3>
      </div>

      {tracks.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No hay generaciones aún</p>
          <p className="text-sm mt-2">Tus tracks aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {tracks.map((track) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-bg-card rounded-lg p-4 border border-teal-dark hover:border-mint transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-mint mb-1">
                    {track.prompt?.slice(0, 50) || 'Untitled Track'}...
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(track.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                    <span className={`px-2 py-1 rounded ${(track.status?.toUpperCase() === 'COMPLETED') ? 'bg-green-500/20 text-green-400' :
                        (track.status?.toUpperCase() === 'PROCESSING' || track.status?.toUpperCase() === 'PENDING') ? 'bg-blue-500/20 text-blue-400' :
                          (track.status?.toUpperCase() === 'FAILED') ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                      }`}>
                      {track.status?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {track.audioUrl && (
                    <>
                      <button
                        onClick={() => onSelectTrack?.(track)}
                        className="p-2 rounded-lg bg-bg-secondary hover:bg-bg-secondary/80 transition-colors"
                        title="Play"
                      >
                        <Play size={16} className="text-mint" />
                      </button>
                      <button
                        onClick={() => handleDownload(track)}
                        className="p-2 rounded-lg bg-bg-secondary hover:bg-bg-secondary/80 transition-colors"
                        title="Download"
                      >
                        <Download size={16} className="text-purple" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(track.id!)}
                    className="p-2 rounded-lg bg-bg-secondary hover:bg-red-500/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

