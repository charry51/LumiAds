'use client'

import { useEffect } from 'react'
import { markTicketAsRead } from '@/lib/soporte/unread'

export function MarkTicketReadOnMount({ ticketId }: { ticketId: string }) {
  useEffect(() => {
    markTicketAsRead(ticketId)
  }, [ticketId])

  return null
}
