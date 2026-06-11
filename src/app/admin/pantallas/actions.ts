'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function isMissingDailyCapacityColumn(error: { message?: string } | null) {
  return error?.message?.includes('capacidad_impactos_diarios')
}

export async function createPantalla(formData: FormData) {
  const supabase = await createClient()

  // 1. Seguridad y Contexto de Usuario
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  // 2. Obtener Perfil, Plan y Organización
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('*, planes(*)')
    .eq('id', user.id)
    .single()

  if (!perfil) return { success: false, error: 'Perfil no encontrado' }
  
  // Seguridad extra: Solo superadmin puede crear pantallas globales desde aquí
  if (perfil.rol !== 'superadmin') return { success: false, error: 'Acceso denegado' }
  
  // 3. Verificación de Límites de Pantalla
  const { count: conteoActual } = await supabase
    .from('pantallas')
    .select('*', { count: 'exact', head: true })
    .eq('organizacion_id', perfil.organizacion_id)

  const maxPantallas = perfil.planes?.max_pantallas || 1
  
  if ((conteoActual || 0) >= maxPantallas) {
    return { 
      success: false, 
      error: `Límite de pantallas alcanzado para el plan ${perfil.planes?.nombre}. Máximo: ${maxPantallas}.` 
    }
  }

  // 4. Procesamiento de Formulario
  const nombre = formData.get('nombre') as string
  const ubicacion = formData.get('ubicacion') as string
  const ciudad = formData.get('ciudad') as string
  const latStr = formData.get('latitud') as string
  const lngStr = formData.get('longitud') as string
  const impactosDiariosStr = formData.get('capacidad_impactos_diarios') as string

  const lat = latStr ? parseFloat(latStr) : null
  const lng = lngStr ? parseFloat(lngStr) : null
  const capacidadImpactosDiarios = Math.max(1, Math.floor(Number(impactosDiariosStr) || 1000))

  const esPublica = formData.get('es_publica') !== 'false' // Si no viene o es 'on', es pública

  const adminClient = await createAdminClient()

  // 5. Inserción con Vínculo de Organización y Privacidad
  let { error } = await adminClient.from('pantallas').insert({
    nombre,
    ubicacion,
    ciudad,
    latitud: lat,
    longitud: lng,
    estado: 'activa',
    es_publica: esPublica,
    capacidad_impactos_diarios: capacidadImpactosDiarios,
    organizacion_id: perfil.organizacion_id,
    creado_por: user.id
  })

  if (isMissingDailyCapacityColumn(error)) {
    const fallback = await adminClient.from('pantallas').insert({
      nombre,
      ubicacion,
      ciudad,
      latitud: lat,
      longitud: lng,
      estado: 'activa',
      es_publica: esPublica,
      organizacion_id: perfil.organizacion_id,
      creado_por: user.id
    })
    error = fallback.error
  }

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/pantallas')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deletePantalla(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autorizado' }
    
    // Verificar rol antes de proceder con el cliente admin
    const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
    if (perfil?.rol !== 'superadmin') return { success: false, error: 'Acceso denegado' }

    const adminClient = await createAdminClient()
    
    try {
      // 1. Limpiar dependencias para evitar errores de Foreign Key (FK)
      
      // Desvincular códigos de emparejamiento
      await adminClient.from('pairing_codes').delete().eq('pantalla_id', id)
      
      // Borrar registros de host/propiedad de esta pantalla
      await adminClient.from('hosts').delete().eq('pantalla_id', id)
      
      // Desvincular campañas (las ponemos en NULL para no borrar el historial de la campaña)
      // Si la campaña era específica para esta pantalla, ahora será "Red Global"
      await adminClient.from('campanas').update({ pantalla_id: null }).eq('pantalla_id', id)

      // 2. Ahora sí, borrar la pantalla
      const { error } = await adminClient.from('pantallas').delete().eq('id', id)
      
      if (error) {
        console.error('Error al eliminar pantalla:', error)
        return { success: false, error: error.message }
      }
  
      revalidatePath('/admin/pantallas')
      revalidatePath('/dashboard')
      return { success: true }
    } catch (err: any) {
      console.error('Excepción en deletePantalla:', err)
      return { success: false, error: err.message || 'Error inesperado al eliminar' }
    }
}

export async function updatePantallaPlan(pantallaId: string, newPlan: string) {
  try {
    const supabase = await createClient()

    // 1. Verificar que el que llama sea superadmin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autorizado' }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (perfil?.rol !== 'superadmin') return { success: false, error: 'Acceso denegado' }

    const plan = newPlan.toLowerCase()
    const precio = plan === 'premium' ? 20.00 : plan === 'gold' ? 50.00 : 0.00
    const esPublica = plan !== 'gold'

    const adminClient = await createAdminClient()
    const { error } = await adminClient
      .from('pantallas')
      .update({
        plan_host: plan,
        precio_plan_host: precio,
        es_publica: esPublica
      })
      .eq('id', pantallaId)

    if (error) throw error

    revalidatePath('/admin/pantallas')
    revalidatePath('/host')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    console.error('Excepción en updatePantallaPlan:', err)
    return { success: false, error: err.message || 'Error inesperado al actualizar plan' }
  }
}
