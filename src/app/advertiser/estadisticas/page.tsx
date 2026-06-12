import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdvertiserAnalyticsDashboard } from '@/components/dashboard/AdvertiserAnalyticsDashboard'

export const dynamic = 'force-dynamic'

export default async function AdvertiserEstadisticasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.es_anunciante) {
    redirect('/dashboard')
  }

  // Fetch all campaigns with their screen relationships
  const { data: campaigns } = await supabase
    .from('campanas')
    .select('*, pantallas(id, nombre, ciudad, ubicacion, tipo_pantalla)')
    .eq('cliente_id', user.id)
    .order('created_at', { ascending: false })

  const formattedCampaigns = (campaigns || []).map(c => {
    const screen = c.pantallas as any
    return {
      campana_id: c.id,
      campana_nombre: c.nombre_campana || 'Campaña sin nombre',
      estado: c.estado || 'pendiente',
      presupuesto_total: Number(c.presupuesto_total || 0),
      impactos_estimados: Number(c.impactos_estimados || 0),
      impactos_reales: Number(c.impactos_reales || 0),
      created_at: c.created_at,
      fecha_inicio: c.fecha_inicio,
      fecha_fin: c.fecha_fin,
      precio_pactado: Number(c.precio_pactado || 0.05),
      pantalla_id: screen?.id || '',
      pantalla_nombre: screen?.nombre || 'Red Global',
      ciudad: screen?.ciudad || 'Mundial',
      ubicacion: screen?.ubicacion || 'Internet',
      tipo_pantalla: screen?.tipo_pantalla || 'desconocido'
    }
  })

  return (
    <AdvertiserAnalyticsDashboard
      campaigns={formattedCampaigns}
      userEmail={user.email || ''}
      walletBalance={Number(profile.saldo_billetera || 0)}
    />
  )
}
