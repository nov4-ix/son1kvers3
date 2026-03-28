/**
 * Optimized TrackItem component with React.memo
 * Prevents unnecessary re-renders when parent updates
 */
'use client';

import React from 'react';
import { Play, Download, Upload } from 'lucide-react';
import type { MusicTrack } from '@super-son1k/shared-types';

export interface TrackItemProps {
  track: MusicTrack;
  isSelected?: boolean;
  onSelect?: (trackId: string) => void;
  onDownload?: (track: MusicTrack) => void;
  onUpload?: (track: MusicTrack) => void;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

const TrackItemComponent: React.FC<TrackItemProps> = ({
  track,
  isSelected = false,
  onSelect,
  onDownload,
  onUpload,
  className = '',
  variant = 'default'
}) => {
  const handleClick = () => {
    onSelect?.(track.id);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload?.(track);
  };

  const handleUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpload?.(track);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const baseClasses = `
    glass-effect border-white/10 p-6 hover:border-[#B858FE]/30 
    transition-all cursor-pointer group
    ${isSelected ? 'border-[#B858FE]/50 bg-[#B858FE]/10' : ''}
    ${className}
  `;

  if (variant === 'compact') {
    return (
      <div className={baseClasses} onClick={handleClick}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#B858FE]/20 to-[#40FDAE]/20 flex items-center justify-center">
            <Play className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-medium truncate">{track.title || track.prompt || 'Untitled'}</h4>
            <p className="text-sm text-white/50">{formatDuration(track.duration)}</p>
          </div>
          {onDownload && (
            <button onClick={handleDownload} className="p-2 hover:bg-white/10 rounded-lg">
              <Download className="w-4 h-4 text-white/70" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={baseClasses} onClick={handleClick}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#B858FE]/20 to-[#40FDAE]/20 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Play className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-white font-medium mb-1">{track.title || track.prompt || 'Untitled'}</h4>
            <div className="flex items-center gap-3 text-sm text-white/50">
              {track.genre && <span>{track.genre}</span>}
              {track.duration && <span>• {formatDuration(track.duration)}</span>}
              {track.status && <span>• {track.status}</span>}
            </div>
            {track.style && (
              <p className="text-xs text-white/40 mt-1">{track.style}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onDownload && (
              <button onClick={handleDownload} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Download className="w-5 h-5 text-white/70" />
              </button>
            )}
            {onUpload && (
              <button onClick={handleUpload} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Upload className="w-5 h-5 text-white/70" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={baseClasses} onClick={handleClick}>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#B858FE]/20 to-[#40FDAE]/20 flex items-center justify-center group-hover:scale-105 transition-transform">
          <Play className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="text-white font-medium mb-1">{track.title || track.prompt || 'Untitled'}</h4>
          <p className="text-sm text-white/50">
            {track.genre || track.style || 'Music'} • {formatDuration(track.duration)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onDownload && (
            <button onClick={handleDownload} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Download className="w-5 h-5 text-white/70" />
            </button>
          )}
          {onUpload && (
            <button onClick={handleUpload} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Upload className="w-5 h-5 text-white/70" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export const TrackItem = React.memo(TrackItemComponent, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.track.id === nextProps.track.id &&
    prevProps.track.audioUrl === nextProps.track.audioUrl &&
    prevProps.track.status === nextProps.track.status &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.variant === nextProps.variant
  );
});

TrackItem.displayName = 'TrackItem';


