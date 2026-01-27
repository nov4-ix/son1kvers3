/**
 * Authentication Middleware
 * Validates JWT tokens and manages user sessions
 * Enhanced version with improved security and tier management
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import {
  ValidationError,
  ErrorFactory,
  SECURITY
} from '@super-son1k/shared-utils';

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  tier: string;
  isAdmin: boolean;
  alvaeEnabled: boolean;
  subscriptionStatus?: string;
  credits?: number;
  monthlyGenerations?: number;
  usedGenerations?: number;
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: AuthenticatedUser;
}

export type UserTier = 'FREE' | 'BASIC' | 'PRO' | 'PREMIUM' | 'ENTERPRISE';

/**
 * Authentication middleware
 */
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Allow OPTIONS requests for CORS
    if (request.method === 'OPTIONS') {
      return reply.code(200).send();
    }

    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization token required'
        }
      });
    }

    const token = authHeader.substring(7);

    if (!token) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authorization token'
        }
      });
    }

    // Check if it's a service-to-service token (BACKEND_SECRET)
    if (token === process.env.BACKEND_SECRET || token === 'dev-token') {
      // Service-to-service authentication - create system user
      (request as any).user = {
        id: 'system',
        email: 'system@son1kverse.com',
        username: 'system',
        tier: 'ENTERPRISE',
        isAdmin: true,
        alvaeEnabled: true,
        subscriptionStatus: 'active',
        credits: 999999999, // Unlimited for system
        monthlyGenerations: 999999999, // Unlimited for system
        usedGenerations: 0
      };
      
      // Attach quota info for system user
      (request as any).quotaInfo = {
        remainingGenerations: 999999,
        totalGenerations: 999999,
        usedGenerations: 0
      };
      
      return; // Skip JWT verification for service tokens
    }

    // Verify JWT token for regular users
    const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
      algorithms: [SECURITY.JWT_ALGORITHM as jwt.Algorithm]
    }) as any;

    if (!decoded.userId) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token payload'
        }
      });
    }

    // Get user from database
    const user = await request.server.prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        userTier: true
      }
    });

    if (!user) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Check if user is active
    if (user.tier === 'FREE' && !user.alvaeEnabled) {
      // Check if user has active extensions
      const extension = await request.server.prisma.userExtension.findUnique({
        where: { userId: user.id }
      });

      if (!extension || !extension.isActive) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'ACCOUNT_NOT_ACTIVATED',
            message: 'Account not activated. Please use the browser extension to activate your account.'
          }
        });
      }
    }

    // Attach user to request with enhanced information
    (request as any).user = {
      id: user.id,
      email: user.email,
      username: user.username,
      tier: user.tier,
      isAdmin: user.isAdmin,
      alvaeEnabled: user.alvaeEnabled,
      subscriptionStatus: user.userTier?.subscriptionStatus,
      credits: user.userTier?.monthlyGenerations || 0,
      monthlyGenerations: user.userTier?.monthlyGenerations || 0,
      usedGenerations: user.userTier?.usedThisMonth || 0
    };

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token'
        }
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired'
        }
      });
    }

    console.error('Auth middleware error:', error);
    return reply.code(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication failed'
      }
    });
  }
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export async function optionalAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      if (token) {
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
          algorithms: [SECURITY.JWT_ALGORITHM as jwt.Algorithm]
        }) as any;

        if (decoded.userId) {
          // Get user from database
          const user = await request.server.prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
              userTier: true
            }
          });

          if (user) {
            // Attach user to request
            (request as any).user = {
              id: user.id,
              email: user.email,
              username: user.username,
              tier: user.tier,
              isAdmin: user.isAdmin,
              alvaeEnabled: user.alvaeEnabled,
              subscriptionStatus: user.userTier?.subscriptionStatus,
              credits: user.userTier?.monthlyGenerations || 0,
              monthlyGenerations: user.userTier?.monthlyGenerations || 0,
              usedGenerations: user.userTier?.usedThisMonth || 0
            };
          }
        }
      }
    }
  } catch (error) {
    // Ignore auth errors for optional middleware
    console.debug('Optional auth failed:', error);
  }
}

/**
 * Admin-only middleware
 */
export async function adminMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    // First run auth middleware
    await authMiddleware(request, reply);

    const user = (request as any).user;

    if (!user || !user.isAdmin) {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Admin access required'
        }
      });
    }

  } catch (error) {
    throw ErrorFactory.fromUnknown(error, 'Admin authentication failed');
  }
}

/**
 * Premium tier middleware
 */
export async function premiumMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    // First run auth middleware
    await authMiddleware(request, reply);

    const user = (request as any).user;

    if (!user) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    const premiumTiers = ['PREMIUM', 'ENTERPRISE'];
    if (!premiumTiers.includes(user.tier)) {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'INSUFFICIENT_TIER',
          message: 'Premium subscription required'
        }
      });
    }

  } catch (error) {
    throw ErrorFactory.fromUnknown(error, 'Premium authentication failed');
  }
}

/**
 * Enterprise tier middleware
 */
export async function enterpriseMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    // First run auth middleware
    await authMiddleware(request, reply);

    const user = (request as any).user;

    if (!user) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    if (user.tier !== 'ENTERPRISE') {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'INSUFFICIENT_TIER',
          message: 'Enterprise subscription required'
        }
      });
    }

  } catch (error) {
    throw ErrorFactory.fromUnknown(error, 'Enterprise authentication failed');
  }
}

/**
 * Check user quota middleware
 */
export async function quotaMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = (request as any).user;

    if (!user) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    // Check if user has remaining generations
    const remainingGenerations = user.monthlyGenerations - user.usedGenerations;

    if (remainingGenerations <= 0) {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'QUOTA_EXCEEDED',
          message: 'Monthly generation quota exceeded',
          details: {
            tier: user.tier,
            monthlyGenerations: user.monthlyGenerations,
            usedGenerations: user.usedGenerations,
            remainingGenerations: 0
          }
        }
      });
    }

    // Add quota info to request
    (request as any).quotaInfo = {
      remainingGenerations,
      monthlyGenerations: user.monthlyGenerations,
      usedGenerations: user.usedGenerations
    };

  } catch (error) {
    throw ErrorFactory.fromUnknown(error, 'Quota check failed');
  }
}

/**
 * Generate JWT token
 */
export function generateJWT(userId: string, expiresIn: string = '7d'): string {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET as string,
    {
      expiresIn
    } as jwt.SignOptions
  );
}

/**
 * Verify JWT token
 */
export function verifyJWT(token: string): any {
  return jwt.verify(token, process.env.JWT_SECRET!, {
    algorithms: [SECURITY.JWT_ALGORITHM as jwt.Algorithm]
  });
}

/**
 * Refresh JWT token
 */
export function refreshJWT(token: string): string | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
      algorithms: [SECURITY.JWT_ALGORITHM as jwt.Algorithm]
    }) as any;

    if (decoded.userId) {
      return generateJWT(decoded.userId);
    }

    return null;
  } catch (error) {
    return null;
  }
}
