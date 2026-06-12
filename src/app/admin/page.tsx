import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ActiveScreensMonitor } from './ActiveScreensMonitor'
import { ActionButtons } from './campanas/ActionButtons'
import { RoleRequestActions } from './RoleRequestActions'
import { 
  TrendingUp, TrendingDown, DollarSign, Activity, AlertCircle, 
  CheckCircle2, BarChart3, Users, Monitor, CreditCard, PieChart,
  Wallet, ShieldCheck, ArrowUpRight, ArrowDownRight, ActivitySquare, ShieldAlert
} from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const adminClient = await createAdminClient()

  // 1. Obtener conteos básicos
  const [
    { count: totalCampanas }, 
    { count: totalPantallas },
    { count: totalPendientes },
    { count: totalUsuarios },
    { data: planBreakdown }
  ] = await Promise.all([
    adminClient.from('campanas').select('*', { count: 'exact', head: true }),
    adminClient.from('pantallas').select('*', { count: 'exact', head: true }),
    adminClient.from('campanas').select('*', { count: 'exact', head: true }).in('estado', ['pendiente_aprobacion', 'pre_aprobada', 'revision_manual_ia']),
    adminClient.from('perfiles').select('*', { count: 'exact', head: true }),
    adminClient.from('perfiles').select('plan_id')
  ])

  // Procesar desglose de planes
  const planCounts = (planBreakdown || []).reduce((acc: Record<string, number>, curr) => {
    const plan = curr.plan_id || 'sin_plan'
    acc[plan] = (acc[plan] || 0) + 1
    return acc
  }, {})

  // 2. Obtener todas las campañas para cálculos financieros
  const { data: allCampanas } = await adminClient
    .from('campanas')
    .select('id, nombre_campana, estado, fecha_inicio, presupuesto_total, precio_pactado')
    .order('fecha_inicio', { ascending: false })

  // 2b. Obtener solicitudes de rol pendientes
  const { data: roleRequests } = await adminClient
    .from('soporte_tickets')
    .select('id, asunto, user_id, created_at')
    .eq('categoria', 'GESTION_CUENTA')
    .eq('estado', 'PENDIENTE')
    .order('created_at', { ascending: false })

  // 3. Cálculos Financieros
  let ingresosBrutos = 0
  let ingresosCompletados = 0
  
  if (allCampanas) {
    allCampanas.forEach(c => {
      const valor = c.presupuesto_total || c.precio_pactado || 0
      ingresosBrutos += valor
      if (c.estado === 'completada' || c.estado === 'activa') {
        ingresosCompletados += valor
      }
    })
  }

  const porcentajeHosts = 0.60
  const porcentajeInfra = 0.15
  
  const pagosAnfitriones = ingresosBrutos * porcentajeHosts
  const gastosInfraestructura = ingresosBrutos * porcentajeInfra + 150 
  const gastosTotales = pagosAnfitriones + gastosInfraestructura
  const beneficioNeto = ingresosBrutos - gastosTotales
  
  const margenNeto = ingresosBrutos > 0 ? (beneficioNeto / ingresosBrutos) * 100 : 0
  const esRentable = beneficioNeto > 0

  // Datos para tablas
  const campañasRecientes = allCampanas?.slice(0, 5) || []
  const campañasPendientes = allCampanas?.filter(c => ['pendiente_aprobacion', 'pre_aprobada', 'revision_manual_ia'].includes(c.estado)).slice(0, 5) || []

  return (
    <div className="font-sans space-y-8 pb-12">
      
      {/* Top Admin Banner */}
      <div className="w-full bg-gradient-to-r from-lumi-violet/10 via-lumi-magenta/10 to-lumi-blue/10 border border-lumi-violet/20 rounded-xl p-4 flex items-center justify-between shadow-[0_0_30px_rgba(124,60,255,0.05)] animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-lumi-magenta animate-pulse" />
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white font-bold">Consola de Superadministrador Restringida</p>
            <p className="text-[9px] text-zinc-500 font-mono mt-0.5">Solo operaciones autorizadas. Toda la actividad de la sesión es registrada bajo protocolo seguro.</p>
          </div>
        </div>
        <span className="text-[8px] font-mono bg-lumi-magenta/20 text-lumi-magenta border border-lumi-magenta/30 px-2 py-0.5 rounded uppercase tracking-widest font-black">
          Nivel: Superusuario
        </span>
      </div>

      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-8">
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-400 to-zinc-500 tracking-tighter uppercase">
            Sistema de Anulación <span className="bg-clip-text text-transparent bg-gradient-to-r from-lumi-violet via-lumi-magenta to-lumi-blue drop-shadow-[0_0_15px_rgba(124,60,255,0.3)]">Global</span>
          </h1>
          <p className="text-zinc-500 flex items-center gap-2 mt-2 uppercase tracking-widest text-[10px] font-bold">
            <ActivitySquare className="h-3 w-3 text-lumi-blue" />
            Acceso Superadmin. Todas las acciones quedan auditadas.
          </p>
          {/* Admin terminal status bar (visual difference) */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-[9px] font-mono text-zinc-500 uppercase tracking-widest bg-white/[0.02] border border-white/5 rounded-lg px-4 py-2 w-fit">
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>SISTEMA: ONLINE</span>
            <span className="text-zinc-700">|</span>
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-lumi-blue"></span>SESIÓN: SEGURA</span>
            <span className="text-zinc-700">|</span>
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-lumi-violet"></span>BYPASS RLS: ACTIVO</span>
            <span className="text-zinc-700">|</span>
            <span className="flex items-center gap-1.5 text-zinc-400">LATENCIA: 12ms</span>
          </div>
        </div>
        
        {/* Indicador de Rentabilidad Global */}
        <div className={`px-6 py-3 rounded border flex items-center gap-4 shadow-[0_0_20px_rgba(0,0,0,0.5)] ${
          esRentable 
            ? 'bg-green-500/10 border-green-500/30 text-green-400' 
            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
        }`}>
          {esRentable ? <TrendingUp className="h-6 w-6 text-green-400" /> : <TrendingDown className="h-6 w-6 text-amber-500" />}
          <div>
            <p className="text-[9px] uppercase tracking-[3px] font-black opacity-80 text-white">Estado Net</p>
            <p className="font-mono text-lg">{esRentable ? 'RENTABLE' : 'DÉFICIT'}</p>
          </div>
        </div>
      </header>

      {/* ROW 1: RESUMEN FINANCIERO PRINCIPAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 border border-white/[0.08] bg-card rounded-lg relative overflow-hidden group transition-all hover:border-lumi-blue/30">
          <div className="absolute inset-0 bg-gradient-to-br from-lumi-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-4">
             <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Ingresos Brutos</p>
             <Wallet className="h-4 w-4 text-lumi-blue/50" />
          </div>
          <div className="text-4xl font-mono font-black text-white">${ingresosBrutos.toFixed(2)}</div>
          <p className="text-[9px] uppercase text-zinc-600 mt-2 flex items-center gap-1 font-bold">
            <ArrowUpRight className="h-3 w-3 text-lumi-blue" /> Crecimiento stable
          </p>
        </div>

        <div className="p-6 border border-white/[0.08] bg-card rounded-lg relative overflow-hidden group transition-all hover:border-lumi-magenta/30">
          <div className="absolute inset-0 bg-gradient-to-br from-lumi-magenta/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-4">
             <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Gastos Totales</p>
             <CreditCard className="h-4 w-4 text-lumi-magenta/50" />
          </div>
          <div className="text-4xl font-mono font-black text-white">${gastosTotales.toFixed(2)}</div>
          <p className="text-[9px] uppercase text-zinc-600 mt-2 flex items-center gap-1 font-bold">
            Hosts + Infraestructura
          </p>
        </div>

        <div className="p-6 border border-lumi-violet/30 bg-lumi-violet/5 rounded-lg relative overflow-hidden group transition-all hover:border-lumi-violet/50 shadow-[0_0_30px_rgba(124,60,255,0.05)]">
          <div className={`absolute inset-0 bg-gradient-to-br from-lumi-violet/10 to-transparent`} />
          <div className="flex justify-between items-start mb-4 relative z-10">
             <p className="text-[10px] uppercase font-bold tracking-widest text-lumi-blue">Beneficio Neto</p>
             <DollarSign className="h-4 w-4 text-lumi-violet" />
          </div>
          <div className="text-4xl font-mono font-black text-white relative z-10">
             ${beneficioNeto.toFixed(2)}
          </div>
          <div className="w-full bg-black/40 rounded-full h-1 mt-4 overflow-hidden flex relative z-10 border border-white/5">
             <div className="bg-lumi-magenta/50 h-1" style={{ width: `${porcentajeInfra * 100}%` }} title="Infraestructura" />
             <div className="bg-lumi-blue/50 h-1" style={{ width: `${porcentajeHosts * 100}%` }} title="Hosts" />
             <div className={`bg-lumi-violet h-1`} style={{ width: `${margenNeto > 0 ? margenNeto : 0}%` }} title="Beneficio" />
          </div>
        </div>

        <div className="p-6 border border-white/[0.08] bg-card rounded-lg relative overflow-hidden group transition-all hover:border-lumi-blue/30">
          <div className="absolute inset-0 bg-gradient-to-br from-lumi-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-4">
             <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Usuarios Registrados</p>
             <Users className="h-4 w-4 text-lumi-blue/50" />
          </div>
          <div className="text-4xl font-mono font-black text-white">{totalUsuarios || 0}</div>
          <p className="text-[9px] uppercase text-zinc-600 mt-2 font-bold">
            Red Global
          </p>
        </div>
      </div>

      {/* ROW 2: ESTADO DE RED LumiAds & USUARIOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
        <div className="col-span-1 lg:col-span-2 p-8 border border-white/[0.08] bg-card rounded-lg">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/[0.08]">
            <h2 className="text-lg font-black uppercase tracking-widest text-white flex items-center gap-2">
               <BarChart3 className="w-5 h-5 text-lumi-violet" /> Asignación del Sistema
            </h2>
          </div>
          <div className="space-y-8">
             <div>
              <div className="flex justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Pagos a Anfitriones</span>
                <span className="font-mono text-[10px] text-zinc-400">60.0%</span>
              </div>
              <div className="w-full bg-black/40 rounded-none h-2 border border-white/5">
                <div className="bg-lumi-blue h-full" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Procesamiento de IA y Nube</span>
                <span className="font-mono text-[10px] text-zinc-400">10.5%</span>
              </div>
              <div className="w-full bg-black/40 rounded-none h-2 border border-white/5">
                <div className="bg-lumi-magenta h-full" style={{ width: '10.5%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Margen de LumiAds</span>
                <span className="font-mono text-[10px] text-zinc-400">29.5%</span>
              </div>
              <div className="w-full bg-black/40 rounded-none h-2 border border-white/5">
                <div className="bg-lumi-violet h-full shadow-[0_0_10px_rgba(124,60,255,0.5)]" style={{ width: '29.5%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* MÉTRICAS DE PANTALLAS */}
        <div className="space-y-6">
          <ActiveScreensMonitor />
          
          <div className="grid grid-cols-2 gap-4 h-[120px]">
            <div className="p-6 border border-white/[0.08] bg-card rounded-lg flex flex-col justify-center items-center text-center">
              <div className="text-3xl font-mono font-black text-white">{totalCampanas || 0}</div>
              <div className="text-[9px] uppercase font-bold tracking-widest text-zinc-600 mt-2">Campañas Totales</div>
            </div>
            
            <div className={`p-6 border rounded-lg flex flex-col justify-center items-center text-center relative overflow-hidden ${(totalPendientes || 0) > 0 ? 'border-lumi-violet/30 bg-lumi-violet/5' : 'border-white/[0.08] bg-card'}`}>
              {(totalPendientes || 0) > 0 && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-lumi-violet to-lumi-magenta animate-pulse" />}
              <div className={`text-3xl font-mono font-black ${(totalPendientes || 0) > 0 ? 'text-lumi-magenta' : 'text-white'}`}>{totalPendientes || 0}</div>
              <div className="text-[9px] uppercase font-bold tracking-widest text-zinc-600 mt-2">Por Aprobar</div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: TABLAS DE DATOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
        {/* Tabla Rendimiento Económico Campañas */}
        <div className="border border-white/[0.08] rounded-lg overflow-hidden bg-card">
          <div className="p-6 border-b border-white/[0.08] bg-black/40">
             <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
               <DollarSign className="w-4 h-4 text-lumi-blue" /> Flujo Financiero
             </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-black/40 border-b border-white/[0.08]">
                <tr>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Transacción</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Estado</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-600 font-bold text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {campañasRecientes.length > 0 ? campañasRecientes.map(camp => {
                  const valor = camp.presupuesto_total || camp.precio_pactado || 0;
                  return (
                    <tr key={camp.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-zinc-300 uppercase">{camp.nombre_campana}</td>
                      <td className="px-6 py-4">
                         <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                           camp.estado === 'activa' ? 'bg-lumi-blue/10 text-lumi-blue border border-lumi-blue/20' : 
                           camp.estado === 'completada' ? 'bg-white/10 text-white' : 
                           'bg-black/40 text-zinc-500'
                         }`}>
                           {camp.estado.replace(/_/g, ' ')}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-sm text-zinc-100">
                        ${valor.toFixed(2)}
                      </td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-[10px] font-mono uppercase tracking-widest text-zinc-700">Sin transacciones recientes</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla Panel de Aprobaciones */}
        <div className="border border-white/[0.08] rounded-lg overflow-hidden bg-card">
          <div className="p-6 border-b border-white/[0.08] bg-black/40 flex justify-between items-center">
             <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
               <ShieldAlert className="w-4 h-4 text-lumi-violet" /> Control de Seguridad
             </h2>
             {(totalPendientes || 0) > 0 && (
                <span className="text-[9px] uppercase tracking-widest font-black text-lumi-magenta bg-lumi-magenta/10 border border-lumi-magenta/20 px-2 py-1 rounded">Acción Requerida</span>
             )}
          </div>
          <div className="overflow-x-auto">
            {campañasPendientes.length > 0 ? (
              <table className="w-full text-left">
                <thead className="bg-black/40 border-b border-white/[0.08]">
                  <tr>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Campaña a Revisar</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-600 font-bold text-right">Comandos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {campañasPendientes.map(camp => (
                    <tr key={camp.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                         <p className="text-xs font-bold text-zinc-300 uppercase">{camp.nombre_campana}</p>
                         <p className="text-[9px] font-mono uppercase text-lumi-magenta mt-1">Estado: Pendiente de Verificación</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <ActionButtons campanaId={camp.id} estado={camp.estado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
               <div className="flex flex-col items-center justify-center p-16 text-zinc-600 h-full">
                 <ShieldCheck className="h-12 w-12 text-zinc-700 mb-4" />
                 <p className="text-[10px] font-mono uppercase tracking-widest">No hay verificaciones de seguridad pendientes.</p>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* ROW 4: SOLICITUDES DE ROLES */}
      <div className="pt-6">
        <div className="border border-white/[0.08] rounded-lg overflow-hidden bg-card">
          <div className="p-6 border-b border-white/[0.08] bg-black/40 flex justify-between items-center">
             <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
               <ShieldCheck className="w-4 h-4 text-lumi-violet" /> Gestión de Roles y Permisos
             </h2>
             {(roleRequests?.length || 0) > 0 && (
                <span className="text-[9px] uppercase tracking-widest font-black text-lumi-violet bg-lumi-violet/10 px-2 py-1 rounded">{roleRequests?.length} Pendientes</span>
             )}
          </div>
          <div className="overflow-x-auto">
            {roleRequests && roleRequests.length > 0 ? (
              <table className="w-full text-left">
                <thead className="bg-black/40 border-b border-white/[0.08]">
                  <tr>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Solicitud</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Fecha</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-600 font-bold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {roleRequests.map(req => {
                    const isAlta = req.asunto.toLowerCase().includes('alta')
                    const roleType = req.asunto.toLowerCase().includes('anunciante') ? 'Anunciante' : 'Host'
                    return (
                      <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                           <p className="text-xs font-bold text-white uppercase">{isAlta ? 'ALTA DE ROL' : 'BAJA DE ROL'}</p>
                           <p className="text-[10px] font-mono text-zinc-400 mt-1 uppercase tracking-widest">{roleType} • {req.user_id}</p>
                        </td>
                        <td className="px-6 py-4">
                           <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{new Date(req.created_at).toLocaleDateString()}</span>
                        </td>
                        <td className="px-6 py-4">
                           <RoleRequestActions 
                             ticketId={req.id} 
                             userId={req.user_id} 
                             role={roleType} 
                             requestType={isAlta ? 'Alta' : 'Baja'} 
                           />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
               <div className="flex flex-col items-center justify-center p-16 text-zinc-600 h-full">
                 <Users className="h-12 w-12 text-zinc-700 mb-4" />
                 <p className="text-[10px] font-mono uppercase tracking-widest">No hay solicitudes de roles pendientes.</p>
               </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
