/**
 * Extension Routes
 * Handles browser extension integration
 */

import { FastifyInstance } from 'fastify';
import { UserExtensionService } from '../services/userExtensionService';
import { authMiddleware } from '../middleware/auth';

export function extensionRoutes(userExtensionService: UserExtensionService) {
  return async function(fastify: FastifyInstance) {
    // Get extension status
    fastify.get('/status', {
      preHandler: [authMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;

      try {
        const extension = await fastify.prisma.userExtension.findUnique({
          where: { userId: user.id }
        });

        return {
          success: true,
          data: {
            isActive: extension?.isActive || false,
            tokenHash: extension?.tokenHash || null,
            activatedAt: extension?.activatedAt || null,
            lastUsed: extension?.lastUsed || null
          }
        };

      } catch (error) {
        console.error('Extension status error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'EXTENSION_STATUS_FAILED',
            message: 'Failed to fetch extension status'
          }
        });
      }
    });

    // Activate extension with token
    fastify.post('/activate', {
      preHandler: [authMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;
      const { tokenHash } = request.body as any;

      try {
        if (!tokenHash) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'TOKEN_HASH_REQUIRED',
              message: 'Token hash is required'
            }
          });
        }

        // Check if token exists and is valid
        const token = await fastify.prisma.token.findUnique({
          where: { hash: tokenHash }
        });

        if (!token || !token.isValid) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'INVALID_TOKEN',
              message: 'Invalid or expired token'
            }
          });
        }

        // Create or update user extension
        const extension = await fastify.prisma.userExtension.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            tokenHash: tokenHash,
            isActive: true,
            activatedAt: new Date(),
            lastUsed: new Date()
          },
          update: {
            tokenHash: tokenHash,
            isActive: true,
            activatedAt: new Date(),
            lastUsed: new Date()
          }
        });

        // Update user to enable alvae
        await fastify.prisma.user.update({
          where: { id: user.id },
          data: { alvaeEnabled: true }
        });

        return {
          success: true,
          data: {
            message: 'Extension activated successfully',
            alvaeEnabled: true,
            extension
          }
        };

      } catch (error) {
        console.error('Extension activation error:', error);
        return reply.code(400).send({
          success: false,
          error: {
            code: 'ACTIVATION_FAILED',
            message: 'Extension activation failed'
          }
        });
      }
    });

    // Deactivate extension
    fastify.post('/deactivate', {
      preHandler: [authMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;

      try {
        // Update user extension
        await fastify.prisma.userExtension.update({
          where: { userId: user.id },
          data: { 
            isActive: false,
            deactivatedAt: new Date()
          }
        });

        // Update user to disable alvae
        await fastify.prisma.user.update({
          where: { id: user.id },
          data: { alvaeEnabled: false }
        });

        return {
          success: true,
          data: {
            message: 'Extension deactivated successfully',
            alvaeEnabled: false
          }
        };

      } catch (error) {
        console.error('Extension deactivation error:', error);
        return reply.code(400).send({
          success: false,
          error: {
            code: 'DEACTIVATION_FAILED',
            message: 'Extension deactivation failed'
          }
        });
      }
    });

    // Update extension usage
    fastify.post('/usage', {
      preHandler: [authMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;
      const { action, metadata } = request.body as any;

      try {
        // Update last used timestamp
        await fastify.prisma.userExtension.update({
          where: { userId: user.id },
          data: { lastUsed: new Date() }
        });

        // Track usage analytics
        await userExtensionService.trackUsage({
          userId: user.id,
          action: action || 'unknown',
          metadata: metadata || {},
          timestamp: new Date()
        });

        return {
          success: true,
          data: {
            message: 'Usage tracked successfully'
          }
        };

      } catch (error) {
        console.error('Extension usage tracking error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'USAGE_TRACKING_FAILED',
            message: 'Failed to track extension usage'
          }
        });
      }
    });

    // Get extension analytics
    fastify.get('/analytics', {
      preHandler: [authMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;
      const { period = '30d' } = request.query as any;

      try {
        const analytics = await userExtensionService.getUserAnalytics(user.id, period);

        return {
          success: true,
          data: analytics
        };

      } catch (error) {
        console.error('Extension analytics error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'ANALYTICS_FAILED',
            message: 'Failed to fetch extension analytics'
          }
        });
      }
    });

    // Get extension configuration
    fastify.get('/config', async (request, reply) => {
      try {
        const config = {
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

        return {
          success: true,
          data: config
        };

      } catch (error) {
        console.error('Extension config error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'CONFIG_FAILED',
            message: 'Failed to fetch extension configuration'
          }
        });
      }
    });

    // Validate extension token
    fastify.post('/validate-token', async (request, reply) => {
      const { tokenHash } = request.body as any;

      try {
        if (!tokenHash) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'TOKEN_HASH_REQUIRED',
              message: 'Token hash is required'
            }
          });
        }

        const token = await fastify.prisma.token.findUnique({
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
          return reply.code(404).send({
            success: false,
            error: {
              code: 'TOKEN_NOT_FOUND',
              message: 'Token not found'
            }
          });
        }

        const isValid = token.isValid && token.isActive && 
          (!token.expiresAt || token.expiresAt > new Date());

        return {
          success: true,
          data: {
            isValid,
            tier: token.tier,
            expiresAt: token.expiresAt,
            message: isValid ? 'Token is valid' : 'Token is invalid or expired'
          }
        };

      } catch (error) {
        console.error('Token validation error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'TOKEN_VALIDATION_FAILED',
            message: 'Failed to validate token'
          }
        });
      }
    });
  };
}
