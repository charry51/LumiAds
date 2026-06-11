'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { syncPlanToScreens } from '@/app/actions/profile'
import { headers } from 'next/headers'


type UserRole = 'cliente' | 'gestor_local' | 'superadmin'

const roleUpdates: Record<UserRole, { rol: UserRole; es_anunciante: boolean; es_host: boolean }> = {
  cliente: {
    rol: 'cliente',
    es_anunciante: true,
    es_host: false,
  },
  gestor_local: {
    rol: 'gestor_local',
    es_anunciante: false,
    es_host: true,
  },
  superadmin: {
    rol: 'superadmin',
    es_anunciante: false,
    es_host: false,
  },
}

function isUserRole(role: string): role is UserRole {
  return role in roleUpdates
}

export async function updateUserRole(userId: string, newRole: string) {
  try {
    const supabase = await createClient()

    // 1. Verificar que el que llama sea superadmin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'No autenticado' }

    const { data: perfilCaller } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (perfilCaller?.rol !== 'superadmin') {
      return { success: false, message: 'No tienes permisos suficientes' }
    }

    if (!isUserRole(newRole)) {
      return { success: false, message: 'Rol no válido' }
    }

    // 2. Actualizar el rol real y las identidades que usa la navegación.
    const adminClient = await createAdminClient()
    const updateData: any = { ...roleUpdates[newRole] }

    if (newRole === 'cliente') {
      updateData.plan_id = 'basic'
      updateData.suscripcion_activa = false
    } else if (newRole === 'gestor_local') {
      const { data: currentProfile } = await adminClient
        .from('perfiles')
        .select('plan_id')
        .eq('id', userId)
        .single()
      
      const currentPlan = (currentProfile?.plan_id || '').toLowerCase()
      if (!currentPlan || currentPlan === 'basic' || currentPlan === 'free' || currentPlan === 'presencia') {
        updateData.plan_id = 'premium'
      }
    }

    const { data: updatedProfile, error } = await adminClient
      .from('perfiles')
      .update(updateData)
      .eq('id', userId)
      .select('rol, es_anunciante, es_host')
      .single()

    if (error) throw error

    if (updateData.plan_id) {
      await syncPlanToScreens(userId, updateData.plan_id, newRole === 'gestor_local')
    }

    revalidatePath('/admin/usuarios')
    revalidatePath('/admin')
    revalidatePath('/dashboard')
    revalidatePath('/advertiser')
    revalidatePath('/host')
    return { success: true, profile: updatedProfile }
  } catch (err: any) {
    console.error('Error updating role:', err)
    return { success: false, message: err.message }
  }
}

export async function updateUserPlan(userId: string, newPlanId: string) {
  try {
    const supabase = await createClient()

    // 1. Verificar que el que llama sea superadmin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'No autenticado' }

    const { data: perfilCaller } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (perfilCaller?.rol !== 'superadmin') {
      return { success: false, message: 'No tienes permisos suficientes' }
    }

    // 2. Actualizar el plan usando el cliente admin para evitar RLS
    const adminClient = await createAdminClient()
    const { error } = await adminClient
      .from('perfiles')
      .update({ plan_id: newPlanId })
      .eq('id', userId)

    if (error) throw error

    // Sync screens immediately
    await syncPlanToScreens(userId, newPlanId, true)

    revalidatePath('/admin/usuarios')
    return { success: true }
  } catch (err: any) {
    console.error('Error updating plan:', err)
    return { success: false, message: err.message }
  }
}

export async function deleteUser(userId: string) {
  try {
    const supabase = await createClient()

    // 1. Verificar que el que llama sea superadmin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'No autenticado' }

    const { data: perfilCaller } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (perfilCaller?.rol !== 'superadmin') {
      return { success: false, message: 'No tienes permisos suficientes' }
    }

    // 2. Evitar autoborrado
    if (user.id === userId) {
      return { success: false, message: 'No puedes eliminar tu propia cuenta' }
    }

    const adminClient = await createAdminClient()

    // --- LIMPIEZA DE DEPENDENCIAS PARA EVITAR ERRORES DE LLAVE FORÁNEA (FK) ---

    // A. Eliminar mensajes de soporte enviados por el usuario
    await adminClient
      .from('soporte_mensajes')
      .delete()
      .eq('remitente_id', userId)

    // B. Eliminar tickets de soporte creados por el usuario (y por cascada sus mensajes)
    await adminClient
      .from('soporte_tickets')
      .delete()
      .eq('user_id', userId)

    // C. Buscar pantallas creadas por este usuario para limpiar sus dependencias
    const { data: screens } = await adminClient
      .from('pantallas')
      .select('id')
      .eq('creado_por', userId)

    if (screens && screens.length > 0) {
      const screenIds = screens.map(s => s.id)

      // Desvincular códigos de emparejamiento de estas pantallas
      await adminClient
        .from('pairing_codes')
        .delete()
        .in('pantalla_id', screenIds)

      // Desvincular de los hosts
      await adminClient
        .from('hosts')
        .delete()
        .in('pantalla_id', screenIds)

      // Poner en NULL la referencia de pantalla en campañas activas/históricas
      await adminClient
        .from('campanas')
        .update({ pantalla_id: null })
        .in('pantalla_id', screenIds)

      // Eliminar las pantallas creadas por el usuario
      await adminClient
        .from('pantallas')
        .delete()
        .in('id', screenIds)
    }

    // D. Eliminar campañas creadas por el usuario
    await adminClient
      .from('campanas')
      .delete()
      .eq('cliente_id', userId)

    // E. Eliminar de Supabase Auth usando el cliente administrador (esto elimina en cascada 'perfiles' y 'hosts' restantes)
    const { error } = await adminClient.auth.admin.deleteUser(userId)

    if (error) throw error

    revalidatePath('/admin/usuarios')
    return { success: true }
  } catch (err: any) {
    console.error('Error deleting user:', err)
    return { success: false, message: err.message }
  }
}

export async function impersonateUser(userId: string) {
  try {
    const supabase = await createClient()

    // 1. Verificar que el que llama sea superadmin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'No autenticado' }

    const { data: perfilCaller } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (perfilCaller?.rol !== 'superadmin') {
      return { success: false, message: 'No tienes permisos suficientes' }
    }

    // 2. Obtener el email y rol del usuario a suplantar
    const adminClient = await createAdminClient()
    const { data: targetUser, error: fetchError } = await adminClient
      .from('perfiles')
      .select('email, rol')
      .eq('id', userId)
      .single()

    if (fetchError || !targetUser || !targetUser.email) {
      return { success: false, message: 'Usuario no encontrado o no tiene correo electrónico' }
    }

    // 3. Determinar el path de redirección según el rol del usuario
    let nextPath = '/dashboard'
    if (targetUser.rol === 'gestor_local') {
      nextPath = '/host'
    } else if (targetUser.rol === 'cliente') {
      nextPath = '/advertiser'
    } else if (targetUser.rol === 'superadmin') {
      nextPath = '/admin'
    }

    // 4. Obtener origen dinámicamente
    const headersList = await headers()
    const host = headersList.get('host')
    const protocol = host?.includes('localhost') ? 'http' : 'https'
    const origin = `${protocol}://${host}`

    // 5. Generar link de inicio de sesión único (magiclink)
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: targetUser.email,
      options: {
        redirectTo: `${origin}/auth/callback`
      }
    })

    if (error || !data?.properties?.action_link) {
      throw error || new Error('No se pudo generar el enlace de inicio de sesión')
    }

    // 6. Ejecutar la llamada al enlace de Supabase en el servidor para interceptar el redireccionamiento (code/token)
    const fetchResponse = await fetch(data.properties.action_link, {
      method: 'GET',
      redirect: 'manual'
    })

    const redirectUrl = fetchResponse.headers.get('location')
    if (!redirectUrl) {
      throw new Error('No se recibió la cabecera de redirección desde el servidor de autenticación')
    }

    // 7. Parsear la URL de redirección obtenida
    const urlObj = new URL(redirectUrl)
    const code = urlObj.searchParams.get('code')

    if (code) {
      // Flujo PKCE: intercambiar código por sesión en el cliente de servidor (establece las cookies de sesión del nuevo usuario)
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError) throw exchangeError
    } else {
      // Flujo implícito: extraer de hash fragment
      const hash = urlObj.hash.substring(1)
      const params = new URLSearchParams(hash)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        })
        if (sessionError) throw sessionError
      } else {
        throw new Error('No se recibió código de verificación ni token de acceso')
      }
    }

    // 8. Retornar éxito y la ruta final
    return { success: true, redirectUrl: nextPath }
  } catch (err: any) {
    console.error('Error impersonating user:', err)
    return { success: false, message: err.message }
  }
}

