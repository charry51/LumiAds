'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2, Monitor, Shield, Zap, Sparkles } from 'lucide-react'

const plans = [
  {
    id: 'basic',
    label: 'Plan Básico',
    price: '0€',
    period: '',
    badge: null,
    description: 'Perfecto para empezar. Tu pantalla es 100% pública.',
    features: [
      'Sin cuota mensual',
      'Visibilidad global en el Marketplace',
      'Tú decides el precio base',
      'LumiAds gestiona los anunciantes',
    ],
    buttonText: 'Empezar Gratis',
    accent: '#2BC8FF',
    accentRgb: '43, 200, 255',
    icon: Monitor,
    action: 'free',
    popular: false,
  },
  {
    id: 'premium',
    label: 'Plan Premium',
    price: '20€',
    period: '/mes',
    badge: 'Más Popular',
    description: 'Para hosts que quieren gestionar sus propios anuncios.',
    features: [
      'Gestión de anuncios propios',
      'Pantalla 100% Pública',
      'Inyección de publicidad externa',
      'Comisión residual de ventas',
    ],
    buttonText: 'Activar Premium',
    accent: '#7C3CFF',
    accentRgb: '124, 60, 255',
    icon: Zap,
    action: 'checkout',
    stripePlanId: 'premium',
    popular: true,
  },
  {
    id: 'gold',
    label: 'Plan Gold',
    price: '50€',
    period: '/mes',
    badge: null,
    description: 'Control absoluto. CMS privado exclusivo para ti.',
    features: [
      'Pantalla Oculta del Marketplace',
      'CMS 100% Privado',
      'Sin anuncios externos',
      'Sube todo lo que quieras sin límites',
    ],
    buttonText: 'Activar Gold',
    accent: '#D4AF37',
    accentRgb: '212, 175, 55',
    icon: Shield,
    action: 'checkout',
    stripePlanId: 'gold',
    popular: false,
  },
]

export function PlanSelectionClient() {
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null)

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
        headers: { 'Content-Type': 'application/json' },
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
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#7C3CFF]" />
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#7C3CFF] font-bold">Paso 2 de 2</p>
        </div>
        <h1 className="text-3xl md:text-4xl font-heading text-white tracking-tighter">
          Elige el nivel de{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#7C3CFF] to-[#2BC8FF]">
            control y visibilidad
          </span>{' '}
          que mejor se adapte a tu negocio físico.
        </h1>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid gap-5 xl:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.icon
          const isLoading = loadingPlan === plan.id
          const isHovered = hoveredPlan === plan.id

          return (
            <div
              key={plan.id}
              onMouseEnter={() => setHoveredPlan(plan.id)}
              onMouseLeave={() => setHoveredPlan(null)}
              className="relative group rounded-2xl transition-all duration-300 cursor-default"
              style={{
                background: isHovered
                  ? `radial-gradient(ellipse at top left, rgba(${plan.accentRgb}, 0.07) 0%, rgba(9,9,11,0.8) 70%)`
                  : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isHovered ? `rgba(${plan.accentRgb}, 0.35)` : 'rgba(255,255,255,0.08)'}`,
                boxShadow: isHovered
                  ? `0 0 40px rgba(${plan.accentRgb}, 0.12), 0 0 1px rgba(${plan.accentRgb}, 0.5) inset`
                  : '0 0 40px rgba(0,0,0,0.35)',
              }}
            >
              {/* Popular Badge */}
              {plan.badge && (
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white"
                  style={{
                    background: `linear-gradient(135deg, rgba(${plan.accentRgb}, 0.9), rgba(${plan.accentRgb}, 0.6))`,
                    border: `1px solid rgba(${plan.accentRgb}, 0.4)`,
                    boxShadow: `0 0 20px rgba(${plan.accentRgb}, 0.4)`,
                  }}
                >
                  {plan.badge}
                </div>
              )}

              <div className="p-6">
                {/* Icon + Label */}
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="rounded-xl p-3 transition-all duration-300"
                    style={{
                      background: isHovered
                        ? `rgba(${plan.accentRgb}, 0.15)`
                        : 'rgba(255,255,255,0.05)',
                      border: `1px solid rgba(${plan.accentRgb}, ${isHovered ? '0.4' : '0.15'})`,
                      transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                    }}
                  >
                    <Icon
                      className="h-5 w-5 transition-all duration-300"
                      style={{ color: plan.accent }}
                    />
                  </div>
                  <div>
                    <p className="text-base font-bold text-white">{plan.label}</p>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mt-0.5">
                      {plan.id === 'basic' ? 'Sin pago' : 'Pago mensual'}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-end gap-1.5 mb-3">
                  <span
                    className="text-5xl font-black tracking-tighter transition-all duration-300"
                    style={{ color: isHovered ? plan.accent : '#ffffff' }}
                  >
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="pb-1.5 text-sm text-zinc-500 font-medium">{plan.period}</span>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-zinc-400 leading-relaxed mb-6">{plan.description}</p>

                {/* Separator */}
                <div
                  className="h-px mb-5 transition-all duration-300"
                  style={{
                    background: isHovered
                      ? `linear-gradient(to right, rgba(${plan.accentRgb}, 0.4), transparent)`
                      : 'rgba(255,255,255,0.06)',
                  }}
                />

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
                      <div
                        className="mt-0.5 h-4 w-4 rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
                        style={{
                          background: `rgba(${plan.accentRgb}, ${isHovered ? '0.2' : '0.1'})`,
                        }}
                      >
                        <Check
                          className="h-2.5 w-2.5"
                          style={{ color: plan.accent }}
                        />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  type="button"
                  onClick={() => handleAction(plan)}
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={
                    plan.id === 'basic'
                      ? {
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: isHovered ? plan.accent : '#ffffff',
                          borderColor: isHovered ? `rgba(${plan.accentRgb}, 0.4)` : 'rgba(255,255,255,0.1)',
                        }
                      : {
                          background: isHovered
                            ? `linear-gradient(135deg, ${plan.accent}, rgba(${plan.accentRgb}, 0.8))`
                            : `rgba(${plan.accentRgb}, 0.15)`,
                          border: `1px solid rgba(${plan.accentRgb}, ${isHovered ? '0.8' : '0.3'})`,
                          color: isHovered ? '#09090B' : plan.accent,
                          boxShadow: isHovered ? `0 0 24px rgba(${plan.accentRgb}, 0.4)` : 'none',
                        }
                  }
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
            </div>
          )
        })}
      </div>
    </div>
  )
}
