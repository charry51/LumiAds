'use client';

import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Asegúrate de definir esta variable de entorno en tu .env.local
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

interface PaymentProviderProps {
  clientSecret: string;
  children: React.ReactNode;
}

export default function PaymentProvider({ clientSecret, children }: PaymentProviderProps) {
  return (
    <Elements 
      stripe={stripePromise} 
      options={{ 
        clientSecret,
        appearance: {
          theme: 'night', // Utilizamos el tema oscuro para que encaje con la estética de LUMINADD
          variables: {
            colorPrimary: '#4f46e5', // indigo-600
            colorBackground: '#18181b', // zinc-900
            colorText: '#f4f4f5',
            colorDanger: '#ef4444',
            fontFamily: 'Inter, system-ui, sans-serif',
          }
        } 
      }}
    >
      {children}
    </Elements>
  );
}
