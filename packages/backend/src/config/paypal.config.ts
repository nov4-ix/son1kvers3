import paypal from '@paypal/checkout-server-sdk';

const environment = process.env.NODE_ENV === 'production'
  ? new paypal.core.LiveEnvironment(
      process.env.PAYPAL_CLIENT_ID_LIVE!,
      process.env.PAYPAL_CLIENT_SECRET_LIVE!
    )
  : new paypal.core.SandboxEnvironment(
      process.env.PAYPAL_CLIENT_ID!,
      process.env.PAYPAL_CLIENT_SECRET!
    );

export const paypalClient = new paypal.core.PayPalHttpClient(environment);
