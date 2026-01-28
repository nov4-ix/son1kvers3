interface Token {
    token: string;
    addedAt: number;
    lastUsed?: number;
    failures?: number;
    source?: 'manual' | 'extension' | 'auto';
}

interface TokenStats {
    total: number;
    valid: number;
    failed: number;
    currentIndex: number;
}

class TokenManager {
    private static instance: TokenManager;
    private tokens: Token[] = [];
    private currentIndex: number = 0;
    private readonly STORAGE_KEY = 'suno_jwt_tokens';
    private readonly MAX_FAILURES = 3;

    private constructor() {
        this.loadFromStorage();
        this.setupExtensionListener();
        console.log('[TokenManager] Initialized with', this.tokens.length, 'tokens');
    }

    static getInstance(): TokenManager {
        if (!TokenManager.instance) {
            TokenManager.instance = new TokenManager();
        }
        return TokenManager.instance;
    }

    private loadFromStorage(): void {
        if (typeof window === 'undefined') return;

        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.tokens = JSON.parse(stored);
                console.log('[TokenManager] Loaded tokens from storage', this.tokens.length);
            }
        } catch (error) {
            console.error('[TokenManager] Error loading tokens:', error);
            this.tokens = [];
        }
    }

    private saveToStorage(): void {
        if (typeof window === 'undefined') return;

        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tokens));
        } catch (error) {
            console.error('[TokenManager] Error saving tokens:', error);
        }
    }

    private setupExtensionListener(): void {
        if (typeof window === 'undefined') return;

        window.addEventListener('message', (event) => {
            if (event.data.type === 'SUNO_TOKEN_CAPTURED') {
                const token = event.data.token;
                console.log('[TokenManager] 🎉 Token captured from extension:', token.substring(0, 20) + '...');
                this.addToken(token, 'extension');
            }
        });

        console.log('[TokenManager] 🔌 Extension listener enabled');
    }

    addToken(token: string, source: 'manual' | 'extension' | 'auto' = 'manual'): boolean {
        if (!token || !token.startsWith('eyJ')) {
            console.error('[TokenManager] Invalid token format');
            return false;
        }

        const exists = this.tokens.some(t => t.token === token);
        if (exists) {
            console.warn('[TokenManager] Token already exists');
            return false;
        }

        this.tokens.push({
            token,
            addedAt: Date.now(),
            failures: 0,
            source
        });

        this.saveToStorage();
        console.log(`[TokenManager] ✅ Added new token from ${source}. Total:`, this.tokens.length);
        return true;
    }

    getNextToken(): string | null {
        if (this.tokens.length === 0) {
            console.error('[TokenManager] No tokens available');
            return null;
        }

        const validTokens = this.tokens.filter(t => (t.failures || 0) < this.MAX_FAILURES);

        if (validTokens.length === 0) {
            console.error('[TokenManager] All tokens have failed');
            return null;
        }

        this.currentIndex = this.currentIndex % validTokens.length;
        const token = validTokens[this.currentIndex];

        token.lastUsed = Date.now();
        this.saveToStorage();

        console.log('[TokenManager] Using token', this.currentIndex + 1, 'of', validTokens.length);

        this.currentIndex++;
        return token.token;
    }

    markTokenFailure(token: string): void {
        const tokenObj = this.tokens.find(t => t.token === token);
        if (tokenObj) {
            tokenObj.failures = (tokenObj.failures || 0) + 1;
            this.saveToStorage();
            console.warn('[TokenManager] Token failure count:', tokenObj.failures);
        }
    }

    markTokenSuccess(token: string): void {
        const tokenObj = this.tokens.find(t => t.token === token);
        if (tokenObj) {
            tokenObj.failures = 0;
            this.saveToStorage();
        }
    }

    removeToken(token: string): boolean {
        const initialLength = this.tokens.length;
        this.tokens = this.tokens.filter(t => t.token !== token);

        if (this.tokens.length < initialLength) {
            this.saveToStorage();
            console.log('[TokenManager] Removed token. Total:', this.tokens.length);
            return true;
        }
        return false;
    }

    clearAllTokens(): void {
        this.tokens = [];
        this.currentIndex = 0;
        if (typeof window !== 'undefined') {
            localStorage.removeItem(this.STORAGE_KEY);
        }
        console.log('[TokenManager] CLEANING FROM ROOT - Cleared all tokens');
    }

    getTokens(): Token[] {
        return [...this.tokens];
    }

    hasTokens(): boolean {
        return this.tokens.filter(t => (t.failures || 0) < this.MAX_FAILURES).length > 0;
    }

    getStats(): TokenStats {
        return {
            total: this.tokens.length,
            valid: this.tokens.filter(t => (t.failures || 0) < this.MAX_FAILURES).length,
            failed: this.tokens.filter(t => (t.failures || 0) >= this.MAX_FAILURES).length,
            currentIndex: this.currentIndex
        };
    }
}

export default TokenManager;
export const tokenManager = TokenManager.getInstance();
