import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface UserProfileProps {
    userId: string;
}

interface UserData {
    id: string;
    username: string;
    displayName: string;
    email: string;
    avatar: string;
    tier: 'FREE' | 'CREATOR' | 'PRO' | 'STUDIO';
    alvaeHolder: boolean;
    stats: {
        totalGenerations: number;
        totalPlays: number;
        totalLikes: number;
        weekStreak: number;
        joinedDate: string;
    };
    badges: Array<{
        id: string;
        name: string;
        icon: string;
        earnedAt: string;
    }>;
}

export function UserProfile({ userId }: UserProfileProps) {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'creations' | 'collections' | 'stats'>('creations');

    useEffect(() => {
        loadUserProfile();
    }, [userId]);

    const loadUserProfile = async () => {
        setLoading(true);
        try {
            // TODO: Replace with actual API call
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}/profile`);
            const data = await response.json();
            setUser(data);
        } catch (error) {
            console.error('Error loading profile:', error);
            // Mock data for now
            setUser({
                id: userId,
                username: 'demo_user',
                displayName: 'Demo Creator',
                email: 'demo@son1k.com',
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
                tier: 'CREATOR',
                alvaeHolder: false,
                stats: {
                    totalGenerations: 42,
                    totalPlays: 1337,
                    total: 89,
                    weekStreak: 7,
                    joinedDate: '2026-01-01'
                },
                badges: [
                    { id: '1', name: 'Early Adopter', icon: '🚀', earnedAt: '2026-01-01' },
                    { id: '2', name: 'Week Streak', icon: '🔥', earnedAt: '2026-01-07' }
                ]
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-carbón">
                <div className="text-center">
                    <div className="animate-spin w-16 h-16 border-4 border-cian border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-carbón">
                <div className="text-center">
                    <div className="text-6xl mb-4">👤</div>
                    <h2 className="text-2xl font-bold text-white mb-2">User Not Found</h2>
                    <p className="text-gray-400">This profile doesn't exist</p>
                </div>
            </div>
        );
    }

    const tierColors = {
        FREE: 'from-gray-500 to-gray-600',
        CREATOR: 'from-cian to-cian-dark',
        PRO: 'from-magenta to-magenta-dark',
        STUDIO: 'from-yellow-400 to-orange-500'
    };

    return (
        <div className="user-profile min-h-screen bg-carbón">
            {/* Header/Banner */}
            <div className="relative h-64 bg-gradient-to-br from-cian/20 via-magenta/20 to-carbón overflow-hidden">
                {/* Pixel rain effect placeholder */}
                <div className="absolute inset-0 opacity-20">
                    {/* Add your pixel rain component here */}
                </div>

                {/* Profile Info */}
                <div className="relative h-full container mx-auto px-4 flex items-end pb-6">
                    <div className="flex items-end gap-6 w-full">
                        {/* Avatar */}
                        <div className={`
              w-32 h-32 rounded-full overflow-hidden ring-4
              ${user.alvaeHolder ? 'ring-yellow-400 animate-pulse-slow' : 'ring-cian'}
            `}>
                            <img
                                src={user.avatar}
                                alt={user.displayName}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-4xl font-bold text-white">
                                    {user.displayName}
                                </h1>

                                {/* ALVAE Badge */}
                                {user.alvaeHolder && (
                                    <div className="flex items-center gap-2 px-3 py-1 bg-yellow-400/20 border border-yellow-400 rounded-full">
                                        <span className="text-yellow-400 text-sm font-bold">⬡ ALVAE</span>
                                    </div>
                                )}

                                {/* Tier Badge */}
                                <div className={`
                  px-3 py-1 rounded-full text-xs font-bold text-white
                  bg-gradient-to-r ${tierColors[user.tier]}
                `}>
                                    {user.tier}
                                </div>
                            </div>

                            <p className="text-gray-400 mb-3">@{user.username}</p>

                            {/* Quick Stats */}
                            <div className="flex gap-6">
                                <StatItem icon="🎵" value={user.stats.totalGenerations} label="Creations" />
                                <StatItem icon="▶" value={user.stats.totalPlays} label="Plays" />
                                <StatItem icon="❤️" value={user.stats.totalLikes} label="Likes" />
                                <StatItem icon="🔥" value={`${user.stats.weekStreak}d`} label="Streak" />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pb-2">
                            <button className="px-6 py-2 bg-cian text-carbón rounded-lg font-bold hover:bg-cian-light transition-colors">
                                Edit Profile
                            </button>
                            <button className="px-6 py-2 bg-carbón border border-cian text-cian rounded-lg hover:bg-cian/10 transition-colors">
                                Settings
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-cian/20">
                <div className="container mx-auto px-4">
                    <div className="flex gap-8">
                        {['creations', 'collections', 'stats'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`
                  py-4 font-semibold transition-all relative
                  ${activeTab === tab
                                        ? 'text-cian'
                                        : 'text-gray-400 hover:text-white'
                                    }
                `}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-cian"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-12 gap-6">
                    {/* Sidebar */}
                    <div className="col-span-3 space-y-6">
                        {/* Stats Card */}
                        <div className="bg-carbón-dark border border-cian/20 rounded-lg p-6">
                            <h3 className="text-lg font-bold text-cian mb-4">Profile Stats</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Total Generations</p>
                                    <p className="text-2xl font-bold text-white">{user.stats.totalGenerations}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Total Plays</p>
                                    <p className="text-2xl font-bold text-white">{user.stats.totalPlays}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Total Likes</p>
                                    <p className="text-2xl font-bold text-white">{user.stats.totalLikes}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Member Since</p>
                                    <p className="text-sm text-white">
                                        {new Date(user.stats.joinedDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Badges Card */}
                        <div className="bg-carbón-dark border border-cian/20 rounded-lg p-6">
                            <h3 className="text-lg font-bold text-cian mb-4">Badges</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {user.badges.map((badge) => (
                                    <div
                                        key={badge.id}
                                        className="aspect-square bg-carbón border border-cian/10 rounded-lg flex flex-col items-center justify-center p-3 hover:border-cian/30 transition-colors cursor-pointer"
                                        title={`${badge.name} - Earned ${new Date(badge.earnedAt).toLocaleDateString()}`}
                                    >
                                        <div className="text-3xl mb-1">{badge.icon}</div>
                                        <p className="text-xs text-center text-gray-400">{badge.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="col-span-9">
                        {activeTab === 'creations' && (
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-6">My Creations</h2>
                                <div className="text-center py-20">
                                    <div className="text-6xl mb-4">🎵</div>
                                    <h3 className="text-xl font-bold text-white mb-2">No creations yet</h3>
                                    <p className="text-gray-400 mb-6">Start creating to see your music here</p>
                                    <button
                                        onClick={() => window.location.href = '/generator'}
                                        className="px-6 py-3 bg-gradient-to-r from-cian to-magenta text-white rounded-lg font-bold"
                                    >
                                        Create Your First Track
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'collections' && (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-white">My Collections</h2>
                                    <button className="px-4 py-2 bg-cian text-carbón rounded-lg font-bold">
                                        + New Collection
                                    </button>
                                </div>
                                <div className="text-center py-20">
                                    <div className="text-6xl mb-4">📁</div>
                                    <h3 className="text-xl font-bold text-white mb-2">No collections yet</h3>
                                    <p className="text-gray-400">Organize your tracks into collections</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'stats' && (
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-6">Detailed Stats</h2>
                                <div className="grid grid-cols-3 gap-6 mb-8">
                                    <StatCard
                                        title="This Week"
                                        value={12}
                                        change="+20%"
                                        icon="🎵"
                                    />
                                    <StatCard
                                        title="Avg. Plays"
                                        value={31}
                                        change="+5%"
                                        icon="▶"
                                    />
                                    <StatCard
                                        title="Engagement"
                                        value="6.7%"
                                        change="+1.2%"
                                        icon="📊"
                                    />
                                </div>
                                {/* Add charts here */}
                                <div className="text-center py-12 bg-carbón-dark border border-cian/20 rounded-lg">
                                    <p className="text-gray-400">Analytics charts coming soon...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatItem({ icon, value, label }: { icon: string; value: number | string; label: string }) {
    return (
        <div>
            <div className="flex items-center gap-2 text-white font-bold">
                <span>{icon}</span>
                <span>{value}</span>
            </div>
            <p className="text-xs text-gray-400">{label}</p>
        </div>
    );
}

function StatCard({ title, value, change, icon }: { title: string; value: number | string; change: string; icon: string }) {
    const isPositive = change.startsWith('+');

    return (
        <div className="bg-carbón-dark border border-cian/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">{title}</p>
                <span className="text-2xl">{icon}</span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{value}</p>
            <p className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {change} vs last week
            </p>
        </div>
    );
}
