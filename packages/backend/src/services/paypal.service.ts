import { paypalClient } from '../config/paypal.config';
import paypal from '@paypal/checkout-server-sdk';
import { PrismaClient } from '@prisma/client';

export class PayPalService {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    // Crear suscripción
    async createSubscription(userId: string, planId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user) throw new Error('User not found');

        const request = new paypal.subscriptions.SubscriptionsCreateRequest();
        request.requestBody({
            plan_id: planId,
            subscriber: {
                name: {
                    given_name: (user as any).firstName || user.username || 'User',
                    surname: (user as any).lastName || '.',
                },
                email_address: user.email,
            },
            application_context: {
                brand_name: 'Son1kvers3',
                locale: 'es-MX', // o 'en-US'
                shipping_preference: 'NO_SHIPPING',
                user_action: 'SUBSCRIBE_NOW',
                payment_method: {
                    payer_selected: 'PAYPAL',
                    payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
                },
                return_url: `${process.env.FRONTEND_URL}/dashboard?paypal_success=true`,
                cancel_url: `${process.env.FRONTEND_URL}/pricing?paypal_canceled=true`,
            },
            custom_id: userId, // Para identificar al usuario en webhooks
        });

        const response = await paypalClient.execute(request);

        // Guardar referencia temporal en DB o esperar al webhook
        // Aquí solo retornamos la URL, la persistencia real se hace usualmente en el webhook o en el onApprove del frontend
        // Pero podemos guardar un estado pendiente si queremos

        // Retornar URL de aprobación
        const approvalUrl = response.result.links.find(
            (link: any) => link.rel === 'approve'
        )?.href;

        return {
            subscriptionId: response.result.id,
            approvalUrl,
        };
    }

    // Obtener detalles de suscripción
    async getSubscription(subscriptionId: string) {
        const request = new paypal.subscriptions.SubscriptionsGetRequest(subscriptionId);
        const response = await paypalClient.execute(request);
        return response.result;
    }

    // Cancelar suscripción
    async cancelSubscription(subscriptionId: string, reason: string) {
        const request = new paypal.subscriptions.SubscriptionsCancelRequest(subscriptionId);
        request.requestBody({
            reason,
        });

        await paypalClient.execute(request);

        // Actualizar en DB
        await this.prisma.subscription.updateMany({
            where: { paypalSubscriptionId: subscriptionId },
            data: {
                status: 'CANCELED'
            },
        });
    }

    // Verificar si puede generar música (Helper)
    async canGenerate(userId: string): Promise<boolean> {
        const subscription = await this.prisma.subscription.findFirst({
            where: { userId },
        });

        if (!subscription || subscription.status !== 'ACTIVE') {
            // Check free tier logic here if needed, or rely on UserTier logic elsewhere
            return false;
        }

        return subscription.generationsUsed < subscription.generationsLimit;
    }

    // Incrementar contador
    async incrementGenerations(userId: string) {
        const sub = await this.prisma.subscription.findFirst({
            where: { userId }
        });
        if (sub) {
            await this.prisma.subscription.update({
                where: { id: sub.id },
                data: {
                    generationsUsed: { increment: 1 },
                },
            });
        }
    }
}
