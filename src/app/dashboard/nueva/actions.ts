'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import crypto from 'node:crypto'
import { analyzeVideo } from '@/lib/ia/validator'

export type CampaignData = {
  nombre_campana: string
  fecha_inicio: string
  fecha_fin: string
  video_url: string
  hora_inicio: string
  hora_fin: string
  pantalla_id: string
  pantalla_idsRaw: string
  pantalla_weights?: string
  presupuesto_total?: number
  prioridad?: number
  impactos_estimados?: number
  duracion_segundos?: number
  dias_semana?: number[]
}

export async function createCampaign(data: CampaignData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { type: 'error', message: 'No estás autenticado.' }
    }

    const nombreCampana = data.nombre_campana
    const fechaInicio = data.fecha_inicio
    const fechaFin = data.fecha_fin
    const publicUrl = data.video_url
    
    // Dayparting Logic: Only 'expansion' or 'dominio' can custom times
    let horaInicio = data.hora_inicio || '00:00:00'
    let horaFin = data.hora_fin || '23:59:59'
    
    // Obtener plan para restricción (necesario antes de procesar)
    const { data: profile } = await supabase
      .from('perfiles')
      .select('*, planes(*)')
      .eq('id', user.id)
      .single()

    const planId = profile?.planes?.id || 'presencia'
    const canDaypart = planId === 'expansion' || planId === 'dominio'

    if (!canDaypart) {
      horaInicio = '00:00:00'
      horaFin = '23:59:59'
    }
    const pantallaId = data.pantalla_id
    const pantallaIdsRaw = data.pantalla_idsRaw // Nuevo campo opcional para múltiple selección
    const pantallaWeightsRaw = data.pantalla_weights // JSON string with weights

    const pantallaIds = pantallaIdsRaw ? pantallaIdsRaw.split(',') : [pantallaId]
    
    let weightsMap: Record<string, number> = {}
    if (pantallaWeightsRaw) {
      try {
        weightsMap = JSON.parse(pantallaWeightsRaw)
      } catch (e) {
        console.error('Error parsing pantalla_weights:', e)
      }
    }
    
    const totalWeight = pantallaIds.reduce((sum: number, id: string) => sum + (weightsMap[id] || 1), 0)

    if (!nombreCampana || !fechaInicio || !fechaFin || (pantallaIds.length === 0 && !pantallaId) || !publicUrl) {
      return { type: 'error', message: 'Por favor, completa todos los campos requeridos.' }
    }

    // --- NUEVO: Validación de Duración (5s - 30s) ---
    const duracion = data.duracion_segundos || 10
    if (duracion < 5 || duracion > 30) {
       return { type: 'error', message: 'La duración del anuncio debe estar entre 5 y 30 segundos.' }
    }
    // -----------------------------------------------

    // LuminAdd v2: Límite de campañas basado en presupuesto, no en suscripciones fijas.
    // (Hemos eliminado las restricciones temporales de planes limitantes para asentar Programmatic)
    const totalNew = pantallaIds.length

    // 3. IA SCAN (Brain integration) - Ahora lo hace sobre la URL recibida
    const iaResult = await analyzeVideo(publicUrl, duracion)
    let finalEstado = 'pendiente_aprobacion'
    
    if (iaResult.status === 'safe') {
      finalEstado = 'pre_aprobada'
    } else if (iaResult.status === 'flagged') {
      finalEstado = 'revision_manual_ia'
    } else if (iaResult.status === 'rejected') {
      finalEstado = 'rechazada_ia'
    }

    // 4. Obtener datos de las pantallas (para precio y organización)
    const { data: screensData } = await supabase
      .from('pantallas')
      .select('id, precio_emision, organizacion_id, precio_base_impacto, comision_markup_porcentaje, tipo_pantalla, densidad_poblacion_nivel')
      .in('id', pantallaIds)

    const screensMap = new Map(screensData?.map(s => [s.id, s]) || [])

    // 5. Insert into Database (Loop over IDs)
    const inserts = pantallaIds.map(id => {
      const screen = screensMap.get(id)
      
      // Calculate dynamic price per impact matching UI logic
      let calculatedPrice = 0.05
      if (screen?.precio_base_impacto !== undefined && screen?.precio_base_impacto !== null) {
        const markup = screen.comision_markup_porcentaje !== undefined && screen.comision_markup_porcentaje !== null ? screen.comision_markup_porcentaje : 30.00
        calculatedPrice = screen.precio_base_impacto * (1 + markup / 100)
      }
      
      // Multipliers
      const typeMult = screen?.tipo_pantalla ? (screen.tipo_pantalla === 'calle_principal' ? 2.5 : screen.tipo_pantalla === 'centro_comercial' ? 2.0 : screen.tipo_pantalla === 'calle' ? 1.5 : screen.tipo_pantalla === 'restaurante' ? 1.2 : screen.tipo_pantalla === 'gimnasio' ? 1.0 : 0.5) : 1.0
      const densMult = screen?.densidad_poblacion_nivel ? (screen.densidad_poblacion_nivel === 'muy_alto' ? 1.5 : screen.densidad_poblacion_nivel === 'alto' ? 1.2 : screen.densidad_poblacion_nivel === 'medio' ? 1.0 : 0.8) : 1.0
      const priorityPenalty = 1 + ((data.prioridad || 1) * 0.1)
      const durationMultiplier = duracion / 10
      const avgTimeMultiplier = 0.93

      const finalCostPerImpact = calculatedPrice * typeMult * densMult * priorityPenalty * durationMultiplier * avgTimeMultiplier

        const weight = weightsMap[id] || 1
      const budgetFraction = totalWeight > 0 ? (weight / totalWeight) : 0
      
      return {
        cliente_id: user.id,
        pantalla_id: id !== "default" ? id : null,
        organizacion_id: profile?.organizacion_id, // Obligatorio para RLS
        nombre_campana: nombreCampana,
        url_video: publicUrl,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        estado: finalEstado,
        ia_metadata: iaResult,
        precio_pactado: finalCostPerImpact,
        // LuminAdd v2: Programmatic fields distributed by weight
        presupuesto_total: (data.presupuesto_total || 0) * budgetFraction,
        prioridad: data.prioridad || 1,
        impactos_estimados: Math.floor((data.impactos_estimados || 0) * budgetFraction),
        dias_semana: data.dias_semana || [0, 1, 2, 3, 4, 5, 6]
      }
    })

    const { error: insertError } = await supabase
      .from('campanas')
      .insert(inserts)

    if (insertError) {
      console.error("DB insert error: ", insertError)
      return { type: 'error', message: `Error de Base de Datos: ${insertError.message} (${insertError.code})` }
    }
    // Descontar presupuesto de la billetera
    if (data.presupuesto_total && data.presupuesto_total > 0) {
      const currentBalance = parseFloat(profile?.saldo_billetera?.toString() || '0')
      const nuevoSaldo = currentBalance - data.presupuesto_total
      
      const { error: walletError } = await supabase
        .from('perfiles')
        .update({ saldo_billetera: nuevoSaldo })
        .eq('id', user.id)

      if (walletError) {
        console.error("Error al descontar saldo de la billetera: ", walletError)
        // Note: Campañas creadas pero no se descontó el saldo (issue DB)
      }
    }

    revalidatePath('/dashboard')
    revalidatePath('/admin')    
    let successMessage = `¡${totalNew} ${totalNew > 1 ? 'campañas creadas' : 'campaña creada'} con éxito!`
    if (iaResult.status === 'safe') successMessage += " (IA: Validada como segura ✅)"
    if (iaResult.status === 'flagged') successMessage += " (IA: Requiere revisión manual ⚠️)"
    
    return { type: 'success', message: successMessage }

  } catch (err: any) {
    console.error("Error en createCampaign:", err)
    return { type: 'error', message: err.message || 'Error inesperado.' }
  }
}



