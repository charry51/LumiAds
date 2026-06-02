'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserRole } from './actions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function UserRoleToggle({ userId, currentRole }: { userId: string, currentRole: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState(currentRole)

  useEffect(() => {
    setRole(currentRole)
  }, [currentRole])

  const roles = [
    { value: 'cliente', label: 'Anunciante' },
    { value: 'gestor_local', label: 'Gestor de Pantallas' },
    { value: 'superadmin', label: 'Admin' },
  ]

  async function handleChange(newRole: string) {
    if (newRole === role) return
    const previousRole = role
    
    setLoading(true)
    const res = await updateUserRole(userId, newRole)
    setLoading(false)

    if (res.success && res.profile) {
      setRole(res.profile.rol)
      router.refresh()
      toast.success('Rol actualizado con éxito')
    } else {
      setRole(previousRole)
      toast.error(res.message || 'Error al actualizar')
    }
  }

  return (
    <div className="relative inline-block">
      <select
        value={role}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading}
        className="bg-zinc-800 border border-zinc-700 text-xs text-zinc-100 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-[#7C3CFF] disabled:opacity-50 appearance-none pr-8 min-w-[120px]"
      >
        {roles.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
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
