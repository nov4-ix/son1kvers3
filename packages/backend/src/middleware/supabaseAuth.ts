/**
 * Supabase Authentication Middleware
 * Integrates Supabase auth with our backend system
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { SupabaseAuthService } from '../services/supabaseAuth'

export interface SupabaseAuthenticatedUser {
  id: string
  email: string
  username: string
  tier: string
  isAdmin: boolean
  alvaeEnabled: boolean
  subscriptionStatus?: string
  monthlyGenerations: number
  usedThisMonth: number
  dailyGenerations: number
  usedToday: number
  maxDuration: number
  quality: string
  features: string[]
}

export interface SupabaseAuthenticatedRequest extends FastifyRequest {
  user: SupabaseAuthenticatedUser
}

/**
 * Supabase authentication middleware
 */
export async function supabaseAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization token required'
        }
      })
    }

    const token = authHeader.substring(7)

    if (!token) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authorization token'
        }
      })
    }

    // Get Supabase auth service
    const supabaseAuth = new SupabaseAuthService(request.server.prisma)

    // Validate token with Supabase
    const supabaseUser = await supabaseAuth.validateSupabaseToken(token)

    if (!supabaseUser) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token'
        }
      })
    }

    // Get or create user in our database
    let user = await supabaseAuth.getUserWithTier(supabaseUser.id)

    if (!user || !user.userTier) {
      // Create user from Supabase data (this will ensure userTier exists)
      user = await supabaseAuth.createUserFromSupabase(supabaseUser)
    }

    if (!user || !user.userTier) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'USER_SETUP_FAILED',
          message: 'Failed to setup user account'
        }
      })
    }

    // Check if user is active
    if (user.tier === 'FREE' && !user.alvaeEnabled) {
      // Check if user has active extensions
      const extension = await request.server.prisma.userExtension.findUnique({
        where: { userId: user.id }
      })

      if (!extension || !extension.isActive) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'ACCOUNT_NOT_ACTIVATED',
            message: 'Account not activated. Please use the browser extension to activate your account.'
          }
        })
      }
    }

    // Parse features from comma-separated string
    const features = user.userTier.features 
      ? user.userTier.features.split(',').filter(f => f.trim().length > 0)
      : []

    // Attach user to request with enhanced information
    ;(request as any).user = {
      id: user.id,
      email: user.email,
      username: user.username,
      tier: user.tier,
      isAdmin: user.isAdmin,
      alvaeEnabled: user.alvaeEnabled,
      subscriptionStatus: user.userTier.subscriptionStatus,
      monthlyGenerations: user.userTier.monthlyGenerations || 0,
      usedThisMonth: user.userTier.usedThisMonth || 0,
      dailyGenerations: user.userTier.dailyGenerations || 0,
      usedToday: user.userTier.usedToday || 0,
      maxDuration: user.userTier.maxDuration || 60,
      quality: user.userTier.quality || 'standard',
      features
    }

  } catch (error) {
    console.error('Supabase auth middleware error:', error)
    return reply.code(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication failed'
      }
    })
  }
}

/**
 * Optional Supabase authentication middleware
 */
export async function optionalSupabaseAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)

      if (token) {
        const supabaseAuth = new SupabaseAuthService(request.server.prisma)
        const supabaseUser = await supabaseAuth.validateSupabaseToken(token)

        if (supabaseUser) {
          let user = await supabaseAuth.getUserWithTier(supabaseUser.id)

          if (!user || !user.userTier) {
            // Create user from Supabase data (this will ensure userTier exists)
            user = await supabaseAuth.createUserFromSupabase(supabaseUser)
          }

          if (user && user.userTier) {
            // Parse features from comma-separated string
            const features = user.userTier.features 
              ? user.userTier.features.split(',').filter(f => f.trim().length > 0)
              : []

            ;(request as any).user = {
              id: user.id,
              email: user.email,
              username: user.username,
              tier: user.tier,
              isAdmin: user.isAdmin,
              alvaeEnabled: user.alvaeEnabled,
              subscriptionStatus: user.userTier.subscriptionStatus,
              monthlyGenerations: user.userTier.monthlyGenerations,
              usedThisMonth: user.userTier.usedThisMonth,
              dailyGenerations: user.userTier.dailyGenerations,
              usedToday: user.userTier.usedToday,
              maxDuration: user.userTier.maxDuration,
              quality: user.userTier.quality,
              features
            }
          }
        }
      }
    }
  } catch (error) {
    // Ignore auth errors for optional middleware
    console.debug('Optional Supabase auth failed:', error)
  }
}

/**
 * Check generation limits middleware
 */
export async function generationLimitMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = (request as any).user

    if (!user) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      })
    }

    const supabaseAuth = new SupabaseAuthService(request.server.prisma)
    const limitCheck = await supabaseAuth.checkGenerationLimit(user.id)

    if (!limitCheck.allowed) {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'QUOTA_EXCEEDED',
          message: limitCheck.reason,
          details: limitCheck.limits
        }
      })
    }

    // Add limit info to request
    ;(request as any).limitInfo = limitCheck.limits

  } catch (error) {
    console.error('Generation limit check failed:', error)
    return reply.code(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Limit check failed'
      }
    })
  }
}

/**
 * Premium tier middleware for Supabase
 */
export async function supabasePremiumMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    await supabaseAuthMiddleware(request, reply)

    const user = (request as any).user

    if (!user) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      })
    }

    const premiumTiers = ['PRO', 'PREMIUM', 'ENTERPRISE']
    if (!premiumTiers.includes(user.tier)) {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'INSUFFICIENT_TIER',
          message: 'Premium subscription required'
        }
      })
    }

  } catch (error) {
    console.error('Supabase premium middleware error:', error)
    return reply.code(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Premium authentication failed'
      }
    })
  }
}

/**
 * Enterprise tier middleware for Supabase
 */
export async function supabaseEnterpriseMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    await supabaseAuthMiddleware(request, reply)

    const user = (request as any).user

    if (!user) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      })
    }

    if (user.tier !== 'ENTERPRISE') {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'INSUFFICIENT_TIER',
          message: 'Enterprise subscription required'
        }
      })
    }

  } catch (error) {
    console.error('Supabase enterprise middleware error:', error)
    return reply.code(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Enterprise authentication failed'
      }
    })
  }
}
