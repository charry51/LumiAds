'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(data: { 
    nombre?: string; 
    nombre_empresa?: string; 
    nif?: string; 
    telefono?: string;
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'No autorizado' }
    }

    const { error } = await supabase
        .from('perfiles')
        .update(data)
        .eq('id', user.id)

    if (error) {
        console.error("Error updating profile:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/perfil')
    return { success: true }
}

export async function syncPlanToScreens(userId: string, planId: string | null, suscripcionActiva: boolean) {
    try {
        const adminClient = await createAdminClient()

        const { data: hosts, error: fetchError } = await adminClient
            .from('hosts')
            .select('pantalla_id')
            .eq('perfil_id', userId)

        if (fetchError) {
            console.error("Error fetching hosts for sync:", fetchError)
            return { success: false, error: fetchError.message }
        }

        if (hosts && hosts.length > 0) {
            const pantallaIds = hosts.map(h => h.pantalla_id).filter(Boolean)
            const normalizedPlan = suscripcionActiva && planId ? planId.toLowerCase() : 'basic'
            const plan = normalizedPlan === 'premium' || normalizedPlan === 'gold' ? normalizedPlan : 'basic'
            const precio = plan === 'premium' ? 20.00 : plan === 'gold' ? 50.00 : 0.00
            const esPublica = plan !== 'gold'

            const { error: updateError } = await adminClient
                .from('pantallas')
                .update({
                    plan_host: plan,
                    precio_plan_host: precio,
                    es_publica: esPublica
                })
                .in('id', pantallaIds)

            if (updateError) {
                console.error("Error syncing screens plan:", updateError)
                return { success: false, error: updateError.message }
            }
        }

        return { success: true }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error inesperado'
        console.error("Unexpected error in syncPlanToScreens:", err)
        return { success: false, error: message }
    }
}

export async function cancelPlan() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'No autorizado' }
    }

    const { error } = await supabase
        .from('perfiles')
        .update({ 
            plan_id: null, 
            suscripcion_activa: false 
        })
        .eq('id', user.id)

    if (error) {
        console.error("Error cancelling plan:", error)
        return { success: false, error: error.message }
    }

    await syncPlanToScreens(user.id, null, false)

    revalidatePath('/dashboard/perfil')
    return { success: true }
}
