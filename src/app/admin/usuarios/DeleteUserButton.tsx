'use client'

import { useState } from 'react'
import { deleteUser } from './actions'
import { toast } from 'sonner'
import { Trash2, Loader2, Check, X } from 'lucide-react'

export function DeleteUserButton({ 
  userId, 
  userName, 
  isCurrentUser 
}: { 
  userId: string
  userName: string
  isCurrentUser: boolean 
}) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const res = await deleteUser(userId)
    setLoading(false)
    setShowConfirm(false)

    if (res.success) {
      toast.success(`Usuario "${userName}" eliminado con éxito`)
    } else {
      toast.error(res.message || 'Error al eliminar usuario')
    }
  }

  if (isCurrentUser) {
    return (
      <button
        disabled
        title="No puedes eliminar tu propio usuario"
        className="opacity-20 text-zinc-500 cursor-not-allowed p-2 rounded-lg inline-flex items-center justify-center"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    )
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-1.5 justify-end">
        <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider mr-1 animate-pulse">¿Seguro?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex items-center justify-center h-7 w-7 rounded-md bg-red-950/40 border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
          title="Confirmar eliminación"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={loading}
          className="flex items-center justify-center h-7 w-7 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all disabled:opacity-50"
          title="Cancelar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="p-2 rounded-lg bg-red-950/10 border border-red-900/20 text-red-500/70 hover:text-red-400 hover:bg-red-950/30 hover:border-red-900/40 transition-all inline-flex items-center justify-center"
      title="Eliminar usuario"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
