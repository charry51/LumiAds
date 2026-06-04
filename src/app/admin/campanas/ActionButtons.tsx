'use client'

import { Button } from '@/components/ui/button'
import { authorizeCampaignStatus } from './actions'
import { deleteCampaign } from '@/app/dashboard/actions'
import { toast } from 'sonner'
import { useState } from 'react'
import { Trash2, Check, X } from 'lucide-react'

export function ActionButtons({ campanaId, estado }: { campanaId: string, estado?: string }) {
  const [loading, setLoading] = useState(false)

  const handleAction = async (status: 'aprobada' | 'rechazada') => {
    setLoading(true)
    const result = await authorizeCampaignStatus(campanaId, status)
    
    if (result.success) {
      toast.success(`Campaña ${status} correctamente`)
    } else {
      toast.error(result.error || 'Hubo un problema al procesar la acción')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm('¿Seguro que quieres borrar esta campaña definitivamente?')) return
    setLoading(true)
    const result = await deleteCampaign(campanaId)
    if (result.success) {
      toast.success('Campaña eliminada')
    } else {
      toast.error('Error al borrar')
    }
    setLoading(false)
  }

  const isPending = estado === 'pendiente_aprobacion' || 
                    estado === 'pre_aprobada' || 
                    estado === 'revision_manual_ia'

  return (
    <div className="flex gap-2 items-center justify-end">
      {isPending && (
        <>
          <Button 
            size="sm" 
            className="bg-green-600 hover:bg-green-700 text-white h-8 px-3 text-[10px] font-bold uppercase tracking-widest"
            onClick={() => handleAction('aprobada')}
            disabled={loading}
          >
            <Check className="w-3 h-3 mr-1" /> Aprobar
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className="text-red-500 border-red-500/20 hover:bg-red-500/10 h-8 px-3 text-[10px] font-bold uppercase tracking-widest"
            onClick={() => handleAction('rechazada')}
            disabled={loading}
          >
            <X className="w-3 h-3 mr-1" /> Rechazar
          </Button>
        </>
      )}
      <Button 
        size="sm" 
        variant="ghost"
        className="text-zinc-500 hover:text-red-500 hover:bg-red-500/5 transition-colors p-2 h-8 w-8"
        onClick={handleDelete}
        disabled={loading}
        title="Eliminar campana"
        aria-label="Eliminar campana"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}
