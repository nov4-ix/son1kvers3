'use client'

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Download, Volume2, VolumeX, SkipForward, SkipBack } from 'lucide-react';

interface Track {
  id: string;
  name: string;
  url: string;
  duration: number;
}

interface TwoTrackPlayerProps {
  tracks: Track[];
  onTrackSelect: (trackId: string) => void;
  onPlay: () => void;
  onPause: () => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (position: number) => void;
  isPlaying: boolean;
  currentTrack?: string;
  volume: number;
  position: number;
  duration: number;
}

export const TwoTrackPlayer: React.FC<TwoTrackPlayerProps> = ({
  tracks,
  onTrackSelect,
  onPlay,
  onPause,
  onVolumeChange,
  onSeek,
  isPlaying,
  currentTrack,
  volume,
  position,
  duration
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVolumeToggle = () => {
    if (isMuted) {
      onVolumeChange(75);
      setIsMuted(false);
    } else {
      onVolumeChange(0);
      setIsMuted(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = parseFloat(e.target.value);
    onSeek(newPosition);
  };

  // Memoized track item component to prevent unnecessary re-renders
  const TrackItemMemoized = React.memo<{
    track: Track;
    isSelected: boolean;
    onSelect: (trackId: string) => void;
    formatTime: (seconds: number) => string;
  }>(({ track, isSelected, onSelect, formatTime }) => (
          <div
      onClick={() => onSelect(track.id)}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
        isSelected
                ? 'bg-gradient-to-br from-purple-600 to-pink-600 border-purple-400 text-white'
                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <Play className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold">{track.name}</h4>
                <p className="text-sm opacity-75">{formatTime(track.duration)}</p>
              </div>
            </div>
          </div>
  ), (prevProps, nextProps) => {
    // Only re-render if track data or selection state changes
    return (
      prevProps.track.id === nextProps.track.id &&
      prevProps.track.url === nextProps.track.url &&
      prevProps.isSelected === nextProps.isSelected
    );
  });

  TrackItemMemoized.displayName = 'TrackItemMemoized';

  return (
    <div className="bg-gradient-to-br from-purple-900/30 via-pink-900/30 to-purple-900/30 backdrop-blur-xl rounded-3xl p-8 border-2 border-purple-500/50 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
          <Play className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-3xl font-bold text-white">🎉 Reproductor de Tracks</h3>
      </div>

      {/* Track Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {tracks.map((track) => (
          <TrackItemMemoized
            key={track.id}
            track={track}
            isSelected={currentTrack === track.id}
            onSelect={onTrackSelect}
            formatTime={formatTime}
          />
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
                background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(position / duration) * 100}%, rgba(255,255,255,0.2) ${(position / duration) * 100}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
            <div className="flex justify-between text-sm text-gray-400 mt-1">
              <span>{formatTime(position)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => onSeek(Math.max(0, position - 10))}
              className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
            >
              <SkipBack className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={isPlaying ? onPause : onPlay}
              className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white" />
              )}
            </button>

            <button
              onClick={() => onSeek(Math.min(duration, position + 10))}
              className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
            >
              <SkipForward className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={handleVolumeToggle}
              className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
          </div>

          {/* Download Button */}
          <div className="flex justify-center">
            <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span>Descargar Track</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
