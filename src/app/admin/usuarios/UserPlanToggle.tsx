'use client'

import { useState } from 'react'
import { updateUserPlan } from './actions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function UserPlanToggle({ userId, currentPlanId, userRole }: {
  userId: string
  currentPlanId: string
  userRole: string
}) {
  const [loading, setLoading] = useState(false)
  const [planId, setPlanId] = useState(currentPlanId || 'basic')

  // ── ANUNCIANTE: solo plan gratuito, bloqueado ──────────────────────────────
  if (userRole === 'cliente') {
    return (
      <div className="relative inline-block">
        <select
          disabled
          value="basic"
          className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-500 rounded px-2 py-1 outline-none cursor-not-allowed appearance-none pr-8 min-w-[160px] opacity-70"
        >
          <option value="basic">Plan Básico (0€ – Gratis)</option>
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600 text-[10px]">
          🔒
        </div>
      </div>
    )
  }

  // ── GESTOR DE PANTALLAS: solo Premium y Gold ──────────────────────────────
  if (userRole === 'gestor_local') {
    const validPlan = planId === 'gold' ? 'gold' : 'premium'

    async function handleChange(newPlan: string) {
      setLoading(true)
      const res = await updateUserPlan(userId, newPlan)
      setLoading(false)
      if (res.success) {
        setPlanId(newPlan)
        toast.success('Plan actualizado')
      } else {
        toast.error(res.message || 'Error al actualizar plan')
      }
    }

    return (
      <div className="relative inline-block">
        <select
          value={validPlan}
          onChange={(e) => handleChange(e.target.value)}
          disabled={loading}
          className="bg-zinc-800 border border-zinc-700 text-xs text-zinc-100 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-[#7C3CFF] disabled:opacity-50 appearance-none pr-8 min-w-[160px]"
        >
          <option value="premium">Plan Premium (20€/mes)</option>
          <option value="gold">Plan Gold (50€/mes)</option>
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading ? <Loader2 className="h-3 w-3 animate-spin text-zinc-500" /> : <div className="text-zinc-500">▼</div>}
        </div>
      </div>
    )
  }

  // ── SUPERADMIN u otros roles: las 3 opciones ──────────────────────────────
  async function handleChange(newPlan: string) {
    setLoading(true)
    const res = await updateUserPlan(userId, newPlan)
    setLoading(false)
    if (res.success) {
      setPlanId(newPlan)
      toast.success('Plan actualizado')
    } else {
      toast.error(res.message || 'Error al actualizar plan')
    }
  }

  return (
    <div className="relative inline-block">
      <select
        value={planId}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading}
        className="bg-zinc-800 border border-zinc-700 text-xs text-zinc-100 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-[#7C3CFF] disabled:opacity-50 appearance-none pr-8 min-w-[160px]"
      >
        <option value="basic">Plan Básico (0€)</option>
        <option value="premium">Plan Premium (20€/mes)</option>
        <option value="gold">Plan Gold (50€/mes)</option>
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        {loading ? <Loader2 className="h-3 w-3 animate-spin text-zinc-500" /> : <div className="text-zinc-500">▼</div>}
      </div>
    </div>
  )
}
