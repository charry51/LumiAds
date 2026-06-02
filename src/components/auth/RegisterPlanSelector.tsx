'use client'

import { useEffect, useState } from 'react'

type PlanRole = 'anunciante' | 'host'

const planOptions = [
  {
    value: 'anunciante' as const,
    label: 'Anunciante',
    badge: 'Crear campanas',
    description: 'Registrate para crear anuncios. No necesitas elegir un plan de pantallas.',
    accent: 'border-lumi-blue/50 bg-lumi-blue/10',
  },
  {
    value: 'host' as const,
    label: 'Gestor de Pantallas',
    badge: 'Monetizar pantallas',
    description: 'Registrate como gestor y despues elige Basico, Premium o Gold.',
    accent: 'border-[#7C3CFF]/50 bg-[#7C3CFF]/10',
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
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-bold text-white uppercase tracking-widest">
                  {plan.label}
                </p>
                <span
                  className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] ${
                    isSelected
                      ? 'bg-black/30 text-white'
                      : 'bg-white/5 text-zinc-300'
                  }`}
                >
                  {isSelected ? 'Seleccionado' : 'Disponible'}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-white font-medium">{plan.badge}</p>
              <p className="mt-1 text-[9px] text-zinc-500 leading-tight">
                {plan.description}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
