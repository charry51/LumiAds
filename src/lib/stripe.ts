import Stripe from 'stripe'

// En modo Sandbox (sin claves), exportamos null para que el resto del código lo maneje
// Esto evita errores de compilación y permite probar el flujo sin claves reales.
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-04-22.dahlia',
      appInfo: {
        name: 'LumiAds',
        version: '0.1.0',
      },
    })
  : null
