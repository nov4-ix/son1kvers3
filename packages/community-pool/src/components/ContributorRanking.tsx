import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CommunityPoolService } from '../index';

interface Contributor {
    rank: number;
    user_id: string;
    username: string;
    avatar: string;
    tier: string;
    contributions: number;
    points: number;
    last_contribution: string | null;
}

interface ContributorRankingProps {
    currentUserId?: string;
}

type Timeframe = 'week' | 'month' | 'all_time';

export function ContributorRanking({ currentUserId }: ContributorRankingProps) {
    const [ranking, setRanking] = useState<Contributor[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState<Timeframe>('all_time');

    const poolService = new CommunityPoolService(
        import.meta.env.VITE_API_URL || 'http://localhost:8000'
    );

    useEffect(() => {
        loadRanking();
    }, [timeframe]);

    const loadRanking = async () => {
        setLoading(true);
        try {
            const data = await poolService.getRanking(timeframe);
            setRanking(data);
        } catch (error) {
            console.error('Error loading ranking:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRankBadge = (rank: number) => {
        if (rank === 1) return { emoji: '🥇', color: 'from-yellow-400 to-yellow-600', glow: 'shadow-yellow-500/50' };
        if (rank === 2) return { emoji: '🥈', color: 'from-gray-300 to-gray-500', glow: 'shadow-gray-400/50' };
        if (rank === 3) return { emoji: '🥉', color: 'from-orange-400 to-orange-600', glow: 'shadow-orange-500/50' };
        return { emoji: `#${rank}`, color: 'from-cian to-cian-dark', glow: 'shadow-cian/30' };
    };

    const getTierColor = (tier: string) => {
        const colors = {
            CREATOR: 'text-cian',
            PRO: 'text-magenta',
            STUDIO: 'text-yellow-400'
        };
        return colors[tier as keyof typeof colors] || 'text-gray-400';
    };

    return (
        <div className="contributor-ranking bg-carbón-dark border border-cian/20 rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-cian mb-1">Top Contributors</h2>
                    <p className="text-sm text-gray-400">Heroes who democratize music</p>
                </div>

                {/* Timeframe selector */}
                <div className="flex gap-2">
                    {(['week', 'month', 'all_time'] as Timeframe[]).map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`
                px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${timeframe === tf
                                    ? 'bg-cian text-carbón'
                                    : 'bg-carbón text-gray-400 hover:text-white'
                                }
              `}
                        >
                            {tf === 'all_time' ? 'All Time' : tf.charAt(0).toUpperCase() + tf.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-12 h-12 border-4 border-cian border-t-transparent rounded-full"></div>
                </div>
            )}

            {/* Ranking List */}
            {!loading && (
                <div className="space-y-3">
                    {ranking.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-2">🏆</div>
                            <p className="text-gray-400">No contributors yet</p>
                        </div>
                    ) : (
                        ranking.map((contributor, index) => {
                            const badge = getRankBadge(contributor.rank);
                            const isCurrentUser = contributor.user_id === currentUserId;

                            return (
                                <motion.div
                                    key={contributor.user_id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`
                    relative flex items-center gap-4 p-4 rounded-lg
                    ${isCurrentUser
                                            ? 'bg-cian/10 border-2 border-cian'
                                            : 'bg-carbón border border-cian/10 hover:border-cian/30'
                                        }
                    transition-all
                  `}
                                >
                                    {/* Rank Badge */}
                                    <div className={`
                    flex-shrink-0 w-12 h-12 rounded-full 
                    bg-gradient-to-br ${badge.color}
                    flex items-center justify-center
                    font-bold text-white text-lg
                    ${contributor.rank <= 3 ? `shadow-lg ${badge.glow}` : ''}
                  `}>
                                        {badge.emoji}
                                    </div>

                                    {/* Avatar */}
                                    <img
                                        src={contributor.avatar}
                                        alt={contributor.username}
                                        className="w-12 h-12 rounded-full border-2 border-cian/30"
                                    />

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-bold text-white truncate">
                                                {contributor.username}
                                            </p>
                                            {isCurrentUser && (
                                                <span className="px-2 py-0.5 bg-cian text-carbón text-xs rounded-full font-bold">
                                                    You
                                                </span>
                                            )}
                                            <span className={`text-xs font-semibold ${getTierColor(contributor.tier)}`}>
                                                {contributor.tier}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-400">
                                            <span>
                                                🎵 {contributor.contributions} contributions
                                            </span>
                                            <span>
                                                ⭐ {contributor.points} points
                                            </span>
                                            {contributor.last_contribution && (
                                                <span>
                                                    Last: {new Date(contributor.last_contribution).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Score (for top 3) */}
                                    {contributor.rank <= 3 && (
                                        <div className="text-right">
                                            <div className="text-2xl font-bold bg-gradient-to-r from-cian to-magenta bg-clip-text text-transparent">
                                                {contributor.points}
                                            </div>
                                            <div className="text-xs text-gray-400">points</div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })
                    )}
                </div>
            )}

            {/* How Points Work */}
            {!loading && ranking.length > 0 && (
                <div className="mt-6 pt-6 border-t border-cian/20">
                    <details className="cursor-pointer">
                        <summary className="text-sm font-semibold text-cian hover:text-cian-light">
                            ℹ️ How are points calculated?
                        </summary>
                        <div className="mt-3 text-xs text-gray-400 space-y-1">
                            <p>• Standard quality contribution: <span className="text-white">1 point</span></p>
                            <p>• High quality contribution: <span className="text-white">2 points</span></p>
                            <p>• Ultra quality contribution: <span className="text-white">3 points</span></p>
                            <p className="mt-2 text-cian">
                                Contribute more high-quality tracks to climb the leaderboard!
                            </p>
                        </div>
                    </details>
                </div>
            )}
        </div>
    );
}
