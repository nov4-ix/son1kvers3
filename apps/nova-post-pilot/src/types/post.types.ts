export interface ContentMetadata {
    profileAnalysis?: {
        contentType: string[];
        targetAudience: string;
        predominantTone: string;
    };
    algorithmInsights?: {
        platform: string;
        recommendations: string[];
        validation: {
            optimized: boolean;
            issues: string[];
            suggestions: string[];
        };
    };
    trendingTopics?: Array<{
        hashtag: string;
        context: string;
        peakTime: string;
    }>;
}

export interface GeneratedPost {
    id: string;
    content: string;
    hashtags: string[];
    engagement: {
        likes: number;
        comments: number;
        shares: number;
        reach: number;
    };
    platform: string;
    createdAt: string;
    metadata?: ContentMetadata;
}
