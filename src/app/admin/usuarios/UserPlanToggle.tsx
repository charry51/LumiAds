'use client'

import { useState } from 'react'
import { updateUserPlan } from './actions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function UserPlanToggle({ userId, currentPlanId }: { userId: string, currentPlanId: string }) {
  const [loading, setLoading] = useState(false)
  // Normalizar planes antiguos para mapearlos a los nuevos (Básico, Premium, Gold)
  const normalizePlanId = (id: string) => {
    const val = (id || '').toLowerCase();
    if (val === 'presencia' || val === 'basico' || val === 'basic') return 'basic';
    if (val === 'impacto' || val === 'premium') return 'premium';
    if (val === 'expansion' || val === 'dominio' || val === 'gold') return 'gold';
    return val || 'basic';
  }

  const [planId, setPlanId] = useState(normalizePlanId(currentPlanId))

  // Opciones de planes comerciales (Básico, Premium, Gold)
  const planes = [
    { value: 'basic', label: 'Plan Básico (0€)' },
    { value: 'premium', label: 'Plan Premium (20€/mes)' },
    { value: 'gold', label: 'Plan Gold (50€/mes)' }
  ]

  async function handleChange(newPlanId: string) {
    if (newPlanId === planId) return
    
    setLoading(true)
    const res = await updateUserPlan(userId, newPlanId)
    setLoading(false)

    if (res.success) {
      setPlanId(newPlanId)
      toast.success('Plan actualizado con éxito')
    } else {
      toast.error(res.message || 'Error al actualizar plan')
      setPlanId(planId) // Revertir en caso de error
    }
  }

  return (
    <div className="relative inline-block">
      <select
        value={planId}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading}
        className="bg-zinc-800 border border-zinc-700 text-xs text-zinc-100 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 appearance-none pr-8 min-w-[150px]"
      >
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
          <div className="text-zinc-500">▼</div>
        )}
      </div>
    </div>
  )
}
