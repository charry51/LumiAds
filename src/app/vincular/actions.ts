'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateHostCommission, type ScreenType, type DensityLevel } from '@/lib/yield/pricing'

/**
 * Genera un código único de 6 caracteres para vincular una TV.
 * La TV llama a esto al arrancar. No requiere sesión.
 */
export async function generatePairingCode(
  deviceId: string, 
  latitud?: number, 
  longitud?: number,
  resolucion?: string,
  esTactil?: boolean,
  tamanoPulgadasEstimado?: number
): Promise<{ code: string } | { error: string }> {
  const supabase = await createClient()

  // Generar un código corto único tipo "LM-4F9"
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'LM-'
  for (let i = 0; i < 3; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }

  // Caducidad: 10 minutos
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  // Eliminar registros anteriores del mismo dispositivo
  await supabase.from('pairing_codes').delete().eq('device_id', deviceId)

  const { error } = await supabase.from('pairing_codes').insert({
    code,
    device_id: deviceId,
    expires_at: expiresAt,
    estado: 'pendiente',
    latitud,
    longitud,
    resolucion,
    es_tactil: esTactil,
    tamano_pulgadas_estimado: tamanoPulgadasEstimado
  })

  if (error) return { error: error.message }
  return { code }
}

/**
 * El admin introduce el código desde su dashboard.
 * Busca el registro, crea la pantalla y actualiza el pairing.
 */
export async function activatePairingCode(
  code: string,
  nombre: string,
  ciudad: string,
  ubicacion: string,
  esPublica: boolean = true,
  latitud?: number,
  longitud?: number,
  tipoPantalla: string = 'gimnasio',
  densidadNivel: string = 'medio',
  resolucion?: string,
  esTactil?: boolean,
  tamanoPulgadas?: number,
  sospechoso?: boolean,
  precioBaseImpacto: number = 0.05
): Promise<{ success: boolean; pantallaId?: string; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  // 1. Buscar el código válido y no expirado
  const { data: pairing } = await supabase
    .from('pairing_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('estado', 'pendiente')
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!pairing) {
    return { success: false, error: 'Código no válido o expirado. La TV debe mostrar uno nuevo.' }
  }

  // 2. Verificar límites del plan antes de crear la pantalla
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('*, planes(*)')
    .eq('id', user.id)
    .single()

  const { count } = await supabase
    .from('pantallas')
    .select('*', { count: 'exact', head: true })
    .eq('organizacion_id', perfil?.organizacion_id)

  const maxPantallas = perfil?.planes?.max_pantallas || 1
  if ((count || 0) >= maxPantallas) {
    return { success: false, error: `Límite de pantallas alcanzado (${maxPantallas}). Mejora tu plan.` }
  }

  const adminClient = await createAdminClient()

  // 3. Crear la pantalla en la BD
  const { data: pantalla, error: insertError } = await adminClient
    .from('pantallas')
    .insert({
      nombre,
      ciudad,
      ubicacion,
      latitud,
      longitud,
      estado: 'activa',
      es_publica: esPublica,
      tipo_pantalla: tipoPantalla,
      densidad_poblacion_nivel: densidadNivel,
      organizacion_id: perfil?.organizacion_id,
      creado_por: user.id,
      resolucion,
      es_tactil: esTactil,
      tamano_pulgadas: tamanoPulgadas,
      sospechoso,
      precio_base_impacto: precioBaseImpacto
    })
    .select('id')
    .single()

  if (insertError || !pantalla) {
    return { success: false, error: insertError?.message || 'Error creando pantalla' }
  }

  // 4. Lógica de Host Automático: Si no es superadmin, vincular como host
  if (perfil?.rol !== 'superadmin') {
    const porcentaje = calculateHostCommission(tipoPantalla as ScreenType, densidadNivel as DensityLevel)

    await adminClient.from('hosts').insert({
      perfil_id: user.id,
      pantalla_id: pantalla.id,
      nombre_local: nombre,
      porcentaje,
      saldo_pendiente: 0,
      saldo_pagado: 0
    })
  }

  // 5. Marcar el código como vinculado para que la TV lo detecte
  await adminClient
    .from('pairing_codes')
    .update({
      estado: 'vinculado',
      pantalla_id: pantalla.id,
      vinculado_por: user.id
    })
    .eq('id', pairing.id)

  revalidatePath('/admin/pantallas')
  revalidatePath('/host/dashboard')
  revalidatePath('/dashboard')

  return { success: true, pantallaId: pantalla.id }
}

/**
 * La TV llama a esto en polling para saber si ya fue vinculada.
 */
export async function checkPairingStatus(deviceId: string): Promise<{
  estado: 'pendiente' | 'vinculado' | 'expirado'
  pantallaId?: string
}> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('pairing_codes')
    .select('estado, pantalla_id, expires_at')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) return { estado: 'expirado' }

  const isExpired = new Date(data.expires_at) < new Date()
  if (isExpired && data.estado === 'pendiente') return { estado: 'expirado' }

  return {
    estado: data.estado as 'pendiente' | 'vinculado' | 'expirado',
    pantallaId: data.pantalla_id || undefined
  }
}

/**
 * Obtiene los metadatos de vinculación (GPS) para el admin.
 */
export async function getPairingMetadata(code: string): Promise<{
  lat?: number
  lng?: number
  resolucion?: string
  es_tactil?: boolean
  tamano_pulgadas_estimado?: number
  capturado_at?: string
  error?: string
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pairing_codes')
    .select('latitud, longitud, resolucion, es_tactil, capturado_at, tamano_pulgadas_estimado')
    .eq('code', code.toUpperCase())
    .eq('estado', 'pendiente')
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !data) return { error: 'Código no encontrado o expirado' }

  return {
    lat: data.latitud,
    lng: data.longitud,
    resolucion: data.resolucion,
    es_tactil: data.es_tactil,
    tamano_pulgadas_estimado: data.tamano_pulgadas_estimado,
    capturado_at: data.capturado_at
  }
}

/**
 * Registra una pantalla manualmente por parte de un Host (sin código de emparejamiento).
 */
export async function createHostPantallaManually(
  nombre: string,
  ciudad: string,
  ubicacion: string,
  esPublica: boolean = true,
  latitud?: number,
  longitud?: number,
  tipoPantalla: string = 'gimnasio',
  densidadNivel: string = 'medio',
  precioBaseImpacto: number = 0.05
): Promise<{ success: boolean; pantallaId?: string; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  // 1. Obtener Perfil, Plan y Organización
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('*, planes(*)')
    .eq('id', user.id)
    .single()

  if (!perfil) return { success: false, error: 'Perfil no encontrado' }

  // 2. Verificar límites del plan
  const { count } = await supabase
    .from('pantallas')
    .select('*', { count: 'exact', head: true })
    .eq('organizacion_id', perfil?.organizacion_id)

  const maxPantallas = perfil?.planes?.max_pantallas || 1
  if ((count || 0) >= maxPantallas) {
    return { success: false, error: `Límite de pantallas alcanzado (${maxPantallas}). Mejora tu plan.` }
  }

  const adminClient = await createAdminClient()

  // 3. Crear la pantalla en la BD
  const { data: pantalla, error: insertError } = await adminClient
    .from('pantallas')
    .insert({
      nombre,
      ciudad,
      ubicacion,
      latitud,
      longitud,
      estado: 'activa',
      es_publica: esPublica,
      tipo_pantalla: tipoPantalla,
      densidad_poblacion_nivel: densidadNivel,
      organizacion_id: perfil?.organizacion_id,
      creado_por: user.id,
      precio_base_impacto: precioBaseImpacto
    })
    .select('id')
    .single()

  if (insertError || !pantalla) {
    return { success: false, error: insertError?.message || 'Error creando pantalla' }
  }

  // 4. Vincular como host
  const porcentaje = calculateHostCommission(tipoPantalla as ScreenType, densidadNivel as DensityLevel)

  const { error: hostError } = await adminClient.from('hosts').insert({
    perfil_id: user.id,
    pantalla_id: pantalla.id,
    nombre_local: nombre,
    porcentaje,
    saldo_pendiente: 0,
    saldo_pagado: 0
  })

  if (hostError) {
    // Si falla vincular host, borramos la pantalla
    await adminClient.from('pantallas').delete().eq('id', pantalla.id)
    return { success: false, error: 'Error vinculando host: ' + hostError.message }
  }

  revalidatePath('/host')
  revalidatePath('/dashboard')

  return { success: true, pantallaId: pantalla.id }
}

