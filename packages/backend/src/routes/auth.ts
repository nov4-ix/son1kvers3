import { FastifyInstance } from 'fastify'
import { SupabaseAuthService } from '../services/supabaseAuth'
import { supabaseAuthMiddleware, optionalSupabaseAuthMiddleware } from '../middleware/supabaseAuth'

export async function authRoutes(fastify: FastifyInstance) {
  const supabaseAuth = new SupabaseAuthService(fastify.prisma)

  // Get current user profile
  fastify.get('/profile', {
    preHandler: [supabaseAuthMiddleware]
  }, async (request, reply) => {
    const user = (request as any).user

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        tier: user.tier,
        isAdmin: user.isAdmin,
        alvaeEnabled: user.alvaeEnabled,
        subscriptionStatus: user.subscriptionStatus,
        limits: {
          monthly: {
            used: user.usedThisMonth,
            limit: user.monthlyGenerations
          },
          daily: {
            used: user.usedToday,
            limit: user.dailyGenerations
          }
        },
        features: user.features,
        maxDuration: user.maxDuration,
        quality: user.quality
      }
    }
  })

  // Update user profile
  fastify.put('/profile', {
    preHandler: [supabaseAuthMiddleware]
  }, async (request, reply) => {
    const user = (request as any).user
    const { username, alvaeEnabled } = request.body as any

    try {
      const updatedUser = await fastify.prisma.user.update({
        where: { id: user.id },
        data: {
          username: username || user.username,
          alvaeEnabled: alvaeEnabled !== undefined ? alvaeEnabled : user.alvaeEnabled
        }
      })

      return {
        success: true,
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          tier: updatedUser.tier,
          alvaeEnabled: updatedUser.alvaeEnabled
        }
      }
    } catch (error) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: 'Failed to update profile'
        }
      })
    }
  })

  // Get user tier information
  fastify.get('/tier', {
    preHandler: [supabaseAuthMiddleware]
  }, async (request, reply) => {
    const user = (request as any).user

    return {
      success: true,
      data: {
        tier: user.tier,
        monthlyGenerations: user.monthlyGenerations,
        usedThisMonth: user.usedThisMonth,
        dailyGenerations: user.dailyGenerations,
        usedToday: user.usedToday,
        maxDuration: user.maxDuration,
        quality: user.quality,
        features: user.features,
        subscriptionStatus: user.subscriptionStatus
      }
    }
  })

  // Check generation limits
  fastify.get('/limits', {
    preHandler: [supabaseAuthMiddleware]
  }, async (request, reply) => {
    const user = (request as any).user

    const limitCheck = await supabaseAuth.checkGenerationLimit(user.id)

    return {
      success: true,
      data: {
        allowed: limitCheck.allowed,
        reason: limitCheck.reason,
        limits: limitCheck.limits
      }
    }
  })

  // Webhook for Supabase auth events
  fastify.post('/webhook', {
    preHandler: [optionalSupabaseAuthMiddleware]
  }, async (request, reply) => {
    const { type, record } = request.body as any

    try {
      switch (type) {
        case 'INSERT':
          // New user created in Supabase
          if (record.email) {
            await supabaseAuth.createUserFromSupabase({
              id: record.id,
              email: record.email,
              user_metadata: record.user_metadata || {}
            })
          }
          break

        case 'UPDATE':
          // User updated in Supabase
          if (record.email) {
            await fastify.prisma.user.update({
              where: { id: record.id },
              data: {
                email: record.email,
                username: record.user_metadata?.username || undefined
              }
            })
          }
          break

        case 'DELETE':
          // User deleted in Supabase
          await fastify.prisma.user.delete({
            where: { id: record.id }
          })
          break
      }

      return { success: true }
    } catch (error) {
      console.error('Webhook error:', error)
      return reply.code(400).send({
        success: false,
        error: {
          code: 'WEBHOOK_FAILED',
          message: 'Webhook processing failed'
        }
      })
    }
  })

  // Activate account with extension
  fastify.post('/activate', {
    preHandler: [supabaseAuthMiddleware]
  }, async (request, reply) => {
    const user = (request as any).user
    const { tokenHash } = request.body as any

    try {
      // Check if token exists and is valid
      const token = await fastify.prisma.token.findUnique({
        where: { hash: tokenHash }
      })

      if (!token || !token.isValid) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired token'
          }
        })
      }

      // Create or update user extension
      await fastify.prisma.userExtension.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          tokenHash: tokenHash,
          isActive: true
        },
        update: {
          tokenHash: tokenHash,
          isActive: true
        }
      })

      // Update user to enable alvae
      await fastify.prisma.user.update({
        where: { id: user.id },
        data: { alvaeEnabled: true }
      })

      return {
        success: true,
        data: {
          message: 'Account activated successfully',
          alvaeEnabled: true
        }
      }
    } catch (error) {
      console.error('Activation error:', error)
      return reply.code(400).send({
        success: false,
        error: {
          code: 'ACTIVATION_FAILED',
          message: 'Account activation failed'
        }
      })
    }
  })

  // Deactivate account
  fastify.post('/deactivate', {
    preHandler: [supabaseAuthMiddleware]
  }, async (request, reply) => {
    const user = (request as any).user

    try {
      // Update user extension
      await fastify.prisma.userExtension.update({
        where: { userId: user.id },
        data: { isActive: false }
      })

      // Update user to disable alvae
      await fastify.prisma.user.update({
        where: { id: user.id },
        data: { alvaeEnabled: false }
      })

      return {
        success: true,
        data: {
          message: 'Account deactivated successfully',
          alvaeEnabled: false
        }
      }
    } catch (error) {
      console.error('Deactivation error:', error)
      return reply.code(400).send({
        success: false,
        error: {
          code: 'DEACTIVATION_FAILED',
          message: 'Account deactivation failed'
        }
      })
    }
  })

  // Get user statistics
  fastify.get('/stats', {
    preHandler: [supabaseAuthMiddleware]
  }, async (request, reply) => {
    const user = (request as any).user

    try {
      const stats = await fastify.prisma.generation.groupBy({
        by: ['status'],
        where: { userId: user.id },
        _count: { status: true }
      })

      const totalGenerations = await fastify.prisma.generation.count({
        where: { userId: user.id }
      })

      const recentGenerations = await fastify.prisma.generation.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          prompt: true,
          status: true,
          createdAt: true
        }
      })

      return {
        success: true,
        data: {
          totalGenerations,
          statusCounts: stats.reduce((acc, stat) => {
            acc[stat.status] = stat._count.status
            return acc
          }, {} as Record<string, number>),
          recentGenerations
        }
      }
    } catch (error) {
      console.error('Stats error:', error)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'STATS_FAILED',
          message: 'Failed to fetch statistics'
        }
      })
    }
  })
}
