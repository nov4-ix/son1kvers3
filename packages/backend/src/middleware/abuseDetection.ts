/**
 * Abuse Detection Middleware
 * Detects and prevents abuse patterns:
 * - Multiple accounts from same device
 * - Anomalous generation patterns
 * - Suspicious activity
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import Redis from 'ioredis';
import { generateDeviceFingerprint } from './security';

interface AbusePattern {
  type: 'multiple_accounts' | 'anomalous_generations' | 'high_failure_rate' | 'rapid_requests';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  details: Record<string, any>;
}

interface BlockedEntity {
  identifier: string; // IP, userId, or deviceFingerprint
  type: 'ip' | 'user' | 'device';
  reason: string;
  blockedUntil: Date;
  attempts: number;
}

export class AbuseDetectionService {
  private redis: Redis;
  private blockedEntities: Map<string, BlockedEntity> = new Map();
  private readonly BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_ATTEMPTS_BEFORE_BLOCK = 5;
  private readonly SUSPICIOUS_GENERATIONS_THRESHOLD = 50; // per hour
  private readonly MAX_ACCOUNTS_PER_DEVICE = 3;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
      });
    } else {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: 3,
      });
    }

    // Cleanup expired blocks every 5 minutes
    setInterval(() => this.cleanupExpiredBlocks(), 5 * 60 * 1000);
  }

  /**
   * Check if request should be blocked
   */
  async checkAbuse(
    request: FastifyRequest,
    userId?: string
  ): Promise<{ blocked: boolean; reason?: string; retryAfter?: number }> {
    const ip = request.ip || 'unknown';
    const deviceFingerprint = generateDeviceFingerprint(request);

    // Check if IP is blocked
    const ipBlock = await this.isBlocked(`ip:${ip}`);
    if (ipBlock.blocked) {
      return {
        blocked: true,
        reason: ipBlock.reason,
        retryAfter: ipBlock.retryAfter,
      };
    }

    // Check if user is blocked
    if (userId) {
      const userBlock = await this.isBlocked(`user:${userId}`);
      if (userBlock.blocked) {
        return {
          blocked: true,
          reason: userBlock.reason,
          retryAfter: userBlock.retryAfter,
        };
      }
    }

    // Check if device is blocked
    const deviceBlock = await this.isBlocked(`device:${deviceFingerprint}`);
    if (deviceBlock.blocked) {
      return {
        blocked: true,
        reason: deviceBlock.reason,
        retryAfter: deviceBlock.retryAfter,
      };
    }

    // Check for multiple accounts from same device
    if (userId) {
      const multipleAccounts = await this.checkMultipleAccounts(deviceFingerprint, userId);
      if (multipleAccounts.detected) {
        await this.recordAbusePattern({
          type: 'multiple_accounts',
          severity: 'high',
          timestamp: new Date(),
          details: {
            deviceFingerprint,
            userId,
            accountCount: multipleAccounts.count,
          },
        });

        // Block device if too many accounts
        if (multipleAccounts.count >= this.MAX_ACCOUNTS_PER_DEVICE) {
          await this.blockEntity(`device:${deviceFingerprint}`, 'device', 'Multiple accounts from same device');
          return {
            blocked: true,
            reason: 'Multiple accounts detected from same device',
            retryAfter: this.BLOCK_DURATION_MS / 1000,
          };
        }
      }
    }

    // Check for anomalous generation patterns
    if (userId) {
      const anomalous = await this.checkAnomalousGenerations(userId);
      if (anomalous.detected) {
        await this.recordAbusePattern({
          type: 'anomalous_generations',
          severity: 'critical',
          timestamp: new Date(),
          details: {
            userId,
            generationsLastHour: anomalous.count,
          },
        });

        await this.blockEntity(`user:${userId}`, 'user', 'Anomalous generation pattern detected');
        return {
          blocked: true,
          reason: 'Suspicious activity detected',
          retryAfter: this.BLOCK_DURATION_MS / 1000,
        };
      }
    }

    // Check for rapid requests
    const rapidRequests = await this.checkRapidRequests(ip, userId, deviceFingerprint);
    if (rapidRequests.detected) {
      await this.recordAbusePattern({
        type: 'rapid_requests',
        severity: 'medium',
        timestamp: new Date(),
        details: {
          ip,
          userId,
          deviceFingerprint,
          requestsLastMinute: rapidRequests.count,
        },
      });

      // Increment abuse counter
      const abuseKey = userId ? `abuse:user:${userId}` : `abuse:ip:${ip}`;
      const abuseCount = await this.redis.incr(abuseKey);
      await this.redis.expire(abuseKey, 3600); // 1 hour TTL

      if (abuseCount >= this.MAX_ATTEMPTS_BEFORE_BLOCK) {
        const entityType = userId ? 'user' : 'ip';
        const entityId = userId || ip;
        await this.blockEntity(`${entityType}:${entityId}`, entityType, 'Too many rapid requests');
        return {
          blocked: true,
          reason: 'Too many rapid requests',
          retryAfter: this.BLOCK_DURATION_MS / 1000,
        };
      }
    }

    return { blocked: false };
  }

  /**
   * Check if entity is blocked
   */
  private async isBlocked(identifier: string): Promise<{
    blocked: boolean;
    reason?: string;
    retryAfter?: number;
  }> {
    // Check in-memory cache first
    const cached = this.blockedEntities.get(identifier);
    if (cached && cached.blockedUntil > new Date()) {
      const retryAfter = Math.ceil((cached.blockedUntil.getTime() - Date.now()) / 1000);
      return {
        blocked: true,
        reason: cached.reason,
        retryAfter,
      };
    }

    // Check Redis
    const blocked = await this.redis.get(`blocked:${identifier}`);
    if (blocked) {
      const blockData: BlockedEntity = JSON.parse(blocked);
      if (new Date(blockData.blockedUntil) > new Date()) {
        const retryAfter = Math.ceil(
          (new Date(blockData.blockedUntil).getTime() - Date.now()) / 1000
        );
        return {
          blocked: true,
          reason: blockData.reason,
          retryAfter,
        };
      }
    }

    return { blocked: false };
  }

  /**
   * Block an entity
   */
  private async blockEntity(
    identifier: string,
    type: 'ip' | 'user' | 'device',
    reason: string
  ): Promise<void> {
    const blockedUntil = new Date(Date.now() + this.BLOCK_DURATION_MS);
    const blockData: BlockedEntity = {
      identifier,
      type,
      reason,
      blockedUntil,
      attempts: 1,
    };

    // Store in memory
    this.blockedEntities.set(identifier, blockData);

    // Store in Redis
    await this.redis.setex(
      `blocked:${identifier}`,
      Math.ceil(this.BLOCK_DURATION_MS / 1000),
      JSON.stringify(blockData)
    );

    console.warn(`🚨 Entity blocked: ${identifier} (${type}) - ${reason}`);
  }

  /**
   * Check for multiple accounts from same device
   */
  private async checkMultipleAccounts(
    deviceFingerprint: string,
    userId: string
  ): Promise<{ detected: boolean; count: number }> {
    const key = `device:accounts:${deviceFingerprint}`;

    // Add user to device's account list
    await this.redis.sadd(key, userId);
    await this.redis.expire(key, 86400); // 24 hours TTL

    // Get count of unique accounts
    const count = await this.redis.scard(key);

    return {
      detected: count > 1,
      count,
    };
  }

  /**
   * Check for anomalous generation patterns
   */
  private async checkAnomalousGenerations(userId: string): Promise<{
    detected: boolean;
    count: number;
  }> {
    const key = `generations:user:${userId}:hour`;
    const count = await this.redis.incr(key);
    await this.redis.expire(key, 3600); // 1 hour TTL

    return {
      detected: count > this.SUSPICIOUS_GENERATIONS_THRESHOLD,
      count,
    };
  }

  /**
   * Check for rapid requests
   */
  private async checkRapidRequests(
    ip: string,
    userId?: string,
    deviceFingerprint?: string
  ): Promise<{ detected: boolean; count: number }> {
    const keys: string[] = [`rapid:ip:${ip}`];
    if (userId) keys.push(`rapid:user:${userId}`);
    if (deviceFingerprint) keys.push(`rapid:device:${deviceFingerprint}`);

    let maxCount = 0;
    for (const key of keys) {
      const count = await this.redis.incr(key);
      await this.redis.expire(key, 60); // 1 minute TTL
      maxCount = Math.max(maxCount, count);
    }

    // More than 30 requests per minute is suspicious
    return {
      detected: maxCount > 30,
      count: maxCount,
    };
  }

  /**
   * Record abuse pattern for analysis
   */
  private async recordAbusePattern(pattern: AbusePattern): Promise<void> {
    const key = `abuse:pattern:${Date.now()}`;
    await this.redis.setex(key, 86400 * 7, JSON.stringify(pattern)); // Keep for 7 days

    // Log critical patterns
    if (pattern.severity === 'critical' || pattern.severity === 'high') {
      console.error('🚨 Abuse pattern detected:', pattern);
    }
  }

  /**
   * Cleanup expired blocks
   */
  private async cleanupExpiredBlocks(): Promise<void> {
    const now = new Date();
    for (const [identifier, block] of this.blockedEntities.entries()) {
      if (block.blockedUntil <= now) {
        this.blockedEntities.delete(identifier);
        await this.redis.del(`blocked:${identifier}`);
      }
    }
  }

  /**
   * Get abuse statistics
   */
  async getAbuseStats(): Promise<{
    blockedEntities: number;
    patternsLast24h: number;
  }> {
    const blockedCount = this.blockedEntities.size;

    // Count patterns in last 24h
    const patternKeys = await this.redis.keys('abuse:pattern:*');
    const patternsLast24h = patternKeys.length;

    return {
      blockedEntities: blockedCount,
      patternsLast24h,
    };
  }
}

// Singleton instance
let abuseDetectionService: AbuseDetectionService | null = null;

export function getAbuseDetectionService(): AbuseDetectionService {
  if (!abuseDetectionService) {
    abuseDetectionService = new AbuseDetectionService();
  }
  return abuseDetectionService;
}

/**
 * Abuse detection middleware
 */
export async function abuseDetectionMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const user = (request as any).user;
  const userId = user?.id;

  const abuseService = getAbuseDetectionService();
  const check = await abuseService.checkAbuse(request, userId);

  if (check.blocked) {
    if (check.retryAfter) {
      reply.header('Retry-After', check.retryAfter.toString());
    }

    return reply.code(429).send({
      success: false,
      error: {
        code: 'ABUSE_DETECTED',
        message: check.reason || 'Suspicious activity detected',
        retryAfter: check.retryAfter,
      },
    });
  }

  // Attach device fingerprint to request
  (request as any).deviceFingerprint = generateDeviceFingerprint(request);
}

