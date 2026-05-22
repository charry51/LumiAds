'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { LifeBuoy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Clave en localStorage para persistir el timestamp de última lectura
const LAST_READ_KEY = 'soporte_last_read_ts'

/**
 * SoporteNotificationBadge
 * 
 * Muestra un botón de "Soporte Técnico" con un badge rojo dinámico
 * que indica cuántos mensajes nuevos del administrador hay sin leer.
 * 
 * Comportamiento:
 * - Al montar, consulta los mensajes de admin posteriores al último timestamp leído.
 * - Se suscribe a Supabase Realtime para recibir nuevos mensajes en tiempo real.
 * - El badge desaparece (reset a 0) al hacer clic y entrar en la interfaz de soporte.
 * - Si el usuario sale y el admin vuelve a escribir, el contador reinicia desde 1.
 */
export function SoporteNotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const supabaseRef = useRef(createClient())

  /**
   * Obtiene el timestamp de la última lectura del usuario desde localStorage.
   * Si nunca ha leído, retorna la epoch (1970) para contar TODOS los mensajes admin.
   */
  const getLastReadTimestamp = useCallback((): string => {
    if (typeof window === 'undefined') return new Date(0).toISOString()
    const stored = localStorage.getItem(LAST_READ_KEY)
    return stored || new Date(0).toISOString()
  }, [])

  /**
   * Marca como leído: guarda el timestamp actual en localStorage
   * y resetea el contador visual a 0.
   */
  const markAsRead = useCallback(() => {
    localStorage.setItem(LAST_READ_KEY, new Date().toISOString())
    setUnreadCount(0)
  }, [])

  useEffect(() => {
    const supabase = supabaseRef.current
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function init() {
      // 1. Obtener usuario autenticado
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoaded(true)
        return
      }

      // 2. Obtener todos los ticket IDs del usuario
      const { data: tickets } = await supabase
        .from('soporte_tickets')
        .select('id')
        .eq('user_id', user.id)

      if (!tickets || tickets.length === 0) {
        setIsLoaded(true)
        return
      }

      const ticketIds = tickets.map(t => t.id)
      const lastRead = getLastReadTimestamp()

      // 3. Contar mensajes admin no leídos (posteriores al último timestamp leído)
      const { count } = await supabase
        .from('soporte_mensajes')
        .select('*', { count: 'exact', head: true })
        .in('ticket_id', ticketIds)
        .eq('es_admin', true)
        .gt('created_at', lastRead)

      setUnreadCount(count || 0)
      setIsLoaded(true)

      // 4. Suscribirse a Supabase Realtime para nuevos mensajes
      //    Escuchamos INSERT en soporte_mensajes donde es_admin = true
      channel = supabase
        .channel('soporte-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'soporte_mensajes',
            filter: 'es_admin=eq.true'
          },
          (payload) => {
            // Solo incrementar si el mensaje pertenece a un ticket del usuario
            const newMsg = payload.new as { ticket_id: string; es_admin: boolean }
            if (ticketIds.includes(newMsg.ticket_id)) {
              setUnreadCount(prev => prev + 1)
            }
          }
        )
        .subscribe()
    }

    init()

    // Cleanup: desuscribirse al desmontar el componente
    return () => {
      if (channel) {
        supabaseRef.current.removeChannel(channel)
      }
    }
  }, [getLastReadTimestamp])

  return (
    <Link 
      href="/dashboard/soporte" 
      className="relative"
      onClick={markAsRead}
    >
      <Button
        variant="outline"
        className="border-border hover:bg-muted flex gap-2 items-center text-[10px] uppercase font-bold tracking-widest px-3 relative"
      >
        <LifeBuoy className="w-3 h-3" />
        Soporte Técnico
      </Button>

      {/* Badge rojo con contador de mensajes no leídos */}
      {isLoaded && unreadCount > 0 && (
        <span
          className="soporte-badge"
          aria-label={`${unreadCount} mensaje${unreadCount > 1 ? 's' : ''} sin leer`}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
