'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function resolveRoleRequest(ticketId: string, action: 'approve' | 'reject', userId: string, role: string, requestType: string) {
  const adminClient = await createAdminClient()

  if (action === 'approve') {
    // Determine the boolean update
    const esActive = requestType.toLowerCase() === 'alta'
    const roleKey = role.toLowerCase() === 'anunciante' ? 'es_anunciante' : 'es_host'

    // Update the user's profile
    const { error: profileError } = await adminClient
      .from('perfiles')
      .update({ [roleKey]: esActive })
      .eq('id', userId)

    if (profileError) return { success: false, error: profileError.message }
  }

  // Update the ticket status
  const { error: ticketError } = await adminClient
    .from('soporte_tickets')
    .update({ 
      estado: action === 'approve' ? 'RESUELTO' : 'RECHAZADO'
    })
    .eq('id', ticketId)

  if (ticketError) return { success: false, error: ticketError.message }

  revalidatePath('/admin')
  return { success: true }
}
