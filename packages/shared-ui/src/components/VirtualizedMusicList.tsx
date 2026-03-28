/**
 * VirtualizedMusicList component
 * Uses virtual scrolling for large lists to improve performance
 */
'use client';

import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useUserMusic } from '@super-son1k/shared-hooks';
import { TrackItem } from './TrackItem';
import { Loader2 } from 'lucide-react';
import type { MusicTrack } from '@super-son1k/shared-types';

export interface VirtualizedMusicListProps {
  userId?: string;
  pageSize?: number;
  itemHeight?: number;
  containerHeight?: number;
  variant?: 'default' | 'compact' | 'detailed';
  onTrackClick?: (track: MusicTrack) => void;
  emptyMessage?: string;
}

export const VirtualizedMusicList: React.FC<VirtualizedMusicListProps> = ({
  userId,
  pageSize = 50, // Larger page size for virtual scrolling
  itemHeight = 80,
  containerHeight = 600,
  variant = 'default',
  onTrackClick,
  emptyMessage = 'No hay música generada aún.'
}) => {
  const { music, isLoading, error, hasMore, fetchMore } = useUserMusic({
    userId,
    pageSize,
    enabled: !!userId
  });

  // Memoize row renderer
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const track = music[index];
    if (!track) return null;

    return (
      <div style={style} onClick={() => onTrackClick?.(track)}>
        <TrackItem
          track={track}
          variant={variant}
        />
      </div>
    );
  }, [music, variant, onTrackClick]);

  // Load more when scrolling near the end
  const handleItemsRendered = useCallback(({
    visibleStopIndex
  }: {
    visibleStopIndex: number;
  }) => {
    // Load more when 80% scrolled
    if (visibleStopIndex >= music.length * 0.8 && hasMore && !isLoading) {
      fetchMore();
    }
  }, [music.length, hasMore, isLoading, fetchMore]);

  if (isLoading && music.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
        Error: {error.message}
      </div>
    );
  }

  if (music.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="virtualized-music-list">
      <List
        height={containerHeight}
        itemCount={music.length}
        itemSize={itemHeight}
        width="100%"
        onItemsRendered={handleItemsRendered}
      >
        {Row}
      </List>
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
        </div>
      )}
    </div>
  );
};

