import axios from 'axios';

/**
 * Analizador de Perfil de Usuario
 * Estudia el historial de posts para entender:
 * - Tipo de contenido que genera
 * - Audiencia objetivo
 * - Tono predominante
 * - Temas recurrentes
 */

interface UserPost {
    content: string;
    platform: string;
    engagement: {
        likes: number;
        comments: number;
        shares: number;
    };
    timestamp: string;
}

export interface ProfileAnalysis {
    contentType: string[]; // e.g., ["educational", "promotional", "storytelling"]
    targetAudience: string; // e.g., "Tech professionals, 25-35"
    predominantTone: string; // e.g., "professional yet friendly"
    topTopics: string[]; // e.g., ["AI", "music production", "technology"]
    averageEngagement: number;
    bestPerformingFormat: string;
    recommendations: string[];
}

export class ProfileAnalyzer {
    private qwenBaseURL: string;

    constructor(qwenURL: string = 'http://localhost:11434') {
        this.qwenBaseURL = qwenURL;
    }

    /**
     * Analiza el historial de posts del usuario
     */
    async analyzeUserProfile(posts: UserPost[]): Promise<ProfileAnalysis> {
        if (posts.length === 0) {
            return this.getDefaultAnalysis();
        }

        // Preparar datos para análisis
        const postsSummary = posts.map(p => ({
            content: p.content.substring(0, 200), // Primeras 200 chars
            platform: p.platform,
            likes: p.engagement.likes
        }));

        const analysisPrompt = `You are a social media analytics expert. Analyze the following user's post history and provide insights.

USER'S POSTS (last ${posts.length}):
${JSON.stringify(postsSummary, null, 2)}

TASK: Analyze this user's content profile and provide:
1. Content types they produce (e.g., educational, promotional, entertainment)
2. Their target audience demographics
3. Their predominant tone/voice
4. Top recurring topics/themes
5. What format performs best for them
6. Recommendations to improve engagement

Respond in JSON format:
{
  "contentType": ["type1", "type2"],
  "targetAudience": "description",
  "predominantTone": "tone",
  "topTopics": ["topic1", "topic2", "topic3"],
  "bestPerformingFormat": "format",
  "recommendations": ["rec1", "rec2", "rec3"]
}`;

        try {
            const response = await axios.post(`${this.qwenBaseURL}/api/generate`, {
                model: 'qwen2.5:latest',
                prompt: analysisPrompt,
                temperature: 0.3, // Lower temp for analytical tasks
                stream: false
            });

            const analysis = JSON.parse(response.data.response);

            return {
                ...analysis,
                averageEngagement: this.calculateAverageEngagement(posts)
            };

        } catch (error) {
            console.error('Profile analysis error:', error);
            return this.getDefaultAnalysis();
        }
    }

    /**
     * Calcula engagement promedio
     */
    private calculateAverageEngagement(posts: UserPost[]): number {
        if (posts.length === 0) return 0;

        const totalEngagement = posts.reduce((sum, post) => {
            return sum + post.engagement.likes +
                post.engagement.comments * 2 + // Comments valen más
                post.engagement.shares * 3; // Shares valen aún más
        }, 0);

        return totalEngagement / posts.length;
    }

    /**
     * Análisis por defecto para nuevos usuarios
     */
    private getDefaultAnalysis(): ProfileAnalysis {
        return {
            contentType: ['general'],
            targetAudience: 'General audience, needs more data for precision',
            predominantTone: 'neutral',
            topTopics: [],
            averageEngagement: 0,
            bestPerformingFormat: 'To be determined',
            recommendations: [
                'Post consistently to build a content history',
                'Experiment with different content types',
                'Engage with your audience to understand them better'
            ]
        };
    }
}

/**
 * Optimizador de Algoritmos por Red Social
 * Conoce las reglas específicas de cada plataforma
 */
export interface AlgorithmRules {
    platform: string;
    optimalLength: { min: number; max: number; ideal: number };
    optimalPostingTimes: string[];
    engagementFactors: {
        name: string;
        weight: number;
        description: string;
    }[];
    contentPreferences: string[];
    hashtagStrategy: {
        min: number;
        max: number;
        optimal: number;
        placement: 'inline' | 'end' | 'both';
    };
    visualRequirements?: string[];
    algorithmTips: string[];
}

export class AlgorithmOptimizer {
    private rules: Map<string, AlgorithmRules> = new Map();

    constructor() {
        this.initializeRules();
    }

    private initializeRules() {
        // Instagram Algorithm (2024)
        this.rules.set('instagram', {
            platform: 'Instagram',
            optimalLength: { min: 100, max: 2200, ideal: 300 },
            optimalPostingTimes: ['9-11 AM', '1-3 PM', '7-9 PM'],
            engagementFactors: [
                { name: 'Saves', weight: 10, description: 'Most valuable signal' },
                { name: 'Shares', weight: 8, description: 'Strong interest indicator' },
                { name: 'Comments', weight: 6, description: 'Quality engagement' },
                { name: 'Likes', weight: 3, description: 'Basic engagement' },
                { name: 'Time spent', weight: 7, description: 'Content quality signal' }
            ],
            contentPreferences: [
                'Reels (highest priority)',
                'Carousel posts (high engagement)',
                'Stories (daily engagement)',
                'Static posts (lowest priority)'
            ],
            hashtagStrategy: {
                min: 3,
                max: 30,
                optimal: 5 - 7,
                placement: 'end'
            },
            visualRequirements: [
                'High-quality images (min 1080x1080)',
                'Reels: 9:16 aspect ratio',
                'Carousels: consistent sizing'
            ],
            algorithmTips: [
                'Post when your audience is most active',
                'Front-load value in first 3 lines',
                'Ask questions to drive comments',
                'Use trending audio in Reels',
                'Respond to comments within first hour',
                'Use location tags for local reach'
            ]
        });

        // Twitter/X Algorithm (2024)
        this.rules.set('twitter', {
            platform: 'Twitter/X',
            optimalLength: { min: 40, max: 280, ideal: 100 },
            optimalPostingTimes: ['8-10 AM', '6-9 PM'],
            engagementFactors: [
                { name: 'Retweets', weight: 10, description: 'Amplification signal' },
                { name: 'Quote tweets', weight: 9, description: 'Discussion starter' },
                { name: 'Replies', weight: 7, description: 'Conversation depth' },
                { name: 'Likes', weight: 4, description: 'Agreement signal' },
                { name: 'Profile clicks', weight: 6, description: 'Interest in author' }
            ],
            contentPreferences: [
                'Threads (high engagement)',
                'Polls (drive interaction)',
                'Images/GIFs (visual appeal)',
                'Videos (2:20 optimal length)'
            ],
            hashtagStrategy: {
                min: 0,
                max: 2,
                optimal: 1,
                placement: 'inline'
            },
            algorithmTips: [
                'First tweet in thread is critical',
                'Break into digestible chunks',
                'Tag relevant accounts (max 2)',
                'Avoid external links (kills reach)',
                'Engage within first 30 minutes',
                'Blue checkmark boosts visibility'
            ]
        });

        // LinkedIn Algorithm (2024)
        this.rules.set('linkedin', {
            platform: 'LinkedIn',
            optimalLength: { min: 150, max: 3000, ideal: 1000 },
            optimalPostingTimes: ['7-9 AM', '12-1 PM', '5-6 PM'],
            engagementFactors: [
                { name: 'Comments', weight: 10, description: 'Professional discussion' },
                { name: 'Shares', weight: 9, description: 'Value endorsement' },
                { name: 'Reactions', weight: 5, description: 'Engagement variety' },
                { name: 'Dwell time', weight: 8, description: 'Content depth signal' }
            ],
            contentPreferences: [
                'Industry insights',
                'Professional achievements',
                'Thought leadership',
                'Career advice',
                'Company updates'
            ],
            hashtagStrategy: {
                min: 3,
                max: 5,
                optimal: 3,
                placement: 'end'
            },
            algorithmTips: [
                'First line hooks are critical (140 chars)',
                'Native documents perform well',
                'Polls drive engagement',
                'Tag companies/people strategically',
                'Respond to all comments',
                'Post during business hours',
                'Avoid external links in post body'
            ]
        });

        // TikTok Algorithm (2024)
        this.rules.set('tiktok', {
            platform: 'TikTok',
            optimalLength: { min: 50, max: 150, ideal: 100 },
            optimalPostingTimes: ['6-10 PM', '2-4 PM'],
            engagementFactors: [
                { name: 'Completion rate', weight: 10, description: 'Watch til end' },
                { name: 'Rewatches', weight: 9, description: 'Content quality' },
                { name: 'Shares', weight: 8, description: 'Viral potential' },
                { name: 'Comments', weight: 7, description: 'Conversation starter' },
                { name: 'Likes', weight: 4, description: 'Basic engagement' }
            ],
            contentPreferences: [
                'Trending sounds/music',
                'Educational content (quick tips)',
                'Entertainment (humor, dance)',
                'Behind-the-scenes',
                'Challenges/trends'
            ],
            hashtagStrategy: {
                min: 3,
                max: 5,
                optimal: 4,
                placement: 'end'
            },
            visualRequirements: [
                'Vertical video (9:16)',
                'Hook in first 3 seconds',
                'Captions/text overlays',
                '15-60 seconds ideal length'
            ],
            algorithmTips: [
                'Hook viewers in first 3 seconds',
                'Use trending sounds',
                'Post 1-3x daily for momentum',
                'Engage with comments immediately',
                'Participate in trends early',
                'Strong CTA (follow, share, comment)'
            ]
        });

        // Facebook Algorithm (2024)
        this.rules.set('facebook', {
            platform: 'Facebook',
            optimalLength: { min: 40, max: 500, ideal: 80 },
            optimalPostingTimes: ['1-4 PM', '6-8 PM'],
            engagementFactors: [
                { name: 'Meaningful interactions', weight: 10, description: 'Comments with depth' },
                { name: 'Shares', weight: 9, description: 'Content value' },
                { name: 'Reactions', weight: 5, description: 'Emotional response' },
                { name: 'Video watch time', weight: 8, description: 'Video performance' }
            ],
            contentPreferences: [
                'Live videos (highest priority)',
                'Native videos',
                'Stories',
                'Photos with text',
                'Link posts (lowest priority)'
            ],
            hashtagStrategy: {
                min: 1,
                max: 3,
                optimal: 1 - 2,
                placement: 'end'
            },
            algorithmTips: [
                'Spark conversations with questions',
                'Go live for maximum reach',
                'Upload videos natively',
                'Create share-worthy content',
                'Post when followers are online',
                'Avoid clickbait (algorithm penalty)'
            ]
        });

        // YouTube Algorithm (2024)
        this.rules.set('youtube', {
            platform: 'YouTube',
            optimalLength: { min: 100, max: 5000, ideal: 300 },
            optimalPostingTimes: ['2-4 PM', '8-10 PM'],
            engagementFactors: [
                { name: 'Watch time', weight: 10, description: 'Total minutes watched' },
                { name: 'Click-through rate', weight: 9, description: 'Thumbnail effectiveness' },
                { name: 'Average view duration', weight: 8, description: 'Content retention' },
                { name: 'Comments', weight: 6, description: 'Community engagement' },
                { name: 'Likes', weight: 4, description: 'Satisfaction signal' }
            ],
            contentPreferences: [
                'Long-form content (8+ minutes for mid-rolls)',
                'Shorts (under 60 seconds)',
                'Playlists (session time)',
                'Series (returning viewers)'
            ],
            hashtagStrategy: {
                min: 3,
                max: 15,
                optimal: 5,
                placement: 'end'
            },
            algorithmTips: [
                'Compelling titles (under 60 chars)',
                'Eye-catching thumbnails',
                'First 30 seconds are critical',
                'Ask viewers to watch til end',
                'Pin a comment to start discussion',
                'Upload consistently (same time/day)',
                'Create playlists for binge-watching'
            ]
        });
    }

    /**
     * Obtiene las reglas del algoritmo para una plataforma
     */
    getRules(platform: string): AlgorithmRules | null {
        return this.rules.get(platform.toLowerCase()) || null;
    }

    /**
     * Genera recomendaciones específicas basadas en el análisis
     */
    generateRecommendations(
        platform: string,
        profileAnalysis: ProfileAnalysis
    ): string[] {
        const rules = this.getRules(platform);
        if (!rules) return [];

        const recommendations: string[] = [];

        // Longitud óptima
        recommendations.push(
            `📏 Optimal caption length for ${platform}: ${rules.optimalLength.ideal} characters`
        );

        // Mejores horarios
        recommendations.push(
            `⏰ Best times to post: ${rules.optimalPostingTimes.join(', ')}`
        );

        // Hashtags
        recommendations.push(
            `#️⃣ Use ${rules.hashtagStrategy.optimal} hashtags, placed at ${rules.hashtagStrategy.placement}`
        );

        // Top engagement factor
        const topFactor = rules.engagementFactors[0];
        recommendations.push(
            `🚀 Focus on ${topFactor.name} - ${topFactor.description}`
        );

        // Basado en el contenido del usuario
        if (profileAnalysis.averageEngagement > 0) {
            recommendations.push(
                `📊 Your avg engagement: ${Math.round(profileAnalysis.averageEngagement)}. ${profileAnalysis.bestPerformingFormat !== 'To be determined'
                    ? `Keep using ${profileAnalysis.bestPerformingFormat} format`
                    : 'Try different formats to find what works'
                }`
            );
        }

        return recommendations;
    }

    /**
     * Valida y optimiza contenido para el algoritmo
     */
    optimizeForAlgorithm(content: string, platform: string): {
        optimized: boolean;
        issues: string[];
        suggestions: string[];
    } {
        const rules = this.getRules(platform);
        if (!rules) {
            return { optimized: true, issues: [], suggestions: [] };
        }

        const issues: string[] = [];
        const suggestions: string[] = [];

        // Verificar longitud
        if (content.length < rules.optimalLength.min) {
            issues.push(`Content is too short (${content.length} chars)`);
            suggestions.push(`Add more context to reach ${rules.optimalLength.ideal} characters`);
        } else if (content.length > rules.optimalLength.max) {
            issues.push(`Content exceeds max length (${content.length}/${rules.optimalLength.max})`);
            suggestions.push(`Trim down to ${rules.optimalLength.ideal} characters for best performance`);
        }

        // Contar hashtags
        const hashtags = content.match(/#\w+/g) || [];
        if (hashtags.length < rules.hashtagStrategy.min) {
            suggestions.push(`Add ${rules.hashtagStrategy.min - hashtags.length} more hashtags`);
        } else if (hashtags.length > rules.hashtagStrategy.max) {
            issues.push(`Too many hashtags (${hashtags.length}/${rules.hashtagStrategy.max})`);
        }

        return {
            optimized: issues.length === 0,
            issues,
            suggestions
        };
    }
}

// Export singleton instance




// Export singleton instance
export const profileAnalyzer = new ProfileAnalyzer();
