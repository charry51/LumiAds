'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { LifeBuoy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  countUnreadAdminMessages,
  getTicketLastRead,
  SOPORTE_READ_UPDATED_EVENT,
} from '@/lib/soporte/unread'

type SoporteNotificationBadgeProps = {
  buttonClassName?: string
  label?: string
}

/**
 * Badge en el botón de Soporte Técnico: cuenta respuestas del admin sin leer.
 * El contador baja cuando el usuario abre el ticket (MarkTicketReadOnMount / lista).
 */
export function SoporteNotificationBadge({
  buttonClassName = 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-900 flex gap-2 items-center text-[10px] uppercase font-bold tracking-widest px-3',
  label = 'Soporte Técnico',
}: SoporteNotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const supabaseRef = useRef(createClient())
  const ticketIdsRef = useRef<string[]>([])

  const refreshUnreadCount = useCallback(async () => {
    const supabase = supabaseRef.current
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setUnreadCount(0)
      setIsLoaded(true)
      return
    }

    const { data: tickets } = await supabase
      .from('soporte_tickets')
      .select('id')
      .eq('user_id', user.id)

    const ticketIds = tickets?.map((t) => t.id) ?? []
    ticketIdsRef.current = ticketIds

    if (ticketIds.length === 0) {
      setUnreadCount(0)
      setIsLoaded(true)
      return
    }

    const { data: messages, error } = await supabase
      .from('soporte_mensajes')
      .select('ticket_id, created_at')
      .in('ticket_id', ticketIds)
      .eq('es_admin', true)

    if (error || !messages) {
      setIsLoaded(true)
      return
    }

    setUnreadCount(countUnreadAdminMessages(messages, ticketIds))
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    const supabase = supabaseRef.current
    let channel: ReturnType<typeof supabase.channel> | null = null

    refreshUnreadCount()

    channel = supabase
      .channel('soporte-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'soporte_mensajes',
          filter: 'es_admin=eq.true',
        },
        (payload) => {
          const newMsg = payload.new as { ticket_id: string; created_at: string }
          if (!ticketIdsRef.current.includes(newMsg.ticket_id)) return

          if (newMsg.created_at > getTicketLastRead(newMsg.ticket_id)) {
            setUnreadCount((prev) => prev + 1)
          }
        }
      )
      .subscribe()

    const onReadUpdated = () => refreshUnreadCount()
    window.addEventListener(SOPORTE_READ_UPDATED_EVENT, onReadUpdated)
    window.addEventListener('focus', onReadUpdated)

    return () => {
      if (channel) supabase.removeChannel(channel)
      window.removeEventListener(SOPORTE_READ_UPDATED_EVENT, onReadUpdated)
      window.removeEventListener('focus', onReadUpdated)
    }
  }, [refreshUnreadCount])

  return (
    <Link href="/dashboard/soporte" className="relative">
      <Button variant="outline" className={`${buttonClassName} relative`}>
        <LifeBuoy className="w-3 h-3" />
        {label}
      </Button>

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
