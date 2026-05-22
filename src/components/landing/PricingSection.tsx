'use client'

import { Check, Shield, Sparkles, Zap, Star, Flame } from 'lucide-react'
import Link from 'next/link'

const plans = [
  {
    id: 'presencia',
    name: 'Presencia',
    price: '79€',
    period: '/ mes',
    badge: '🎁 ¡30 DÍAS GRATIS!',
    color: '#2BC8FF',
    hoverColor: 'rgba(43, 200, 255, 0.2)',
    features: [
      '1 Nodo de pantalla',
      'Frecuencia 1x (1 cada 2 bucles)',
      'Slots de 10 segundos',
      'Prioridad base (1)',
      'Soporte estándar por email',
    ],
    cta: 'Comenzar Gratis',
    highlight: false,
    icon: Shield,
  },
  {
    id: 'presencia_pro',
    name: 'Presencia Pro',
    price: '149€',
    period: '/ mes',
    badge: 'Recomendado',
    color: '#7C3CFF',
    hoverColor: 'rgba(124, 60, 255, 0.2)',
    features: [
      '3 Nodos de pantalla',
      'Frecuencia 2x (Máx 1 por bucle)',
      'Slots de 15 segundos',
      'Prioridad intermedia (2)',
      'Soporte prioritario',
    ],
    cta: 'Contratar Pro',
    highlight: true,
    icon: Sparkles,
  },
  {
    id: 'impacto_senior',
    name: 'Impacto Senior',
    price: '299€',
    period: '/ mes',
    badge: 'Alta Demanda',
    color: '#00d2ff',
    hoverColor: 'rgba(0, 210, 255, 0.2)',
    features: [
      '15 Nodos de pantalla',
      'Frecuencia 3x (Mín 2 por bucle)',
      'Slots de 15 segundos',
      'Prioridad alta (3)',
      'Elección de franjas horarias',
      'Analíticas avanzadas',
    ],
    cta: 'Elegir Impacto',
    highlight: false,
    icon: Flame,
  },
  {
    id: 'dominio',
    name: 'Dominio',
    price: '499€',
    period: '/ mes',
    badge: 'Empresas',
    color: '#FFD700',
    hoverColor: 'rgba(255, 215, 0, 0.2)',
    features: [
      'Pantallas Ilimitadas',
      'Frecuencia 4x (2-5 por bucle)',
      'Slots de 30 segundos',
      'Prioridad máxima (4)',
      'Elección de franjas horarias',
      'Soporte 24/7 con gestor dedicado',
    ],
    cta: 'Obtener Dominio',
    highlight: false,
    icon: Star,
  },
]

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-[#050508] relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#7C3CFF]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#2BC8FF]/10 to-transparent" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <div className="mb-20 text-center">
          <div className="inline-flex items-center gap-3 mb-4 justify-center">
            <span className="w-10 h-[1px] bg-[#2BC8FF]" />
            <h2 className="text-[#2BC8FF] text-[10px] uppercase tracking-[0.3em] font-black">Precios Transparentes</h2>
            <span className="w-10 h-[1px] bg-[#2BC8FF]" />
          </div>
          <h3 className="text-3xl md:text-5xl font-heading text-white font-light tracking-tighter leading-tight mb-4">
            Elige el plan ideal para tu <span className="text-gradient-ui font-medium">Campaña.</span>
          </h3>
          <p className="text-zinc-500 max-w-xl mx-auto text-sm leading-relaxed font-light">
            Escala tu impacto de forma ágil y programática en nuestra red nacional de pantallas inteligentes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => {
            const PlanIcon = plan.icon
            return (
              <div
                key={plan.id}
                className={`landing-glass-ui p-8 flex flex-col justify-between transition-all duration-500 group relative ${
                  plan.highlight 
                    ? 'border-[#7C3CFF]/50 shadow-[0_0_30px_rgba(124,60,255,0.15)] bg-black/60' 
                    : 'hover:border-white/20'
                }`}
                style={{
                  borderColor: plan.highlight ? '#7C3CFF88' : undefined
                }}
              >
                {/* Glow Effect on Hover */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-[1.8rem] blur-xl -z-10"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${plan.color}15 0%, transparent 70%)`
                  }}
                />

                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span 
                      className={`text-[9px] uppercase font-black px-4 py-1 rounded-full tracking-[2px] shadow-lg border text-black`}
                      style={{
                        backgroundColor: plan.color,
                        borderColor: `${plan.color}44`,
                        boxShadow: `0 4px 15px ${plan.color}33`
                      }}
                    >
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-start mb-6 pt-2">
                    <div>
                      <h4 className="text-lg font-heading text-white uppercase tracking-tight">{plan.name}</h4>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-3xl font-mono font-bold text-white">{plan.price}</span>
                        <span className="text-[10px] text-zinc-500 font-mono uppercase">{plan.period}</span>
                      </div>
                    </div>
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center border border-white/5 transition-transform duration-500 group-hover:scale-110"
                      style={{
                        backgroundColor: `${plan.color}10`,
                        color: plan.color
                      }}
                    >
                      <PlanIcon className="w-5 h-5" />
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-zinc-400 text-xs font-light">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto">
                  <Link href="/register" className="w-full block">
                    <button 
                      className={`w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[2px] transition-all duration-300 ${
                        plan.highlight 
                          ? 'cyber-button-ui text-white' 
                          : 'border border-white/10 hover:border-white/30 text-zinc-300 hover:text-white bg-white/5'
                      }`}
                      style={plan.highlight ? undefined : {
                        borderColor: `${plan.color}33`,
                        color: plan.color,
                        background: `${plan.color}05`
                      }}
                    >
                      {plan.cta}
                    </button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
