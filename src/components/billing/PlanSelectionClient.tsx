'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2, Monitor, Shield, Zap } from 'lucide-react'

const plans = [
  {
    id: 'basic',
    label: 'Básico',
    price: '0€',
    period: '',
    description: 'Perfecto para empezar y monetizar de forma sencilla.',
    features: [
      'Visibilidad en el Marketplace',
      'Gestiona tu catálogo básico',
      'Sin coste mensual',
      'Ideal para validar tu primer nodo',
    ],
    buttonText: 'Continuar con Básico',
    accent: '#2BC8FF',
    icon: Monitor,
    action: 'free',
  },
  {
    id: 'premium',
    label: 'Premium',
    price: '20€',
    period: '/mes',
    description: 'Para hosts que quieren controlar sus anuncios propios.',
    features: [
      'Gestión de anuncios propios',
      'Pantalla pública con mayor visibilidad',
      'Inyección de publicidad externa',
      'Comisión residual de ventas',
    ],
    buttonText: 'Activar Premium',
    accent: '#7C3CFF',
    icon: Zap,
    action: 'checkout',
    stripePlanId: 'premium',
  },
  {
    id: 'gold',
    label: 'Gold',
    price: '50€',
    period: '/mes',
    description: 'Control absoluto para hosts con CMS privado y máxima exclusividad.',
    features: [
      'Pantalla oculta del Marketplace',
      'CMS 100% privado',
      'Sin anuncios externos',
      'Sube todo lo que quieras sin límites',
    ],
    buttonText: 'Activar Gold',
    accent: '#D4AF37',
    icon: Shield,
    action: 'checkout',
    stripePlanId: 'gold',
  },
]

export function PlanSelectionClient() {
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleAction = async (plan: (typeof plans)[number]) => {
    setErrorMessage(null)

    if (plan.action === 'free') {
      router.push('/host')
      return
    }

    setLoadingPlan(plan.id)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId: plan.stripePlanId }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'No se pudo iniciar el pago')
      }

      if (data?.url) {
        window.location.href = data.url
        return
      }

      router.push('/host')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ha ocurrido un error'
      setErrorMessage(message)
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.4em] text-lumi-violet font-bold">Paso 2 de 2</p>
        <h1 className="text-3xl md:text-4xl font-heading text-white tracking-tighter">
          Elige el plan <span className="text-gradient-ui">ideal</span>
        </h1>
        <p className="text-sm text-zinc-300 max-w-2xl">
          Ya tienes tu cuenta creada. Ahora selecciona el plan que mejor encaja con tu operación y, cuando estés listo, activa el pago para empezar.
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.icon
          const isLoading = loadingPlan === plan.id

          return (
            <div
              key={plan.id}
              className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-[0_0_40px_rgba(0,0,0,0.35)]"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <Icon className="h-5 w-5" style={{ color: plan.accent }} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{plan.label}</p>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{plan.id === 'basic' ? 'Sin pago' : 'Pago mensual'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-end gap-2">
                <span className="text-4xl font-heading text-white">{plan.price}</span>
                {plan.period && <span className="pb-1 text-sm text-zinc-400">{plan.period}</span>}
              </div>

              <p className="mt-4 text-sm text-zinc-300">{plan.description}</p>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-zinc-200">
                    <Check className="mt-0.5 h-4 w-4" style={{ color: plan.accent }} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => handleAction(plan)}
                disabled={isLoading}
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.3em] transition-all"
                style={{
                  backgroundColor: plan.id === 'basic' ? 'rgba(255,255,255,0.05)' : plan.accent,
                  color: plan.id === 'basic' ? '#fff' : '#09090B',
                  border: plan.id === 'basic' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  plan.buttonText
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
