'use client'

import { useState } from 'react'
import { updatePantallaPlan } from './actions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function PantallaPlanToggle({ pantallaId, currentPlan }: { pantallaId: string, currentPlan: string }) {
  const [loading, setLoading] = useState(false)
  const normalizedPlan = (currentPlan || '').toLowerCase()
  // Si el plan actual es básico o nulo, forzamos a mostrar 'premium' ya que eliminamos el gratuito
  const [plan, setPlan] = useState(normalizedPlan === 'gold' ? 'gold' : 'premium')

  const planes = [
    { value: 'premium', label: 'Plan Premium (20€)' },
    { value: 'gold', label: 'Plan Gold (50€)' }
  ]

  async function handleChange(newPlan: string) {
    if (newPlan === plan) return
    
    setLoading(true)
    const res = await updatePantallaPlan(pantallaId, newPlan)
    setLoading(false)

    if (res.success) {
      setPlan(newPlan)
      toast.success('Plan de pantalla actualizado con éxito')
    } else {
      toast.error(res.error || 'Error al actualizar plan')
    }
  }

  return (
    <div className="relative inline-block">
      <select
        value={plan}
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
