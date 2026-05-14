import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-20 h-20 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">¡Pago realizado!</h1>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          Tu transacción se ha completado de forma exitosa y segura. Te hemos enviado un correo con los detalles de tu compra.
        </p>
        <Link 
          href="/dashboard"
          className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-500 transition-colors w-full"
        >
          Ir a mi panel
        </Link>
      </div>
    </div>
  );
}
