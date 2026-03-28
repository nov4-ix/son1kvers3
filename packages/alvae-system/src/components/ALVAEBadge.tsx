import React from 'react';

interface ALVAEBadgeProps {
    size?: 'xs' | 'sm' | 'md' | 'lg';
    animated?: boolean;
    showLabel?: boolean;
    tier?: 'FOUNDER' | 'TESTER' | 'EARLY_ADOPTER';
}

export function ALVAEBadge({
    size = 'md',
    animated = true,
    showLabel = true,
    tier = 'FOUNDER'
}: ALVAEBadgeProps) {
    const sizes = {
        xs: 'w-6 h-6',
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    };

    const tierColors = {
        FOUNDER: '#FFD700',      // Gold
        TESTER: '#00FFE7',       // Cyan
        EARLY_ADOPTER: '#B84DFF' // Magenta
    };

    const glowColor = tierColors[tier];

    return (
        <div className={`alvae-badge flex flex-col items-center gap-2 ${animated ? 'animate-pulse-slow' : ''}`}>
            {/* SVG Symbol - Lightning bolt in incomplete circle */}
            <div className={`relative ${sizes[size]}`}>
                <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full"
                    style={{
                        filter: animated ? `drop-shadow(0 0 10px ${glowColor}50)` : 'none'
                    }}
                >
                    <defs>
                        {/* Gradient for the symbol */}
                        <linearGradient id={`alvaeGrad-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: glowColor, stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: glowColor, stopOpacity: 0.7 }} />
                        </linearGradient>

                        {/* Glow effect */}
                        <filter id={`alvaeGlow-${tier}`}>
                            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Incomplete Circle (open at top) */}
                    <path
                        d="M 85 50 A 35 35 0 1 1 15 50"
                        fill="none"
                        stroke={`url(#alvaeGrad-${tier})`}
                        strokeWidth="4"
                        strokeLinecap="round"
                        filter={`url(#alvaeGlow-${tier})`}
                    />

                    {/* Lightning Bolt */}
                    <path
                        d="M 50 20 L 40 50 L 50 50 L 45 80 L 65 45 L 55 45 L 60 20 Z"
                        fill={`url(#alvaeGrad-${tier})`}
                        filter={`url(#alvaeGlow-${tier})`}
                    />
                </svg>

                {/* Animated glow background */}
                {animated && (
                    <div
                        className="absolute inset-0 rounded-full blur-xl animate-pulse"
                        style={{
                            background: `radial-gradient(circle, ${glowColor}30 0%, transparent 70%)`,
                            zIndex: -1
                        }}
                    />
                )}
            </div>

            {/* Label */}
            {showLabel && (
                <span
                    className="text-xs font-bold tracking-wider"
                    style={{
                        background: `linear-gradient(135deg, ${glowColor} 0%, ${glowColor}80 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}
                >
                    ALVAE
                </span>
            )}
        </div>
    );
}

// Avatar Border component for ALVAE holders
export function ALVAEAvatarBorder({
    children,
    tier
}: {
    children: React.ReactNode;
    tier: 'FOUNDER' | 'TESTER' | 'EARLY_ADOPTER';
}) {
    const borderColors = {
        FOUNDER: 'from-yellow-400 via-yellow-300 to-yellow-500',
        TESTER: 'from-cian via-cian-light to-cian',
        EARLY_ADOPTER: 'from-magenta via-magenta-light to-magenta'
    };

    const glowColors = {
        FOUNDER: 'shadow-yellow-400/50',
        TESTER: 'shadow-cian/50',
        EARLY_ADOPTER: 'shadow-magenta/50'
    };

    return (
        <div className="relative inline-block">
            {/* Animated gradient border */}
            <div className={`
        relative p-1 rounded-full 
        bg-gradient-to-br ${borderColors[tier]}
        shadow-lg ${glowColors[tier]}
        animate-gradient-rotate
      `}>
                <div className="relative rounded-full overflow-hidden bg-carbón">
                    {children}
                </div>

                {/* Orbiting particles */}
                <div className="absolute inset-0 animate-orbit pointer-events-none">
                    <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-white rounded-full -translate-x-1/2"></div>
                </div>
                <div className="absolute inset-0 animate-orbit-reverse pointer-events-none" style={{ animationDelay: '1s' }}>
                    <div className="absolute bottom-0 left-1/2 w-1.5 h-1.5 bg-white rounded-full -translate-x-1/2"></div>
                </div>
            </div>

            {/* ALVAE Badge overlay */}
            <div className="absolute -top-1 -right-1 z-10">
                <ALVAEBadge size="xs" animated tier={tier} showLabel={false} />
            </div>
        </div>
    );
}

// Inline badge for showing in text/names
export function ALVAEInlineBadge({ tier }: { tier: 'FOUNDER' | 'TESTER' | 'EARLY_ADOPTER' }) {
    const tierLabels = {
        FOUNDER: 'FOUNDER',
        TESTER: 'TESTER',
        EARLY_ADOPTER: 'EARLY ADOPTER'
    };

    const tierColors = {
        FOUNDER: 'bg-yellow-400/20 border-yellow-400 text-yellow-400',
        TESTER: 'bg-cian/20 border-cian text-cian',
        EARLY_ADOPTER: 'bg-magenta/20 border-magenta text-magenta'
    };

    return (
        <div className={`
      inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border
      ${tierColors[tier]}
    `}>
            <ALVAEBadge size="xs" animated={false} showLabel={false} tier={tier} />
            <span className="text-xs font-bold tracking-wide">
                {tierLabels[tier]}
            </span>
        </div>
    );
}
