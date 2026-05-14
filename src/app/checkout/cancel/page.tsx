import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
        <div className="flex justify-center mb-6">
          <XCircle className="w-20 h-20 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Pago cancelado</h1>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          Has cancelado el proceso de pago. No se ha realizado ningún cargo a tu tarjeta.
        </p>
        <Link 
          href="/checkout"
          className="inline-block bg-zinc-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-zinc-700 transition-colors w-full"
        >
          Volver a intentar
        </Link>
      </div>
    </div>
  );
}
