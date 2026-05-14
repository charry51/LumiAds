'use client';

import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async (event: React.FormEvent<HTMLFormElement>) => {
    // Prevenimos la recarga de la página
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js aún no ha cargado.
      return;
    }

    setIsProcessing(true);

    // Confirmamos el pago usando los datos ingresados en el PaymentElement
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Asegúrate de que esta URL coincida con tu ruta de éxito
        // y usa la URL base correcta según tu entorno (local o producción)
        return_url: `${window.location.origin}/checkout/success`,
      },
    });

    // Si hay un error inmediato (ej. tarjeta rechazada o validación fallida),
    // confirmPayment devuelve un error inmediatamente. De lo contrario,
    // el usuario será redirigido a la `return_url`.
    if (error) {
      setErrorMessage(error.message ?? 'Ocurrió un error inesperado al procesar el pago.');
    } else {
      // Normalmente el código no llegará aquí porque redirigirá antes.
      // A menos que el flujo requiera más pasos en la misma página (ej. redirect: "if_required").
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handlePayment} className="max-w-md mx-auto p-6 bg-zinc-900 rounded-xl shadow-lg border border-zinc-800">
      <h3 className="text-xl font-bold text-white mb-6">Información de Pago</h3>
      
      {/* PaymentElement inyecta automáticamente los campos de tarjeta adaptados */}
      <PaymentElement className="mb-6" />

      <button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all 
          ${isProcessing || !stripe || !elements 
            ? 'bg-zinc-700 cursor-not-allowed opacity-50' 
            : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/25 hover:shadow-lg'
          }`}
      >
        {isProcessing ? 'Procesando pago...' : 'Pagar Ahora'}
      </button>

      {errorMessage && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {errorMessage}
        </div>
      )}
      
      <div className="mt-4 text-center">
        <a href="/checkout/cancel" className="text-sm text-zinc-400 hover:text-white transition-colors">
          Cancelar y volver
        </a>
      </div>
    </form>
  );
}
