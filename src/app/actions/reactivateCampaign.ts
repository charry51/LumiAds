'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function reactivateCampaign(campaignId: string, additionalBudget: number) {
  try {
    if (additionalBudget <= 0) {
      return { type: 'error', message: 'El importe debe ser mayor a 0.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { type: 'error', message: 'No autenticado.' }
    }

    // 1. Obtener billetera actual
    const { data: profile } = await supabase
      .from('perfiles')
      .select('saldo_billetera')
      .eq('id', user.id)
      .single()

    const currentBalance = parseFloat(profile?.saldo_billetera?.toString() || '0')

    if (currentBalance < additionalBudget) {
      return { type: 'error', message: 'Saldo insuficiente en la billetera.' }
    }

    // 2. Obtener campaña actual
    const { data: campana, error: campanaError } = await supabase
      .from('campanas')
      .select('presupuesto_total, impactos_estimados, precio_pactado')
      .eq('id', campaignId)
      .eq('cliente_id', user.id)
      .single()

    if (campanaError || !campana) {
      return { type: 'error', message: 'Campaña no encontrada.' }
    }

    // 3. Descontar billetera
    const newBalance = currentBalance - additionalBudget
    const { error: walletError } = await supabase
      .from('perfiles')
      .update({ saldo_billetera: newBalance })
      .eq('id', user.id)

    if (walletError) {
      return { type: 'error', message: 'Error al actualizar billetera.' }
    }

    // 4. Actualizar campaña
    const nuevoPresupuesto = Number(campana.presupuesto_total) + additionalBudget
    const precioPactado = Number(campana.precio_pactado) || 0.05
    const nuevosImpactos = Math.floor(additionalBudget / precioPactado)
    const totalImpactosEstimados = Number(campana.impactos_estimados) + nuevosImpactos

    const { error: updateError } = await supabase
      .from('campanas')
      .update({
        presupuesto_total: nuevoPresupuesto,
        impactos_estimados: totalImpactosEstimados,
        estado: 'aprobada'
      })
      .eq('id', campaignId)

    if (updateError) {
      return { type: 'error', message: 'Error al reactivar la campaña.' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/advertiser')
    
    return { type: 'success', message: 'Campaña reactivada con éxito.' }

  } catch (error: any) {
    console.error("Error reactivating campaign:", error)
    return { type: 'error', message: 'Error inesperado.' }
  }
}
