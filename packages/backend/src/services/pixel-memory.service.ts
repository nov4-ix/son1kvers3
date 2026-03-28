import { createClient, SupabaseClient } from '@supabase/supabase-js';
export interface PixelMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}

export interface PixelUserProfile {
    userId: string;
    preferences: {
        defaultMood: 'calmo' | 'agradecido' | 'enfoque';
        favoriteApp: string;
        codeStyle: 'verbose' | 'concise';
        helpLevel: 'beginner' | 'intermediate' | 'expert';
    };
    learnings: {
        topics: string[];
        skills: string[];
        patterns: Record<string, any>;
    };
    createdAt?: Date;
    updatedAt?: Date;
}

export interface PixelMemoryNote {
    id?: string;
    userId: string;
    type: 'note' | 'preference' | 'learning' | 'achievement';
    content: string;
    metadata?: Record<string, any>;
    createdAt?: Date;
}

export class PixelMemoryService {
    private supabase: SupabaseClient;

    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase credentials not configured for Pixel Memory');
        }

        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    /**
     * Save conversation to database
     */
    async saveConversation(
        userId: string,
        messages: PixelMessage[],
        context?: { app?: string; mood?: string }
    ): Promise<boolean> {
        try {
            const { error } = await this.supabase
                .from('pixel_conversations')
                .insert({
                    user_id: userId,
                    messages: JSON.stringify(messages),
                    context: context || {},
                    app: context?.app || 'web-classic'
                });

            if (error) {
                console.error('Error saving conversation:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Save conversation exception:', error);
            return false;
        }
    }

    /**
     * Load conversation history for user
     */
    async loadConversations(
        userId: string,
        limit: number = 50
    ): Promise<{ messages: PixelMessage[]; context: any; createdAt: Date }[]> {
        try {
            const { data, error } = await this.supabase
                .from('pixel_conversations')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Error loading conversations:', error);
                return [];
            }

            return (data || []).map(conv => ({
                messages: JSON.parse(conv.messages as any),
                context: conv.context,
                createdAt: new Date(conv.created_at)
            }));
        } catch (error) {
            console.error('Load conversations exception:', error);
            return [];
        }
    }

    /**
     * Get or create user profile
     */
    async getUserProfile(userId: string): Promise<PixelUserProfile | null> {
        try {
            let { data, error } = await this.supabase
                .from('pixel_user_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            // Create if doesn't exist
            if (error && error.code === 'PGRST116') {
                const defaultProfile = {
                    user_id: userId,
                    preferences: {
                        defaultMood: 'calmo',
                        favoriteApp: 'web-classic',
                        codeStyle: 'concise',
                        helpLevel: 'intermediate'
                    },
                    learnings: {
                        topics: [],
                        skills: [],
                        patterns: {}
                    }
                };

                const { data: newData, error: insertError } = await this.supabase
                    .from('pixel_user_profiles')
                    .insert(defaultProfile)
                    .select()
                    .single();

                if (insertError) {
                    console.error('Error creating profile:', insertError);
                    return null;
                }

                data = newData;
            }

            if (!data) return null;

            return {
                userId: data.user_id,
                preferences: data.preferences,
                learnings: data.learnings,
                createdAt: new Date(data.created_at),
                updatedAt: new Date(data.updated_at)
            };
        } catch (error) {
            console.error('Get user profile exception:', error);
            return null;
        }
    }

    /**
     * Update user profile
     */
    async updateUserProfile(
        userId: string,
        updates: Partial<Pick<PixelUserProfile, 'preferences' | 'learnings'>>
    ): Promise<boolean> {
        try {
            const { error } = await this.supabase
                .from('pixel_user_profiles')
                .update(updates)
                .eq('user_id', userId);

            if (error) {
                console.error('Error updating profile:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Update profile exception:', error);
            return false;
        }
    }

    /**
     * Add learning to user profile
     */
    async addLearning(
        userId: string,
        type: 'topic' | 'skill',
        value: string
    ): Promise<boolean> {
        try {
            const profile = await this.getUserProfile(userId);
            if (!profile) return false;

            const key = type === 'topic' ? 'topics' : 'skills';
            const current = profile.learnings[key];

            if (!current.includes(value)) {
                current.push(value);

                return await this.updateUserProfile(userId, {
                    learnings: {
                        ...profile.learnings,
                        [key]: current
                    }
                });
            }

            return true;
        } catch (error) {
            console.error('Add learning exception:', error);
            return false;
        }
    }

    /**
     * Save a memory note (for /remember command)
     */
    async saveMemory(memory: PixelMemoryNote): Promise<string | null> {
        try {
            const { data, error } = await this.supabase
                .from('pixel_memories')
                .insert({
                    user_id: memory.userId,
                    type: memory.type,
                    content: memory.content,
                    metadata: memory.metadata || {}
                })
                .select()
                .single();

            if (error) {
                console.error('Error saving memory:', error);
                return null;
            }

            return data.id;
        } catch (error) {
            console.error('Save memory exception:', error);
            return null;
        }
    }

    /**
     * Search memories by content
     */
    async searchMemories(
        userId: string,
        query: string,
        type?: PixelMemoryNote['type']
    ): Promise<PixelMemoryNote[]> {
        try {
            let supabaseQuery = this.supabase
                .from('pixel_memories')
                .select('*')
                .eq('user_id', userId)
                .ilike('content', `%${query}%`)
                .order('created_at', { ascending: false })
                .limit(10);

            if (type) {
                supabaseQuery = supabaseQuery.eq('type', type);
            }

            const { data, error } = await supabaseQuery;

            if (error) {
                console.error('Error searching memories:', error);
                return [];
            }

            return (data || []).map(m => ({
                id: m.id,
                userId: m.user_id,
                type: m.type,
                content: m.content,
                metadata: m.metadata,
                createdAt: new Date(m.created_at)
            }));
        } catch (error) {
            console.error('Search memories exception:', error);
            return [];
        }
    }

    /**
     * Get recent memories
     */
    async getRecentMemories(
        userId: string,
        limit: number = 10
    ): Promise<PixelMemoryNote[]> {
        try {
            const { data, error } = await this.supabase
                .from('pixel_memories')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Error getting recent memories:', error);
                return [];
            }

            return (data || []).map(m => ({
                id: m.id,
                userId: m.user_id,
                type: m.type,
                content: m.content,
                metadata: m.metadata,
                createdAt: new Date(m.created_at)
            }));
        } catch (error) {
            console.error('Get recent memories exception:', error);
            return [];
        }
    }

    /**
     * Clear old conversations (cleanup)
     */
    async cleanupOldConversations(daysToKeep: number = 30): Promise<number> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            const { data, error } = await this.supabase
                .from('pixel_conversations')
                .delete()
                .lt('created_at', cutoffDate.toISOString())
                .select('id');

            if (error) {
                console.error('Error cleaning up conversations:', error);
                return 0;
            }

            return data?.length || 0;
        } catch (error) {
            console.error('Cleanup exception:', error);
            return 0;
        }
    }
}

// Singleton instance
export const pixelMemoryService = new PixelMemoryService();
