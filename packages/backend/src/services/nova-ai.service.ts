import axios from 'axios';

interface QwenConfig {
    baseURL?: string;
    model?: string;
    temperature?: number;
}

export interface ContentGenerationParams {
    topic: string;
    platform: string;
    tone: string;
    targetAudience: string;
    callToAction?: string;
    hashtags?: string;
    language?: string;
}

export interface GeneratedContent {
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

export class NovaAIService {
    private baseURL: string;
    private model: string;
    private temperature: number;

    constructor(config: QwenConfig = {}) {
        this.baseURL = config.baseURL || process.env.OLLAMA_URL || 'http://localhost:11434';
        this.model = config.model || 'qwen2.5:latest';
        this.temperature = config.temperature || 0.7;
    }

    /**
     * Direct generation for internal services
     */
    async generate(prompt: string): Promise<string> {
        try {
            const response = await axios.post(`${this.baseURL}/api/generate`, {
                model: this.model,
                prompt,
                temperature: this.temperature,
                stream: false
            }, {
                timeout: 30000
            });

            return response.data.response;
        } catch (error) {
            console.error('AI Generation error:', error);
            throw new Error('Failed to generate content');
        }
    }

    /**
     * Generate social media content using Qwen/Ollama
     */
    async generateContent(
        params: ContentGenerationParams,
        profileAnalysis?: any, // ProfileAnalysis from profile-analyzer
        algorithmRules?: any, // AlgorithmRules
        trendingTopics?: any[] // TrendingSuggestion[]
    ): Promise<GeneratedContent> {
        const prompt = this.buildPrompt(params, profileAnalysis, algorithmRules, trendingTopics);

        try {
            const response = await axios.post(`${this.baseURL}/api/generate`, {
                model: this.model,
                prompt,
                temperature: this.temperature,
                stream: false
            }, {
                timeout: 30000 // 30s timeout
            });

            const generatedText = response.data.response;
            return this.parseResponse(generatedText, params);

        } catch (error) {
            console.error('AI Generation error:', error);
            throw new Error('Failed to generate content');
        }
    }

    /**
     * Generate multiple variations
     */
    async generateVariations(
        params: ContentGenerationParams,
        count: number = 3,
        profileAnalysis?: any,
        algorithmRules?: any,
        trendingTopics?: any[]
    ): Promise<GeneratedContent[]> {
        const variations = await Promise.all(
            Array(count).fill(null).map(() =>
                this.generateContent(params, profileAnalysis, algorithmRules, trendingTopics)
            )
        );
        return variations;
    }

    /**
     * Build optimized prompt for content generation
     * NOW INCLUDES: User profile analysis + Algorithm optimization + Trending topics
     */
    private buildPrompt(
        params: ContentGenerationParams,
        profileAnalysis?: any,
        algorithmRules?: any,
        trendingTopics?: any[]
    ): string {
        const platformRules = this.getPlatformRules(params.platform);

        // Build contextual profile section
        let profileContext = '';
        if (profileAnalysis) {
            profileContext = `
USER PROFILE ANALYSIS:
- Content Types: ${profileAnalysis.contentType?.join(', ') || 'General'}
- Target Audience: ${profileAnalysis.targetAudience || 'General audience'}
- Predominant Tone: ${profileAnalysis.predominantTone || params.tone}
- Top Topics: ${profileAnalysis.topTopics?.join(', ') || 'Various'}
- Best Format: ${profileAnalysis.bestPerformingFormat || 'TBD'}

IMPORTANT: Maintain consistency with user's established voice and audience.`;
        }

        // Build algorithm optimization section
        let algorithmContext = '';
        if (algorithmRules) {
            const topEngagementFactors = algorithmRules.engagementFactors
                ?.slice(0, 3)
                .map((f: any) => `${f.name} (${f.description})`)
                .join(', ') || '';

            algorithmContext = `
ALGORITHM OPTIMIZATION (${params.platform}):
- Top Engagement Signals: ${topEngagementFactors}
- Ideal Length: ${algorithmRules.optimalLength?.ideal} characters
- Hashtag Strategy: ${algorithmRules.hashtagStrategy?.optimal} hashtags, ${algorithmRules.hashtagStrategy?.placement}
- Best Post Times: ${algorithmRules.optimalPostingTimes?.join(', ') || 'Varies'}

ALGORITHM TIPS:
${algorithmRules.algorithmTips?.map((tip: string, i: number) => `${i + 1}. ${tip}`).join('\n') || ''}

CRITICAL: Optimize for ${algorithmRules.engagementFactors?.[0]?.name || 'engagement'} to maximize reach.`;
        }

        // Build trending topics section
        let trendingContext = '';
        if (trendingTopics && trendingTopics.length > 0) {
            trendingContext = `
TRENDING NOW (${params.platform}):
${trendingTopics.map((t: any, i: number) => `${i + 1}. ${t.hashtag} - ${t.context}`).join('\n')}

STRATEGY: Incorporate relevant trending hashtags naturally into your content to maximize reach.`;
        }

        return `You are a professional ${params.platform} content creator with expertise in ${params.tone} tone and algorithm optimization.

${profileContext}

${algorithmContext}

${trendingContext}

TASK: Create an engaging ${params.platform} post

REQUIREMENTS:
- Topic: ${params.topic}
- Tone: ${params.tone}
- Target Audience: ${params.targetAudience}
- Language: ${params.language || 'English'}
${params.callToAction ? `- Call to Action: ${params.callToAction}` : ''}

PLATFORM RULES (${params.platform}):
${platformRules}

STRUCTURE:
1. Hook (first line must grab attention)
2. Value proposition (why audience should care)
3. Details/story (2-3 sentences)
4. Call to action (clear and actionable)
5. Relevant emojis (3-5 total, placed strategically)

${params.hashtags ? `HASHTAGS TO INCLUDE: ${params.hashtags}` : 'SUGGESTED HASHTAGS: Include 3-5 relevant hashtags'}

IMPORTANT:
- Match the ${params.tone} tone perfectly
- Speak directly to ${params.targetAudience}
- Use conversational language
- Avoid corporate jargon unless tone is "Professional"
- Keep it authentic and engaging

OUTPUT FORMAT:
[POST CONTENT]

[HASHTAGS]
#hashtag1 #hashtag2 #hashtag3

Return ONLY the post content and hashtags, no explanations or meta-commentary.`;
    }

    /**
     * Platform-specific formatting rules
     */
    private getPlatformRules(platform: string): string {
        const rules: Record<string, string> = {
            instagram: `
- Max 2,200 characters (aim for 300-500)
- Break text into short paragraphs (2-3 lines max)
- Use line breaks for readability
- Emojis are encouraged (3-5)
- Hashtags at the end (3-5 maximum)`,

            twitter: `
- STRICT 280 character limit
- Be punchy and direct
- 1-2 emojis maximum
- 1-2 hashtags maximum
- Thread-worthy topics = 1 tweet per idea`,

            facebook: `
- 40-80 characters for best engagement
- Can be longer if story-driven (up to 500)
- Questions increase engagement
- Emojis: 2-4
- Hashtags: 1-3 (less important on Facebook)`,

            linkedin: `
- Professional tone required
- 150-300 characters optimal
- First line is CRITICAL (shows in feed)
- Minimal emojis (0-2)
- Hashtags: 3-5 industry-specific`,

            tiktok: `
- Max 150 characters for caption
- Trendy language and slang OK
- Emojis encouraged (3-5)
- Hashtags: 3-5 trending + niche
- CTA to watch video/follow`,

            youtube: `
- First 2 lines show in preview (critical)
- Can be detailed (up to 500 words)
- Include timestamps if referencing video sections
- Links to related content
- Hashtags: 3-5 in description`
        };

        return rules[platform.toLowerCase()] || rules.instagram;
    }

    /**
     * Parse AI response into structured format
     */
    private parseResponse(text: string, params: ContentGenerationParams): GeneratedContent {
        // Split content and hashtags
        const lines = text.trim().split('\n');
        const hashtagPattern = /#\w+/g;

        let content = '';
        const hashtags: string[] = [];

        // Find hashtag section
        const hashtagIndex = lines.findIndex(line => line.trim().startsWith('#'));

        if (hashtagIndex !== -1) {
            // Content is everything before hashtags
            content = lines.slice(0, hashtagIndex).join('\n').trim();

            // Extract hashtags
            const hashtagLine = lines.slice(hashtagIndex).join(' ');
            const matches = hashtagLine.match(hashtagPattern);
            if (matches) {
                hashtags.push(...matches);
            }
        } else {
            // No explicit hashtag section, extract from content
            content = text.trim();
            const matches = content.match(hashtagPattern);
            if (matches) {
                hashtags.push(...matches);
                // Remove hashtags from content
                content = content.replace(hashtagPattern, '').trim();
            }
        }

        // Ensure we have hashtags
        if (hashtags.length === 0 && params.hashtags) {
            hashtags.push(...params.hashtags.split(/\s+/).filter(h => h.startsWith('#')));
        }

        return {
            content,
            hashtags: [...new Set(hashtags)], // Remove duplicates
            callToAction: params.callToAction,
            characterCount: content.length,
            metadata: {
                platform: params.platform,
                tone: params.tone,
                audience: params.targetAudience
            }
        };
    }

    /**
     * Validate content for platform constraints
     */
    validateContent(content: GeneratedContent): {
        valid: boolean;
        errors: string[];
        warnings: string[];
    } {
        const errors: string[] = [];
        const warnings: string[] = [];
        const metadata = (content as any).metadata || {};
const platform = metadata.platform || '';
const text = (content as any).content || '';

        // Platform-specific validation
        switch (platform.toLowerCase()) {
            case 'twitter':
                if (text.length > 280) {
                    errors.push(`Content exceeds Twitter's 280 character limit (${text.length} chars)`);
                }
                break;

            case 'instagram':
                if (text.length > 2200) {
                    errors.push(`Content exceeds Instagram's 2,200 character limit`);
                }
                if (content.hashtags.length > 30) {
                    warnings.push('Instagram allows max 30 hashtags, but 3-5 is optimal');
                }
                break;

            case 'linkedin':
                if (text.length > 3000) {
                    errors.push('Content exceeds LinkedIn post limit');
                }
                break;
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Check if Ollama server is available
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await axios.get(`${this.baseURL}/api/tags`, {
                timeout: 5000
            });
            return response.status === 200;
        } catch {
            return false;
        }
    }
}

// Singleton instance
export const novaAI = new NovaAIService();
