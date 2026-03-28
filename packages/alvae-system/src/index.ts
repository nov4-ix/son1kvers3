import { useState, useEffect } from 'react';

interface ALVAEStatus {
    isAlvae: boolean;
    tier: 'FOUNDER' | 'TESTER' | 'EARLY_ADOPTER' | null;
    alvaeId: string | null;
    privileges: any;
    grantedAt: string | null;
}

export function useALVAE(userId: string) {
    const [status, setStatus] = useState<ALVAEStatus>({
        isAlvae: false,
        tier: null,
        alvaeId: null,
        privileges: null,
        grantedAt: null
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        fetchALVAEStatus();
    }, [userId]);

    const fetchALVAEStatus = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/alvae/status/${userId}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch ALVAE status');
            }

            const data = await response.json();
            setStatus({
                isAlvae: data.is_alvae,
                tier: data.tier,
                alvaeId: data.alvae_id,
                privileges: data.privileges,
                grantedAt: data.granted_at
            });
        } catch (error) {
            console.error('Error fetching ALVAE status:', error);
            // Default to non-ALVAE
            setStatus({
                isAlvae: false,
                tier: null,
                alvaeId: null,
                privileges: null,
                grantedAt: null
            });
        } finally {
            setLoading(false);
        }
    };

    const hasPrivilege = (privilegeName: string): boolean => {
        if (!status.isAlvae || !status.privileges) {
            return false;
        }
        return status.privileges[privilegeName] === true;
    };

    return {
        ...status,
        loading,
        hasPrivilege,
        refresh: fetchALVAEStatus
    };
}

// Service class
export class ALVAEService {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    async getStatus(userId: string): Promise<ALVAEStatus> {
        const response = await fetch(`${this.baseUrl}/api/alvae/status/${userId}`);

        if (!response.ok) {
            throw new Error('Failed to fetch ALVAE status');
        }

        const data = await response.json();

        return {
            isAlvae: data.is_alvae,
            tier: data.tier,
            alvaeId: data.alvae_id,
            privileges: data.privileges,
            grantedAt: data.granted_at
        };
    }

    async grantALVAE(
        targetUserId: string,
        grantedByUserId: string,
        tier: 'TESTER' | 'EARLY_ADOPTER',
        notes?: string
    ) {
        const response = await fetch(`${this.baseUrl}/api/alvae/grant`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                target_user_id: targetUserId,
                granted_by_user_id: grantedByUserId,
                tier,
                notes
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to grant ALVAE');
        }

        return response.json();
    }

    async revokeALVAE(targetUserId: string, revokedByUserId: string) {
        const response = await fetch(`${this.baseUrl}/api/alvae/revoke`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                target_user_id: targetUserId,
                revoked_by_user_id: revokedByUserId
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to revoke ALVAE');
        }

        return response.json();
    }

    async getAllMembers() {
        const response = await fetch(`${this.baseUrl}/api/alvae/members`);

        if (!response.ok) {
            throw new Error('Failed to fetch ALVAE members');
        }

        const data = await response.json();
        return data.members;
    }

    async checkPrivilege(userId: string, privilegeName: string): Promise<boolean> {
        const response = await fetch(
            `${this.baseUrl}/api/alvae/privilege/${userId}/${privilegeName}`
        );

        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        return data.has_privilege;
    }
}

export * from './components/ALVAEBadge';
