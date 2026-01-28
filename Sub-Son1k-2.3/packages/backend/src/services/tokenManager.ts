/**
 * Advanced Token Management Service
 * Handles token harvesting, rotation, and optimization for Neural Engine API
 * Enhanced version with improved performance and reliability
 */

import { PrismaClient } from '@prisma/client';
import axios, { AxiosInstance } from 'axios';
import Redis from 'ioredis';
import { EventEmitter } from 'events';
import crypto from 'crypto';
import {
  generateSecureToken,
  generateAPIKey,
  hashForLogging,
  sanitizeForLogging,
  RateLimiter,
  ValidationError,
  ErrorFactory
} from './local-utils';
import { env } from '../lib/config';

export interface TokenInfo {
  id: string;
  hash: string;
  userId?: string;
  email?: string;
  isActive: boolean;
  isValid: boolean;
  lastUsed?: Date;
  usageCount: number;
  rateLimit: number;
  tier: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
  expiresAt?: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenUsage {
  tokenId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  error?: string;
}

export interface TokenPoolStats {
  totalTokens: number;
  activeTokens: number;
  healthyTokens: number;
  averageResponseTime: number;
  totalRequests: number;
  successRate: number;
}

interface EncryptedToken {
  ciphertext: string;
  iv: string;
  authTag: string;
  version: number;
}

export class TokenManager extends EventEmitter {
  private tokens: Map<string, TokenInfo> = new Map();
  private rateLimiters: Map<string, RateLimiter> = new Map();
  private redis?: Redis;
  private axiosInstances: Map<string, AxiosInstance> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;
  private masterKey: Buffer;
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly currentVersion = 1;

  constructor(private prisma: PrismaClient) {
    super();

    // Derive master key from environment variable
    const encryptionKey = env.TOKEN_ENCRYPTION_KEY || 'dev-encryption-key-min-32-chars-for-development-only-change-in-production';
    this.masterKey = this.deriveMasterKey(encryptionKey);

    this.initializeRedis();
    this.initializeHealthCheck();
    this.initializeCleanup();

    // Listen for token events
    this.on('tokenAdded', this.handleTokenAdded.bind(this));
    this.on('tokenRemoved', this.handleTokenRemoved.bind(this));
    this.on('tokenError', this.handleTokenError.bind(this));
  }

  /**
   * Derive master key using scrypt
   */
  private deriveMasterKey(seed: string): Buffer {
    const salt = 'son1k-token-encryption-salt-v1'; // Fixed salt for consistency
    return crypto.scryptSync(seed, salt, this.keyLength);
  }

  /**
   * Initialize Redis connection for caching
   */
  private async initializeRedis() {
    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL);

      this.redis.on('error', (error) => {
        console.error('Redis connection error:', error);
      });

      this.redis.on('connect', () => {
        console.log('Redis connected successfully');
      });
    }
  }

  /**
   * Initialize health check interval
   */
  private initializeHealthCheck() {
    const interval = parseInt(process.env.HEALTH_CHECK_INTERVAL || '300000'); // 5 minutes default
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, interval);
  }

  /**
   * Initialize cleanup interval
   */
  private initializeCleanup() {
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupExpiredTokens();
    }, 3600000); // Every hour
  }

  /**
   * Add a new token to the pool
   */
  async addToken(
    token: string,
    userId?: string,
    email?: string,
    tier: 'FREE' | 'PREMIUM' | 'ENTERPRISE' = 'FREE',
    metadata: Record<string, any> = {}
  ): Promise<string> {
    try {
      // Hash token for security
      const tokenHash = hashForLogging(token);

      // Check if token already exists
      const existingToken = await this.prisma.token.findUnique({
        where: { hash: tokenHash }
      });

      if (existingToken) {
        throw new ValidationError('Token already exists in pool');
      }

      // Validate token with Neural Engine API
      const validation = await this.validateTokenWithGenerationAPI(token);
      const isValid = validation.isValid;

      // Encrypt token before storing
      const encryptedTokenString = this.encryptToken(token);

      // Create token record
      const tokenRecord = await this.prisma.token.create({
        data: {
          hash: tokenHash,
          userId,
          email,
          isActive: true,
          isValid,
          usageCount: 0,
          rateLimit: this.getRateLimitForTier(tier),
          tier,
          encryptedToken: encryptedTokenString, // Store encrypted token
          metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata || {}), // Convert to JSON string if needed
          expiresAt: tier === 'FREE' ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined // 24h for free
        }
      });

      // Create rate limiter for this token
      this.rateLimiters.set(tokenRecord.id, new RateLimiter(
        this.getRateLimitForTier(tier),
        60000 // 1 minute window
      ));

      // Cache token info
      this.tokens.set(tokenRecord.id, {
        id: tokenRecord.id,
        hash: tokenHash,
        userId,
        email,
        isActive: true,
        isValid,
        usageCount: 0,
        rateLimit: this.getRateLimitForTier(tier),
        tier,
        metadata,
        createdAt: tokenRecord.createdAt,
        updatedAt: tokenRecord.updatedAt
      });

      // Store original token securely (encrypted)
      if (this.redis) {
        await this.redis.setex(
          `token:${tokenRecord.id}:original`,
          86400, // 24 hours
          this.encryptToken(token)
        );
      }

      this.emit('tokenAdded', { tokenId: tokenRecord.id, tier, userId });

      return tokenRecord.id;
    } catch (error) {
      this.emit('tokenError', { error, operation: 'addToken', userId });
      throw ErrorFactory.fromUnknown(error, 'Failed to add token');
    }
  }

  /**
   * Get a healthy token for API requests
   */
  async getHealthyToken(userId?: string): Promise<{ token: string; tokenId: string } | null> {
    try {
      // Get tokens ordered by health score
      const tokens = await this.getTokensByHealth(userId);

      for (const tokenInfo of tokens) {
        if (!tokenInfo.isActive || !tokenInfo.isValid) continue;

        // Check rate limit
        const rateLimiter = this.rateLimiters.get(tokenInfo.id);
        if (rateLimiter && !rateLimiter.tryConsume(`token:${tokenInfo.id}`)) {
          continue;
        }

        // Get original token
        const originalToken = await this.getOriginalToken(tokenInfo.id);
        if (!originalToken) continue;

        // Update usage
        await this.updateTokenUsage(tokenInfo.id);

        return {
          token: originalToken,
          tokenId: tokenInfo.id
        };
      }

    } catch (error) {
      this.emit('tokenError', { error, operation: 'getHealthyToken', userId });
      // Don't fail yet, try emergency
    }

    // Fallback: Emergency Mode
    console.warn('⚠️ Main token retrieval failed, attempting Emergency Mode...');
    const emergencyToken = await this.getEmergencyToken();
    if (emergencyToken) {
      // Return a dummy tokenId since emergency mode bypasses tracking logic mostly
      return {
        token: emergencyToken,
        tokenId: 'emergency-bypass'
      };
    }

    return null;
  }

  /**
   * EMERGENCY BYPASS: Get any valid token without locks/redis/complex checks
   * Use this when main logic fails but tokens exist.
   */
  async getEmergencyToken(): Promise<string | null> {
    try {
      // Find first valid token directly from DB
      const tokenRecord = await this.prisma.token.findFirst({
        where: {
          isActive: true,
          isValid: true
        },
        orderBy: {
          updatedAt: 'desc' // Try most recently updated/checked first
        }
      });

      if (!tokenRecord) {
        console.warn('⚠️ EMERGENCY: No valid tokens found even in emergency mode');
        return null;
      }

      // Decrypt and return
      if (tokenRecord.encryptedToken) {
        return this.decryptToken(tokenRecord.encryptedToken);
      }

      // Fallback for old unencrypted tokens (if any)
      // Note: In strict mode we might not store unencrypted, but checking just in case
      return null;

    } catch (error) {
      console.error('CRITICAL: Emergency token retrieval failed:', error);
      return null;
    }
  }

  /**
   * Acquire a token with distributed locking
   * Ensures exclusive access to the token for a short duration
   */
  async acquireToken(userId?: string, tier: 'FREE' | 'PREMIUM' | 'ENTERPRISE' = 'FREE'): Promise<{ token: string; tokenId: string } | null> {
    try {
      // 1. Get candidates (healthy tokens)
      const tokens = await this.getTokensByHealth(userId);

      // Filter by tier preference (optional: strict tier enforcement)
      // For now, we allow using any available token, but prioritize better ones via getTokensByHealth

      for (const tokenInfo of tokens) {
        if (!tokenInfo.isActive || !tokenInfo.isValid) continue;

        // 2. Check local rate limit
        const rateLimiter = this.rateLimiters.get(tokenInfo.id);
        if (rateLimiter && !rateLimiter.tryConsume(`token:${tokenInfo.id}`)) {
          continue;
        }

        // 3. Try to acquire distributed lock in Redis
        if (this.redis) {
          const lockKey = `token:lock:${tokenInfo.id}`;
          // Set lock with 30s expiration, only if not exists (NX)
          const acquired = await this.redis.set(lockKey, 'locked', 'PX', 30000, 'NX');

          if (!acquired) {
            // Token is currently in use by another process/request
            continue;
          }
        }

        // 4. Get original token
        const originalToken = await this.getOriginalToken(tokenInfo.id);
        if (!originalToken) {
          // If failed to get token, release lock immediately
          if (this.redis) {
            await this.redis.del(`token:lock:${tokenInfo.id}`);
          }
          continue;
        }

        // 5. Update usage stats
        await this.updateTokenUsage(tokenInfo.id);

        console.log(`🔐 Token acquired and locked: ${tokenInfo.id}`);
        return {
          token: originalToken,
          tokenId: tokenInfo.id
        };
      }

      console.warn('⚠️ No available tokens could be acquired (all locked or unhealthy)');
      return null;
    } catch (error) {
      this.emit('tokenError', { error, operation: 'acquireToken', userId });
      return null;
    }
  }

  /**
   * Release a token lock
   */
  async releaseToken(tokenId: string): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.del(`token:lock:${tokenId}`);
        console.log(`🔓 Token released: ${tokenId}`);
      }
    } catch (error) {
      console.error(`Failed to release token ${tokenId}:`, error);
    }
  }

  /**
   * Validate token with generation API and check credits
   */
  async validateTokenWithGenerationAPI(token: string): Promise<{ isValid: boolean; credits?: number }> {
    try {
      // Try to check credits first (if API supports it)
      try {
        const apiUrl = process.env.GENERATION_API_URL || process.env.NEURAL_ENGINE_API_URL || 'https://ai.imgkits.com/suno';
        const creditsResponse = await axios.get(`${apiUrl}/credits`, {
          timeout: 5000,
          headers: {
            'authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'channel': 'node-api'
          },
          validateStatus: (status) => status < 500
        });

        if (creditsResponse.status === 200 && creditsResponse.data) {
          const credits = creditsResponse.data.credits || creditsResponse.data.credit || 0;
          return {
            isValid: credits > 0,
            credits
          };
        }
      } catch (creditsError: any) {
        // Credits endpoint might not exist, fallback to generation test
        if (creditsError.response?.status !== 404) {
          console.debug('Credits check failed, using fallback:', creditsError.message);
        }
      }

      // Fallback: Validate token haciendo una petición de prueba a la API de generación
      // Usamos un prompt real pero con instrumental para no consumir muchos créditos
      const apiUrl = process.env.GENERATION_API_URL || process.env.NEURAL_ENGINE_API_URL || 'https://ai.imgkits.com/suno';
      const response = await axios.post(`${apiUrl}/generate`, {
        prompt: 'instrumental background music',
        lyrics: '',
        title: 'Token Validation',
        style: 'ambient',
        customMode: false,
        instrumental: true
      }, {
        timeout: 10000,
        headers: {
          'authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'channel': 'node-api'
        },
        validateStatus: (status) => status < 500 // Aceptar todo excepto errores de servidor
      });

      // Token válido si no es 401 (Unauthorized)
      return {
        isValid: response.status !== 401,
        credits: undefined
      };
    } catch (error: any) {
      // Si es error 401, el token es inválido
      if (error.response?.status === 401) {
        return { isValid: false };
      }
      console.error('Token validation failed:', error);
      return { isValid: false };
    }
  }

  /**
   * Get tokens ordered by health score
   */
  private async getTokensByHealth(userId?: string) {
    const where: any = {
      isActive: true,
      isValid: true
    };

    if (userId) {
      where.OR = [
        { userId: userId },
        { userId: null }
      ];
    }

    const tokens = await this.prisma.token.findMany({
      where,
      orderBy: [
        { usageCount: 'asc' }, // Prefer less used tokens
        { updatedAt: 'desc' }  // Prefer recently updated
      ],
      take: 10
    });

    return tokens.map(token => ({
      id: token.id,
      hash: token.hash,
      userId: token.userId,
      email: token.email,
      isActive: token.isActive,
      isValid: token.isValid,
      usageCount: token.usageCount,
      rateLimit: token.rateLimit,
      tier: token.tier,
      metadata: token.metadata,
      createdAt: token.createdAt,
      updatedAt: token.updatedAt
    }));
  }

  /**
   * Update token usage statistics
   */
  async updateTokenUsage(tokenId: string, usage?: Partial<TokenUsage>) {
    try {
      const tokenInfo = this.tokens.get(tokenId);
      if (!tokenInfo) return;

      // Update in database
      await this.prisma.token.update({
        where: { id: tokenId },
        data: {
          usageCount: { increment: 1 },
          lastUsed: new Date(),
          updatedAt: new Date()
        }
      });

      // Update in memory cache
      tokenInfo.usageCount++;
      tokenInfo.lastUsed = new Date();
      tokenInfo.updatedAt = new Date();

      // Track usage analytics
      if (usage) {
        await this.trackTokenUsage(tokenId, usage);
      }

    } catch (error) {
      this.emit('tokenError', { error, operation: 'updateTokenUsage', tokenId });
    }
  }

  /**
   * Track token usage for analytics
   */
  private async trackTokenUsage(tokenId: string, usage: Partial<TokenUsage>) {
    try {
      await this.prisma.tokenUsage.create({
        data: {
          tokenId,
          endpoint: usage.endpoint || '',
          method: usage.method || '',
          statusCode: usage.statusCode || 0,
          responseTime: usage.responseTime || 0,
          timestamp: usage.timestamp || new Date(),
          error: usage.error
        }
      });
    } catch (error) {
      console.error('Failed to track token usage:', error);
    }
  }

  /**
   * Get original token (decrypted)
   */
  private async getOriginalToken(tokenId: string): Promise<string | null> {
    try {
      // Try Redis first
      if (this.redis) {
        const cached = await this.redis.get(`token:${tokenId}:original`);
        if (cached) {
          return this.decryptToken(cached);
        }
      }

      // Fallback to database (encrypted)
      const tokenRecord = await this.prisma.token.findUnique({
        where: { id: tokenId }
      });

      if (tokenRecord?.encryptedToken) {
        return this.decryptToken(tokenRecord.encryptedToken);
      }

      return null;
    } catch (error) {
      console.error('Failed to get original token:', error);
      return null;
    }
  }

  /**
   * Encrypt token for storage using AES-256-GCM
   * Public method to allow external services to encrypt tokens
   */
  public encryptToken(token: string): string {
    try {
      // Generate random IV for each encryption
      const iv = crypto.randomBytes(this.ivLength);

      // Create cipher
      const cipher = crypto.createCipheriv(
        this.algorithm,
        this.masterKey,
        iv
      );

      // Encrypt token
      let encrypted = cipher.update(token, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Create encrypted token object
      const encryptedToken: EncryptedToken = {
        ciphertext: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        version: this.currentVersion
      };

      // Return as JSON string (will be stored in DB/Redis)
      return JSON.stringify(encryptedToken);
    } catch (error) {
      console.error('Token encryption failed:', error);
      throw ErrorFactory.fromUnknown(error, 'Failed to encrypt token');
    }
  }

  /**
   * Decrypt token from storage using AES-256-GCM
   */
  private decryptToken(encryptedTokenString: string): string {
    try {
      // Try to parse as new format (JSON with version)
      let encryptedToken: EncryptedToken;

      try {
        encryptedToken = JSON.parse(encryptedTokenString);
      } catch (parseError) {
        // Fallback: might be old base64 format, try to decrypt it
        try {
          const oldDecrypted = Buffer.from(encryptedTokenString, 'base64').toString('utf-8');
          // If it's valid JSON with version, it's already decrypted old format
          const parsed = JSON.parse(oldDecrypted);
          if (parsed.version) {
            encryptedToken = parsed;
          } else {
            // It's plain text in old format, return as-is
            return oldDecrypted;
          }
        } catch {
          // If all parsing fails, assume it's old base64 format
          return Buffer.from(encryptedTokenString, 'base64').toString('utf-8');
        }
      }

      // Validate version
      if (encryptedToken.version !== this.currentVersion) {
        console.warn(`Token encryption version mismatch: ${encryptedToken.version} vs ${this.currentVersion}`);
        // For now, try to decrypt anyway (for migration purposes)
      }

      // Create decipher
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.masterKey,
        Buffer.from(encryptedToken.iv, 'hex')
      );

      // Set authentication tag
      decipher.setAuthTag(Buffer.from(encryptedToken.authTag, 'hex'));

      // Decrypt token
      let decrypted = decipher.update(encryptedToken.ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Token decryption failed:', error);
      // Try fallback to base64 for backward compatibility
      try {
        return Buffer.from(encryptedTokenString, 'base64').toString('utf-8');
      } catch (fallbackError) {
        throw ErrorFactory.fromUnknown(error, 'Failed to decrypt token');
      }
    }
  }

  /**
   * Get rate limit for tier
   */
  private getRateLimitForTier(tier: string): number {
    switch (tier) {
      case 'ENTERPRISE': return 1000;
      case 'PREMIUM': return 100;
      case 'FREE': return 10;
      default: return 10;
    }
  }

  /**
   * Perform health check on all tokens
   * Validates tokens, checks credits, and alerts if < 3 healthy tokens
   */
  async performHealthCheck(): Promise<{ isHealthy: boolean; healthyCount: number; totalCount: number }> {
    try {
      const tokens = await this.prisma.token.findMany({
        where: { isActive: true }
      });

      if (tokens.length === 0) {
        console.warn('⚠️ No active tokens in pool');
        this.emit('tokenPoolEmpty', {});
        return { isHealthy: false, healthyCount: 0, totalCount: 0 };
      }

      let healthyCount = 0;
      const minHealthyTokens = 3;

      for (const token of tokens) {
        try {
          const originalToken = await this.getOriginalToken(token.id);
          if (!originalToken) {
            console.warn(`Token ${token.id} has no original token stored`);
            continue;
          }

          const validation = await this.validateTokenWithGenerationAPI(originalToken);

          if (validation.isValid) {
            healthyCount++;

            // Update token metadata with credits if available
            if (validation.credits !== undefined) {
              const metadata = typeof token.metadata === 'string'
                ? JSON.parse(token.metadata || '{}')
                : token.metadata || {};

              metadata.credits = validation.credits;
              metadata.lastCreditsCheck = new Date().toISOString();

              await this.prisma.token.update({
                where: { id: token.id },
                data: {
                  isValid: true,
                  metadata: JSON.stringify(metadata)
                }
              });
            } else {
              // Just mark as valid
              await this.prisma.token.update({
                where: { id: token.id },
                data: { isValid: true }
              });
            }

            // Update cache
            const cachedToken = this.tokens.get(token.id);
            if (cachedToken) {
              cachedToken.isValid = true;
            }
          } else {
            // Mark as invalid
            await this.prisma.token.update({
              where: { id: token.id },
              data: { isValid: false }
            });

            // Update cache
            const cachedToken = this.tokens.get(token.id);
            if (cachedToken) {
              cachedToken.isValid = false;
            }

            console.warn(`⚠️ Token ${token.id} marked as invalid during health check`);
          }
        } catch (error) {
          console.error(`Error checking token ${token.id}:`, error);
          // Mark as invalid on error
          await this.prisma.token.update({
            where: { id: token.id },
            data: { isValid: false }
          });
        }
      }

      const isHealthy = healthyCount >= minHealthyTokens;

      // Alert if too few healthy tokens
      if (healthyCount < minHealthyTokens) {
        const alert = {
          level: healthyCount === 0 ? 'critical' : 'warning' as 'critical' | 'warning',
          message: `Only ${healthyCount} healthy token(s) remaining (minimum: ${minHealthyTokens})`,
          healthyCount,
          totalCount: tokens.length,
          timestamp: new Date().toISOString()
        };

        console.error(`🚨 TOKEN POOL ALERT [${alert.level.toUpperCase()}]:`, alert.message);
        this.emit('tokenPoolLow', alert);
      }

      return {
        isHealthy,
        healthyCount,
        totalCount: tokens.length
      };
    } catch (error) {
      console.error('Health check failed:', error);
      this.emit('healthCheckFailed', { error });
      return { isHealthy: false, healthyCount: 0, totalCount: 0 };
    }
  }

  /**
   * Health check method for external services
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;

      // Check Redis connection
      if (this.redis) {
        await this.redis.ping();
      }

      // Check if we have active tokens
      const activeTokens = await this.prisma.token.count({
        where: { isActive: true, isValid: true }
      });

      return activeTokens > 0;
    } catch (error) {
      console.error('Token manager health check failed:', error);
      return false;
    }
  }

  /**
   * Get token pool statistics
   */
  async getPoolStats(): Promise<TokenPoolStats> {
    try {
      const totalTokens = await this.prisma.token.count();
      const activeTokens = await this.prisma.token.count({
        where: { isActive: true }
      });
      const healthyTokens = await this.prisma.token.count({
        where: { isActive: true, isValid: true }
      });

      // Calculate average response time
      const recentUsage = await this.prisma.tokenUsage.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 1000
      });

      const averageResponseTime = recentUsage.length > 0
        ? recentUsage.reduce((sum, usage) => sum + usage.responseTime, 0) / recentUsage.length
        : 0;

      const totalRequests = recentUsage.length;
      const successRate = totalRequests > 0
        ? (recentUsage.filter(usage => usage.statusCode >= 200 && usage.statusCode < 300).length / totalRequests) * 100
        : 100;

      return {
        totalTokens,
        activeTokens,
        healthyTokens,
        averageResponseTime,
        totalRequests,
        successRate
      };
    } catch (error) {
      console.error('Failed to get pool stats:', error);
      throw ErrorFactory.fromUnknown(error, 'Failed to get token pool statistics');
    }
  }

  /**
   * Remove token from pool
   */
  async removeToken(tokenId: string): Promise<boolean> {
    try {
      // Update database
      await this.prisma.token.update({
        where: { id: tokenId },
        data: { isActive: false }
      });

      // Remove from cache
      this.tokens.delete(tokenId);
      this.rateLimiters.delete(tokenId);

      // Remove from Redis
      if (this.redis) {
        await this.redis.del(`token:${tokenId}:original`);
      }

      this.emit('tokenRemoved', { tokenId });

      return true;
    } catch (error) {
      this.emit('tokenError', { error, operation: 'removeToken', tokenId });
      return false;
    }
  }

  /**
   * Cleanup expired tokens
   */
  private async cleanupExpiredTokens() {
    try {
      const expiredTokens = await this.prisma.token.findMany({
        where: {
          expiresAt: {
            lt: new Date()
          },
          isActive: true
        }
      });

      for (const token of expiredTokens) {
        await this.removeToken(token.id);
      }

      if (expiredTokens.length > 0) {
        console.log(`Cleaned up ${expiredTokens.length} expired tokens`);
      }
    } catch (error) {
      console.error('Token cleanup failed:', error);
    }
  }

  /**
   * Handle token added event
   */
  private handleTokenAdded(data: { tokenId: string; tier: string; userId?: string }) {
    console.log(`Token added: ${data.tokenId} (Tier: ${data.tier}, User: ${data.userId || 'System'})`);
  }

  /**
   * Handle token removed event
   */
  private handleTokenRemoved(data: { tokenId: string }) {
    console.log(`Token removed: ${data.tokenId}`);
  }

  /**
   * Handle token error event
   */
  private handleTokenError(data: { error: any; operation: string; tokenId?: string; userId?: string }) {
    console.error(`Token error in ${data.operation}:`, {
      tokenId: data.tokenId,
      userId: data.userId,
      error: sanitizeForLogging(data.error)
    });
  }

  /**
   * Close token manager and cleanup resources
   */
  async close() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    if (this.redis) {
      await this.redis.quit();
    }

    await this.prisma.$disconnect();
  }
}
