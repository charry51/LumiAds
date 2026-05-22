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
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-red-900/20 pb-8">
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-400 to-zinc-600 tracking-tighter uppercase">
            Global Override <span className="text-red-500">System</span>
          </h1>
          <p className="text-zinc-500 flex items-center gap-2 mt-2 uppercase tracking-widest text-[10px] font-bold">
            <ActivitySquare className="h-3 w-3 text-red-500" />
            Acceso Superadmin. Todas las acciones quedan auditadas.
          </p>
        </div>
        
        {/* Indicador de Rentabilidad Global */}
        <div className={`px-6 py-3 rounded border flex items-center gap-4 shadow-[0_0_20px_rgba(0,0,0,0.5)] ${
          esRentable 
            ? 'bg-red-500/10 border-red-500/30 text-red-400' 
            : 'bg-zinc-900/50 border-zinc-800 text-zinc-400'
        }`}>
          {esRentable ? <TrendingUp className="h-6 w-6 text-red-500" /> : <TrendingDown className="h-6 w-6 text-zinc-500" />}
          <div>
            <p className="text-[9px] uppercase tracking-[3px] font-black opacity-80 text-white">Estado Net</p>
            <p className="font-mono text-lg">{esRentable ? 'PROFITABLE' : 'DEFICIT'}</p>
          </div>
        </div>
      </header>

      {/* ROW 1: RESUMEN FINANCIERO PRINCIPAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 border border-zinc-900 bg-zinc-950/80 rounded-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-4">
             <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Gross Income</p>
             <Wallet className="h-4 w-4 text-red-500/50" />
          </div>
          <div className="text-4xl font-mono font-black text-white">${ingresosBrutos.toFixed(2)}</div>
          <p className="text-[9px] uppercase text-zinc-600 mt-2 flex items-center gap-1 font-bold">
            <ArrowUpRight className="h-3 w-3 text-red-500" /> Crecimiento estable
          </p>
        </div>

        <div className="p-6 border border-zinc-900 bg-zinc-950/80 rounded-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-4">
             <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Total Expenses</p>
             <CreditCard className="h-4 w-4 text-orange-500/50" />
          </div>
          <div className="text-4xl font-mono font-black text-white">${gastosTotales.toFixed(2)}</div>
          <p className="text-[9px] uppercase text-zinc-600 mt-2 flex items-center gap-1 font-bold">
            Hosts + Infraestructura
          </p>
        </div>

        <div className="p-6 border border-red-900/30 bg-red-950/10 rounded-lg relative overflow-hidden group shadow-[0_0_30px_rgba(239,68,68,0.05)]">
          <div className={`absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent`} />
          <div className="flex justify-between items-start mb-4 relative z-10">
             <p className="text-[10px] uppercase font-bold tracking-widest text-red-400">Net Profit</p>
             <DollarSign className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-4xl font-mono font-black text-white relative z-10">
             ${beneficioNeto.toFixed(2)}
          </div>
          <div className="w-full bg-black/50 rounded-full h-1 mt-4 overflow-hidden flex relative z-10">
             <div className="bg-zinc-700 h-1" style={{ width: `${porcentajeInfra * 100}%` }} title="Infraestructura" />
             <div className="bg-orange-500/50 h-1" style={{ width: `${porcentajeHosts * 100}%` }} title="Hosts" />
             <div className={`bg-red-500 h-1`} style={{ width: `${margenNeto > 0 ? margenNeto : 0}%` }} title="Beneficio" />
          </div>
        </div>

        <div className="p-6 border border-zinc-900 bg-zinc-950/80 rounded-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-4">
             <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Usuarios Registrados</p>
             <Users className="h-4 w-4 text-zinc-600" />
          </div>
          <div className="text-4xl font-mono font-black text-white">{totalUsuarios || 0}</div>
          <p className="text-[9px] uppercase text-zinc-600 mt-2 font-bold">
            Red Global
          </p>
        </div>
      </div>

      {/* ROW 2: ESTADO DE RED LuminAdd & USUARIOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
        <div className="col-span-1 lg:col-span-2 p-8 border border-zinc-900 bg-zinc-950/50 rounded-lg">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-900">
            <h2 className="text-lg font-black uppercase tracking-widest text-white flex items-center gap-2">
               <BarChart3 className="w-5 h-5 text-red-500" /> System Allocation
            </h2>
          </div>
          <div className="space-y-8">
             <div>
              <div className="flex justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Host Payouts</span>
                <span className="font-mono text-[10px] text-zinc-400">60.0%</span>
              </div>
              <div className="w-full bg-black rounded-none h-2 border border-zinc-900">
                <div className="bg-orange-500 h-full" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Cloud & AI Processing</span>
                <span className="font-mono text-[10px] text-zinc-400">10.5%</span>
              </div>
              <div className="w-full bg-black rounded-none h-2 border border-zinc-900">
                <div className="bg-zinc-600 h-full" style={{ width: '10.5%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">LumiAds Margin</span>
                <span className="font-mono text-[10px] text-zinc-400">29.5%</span>
              </div>
              <div className="w-full bg-black rounded-none h-2 border border-zinc-900">
                <div className="bg-red-500 h-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" style={{ width: '29.5%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* MÉTRICAS DE PANTALLAS */}
        <div className="space-y-6">
          <ActiveScreensMonitor />
          
          <div className="grid grid-cols-2 gap-4 h-[120px]">
            <div className="p-6 border border-zinc-900 bg-zinc-950/80 rounded-lg flex flex-col justify-center items-center text-center">
              <div className="text-3xl font-mono font-black text-white">{totalCampanas || 0}</div>
              <div className="text-[9px] uppercase font-bold tracking-widest text-zinc-600 mt-2">Campañas Totales</div>
            </div>
            
            <div className={`p-6 border rounded-lg flex flex-col justify-center items-center text-center relative overflow-hidden ${(totalPendientes || 0) > 0 ? 'border-red-900/50 bg-red-950/20' : 'border-zinc-900 bg-zinc-950/80'}`}>
              {(totalPendientes || 0) > 0 && <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" />}
              <div className={`text-3xl font-mono font-black ${(totalPendientes || 0) > 0 ? 'text-red-500' : 'text-white'}`}>{totalPendientes || 0}</div>
              <div className="text-[9px] uppercase font-bold tracking-widest text-zinc-600 mt-2">Por Aprobar</div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: TABLAS DE DATOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
        {/* Tabla Rendimiento Económico Campañas */}
        <div className="border border-zinc-900 rounded-lg overflow-hidden bg-black">
          <div className="p-6 border-b border-zinc-900 bg-zinc-950">
             <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
               <DollarSign className="w-4 h-4 text-zinc-500" /> Flujo Financiero
             </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-950 border-b border-zinc-900">
                <tr>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Transacción</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Estado</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-600 font-bold text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {campañasRecientes.length > 0 ? campañasRecientes.map(camp => {
                  const valor = camp.presupuesto_total || camp.precio_pactado || 0;
                  return (
                    <tr key={camp.id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-zinc-300 uppercase">{camp.nombre_campana}</td>
                      <td className="px-6 py-4">
                         <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                           camp.estado === 'activa' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                           camp.estado === 'completada' ? 'bg-zinc-800 text-white' : 
                           'bg-zinc-900 text-zinc-500'
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
        <div className="border border-zinc-900 rounded-lg overflow-hidden bg-black">
          <div className="p-6 border-b border-zinc-900 bg-zinc-950 flex justify-between items-center">
             <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
               <ShieldAlert className="w-4 h-4 text-red-500" /> Security Override
             </h2>
             {(totalPendientes || 0) > 0 && (
                <span className="text-[9px] uppercase tracking-widest font-black text-red-500 bg-red-500/10 px-2 py-1 rounded">Action Required</span>
             )}
          </div>
          <div className="overflow-x-auto">
            {campañasPendientes.length > 0 ? (
              <table className="w-full text-left">
                <thead className="bg-zinc-950 border-b border-zinc-900">
                  <tr>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Campaña a Revisar</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-600 font-bold text-right">Comandos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {campañasPendientes.map(camp => (
                    <tr key={camp.id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="px-6 py-4">
                         <p className="text-xs font-bold text-zinc-300 uppercase">{camp.nombre_campana}</p>
                         <p className="text-[9px] font-mono uppercase text-red-500 mt-1">Status: Pending Verification</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <ActionButtons campanaId={camp.id} estado={camp.estado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
               <div className="flex flex-col items-center justify-center p-16 text-zinc-700 h-full">
                 <ShieldCheck className="h-12 w-12 text-zinc-800 mb-4" />
                 <p className="text-[10px] font-mono uppercase tracking-widest">No hay brechas de seguridad.</p>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* ROW 4: SOLICITUDES DE ROLES */}
      <div className="pt-6">
        <div className="border border-zinc-900 rounded-lg overflow-hidden bg-black">
          <div className="p-6 border-b border-zinc-900 bg-zinc-950 flex justify-between items-center">
             <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
               <ShieldCheck className="w-4 h-4 text-[#7C3CFF]" /> Gestión de Roles y Permisos
             </h2>
             {(roleRequests?.length || 0) > 0 && (
                <span className="text-[9px] uppercase tracking-widest font-black text-[#7C3CFF] bg-[#7C3CFF]/10 px-2 py-1 rounded">{roleRequests?.length} Pendientes</span>
             )}
          </div>
          <div className="overflow-x-auto">
            {roleRequests && roleRequests.length > 0 ? (
              <table className="w-full text-left">
                <thead className="bg-zinc-950 border-b border-zinc-900">
                  <tr>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Solicitud</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Fecha</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-600 font-bold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {roleRequests.map(req => {
                    const isAlta = req.asunto.toLowerCase().includes('alta')
                    const roleType = req.asunto.toLowerCase().includes('anunciante') ? 'Anunciante' : 'Host'
                    return (
                      <tr key={req.id} className="hover:bg-zinc-900/50 transition-colors">
                        <td className="px-6 py-4">
                           <p className="text-xs font-bold text-white uppercase">{isAlta ? 'ALTA' : 'BAJA'} DE ROL</p>
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
               <div className="flex flex-col items-center justify-center p-16 text-zinc-700 h-full">
                 <Users className="h-12 w-12 text-zinc-800 mb-4" />
                 <p className="text-[10px] font-mono uppercase tracking-widest">No hay solicitudes de roles pendientes.</p>
               </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
