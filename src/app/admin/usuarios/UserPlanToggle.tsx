'use client'

import { useState } from 'react'
import { updateUserPlan } from './actions'
import { toast } from 'sonner'
import { ChevronDown, Loader2 } from 'lucide-react'

export function UserPlanToggle({ userId, currentPlanId }: { userId: string, currentPlanId: string }) {
  const [loading, setLoading] = useState(false)

  const normalizePlanId = (id: string) => {
    const val = (id || '').toLowerCase()
    if (val === 'impacto' || val === 'premium') return 'premium'
    if (val === 'expansion' || val === 'dominio' || val === 'gold') return 'gold'
    return ''
  }

  const [planId, setPlanId] = useState(normalizePlanId(currentPlanId))

  const planes = [
    { value: 'premium', label: 'Plan Premium (20 EUR/mes)' },
    { value: 'gold', label: 'Plan Gold (50 EUR/mes)' },
  ]

  async function handleChange(newPlanId: string) {
    if (!newPlanId || newPlanId === planId) return

    setLoading(true)
    const res = await updateUserPlan(userId, newPlanId)
    setLoading(false)

    if (res.success) {
      setPlanId(newPlanId)
      toast.success('Plan actualizado con exito')
    } else {
      toast.error(res.message || 'Error al actualizar plan')
      setPlanId(planId)
    }
  }

  return (
    <div className="relative inline-block">
      <select
        value={planId}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading}
        className="bg-zinc-800 border border-zinc-700 text-xs text-zinc-100 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 appearance-none pr-8 min-w-[170px]"
      >
        {!planId && (
          <option value="" disabled>
            Selecciona plan
          </option>
        )}
        {planes.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />
        ) : (
          <ChevronDown className="h-3 w-3 text-zinc-500" />
        )}
      </div>
    </div>
  )
}
