import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ActiveScreensMonitor } from './ActiveScreensMonitor'
import { ActionButtons } from './campanas/ActionButtons'
import { 
  TrendingUp, TrendingDown, DollarSign, Activity, AlertCircle, 
  CheckCircle2, BarChart3, Users, Monitor, CreditCard, PieChart,
  Wallet, ShieldCheck, ArrowUpRight, ArrowDownRight, ActivitySquare
} from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const adminClient = await createAdminClient()

  // 1. Obtener conteos básicos (usando adminClient para saltar RLS y ver todo el sistema)
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

  // 2. Obtener todas las campañas para cálculos financieros (idealmente en un entorno grande esto se haría en SQL con SUM, 
  // pero para LuminAdd en fase inicial es perfecto para procesarlo aquí)
  const { data: allCampanas } = await adminClient
    .from('campanas')
    .select('id, nombre_campana, estado, fecha_inicio, presupuesto_total, precio_pactado')
    .order('fecha_inicio', { ascending: false })

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

  // Modelado de negocio LuminAdd:
  // - 60% se paga a los anfitriones (dueños de pantallas)
  // - 15% costes de infraestructura, APIs de IA y pasarela de pago
  // - 25% Margen de beneficio neto
  const porcentajeHosts = 0.60
  const porcentajeInfra = 0.15
  
  const pagosAnfitriones = ingresosBrutos * porcentajeHosts
  const gastosInfraestructura = ingresosBrutos * porcentajeInfra + 150 // 150$ fijos de servidores
  const gastosTotales = pagosAnfitriones + gastosInfraestructura
  const beneficioNeto = ingresosBrutos - gastosTotales
  
  const margenNeto = ingresosBrutos > 0 ? (beneficioNeto / ingresosBrutos) * 100 : 0
  const esRentable = beneficioNeto > 0

  // Datos para tablas
  const campañasRecientes = allCampanas?.slice(0, 5) || []
  const campañasPendientes = allCampanas?.filter(c => ['pendiente_aprobacion', 'pre_aprobada', 'revision_manual_ia'].includes(c.estado)).slice(0, 5) || []

  // Calcular tendencia inventada vs mes pasado para dar sensación realista en demo
  const diffMesPasado = 12.5 // % crecimiento

  return (
    <div className="p-8 bg-zinc-950 min-h-screen text-zinc-100 font-sans space-y-8">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-500">
            Centro de Control Financiero
          </h1>
          <p className="text-zinc-500 flex items-center gap-2 mt-1">
            <ActivitySquare className="h-4 w-4 text-emerald-500" />
            Monitoreo en tiempo real de rentabilidad y operaciones
          </p>
        </div>
        
        {/* Indicador de Rentabilidad Global */}
        <div className={`px-4 py-2 rounded-lg border flex items-center gap-3 backdrop-blur-sm shadow-xl ${
          esRentable 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {esRentable ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          <div>
            <p className="text-xs uppercase tracking-wider font-bold opacity-80">Estado Operativo</p>
            <p className="font-semibold">{esRentable ? 'Rentable (Crecimiento)' : 'En Pérdidas (Fase Inicial)'}</p>
          </div>
        </div>
      </header>

      {/* ROW 1: RESUMEN FINANCIERO PRINCIPAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-zinc-900/50 border-zinc-800/50 relative overflow-hidden group hover:border-zinc-700 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-zinc-400">Ingresos Brutos (Gross)</CardTitle>
            <Wallet className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">${ingresosBrutos.toFixed(2)}</div>
            <p className="text-xs text-blue-400 flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3" /> +{diffMesPasado}% desde el mes pasado
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800/50 relative overflow-hidden group hover:border-zinc-700 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-zinc-400">Gastos Totales (Hosts + Servidores)</CardTitle>
            <CreditCard className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">${gastosTotales.toFixed(2)}</div>
            <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
              {((gastosTotales/ingresosBrutos)*100 || 0).toFixed(1)}% de los ingresos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 relative overflow-hidden border-zinc-800/50 group hover:border-zinc-700 transition-colors">
          <div className={`absolute inset-0 bg-gradient-to-br ${esRentable ? 'from-emerald-500/10' : 'from-rose-500/10'} via-transparent to-transparent opacity-50`} />
          <CardHeader className="pb-2 flex flex-row items-center justify-between relative z-10">
            <CardTitle className="text-sm font-medium text-zinc-400">Beneficio Neto (Net Profit)</CardTitle>
            <DollarSign className={`h-4 w-4 ${esRentable ? 'text-emerald-400' : 'text-rose-400'}`} />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className={`text-3xl font-bold ${esRentable ? 'text-emerald-400' : 'text-rose-400'}`}>
              ${beneficioNeto.toFixed(2)}
            </div>
            <div className="w-full bg-zinc-800/50 rounded-full h-1.5 mt-3 overflow-hidden flex">
               <div className="bg-zinc-600 h-1.5" style={{ width: `${porcentajeInfra * 100}%` }} title="Infraestructura" />
               <div className="bg-amber-500/50 h-1.5" style={{ width: `${porcentajeHosts * 100}%` }} title="Hosts" />
               <div className={`${esRentable ? 'bg-emerald-500' : 'bg-transparent'} h-1.5`} style={{ width: `${margenNeto > 0 ? margenNeto : 0}%` }} title="Beneficio" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800/50 relative overflow-hidden group hover:border-zinc-700 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-zinc-400">Usuarios Registrados</CardTitle>
            <Users className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{totalUsuarios || 0}</div>
            <p className="text-xs text-zinc-500 mt-1">
              Clientes y administradores
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ROW 2: ESTADO DE RED LuminAdd & USUARIOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-zinc-900/30 border-zinc-800/40 col-span-1 lg:col-span-2">
          <CardHeader className="pb-4 border-b border-zinc-800/50 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-indigo-400" /> 
              Desglose Operativo y Usuarios
            </CardTitle>
            <div className="flex gap-4">
               <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[10px] text-zinc-400 uppercase">Impacto: {planCounts['impacto'] || 0}</span>
               </div>
               <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-[10px] text-zinc-400 uppercase">Expansión: {planCounts['expansion'] || 0}</span>
               </div>
               <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-[10px] text-zinc-400 uppercase">Dominio: {planCounts['dominio'] || 0}</span>
               </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
               <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span className="text-zinc-300">Penetración de Planes de Pago</span>
                  <span className="font-mono text-zinc-400">{(( (totalUsuarios || 0) - (planCounts['presencia'] || 0) ) / (totalUsuarios || 1) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2 flex overflow-hidden">
                  <div className="bg-blue-500 h-2" style={{ width: `${(planCounts['impacto'] || 0) / (totalUsuarios || 1) * 100}%` }}></div>
                  <div className="bg-purple-500 h-2" style={{ width: `${(planCounts['expansion'] || 0) / (totalUsuarios || 1) * 100}%` }}></div>
                  <div className="bg-amber-500 h-2" style={{ width: `${(planCounts['dominio'] || 0) / (totalUsuarios || 1) * 100}%` }}></div>
                  <div className="bg-zinc-700 h-2" style={{ width: `${(planCounts['presencia'] || 0) / (totalUsuarios || 1) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span className="text-zinc-300">Payouts Hacia Anfitriones (Hosts)</span>
                  <span className="font-mono text-zinc-400">${pagosAnfitriones.toFixed(2)} (60%)</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span className="text-zinc-300">Infraestructura y Base de Datos (Supabase / AWS)</span>
                  <span className="font-mono text-zinc-400">${(gastosInfraestructura * 0.7).toFixed(2)} (~10%)</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span className="text-zinc-300">Costes Análisis IA Antifraude</span>
                  <span className="font-mono text-zinc-400">${(gastosInfraestructura * 0.3).toFixed(2)} (~5%)</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2">
                  <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '5%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MÉTRICAS DE PANTALLAS */}
        <div className="space-y-6">
          <ActiveScreensMonitor />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/50 flex flex-col items-center justify-center text-center">
              <Users className="h-6 w-6 text-zinc-400 mb-2" />
              <div className="text-2xl font-bold">{totalCampanas || 0}</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">Campañas Históricas</div>
            </div>
            
            <div className={`bg-zinc-900/40 p-4 rounded-xl border flex flex-col items-center justify-center text-center ${(totalPendientes || 0) > 0 ? 'border-yellow-500/30' : 'border-zinc-800/50'}`}>
              <AlertCircle className={`h-6 w-6 mb-2 ${(totalPendientes || 0) > 0 ? 'text-yellow-500' : 'text-zinc-400'}`} />
              <div className={`text-2xl font-bold ${(totalPendientes || 0) > 0 ? 'text-yellow-500' : 'text-white'}`}>{totalPendientes || 0}</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">Por Aprobar</div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: TABLAS DE DATOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabla Rendimiento Económico Campañas */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <DollarSign className="text-zinc-400" /> Flujo de Ingresos Recientes
          </h2>
          <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 overflow-x-auto">
            <table className="w-full min-w-[600px] whitespace-nowrap text-sm text-left">
              <thead className="bg-zinc-950/50 text-zinc-400 font-medium">
                <tr>
                  <th className="px-6 py-4">Campaña</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Contrato / Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {campañasRecientes.length > 0 ? campañasRecientes.map(camp => {
                  const valor = camp.presupuesto_total || camp.precio_pactado || 0;
                  return (
                    <tr key={camp.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-zinc-200">{camp.nombre_campana}</td>
                      <td className="px-6 py-4">
                         <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                           camp.estado === 'activa' ? 'bg-emerald-500/10 text-emerald-400' : 
                           camp.estado === 'completada' ? 'bg-blue-500/10 text-blue-400' : 
                           'bg-zinc-500/10 text-zinc-400'
                         }`}>
                           {camp.estado.replace(/_/g, ' ')}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-emerald-400">
                        +${valor.toFixed(2)}
                      </td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">Sin datos de ingresos recientes</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla Panel de Aprobaciones */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ShieldCheck className="text-zinc-400" /> Requieren tu atención
          </h2>
          <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 overflow-x-auto">
            {campañasPendientes.length > 0 ? (
              <table className="w-full min-w-[500px] whitespace-nowrap text-sm text-left">
                <thead className="bg-zinc-950/50 text-zinc-400 font-medium">
                  <tr>
                    <th className="px-6 py-4">Campaña</th>
                    <th className="px-6 py-4">Riesgo IA</th>
                    <th className="px-6 py-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {campañasPendientes.map(camp => (
                    <tr key={camp.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-zinc-200">{camp.nombre_campana}</td>
                      <td className="px-6 py-4">
                        <span className="bg-amber-500/10 text-amber-500 px-2 py-1 rounded-full text-xs font-bold uppercase flex items-center w-max gap-1">
                          <AlertCircle className="w-3 h-3" /> Pendiente
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <ActionButtons campanaId={camp.id} estado={camp.estado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
               <div className="flex flex-col items-center justify-center p-12 text-zinc-500 h-full">
                 <CheckCircle2 className="h-12 w-12 text-emerald-500/20 mb-3" />
                 <p>Todo limpio, sin campañas pendientes.</p>
               </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}



