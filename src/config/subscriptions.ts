// Configuración de los planes y sus equivalentes en Stripe

export interface SubscriptionPlan {
  id: string
  name: string
  stripePriceId: string
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'presencia',
    name: 'Presencia',
    stripePriceId: process.env.STRIPE_PRICE_ID_PRESENCIA || '', // Reemplazar con el ID real de Stripe
  },
  {
    id: 'presencia_pro',
    name: 'Presencia Pro',
    stripePriceId: process.env.STRIPE_PRICE_ID_PRESENCIA_PRO || '',
  },
  {
    id: 'impacto_senior',
    name: 'Impacto Senior',
    stripePriceId: process.env.STRIPE_PRICE_ID_IMPACTO_SENIOR || '',
  },
  {
    id: 'dominio',
    name: 'Dominio de Red',
    stripePriceId: process.env.STRIPE_PRICE_ID_DOMINIO || '',
  },
]
