import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HostAnalyticsDashboard } from '@/components/dashboard/HostAnalyticsDashboard'

export const dynamic = 'force-dynamic'

export default async function HostEstadisticasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.es_host) {
    redirect('/dashboard')
  }

  // Fetch all hosts and screens owned by the user
  const { data: hosts } = await supabase
    .from('hosts')
    .select('*, pantallas(id, nombre, ciudad, estado, precio_emision, ubicacion, tipo_pantalla, densidad_poblacion_nivel, precio_base_impacto, plan_host, es_publica)')
    .eq('perfil_id', user.id)

  const hostIds = hosts?.map(h => h.id) || []

  // Fetch all commissions for all host screens
  let comisiones: any[] = []
  if (hostIds.length > 0) {
    const { data } = await supabase
      .from('comisiones')
      .select('*, campanas(nombre_campana)')
      .in('host_id', hostIds)
      .order('created_at', { ascending: false })
    comisiones = data || []
  }

  // Structure the initial screens analytics array for the client component
  const screens = (hosts || []).map(h => {
    const p = (Array.isArray(h.pantallas) ? h.pantallas[0] : h.pantallas) as any
    return {
      host_id: h.id,
      saldo_pendiente: h.saldo_pendiente || 0,
      saldo_pagado: h.saldo_pagado || 0,
      porcentaje: h.porcentaje || 0,
      pantalla_id: p?.id || '',
      pantalla_nombre: p?.nombre || 'Nodo sin nombre',
      ciudad: p?.ciudad || 'Desconocida',
      ubicacion: p?.ubicacion || 'Sin dirección',
      estado: p?.estado || 'inactiva',
      tipo_pantalla: p?.tipo_pantalla || 'gimnasio',
      plan_host: p?.plan_host || 'basic',
      precio_emision: p?.precio_emision || 0,
      precio_base_impacto: p?.precio_base_impacto || 0,
    }
  })

  return (
    <HostAnalyticsDashboard 
      initialScreens={screens}
      initialCommissions={comisiones}
      userEmail={user.email || ''}
      stripeAccountId={profile.stripe_account_id}
    />
  )
}
