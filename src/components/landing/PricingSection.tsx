'use client'

import { useRouter } from 'next/navigation'
import { Check, Monitor, Shield, Zap } from 'lucide-react'

const planes = [
  {
    id: 'basic',
    name: 'Plan Básico',
    price: '0€',
    description: 'Perfecto para empezar. Tu pantalla es 100% pública.',
    features: [
      'Sin cuota mensual',
      'Visibilidad global en el Marketplace',
      'Tú decides el precio base',
      'LumiAds gestiona los anunciantes'
    ],
    buttonText: 'Empezar Gratis',
    icon: Monitor,
    color: '#2BC8FF'
  },
  {
    id: 'premium',
    name: 'Plan Premium',
    price: '20€',
    period: '/mes',
    description: 'Para hosts que quieren gestionar sus propios anuncios.',
    features: [
      'Gestión de anuncios propios',
      'Pantalla 100% Pública',
      'Inyección de publicidad externa',
      'Comisión residual de ventas'
    ],
    buttonText: 'Activar Premium',
    icon: Zap,
    color: '#7C3CFF',
    popular: true
  },
  {
    id: 'gold',
    name: 'Plan Gold',
    price: '50€',
    period: '/mes',
    description: 'Control absoluto. CMS privado exclusivo para ti.',
    features: [
      'Pantalla Oculta del Marketplace',
      'CMS 100% Privado',
      'Sin anuncios externos',
      'Sube todo lo que quieras sin límites'
    ],
    buttonText: 'Activar Gold',
    icon: Shield,
    color: '#D4AF37'
  }
]

export default function PricingSection() {
  const router = useRouter()

  const handleActivate = () => {
    router.push('/register?type=host&returnTo=%2Fplanes%2Fseleccionar%3Frole%3Dhost')
  }

  return (
    <section id="host-pricing" className="py-24 bg-black relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#7C3CFF]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading text-white tracking-tighter mb-4">
            Monetiza tus <span className="text-gradient-ui">Pantallas</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            Elige el nivel de control y visibilidad que mejor se adapte a tu negocio físico.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {planes.map((plan) => {
            const Icon = plan.icon
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col p-8 rounded-3xl border transition-all duration-300 landing-glass-ui
                  ${plan.popular ? 'border-[#7C3CFF]/50 shadow-[0_0_30px_rgba(124,60,255,0.15)] scale-105 z-10' : 'border-white/10 hover:border-white/30'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#7C3CFF] text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                    Más Popular
                  </div>
                )}

                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <Icon className="w-6 h-6" style={{ color: plan.color }} />
                  </div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-heading text-white">{plan.price}</span>
                  {plan.period && <span className="text-zinc-500">{plan.period}</span>}
                </div>

                <p className="text-zinc-400 text-sm mb-8 min-h-[40px]">
                  {plan.description}
                </p>

                <ul className="flex flex-col gap-4 mb-8 flex-grow">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-4 h-4 mt-0.5" style={{ color: plan.color }} />
                      <span className="text-sm text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleActivate}
                  className="w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group"
                  style={{
                    backgroundColor: plan.popular ? '#7C3CFF' : 'rgba(255,255,255,0.05)',
                    color: plan.popular ? '#fff' : plan.color,
                    border: plan.popular ? 'none' : `1px solid ${plan.color}30`
                  }}
                >
                  {plan.buttonText}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
