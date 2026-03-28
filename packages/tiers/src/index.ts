export type TierType = 'FREE' | 'CREATOR' | 'PRO' | 'STUDIO';

export interface TierConfig {
    name: TierType;
    price: number;
    generationsPerMonth: number | null;
    generationsPerDay: number | null;
    quality: string[];
    storage: number;
    features: string[];
    stripePriceId?: string;
}

export interface UsageLimits {
    canGenerate: boolean;
    remaining: number;
    resetAt: string;
    reason?: string;
    tier: TierType;
}

export class TierService {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    async getUserLimits(userId: string): Promise<UsageLimits> {
        try {
            const response = await fetch(
                `${this.baseUrl}/api/tiers/limits/${userId}`
            );

            if (!response.ok) {
                console.warn('Failed to fetch user limits, defaulting to free');
                return {
                    canGenerate: true,
                    remaining: 3,
                    resetAt: new Date().toISOString(),
                    tier: 'FREE'
                };
            }

            const data = await response.json();
            return {
                ...data.limits,
                tier: data.tier
            };
        } catch (e) {
            console.error("Error fetching user limits", e);
            return {
                canGenerate: true,
                remaining: 3,
                resetAt: new Date().toISOString(),
                tier: 'FREE'
            };
        }
    }

    async createCheckout(userId: string, tier: TierType): Promise<string> {
        const response = await fetch(`${this.baseUrl}/api/tiers/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, tier })
        });

        if (!response.ok) {
            throw new Error("Checkout creation failed");
        }

        const data = await response.json();
        return data.checkout_url;
    }

    async upgradeTier(userId: string, targetTier: TierType) {
        const checkoutUrl = await this.createCheckout(userId, targetTier);
        window.location.href = checkoutUrl;
    }
}

export * from './components/TierCard';
