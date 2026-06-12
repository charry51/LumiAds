'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { syncScreenPrice } from '@/lib/yield/sync'

export async function authorizeCampaignStatus(campaignId: string, newStatus: 'aprobada' | 'rechazada') {
  const supabase = await createClient()

  // 1. Seguridad: Solo superadmins pueden autorizar
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
  if (perfil?.rol !== 'superadmin') {
    return { success: false, error: 'Acceso denegado: Se requiere rol de administrador' }
  }

  // 2. Obtener datos de la campaña
  const { data: campana } = await supabase
    .from('campanas')
    .select('id, pantalla_id, nombre_campana')
    .eq('id', campaignId)
    .single()

  // 3. Actualizar el estado de la campaña
  const { error } = await supabase
    .from('campanas')
    .update({ estado: newStatus })
    .eq('id', campaignId)

  if (error) {
    console.error("Error actualizando campaña:", error)
    return { success: false, error: error.message }
  }

  // 4. Lógica de Monetización para Hosts (Revenue Share)
  if (newStatus === 'aprobada' && campana?.pantalla_id) {
    try {
      const { data: host } = await supabase
        .from('hosts')
        .select('id, porcentaje, saldo_pendiente')
        .eq('pantalla_id', campana.pantalla_id)
        .single()

      if (host) {
        const { data: pantalla } = await supabase
          .from('pantallas')
          .select('precio_emision')
          .eq('id', campana.pantalla_id)
          .single()

        const precioBase = pantalla?.precio_emision || 50.00
        const comisionImporte = precioBase * (host.porcentaje / 100)

        // Registrar Comisión (Nuevo Esquema)
        await supabase.from('comisiones').insert({
          host_id: host.id,
          campana_id: campaignId,
          pantalla_id: campana.pantalla_id,
          importe_total: precioBase,
          comision: comisionImporte,
          porcentaje: host.porcentaje,
          estado: 'pendiente'
        })

        // Incrementar saldo del Host
        await supabase
          .from('hosts')
          .update({ saldo_pendiente: (host.saldo_pendiente || 0) + comisionImporte })
          .eq('id', host.id)
      }
    } catch (e) {
      console.error('[Revenue Error]', e)
    }
  }

  if (campana?.pantalla_id) {
    await syncScreenPrice(campana.pantalla_id)
  }

  revalidatePath('/admin')
  revalidatePath('/admin/campanas')
  revalidatePath('/dashboard')

  return { success: true }
}
