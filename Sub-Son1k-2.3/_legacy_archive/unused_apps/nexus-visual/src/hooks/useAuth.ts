import { useEffect, useState } from 'react';

export type UserTier = 'INITIATE' | 'VANGUARD' | 'COMMANDER';

interface User {
    id: string;
    email: string;
    tier: UserTier;
    token: string;
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for stored token
        const token = localStorage.getItem('auth_token');

        if (token) {
            // Decode JWT (you might want to use a library like jwt-decode)
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({
                    id: payload.userId,
                    email: payload.email,
                    tier: payload.tier, // Ensure backend sends INITIATE/VANGUARD/COMMANDER
                    token
                });
            } catch (err) {
                console.error('Invalid token:', err);
                localStorage.removeItem('auth_token');
            }
        }

        setIsLoading(false);
    }, []);

    const isPremium = user?.tier === 'VANGUARD' || user?.tier === 'COMMANDER';
    const isUltimate = user?.tier === 'COMMANDER';
    const hasAlvaeStatus = user?.id === 'nov4-ix'; // Temporary hardcoded check for Architects

    return {
        user,
        isLoading,
        isPremium,
        isUltimate,
        hasAlvaeStatus,
        tier: user?.tier || 'INITIATE',
        token: user?.token
    };
}
