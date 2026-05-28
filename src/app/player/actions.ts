'use server'

import { createClient } from '@/lib/supabase/server'

export async function logPlayback(campanaId: string, pantallaId: string) {
  const supabase = await createClient()

  // 1. Get screen organization for integrity
  const { data: pantalla } = await supabase
    .from('pantallas')
    .select('organizacion_id, hosts(id, porcentaje, saldo_pendiente)')
    .eq('id', pantallaId)
    .single()

  if (!pantalla?.organizacion_id) {
    return { success: false, error: "Screen organization mismatch" }
  }

  const { data: campana } = await supabase
    .from('campanas')
    .select('precio_pactado, impactos_reales, estado')
    .eq('id', campanaId)
    .single()

  if (!campana || campana.estado !== 'aprobada') {
     return { success: false, error: "Campana no aprobada" }
  }

  // @ts-ignore
  const host = pantalla.hosts && Array.isArray(pantalla.hosts) ? pantalla.hosts[0] : pantalla.hosts

  if (host) {
     const costPerImpact = campana.precio_pactado || 0.05
     const hostEarnings = costPerImpact * ((host.porcentaje || 25) / 100)

     const { error: comError } = await supabase.from('comisiones').insert({
        host_id: host.id,
        campana_id: campanaId,
        comision: hostEarnings,
        estado: 'pendiente'
     })

     if (!comError) {
        await supabase.from('hosts').update({ saldo_pendiente: (host.saldo_pendiente || 0) + hostEarnings }).eq('id', host.id)
     }
  }

  // Update impactos
  await supabase.from('campanas').update({ impactos_reales: (campana.impactos_reales || 0) + 1 }).eq('id', campanaId)

  // 2. Register "Proof of Play"
  await supabase
    .from('reproducciones_verificadas')
    .insert({
      campana_id: campanaId,
      pantalla_id: pantallaId,
      organizacion_id: pantalla.organizacion_id
    })

  return { success: true }
}
