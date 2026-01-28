'use client';

import { motion } from 'framer-motion';

export function WaveformSkeleton() {
    return (
        <div className="w-full h-32 bg-gradient-to-br from-gray-900 to-black rounded-lg overflow-hidden relative">
            <div className="absolute inset-0 flex items-center justify-center gap-1">
                {Array.from({ length: 60 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="w-1 bg-gradient-to-t from-cyan-500/30 to-purple-500/30 rounded-full"
                        style={{ height: `${Math.random() * 60 + 20}%` }}
                        animate={{
                            scaleY: [1, 1.5, 1],
                            opacity: [0.3, 0.7, 0.3]
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.02
                        }}
                    />
                ))}
            </div>

            {/* Shimmer effect */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
        </div>
    );
}

export function PulsingOrb({ text = 'Generating...' }: { text?: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative">
                {/* Outer pulse rings */}
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="absolute inset-0 rounded-full border-2 border-cyan-500"
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{
                            scale: [1, 2.5],
                            opacity: [0.5, 0]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.6,
                            ease: 'easeOut'
                        }}
                        style={{ width: 100, height: 100 }}
                    />
                ))}

                {/* Center orb */}
                <motion.div
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 shadow-2xl"
                    animate={{
                        scale: [1, 1.1, 1],
                        boxShadow: [
                            '0 0 20px rgba(0, 191, 255, 0.5)',
                            '0 0 40px rgba(0, 191, 255, 0.8)',
                            '0 0 20px rgba(0, 191, 255, 0.5)'
                        ]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                />
            </div>

            <motion.p
                className="text-sm font-medium text-cyan-400"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                {text}
            </motion.p>
        </div>
    );
}

export function ProgressPulse({ progress = 0 }: { progress?: number }) {
    return (
        <div className="w-full max-w-md">
            <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                {/* Animated background */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20"
                    animate={{
                        x: ['-100%', '100%']
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear'
                    }}
                />

                {/* Progress bar */}
                <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                    style={{ width: `${progress}%` }}
                    animate={{
                        boxShadow: [
                            '0 0 10px rgba(0, 191, 255, 0.5)',
                            '0 0 20px rgba(0, 191, 255, 0.8)',
                            '0 0 10px rgba(0, 191, 255, 0.5)'
                        ]
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity
                    }}
                />
            </div>

            <p className="text-center text-sm font-mono text-gray-400 mt-2">
                {Math.round(progress)}%
            </p>
        </div>
    );
}
