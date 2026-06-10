import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { logout } from '@/app/login/actions'
import { DeleteCampaignButton } from '@/app/dashboard/DeleteCampaignButton'
import { ReactivarCampaignButton } from '@/app/dashboard/ReactivarCampaignButton'
import { BarChart3, Target, TrendingUp, Zap, Monitor, DollarSign, Plus, ArrowUpRight, Wallet } from 'lucide-react'
import { SoporteNotificationBadge } from '@/components/SoporteNotificationBadge'

export default async function AdvertiserDashboardPage() {
  const supabase = await createClient()

  // Recuperar sesión activa
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) {
    return (
      <div className="p-8 text-red-500 bg-red-950/20 rounded-lg border border-red-900">
        <h1 className="text-2xl font-bold mb-4">Error cargando perfil</h1>
        <p>{profileError.message}</p>
      </div>
    )
  }

  // Bloqueo estricto: Si no eres anunciante, te expulsamos a tu panel correspondiente
  if (!profile?.es_anunciante) {
    redirect('/dashboard')
  }

  // Pantallas donde tiene ANUNCIOS activos
  const { data: conCampanas, error: pantallasError } = await supabase
    .from('pantallas')
    .select('*, campanas!inner(cliente_id, estado)')
    .eq('campanas.cliente_id', user.id)
    .in('campanas.estado', ['aprobada'])

  if (pantallasError) {
    return (
      <div className="p-8 text-red-500 bg-red-950/20 rounded-lg border border-red-900">
        <h1 className="text-2xl font-bold mb-4">Error cargando pantallas</h1>
        <p>{pantallasError.message}</p>
      </div>
    )
  }

  const pantallasActivas = conCampanas || []

  // Métricas Programáticas
  const { data: misCampanas, error: errorCampanas } = await supabase
    .from('campanas')
    .select('*, pantallas(nombre)')
    .eq('cliente_id', user.id)
    .order('created_at', { ascending: false })

  if (errorCampanas) {
    return (
      <div className="p-8 text-red-500 bg-red-950/20 rounded-lg border border-red-900">
        <h1 className="text-2xl font-bold mb-4">Error cargando datos</h1>
        <p>{errorCampanas.message}</p>
      </div>
    )
  }

  // Cálculos de Resumen
  const totalImpactos = (misCampanas || []).reduce((sum, c) => sum + Number(c?.impactos_reales ?? 0), 0)
  const totalPresupuesto = (misCampanas || []).reduce((sum, c) => sum + Number(c?.presupuesto_total ?? 0), 0)
  const campañasActivas = (misCampanas || []).filter(c => c?.estado === 'aprobada').length
  const saldoBilletera = Number(profile?.saldo_billetera ?? 0)
  const userName = profile?.nombre_empresa || user.email?.split('@')[0] || 'Anunciante'

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-4 sm:p-8 font-sans selection:bg-[#2BC8FF]/30">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-zinc-900 pb-8 relative">
        <div className="flex items-center gap-4 relative z-10">
           <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(43,200,255,0.2)]">
             <Target className="w-6 h-6 text-[#2BC8FF]" />
           </div>
           <div>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black uppercase tracking-tighter text-white">Lumi<span className="text-[#2BC8FF]">Ads</span></span>
                <span className="bg-[#2BC8FF]/10 text-[#2BC8FF] text-[9px] font-black px-2 py-0.5 rounded border border-[#2BC8FF]/20 uppercase tracking-widest">ADVERTISER</span>
              </div>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Hola, {userName}</p>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 justify-end w-full md:w-auto relative z-10">
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-2 mr-2">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Saldo Disponible</span>
              <span className="text-lg font-black font-mono text-white leading-none">{saldoBilletera.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<span className="text-[#2BC8FF] ml-1">€</span></span>
            </div>
            <Link href="/dashboard/billetera?returnTo=/advertiser">
               <Button size="sm" className="bg-[#2BC8FF] hover:bg-[#2BC8FF]/80 text-black flex gap-2 items-center text-[10px] uppercase font-black tracking-widest px-3 h-8 shadow-[0_0_10px_rgba(43,200,255,0.2)]">
                  <Wallet className="w-3 h-3" />
                  Recargar
               </Button>
            </Link>
          </div>
          <Link href="/advertiser/estadisticas">
             <Button variant="outline" className="border-zinc-800 bg-zinc-950 text-[#2BC8FF] hover:text-white hover:bg-zinc-900 flex gap-2 items-center text-[10px] uppercase font-bold tracking-widest px-3">
                <TrendingUp className="w-4 h-4" />
                Estadísticas
             </Button>
          </Link>

          <Link href="/dashboard/perfil">
             <Button variant="outline" className="border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-900 flex gap-2 items-center text-[10px] uppercase font-bold tracking-widest px-3">
                Perfil
             </Button>
          </Link>

          <Link href="/dashboard/nueva">
             <Button className="bg-[#2BC8FF] hover:bg-[#2BC8FF]/80 text-black flex gap-2 items-center text-[10px] uppercase font-black tracking-widest px-6 shadow-[0_0_15px_rgba(43,200,255,0.4)]">
                <Plus className="w-4 h-4" />
                Crear campaña
             </Button>
          </Link>

          <SoporteNotificationBadge label="Soporte" />

          <form action={logout}>
            <Button variant="outline" type="submit" className="border-red-900/50 bg-zinc-950 text-red-500 hover:text-red-400 hover:bg-red-950/20 text-[10px] uppercase font-bold tracking-widest px-4">Cerrar sesión</Button>
          </form>
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* TABLA DE CAMPAÑAS */}
        <div className="lg:col-span-2">
          <h2 className="text-[11px] uppercase tracking-[3px] text-zinc-400 flex items-center gap-2 font-black mb-6">
             <BarChart3 className="w-4 h-4 text-[#2BC8FF]" />
             Rendimiento de Campañas
          </h2>
          <div className="border border-zinc-900 rounded-lg overflow-hidden bg-black">
            {misCampanas && misCampanas.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-zinc-950 border-b border-zinc-900">
                    <tr>
                      <th className="px-6 py-4 text-[10px] uppercase font-bold text-zinc-600 tracking-widest">Campaña</th>
                      <th className="px-6 py-4 text-[10px] uppercase font-bold text-zinc-600 tracking-widest">Delivery</th>
                      <th className="px-6 py-4 text-[10px] uppercase font-bold text-zinc-600 tracking-widest">Economía</th>
                      <th className="px-6 py-4 text-[10px] uppercase font-bold text-zinc-600 tracking-widest">Estado</th>
                      <th className="px-6 py-4 text-[10px] uppercase font-bold text-zinc-600 tracking-widest text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {misCampanas.map((camp: any) => {
                      const presupuesto = Number(camp?.presupuesto_total ?? 0)
                      const impactosEstimados = Number(camp?.impactos_estimados ?? 0)
                      const impactosReales = Number(camp?.impactos_reales ?? 0)
                      const deliveryPercent = impactosEstimados > 0
                        ? Math.min(100, Math.floor((impactosReales / impactosEstimados) * 100))
                        : 0
                      const costPerImpact = impactosEstimados > 0
                        ? (presupuesto / impactosEstimados).toFixed(3)
                        : '0.000'
                      const campaignName = camp?.nombre_campana || 'Campaña sin nombre'
                      const campaignIdPreview = typeof camp?.id === 'string' ? camp.id.split('-')[0] : 'N/A'
                      const pantallaNombre = camp?.pantallas?.nombre || 'Red Global'
                      
                      const isAgotado = impactosReales >= impactosEstimados && impactosEstimados > 0
                      const estado = isAgotado ? 'agotado' : (typeof camp?.estado === 'string' ? camp.estado.replace(/_/g, ' ') : 'pendiente')
                      
                      return (
                        <tr key={camp.id || campaignName} className="hover:bg-zinc-950 transition-colors">
                          <td className="px-6 py-5">
                            <p className="font-bold text-white uppercase text-xs">{campaignName}</p>
                            <p className="text-[9px] text-zinc-600 font-mono mt-1">ID: {campaignIdPreview}</p>
                            <p className="text-[9px] text-[#2BC8FF] uppercase mt-1 flex items-center gap-1">
                               <Monitor className="w-3 h-3" /> {pantallaNombre}
                            </p>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex-1 h-1 bg-zinc-900 rounded-none overflow-hidden">
                                <div 
                                  className="h-full bg-[#2BC8FF] shadow-[0_0_10px_rgba(43,200,255,0.5)]" 
                                  style={{ width: `${deliveryPercent}%` }}
                                />
                              </div>
                               <span className="text-[10px] font-mono text-white w-8">{deliveryPercent}%</span>
                            </div>
                            <div className="flex justify-between">
                               <span className="text-[9px] text-[#2BC8FF] uppercase font-bold">{impactosReales} IMP</span>
                               <span className="text-[9px] text-zinc-600 uppercase">/ {impactosEstimados} META</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <p className="text-sm text-white font-mono font-bold">{presupuesto.toFixed(2)}€</p>
                            <p className="text-[9px] text-zinc-500 uppercase mt-0.5">{costPerImpact}€ / IMP</p>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                              isAgotado ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                              camp?.estado === 'aprobada' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              camp?.estado === 'rechazada' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                              'bg-zinc-800 text-zinc-400'
                            }`}>
                              {estado}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                             <div className="flex items-center justify-end gap-2">
                               {isAgotado && typeof camp?.id === 'string' && (
                                 <ReactivarCampaignButton campaignId={camp.id} currentBudget={presupuesto} />
                               )}
                               {typeof camp?.id === 'string' ? <DeleteCampaignButton campaignId={camp.id} /> : null}
                             </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-900 flex items-center justify-center mx-auto mb-6">
                     <Target className="w-6 h-6 text-zinc-600" />
                </div>
                <p className="text-zinc-500 font-mono uppercase tracking-[3px] text-[10px] mb-6">No tienes ninguna campaña activa.</p>
                <Link href="/dashboard/nueva">
                  <Button className="bg-[#2BC8FF] text-black font-black uppercase text-[10px] tracking-widest shadow-[0_0_15px_rgba(43,200,255,0.3)] hover:bg-white">Crear campaña</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* PANTALLAS CON ANUNCIOS */}
        <div>
          <h2 className="text-[11px] uppercase tracking-[3px] text-zinc-400 flex items-center gap-2 font-black mb-6">
             <Monitor className="w-4 h-4 text-[#2BC8FF]" />
             Nodos Emitiendo
          </h2>
          <div className="space-y-4">
            {pantallasActivas && pantallasActivas.length > 0 ? (
              pantallasActivas.map((pantalla: any, idx: number) => (
                <div key={pantalla.id} className="p-6 border border-zinc-900 bg-zinc-950/80 rounded-lg group hover:border-zinc-700 transition-all">
                   <div className="flex justify-between items-start mb-4">
                     <h3 className="text-sm font-black text-white uppercase">{pantalla.nombre}</h3>
                     <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">LIVE</span>
                   </div>
                   <p className="text-[10px] text-zinc-500 font-mono uppercase mb-4">{pantalla.ubicacion}</p>
                   
                   <div className="flex justify-between items-center">
                     <div className="flex items-center gap-2 text-[9px] text-zinc-400 font-mono uppercase tracking-widest">
                       <span className="w-1.5 h-1.5 rounded-full bg-[#2BC8FF] animate-pulse" />
                       {pantalla.ciudad}
                     </div>
   
                     <Link href={`/player/${pantalla.id}`} target="_blank">
                       <Button 
                         variant="outline" 
                         className="h-8 text-[9px] uppercase font-bold border-zinc-800 bg-black text-zinc-300 hover:text-white hover:bg-zinc-900"
                       >
                         Abrir emisión <ArrowUpRight className="w-3 h-3 ml-1" />
                       </Button>
                     </Link>
                   </div>
                 </div>
              ))
            ) : (
              <div className="p-12 border border-zinc-900 bg-zinc-950/50 rounded-lg text-center flex flex-col items-center">
                 <Monitor className="w-8 h-8 text-zinc-800 mb-4" />
                 <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Tus anuncios no están rotando en ninguna pantalla actualmente.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
