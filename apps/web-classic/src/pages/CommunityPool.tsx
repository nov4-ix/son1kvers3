import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCommunityPool } from '@son1k/community-pool';
import { PoolItemCard } from '@son1k/community-pool/components';

interface CommunityPoolProps {
    userId: string;
    userTier: 'FREE' | 'CREATOR' | 'PRO' | 'STUDIO';
}

type SortBy = 'recent' | 'popular' | 'quality';

export function CommunityPool({ userId, userTier }: CommunityPoolProps) {
    const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<SortBy>('recent');
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

    const {
        items,
        loading,
        error,
        claiming,
        loadPool,
        claimRandom,
        likeItem
    } = useCommunityPool(userId);

    const genres = ['All', 'Pop', 'Rock', 'Electronic', 'Hip Hop', 'Jazz', 'Classical', 'Latin'];

    const handleSortChange = (newSort: SortBy) => {
        setSortBy(newSort);
        loadPool({ sortBy: newSort, genre: selectedGenre || undefined });
    };

    const handleGenreChange = (genre: string) => {
        const newGenre = genre === 'All' ? null : genre;
        setSelectedGenre(newGenre);
        loadPool({ genre: newGenre || undefined, sortBy });
    };

    const handlePlay = (audioUrl: string) => {
        // Stop current audio if playing
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }

        // Create and play new audio
        const audio = new Audio(audioUrl);
        audio.play();

        setCurrentAudio(audio);
        setPlayingId(audioUrl);

        audio.onended = () => {
            setPlayingId(null);
            setCurrentAudio(null);
        };
    };

    const handleClaim = async () => {
        try {
            const claimed = await claimRandom();

            // Auto-play claimed track
            handlePlay(claimed.audio_url);

            // Show success toast
            showToast({
                type: 'success',
                message: `🎉 Claimed from pool! ${claimed.claims_remaining} claims remaining today.`
            });
        } catch (err: any) {
            showToast({
                type: 'error',
                message: err.message
            });
        }
    };

    return (
        <div className="community-pool min-h-screen bg-gradient-to-br from-carbón via-carbón-dark to-carbón py-8">
            <div className="container mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-5xl font-bold mb-2">
                                <span className="bg-gradient-to-r from-cian via-magenta to-cian bg-clip-text text-transparent">
                                    Community Pool
                                </span>
                            </h1>
                            <p className="text-gray-400 text-lg">
                                {userTier === 'FREE'
                                    ? 'Access shared generations from the community'
                                    : 'Your contributions help democratize music creation'
                                }
                            </p>
                        </div>

                        {/* Claim Button (FREE users only) */}
                        {userTier === 'FREE' && (
                            <button
                                onClick={handleClaim}
                                disabled={claiming}
                                className="px-8 py-4 bg-gradient-to-r from-cian to-magenta text-white rounded-lg font-bold text-lg hover:shadow-xl hover:shadow-cian/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {claiming ? (
                                    <>
                                        <span className="inline-block animate-spin mr-2">⏳</span>
                                        Claiming...
                                    </>
                                ) : (
                                    <>🎲 Claim Random Generation</>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Info banner */}
                    <div className="bg-cian/10 border border-cian/30 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">❤️</span>
                            <div>
                                <p className="text-white font-semibold">
                                    Powered by Community Contributions
                                </p>
                                <p className="text-sm text-gray-400">
                                    5% of all paid tier generations automatically contribute to this pool,
                                    making high-quality music accessible to everyone.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Filters */}
                <div className="mb-8">
                    <div className="flex flex-wrap gap-4 items-center mb-4">
                        {/* Genre filters */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400">Genre:</span>
                            <div className="flex gap-2 flex-wrap">
                                {genres.map(genre => (
                                    <button
                                        key={genre}
                                        onClick={() => handleGenreChange(genre)}
                                        className={`
                      px-4 py-2 rounded-full text-sm font-semibold transition-all
                      ${(selectedGenre === null && genre === 'All') || selectedGenre === genre
                                                ? 'bg-cian text-carbón'
                                                : 'bg-carbón-light text-gray-400 hover:text-white hover:bg-carbón'
                                            }
                    `}
                                    >
                                        {genre}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sort options */}
                        <div className="flex items-center gap-2 ml-auto">
                            <span className="text-sm text-gray-400">Sort by:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => handleSortChange(e.target.value as SortBy)}
                                className="px-4 py-2 bg-carbón-dark border border-cian/20 rounded-lg text-white focus:border-cian focus:outline-none"
                            >
                                <option value="recent">Most Recent</option>
                                <option value="popular">Most Popular</option>
                                <option value="quality">Highest Quality</option>
                            </select>
                        </div>
                    </div>

                    {/* Stats bar */}
                    <div className="flex items-center gap-6 text-sm text-gray-400">
                        <span>
                            <span className="text-cian font-bold">{items.length}</span> tracks available
                        </span>
                        {userTier === 'FREE' && (
                            <span>
                                <span className="text-magenta font-bold">3</span> claims per day
                            </span>
                        )}
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin w-16 h-16 border-4 border-cian border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-gray-400">Loading pool...</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
                        <p className="text-red-400 text-lg font-semibold mb-2">⚠️ Error loading pool</p>
                        <p className="text-gray-400">{error}</p>
                        <button
                            onClick={() => loadPool()}
                            className="mt-4 px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Grid */}
                {!loading && !error && (
                    <AnimatePresence mode="wait">
                        {items.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center py-20"
                            >
                                <div className="text-6xl mb-4">🎵</div>
                                <h3 className="text-2xl font-bold text-white mb-2">Pool is Empty</h3>
                                <p className="text-gray-400">
                                    No contributions yet. Check back soon!
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {items.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <PoolItemCard
                                            item={item}
                                            onPlay={handlePlay}
                                            onLike={likeItem}
                                            isPlaying={playingId === item.audio_url}
                                        />
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}

                {/* How it Works section */}
                {!loading && items.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-16 pt-8 border-t border-cian/20"
                    >
                        <h2 className="text-3xl font-bold text-cian mb-6 text-center">
                            How the Community Pool Works
                        </h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <InfoCard
                                icon="🎵"
                                title="Automatic Contribution"
                                description="5% of all generations from paid tiers automatically go to the community pool"
                            />
                            <InfoCard
                                icon="🎁"
                                title="Free Access"
                                description="FREE tier users can claim up to 3 random generations per day from the pool"
                            />
                            <InfoCard
                                icon="🏆"
                                title="Give Back"
                                description="Top contributors earn recognition and special badges in the community"
                            />
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

function InfoCard({ icon, title, description }: { icon: string; title: string; description: string }) {
    return (
        <div className="bg-carbón-dark border border-cian/20 rounded-lg p-6 text-center">
            <div className="text-5xl mb-4">{icon}</div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-400">{description}</p>
        </div>
    );
}

// Simple toast helper (you can replace with your toast library)
function showToast({ type, message }: { type: 'success' | 'error'; message: string }) {
    // This is a placeholder - integrate with your actual toast system
    console.log(`[${type.toUpperCase()}]`, message);
    alert(message);
}
