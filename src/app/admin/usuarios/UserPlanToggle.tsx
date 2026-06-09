'use client'

import { useState, useEffect } from 'react'
import { updateUserPlan } from './actions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function UserPlanToggle({ userId, currentPlanId, userRole }: { userId: string, currentPlanId: string, userRole: string }) {
  const [loading, setLoading] = useState(false)
  // Normalizar planes antiguos para mapearlos a los nuevos (Básico, Premium, Gold)
  const normalizePlanId = (id: string) => {
    const val = (id || '').toLowerCase();
    if (val === 'presencia' || val === 'basico' || val === 'basic') return 'basic';
    if (val === 'impacto' || val === 'premium') return 'premium';
    if (val === 'expansion' || val === 'dominio' || val === 'gold') return 'gold';
    return val || 'basic';
  }

  const initialPlan = normalizePlanId(currentPlanId)
  const [planId, setPlanId] = useState(
    userRole === 'gestor_local' && initialPlan === 'basic' ? 'premium' : initialPlan
  )

  useEffect(() => {
    const normalized = normalizePlanId(currentPlanId)
    if (userRole === 'gestor_local' && normalized === 'basic') {
      setPlanId('premium')
    } else {
      setPlanId(normalized)
    }
  }, [currentPlanId, userRole])

  // Si es anunciante (cliente): automáticamente gratuito y no se puede cambiar
  if (userRole === 'cliente') {
    return (
      <div className="relative inline-block">
        <select
          disabled
          value="basic"
          className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-500 rounded px-2 py-1 outline-none cursor-not-allowed appearance-none pr-8 min-w-[150px] opacity-70"
        >
          <option value="basic">Plan Básico (0€ - Gratis)</option>
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600 text-[10px]">
          🔒
        </div>
      </div>
    )
  }

  // Opciones de planes para gestores de pantallas (Premium y Gold, se elimina Básico)
  const planes = [
    { value: 'premium', label: 'Plan Premium (20€/mes)' },
    { value: 'gold', label: 'Plan Gold (50€/mes)' }
  ]

  // En caso de que sea superadmin u otro rol no especificado, permitimos todas las opciones
  if (userRole !== 'gestor_local') {
    planes.unshift({ value: 'basic', label: 'Plan Básico (0€)' })
  }

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
        className="bg-zinc-800 border border-zinc-700 text-xs text-zinc-100 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-[#7C3CFF] disabled:opacity-50 appearance-none pr-8 min-w-[150px]"
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
