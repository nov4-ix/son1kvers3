import { useState, useEffect } from 'react';

interface PixelProfile {
    preferences: {
        genres: string[];
        qualities: string[];
        typicalPrompts: string[];
    };
    patterns: {
        mostActiveHours: number[];
        generationFrequency: string;
        avgPerDay: number;
    };
    skillLevel: 'beginner' | 'intermediate' | 'advanced';
    goals: 'explore' | 'learning' | 'professional';
    context: {
        mood: string;
        energy: string;
    };
}

interface PixelSuggestion {
    message: string;
    action: string | null;
    type: string;
    emoji: string;
}

export function usePixel(userId: string) {
    const [profile, setProfile] = useState<PixelProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastSuggestion, setLastSuggestion] = useState<PixelSuggestion | null>(null);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        loadProfile();
    }, [userId]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const apiUrl = (import.meta.env?.VITE_API_URL as string) || 'http://localhost:3000';
            const response = await fetch(
                `${apiUrl}/api/pixel/profile/${userId}`
            );

            if (!response.ok) {
                throw new Error('Failed to load Pixel profile');
            }

            const data = await response.json();
            setProfile(data.profile);
        } catch (error) {
            console.error('Error loading Pixel profile:', error);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    const getSuggestion = async (context?: string): Promise<PixelSuggestion | null> => {
        try {
            const apiUrl = (import.meta.env?.VITE_API_URL as string) || 'http://localhost:3000';
            const response = await fetch(
                `${apiUrl}/api/pixel/suggest`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId, context })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to get suggestion');
            }

            const suggestion = await response.json();
            setLastSuggestion(suggestion);
            return suggestion;
        } catch (error) {
            console.error('Error getting suggestion:', error);
            return null;
        }
    };

    const celebrate = async (milestone: string) => {
        try {
            const apiUrl = (import.meta.env?.VITE_API_URL as string) || 'http://localhost:3000';
            const response = await fetch(
                `${apiUrl}/api/pixel/celebrate`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId, milestone })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to celebrate');
            }

            return await response.json();
        } catch (error) {
            console.error('Error celebrating:', error);
            return null;
        }
    };

    const getGreeting = async () => {
        try {
            const apiUrl = (import.meta.env?.VITE_API_URL as string) || 'http://localhost:3000';
            const response = await fetch(
                `${apiUrl}/api/pixel/greeting/${userId}`
            );

            if (!response.ok) {
                throw new Error('Failed to get greeting');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting greeting:', error);
            return null;
        }
    };

    return {
        profile,
        loading,
        lastSuggestion,
        getSuggestion,
        celebrate,
        getGreeting,
        refresh: loadProfile
    };
}

// Service class
export class PixelService {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    async getProfile(userId: string): Promise<any> {
        const response = await fetch(`${this.baseUrl}/api/pixel/profile/${userId}`);

        if (!response.ok) {
            throw new Error('Failed to fetch Pixel profile');
        }

        const data = await response.json();
        return data.profile;
    }

    async getSuggestion(userId: string, context?: string): Promise<PixelSuggestion> {
        const response = await fetch(`${this.baseUrl}/api/pixel/suggest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, context })
        });

        if (!response.ok) {
            throw new Error('Failed to get suggestion');
        }

        return response.json();
    }

    async celebrate(userId: string, milestone: string) {
        const response = await fetch(`${this.baseUrl}/api/pixel/celebrate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, milestone })
        });

        if (!response.ok) {
            throw new Error('Failed to celebrate');
        }

        return response.json();
    }

    async getGreeting(userId: string) {
        const response = await fetch(`${this.baseUrl}/api/pixel/greeting/${userId}`);

        if (!response.ok) {
            throw new Error('Failed to get greeting');
        }

        return response.json();
    }
}

export * from './components/PixelWidget';
