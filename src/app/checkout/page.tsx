'use client';

import { useEffect, useState } from 'react';
import PaymentProvider from '@/components/checkout/PaymentProvider';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import { Loader2 } from 'lucide-react';

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Creamos el PaymentIntent al cargar la página
    // Puedes pasar el monto de forma dinámica en un carrito real
    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1500 }), // Ej. 15.00 EUR
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error al inicializar el pago', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl font-bold text-center text-white mb-2">Checkout Seguro</h1>
        <p className="text-zinc-400 text-center mb-8">
          Completa tu pago usando tecnología segura de Stripe.
        </p>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="ml-3 text-zinc-400">Preparando pago...</span>
          </div>
        ) : clientSecret ? (
          <PaymentProvider clientSecret={clientSecret}>
            <CheckoutForm />
          </PaymentProvider>
        ) : (
          <div className="text-center text-red-500 bg-red-500/10 p-4 rounded-lg">
            No se pudo cargar el formulario de pago. Por favor intenta nuevamente.
          </div>
        )}
      </div>
    </div>
  );
}
