/**
 * User Extension Service
 * Handles browser extension integration
 */

import { PrismaClient } from '@prisma/client';


export interface ExtensionUsage {
  userId: string;
  action: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

export class UserExtensionService {
  constructor(
    private prisma: PrismaClient
  ) {}

  /**
   * Track extension usage
   */
  async trackUsage(usage: ExtensionUsage): Promise<void> {
    try {
      await this.prisma.extensionUsage.create({
        data: {
          userId: usage.userId,
          action: usage.action,
          metadata: JSON.stringify(usage.metadata), // Convert to JSON string
          timestamp: usage.timestamp
        }
      });
    } catch (error) {
      console.error('Failed to track extension usage:', error);
    }
  }

  /**
   * Get user extension analytics
   */
  async getUserAnalytics(userId: string, period: string = '30d') {
    try {
      const startDate = this.getStartDate(period);

      const usage = await this.prisma.extensionUsage.findMany({
        where: {
          userId,
          timestamp: { gte: startDate }
        },
        orderBy: { timestamp: 'desc' }
      });

      const actionCounts = usage.reduce((acc, u) => {
        acc[u.action] = (acc[u.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        period,
        totalUsage: usage.length,
        actionCounts,
        recentUsage: usage.slice(0, 20)
      };

    } catch (error) {
      console.error('Failed to get user extension analytics:', error);
      throw error;
    }
  }

  /**
   * Get extension status for user
   */
  async getExtensionStatus(userId: string) {
    try {
      const extension = await this.prisma.userExtension.findUnique({
        where: { userId }
      });

      return {
        isActive: extension?.isActive || false,
        tokenHash: extension?.tokenHash || null,
        activatedAt: extension?.activatedAt || null,
        lastUsed: extension?.lastUsed || null
      };

    } catch (error) {
      console.error('Failed to get extension status:', error);
      return {
        isActive: false,
        tokenHash: null,
        activatedAt: null,
        lastUsed: null
      };
    }
  }

  /**
   * Activate extension for user
   */
  async activateExtension(userId: string, tokenHash: string): Promise<boolean> {
    try {
      // Check if token exists and is valid
      const token = await this.prisma.token.findUnique({
        where: { hash: tokenHash }
      });

      if (!token || !token.isValid) {
        return false;
      }

      // Create or update user extension
      await this.prisma.userExtension.upsert({
        where: { userId },
        create: {
          userId,
          tokenHash,
          isActive: true,
          activatedAt: new Date(),
          lastUsed: new Date()
        },
        update: {
          tokenHash,
          isActive: true,
          activatedAt: new Date(),
          lastUsed: new Date()
        }
      });

      // Update user to enable alvae
      await this.prisma.user.update({
        where: { id: userId },
        data: { alvaeEnabled: true }
      });

      return true;

    } catch (error) {
      console.error('Failed to activate extension:', error);
      return false;
    }
  }

  /**
   * Deactivate extension for user
   */
  async deactivateExtension(userId: string): Promise<boolean> {
    try {
      // Update user extension
      await this.prisma.userExtension.update({
        where: { userId },
        data: { 
          isActive: false,
          deactivatedAt: new Date()
        }
      });

      // Update user to disable alvae
      await this.prisma.user.update({
        where: { id: userId },
        data: { alvaeEnabled: false }
      });

      return true;

    } catch (error) {
      console.error('Failed to deactivate extension:', error);
      return false;
    }
  }

  /**
   * Update extension last used timestamp
   */
  async updateLastUsed(userId: string): Promise<void> {
    try {
      await this.prisma.userExtension.update({
        where: { userId },
        data: { lastUsed: new Date() }
      });
    } catch (error) {
      console.error('Failed to update last used:', error);
    }
  }

  /**
   * Get extension configuration
   */
  getExtensionConfig() {
    return {
      version: '2.0.0',
      apiUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      features: {
        tokenCapture: true,
        autoActivation: true,
        analytics: true,
        notifications: true
      },
      limits: {
        maxTokensPerUser: 10,
        tokenExpirationDays: 30
      }
    };
  }

  /**
   * Validate extension token
   */
  async validateExtensionToken(tokenHash: string) {
    try {
      const token = await this.prisma.token.findUnique({
        where: { hash: tokenHash },
        select: {
          id: true,
          isValid: true,
          isActive: true,
          expiresAt: true,
          tier: true
        }
      });

      if (!token) {
        return {
          isValid: false,
          error: 'Token not found'
        };
      }

      const isValid = token.isValid && token.isActive && 
        (!token.expiresAt || token.expiresAt > new Date());

      return {
        isValid,
        tier: token.tier,
        expiresAt: token.expiresAt
      };

    } catch (error) {
      console.error('Failed to validate extension token:', error);
      return {
        isValid: false,
        error: 'Validation failed'
      };
    }
  }

  /**
   * Get start date based on period
   */
  private getStartDate(period: string): Date {
    const now = new Date();
    
    switch (period) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Close service and cleanup
   */
  async close() {
    await this.prisma.$disconnect();
  }
}
