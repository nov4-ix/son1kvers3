/**
 * MusicList component with pagination support
 * Uses useUserMusic hook for data fetching
 */
'use client';

import React, { useCallback } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';
import { useUserMusic } from '@super-son1k/shared-hooks';
import { TrackItem } from './TrackItem';
import type { MusicTrack } from '@super-son1k/shared-types';

export interface MusicListProps {
  userId?: string;
  pageSize?: number;
  variant?: 'default' | 'compact' | 'detailed';
  onTrackSelect?: (track: MusicTrack) => void;
  onTrackDownload?: (track: MusicTrack) => void;
  onTrackUpload?: (track: MusicTrack) => void;
  selectedTrackId?: string;
  className?: string;
  emptyMessage?: string;
  showLoadMore?: boolean;
}

export const MusicList: React.FC<MusicListProps> = ({
  userId,
  pageSize = 10,
  variant = 'default',
  onTrackSelect,
  onTrackDownload,
  onTrackUpload,
  selectedTrackId,
  className = '',
  emptyMessage = 'No hay música generada aún',
  showLoadMore = true
}) => {
  const { music, isLoading, error, hasMore, fetchMore, refresh } = useUserMusic({
    userId,
    pageSize,
    enabled: !!userId
  });

  const handleTrackSelect = useCallback((trackId: string) => {
    const track = music.find(t => t.id === trackId);
    if (track) {
      onTrackSelect?.(track);
    }
  }, [music, onTrackSelect]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      fetchMore();
    }
  }, [hasMore, isLoading, fetchMore]);

  if (isLoading && music.length === 0) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#00FFE7] animate-spin" />
          <p className="text-white/60">Cargando música...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-500/10 border border-red-500/30 rounded-lg p-4 ${className}`}>
        <p className="text-red-400 text-sm">
          Error al cargar la música: {error.message}
        </p>
        <button
          onClick={refresh}
          className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (music.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-white/60">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {music.map((track) => (
          <TrackItem
            key={track.id}
            track={track}
            isSelected={selectedTrackId === track.id}
            onSelect={handleTrackSelect}
            onDownload={onTrackDownload}
            onUpload={onTrackUpload}
            variant={variant}
          />
        ))}
      </div>

      {showLoadMore && hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#B858FE] to-[#40FDAE] hover:from-[#B858FE]/90 hover:to-[#40FDAE]/90 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Cargando...</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>Cargar más</span>
              </>
            )}
          </button>
        </div>
      )}

      {!hasMore && music.length > 0 && (
        <div className="mt-4 text-center text-sm text-white/40">
          No hay más música para cargar
        </div>
      )}
    </div>
  );
};


