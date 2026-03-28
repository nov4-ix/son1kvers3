/**
 * NFT Routes
 * Handles NFT marketplace operations
 */

import { FastifyInstance } from 'fastify';

import { authMiddleware, premiumMiddleware } from '../middleware/auth';

export function nftRoutes(fastify: FastifyInstance, prisma: any) {
  return async function() {
    // Create NFT from generation
    fastify.post('/create', {
      preHandler: [authMiddleware, premiumMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;
      const { generationId, title, description, price } = request.body as any;

      try {
        // Check if generation exists and belongs to user
        const generation = await prisma.generation.findFirst({
          where: {
            id: generationId,
            userId: user.id,
            status: 'completed'
          }
        });

        if (!generation) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'GENERATION_NOT_FOUND',
              message: 'Generation not found or not completed'
            }
          });
        }

        // Create NFT
        const nft = await prisma.nft.create({
          data: {
            userId: user.id,
            generationId: generation.id,
            title: title || generation.prompt,
            description: description || '',
            price: price || 0,
            audioUrl: generation.audioUrl,
            metadata: {
              ...generation.metadata,
              originalPrompt: generation.prompt,
              style: generation.style,
              duration: generation.duration,
              quality: generation.quality
            },
            status: 'active'
          }
        });

        return {
          success: true,
          data: nft
        };

      } catch (error) {
        console.error('NFT creation error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'NFT_CREATION_FAILED',
            message: 'Failed to create NFT'
          }
        });
      }
    });

    // Get NFT marketplace
    fastify.get('/marketplace', async (request, reply) => {
      const { page = 1, limit = 20, search, minPrice, maxPrice } = request.query as any;

      try {
        const skip = (page - 1) * limit;
        const where: any = {
          status: 'active'
        };

        if (search) {
          where.OR = [
            { title: { contains: search } },
            { description: { contains: search } }
          ];
        }

        if (minPrice || maxPrice) {
          where.price = {};
          if (minPrice) where.price.gte = parseFloat(minPrice);
          if (maxPrice) where.price.lte = parseFloat(maxPrice);
        }

        const [nfts, total] = await Promise.all([
          prisma.nft.findMany({
            where,
            skip,
            take: limit,
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  tier: true
                }
              },
              generation: {
                select: {
                  prompt: true,
                  style: true,
                  duration: true,
                  quality: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          }),
          prisma.nft.count({ where })
        ]);

        return {
          success: true,
          data: {
            nfts,
            pagination: {
              page,
              limit,
              total,
              pages: Math.ceil(total / limit)
            }
          }
        };

      } catch (error) {
        console.error('Marketplace fetch error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'MARKETPLACE_FETCH_FAILED',
            message: 'Failed to fetch marketplace'
          }
        });
      }
    });

    // Get NFT details
    fastify.get('/:nftId', async (request, reply) => {
      const { nftId } = request.params as any;

      try {
        const nft = await prisma.nft.findUnique({
          where: { id: nftId },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                tier: true
              }
            },
            generation: {
              select: {
                prompt: true,
                style: true,
                duration: true,
                quality: true
              }
            }
          }
        });

        if (!nft) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NFT_NOT_FOUND',
              message: 'NFT not found'
            }
          });
        }

        return {
          success: true,
          data: nft
        };

      } catch (error) {
        console.error('NFT fetch error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'NFT_FETCH_FAILED',
            message: 'Failed to fetch NFT'
          }
        });
      }
    });

    // Purchase NFT
    fastify.post('/:nftId/purchase', {
      preHandler: [authMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;
      const { nftId } = request.params as any;

      try {
        const nft = await prisma.nft.findUnique({
          where: { id: nftId }
        });

        if (!nft) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NFT_NOT_FOUND',
              message: 'NFT not found'
            }
          });
        }

        if (nft.userId === user.id) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'CANNOT_PURCHASE_OWN',
              message: 'Cannot purchase your own NFT'
            }
          });
        }

        if (nft.status !== 'active') {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'NFT_NOT_AVAILABLE',
              message: 'NFT is not available for purchase'
            }
          });
        }

        // Create purchase record
        const purchase = await prisma.nftPurchase.create({
          data: {
            nftId: nft.id,
            buyerId: user.id,
            sellerId: nft.userId,
            price: nft.price,
            status: 'completed'
          }
        });

        // Update NFT status
        await prisma.nft.update({
          where: { id: nftId },
          data: {
            status: 'sold',
            soldAt: new Date(),
            soldTo: user.id
          }
        });

        return {
          success: true,
          data: {
            purchaseId: purchase.id,
            message: 'NFT purchased successfully'
          }
        };

      } catch (error) {
        console.error('NFT purchase error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'NFT_PURCHASE_FAILED',
            message: 'Failed to purchase NFT'
          }
        });
      }
    });

    // Get user's NFTs
    fastify.get('/user/:userId', {
      preHandler: [authMiddleware]
    }, async (request, reply) => {
      const { userId } = request.params as any;
      const { page = 1, limit = 20 } = request.query as any;

      try {
        const skip = (page - 1) * limit;

        const [nfts, total] = await Promise.all([
          prisma.nft.findMany({
            where: { userId },
            skip,
            take: limit,
            include: {
              generation: {
                select: {
                  prompt: true,
                  style: true,
                  duration: true,
                  quality: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          }),
          prisma.nft.count({ where: { userId } })
        ]);

        return {
          success: true,
          data: {
            nfts,
            pagination: {
              page,
              limit,
              total,
              pages: Math.ceil(total / limit)
            }
          }
        };

      } catch (error) {
        console.error('User NFTs fetch error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'USER_NFTS_FETCH_FAILED',
            message: 'Failed to fetch user NFTs'
          }
        });
      }
    });

    // Update NFT
    fastify.put('/:nftId', {
      preHandler: [authMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;
      const { nftId } = request.params as any;
      const { title, description, price } = request.body as any;

      try {
        const nft = await prisma.nft.findFirst({
          where: {
            id: nftId,
            userId: user.id
          }
        });

        if (!nft) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NFT_NOT_FOUND',
              message: 'NFT not found'
            }
          });
        }

        const updatedNft = await prisma.nft.update({
          where: { id: nftId },
          data: {
            title: title || nft.title,
            description: description || nft.description,
            price: price !== undefined ? price : nft.price
          }
        });

        return {
          success: true,
          data: updatedNft
        };

      } catch (error) {
        console.error('NFT update error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'NFT_UPDATE_FAILED',
            message: 'Failed to update NFT'
          }
        });
      }
    });

    // Delete NFT
    fastify.delete('/:nftId', {
      preHandler: [authMiddleware]
    }, async (request, reply) => {
      const user = (request as any).user;
      const { nftId } = request.params as any;

      try {
        const nft = await prisma.nft.findFirst({
          where: {
            id: nftId,
            userId: user.id
          }
        });

        if (!nft) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NFT_NOT_FOUND',
              message: 'NFT not found'
            }
          });
        }

        await prisma.nft.delete({
          where: { id: nftId }
        });

        return {
          success: true,
          data: {
            message: 'NFT deleted successfully'
          }
        };

      } catch (error) {
        console.error('NFT delete error:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'NFT_DELETE_FAILED',
            message: 'Failed to delete NFT'
          }
        });
      }
    });
  };
}
