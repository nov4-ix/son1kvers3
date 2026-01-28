'use client';

import { motion } from 'framer-motion';
import { Lock, Zap, Crown, ShieldAlert } from 'lucide-react';

interface PremiumPaywallProps {
    feature: string;
    description?: string;
    currentTier?: 'INITIATE' | 'VANGUARD' | 'COMMANDER';
    requiredTier?: 'VANGUARD' | 'COMMANDER';
}

export function PremiumPaywall({
    feature,
    description = 'Access restricted. Higher clearance level required.',
    currentTier = 'INITIATE',
    requiredTier = 'VANGUARD'
}: PremiumPaywallProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center p-8 bg-black/60 backdrop-blur-xl rounded-2xl border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.1)] relative overflow-hidden"
        >
            {/* Background Grid Effect */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

            {/* Warning Badge */}
            <motion.div
                className="mb-6 relative z-10"
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.8, 1, 0.8]
                }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/50 flex items-center justify-center">
                    <Lock size={32} className="text-red-500" />
                </div>
                <ShieldAlert
                    size={20}
                    className="absolute -top-1 -right-1 text-yellow-500"
                />
            </motion.div>

            {/* Title */}
            <h3 className="text-xl font-bold text-white mb-2 text-center font-mono uppercase tracking-wider">
                Access Denied: {feature}
            </h3>

            {/* Description */}
            <p className="text-white/50 text-center mb-6 max-w-md text-sm font-mono">
                {description}
            </p>

            {/* Current Tier Badge */}
            <div className="mb-8 px-4 py-2 bg-white/5 rounded-lg border border-white/10 flex items-center gap-3">
                <span className="text-xs text-white/40 uppercase tracking-widest">Current Clearance:</span>
                <span className={`font-bold font-mono ${currentTier === 'INITIATE' ? 'text-gray-400' :
                        currentTier === 'VANGUARD' ? 'text-cyan-400' :
                            'text-yellow-400'
                    }`}>
                    [{currentTier}]
                </span>
            </div>

            {/* Upgrade Button */}
            <motion.button
                className="group relative px-8 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-mono text-sm font-bold rounded-lg border border-red-500/50 hover:border-red-400 transition-all overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <span className="relative z-10 flex items-center gap-2">
                    <Zap size={16} />
                    UPGRADE CLEARANCE TO {requiredTier}
                </span>
                <div className="absolute inset-0 bg-red-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </motion.button>

            {/* Small print */}
            <p className="text-[10px] text-white/20 mt-4 font-mono uppercase">
                System Override Required
            </p>
        </motion.div>
    );
}

// Inline upgrade prompt (less intrusive)
export function UpgradePrompt({ feature }: { feature: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg"
        >
            <Lock size={20} className="text-cyan-400 flex-shrink-0" />
            <div className="flex-1">
                <p className="text-sm text-white font-medium">
                    {feature} is a premium feature
                </p>
                <p className="text-xs text-gray-400">
                    Upgrade to unlock collaboration and advanced tools
                </p>
            </div>
            <a
                href="/pricing"
                className="px-4 py-2 bg-cyan-500 text-black text-sm font-semibold rounded-full hover:bg-cyan-400 transition-colors"
            >
                Upgrade
            </a>
        </motion.div>
    );
}
