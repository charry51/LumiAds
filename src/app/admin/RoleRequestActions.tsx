'use client'

import { Button } from '@/components/ui/button'
import { Loader2, Check, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { resolveRoleRequest } from './actions'

export function RoleRequestActions({ ticketId, role, userId, requestType }: { ticketId: string, role: string, userId: string, requestType: string }) {
  const [loading, setLoading] = useState(false)

  const handleAction = async (action: 'approve' | 'reject') => {
    setLoading(true)
    const res = await resolveRoleRequest(ticketId, action, userId, role, requestType)
    if (res.success) {
      toast.success(action === 'approve' ? 'Solicitud aprobada' : 'Solicitud rechazada')
    } else {
      toast.error(res.error || 'Error al procesar')
    }
    setLoading(false)
  }

  if (loading) {
     return <Loader2 className="w-4 h-4 animate-spin mx-auto text-red-500" />
  }

  return (
    <div className="flex gap-2 justify-end">
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => handleAction('approve')}
        className="h-8 w-8 bg-green-950/20 border-green-900/50 text-green-500 hover:bg-green-900 hover:text-white"
      >
        <Check className="w-4 h-4" />
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => handleAction('reject')}
        className="h-8 w-8 bg-red-950/20 border-red-900/50 text-red-500 hover:bg-red-900 hover:text-white"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}
