'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { updatePlan } from './actions'
import { toast } from 'sonner'
import { Loader2, ShieldCheck, CreditCard } from 'lucide-react'

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get('plan')
  const [loading, setLoading] = useState(false)

  if (!planId) {
    router.push('/dashboard/planes')
    return null
  }

  const handlePayment = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      })

      if (!response.ok) {
        const errorMsg = await response.text()
        throw new Error(errorMsg || 'Error al inicializar el pago')
      }

      const { url } = await response.json()
      window.location.href = url // Redirect to Stripe Checkout
    } catch (err: any) {
      toast.error('Error al procesar el pago: ' + (err.message || 'Error desconocido'))
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[90vh] p-4 bg-background font-sans text-foreground">
      <div className="cyber-card w-full max-w-md overflow-hidden relative border-primary/30 shadow-[0_0_50px_rgba(124,60,255,0.1)]">
        <div className="bg-[#1a1a2e]/80 p-8 border-b border-border flex items-center justify-between">
          <div>
            <p className="text-primary text-[10px] uppercase font-mono tracking-[4px] mb-1">Terminal de Pago</p>
            <h2 className="text-3xl font-heading text-zinc-100 uppercase tracking-tight">{planId.replace('_', ' ')}</h2>
          </div>
          <div className="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center bg-primary/5">
            <CreditCard className="w-6 h-6 text-primary shadow-[0_0_10px_rgba(124,60,255,0.5)]" />
          </div>
        </div>
        
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-center text-zinc-400 border-b border-border/30 pb-4 font-mono text-[11px] uppercase tracking-widest">
            <span>Protocolo de Pago</span>
            <span className="font-bold text-primary">Stripe Secured</span>
          </div>

          <div className="bg-primary/5 p-5 border border-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary animate-pulse"></div>
            <div className="flex gap-3 items-start">
              <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex flex-col gap-1">
                <p className="text-[10px] text-zinc-100 font-bold uppercase tracking-tight">
                  {planId === 'presencia' ? '🎉 Oferta Especial: 30 Días de Prueba' : 'Entorno de Alta Seguridad'}
                </p>
                <p className="text-[9px] text-zinc-400 leading-relaxed font-sans uppercase tracking-tight">
                  {planId === 'presencia' 
                    ? 'Disfruta de todas las funciones del plan Presencia sin coste durante un mes. Luego 79€/mes.' 
                    : 'Al confirmar, serás redirigido a la pasarela de pago segura de Stripe para procesar tu suscripción.'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
             <div className="flex justify-between text-[11px] font-mono uppercase text-zinc-500 tracking-widest">
                <span>Total a Pagar Hoy</span>
                <span className={planId === 'presencia' ? 'text-green-500 font-bold' : ''}>
                  {planId === 'presencia' ? '0.00€' : 'Pago Seguro'}
                </span>
             </div>
             {planId === 'presencia' && (
               <div className="flex justify-between text-[9px] font-mono uppercase text-zinc-600 tracking-tighter">
                  <span>Próximo cargo</span>
                  <span>En 30 días</span>
               </div>
             )}
          </div>
        </div>

        <div className="p-8 pt-0 flex flex-col gap-6">
          <button 
            className={`cyber-button-ui w-full py-4 text-xs font-black uppercase tracking-[3px] shadow-lg shadow-primary/10 flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-wait' : ''}`}
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-black" />
                Validando...
              </>
            ) : (
                planId === 'presencia' ? "Iniciar Prueba Gratuita" : "Pagar con Stripe"
            )}
          </button>
          <button 
            className="text-zinc-600 text-[9px] uppercase font-bold tracking-[2px] hover:text-zinc-300 transition-colors" 
            onClick={() => router.back()}
          >
            Abortar y Volver
          </button>
        </div>
        
        {/* Decorative corner elements */}
        <div className="absolute bottom-1 right-1 w-2 h-2 border-r border-b border-primary/30"></div>
        <div className="absolute top-1 left-1 w-2 h-2 border-l border-t border-primary/30"></div>
      </div>
    </div>
  )
}
