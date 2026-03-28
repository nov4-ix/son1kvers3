import React from 'react';
import { motion } from 'framer-motion';

interface PoolItemCardProps {
    item: {
        id: number;
        generation_id: string;
        quality: string;
        genre: string;
        plays: number;
        likes: number;
        audio_url: string;
        contributed_at: string;
        contributor: {
            user_id: string;
            username: string;
            avatar: string;
        };
    };
    onPlay: (audioUrl: string) => void;
    onLike: (itemId: number) => void;
    isPlaying?: boolean;
}

export function PoolItemCard({ item, onPlay, onLike, isPlaying = false }: PoolItemCardProps) {
    const qualityColors = {
        standard: 'bg-gray-500',
        high: 'bg-cian',
        ultra: 'bg-magenta'
    };

    const qualityIcons = {
        standard: '🎵',
        high: '✨',
        ultra: '💎'
    };

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className="pool-item-card bg-carbón-dark border border-cian/20 rounded-lg overflow-hidden hover:border-cian/50 transition-all"
        >
            {/* Cover/Waveform */}
            <div className="relative aspect-video bg-gradient-to-br from-cian/20 via-carbón to-magenta/20">
                {/* Waveform visualization placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-end gap-1 h-20">
                        {Array.from({ length: 40 }).map((_, i) => (
                            <div
                                key={i}
                                className="w-1 bg-cian/60 rounded-full animate-pulse"
                                style={{
                                    height: `${Math.random() * 100}%`,
                                    animationDelay: `${i * 0.05}s`
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Play button overlay */}
                <div
                    onClick={() => onPlay(item.audio_url)}
                    className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/60 transition-opacity cursor-pointer group"
                >
                    <button className={`
            w-16 h-16 rounded-full flex items-center justify-center
            ${isPlaying
                            ? 'bg-magenta text-white'
                            : 'bg-cian text-carbón group-hover:scale-110'
                        }
            transition-all
          `}>
                        {isPlaying ? '⏸' : '▶'}
                    </button>
                </div>

                {/* Quality badge */}
                <div className="absolute top-2 right-2">
                    <div className={`
            px-3 py-1 rounded-full text-xs font-bold text-white
            ${qualityColors[item.quality as keyof typeof qualityColors] || qualityColors.standard}
          `}>
                        {qualityIcons[item.quality as keyof typeof qualityIcons]} {item.quality.toUpperCase()}
                    </div>
                </div>

                {/* Genre tag */}
                <div className="absolute top-2 left-2">
                    <div className="px-3 py-1 bg-carbón/80 backdrop-blur-sm rounded-full text-xs text-cian border border-cian/30">
                        {item.genre || 'Unknown'}
                    </div>
                </div>
            </div>

            {/* Info section */}
            <div className="p-4">
                {/* Contributor */}
                <div className="flex items-center gap-3 mb-3">
                    <img
                        src={item.contributor.avatar}
                        alt={item.contributor.username}
                        className="w-8 h-8 rounded-full border border-cian/30"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-semibold truncate">
                            {item.contributor.username}
                        </p>
                        <p className="text-xs text-gray-400">
                            {new Date(item.contributed_at).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="text-xs text-cian">
                        Contributed
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-gray-400">
                            <span className="text-cian">▶</span> {item.plays}
                        </span>
                        <button
                            onClick={() => onLike(item.id)}
                            className="flex items-center gap-1 text-gray-400 hover:text-magenta transition-colors"
                        >
                            <span className="text-magenta">❤️</span> {item.likes}
                        </button>
                    </div>

                    <button
                        onClick={() => onPlay(item.audio_url)}
                        className="px-4 py-1.5 bg-cian/20 hover:bg-cian/30 text-cian rounded text-xs font-bold transition-colors"
                    >
                        Play Now
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
