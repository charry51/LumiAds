import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { Button } from '@/components/ui/button'
import { Plus, Tv, TrendingUp, Wallet, History, ChevronRight, Zap, Monitor, ArrowUpCircle } from 'lucide-react'
import { SoporteNotificationBadge } from '@/components/SoporteNotificationBadge'
import { logout } from '@/app/login/actions'

export default async function HostDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ screenId?: string; activate?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .single()

  let isHost = profile?.es_host
  if (!isHost && params.activate === 'true') {
    await supabase
      .from('perfiles')
      .update({ es_host: true })
      .eq('id', user.id)
    isHost = true
    revalidatePath('/host')
    revalidatePath('/dashboard')
  }

  if (!isHost) {
    redirect('/dashboard')
  }

  const { data: hosts } = await supabase
    .from('hosts')
    .select('*, pantallas(id, nombre, ciudad, estado, precio_emision, ubicacion, tipo_pantalla, densidad_poblacion_nivel, precio_base_impacto, plan_host, es_publica)')
    .eq('perfil_id', user.id)

  const hasScreens = hosts && hosts.length > 0
  const selectedHostId = params.screenId
  
  const hostData = hasScreens 
    ? (selectedHostId ? (hosts.find(h => h.id === selectedHostId) || hosts[0]) : hosts[0])
    : null

  const pantalla = hostData ? (Array.isArray(hostData.pantallas) ? hostData.pantallas[0] : hostData.pantallas) as any : null
  const hostTier = pantalla?.plan_host || 'basic'
  
  // Stats globales
  const totalGenerado = hosts ? hosts.reduce((sum, h) => sum + (h.saldo_pendiente || 0) + (h.saldo_pagado || 0), 0) : 0
  const totalPendiente = hosts ? hosts.reduce((sum, h) => sum + (h.saldo_pendiente || 0), 0) : 0
  const activos = hosts ? hosts.filter(h => (h.pantallas as any)?.estado === 'activa').length : 0

  let comisiones: any[] = []
  if (hostData) {
    const { data } = await supabase
      .from('comisiones')
      .select('*, campanas(nombre_campana)')
      .eq('host_id', hostData.id)
      .order('created_at', { ascending: false })
      .limit(50)
    comisiones = data || []
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-4 sm:p-8 font-sans selection:bg-violet-500/30">
      {/* HEADER SIMILAR A ADVERTISER */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-zinc-900 pb-8 relative">
        <div className="flex items-center gap-4 relative z-10">
           <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(124,60,255,0.2)]">
             <Monitor className="w-6 h-6 text-violet-500" />
           </div>
           <div>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black uppercase tracking-tighter text-white">Lumi<span className="text-violet-500">Host</span></span>
                <span className="bg-violet-500/10 text-violet-400 text-[9px] font-black px-2 py-0.5 rounded border border-violet-500/20 uppercase tracking-widest">DUEÑO DE PANTALLAS</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[4px]">Infraestructura Descentralizada</p>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 justify-end w-full md:w-auto relative z-10">
          <Link href="/dashboard/perfil">
             <Button variant="outline" className="border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-900 flex gap-2 items-center text-[10px] uppercase font-bold tracking-widest px-3">
                Perfil
             </Button>
          </Link>

          <Link href="/vincular">
             <Button className="bg-violet-600 hover:bg-violet-500 text-white flex gap-2 items-center text-[10px] uppercase font-black tracking-widest px-6 shadow-[0_0_15px_rgba(124,60,255,0.4)]">
                <Monitor className="w-4 h-4" />
                Conectar otra pantalla
             </Button>
          </Link>

          <SoporteNotificationBadge label="Soporte" />

          <form action={logout}>
            <Button variant="outline" type="submit" className="border-red-900/50 bg-zinc-950 text-red-500 hover:text-red-400 hover:bg-red-950/20 text-[10px] uppercase font-bold tracking-widest px-4">Cerrar sesión</Button>
          </form>
        </div>
      </header>

      {/* STATS BANNER */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative overflow-hidden mb-12">
        <div className="p-6 border border-zinc-900 bg-zinc-950/80 rounded-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-4">
             <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Total Generado</p>
             <TrendingUp className="h-4 w-4 text-violet-500" />
          </div>
          <div className="text-4xl font-mono font-black text-white">{totalGenerado.toFixed(2)}€</div>
          <p className="text-[9px] uppercase text-zinc-600 mt-2 flex items-center gap-1 font-bold">
            Histórico en la red
          </p>
        </div>

        <div className="p-6 border border-zinc-900 bg-zinc-950/80 rounded-lg relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
             <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Nodos Activos</p>
             <Tv className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-4xl font-mono font-black text-white">{activos} / {hosts?.length || 0}</div>
          <p className="text-[9px] uppercase text-zinc-600 mt-2 font-bold">
            Pantallas emitiendo
          </p>
        </div>

        <div className="p-6 border border-zinc-900 bg-zinc-950/80 rounded-lg relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
             <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Uptime Global</p>
             <Zap className="h-4 w-4 text-violet-500" />
          </div>
          <div className="text-4xl font-mono font-black text-emerald-400">{hasScreens ? '99.9%' : '0%'}</div>
          <p className="text-[9px] uppercase text-zinc-600 mt-2 font-bold">
            Tiempo de conexión
          </p>
        </div>

        <div className="p-6 border border-violet-500/30 bg-violet-500/5 rounded-lg relative overflow-hidden group shadow-[0_0_30px_rgba(124,60,255,0.05)]">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent" />
          <div className="flex justify-between items-start mb-4 relative z-10">
             <p className="text-[10px] uppercase font-bold tracking-widest text-violet-400">Saldo Retirable</p>
             <Wallet className="h-4 w-4 text-violet-500" />
          </div>
          <div className="text-4xl font-mono font-black text-white relative z-10">{totalPendiente.toFixed(2)}€</div>
          {totalPendiente >= 50 && (
             <Button className="w-full mt-3 h-8 bg-violet-600 hover:bg-white text-black text-[9px] uppercase font-black tracking-widest transition-colors relative z-10">
               Retirar saldo
             </Button>
          )}
        </div>
      </div>

      {!hasScreens ? (
        <div className="p-16 border border-zinc-900 bg-zinc-950/50 rounded-xl flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-zinc-900 border-2 border-zinc-800 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(124,60,255,0.15)]">
               <Monitor className="w-8 h-8 text-zinc-500" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">Aún no tienes pantallas</h2>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[3px] mb-8 max-w-md">
               Convierte tus televisores en una fuente de ingresos conectándolos a nuestra red o utiliza el CMS privado para tu propio contenido.
            </p>
            <Link href="/vincular">
              <Button className="bg-violet-600 hover:bg-violet-500 text-white font-black uppercase text-xs tracking-widest px-8 py-6 rounded-lg shadow-[0_0_20px_rgba(124,60,255,0.4)]">
                Conectar pantalla
              </Button>
            </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           
           {/* SIDEBAR TUS NODOS */}
           <div className="lg:col-span-1 space-y-4">
              <h2 className="text-[11px] uppercase tracking-[3px] text-zinc-400 flex items-center gap-2 font-black mb-6">
                 <Tv className="w-4 h-4 text-violet-500" /> Tus Nodos
              </h2>
              <div className="space-y-2">
                 {hosts.map((h: any) => (
                    <Link key={h.id} href={`/host?screenId=${h.id}`} className="block">
                       <div className={`p-4 rounded-lg border transition-all ${h.id === hostData.id ? 'bg-violet-500/10 border-violet-500/50 shadow-[0_0_15px_rgba(124,60,255,0.1)]' : 'bg-zinc-950 border-zinc-900 hover:border-zinc-700'}`}>
                          <div className="flex justify-between items-start mb-2">
                             <h3 className="text-xs font-black uppercase text-white truncate pr-2">{h.pantallas?.nombre}</h3>
                             <span className={`w-2 h-2 rounded-full mt-1 ${h.pantallas?.estado === 'activa' ? 'bg-emerald-500 shadow-[0_0_5px_#10B981]' : 'bg-zinc-600'}`} />
                          </div>
                          <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest mb-2 truncate">{h.pantallas?.ciudad}</p>
                          <div className="flex items-center justify-between">
                             <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                               h.pantallas?.plan_host === 'gold' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                               h.pantallas?.plan_host === 'premium' ? 'bg-violet-500/20 text-violet-400 border-violet-500/30' :
                               'bg-zinc-800 text-zinc-400 border-zinc-700'
                             }`}>
                                {h.pantallas?.plan_host}
                             </span>
                             <span className="text-[9px] font-mono text-zinc-400 font-bold">{h.porcentaje}% Share</span>
                          </div>
                       </div>
                    </Link>
                 ))}
              </div>
           </div>

           {/* MAIN PANEL */}
           <div className="lg:col-span-3">
              {/* TIER BASIC */}
              {hostTier === 'basic' && (
                 <div className="space-y-6">
                    <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-xl">
                       <div className="flex justify-between items-start mb-4">
                          <div>
                             <h2 className="text-xl font-black uppercase text-white mb-1">{pantalla?.nombre}</h2>
                             <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-[2px]">{pantalla?.ubicacion}</span>
                          </div>
                          <div className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                             <span className="text-[10px] font-black uppercase text-zinc-300">BASIC TIER</span>
                          </div>
                       </div>
                       <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest border-t border-zinc-900 pt-4 mt-4">
                          Este nodo opera bajo el plan gratuito. La emisión híbrida con anuncios externos es obligatoria para sufragar el software.
                       </p>
                    </div>

                    <div className="border border-zinc-900 rounded-xl overflow-hidden bg-black">
                       <div className="p-4 bg-zinc-950 border-b border-zinc-900">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Ledger de Ingresos (Basic)</h3>
                       </div>
                       {comisiones.length > 0 ? (
                         <div className="overflow-x-auto">
                           <table className="w-full text-left">
                             <thead className="bg-zinc-900/50">
                               <tr>
                                 <th className="px-6 py-3 text-[9px] uppercase font-bold text-zinc-500 tracking-widest">Campaña</th>
                                 <th className="px-6 py-3 text-[9px] uppercase font-bold text-zinc-500 tracking-widest">Importe</th>
                                 <th className="px-6 py-3 text-[9px] uppercase font-bold text-zinc-500 tracking-widest text-right">Fecha</th>
                               </tr>
                             </thead>
                             <tbody className="divide-y divide-zinc-900">
                               {comisiones.map(com => (
                                 <tr key={com.id}>
                                   <td className="px-6 py-4">
                                      <p className="text-[10px] font-bold text-white uppercase">{com.campanas?.nombre_campana}</p>
                                   </td>
                                   <td className="px-6 py-4 text-[10px] font-mono text-emerald-400">+{com.comision?.toFixed(4)}€</td>
                                   <td className="px-6 py-4 text-right text-[9px] text-zinc-600 font-mono">
                                      {new Date(com.created_at).toLocaleDateString()}
                                   </td>
                                 </tr>
                               ))}
                             </tbody>
                           </table>
                         </div>
                       ) : (
                         <div className="p-12 text-center">
                            <History className="w-6 h-6 text-zinc-600 mx-auto mb-4" />
                            <p className="text-[9px] font-mono uppercase tracking-[2px] text-zinc-500">Sin historial de emisiones recientes.</p>
                         </div>
                       )}
                    </div>
                 </div>
              )}

              {/* TIER PREMIUM */}
              {hostTier === 'premium' && (
                 <div className="space-y-6 relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 blur-[100px] pointer-events-none" />
                    
                    <div className="p-8 bg-zinc-950/80 border border-violet-500/20 rounded-xl relative z-10 backdrop-blur-sm">
                       <div className="flex justify-between items-start mb-6">
                          <div>
                             <h2 className="text-2xl font-black uppercase text-white mb-1 shadow-sm">{pantalla?.nombre}</h2>
                             <span className="text-[10px] text-violet-400 font-mono uppercase tracking-[3px]">{pantalla?.ubicacion}</span>
                          </div>
                          <div className="bg-violet-500/10 border border-violet-500/30 px-4 py-2 rounded flex items-center gap-2">
                             <Zap className="w-4 h-4 text-violet-400" />
                             <span className="text-[10px] font-black uppercase text-violet-300 tracking-widest">PREMIUM TIER</span>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-3 gap-4 border-t border-zinc-900 pt-6">
                          <div>
                             <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest mb-1">Share de Comisión</p>
                             <p className="text-2xl font-black font-mono text-white">{hostData.porcentaje}%</p>
                          </div>
                          <div>
                             <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest mb-1">Audiencia (Impactos)</p>
                             <p className="text-2xl font-black font-mono text-white">4,205</p>
                          </div>
                          <div>
                             <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest mb-1">Carga de Hardware</p>
                             <p className="text-2xl font-black font-mono text-emerald-400">32%</p>
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 relative z-10">
                       <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-xl">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
                             <TrendingUp className="w-3 h-3 text-violet-500" /> Rendimiento Ads
                          </h3>
                          <div className="space-y-3">
                             {comisiones.slice(0, 4).map(com => (
                                <div key={com.id} className="flex justify-between items-center border-b border-zinc-900 pb-2">
                                   <p className="text-[9px] text-white font-bold uppercase truncate w-32">{com.campanas?.nombre_campana}</p>
                                   <p className="text-[10px] font-mono text-emerald-400">+{com.comision?.toFixed(3)}€</p>
                                </div>
                             ))}
                          </div>
                       </div>
                       
                       <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-xl flex flex-col justify-center items-center text-center">
                          <Monitor className="w-8 h-8 text-zinc-600 mb-4" />
                          <p className="text-[10px] uppercase font-bold text-white mb-2">Control de Emisión</p>
                          <p className="text-[9px] font-mono text-zinc-500 tracking-[1px] mb-4">Modo Híbrido Avanzado activo. Recibiendo pautas prioritarias de alto valor.</p>
                          <Button variant="outline" className="text-[9px] uppercase font-bold border-zinc-800 bg-black">Ver Playlogs</Button>
                       </div>
                    </div>
                 </div>
              )}

              {/* TIER GOLD */}
              {hostTier === 'gold' && (
                 <div className="space-y-6 relative">
                    <div className="absolute top-0 left-0 w-full h-full bg-amber-500/5 blur-[100px] pointer-events-none" />
                    
                    <div className="p-8 bg-zinc-950/90 border border-amber-500/40 rounded-xl relative z-10 backdrop-blur-md shadow-[0_0_50px_rgba(245,158,11,0.05)]">
                       <div className="flex justify-between items-start mb-6">
                          <div>
                             <h2 className="text-3xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600 mb-1">{pantalla?.nombre}</h2>
                             <span className="text-[10px] text-amber-500/70 font-mono uppercase tracking-[4px]">{pantalla?.ubicacion}</span>
                          </div>
                          <div className="bg-amber-500/10 border border-amber-500/50 px-4 py-2 rounded flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                             <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_5px_#F59E0B]" />
                             <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest">GOLD TIER • PRIVADA PURA</span>
                          </div>
                       </div>
                       
                       <p className="text-[11px] text-zinc-400 font-mono uppercase tracking-[2px] leading-relaxed border-t border-zinc-900 pt-6">
                          Este nodo está completamente aislado de la red de anunciantes. Utiliza el CMS Exclusivo para programar tu contenido corporativo.
                       </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
                       <div className="p-6 bg-zinc-950 border border-amber-500/20 hover:border-amber-500/50 transition-colors rounded-xl flex flex-col items-center justify-center text-center cursor-pointer group">
                          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                             <Plus className="w-6 h-6 text-amber-500" />
                          </div>
                          <h3 className="text-xs font-black uppercase text-white mb-2">Subir Media</h3>
                          <p className="text-[9px] font-mono text-zinc-500 tracking-[1px]">Sube videos o imágenes</p>
                       </div>
                       
                       <div className="p-6 bg-zinc-950 border border-amber-500/20 hover:border-amber-500/50 transition-colors rounded-xl flex flex-col items-center justify-center text-center cursor-pointer group">
                          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                             <History className="w-6 h-6 text-amber-500" />
                          </div>
                          <h3 className="text-xs font-black uppercase text-white mb-2">Librería CMS</h3>
                          <p className="text-[9px] font-mono text-zinc-500 tracking-[1px]">Gestiona tus playlists</p>
                       </div>

                       <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col items-center justify-center text-center">
                          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-4 animate-pulse">
                             <Tv className="w-6 h-6 text-amber-500" />
                          </div>
                          <h3 className="text-xs font-black uppercase text-amber-400 mb-2">Emisión Actual</h3>
                          <p className="text-[9px] font-mono text-amber-500/60 tracking-[1px]">Promo_Verano.mp4</p>
                       </div>
                    </div>
                 </div>
              )}

           </div>
        </div>
      )}
    </div>
  )
}
