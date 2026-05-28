'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function actualizarSaasScreen(
  pantallaId: string, 
  esPublica: boolean, 
  precioBase: number, 
  simularPagoSuscripcion: boolean = false
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autorizado' }

  // Verify ownership via host
  const { data: hostRecord } = await supabase
    .from('hosts')
    .select('id')
    .eq('perfil_id', user.id)
    .single()
    
  if (!hostRecord) return { success: false, error: 'Host no encontrado' }

  const updates: any = {
    es_publica: esPublica,
    precio_base_impacto: precioBase
  }

  if (simularPagoSuscripcion) {
    updates.suscripcion_saas_activa = true
    updates.tipo_suscripcion_saas = esPublica ? 'hibrida_reducida' : 'privada_pura'
  }

  const adminClient = await createAdminClient()
  const { error } = await adminClient
    .from('pantallas')
    .update(updates)
    .eq('id', pantallaId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}
