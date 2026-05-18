import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Tv, TrendingUp, Wallet, History, ChevronRight, Zap, Monitor } from 'lucide-react'
import { PairingForm } from '@/app/admin/pantallas/PairingForm'
import { 
  getScreenTier, 
  getTierMultiplier, 
  ScreenType, 
  DensityLevel 
} from '@/lib/yield/pricing'

export default async function HostDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ screenId?: string; action?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Obtener todos los registros de host vinculados a este perfil
  const { data: hosts } = await supabase
    .from('hosts')
    .select('*, pantallas(id, nombre, ciudad, estado, precio_emision, ubicacion, tipo_pantalla, densidad_poblacion_nivel)')
    .eq('perfil_id', user.id)

  const hasScreens = hosts && hosts.length > 0
  const isAddingScreen = params.action === 'vincular'

  // VISTA DE ONBOARDING (Si no tiene pantallas o pulsó "Vincular otra")
  if (!hasScreens || isAddingScreen) {
    return (
      <div className="min-h-screen bg-transparent text-foreground p-8 font-sans flex flex-col items-center justify-center">
        <div className="max-w-md w-full">
            <header className="mb-10 text-center">
                <Link href="/dashboard" className="inline-block mb-4 text-[10px] text-muted-foreground hover:text-primary transition-colors uppercase tracking-[3px]">← Volver al Dashboard Principal</Link>
                <h1 className="text-4xl font-heading font-black text-gradient-ui mb-2">VINCULAR TV</h1>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[3px]">Añade un nuevo nodo de emisión a tu cuenta</p>
            </header>

            <div className="cyber-card p-8 bg-card backdrop-blur-xl border-border shadow-xl">
                <PairingForm />
            </div>

            <p className="mt-8 text-center text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                ¿Necesitas ayuda técnica? LuminAdd.app/soporte
            </p>
        </div>
      </div>
    )
  }

  // Selección de la pantalla actual (por URL o la primera de la lista)
  const selectedHostId = params.screenId
  const hostData = Array.isArray(hosts) && hosts.length > 0
    ? (selectedHostId ? (hosts.find(h => h.id === selectedHostId) || hosts[0]) : hosts[0])
    : null

  if (!hostData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">Error al cargar datos del nodo...</p>
      </div>
    )
  }

  // Obtener historial de comisiones para la pantalla seleccionada
  const { data: comisiones } = await supabase
    .from('comisiones')
    .select('*, campanas(nombre_campana)')
    .eq('host_id', hostData.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const totalGenerado = (hostData.saldo_pendiente || 0) + (hostData.saldo_pagado || 0)
  const rawPantalla = hostData.pantallas
  const pantalla = (Array.isArray(rawPantalla) ? rawPantalla[0] : rawPantalla) as any

  // YIELD INTELLIGENCE
  const screenType = pantalla?.tipo_pantalla as ScreenType || 'gimnasio'
  const screenDensity = pantalla?.densidad_poblacion_nivel as DensityLevel || 'medio'
  const yieldTier = getScreenTier(screenType, screenDensity)
  const yieldMult = getTierMultiplier(screenType, screenDensity)

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 font-sans">
      {/* Header Premium - Balanced Cyan Logo */}
      <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-border pb-8">
        <div className="flex items-center gap-4">
           <img src="/LogoPequeno.png" alt="LuminAdd Logo" className="h-10 w-auto" />
           <div>
              <Link href="/dashboard" className="inline-block mb-1 text-[10px] text-muted-foreground hover:text-primary transition-colors uppercase tracking-[3px] font-bold">← Dashboard Principal</Link>
              <div className="flex items-center gap-3">
                <img src="/LogoTexto.png" alt="LuminAdd" className="h-12 w-auto inline-block text-4xl font-heading font-black text-gradient-ui tracking-tighter" />
                <span className="bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded border border-primary/20 uppercase tracking-widest">HOST PORTAL</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[4px]">Verified Infrastructure Node</p>
           </div>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Link 
            href="/host/dashboard?action=vincular"
            className="cyber-button-ui w-full sm:w-auto text-center"
          >
            <Plus className="w-4 h-4 mr-2" /> Vincular Nueva TV
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/perfil">
               <Button variant="outline" className="h-9 border-border text-muted-foreground hover:text-foreground hover:bg-muted text-[10px] uppercase font-bold tracking-widest px-3">
                  Mi Perfil
               </Button>
            </Link>
            <div className="text-right hidden lg:block">
              <p className="text-[10px] text-muted-foreground font-mono uppercase mb-1 tracking-tighter">Identidad Verificada</p>
              <p className="text-xs text-lumi-violet dark:text-[#7C3CFF] font-bold tracking-tight">{user.email}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="mb-10 cyber-glass-ui border-[#7C3CFF]/10 overflow-hidden relative transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-30" />
          <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-6">
                  <div className="flex -space-x-2">
                      {hosts.slice(0, 5).map((h: any, i) => (
                          <div key={h.id} className="w-10 h-10 rounded-full bg-zinc-900 dark:bg-zinc-900 border-2 border-background flex items-center justify-center text-primary shadow-xl group cursor-pointer hover:translate-y-[-2px] transition-transform">
                              <Tv className="w-5 h-5" />
                          </div>
                      ))}
                      {hosts.length > 5 && (
                          <div className="w-10 h-10 rounded-full bg-zinc-800 dark:bg-zinc-800 border-2 border-background flex items-center justify-center text-xs font-bold text-zinc-400">
                              +{hosts.length - 5}
                          </div>
                      )}
                  </div>
                      <div>
                          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest leading-none mb-1">Red Propietaria</p>
                          <h3 className="text-xl font-heading text-foreground">{hosts.length} NODOS ACTIVOS</h3>
                      </div>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-center">
                  {hosts.map((h: any) => (
                      <Link 
                        key={h.id} 
                        href={`/host/dashboard?screenId=${h.id}`}
                        className={`px-3 py-1.5 rounded-md border text-[10px] uppercase font-black transition-all tracking-tighter ${
                          h.id === hostData.id 
                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105' 
                            : 'bg-muted border-border text-muted-foreground hover:text-primary hover:border-primary/50'
                        }`}
                      >
                        {h.pantallas?.nombre}
                      </Link>
                  ))}
              </div>
          </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Workspace */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Active Node Intelligence Card */}
          <section className="relative">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-heading uppercase tracking-widest text-gradient-ui flex items-center gap-2 font-black">
                  <Zap className="w-4 h-4" /> Telemetría del Nodo
                </h2>
                <div className="flex items-center gap-2">
                    {/* YIELD TIER BADGE */}
                    <div className={`px-2.5 py-1 rounded border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${
                      yieldTier === 'Elite' ? 'bg-[#7C3CFF]/10 border-[#7C3CFF]/30 text-[#7C3CFF] shadow-[0_0_10px_rgba(124,60,255,0.2)]' :
                      yieldTier === 'Premium' ? 'bg-[#7C3CFF]/10 border-[#7C3CFF]/30 text-[#7C3CFF]' :
                      yieldTier === 'Estandar' ? 'bg-primary/5 border-primary/20 text-primary' :
                      'bg-zinc-900 border-zinc-800 text-zinc-500'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        yieldTier === 'Elite' ? 'bg-[#7C3CFF] shadow-[0_0_5px_#7C3CFF]' :
                        yieldTier === 'Premium' ? 'bg-[#7C3CFF] shadow-[0_0_5px_#7C3CFF]' :
                        yieldTier === 'Estandar' ? 'bg-primary' :
                        'bg-zinc-700'
                      }`} />
                      Yield: {yieldTier} (x{yieldMult.toFixed(1)})
                    </div>

                    {hostData.hardware_certified && (
                       <span className="text-[8px] font-black uppercase bg-[#7C3CFF] text-black px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(124,60,255,0.3)]">Certificado</span>
                    )}
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${
                    pantalla?.estado === 'activa'
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}>
                    {pantalla?.estado || 'Inactiva'}
                    </span>
                    {pantalla?.id && (
                      <Link href={`/player/${pantalla.id}`} target="_blank">
                        <Button variant="outline" size="sm" className="h-7 text-[9px] uppercase font-bold border-[#7C3CFF]/20 text-[#7C3CFF] hover:bg-[#7C3CFF] hover:text-black transition-all">
                          <Monitor className="w-3 h-3 mr-1" /> Ver en Vivo
                        </Button>
                      </Link>
                    )}
                </div>
            </div>
            
            <div className="cyber-glass-ui p-8 grid grid-cols-2 md:grid-cols-4 gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                   <Monitor className="w-24 h-24 text-primary" />
                </div>
                
                <div>
                  <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-[2px] mb-3">Punto de Emisión</p>
                  <p className="text-foreground font-heading text-xl uppercase leading-tight tracking-tighter">{pantalla?.nombre || '—'}</p>
                  <p className="text-[10px] text-primary font-bold mt-1 uppercase tracking-widest">{pantalla?.ciudad || '—'}</p>
                </div>

                <div className="col-span-1 border-l border-border pl-8">
                  <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-[2px] mb-3">Yield Rate (% Share)</p>
                  <p className="text-gradient-ui font-black text-3xl leading-tight">{hostData.porcentaje}%</p>
                  <p className="text-[8px] text-muted-foreground mt-1 uppercase leading-tight font-bold">Comisión Garantizada</p>
                </div>

                <div className="col-span-1 border-l border-border pl-8">
                  <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-[2px] mb-3">Uptime Global</p>
                  <p className="text-green-600 font-mono font-black text-2xl tracking-tighter">99.9%</p>
                  <div className="flex gap-0.5 mt-2">
                     {[...Array(12)].map((_, i) => <div key={i} className="w-1 h-3 bg-green-500/40 rounded-full" />)}
                  </div>
                </div>

                <div className="col-span-1 border-l border-border pl-8">
                  <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-[2px] mb-3">Hardware Status</p>
                  <div className="flex flex-col gap-1">
                     <span className="text-[10px] text-foreground dark:text-zinc-200 font-bold uppercase tracking-tighter flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(124,60,255,0.5)]" /> GPU Ready
                     </span>
                     <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" /> AI Modulo
                     </span>
                  </div>
                </div>
            </div>
          </section>

          {/* Ledger / History Section */}
          <section>
            <h2 className="text-xs font-heading uppercase tracking-widest mb-4 text-gradient-ui flex items-center gap-2 font-black">
              <History className="w-4 h-4" /> Ledger de Emisiones Verificadas
            </h2>
            <div className="cyber-glass-ui border-border overflow-hidden">
              {comisiones && comisiones.length > 0 ? (
                <div className="responsive-table-container">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="cyber-table-header text-lumi-violet dark:text-[#7C3CFF]">Campaña de Terceros</th>
                        <th className="cyber-table-header">Fee Bruto</th>
                        <th className="cyber-table-header">Tu Dividendo</th>
                        <th className="cyber-table-header text-right">Validación UTC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {comisiones.map((com: any) => (
                        <tr key={com.id} className="hover:bg-muted/30 transition-colors group">
                          <td className="px-6 py-5">
                            <p className="font-heading text-foreground uppercase text-[11px] tracking-widest group-hover:text-primary transition-colors">
                              {com.campanas?.nombre_campana || 'Campaña Certificada'}
                            </p>
                            <p className="text-[9px] text-muted-foreground font-mono uppercase mt-1">Hash: {com.id.split('-')[0]}</p>
                          </td>
                          <td className="px-6 py-5 text-muted-foreground font-mono text-xs">{com.importe_total?.toFixed(3)}€</td>
                          <td className="px-6 py-5">
                             <div className="flex items-center gap-2">
                                <span className="font-mono text-lumi-violet dark:text-[#7C3CFF] font-black text-xs">+{com.comision?.toFixed(4)}€</span>
                                <span className="text-[8px] text-muted-foreground font-mono">({com.porcentaje}%)</span>
                             </div>
                          </td>
                          <td className="px-6 py-5 text-right text-muted-foreground font-mono text-[10px] uppercase">
                            {new Date(com.created_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-20 text-center bg-muted/5">
                  <div className="w-16 h-16 rounded-full bg-muted border border-border flex items-center justify-center mx-auto mb-6 opacity-50">
                     <History className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-[4px]">
                    Esperando flujo de publicidad programática...
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Global Wallet Section - Balanced Gold */}
        <div className="space-y-6">
            <h2 className="text-xs font-heading uppercase tracking-widest text-gradient-ui flex items-center gap-2 font-black">
                <Wallet className="w-4 h-4" /> Billetera de Infraestructura
            </h2>
            
            <div className="grid grid-cols-1 gap-6">
                {[
                    { label: 'Ingresos Acumulados', value: `${totalGenerado.toFixed(2)}€`, icon: TrendingUp, color: 'text-foreground dark:text-white', bg: 'cyber-glass-ui', sub: 'Histórico Total' },
                    { label: 'Saldo Disponible', value: `${(hostData.saldo_pendiente || 0).toFixed(2)}€`, icon: Wallet, color: 'text-lumi-violet dark:text-[#7C3CFF]', bg: 'bg-lumi-violet/5 dark:bg-[#7C3CFF]/5', sub: 'Pendiente de cobro' },
                    { label: 'Retiros Liquidados', value: `${(hostData.saldo_pagado || 0).toFixed(2)}€`, icon: ChevronRight, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-600/5 dark:bg-green-400/5', sub: 'Transferidos a cuenta' },
                ].map((item) => (
                    <div key={item.label} className={`p-8 border border-border rounded-2xl relative overflow-hidden group ${item.bg}`}>
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#7C3CFF] opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex justify-between items-start mb-6">
                             <div>
                                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[3px] mb-1">{item.label}</p>
                                <p className="text-[9px] text-lumi-violet dark:text-lumi-magenta uppercase font-black">{item.sub}</p>
                             </div>
                            <item.icon className={`w-5 h-5 ${item.color} opacity-40`} />
                        </div>
                        <p className={`text-4xl font-mono font-black tracking-tighter ${item.color}`}>{item.value}</p>
                        
                        {item.label === 'Saldo Disponible' && (hostData.saldo_pendiente || 0) >= 50 && (
                            <Button className="w-full mt-6 bg-[#7C3CFF] hover:bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-none h-10 shadow-lg shadow-[#7C3CFF]/20 transition-all">Solicitar Cobro Now</Button>
                        )}
                    </div>
                ))}
            </div>

            <div className="p-8 cyber-glass-ui border-primary/10 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
                <p className="text-[10px] text-muted-foreground font-mono uppercase leading-relaxed tracking-widest relative z-10">
                   Liquidación automática al alcanzar <span className="text-primary font-black">50.00€</span>. 
                   Verifica tu IBAN en la configuración de la cuenta para evitar retrasos en el protocolo de pago.
                </p>
            </div>
            
            <button className="w-full py-4 border border-border text-muted-foreground text-[10px] uppercase font-black tracking-[3px] hover:border-primary/50 hover:text-primary transition-all rounded-xl">
               Descargar Facturas PDF
            </button>
        </div>
      </div>
    </div>
  )
}




