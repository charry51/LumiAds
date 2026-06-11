import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { logout } from '@/app/login/actions'
import { DeleteCampaignButton } from '@/app/dashboard/DeleteCampaignButton'
import { BarChart3, PieChart, Target, TrendingUp, Zap, ZapOff, Monitor, DollarSign, ShieldAlert, Plus } from 'lucide-react'
import { SoporteNotificationBadge } from '@/components/SoporteNotificationBadge'

export async function AnuncianteDashboardView() {
  const supabase = await createClient()

  // Recuperar sesión activa
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Pantallas que el usuario HA REGISTRADO (como Host)
  const { data: propias } = await supabase
    .from('pantallas')
    .select('*, host:hosts!inner(perfil_id, saldo_pendiente, saldo_pagado)')
    .eq('host.perfil_id', user?.id)

  // 2. Pantallas donde tiene ANUNCIOS activos (como Anunciante)
  const { data: conCampanas } = await supabase
    .from('pantallas')
    .select('*, campanas!inner(cliente_id, estado)')
    .eq('campanas.cliente_id', user?.id)
    .in('campanas.estado', ['aprobada'])

  // Combinar y eliminar duplicados
  const mergeMap = new Map()
  propias?.forEach(p => {
    const hostInfo = Array.isArray(p.host) ? p.host[0] : p.host
    mergeMap.set(p.id, { 
      ...p, 
      es_propia: true, 
      saldo_pendiente: hostInfo?.saldo_pendiente || 0,
      saldo_pagado: hostInfo?.saldo_pagado || 0
    })
  })
  
  conCampanas?.forEach(p => {
    if (mergeMap.has(p.id)) {
      mergeMap.set(p.id, { ...mergeMap.get(p.id), tiene_campana: true })
    } else {
      mergeMap.set(p.id, { ...p, tiene_campana: true })
    }
  })
  
  const pantallas = Array.from(mergeMap.values())

  const { data: profile } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', user?.id)
    .single()
  const userName = profile?.nombre || profile?.nombre_empresa || user?.email?.split('@')[0] || 'Anunciante'

  // QUERY ACTUALIZADA PARA MÉTRICAS PROGRAMÁTICAS
  const { data: misCampanas, error: errorCampanas } = await supabase
    .from('campanas')
    .select('*, pantallas(nombre)')
    .eq('cliente_id', user?.id)
    .order('created_at', { ascending: false })

  if (errorCampanas) {
    return (
      <div className="p-8 text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
        <h1 className="text-2xl font-bold mb-4">Error cargando datos</h1>
        <p>{errorCampanas?.message}</p>
      </div>
    )
  }

  // Cálculos de Resumen
  const totalImpactos = misCampanas?.reduce((sum, c) => sum + (c.impactos_reales || 0), 0) || 0
  const totalPresupuesto = misCampanas?.reduce((sum, c) => sum + (c.presupuesto_total || 0), 0) || 0
  const campañasActivas = misCampanas?.filter(c => c.estado === 'aprobada').length || 0

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 font-sans">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <img src="/LogoPequeno.png" alt="LumiAds Logo" className="h-[80px] w-auto" />
            <img src="/LogoTexto.png" alt="LumiAds" className="h-[100px] w-auto" />
          </div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest -mt-4">
            Hola, {userName}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 justify-end w-full md:w-auto">
          {['superadmin', 'comercial', 'gestor_local'].includes(profile?.rol || '') && (
            <Link href="/admin">
               <Button variant="outline" className="border-red-500/30 text-red-500 hover:bg-red-500/5 flex gap-2 items-center text-[10px] uppercase font-bold tracking-widest px-3">
                  <ShieldAlert className="w-3 h-3" />
                  Panel Admin
               </Button>
            </Link>
          )}

          <Link href="/dashboard/perfil">
             <Button variant="outline" className="border-border hover:bg-muted flex gap-2 items-center text-[10px] uppercase font-bold tracking-widest px-3">
                Perfil
             </Button>
          </Link>

          <Link href="/dashboard?mode=host">
             <Button variant="outline" className="border-border hover:bg-muted flex gap-2 items-center text-[10px] uppercase font-bold tracking-widest px-4">
                <Monitor className="w-4 h-4" />
                Ir a Host
             </Button>
          </Link>
          
          <Link href="/dashboard/nueva">
             <Button className="cyber-button-ui flex gap-2 items-center text-[10px] uppercase font-black tracking-widest px-6">
                <Plus className="w-4 h-4" />
                Crear campaña
             </Button>
          </Link>
          {profile?.rol === 'cliente' && (
            <SoporteNotificationBadge buttonClassName="border-border hover:bg-muted flex gap-2 items-center text-[10px] uppercase font-bold tracking-widest px-3" />
          )}
          <form action={logout}>
            <Button variant="outline" type="submit" className="border-border hover:bg-muted text-[11px] sm:text-xs px-3 sm:px-4">Cerrar sesión</Button>
          </form>
        </div>
      </header>

      {/* STATS BANNER */}
      <div className="cyber-glass-ui p-8 grid grid-cols-2 md:grid-cols-4 gap-8 relative overflow-hidden bg-card/50 backdrop-blur-md border-border shadow-sm">
        <div className="cyber-glass-ui p-4 flex items-center justify-between transition-all duration-500">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1 font-mono">Impactos Totales</p>
            <p className="text-2xl font-heading text-foreground">{totalImpactos.toLocaleString()}</p>
          </div>
          <Zap className="text-lumi-blue dark:text-[#2BC8FF] w-8 h-8" />
        </div>
        <div className="cyber-glass-ui p-4 flex items-center justify-between transition-all duration-500">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1 font-mono">Presupuesto Activo</p>
            <p className="text-2xl font-heading text-foreground">{totalPresupuesto.toFixed(2)}€</p>
          </div>
          <DollarSign className="text-lumi-violet dark:text-[#7C3CFF] w-8 h-8" />
        </div>
        <div className="cyber-glass-ui p-4 flex items-center justify-between transition-all duration-500">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1 font-mono">Campaña Activas</p>
            <p className="text-2xl font-heading text-foreground dark:text-white">{campañasActivas}</p>
          </div>
          <Target className="text-lumi-blue dark:text-[#2BC8FF] w-8 h-8" />
        </div>
        <div className="cyber-glass-ui p-4 flex items-center justify-between transition-all duration-500 relative group">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#2BC8FF] opacity-0 group-hover:opacity-100 transition-opacity" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1 font-mono">Saldo Billetera</p>
            <p className="text-2xl font-heading text-foreground dark:text-white">{Number(profile?.saldo_billetera || 0).toFixed(2)}€</p>
            <Link href="/dashboard/billetera" className="text-[9px] text-primary uppercase font-bold tracking-widest hover:underline mt-1 block">
              + Recargar Saldo
            </Link>
          </div>
          <DollarSign className="text-lumi-blue dark:text-[#2BC8FF] w-8 h-8" />
        </div>
      </div>
      
      <div className="mt-12 mb-12">
        <h2 className="text-xl font-heading mb-6 flex items-center gap-2 uppercase tracking-widest text-sm text-gradient-ui">
           <Monitor className="w-5 h-5 text-lumi-blue dark:text-[#2BC8FF]" />
           Red de Pantallas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pantallas && pantallas.length > 0 ? (
            pantallas.map((pantalla: any, idx: number) => {
               const isEven = idx % 2 === 0;
               const accentColor = isEven ? '#7C3CFF' : '#2BC8FF';
               const accentClass = isEven ? 'text-lumi-violet' : 'text-lumi-blue';
               
               return (
                 <div key={pantalla.id} className="cyber-card p-6 flex flex-col justify-between group h-full transition-all hover:border-zinc-700">
                   <div className="mb-4">
                     <div className="flex justify-between items-start mb-2">
                       <div className="flex flex-wrap gap-2 justify-center">
                         {/* Placeholder for host navigation logic */}
                       </div>
                       <h3 className={`text-lg font-heading text-foreground dark:text-zinc-100 transition-colors uppercase ${isEven ? 'group-hover:text-lumi-violet' : 'group-hover:text-lumi-blue'}`}>{pantalla.nombre}</h3>
                       <div className="flex flex-col items-end gap-1">
                         <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full tracking-tighter ${
                           pantalla.estado === 'activa' 
                             ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                             : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700'
                         }`}>
                           {pantalla.estado}
                         </span>
                       </div>
                     </div>
                     <p className="text-xs text-muted-foreground font-sans line-clamp-1">{pantalla.ubicacion}</p>
                   </div>
                   
                   <div className="flex justify-between items-center mt-4">
                     <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono uppercase">
                       <span className={`w-2 h-2 rounded-full animate-pulse ${isEven ? 'bg-lumi-violet' : 'bg-lumi-blue'}`} style={{ backgroundColor: accentColor }} />
                       <span>{pantalla.ciudad}</span>
                     </div>
   
                     <Link href={`/player/${pantalla.id}`} target="_blank">
                       <Button 
                         variant="outline" 
                         size="sm" 
                         className="h-7 text-[9px] uppercase font-bold transition-all"
                         style={{ 
                            borderColor: `${accentColor}33`, 
                            color: accentColor 
                         }}
                       >
                         Abrir emisión
                       </Button>
                     </Link>
                   </div>
                 </div>
               )
            })
          ) : (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center cyber-card border-dashed bg-lumi-blue/5 border-lumi-blue/20">
              <p className="text-lumi-blue dark:text-[#2BC8FF] font-heading uppercase text-sm mb-2">Sin pantallas activas</p>
              <Link href="/vincular" className="flex justify-center">
                <Button size="sm" className="bg-[#2BC8FF] hover:bg-[#2BC8FF]/80 text-black mt-4 shadow-lg shadow-[#2BC8FF]/10 text-xs font-bold uppercase tracking-widest px-6 py-2">Vincular pantalla</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-heading mb-6 flex items-center gap-2 uppercase tracking-widest text-sm text-gradient-ui">
           <BarChart3 className="w-5 h-5 text-lumi-violet dark:text-[#7C3CFF]" />
           Rendimiento de Campañas
        </h2>
        <div className="cyber-card shadow-2xl overflow-x-auto bg-card border-border transition-all duration-500">
          {misCampanas && misCampanas.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="cyber-table-header w-[25%] text-foreground">Campaña</th>
                  <th className="cyber-table-header text-foreground">Destino</th>
                  <th className="cyber-table-header w-[30%] text-foreground">Rendimiento (Entrega)</th>
                  <th className="cyber-table-header text-foreground">Economía</th>
                  <th className="cyber-table-header text-foreground">Estado</th>
                  <th className="cyber-table-header text-right text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {misCampanas.map((camp: any) => {
                  const deliveryPercent = Math.min(100, Math.floor(((camp.impactos_reales || 0) / (camp.impactos_estimados || 1)) * 100))
                  const costPerImpact = (camp.presupuesto_total / (camp.impactos_estimados || 1)).toFixed(3)
                  
                  return (
                    <tr key={camp.id} className="cyber-table-row group">
                      <td className="px-6 py-6">
                        <p className="font-heading text-foreground uppercase text-xs mb-1">{camp.nombre_campana}</p>
                        <p className="text-[10px] text-zinc-500 font-mono italic">ID: {camp.id.split('-')[0]}</p>
                      </td>
                      <td className="px-6 py-4 text-zinc-400 text-xs">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-3 h-3 text-[#2BC8FF]" />
                          {camp.pantallas?.nombre || 'Red Global'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="h-full bg-gradient-to-r from-[#2BC8FF] to-[#7C3CFF] transition-all duration-1000" 
                              style={{ width: `${deliveryPercent}%` }}
                            />
                          </div>
                           <span className="text-[10px] font-mono text-foreground w-12 text-right">{deliveryPercent}%</span>
                        </div>
                        <div className="flex justify-between mt-2">
                           <span className="text-[9px] text-[#2BC8FF] uppercase font-bold">{camp.impactos_reales || 0}</span>
                           <span className="text-[9px] text-zinc-600 uppercase">Meta: {camp.impactos_estimados || 0} Visualizaciones</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-foreground font-heading">{camp.presupuesto_total.toFixed(2)}€</p>
                        <p className="text-[9px] text-zinc-500 uppercase mt-0.5">{costPerImpact}€ / Impacto</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded border text-[9px] font-bold uppercase tracking-tighter ${
                          camp.estado === 'aprobada' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                          camp.estado === 'rechazada' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        }`}>
                          {camp.estado.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <DeleteCampaignButton campaignId={camp.id} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <p className="text-muted-foreground italic mb-6 text-sm">No tienes ninguna campaña activa.</p>
              <Link href="/dashboard/nueva" className="flex justify-center">
                <button className="cyber-button-ui shadow-[0_0_20px_rgba(124,60,255,0.2)]">Crear Primera Campaña</button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

