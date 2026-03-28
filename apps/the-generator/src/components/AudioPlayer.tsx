import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Download, Share2, Heart, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  metadata?: Record<string, unknown>;
}

export function AudioPlayer({ src, metadata }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `son1k-track-${Date.now()}.wav`;
    link.click();
  };

  return (
    <div className="bg-carbón rounded-xl p-6">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />
      
      {/* Waveform Visualization (placeholder) */}
      <div className="h-16 bg-carbón-dark rounded-lg mb-4 flex items-center justify-center overflow-hidden">
        <div className="flex items-end gap-1 h-full py-2">
          {Array.from({ length: 50 }).map((_, i) => {
            const height = Math.random() * 60 + 10;
            return (
              <motion.div
                key={i}
                className="w-1 bg-gradient-to-t from-cian to-magenta rounded-full"
                style={{ height: `${height}%` }}
                animate={{
                  height: isPlaying ? `${height + Math.random() * 20}%` : `${height}%`
                }}
                transition={{ duration: 0.2 }}
              />
            );
          })}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-4">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full slider"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Play/Pause */}
          <button
            onClick={handlePlayPause}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-cian to-magenta flex items-center justify-center text-white hover:shadow-lg transition-all"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>
          
          {/* Volume */}
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-gray-400" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 slider"
            />
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg bg-carbón-dark text-gray-400 hover:text-white hover:bg-carbón transition-colors"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            className="p-2 rounded-lg bg-carbón-dark text-gray-400 hover:text-white hover:bg-carbón transition-colors"
            title="Share"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            className="p-2 rounded-lg bg-carbón-dark text-gray-400 hover:text-red-400 hover:bg-carbón transition-colors"
            title="Like"
          >
            <Heart className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Metadata */}
      {metadata && (
        <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-2 gap-4 text-xs text-gray-400">
          {metadata.genre && (
            <div>
              <span className="text-gray-500">Genre:</span> {metadata.genre as string}
            </div>
          )}
          {metadata.quality && (
            <div>
              <span className="text-gray-500">Quality:</span> {metadata.quality as string}
            </div>
          )}
          {metadata.lufs && (
            <div>
              <span className="text-gray-500">LUFS:</span> {metadata.lufs as string}
            </div>
          )}
          {metadata.duration && (
            <div>
              <span className="text-gray-500">Duration:</span> {metadata.duration as string}s
            </div>
          )}
        </div>
      )}
    </div>
  );
}
