import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { CreditCard, Loader2 } from 'lucide-react'

// Initialize Stripe with publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')

interface PricingTier {
  id: string
  name: string
  price: number
  priceId: string
  generations: number // Added for display
  features: string[]
}

interface StripeCheckoutProps {
  tier: PricingTier
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function StripeCheckout({ tier, onSuccess, onError }: StripeCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckout = async () => {
    setIsLoading(true)

    try {
      // Call backend to create checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: tier.priceId,
          successUrl: `${window.location.origin}/success`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { sessionId } = await response.json()

      // Redirect to Stripe Checkout
      const stripe = await stripePromise
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId })
        if (error) {
          throw error
        }
      }
    } catch (error) {
      console.error('Checkout error:', error)
      onError?.(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading}
      className="w-full bg-gradient-to-r from-primary to-magenta text-carbon py-3 px-6 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="w-5 h-5" />
          Subscribe to {tier.name}
        </>
      )}
    </button>
  )
}

// Pricing tiers configuration
export const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'FREE',
    price: 0,
    priceId: 'free',
    generations: 5,
    features: [
      '5 generaciones al mes',
      '2 generaciones al día',
      'Duración máxima: 60s',
      'Calidad estándar',
      'Acceso a comunidad'
    ]
  },
  {
    id: 'pro',
    name: 'PRO',
    price: 29,
    priceId: 'price_pro_monthly', // Replace with actual Stripe price ID
    generations: 50,
    features: [
      '50 generaciones al mes',
      '5 generaciones al día',
      'Duración máxima: 120s',
      'Calidad premium',
      'Acceso prioritario',
      'Soporte prioritario'
    ]
  },
  {
    id: 'premium',
    name: 'PREMIUM',
    price: 99,
    priceId: 'price_premium_monthly', // Replace with actual Stripe price ID
    generations: 200,
    features: [
      '200 generaciones al mes',
      'Generaciones ilimitadas/día',
      'Duración máxima: 300s',
      'Calidad ultra',
      'Acceso exclusivo',
      'NFT marketplace',
      'API access'
    ]
  },
  {
    id: 'enterprise',
    name: 'ENTERPRISE',
    price: 0, // Custom pricing
    priceId: 'enterprise',
    generations: 999999,
    features: [
      'Generaciones ilimitadas',
      'Control total de duración',
      'Calidad personalizada',
      'White-label',
      'Dedicated support',
      'SLA garantizado'
    ]
  }
]
