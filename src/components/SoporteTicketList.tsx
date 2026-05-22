'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronRight, Clock, MessageSquare } from 'lucide-react'

const LAST_READ_KEY = 'soporte_last_read_ts'

type Ticket = {
  id: string
  estado: string
  categoria: string
  asunto: string
  prioridad: string
  created_at: string
  soporte_mensajes?: { count: number }[]
}

export function SoporteTicketList({ tickets }: { tickets: Ticket[] }) {
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const supabaseRef = useRef(createClient())
  const ticketIds = useMemo(() => tickets.map((ticket) => ticket.id), [tickets])

  const storageKey = useCallback((ticketId: string) => `${LAST_READ_KEY}_${ticketId}`, [])

  const loadUnreadCounts = useCallback(async () => {
    if (ticketIds.length === 0) {
      setUnreadCounts({})
      return
    }

    const { data, error } = await supabaseRef.current
      .from('soporte_mensajes')
      .select('ticket_id, created_at')
      .in('ticket_id', ticketIds)
      .eq('es_admin', true)

    if (error || !data) return

    const counts = ticketIds.reduce<Record<string, number>>((acc, id) => {
      acc[id] = 0
      return acc
    }, {})

    data.forEach((message) => {
      const lastRead = localStorage.getItem(storageKey(message.ticket_id)) || new Date(0).toISOString()
      if (message.created_at > lastRead) {
        counts[message.ticket_id] = (counts[message.ticket_id] || 0) + 1
      }
    })

    setUnreadCounts(counts)
  }, [storageKey, ticketIds])

  useEffect(() => {
    loadUnreadCounts()
  }, [loadUnreadCounts])

  useEffect(() => {
    if (ticketIds.length === 0) return

    const channel = supabaseRef.current
      .channel('soporte-ticket-unread')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'soporte_mensajes',
          filter: 'es_admin=eq.true'
        },
        (payload) => {
          const newMessage = payload.new as { ticket_id: string }
          if (!ticketIds.includes(newMessage.ticket_id)) return

          setUnreadCounts((prev) => ({
            ...prev,
            [newMessage.ticket_id]: (prev[newMessage.ticket_id] || 0) + 1
          }))
        }
      )
      .subscribe()

    return () => {
      if (channel) supabaseRef.current.removeChannel(channel)
    }
  }, [ticketIds])

  const markTicketAsRead = useCallback((ticketId: string) => {
    localStorage.setItem(storageKey(ticketId), new Date().toISOString())
    setUnreadCounts((prev) => ({ ...prev, [ticketId]: 0 }))
  }, [storageKey])

  return (
    <div className="grid grid-cols-1 gap-4">
      {tickets.map((ticket) => {
        const unread = unreadCounts[ticket.id] || 0

        return (
          <Link
            key={ticket.id}
            href={`/dashboard/soporte/${ticket.id}`}
            className="group block"
            onClick={() => markTicketAsRead(ticket.id)}
          >
            <div className="relative cyber-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#7C3CFF]/50 transition-all duration-300">
              {unread > 0 && (
                <span className="absolute top-4 right-4 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-destructive text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-lg shadow-black/20 border border-white/10">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-tighter ${
                    ticket.estado === 'PENDIENTE'
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                      : ticket.estado === 'EN_PROCESO'
                      ? 'bg-[#7C3CFF]/20 text-[#7C3CFF] border border-[#7C3CFF]/30'
                      : ticket.estado === 'RESUELTO'
                      ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {ticket.estado.replace('_', ' ')}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-tighter">ID: {ticket.id.slice(0, 8)}</span>
                  <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">• {ticket.categoria}</span>
                </div>

                <h3 className="text-lg font-heading text-white uppercase group-hover:text-[#7C3CFF] transition-colors">{ticket.asunto}</h3>

                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono uppercase">
                    <Clock className="w-3 h-3" />
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono uppercase">
                    <MessageSquare className="w-3 h-3 text-[#7C3CFF]" />
                    {ticket.soporte_mensajes?.[0]?.count || 0} Mensajes
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right hidden md:block">
                  <p className="text-[8px] text-zinc-600 uppercase tracking-widest mb-1">Prioridad</p>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${
                    ticket.prioridad === 'URGENTE' ? 'text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' :
                    ticket.prioridad === 'ALTA' ? 'text-amber-500' :
                    'text-zinc-500'
                  }`}>
                    {ticket.prioridad}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-700 group-hover:text-[#7C3CFF] group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
