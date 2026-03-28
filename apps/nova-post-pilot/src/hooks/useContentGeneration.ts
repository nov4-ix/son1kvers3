import { useState } from 'react';
import axios from 'axios';

interface ContentParams {
    topic: string;
    platform: string;
    tone: string;
    targetAudience: string;
    callToAction?: string;
    hashtags?: string;
    language?: string;
    variations?: number;
}

interface GeneratedContent {
    content: string;
    hashtags: string[];
    callToAction?: string;
    characterCount: number;
    metadata: {
        platform: string;
        tone: string;
        audience: string;
    };
}

export function useContentGeneration() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [metadata, setMetadata] = useState<any>(null);

    const generateContent = async (
        params: ContentParams
    ): Promise<{ data: any; metadata: any } | null> => {
        setIsGenerating(true);
        setError(null);
        setMetadata(null);

        try {
            const token = localStorage.getItem('auth_token');

            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/content/generate`,
                params,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const result = {
                data: response.data.data,
                metadata: response.data.metadata
            };

            setMetadata(response.data.metadata);
            return result;

        } catch (err: any) {
            const errorMessage = err.response?.data?.error || 'Failed to generate content';
            setError(errorMessage);

            if (err.response?.status === 403) {
                setError('This feature requires a premium subscription');
            }

            return null;
        } finally {
            setIsGenerating(false);
        }
    };

    const checkHealth = async (): Promise<boolean> => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/content/health`
            );
            return response.data.status === 'online';
        } catch {
            return false;
        }
    };

    return {
        generateContent,
        checkHealth,
        isGenerating,
        error,
        metadata
    };
}
