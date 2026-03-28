/**
 * Simple Token Manager - No Database Required
 * For quick deployment without Prisma dependency
 */

export interface TokenData {
  token: string;
  tokenId: string;
  isHealthy: boolean;
  lastUsed?: Date;
  usageCount: number;
}

export interface TokenUsage {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
}

export class SimpleTokenManager {
  private tokens: Map<string, TokenData> = new Map();
  private currentIndex = 0;

  constructor(tokenStrings: string[]) {
    // Initialize tokens
    tokenStrings.forEach((tokenString, index) => {
      const tokenId = `token-${index}`;
      this.tokens.set(tokenId, {
        token: tokenString,
        tokenId,
        isHealthy: true,
        usageCount: 0
      });
    });

    console.log(`[SimpleTokenManager] Initialized with ${this.tokens.size} tokens`);
  }

  async getHealthyToken(userId: string): Promise<TokenData | null> {
    const tokenArray = Array.from(this.tokens.values());
    
    if (tokenArray.length === 0) {
      console.warn('[SimpleTokenManager] No tokens available');
      return null;
    }

    // Simple round-robin selection
    const token = tokenArray[this.currentIndex % tokenArray.length];
    this.currentIndex = (this.currentIndex + 1) % tokenArray.length;

    // Update usage
    token.lastUsed = new Date();
    token.usageCount++;

    console.log(`[SimpleTokenManager] Token ${token.tokenId} selected (usage: ${token.usageCount})`);

    return token;
  }

  async updateTokenUsage(tokenId: string, usage: TokenUsage): Promise<void> {
    const tokenData = this.tokens.get(tokenId);
    
    if (!tokenData) {
      console.warn(`[SimpleTokenManager] Token ${tokenId} not found`);
      return;
    }

    // Mark as unhealthy if error status
    if (usage.statusCode >= 400) {
      tokenData.isHealthy = false;
      console.warn(`[SimpleTokenManager] Token ${tokenId} marked as unhealthy (status: ${usage.statusCode})`);
    }
  }

  getTokenCount(): number {
    return this.tokens.size;
  }

  getHealthyTokenCount(): number {
    return Array.from(this.tokens.values()).filter(t => t.isHealthy).length;
  }
}
