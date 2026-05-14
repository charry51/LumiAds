import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  if (!stripe) {
    console.error('Stripe is not initialized. Check your STRIPE_SECRET_KEY.');
    return NextResponse.json({ error: 'Servicio de pagos no disponible' }, { status: 503 });
  }
  try {
    const body = await req.json();
    const { amount, currency = 'eur' } = body;

    // Validación básica
    if (!amount || typeof amount !== 'number') {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
    }

    // Crear un PaymentIntent en Stripe
    // El monto en Stripe debe ir en la unidad mínima de la moneda (ej. centavos para EUR)
    // 10 EUR = 1000 centavos
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, 
      currency: currency,
      // Habilitar métodos de pago automáticos configurados en el Dashboard de Stripe
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Retornamos el client_secret que el frontend necesita para completar el pago
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error('Error creando PaymentIntent:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
