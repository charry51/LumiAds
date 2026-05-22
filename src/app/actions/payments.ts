'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper function to simulate delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Simula el pago y la activación de una suscripción de Host.
 * Retraso de 2 segundos.
 */
export async function simularPagoSuscripcion(pantallaId: string, plan: 'basic' | 'premium' | 'gold') {
  try {
    const supabase = await createClient()

    // Verificamos si el usuario está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    // 1. Simulación de pago / proceso (Retraso artificial de 2s)
    await delay(2000)

    // Determinar lógica de visibilidad en base al plan (El trigger de BD también lo hace, pero lo mandamos por seguridad)
    const esPublica = plan !== 'gold'
    
    let precio = 0
    if (plan === 'premium') precio = 20.00
    if (plan === 'gold') precio = 50.00

    // 2. Actualizar la base de datos
    const { error: updateError } = await supabase
      .from('pantallas')
      .update({ 
        plan_host: plan,
        precio_plan_host: precio,
        es_publica: esPublica
      })
      .eq('id', pantallaId)
      // Asegurarse de que el usuario es dueño de la pantalla (o tiene permisos)
      // .eq('perfil_id', user.id) // Descomentar si el perfil_id está directamente en pantallas

    if (updateError) {
      console.error("Error actualizando plan:", updateError)
      return { success: false, error: 'Error al actualizar el plan en la base de datos' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/')

    return { success: true, message: `Suscripción al plan ${plan.toUpperCase()} activada correctamente.` }

  } catch (err) {
    console.error("Payment simulation error:", err)
    return { success: false, error: 'Error inesperado durante la simulación de pago' }
  }
}

/**
 * Simula la recarga de saldo de un anunciante.
 * Retraso de 2 segundos.
 */
export async function simularRecargaSaldo(cantidad: number) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    // 1. Simulación de pago
    await delay(2000)

    // 2. Obtener saldo actual
    const { data: perfil, error: fetchError } = await supabase
      .from('perfiles')
      .select('saldo_billetera')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      return { success: false, error: 'Error al obtener perfil' }
    }

    const saldoActual = parseFloat(perfil.saldo_billetera || '0')
    const nuevoSaldo = saldoActual + cantidad

    // 3. Actualizar saldo
    const { error: updateError } = await supabase
      .from('perfiles')
      .update({ saldo_billetera: nuevoSaldo })
      .eq('id', user.id)

    if (updateError) {
      return { success: false, error: 'Error al actualizar saldo' }
    }

    revalidatePath('/dashboard')
    
    return { success: true, nuevoSaldo }

  } catch (err) {
    return { success: false, error: 'Error inesperado en recarga' }
  }
}
