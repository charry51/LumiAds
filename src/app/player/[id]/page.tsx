import { createClient } from '@/lib/supabase/server'
import PlaylistRunner from './PlaylistRunner'

export const metadata = {
  title: 'LuminAdd Player v2.0',
  robots: 'noindex, nofollow',
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Fetch screen info to check if it's public
  const { data: pantalla } = await supabase
    .from('pantallas')
    .select('es_publica')
    .eq('id', id)
    .single()

  const esPublica = pantalla?.es_publica !== false // default to true if screen not found

  const today = new Date().toISOString().split('T')[0]

  // Fetch campaigns that are:
  // 1. Approved
  // 2. Scheduled for today
  // 3. For this screen (or global if the screen is public)
  // 4. STILL HAVE BUDGET (impactos_reales < impactos_estimados)
  let query = supabase
    .from('campanas')
    .select(`
        id, 
        url_video, 
        nombre_campana, 
        hora_inicio, 
        hora_fin, 
        prioridad, 
        impactos_estimados, 
        impactos_reales,
        dias_semana
    `)

  if (esPublica) {
    query = query.or(`pantalla_id.eq.${id},pantalla_id.is.null`)
  } else {
    query = query.eq('pantalla_id', id)
  }

  const { data: campanasData, error } = await query
    .in('estado', ['aprobada', 'pre_aprobada'])
    .lte('fecha_inicio', today)
    .gte('fecha_fin', today)
  
  if (error) {
    console.error("[Player Fetch Error]", error)
  }

  // Filter out campaigns that have reached their target
  // We leave a 5% margin for safety in high-concurrency environments
  const validCampaigns = campanasData?.filter(c => 
    c.impactos_reales < (c.impactos_estimados * 1.05) || c.impactos_estimados === 0
  ) || []

  return (
    <main className="w-screen h-screen bg-black overflow-hidden m-0 p-0 cursor-none">
      <PlaylistRunner 
        screenId={id} 
        playlist={validCampaigns.map(c => ({
            id: c.id,
            url_video: c.url_video,
            hora_inicio: c.hora_inicio,
            hora_fin: c.hora_fin,
            prioridad: c.prioridad || 1,
            dias_semana: c.dias_semana
        }))} 
      />
    </main>
  )
}



