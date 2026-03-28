/**
 * Custom hook for fetching and managing user's music tracks
 * Supports pagination and real-time updates
 * Uses MusicService for API calls
 */
import { useState, useEffect, useCallback } from 'react';
import { getMusicService } from '@super-son1k/shared-services';
import type { MusicTrack, PaginatedResponse } from '@super-son1k/shared-types';

interface UseUserMusicOptions {
  userId?: string;
  pageSize?: number;
  enabled?: boolean;
  // For Firestore integration (if needed)
  firestore?: {
    collection: any;
    query: any;
    where: any;
    orderBy: any;
    limit: any;
    startAfter: any;
    onSnapshot: any;
  };
}

export function useUserMusic(options: UseUserMusicOptions = {}) {
  const {
    userId,
    pageSize = 10,
    enabled = true,
    firestore
  } = options;

  const [music, setMusic] = useState<MusicTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<unknown>(null);

  const fetchMusic = useCallback(async (reset = false) => {
    if (!userId || !enabled) {
      setMusic([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use MusicService for API calls
      const musicService = getMusicService();

      const data = await musicService.getUserMusic(userId, {
        pageSize,
        page: reset ? 1 : undefined,
        lastDoc: reset ? undefined : lastDoc
      });

      if (reset) {
        setMusic(data.items);
      } else {
        setMusic(prev => [...prev, ...data.items]);
      }

      setHasMore(data.hasMore);
      setLastDoc(data.lastDoc);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load music');
      setError(error);
      console.error('Error fetching music:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, pageSize, enabled, lastDoc]);

  const fetchMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchMusic(false);
    }
  }, [isLoading, hasMore, fetchMusic]);

  const refresh = useCallback(() => {
    setLastDoc(null);
    setHasMore(true);
    fetchMusic(true);
  }, [fetchMusic]);

  // Initial fetch
  useEffect(() => {
    if (enabled && userId) {
      fetchMusic(true);
    }
  }, [userId, enabled]); // Only re-fetch if userId or enabled changes

  // Real-time updates with Firestore (optional)
  useEffect(() => {
    if (!firestore || !userId || !enabled) return;

    const { collection, query, where, orderBy, limit: limitFn, onSnapshot } = firestore;
    
    const q = query(
      collection('music'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limitFn(pageSize)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot: any) => {
        const tracks = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        } as MusicTrack));
        setMusic(tracks);
        setIsLoading(false);
      },
      (err: Error) => {
        setError(err);
        setIsLoading(false);
        console.error('Firestore error:', err);
      }
    );

    return () => unsubscribe();
  }, [firestore, userId, enabled, pageSize]);

  return {
    music,
    isLoading,
    error,
    hasMore,
    fetchMore,
    refresh
  };
}

