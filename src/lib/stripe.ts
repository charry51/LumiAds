import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is missing. Please set the environment variable.');
}

// Inicializamos la instancia de Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-04-22.dahlia', // Usamos la versión requerida por el SDK instalado
  appInfo: {
    name: 'LUMINADD App',
    version: '1.0.0',
  },
});
