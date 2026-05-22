'use client'

import { useEffect } from 'react'

const LAST_READ_KEY = 'soporte_last_read_ts'

export function MarkTicketReadOnMount({ ticketId }: { ticketId: string }) {
  useEffect(() => {
    localStorage.setItem(`${LAST_READ_KEY}_${ticketId}`, new Date().toISOString())
  }, [ticketId])

  return null
}
