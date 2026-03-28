import { useState, useEffect } from 'react';

interface PoolItem {
    id: number;
    generation_id: string;
    quality: string;
    genre: string;
    plays: number;
    likes: number;
    audio_url: string;
    contributed_at: string;
    contributor: {
        user_id: string;
        username: string;
        avatar: string;
    };
}

export class CommunityPoolService {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    async getPoolContent(options: {
        limit?: number;
        genre?: string;
        sortBy?: 'recent' | 'popular' | 'quality';
    } = {}): Promise<PoolItem[]> {
        const params = new URLSearchParams();
        if (options.limit) params.set('limit', options.limit.toString());
        if (options.genre) params.set('genre', options.genre);
        if (options.sortBy) params.set('sort_by', options.sortBy);

        const response = await fetch(
            `${this.baseUrl}/api/community/pool?${params}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch pool content');
        }

        const data = await response.json();
        return data.items;
    }

    async claimFromPool(userId: string): Promise<any> {
        const response = await fetch(`${this.baseUrl}/api/community/pool/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to claim from pool');
        }

        return response.json();
    }

    async getRanking(timeframe: 'week' | 'month' | 'all_time' = 'all_time') {
        const response = await fetch(
            `${this.baseUrl}/api/community/ranking?timeframe=${timeframe}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch ranking');
        }

        const data = await response.json();
        return data.ranking;
    }

    async likeContribution(contributionId: number, userId: string) {
        const response = await fetch(
            `${this.baseUrl}/api/community/pool/like/${contributionId}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            }
        );

        if (!response.ok) {
            throw new Error('Failed to like contribution');
        }

        return response.json();
    }
}

// Hook for using the Community Pool
export function useCommunityPool(userId: string) {
    const [items, setItems] = useState<PoolItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [claiming, setClaiming] = useState(false);

    const poolService = new CommunityPoolService(
        import.meta.env.VITE_API_URL || 'http://localhost:8000'
    );

    const loadPool = async (options: {
        limit?: number;
        genre?: string;
        sortBy?: 'recent' | 'popular' | 'quality';
    } = {}) => {
        setLoading(true);
        setError(null);

        try {
            const data = await poolService.getPoolContent(options);
            setItems(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const claimRandom = async () => {
        setClaiming(true);
        setError(null);

        try {
            const claimed = await poolService.claimFromPool(userId);

            // Refresh pool after claiming
            await loadPool();

            return claimed;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setClaiming(false);
        }
    };

    const likeItem = async (contributionId: number) => {
        try {
            await poolService.likeContribution(contributionId, userId);

            // Update local state
            setItems(prev =>
                prev.map(item =>
                    item.id === contributionId
                        ? { ...item, likes: item.likes + 1 }
                        : item
                )
            );
        } catch (err: any) {
            console.error('Error liking item:', err);
        }
    };

    useEffect(() => {
        loadPool();
    }, []);

    return {
        items,
        loading,
        error,
        claiming,
        loadPool,
        claimRandom,
        likeItem
    };
}
