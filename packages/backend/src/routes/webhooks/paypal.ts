import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PayPalService } from '../../services/paypal.service';
import { AnalyticsService } from '../../services/analyticsService';

export async function paypalWebhookRoutes(fastify: FastifyInstance, options: { analyticsService: AnalyticsService }) {
  const paypalService = new PayPalService(fastify.prisma);
  const { analyticsService } = options;

  fastify.post('/webhook', async (request: FastifyRequest, reply: FastifyReply) => {
    const event = request.body as any;
    const eventType = event.event_type;

    fastify.log.info({ eventType }, 'Received PayPal webhook');

    try {
      switch (eventType) {
        case 'BILLING.SUBSCRIPTION.ACTIVATED':
        case 'BILLING.SUBSCRIPTION.CREATED': {
          const subscriptionId = event.resource.id;
          const planId = event.resource.plan_id;
          const userId = event.resource.custom_id;

          if (userId) {
            // Mapping planId to our Internal Plans
            let planName: 'BASIC' | 'PRO' | 'ENTERPRISE' = 'BASIC';
            let generationsLimit = 100;

            // Example mapping (adjust according to your PayPal Plans)
            // Using includes to match plan IDs like 'P-BASIC-XXX'
            const lowerPlanId = planId.toLowerCase();
            if (lowerPlanId.includes('pro')) {
              planName = 'PRO';
              generationsLimit = 500;
            } else if (lowerPlanId.includes('enterprise') || lowerPlanId.includes('premium')) {
              planName = 'ENTERPRISE';
              generationsLimit = 10000; // Unlimited placeholder
            } else if (lowerPlanId.includes('basic')) {
              planName = 'BASIC';
              generationsLimit = 100;
            }

            await fastify.prisma.subscription.upsert({
              where: { paypalSubscriptionId: subscriptionId },
              update: {
                status: 'ACTIVE',
                plan: planName,
                generationsLimit
              },
              create: {
                userId,
                paypalSubscriptionId: subscriptionId,
                paypalPlanId: planId,
                paymentProvider: 'PAYPAL',
                plan: planName,
                status: 'ACTIVE',
                generationsLimit
              }
            });

            // Update UserTier too for compatibility with existing system
            await fastify.prisma.userTier.upsert({
              where: { userId },
              update: {
                tier: planName,
                subscriptionStatus: 'ACTIVE',
                monthlyGenerations: generationsLimit
              },
              create: {
                userId,
                tier: planName,
                subscriptionStatus: 'ACTIVE',
                monthlyGenerations: generationsLimit
              }
            });

            // Also update the User model directly if it has a tier field
            await fastify.prisma.user.update({
              where: { id: userId },
              data: {
                tier: planName,
                subscriptionStatus: 'ACTIVE'
              }
            });

            // Track analytics
            if (analyticsService) {
              await analyticsService.trackSubscriptionChange(userId, planName, 'PAYPAL');
            }

            fastify.log.info(`User ${userId} subscription ${subscriptionId} activated with plan ${planName}`);
          } else {
            fastify.log.warn(`Received PayPal webhook for subscription ${event.resource.id} but no custom_id (userId) was found`);
          }
          break;
        }

        case 'BILLING.SUBSCRIPTION.CANCELLED':
        case 'BILLING.SUBSCRIPTION.EXPIRED':
        case 'BILLING.SUBSCRIPTION.SUSPENDED': {
          const subscriptionId = event.resource.id;

          const sub = await fastify.prisma.subscription.update({
            where: { paypalSubscriptionId: subscriptionId },
            data: { status: 'CANCELED' }
          });

          if (sub) {
            await fastify.prisma.userTier.update({
              where: { userId: sub.userId },
              data: {
                tier: 'FREE',
                subscriptionStatus: 'CANCELED',
                monthlyGenerations: 5
              }
            });

            await fastify.prisma.user.update({
              where: { id: sub.userId },
              data: {
                tier: 'FREE',
                subscriptionStatus: 'CANCELED'
              }
            });

            // Track analytics
            if (analyticsService) {
              await analyticsService.trackSubscriptionChange(sub.userId, 'FREE', 'PAYPAL');
            }
          }

          fastify.log.info(`Subscription ${subscriptionId} deactivated`);
          break;
        }

        default:
          fastify.log.info(`Unhandled PayPal event type: ${eventType}`);
      }

      return reply.send({ received: true });
    } catch (error) {
      fastify.log.error(error, 'Error processing PayPal webhook');
      return reply.code(500).send({ error: 'Webhook processing failed' });
    }
  });
}

