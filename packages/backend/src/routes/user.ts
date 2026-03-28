/**
 * User Routes
 * Handles user management and profile operations
 */

import { FastifyInstance } from 'fastify';

import { UserExtensionService } from '../services/userExtensionService';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

export function userRoutes(prisma: any, userExtensionService: UserExtensionService) {
  return async function(fastify: FastifyInstance) {
    // Get user profile
    fastify.get('/profile', {
      preHandler: [authMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;

      try {
        const userProfile = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            userTier: true,
            userExtension: true,
            generations: {
              take: 5,
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                prompt: true,
                status: true,
                createdAt: true
              }
            }
          }
        });

        if (!userProfile) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User not found'
            }
          });
        }

        return {
          success: true,
          data: {
            id: userProfile.id,
            email: userProfile.email,
            username: userProfile.username,
            tier: userProfile.tier,
            isAdmin: userProfile.isAdmin,
            alvaeEnabled: userProfile.alvaeEnabled,
            subscriptionStatus: userProfile.userTier?.subscriptionStatus,
            limits: {
              monthly: {
                used: userProfile.userTier?.usedThisMonth || 0,
                limit: userProfile.userTier?.monthlyGenerations || 0
              },
              daily: {
                used: userProfile.userTier?.usedToday || 0,
                limit: userProfile.userTier?.dailyGenerations || 0
              }
            },
            features: userProfile.userTier?.features || [],
            maxDuration: userProfile.userTier?.maxDuration || 60,
            quality: userProfile.userTier?.quality || 'standard',
            extension: userProfile.userExtension ? {
              isActive: userProfile.userExtension.isActive,
              tokenHash: userProfile.userExtension.tokenHash
            } : null,
            recentGenerations: userProfile.generations,
            createdAt: userProfile.createdAt,
            updatedAt: userProfile.updatedAt
          }
        };

      } catch (error) {
        console.error('Get profile error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'PROFILE_FETCH_FAILED',
            message: 'Failed to fetch user profile'
          }
        });
      }
    });

    // Update user profile
    fastify.put('/profile', {
      preHandler: [authMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;
      const { username, email } = request.body as any;

      try {
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            username: username || user.username,
            email: email || user.email
          }
        });

        return {
          success: true,
          data: {
            id: updatedUser.id,
            email: updatedUser.email,
            username: updatedUser.username,
            tier: updatedUser.tier,
            alvaeEnabled: updatedUser.alvaeEnabled
          }
        };

      } catch (error) {
        console.error('Update profile error:', error);
        return reply.code(400).send({
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: 'Failed to update profile'
          }
        });
      }
    });

    // Get user statistics
    fastify.get('/stats', {
      preHandler: [authMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;

      try {
        const stats = await prisma.generation.groupBy({
          by: ['status'],
          where: { userId: user.id },
          _count: { status: true }
        });

        const totalGenerations = await prisma.generation.count({
          where: { userId: user.id }
        });

        const recentGenerations = await prisma.generation.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            prompt: true,
            status: true,
            createdAt: true
          }
        });

        return {
          success: true,
          data: {
            totalGenerations,
            statusCounts: stats.reduce((acc, stat) => {
              acc[stat.status] = stat._count.status;
              return acc;
            }, {} as Record<string, number>),
            recentGenerations
          }
        };

      } catch (error) {
        console.error('Stats error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'STATS_FAILED',
            message: 'Failed to fetch statistics'
          }
        });
      }
    });



    // Admin: Get all users
    fastify.get('/admin/users', {
      preHandler: [adminMiddleware]
    }, async (request, reply) => {
      const { page = 1, limit = 20, search } = request.query as any;

      try {
        const skip = (page - 1) * limit;
        const where: any = {};

        if (search) {
          where.OR = [
            { email: { contains: search } },
            { username: { contains: search } }
          ];
        }

        const [users, total] = await Promise.all([
          prisma.user.findMany({
            where,
            skip,
            take: limit,
            select: {
              id: true,
              email: true,
              username: true,
              tier: true,
              isAdmin: true,
              alvaeEnabled: true,
              createdAt: true,
              userTier: {
                select: {
                  monthlyGenerations: true,
                  usedThisMonth: true,
                  subscriptionStatus: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          }),
          prisma.user.count({ where })
        ]);

        return {
          success: true,
          data: {
            users,
            pagination: {
              page,
              limit,
              total,
              pages: Math.ceil(total / limit)
            }
          }
        };

      } catch (error) {
        console.error('Admin get users error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'ADMIN_USERS_FAILED',
            message: 'Failed to fetch users'
          }
        });
      }
    });

    // Admin: Update user tier
    fastify.put('/admin/users/:userId/tier', {
      preHandler: [adminMiddleware]
    }, async (request, reply) => {
      const { userId } = request.params as any;
      const { tier, monthlyGenerations, dailyGenerations } = request.body as any;

      try {
        const validTiers = ['FREE', 'PRO', 'PREMIUM', 'ENTERPRISE'];
        if (!validTiers.includes(tier)) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'INVALID_TIER',
              message: 'Invalid tier specified'
            }
          });
        }

        await prisma.userTier.upsert({
          where: { userId },
          create: {
            userId,
            tier,
            monthlyGenerations: monthlyGenerations || 0,
            dailyGenerations: dailyGenerations || 0,
            usedThisMonth: 0,
            usedToday: 0
          },
          update: {
            tier,
            monthlyGenerations: monthlyGenerations || 0,
            dailyGenerations: dailyGenerations || 0
          }
        });

        await prisma.user.update({
          where: { id: userId },
          data: { tier }
        });

        return {
          success: true,
          data: {
            message: 'User tier updated successfully'
          }
        };

      } catch (error) {
        console.error('Admin update tier error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'ADMIN_UPDATE_TIER_FAILED',
            message: 'Failed to update user tier'
          }
        });
      }
    });
  };
}
