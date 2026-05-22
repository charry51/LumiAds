'use client'

import Link from 'next/link'
import { Mail } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type AdminContactNavLinkProps = {
  initialUnreadCount: number
}

export function AdminContactNavLink({ initialUnreadCount }: AdminContactNavLinkProps) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    setUnreadCount(initialUnreadCount)
  }, [initialUnreadCount])

  useEffect(() => {
    const supabase = supabaseRef.current

    const channel = supabase
      .channel('admin-contact-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'contact_messages' },
        (payload) => {
          const row = payload.new as { status?: string }
          if (row.status === 'unread') {
            setUnreadCount((prev) => prev + 1)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'contact_messages' },
        (payload) => {
          const oldRow = payload.old as { status?: string }
          const newRow = payload.new as { status?: string }
          if (oldRow.status === 'unread' && newRow.status !== 'unread') {
            setUnreadCount((prev) => Math.max(0, prev - 1))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'contact_messages' },
        (payload) => {
          const row = payload.old as { status?: string }
          if (row.status === 'unread') {
            setUnreadCount((prev) => Math.max(0, prev - 1))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <Link
      href="/admin/mensajes"
      className="flex items-center justify-between px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-red-500/10 rounded-lg transition-all group"
    >
      <div className="flex items-center gap-3">
        <Mail className="w-4 h-4 text-zinc-500 group-hover:text-red-400 transition-colors" />
        <span className="font-bold tracking-wide">Buzón de Contacto</span>
      </div>
      {unreadCount > 0 ? (
        <span className="bg-red-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      ) : null}
    </Link>
  )
}
