import React from 'react';
import { motion } from 'framer-motion';
import { TierType, TierConfig } from '../index';

interface TierCardProps {
    config: TierConfig;
    currentTier: TierType;
    onUpgrade: (tier: TierType) => void;
    isPopular?: boolean;
}

const getTierLevel = (tier: TierType): number => {
    const levels = { FREE: 0, CREATOR: 1, PRO: 2, STUDIO: 3 };
    return levels[tier] || 0;
};

export function TierCard({
    config,
    currentTier,
    onUpgrade,
    isPopular = false
}: TierCardProps) {
    const isCurrent = config.name === currentTier;
    const isUpgrade = getTierLevel(config.name) > getTierLevel(currentTier);
    const isDowngrade = getTierLevel(config.name) < getTierLevel(currentTier);

    const tierColors = {
        FREE: 'from-gray-500 to-gray-600',
        CREATOR: 'from-cian to-cian-dark',
        PRO: 'from-magenta to-magenta-dark',
        STUDIO: 'from-yellow-400 to-orange-500'
    };

    const tierIcons = {
        FREE: '🎵',
        CREATOR: '🎨',
        PRO: '⚡',
        STUDIO: '👑'
    };

    return (
        <motion.div
            whileHover={!isCurrent ? { scale: 1.03, y: -5 } : {}}
            className={`
        tier-card relative p-6 rounded-xl 
        ${isCurrent
                    ? `border-4 border-cian bg-gradient-to-br ${tierColors[config.name]} bg-opacity-10`
                    : 'border-2 border-carbón-light bg-carbón-dark'
                }
        ${isPopular ? 'ring-2 ring-magenta' : ''}
        hover:border-cian transition-all duration-300
      `}
        >
            {/* Popular Badge */}
            {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="px-4 py-1 bg-gradient-to-r from-magenta to-magenta-dark rounded-full text-xs font-bold text-white shadow-lg">
                        ⭐ Most Popular
                    </div>
                </div>
            )}

            {/* Current Badge */}
            {isCurrent && (
                <div className="absolute -top-3 right-4">
                    <div className="px-3 py-1 bg-cian text-carbón rounded-full text-xs font-bold">
                        ✓ Current Plan
                    </div>
                </div>
            )}

            {/* Icon & Name */}
            <div className="text-center mb-4">
                <div className="text-5xl mb-2">{tierIcons[config.name]}</div>
                <h3 className={`text-2xl font-bold bg-gradient-to-r ${tierColors[config.name]} bg-clip-text text-transparent`}>
                    {config.name}
                </h3>
            </div>

            {/* Price */}
            <div className="text-center mb-6">
                {config.price === 0 ? (
                    <div className="text-4xl font-bold text-white">FREE</div>
                ) : (
                    <div>
                        <span className="text-5xl font-bold text-white">${config.price}</span>
                        <span className="text-gray-400 text-sm">/month</span>
                    </div>
                )}
            </div>

            {/* Features List */}
            <ul className="space-y-3 mb-6 min-h-[300px]">
                {/* Generations */}
                <FeatureItem
                    icon="🎵"
                    text={
                        config.generationsPerDay
                            ? `${config.generationsPerDay} generations/day`
                            : `${config.generationsPerMonth} generations/month`
                    }
                />

                {/* Quality */}
                <FeatureItem
                    icon="✨"
                    text={`Quality: ${config.quality.join(', ')}`}
                />

                {/* Storage */}
                <FeatureItem
                    icon="💾"
                    text={
                        config.storage === -1
                            ? 'Unlimited storage'
                            : `${config.storage}GB storage`
                    }
                />

                {/* Features */}
                {config.features.map((feature, i) => (
                    <FeatureItem
                        key={i}
                        icon="✓"
                        text={feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    />
                ))}

                {/* Community Pool */}
                {config.name === 'FREE' && (
                    <FeatureItem
                        icon="🤝"
                        text="Access to Community Pool"
                        highlight
                    />
                )}

                {config.name !== 'FREE' && (
                    <FeatureItem
                        icon="❤️"
                        text="5% auto-contribution to pool"
                        highlight
                    />
                )}
            </ul>

            {/* CTA Button */}
            <button
                onClick={() => !isCurrent && isUpgrade && onUpgrade(config.name)}
                disabled={isCurrent || isDowngrade}
                className={`
          w-full py-4 rounded-lg font-bold text-lg transition-all duration-300
          ${isCurrent
                        ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                        : isUpgrade
                            ? `bg-gradient-to-r ${tierColors[config.name]} text-white hover:shadow-xl hover:shadow-${config.name}/50`
                            : 'bg-gray-700 cursor-not-allowed text-gray-500'
                    }
        `}
            >
                {isCurrent ? (
                    '✓ Your Current Plan'
                ) : isUpgrade ? (
                    <>Upgrade to {config.name} →</>
                ) : (
                    'Contact Sales'
                )}
            </button>

            {/* Extra info for paid tiers */}
            {config.price > 0 && !isCurrent && (
                <p className="text-center text-xs text-gray-400 mt-3">
                    Cancel anytime • No long-term commitment
                </p>
            )}
        </motion.div>
    );
}

function FeatureItem({
    icon,
    text,
    highlight = false
}: {
    icon: string;
    text: string;
    highlight?: boolean;
}) {
    return (
        <li className="flex items-start gap-3">
            <span className={`text-lg ${highlight ? 'text-cian' : 'text-cian-light'}`}>
                {icon}
            </span>
            <span className={`text-sm leading-relaxed ${highlight ? 'text-cian font-semibold' : 'text-gray-300'}`}>
                {text}
            </span>
        </li>
    );
}
