import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TierService, TierType, TierConfig } from '@son1k/tiers';
import { TierCard } from '@son1k/tiers';

interface PricingPageProps {
    userId?: string;
    currentTier?: TierType;
}

const TIER_CONFIGS: TierConfig[] = [
    {
        name: 'FREE',
        price: 0,
        generationsPerDay: 3,
        generationsPerMonth: null,
        quality: ['standard'],
        storage: 1,
        features: [
            'basic-generation',
            'simple-editing',
            'community-pool-access',
            'pixel-companion-basic'
        ]
    },
    {
        name: 'CREATOR',
        price: 9.99,
        generationsPerDay: null,
        generationsPerMonth: 50,
        quality: ['standard', 'high'],
        storage: 10,
        features: [
            'advanced-editing',
            'ghost-studio-lite',
            'looper-full',
            'adaptive-pixels',
            'lyric-studio',
            'community-contributions',
            'priority-support'
        ],
        stripePriceId: 'price_creator_monthly'
    },
    {
        name: 'PRO',
        price: 29.99,
        generationsPerDay: null,
        generationsPerMonth: 200,
        quality: ['standard', 'high', 'ultra'],
        storage: 100,
        features: [
            'all-features',
            'ghost-studio-full',
            'nova-post-pilot',
            'voice-cloning',
            'ml-features',
            'api-limited',
            'collaboration-tools',
            'analytics-dashboard',
            'priority-support'
        ],
        stripePriceId: 'price_pro_monthly'
    },
    {
        name: 'STUDIO',
        price: 99.99,
        generationsPerDay: null,
        generationsPerMonth: 1000,
        quality: ['standard', 'high', 'ultra'],
        storage: -1,
        features: [
            'enterprise-features',
            'white-label-option',
            'api-full-access',
            'unlimited-storage',
            'dedicated-support',
            'custom-integration',
            'team-collaboration',
            'advanced-analytics',
            'early-access-features'
        ],
        stripePriceId: 'price_studio_monthly'
    }
];

export function PricingPage({ userId, currentTier = 'FREE' }: PricingPageProps) {
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
    const [loading, setLoading] = useState(false);
    const tierService = new TierService(import.meta.env.VITE_API_URL || 'http://localhost:8000');

    const handleUpgrade = async (tier: TierType) => {
        if (!userId) {
            // Redirect to signup
            window.location.href = '/signup?redirect=/pricing';
            return;
        }

        setLoading(true);
        try {
            await tierService.upgradeTier(userId, tier);
        } catch (error) {
            console.error('Upgrade error:', error);
            alert('Error al procesar el upgrade. Por favor, intenta de nuevo.');
            setLoading(false);
        }
    };

    const getDiscountedPrice = (price: number) => {
        if (billingPeriod === 'yearly') {
            return (price * 12 * 0.8).toFixed(2); // 20% off anual
        }
        return price;
    };

    return (
        <div className="pricing-page min-h-screen bg-gradient-to-br from-carbón via-carbón-dark to-carbón py-20">
            <div className="container mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-6xl font-bold mb-4">
                        <span className="bg-gradient-to-r from-cian via-magenta to-cian bg-clip-text text-transparent">
                            Choose Your Tier
                        </span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Democratize music creation at your own pace. Start free, scale as you grow.
                    </p>

                    {/* Billing Period Toggle */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <button
                            onClick={() => setBillingPeriod('monthly')}
                            className={`px-6 py-2 rounded-full font-bold transition-all ${billingPeriod === 'monthly'
                                    ? 'bg-cian text-carbón'
                                    : 'bg-carbón-light text-gray-400 hover:text-white'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingPeriod('yearly')}
                            className={`px-6 py-2 rounded-full font-bold transition-all relative ${billingPeriod === 'yearly'
                                    ? 'bg-cian text-carbón'
                                    : 'bg-carbón-light text-gray-400 hover:text-white'
                                }`}
                        >
                            Yearly
                            <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-magenta text-white text-xs rounded-full">
                                -20%
                            </span>
                        </button>
                    </div>
                </motion.div>

                {/* Tiers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {TIER_CONFIGS.map((config, index) => (
                        <motion.div
                            key={config.name}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <TierCard
                                config={{
                                    ...config,
                                    price: config.price > 0
                                        ? billingPeriod === 'yearly'
                                            ? parseFloat(getDiscountedPrice(config.price))
                                            : config.price
                                        : 0
                                }}
                                currentTier={currentTier}
                                onUpgrade={handleUpgrade}
                                isPopular={config.name === 'CREATOR'}
                            />
                        </motion.div>
                    ))}
                </div>

                {/* Additional Info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="max-w-4xl mx-auto"
                >
                    {/* FAQ Section */}
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold text-cian text-center mb-8">
                            Frequently Asked Questions
                        </h2>
                        <div className="space-y-4">
                            <FAQItem
                                question="What is the Community Pool?"
                                answer="Users on paid tiers automatically contribute 5% of their generations to a community pool. FREE users can claim from this pool (3 per day), democratizing access to high-quality music generation."
                            />
                            <FAQItem
                                question="Can I change tiers anytime?"
                                answer="Yes! You can upgrade anytime. Downgrades take effect at the end of your current billing period."
                            />
                            <FAQItem
                                question="What payment methods do you accept?"
                                answer="We accept all major credit cards via Stripe: Visa, Mastercard, American Express, and more."
                            />
                            <FAQItem
                                question="Is there a free trial for paid tiers?"
                                answer="Start with the FREE tier to try the platform. When you're ready, upgrade to unlock premium features."
                            />
                            <FAQItem
                                question="What happens if I hit my generation limit?"
                                answer="FREE users can claim from the Community Pool. Paid users can wait for the monthly reset or upgrade to a higher tier."
                            />
                        </div>
                    </div>

                    {/* Trust Signals */}
                    <div className="text-center py-8 border-t border-cian/20">
                        <p className="text-gray-400 mb-4">
                            🔒 Secure payments powered by Stripe
                        </p>
                        <p className="text-gray-400 mb-4">
                            ❤️ All plans contribute to community democratization
                        </p>
                        <p className="text-gray-400">
                            ⚡ Cancel anytime • No long-term commitment
                        </p>
                    </div>

                    {/* CTA for logged out users */}
                    {!userId && (
                        <div className="text-center py-12 bg-gradient-to-r from-cian/10 to-magenta/10 rounded-xl border border-cian/20">
                            <h3 className="text-2xl font-bold text-white mb-4">
                                Ready to start creating?
                            </h3>
                            <p className="text-gray-400 mb-6">
                                Sign up now and get started with the FREE tier
                            </p>
                            <button
                                onClick={() => window.location.href = '/signup'}
                                className="px-8 py-4 bg-gradient-to-r from-cian to-magenta text-white rounded-lg font-bold text-lg hover:shadow-xl transition-all"
                            >
                                Get Started Free →
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Loading Overlay */}
            {loading && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="text-center">
                        <div className="animate-spin w-16 h-16 border-4 border-cian border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-white text-lg">Processing your upgrade...</p>
                    </div>
                </div>
            )}
        </div>
    );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-carbón-dark border border-cian/20 rounded-lg overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-cian/5 transition-colors"
            >
                <span className="font-semibold text-white">{question}</span>
                <span className={`text-cian transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    ▼
                </span>
            </button>
            {isOpen && (
                <div className="px-6 py-4 bg-carbón/50 border-t border-cian/10">
                    <p className="text-gray-400">{answer}</p>
                </div>
            )}
        </div>
    );
}
