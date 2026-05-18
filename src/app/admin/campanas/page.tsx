import { createClient, createAdminClient } from '@/lib/supabase/server'
import { ActionButtons } from './ActionButtons'
import { CampaignPreview } from './CampaignPreview'

export default async function GestionCampanasPage() {
  const supabase = await createClient()
  const adminClient = await createAdminClient()

  // Use adminClient to bypass RLS and see all campaigns for moderation
  const { data: campanas, error } = await adminClient
    .from('campanas')
    .select(`
      id, 
      nombre_campana, 
      estado, 
      fecha_inicio, 
      url_video,
      ia_metadata,
      pantallas ( nombre, ciudad )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="p-8 text-red-500 bg-red-950/20 border border-red-900 rounded-lg">Error: {error.message}</div>
  }

  return (
    <div className="p-8 font-sans">
      <header className="mb-8 border-b border-zinc-800 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-heading font-black text-gradient uppercase tracking-tight">Gestión de Campañas</h1>
          <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] mt-1">Monitor de Moderación IA Activo</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">LuminAdd CONTROL v2.0</span>
        </div>
      </header>

      <div className="cyber-card overflow-x-auto">
        <table className="w-full min-w-[900px] whitespace-nowrap text-sm text-left border-collapse">
          <thead className="bg-zinc-950 text-zinc-400 font-heading text-[10px] uppercase tracking-widest border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4">Campaña / IA Status</th>
              <th className="px-6 py-4">Pantalla Destino</th>
              <th className="px-6 py-4">Fechas</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Visualización</th>
              <th className="px-6 py-4 text-right pr-10">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-zinc-300">
            {campanas && campanas.length > 0 ? (
              campanas.map((camp: any) => {
                const ia = camp.ia_metadata || {}
                return (
                  <tr key={camp.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <span className="font-heading font-bold text-zinc-100 uppercase text-xs">{camp.nombre_campana}</span>
                        <div className="flex items-center gap-2">
                          {ia.status === 'safe' && <span className="text-[9px] text-green-400 font-mono">● IA: SEGURO</span>}
                          {ia.status === 'flagged' && <span className="text-[9px] text-yellow-500 font-mono animate-pulse">● IA: REVISIÓN RECOMENDADA</span>}
                          {ia.status === 'rejected' && <span className="text-[9px] text-red-500 font-mono">● IA: CONTENIDO RECHAZADO</span>}
                          {!ia.status && <span className="text-[9px] text-zinc-600 font-mono italic">Escaneo pendiente</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {camp.pantallas ? (
                        <div className="flex flex-col">
                          <span className="text-zinc-200 text-xs font-heading uppercase">{camp.pantallas.nombre}</span>
                          <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-tighter">{camp.pantallas.ciudad}</span>
                        </div>
                      ) : 'No asignada'}
                    </td>
                    <td className="px-6 py-5 text-zinc-500 font-mono text-[10px]">{new Date(camp.fecha_inicio).toLocaleDateString()}</td>
                    <td className="px-6 py-5">
                      <span className={`px-2 py-1 rounded-sm text-[9px] font-black uppercase border ${
                        camp.estado === 'aprobada' || camp.estado === 'pre_aprobada' 
                          ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_5px_rgba(34,197,94,0.1)]' :
                        camp.estado === 'rechazada' || camp.estado === 'rechazada_ia'
                          ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        camp.estado === 'revision_manual_ia'
                          ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                          'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}>
                        {camp.estado.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <CampaignPreview url={camp.url_video} nombre={camp.nombre_campana} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3 items-center">
                        {camp.estado !== 'pendiente_aprobacion' && (
                            <span className="text-zinc-600 text-[9px] uppercase font-black tracking-[0.2em] pr-2 border-r border-zinc-800 h-4 flex items-center">PROCESADA</span>
                        )}
                        <ActionButtons campanaId={camp.id} estado={camp.estado} />
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-600 bg-zinc-900 border-t border-zinc-800">
                  No hay campañas registradas en el sistema.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}



