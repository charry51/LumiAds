import Stripe from 'stripe';

// Inicializamos la instancia de Stripe de forma segura para no romper el build si falta la clave
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-04-22.dahlia' as any, // Cast to any to avoid TS issues if the SDK type is older
      appInfo: {
        name: 'LumiAds App',
        version: '1.0.0',
      },
    })
  : null;
