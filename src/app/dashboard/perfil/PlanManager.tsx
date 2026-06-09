'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2, Shield, Zap, Sparkles, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function PlanManager({
  currentPlanId,
  suscripcionActiva,
  esHost,
}: {
  currentPlanId: string | null
  suscripcionActiva: boolean
  esHost: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  if (!esHost) {
    return (
      <div className="cyber-card p-8 border-white/5 relative overflow-hidden transition-all duration-500 shadow-sm">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <CreditCard className="w-40 h-40" />
        </div>

        <h3 className="text-xl font-heading font-black tracking-tight uppercase text-white mb-6 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[#2BC8FF]" />
          Gestión de Plan de Anunciante
        </h3>

        <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Tu Plan de Anunciante Activo</p>
            <p className="text-lg font-heading font-bold text-white uppercase mt-1 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#2BC8FF]" />
              <span>Plan Único</span>
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">
              Acceso al Marketplace • Compra programática de impactos • Panel de analíticas en tiempo real
            </p>
          </div>
          <div className="text-right flex flex-col items-end gap-1 shrink-0">
            <span className="text-xl font-mono font-bold text-[#2BC8FF]">
              Único
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 uppercase">
              Activo
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Normalizar el plan actual
  const getNormalizedPlan = (id: string | null, active: boolean) => {
    if (!active || !id) return null
    const val = id.toLowerCase()
    if (val === 'premium' || val === 'impacto') return 'premium'
    if (val === 'gold' || val === 'expansion' || val === 'dominio') return 'gold'
    return null
  }

  const activePlan = getNormalizedPlan(currentPlanId, suscripcionActiva)

  const handleCheckout = async (planId: 'premium' | 'gold') => {
    setLoading(planId)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'No se pudo iniciar el proceso de pago')
      }

      if (data?.url) {
        window.location.href = data.url
        return
      }

      toast.success('Plan actualizado con éxito')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar el plan')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="cyber-card p-8 border-white/5 relative overflow-hidden transition-all duration-500 shadow-sm">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <CreditCard className="w-40 h-40" />
      </div>

      <h3 className="text-xl font-heading font-black tracking-tight uppercase text-white mb-6 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-[#7C3CFF]" />
        Gestión de Plan de Host
      </h3>

      <div className="space-y-6">
        {/* Info del plan actual */}
        <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Tu Plan de Host Activo</p>
            <p className="text-lg font-heading font-bold text-white uppercase mt-1 flex items-center gap-2">
              {activePlan === 'gold' && (
                <>
                  <Shield className="w-5 h-5 text-[#D4AF37]" />
                  <span>Plan Gold</span>
                </>
              )}
              {activePlan === 'premium' && (
                <>
                  <Zap className="w-5 h-5 text-[#7C3CFF]" />
                  <span>Plan Premium</span>
                </>
              )}
              {!activePlan && (
                <>
                  <Sparkles className="w-5 h-5 text-red-400" />
                  <span>Sin Plan Activo</span>
                </>
              )}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">
              {activePlan === 'gold' && 'CMS 100% Privado • Aislamiento total del Marketplace • Subidas ilimitadas'}
              {activePlan === 'premium' && 'Emisión híbrida • Gestión de anuncios propios • Recibe comisiones de terceros'}
              {!activePlan && 'Elige uno de los planes de abajo para activar tu cuenta de host y conectar pantallas.'}
            </p>
          </div>
          <div className="text-right flex flex-col items-end gap-1 shrink-0">
            <span className="text-xl font-mono font-bold text-white">
              {activePlan === 'gold' && '50€'}
              {activePlan === 'premium' && '20€'}
              {!activePlan && '—'}
              {activePlan && <span className="text-xs text-zinc-500 font-normal">/mes</span>}
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
              activePlan
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {activePlan ? 'Suscripción Activa' : 'Inactivo'}
            </span>
          </div>
        </div>

        {/* Tarjetas de Planes a Elegir */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Plan Premium */}
          <div className={`p-5 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
            activePlan === 'premium' 
              ? 'bg-[#7C3CFF]/10 border-[#7C3CFF]/40 shadow-[0_0_20px_rgba(124,60,255,0.15)]' 
              : 'bg-black/20 border-white/5 hover:border-white/10'
          }`}>
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#7C3CFF]" />
                  Premium
                </span>
                <span className="text-sm font-mono font-bold text-white">20€/mes</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed mb-4">
                Gestión de anuncios propios, inyección de publicidad de terceros y cobro de comisiones sobre ventas.
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-center gap-2 text-[9px] text-zinc-300 uppercase">
                  <Check className="w-3 h-3 text-[#7C3CFF]" /> Pantalla 100% Pública
                </li>
                <li className="flex items-center gap-2 text-[9px] text-zinc-300 uppercase">
                  <Check className="w-3 h-3 text-[#7C3CFF]" /> Comisión residual de ventas
                </li>
              </ul>
            </div>
            {activePlan === 'premium' ? (
              <Button disabled className="w-full bg-[#7C3CFF]/20 text-[#7C3CFF] border border-[#7C3CFF]/30 text-[10px] font-black uppercase tracking-widest cursor-default">
                Plan Activo
              </Button>
            ) : (
              <Button 
                onClick={() => handleCheckout('premium')}
                disabled={loading !== null}
                className="w-full bg-[#7C3CFF] hover:bg-[#6c30e6] text-white text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(124,60,255,0.3)] transition-all"
              >
                {loading === 'premium' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cambiar a Premium'}
              </Button>
            )}
          </div>

          {/* Plan Gold */}
          <div className={`p-5 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
            activePlan === 'gold' 
              ? 'bg-[#D4AF37]/10 border-[#D4AF37]/40 shadow-[0_0_20px_rgba(212,175,55,0.15)]' 
              : 'bg-black/20 border-white/5 hover:border-white/10'
          }`}>
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Gold
                </span>
                <span className="text-sm font-mono font-bold text-white">50€/mes</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed mb-4">
                Aislamiento completo de la red. CMS 100% privado y subida ilimitada de tu propio contenido corporativo.
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-center gap-2 text-[9px] text-zinc-300 uppercase">
                  <Check className="w-3 h-3 text-[#D4AF37]" /> Pantalla Oculta del Marketplace
                </li>
                <li className="flex items-center gap-2 text-[9px] text-zinc-300 uppercase">
                  <Check className="w-3 h-3 text-[#D4AF37]" /> Sin publicidad externa
                </li>
              </ul>
            </div>
            {activePlan === 'gold' ? (
              <Button disabled className="w-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 text-[10px] font-black uppercase tracking-widest cursor-default">
                Plan Activo
              </Button>
            ) : (
              <Button 
                onClick={() => handleCheckout('gold')}
                disabled={loading !== null}
                className="w-full bg-[#D4AF37] hover:bg-[#bfa032] text-black text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all"
              >
                {loading === 'gold' ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : 'Cambiar a Gold'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
