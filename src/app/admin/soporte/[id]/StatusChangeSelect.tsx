'use client'

import * as React from 'react'
import { useState } from 'react'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { updateTicketStatus, TicketStatus } from '@/app/actions/support'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function StatusChangeSelect({ ticketId, currentStatus }: { ticketId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(currentStatus)

  const handleStatusChange = async (newStatus: TicketStatus) => {
    setLoading(true)
    const res = await updateTicketStatus(ticketId, newStatus)
    
    if (res.success) {
      setStatus(newStatus)
      toast.success(`Estado actualizado a ${newStatus}`)
    } else {
      toast.error(res.error || 'Error al actualizar estado')
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-2">
      {loading && <Loader2 className="w-4 h-4 animate-spin text-[#7C3CFF]" />}
      <Select 
        defaultValue={status} 
        onValueChange={(val) => handleStatusChange(val as TicketStatus)}
        disabled={loading}
      >
        <SelectTrigger className={`w-[180px] h-10 border-zinc-800 font-bold text-[10px] uppercase tracking-widest transition-all ${
           status === 'PENDIENTE' ? '!bg-amber-500 !text-black hover:!bg-amber-600' :
           status === 'EN_PROCESO' ? '!bg-[#7C3CFF] !text-black hover:!bg-[#6b30f2] shadow-[0_0_15px_rgba(124,60,255,0.2)]' :
           status === 'RESUELTO' ? '!bg-green-500 !text-black hover:!bg-green-600' :
           '!bg-zinc-800 !text-zinc-300 hover:!bg-zinc-700'
        }`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
          <SelectItem value="PENDIENTE" className="text-[10px] uppercase font-black">Pendiente</SelectItem>
          <SelectItem value="EN_PROCESO" className="text-[10px] uppercase font-black">En Proceso</SelectItem>
          <SelectItem value="RESUELTO" className="text-[10px] uppercase font-black">Resuelto</SelectItem>
          <SelectItem value="CERRADO" className="text-[10px] uppercase font-black">Cerrado</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
