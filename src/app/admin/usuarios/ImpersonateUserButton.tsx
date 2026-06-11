'use client'

import { useState } from 'react'
import { impersonateUser } from './actions'
import { toast } from 'sonner'
import { LogIn, Loader2 } from 'lucide-react'

export function ImpersonateUserButton({ 
  userId, 
  userName, 
  userRole,
  isCurrentUser 
}: { 
  userId: string
  userName: string
  userRole: string
  isCurrentUser: boolean 
}) {
  const [loading, setLoading] = useState(false)

  async function handleImpersonate() {
    setLoading(true)
    toast.loading(`Generando enlace de acceso para "${userName}"...`, { id: 'impersonate-toast' })
    
    try {
      const res = await impersonateUser(userId)
      
      if (res.success && res.redirectUrl) {
        toast.success(`Acceso concedido. Redirigiendo a la cuenta de "${userName}"...`, { id: 'impersonate-toast' })
        // Redirigir a través del enlace de Supabase
        window.location.href = res.redirectUrl
      } else {
        toast.error(res.message || 'Error al intentar acceder a la cuenta', { id: 'impersonate-toast' })
        setLoading(false)
      }
    } catch (err: any) {
      toast.error(err.message || 'Error inesperado', { id: 'impersonate-toast' })
      setLoading(false)
    }
  }

  if (isCurrentUser) {
    return (
      <button
        disabled
        title="Ya estás en tu sesión"
        className="opacity-20 text-zinc-500 cursor-not-allowed p-2 rounded-lg inline-flex items-center justify-center mr-2"
      >
        <LogIn className="h-4 w-4" />
      </button>
    )
  }

  return (
    <button
      onClick={handleImpersonate}
      disabled={loading}
      className="p-2 rounded-lg bg-indigo-950/10 border border-indigo-900/20 text-indigo-500/70 hover:text-indigo-400 hover:bg-indigo-950/30 hover:border-indigo-900/40 transition-all inline-flex items-center justify-center mr-2 disabled:opacity-50 disabled:cursor-not-allowed"
      title={`Acceder a la cuenta de ${userName} sin contraseña`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogIn className="h-4 w-4" />
      )}
    </button>
  )
}
