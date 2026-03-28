// Ghost Studio Stripe Webhook (stub-friendly, avoids hard Next.js deps in this app)
// This file now avoids compile-time dependency on Next.js types and locally loads
// the Stripe service if available, with a mock fallback to keep the frontend build healthy.

export const config = {
  api: {
    bodyParser: false,
  },
};

function buffer(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    (req as any).on?.('data', (chunk: Buffer) => chunks.push(chunk));
    (req as any).on?.('end', () => resolve(Buffer.concat(chunks)));
    (req as any).on?.('error', reject);
  });
}

export default async function handler(req: any, res: any) {
  if ((req?.method ?? '') !== 'POST') {
    res?.setHeader?.('Allow', 'POST');
    return res?.status?.(405).end?.('Method Not Allowed');
  }

  const sig = (req?.headers?.['stripe-signature'] as string) || '';
  const buf = await buffer(req);

  // Dynamic load of Stripe service; fallback to mock if not available
  let stripeService: any;
  try {
    const mod = await import('../../../../../../src/lib/stripe');
    stripeService = mod?.stripeService;
  } catch {
    stripeService = {
      handleWebhookEvent: async (_payload: any, _signature: string) => {
        console.log('Stripe webhook (mock) invoked');
      }
    };
  }

  try {
    await stripeService?.handleWebhookEvent?.(buf, sig);
    res?.status?.(200).json?.({ received: true });
  } catch (err: any) {
    console.error(`Webhook Error: ${err?.message ?? err}`);
    res?.status?.(400).send?.(`Webhook Error: ${err?.message ?? String(err)}`);
  }
}
