'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleUserRole(role: 'anunciante' | 'host', active: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autorizado' }

  // Asegurarnos de que el usuario no se quede sin ningún rol
  if (!active) {
    const { data: profile } = await supabase
      .from('perfiles')
      .select('es_anunciante, es_host')
      .eq('id', user.id)
      .single()
      
    if (profile) {
      if (role === 'anunciante' && !profile.es_host) {
        return { success: false, error: 'Debes tener al menos un rol activo en la plataforma.' }
      }
      if (role === 'host' && !profile.es_anunciante) {
        return { success: false, error: 'Debes tener al menos un rol activo en la plataforma.' }
      }
    }
  }

  const updates = role === 'anunciante' ? { es_anunciante: active } : { es_host: active }

  const { error } = await supabase
    .from('perfiles')
    .update(updates)
    .eq('id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/perfil')
  revalidatePath('/dashboard')
  
  return { success: true }
}

export async function requestUserRole(role: string, requestType: 'Alta' | 'Baja') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autorizado' }

  const asunto = `Solicitud de ${requestType} de Rol: ${role}`
  const descripcion = `El usuario ha solicitado de forma automatizada dar de ${requestType.toLowerCase()} su perfil como ${role}.`

  const { data: ticket, error: ticketErr } = await supabase
    .from('soporte_tickets')
    .insert({
      user_id: user.id,
      categoria: 'GESTION_CUENTA',
      prioridad: 'ALTA',
      asunto: asunto,
      estado: 'PENDIENTE'
    })
    .select()
    .single()

  if (ticketErr) return { success: false, error: ticketErr.message }

  const { error: msgErr } = await supabase
    .from('soporte_mensajes')
    .insert({
      ticket_id: ticket.id,
      remitente_id: user.id,
      mensaje: descripcion,
      es_admin: false
    })

  if (msgErr) return { success: false, error: msgErr.message }

  return { success: true }
}
