// Configuración de los planes y sus equivalentes en Stripe

export interface SubscriptionPlan {
  id: string
  name: string
  stripePriceId: string
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Básico',
    stripePriceId: '',
  },
  {
    id: 'premium',
    name: 'Premium',
    stripePriceId: process.env.STRIPE_PRICE_ID_PREMIUM || '',
  },
  {
    id: 'gold',
    name: 'Gold',
    stripePriceId: process.env.STRIPE_PRICE_ID_GOLD || '',
  },
]
