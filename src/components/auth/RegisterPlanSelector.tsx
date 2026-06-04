'use client'

import { useEffect, useState } from 'react'
import { Megaphone, Monitor } from 'lucide-react'

type PlanRole = 'anunciante' | 'host'

const planOptions = [
  {
    value: 'anunciante' as const,
    label: 'Anunciante',
    badge: 'Crear campañas',
    description: 'Entras directo al panel de anunciante. No necesitas elegir un plan.',
    accent: 'border-lumi-blue/50 bg-lumi-blue/10',
    icon: Megaphone,
  },
  {
    value: 'host' as const,
    label: 'Gestor de Pantallas',
    badge: 'Monetizar pantallas',
    description: 'Después del registro eliges Premium o Gold y conectas tus pantallas.',
    accent: 'border-[#7C3CFF]/50 bg-[#7C3CFF]/10',
    icon: Monitor,
  },
]

export function RegisterPlanSelector({ defaultRole }: { defaultRole: PlanRole }) {
  const [selectedPlan, setSelectedPlan] = useState<PlanRole>(defaultRole)

  useEffect(() => {
    setSelectedPlan(defaultRole)
  }, [defaultRole])

  return (
    <div className="space-y-3 mt-2">
      <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 ml-1">
        Quiero registrarme como
      </p>

      <input type="hidden" name="plan_principal" value={selectedPlan} />

      <div className="grid grid-cols-1 gap-3">
        {planOptions.map((plan) => {
          const isSelected = selectedPlan === plan.value
          const Icon = plan.icon

          return (
            <button
              key={plan.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedPlan(plan.value)}
              className={`rounded-xl border p-4 text-left transition-all ${
                isSelected
                  ? plan.accent
                  : 'border-white/5 bg-black/40 hover:bg-white/5'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                    isSelected ? 'border-white/20 bg-black/20 text-white' : 'border-white/10 bg-white/5 text-zinc-400'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold text-white uppercase tracking-widest">
                      {plan.label}
                    </p>
                    <p className="mt-2 text-[12px] text-white font-medium">{plan.badge}</p>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] ${
                    isSelected
                      ? 'bg-black/30 text-white'
                      : 'bg-white/5 text-zinc-300'
                  }`}
                >
                  {isSelected ? 'Seleccionado' : 'Disponible'}
                </span>
              </div>
              <p className="mt-3 text-[11px] text-zinc-400 leading-relaxed">
                {plan.description}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
