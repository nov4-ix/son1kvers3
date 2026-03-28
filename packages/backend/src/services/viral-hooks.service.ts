import { novaAI } from './nova-ai.service';
import { profileAnalyzer } from './profile-analyzer.service';
import { trendingService } from './trending.service';

export interface ViralHook {
    hook: string;
    rationale: string;
    estimatedImpact: 'High' | 'Medium' | 'Low';
    type: 'Controversial' | 'Educational' | 'Storytelling' | 'Question';
}

export class ViralHooksService {

    /**
     * Generate weekly viral hooks for a user
     */
    async generateWeeklyHooks(userId: string, platform: string): Promise<ViralHook[]> {
        // 1. Get User Profile
        // TODO: Fetch real user posts
        const profile = await profileAnalyzer.analyzeUserProfile([]);

        // 2. Get Trending Topics
        const trends = await trendingService.getTrends(platform);
        const relevantTrends = await trendingService.findRelevantTrends(
            profile.topTopics.join(', '),
            platform
        );

        // 3. Build Prompt
        const prompt = this.buildHooksPrompt(profile, relevantTrends, platform);

        // 4. Generate with AI
        try {
            const response = await novaAI.generate(prompt);
            return this.parseHooksResponse(response);
        } catch (error) {
            console.error('Error generating viral hooks:', error);
            return this.getFallbackHooks();
        }
    }

    private buildHooksPrompt(profile: any, trends: any[], platform: string): string {
        return `
    Act as a Viral Content Strategist for ${platform}.
    
    USER PROFILE:
    - Niche: ${profile.topTopics.join(', ')}
    - Audience: ${profile.targetAudience}
    - Tone: ${profile.predominantTone}
    
    CURRENT TRENDS:
    ${trends.map(t => `- ${t.hashtag}: ${t.context}`).join('\n')}
    
    TASK:
    Generate 5 "Viral Hooks" for next week's content.
    
    RULES:
    1. Hooks must be attention-grabbing (first 3 seconds).
    2. Use psychological triggers: Curiosity, Fear of Missing Out (FOMO), Contrarian views.
    3. Align with user's niche but leverage current trends.
    
    OUTPUT FORMAT (JSON Array):
    [
      {
        "hook": "Stop doing [X], start doing [Y]...",
        "rationale": "Leverages contrarian view on [Topic]",
        "estimatedImpact": "High",
        "type": "Controversial"
      }
    ]
    
    Return ONLY the JSON array.
    `;
    }

    private parseHooksResponse(response: string): ViralHook[] {
        try {
            // Extract JSON from response (handle potential markdown code blocks)
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return JSON.parse(response);
        } catch (e) {
            console.error('Failed to parse hooks JSON', e);
            return this.getFallbackHooks();
        }
    }

    private getFallbackHooks(): ViralHook[] {
        return [
            {
                hook: "The secret tool nobody is talking about...",
                rationale: "Curiosity gap",
                estimatedImpact: "Medium",
                type: "Storytelling"
            },
            {
                hook: "Unpopular opinion: [Topic] is dead.",
                rationale: "Controversial engagement",
                estimatedImpact: "High",
                type: "Controversial"
            },
            {
                hook: "3 mistakes you're making with [Topic]",
                rationale: "Fear of loss / Educational",
                estimatedImpact: "Medium",
                type: "Educational"
            }
        ];
    }
}

export const viralHooksService = new ViralHooksService();
