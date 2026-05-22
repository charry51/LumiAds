export const SOPORTE_READ_UPDATED_EVENT = 'soporte-read-updated'
const LAST_READ_KEY_PREFIX = 'soporte_last_read_ts'

export function ticketReadStorageKey(ticketId: string) {
  return `${LAST_READ_KEY_PREFIX}_${ticketId}`
}

export function getTicketLastRead(ticketId: string): string {
  if (typeof window === 'undefined') return new Date(0).toISOString()
  return localStorage.getItem(ticketReadStorageKey(ticketId)) || new Date(0).toISOString()
}

export function markTicketAsRead(ticketId: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(ticketReadStorageKey(ticketId), new Date().toISOString())
  window.dispatchEvent(
    new CustomEvent(SOPORTE_READ_UPDATED_EVENT, { detail: { ticketId } })
  )
}

export function countUnreadAdminMessages(
  messages: { ticket_id: string; created_at: string }[],
  ticketIds: string[]
): number {
  const counts = ticketIds.reduce<Record<string, number>>((acc, id) => {
    acc[id] = 0
    return acc
  }, {})

  messages.forEach((message) => {
    if (!ticketIds.includes(message.ticket_id)) return
    const lastRead = getTicketLastRead(message.ticket_id)
    if (message.created_at > lastRead) {
      counts[message.ticket_id] = (counts[message.ticket_id] || 0) + 1
    }
  })

  return Object.values(counts).reduce((sum, n) => sum + n, 0)
}
