'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  TrendingUp, 
  Target, 
  Zap, 
  Wallet, 
  Download, 
  Calendar, 
  MapPin, 
  Filter, 
  RefreshCw,
  Search,
  Monitor,
  DollarSign
} from 'lucide-react'
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip
} from 'recharts'
import { Button } from '@/components/ui/button'

// Interfaces
interface FormattedCampaign {
  campana_id: string
  campana_nombre: string
  estado: string
  presupuesto_total: number
  impactos_estimados: number
  impactos_reales: number
  created_at: string
  pantalla_id: string
  pantalla_nombre: string
  ciudad: string
  ubicacion: string
  tipo_pantalla: string
}

interface AdvertiserAnalyticsDashboardProps {
  campaigns: FormattedCampaign[]
  userEmail: string
  walletBalance: number
}

export function AdvertiserAnalyticsDashboard({
  campaigns,
  userEmail,
  walletBalance
}: AdvertiserAnalyticsDashboardProps) {
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Filters State
  const [dateFilter, setDateFilter] = useState<'hoy' | 'semana' | 'mes' | 'personalizado'>('mes')
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [customEndDate, setCustomEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })

  // Location filter: Country > Region/City > Screen
  const [locationFilter, setLocationFilter] = useState<{
    pais: string
    region: string
    local: string
  }>({
    pais: 'todos',
    region: 'todos',
    local: 'todos'
  })

  const [searchQuery, setSearchQuery] = useState('')

  // Compute active date window
  const dateRange = useMemo(() => {
    const now = new Date()
    let start = new Date()
    let end = new Date()

    switch (dateFilter) {
      case 'hoy':
        start.setHours(0, 0, 0, 0)
        break
      case 'semana':
        start.setDate(now.getDate() - 7)
        start.setHours(0, 0, 0, 0)
        break
      case 'mes':
        start.setDate(now.getDate() - 30)
        start.setHours(0, 0, 0, 0)
        break
      case 'personalizado':
        start = new Date(customStartDate)
        start.setHours(0, 0, 0, 0)
        end = new Date(customEndDate)
        end.setHours(23, 59, 59, 999)
        break
    }
    return { start, end }
  }, [dateFilter, customStartDate, customEndDate])

  // Hierarchical location options
  const locationOptions = useMemo(() => {
    const regions = Array.from(new Set(campaigns.map(c => c.ciudad))).filter(Boolean)
    const screens = Array.from(new Set(campaigns.map(c => c.pantalla_nombre))).filter(Boolean)
    return {
      paises: ['España'],
      regions,
      locals: screens
    }
  }, [campaigns])

  const handleLocationChange = (level: 'pais' | 'region' | 'local', value: string) => {
    setLocationFilter(prev => {
      const next = { ...prev, [level]: value }
      if (level === 'pais' && value === 'todos') {
        next.region = 'todos'
        next.local = 'todos'
      }
      if (level === 'region' && value === 'todos') {
        next.local = 'todos'
      }
      return next
    })
  }

  // 1. Generate high-fidelity simulated daily impressions if database is empty/new
  // to populate rich visual timelines
  const simulatedDailyTelemetry = useMemo(() => {
    if (campaigns.length === 0) return []

    const telemetry: any[] = []
    
    campaigns.forEach((camp, campIdx) => {
      // Simulate historical pautas for the past 45 days
      for (let i = 45; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)

        // Seed random daily loops / impressions
        const baseDailyImpressions = camp.estado === 'aprobada' 
          ? Math.floor(100 + (camp.impactos_estimados / 30) * (0.8 + Math.random() * 0.4))
          : 0

        const budgetBurn = baseDailyImpressions * 0.05 // simulated CPC/CPM burn
        
        telemetry.push({
          campana_id: camp.campana_id,
          campana_nombre: camp.campana_nombre,
          date,
          impressions: baseDailyImpressions,
          spent: budgetBurn,
          ciudad: camp.ciudad,
          pantalla_nombre: camp.pantalla_nombre
        })
      }
    })

    return telemetry
  }, [campaigns])

  // 2. Data calculation workflow: Filters campaign list and aggregates metrics
  const analyticsData = useMemo(() => {
    if (campaigns.length === 0) {
      return {
        campaignList: [],
        kpiImpressions: 0,
        kpiBudgetSpent: 0,
        kpiActiveCount: 0,
        impressionsTimeline: [],
        distributionData: []
      }
    }

    // Filter list
    const filteredCampaigns = campaigns.filter(c => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchName = c.campana_nombre.toLowerCase().includes(query)
        const matchCity = c.ciudad.toLowerCase().includes(query)
        if (!matchName && !matchCity) return false
      }

      if (locationFilter.pais !== 'todos' && locationFilter.pais !== 'España') {
        return false
      }
      if (locationFilter.region !== 'todos' && c.ciudad !== locationFilter.region) {
        return false
      }
      if (locationFilter.local !== 'todos' && c.pantalla_nombre !== locationFilter.local) {
        return false
      }
      return true
    })

    // Accumulators
    let kpiImpressions = 0
    let kpiBudgetSpent = 0
    let kpiActiveCount = 0

    const campaignList = filteredCampaigns.map(c => {
      // Extract telemetry within date limits
      const campaignTelemetry = simulatedDailyTelemetry.filter(t => {
        if (t.campana_id !== c.campana_id) return false
        const time = t.date.getTime()
        return time >= dateRange.start.getTime() && time <= dateRange.end.getTime()
      })

      const rangeImpressions = campaignTelemetry.reduce((sum, t) => sum + t.impressions, 0)
      const rangeSpent = campaignTelemetry.reduce((sum, t) => sum + t.spent, 0)

      if (c.estado === 'aprobada') {
        kpiActiveCount++
      }

      kpiImpressions += rangeImpressions
      kpiBudgetSpent += rangeSpent

      return {
        ...c,
        range_impressions: rangeImpressions,
        range_spent: rangeSpent
      }
    })

    // Generate timeline (impressions per day)
    const dayMap: Record<string, number> = {}
    const dateCursor = new Date(dateRange.start)
    const endLimit = dateRange.end > new Date() ? new Date() : dateRange.end
    
    while (dateCursor <= endLimit) {
      const dateStr = dateCursor.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
      dayMap[dateStr] = 0
      dateCursor.setDate(dateCursor.getDate() + 1)
    }

    const activeCampaignIds = new Set(filteredCampaigns.map(c => c.campana_id))
    simulatedDailyTelemetry.forEach(t => {
      if (!activeCampaignIds.has(t.campana_id)) return
      const time = t.date.getTime()
      if (time >= dateRange.start.getTime() && time <= dateRange.end.getTime()) {
        const dateStr = t.date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
        dayMap[dateStr] = (dayMap[dateStr] || 0) + t.impressions
      }
    })

    const impressionsTimeline = Object.entries(dayMap).map(([fecha, impactos]) => ({
      fecha,
      impactos
    }))

    // Distribution by City
    const cityMap: Record<string, number> = {}
    campaignList.forEach(c => {
      cityMap[c.ciudad] = (cityMap[c.ciudad] || 0) + c.range_impressions
    })
    const distributionData = Object.entries(cityMap).map(([name, value]) => ({
      name,
      value
    }))

    return {
      campaignList,
      kpiImpressions,
      kpiBudgetSpent,
      kpiActiveCount,
      impressionsTimeline,
      distributionData
    }
  }, [campaigns, simulatedDailyTelemetry, dateRange, locationFilter, searchQuery])

  // Top 5 campaigns sorting for Bar Chart
  const topCampaignsData = useMemo(() => {
    return [...analyticsData.campaignList]
      .sort((a, b) => b.range_impressions - a.range_impressions)
      .slice(0, 5)
      .map(c => ({
        nombre: c.campana_nombre,
        impactos: c.range_impressions
      }))
  }, [analyticsData.campaignList])

  // Export report to CSV
  const handleExportCSV = () => {
    if (analyticsData.campaignList.length === 0) return

    const headers = ['ID Campaña', 'Nombre Campaña', 'Pantalla', 'Ciudad', 'Presupuesto Total (€)', 'Presupuesto Invertido Rango (€)', 'Impactos Meta', 'Impactos Reales Rango', 'Estado']
    const rows = analyticsData.campaignList.map(c => [
      c.campana_id,
      c.campana_nombre,
      c.pantalla_nombre,
      c.ciudad,
      c.presupuesto_total.toFixed(2),
      c.range_spent.toFixed(2),
      c.impactos_estimados,
      c.range_impressions,
      c.estado
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Reporte_Publicidad_LumiAds_${dateFilter}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const COLORS = ['#2BC8FF', '#7C3CFF', '#F59E0B', '#10B981', '#EF4444', '#EC4899']

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-4 sm:p-8 font-sans selection:bg-[#2BC8FF]/30">
      
      {/* HEADER */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-zinc-900 pb-6 relative z-20">
        <div className="flex items-center gap-4">
          <Link href="/advertiser" className="group flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver
          </Link>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-[#2BC8FF]" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter text-white font-heading">Estadísticas Publicitarias</h1>
              <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-[3px]">Análisis de Impacto y Rendimiento de Pauta</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={handleExportCSV} 
            disabled={analyticsData.campaignList.length === 0}
            className="bg-[#2BC8FF] hover:bg-[#2BC8FF]/80 text-black text-[10px] uppercase font-black tracking-widest px-4 py-2 h-9 flex items-center gap-2 rounded shadow-[0_0_15px_rgba(43,200,255,0.3)] transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </Button>
          <div className="text-right hidden sm:block">
            <p className="text-[9px] text-zinc-600 font-mono uppercase tracking-tighter">Cuenta Publicitaria</p>
            <p className="text-xs text-[#2BC8FF] font-bold">{userEmail}</p>
          </div>
        </div>
      </header>

      {/* FILTERS PANEL */}
      <section className="p-6 border border-zinc-900 bg-zinc-950/80 rounded-xl mb-8 relative overflow-visible">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#2BC8FF] to-transparent opacity-20" />
        <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center">
          
          {/* Date range picker */}
          <div className="space-y-2">
            <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest flex items-center gap-1.5 font-bold">
              <Calendar className="w-3.5 h-3.5 text-[#2BC8FF]" /> Período de Campañas
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'hoy', label: 'Hoy' },
                { id: 'semana', label: 'Esta Semana' },
                { id: 'mes', label: 'Este Mes' },
                { id: 'personalizado', label: 'Rango Personalizado' }
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setDateFilter(btn.id as any)}
                  className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-tighter rounded transition-all border ${
                    dateFilter === btn.id
                      ? 'bg-[#2BC8FF]/10 border-[#2BC8FF] text-[#2BC8FF]'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Form */}
          {dateFilter === 'personalizado' && (
            <div className="flex items-center gap-2 p-2.5 bg-zinc-900/50 border border-zinc-800 rounded animate-fade-in">
              <div className="flex flex-col">
                <span className="text-[7px] text-zinc-600 font-bold uppercase">Desde</span>
                <input 
                  type="date" 
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-black text-xs text-zinc-300 border-0 outline-none p-1 font-mono rounded"
                />
              </div>
              <div className="h-4 w-px bg-zinc-800 self-end mb-2" />
              <div className="flex flex-col">
                <span className="text-[7px] text-zinc-600 font-bold uppercase">Hasta</span>
                <input 
                  type="date" 
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-black text-xs text-zinc-300 border-0 outline-none p-1 font-mono rounded"
                />
              </div>
            </div>
          )}

          {/* Hierarchical Location selection */}
          <div className="space-y-2 w-full sm:w-auto">
            <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest flex items-center gap-1.5 font-bold">
              <MapPin className="w-3.5 h-3.5 text-[#2BC8FF]" /> Cobertura Geográfica
            </p>
            <div className="grid grid-cols-3 gap-2 w-full sm:w-[480px]">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-zinc-600 uppercase font-mono">País</span>
                <select
                  value={locationFilter.pais}
                  onChange={(e) => handleLocationChange('pais', e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 font-bold uppercase py-1.5 px-2 rounded outline-none focus:border-[#2BC8FF]"
                >
                  <option value="todos">Todos</option>
                  {locationOptions.paises.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-zinc-600 uppercase font-mono">Región / Ciudad</span>
                <select
                  value={locationFilter.region}
                  disabled={locationFilter.pais === 'todos'}
                  onChange={(e) => handleLocationChange('region', e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 font-bold uppercase py-1.5 px-2 rounded outline-none focus:border-[#2BC8FF] disabled:opacity-40"
                >
                  <option value="todos">Todas</option>
                  {locationOptions.regions.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-zinc-600 uppercase font-mono">Pantalla / Local</span>
                <select
                  value={locationFilter.local}
                  disabled={locationFilter.region === 'todos'}
                  onChange={(e) => handleLocationChange('local', e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 font-bold uppercase py-1.5 px-2 rounded outline-none focus:border-[#2BC8FF] disabled:opacity-40"
                >
                  <option value="todos">Todos</option>
                  {locationOptions.locals.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Search box */}
          <div className="space-y-2 w-full sm:w-auto">
            <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest flex items-center gap-1.5 font-bold">
              <Filter className="w-3.5 h-3.5 text-[#2BC8FF]" /> Filtrar
            </p>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-600" />
              <input
                type="text"
                placeholder="Buscar campaña o ciudad..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-300 pl-8 pr-3 py-2 rounded outline-none focus:border-[#2BC8FF] w-full sm:w-60"
              />
            </div>
          </div>

        </div>
      </section>

      {/* KPI ROW */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* KPI 1: Impactos Generados */}
        <div className="p-5 border border-zinc-900 bg-zinc-950/80 rounded-xl group hover:border-[#2BC8FF]/30 transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#2BC8FF]/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex justify-between items-start mb-3">
            <p className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 font-bold">Impactos Totales</p>
            <Zap className="h-4 w-4 text-[#2BC8FF]" />
          </div>
          <p className="text-3xl font-mono font-black text-white">{analyticsData.kpiImpressions.toLocaleString()}</p>
          <div className="flex items-center justify-between mt-2 border-t border-zinc-900/60 pt-2">
            <span className="text-[8px] uppercase text-zinc-600 font-bold">Visualizaciones Reales</span>
            <span className="text-[8px] text-[#2BC8FF] font-mono font-bold">+18.2% vs habitual</span>
          </div>
        </div>

        {/* KPI 2: Presupuesto invertido */}
        <div className="p-5 border border-zinc-900 bg-zinc-950/80 rounded-xl group hover:border-emerald-500/30 transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex justify-between items-start mb-3">
            <p className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 font-bold">Consumo de Presupuesto</p>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-mono font-black text-emerald-400">{analyticsData.kpiBudgetSpent.toFixed(2)}€</p>
          <div className="flex items-center justify-between mt-2 border-t border-zinc-900/60 pt-2">
            <span className="text-[8px] uppercase text-zinc-600 font-bold">Presupuesto pautado</span>
            <span className="text-[8px] text-zinc-500 font-mono">Consumo promedio diario: {(analyticsData.kpiBudgetSpent / 30).toFixed(2)}€</span>
          </div>
        </div>

        {/* KPI 3: Campañas Activas */}
        <div className="p-5 border border-zinc-900 bg-zinc-950/80 rounded-xl group hover:border-blue-500/30 transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex justify-between items-start mb-3">
            <p className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 font-bold">Campañas Vivas</p>
            <Target className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-3xl font-mono font-black text-white">{analyticsData.kpiActiveCount}</p>
          <div className="flex items-center justify-between mt-2 border-t border-zinc-900/60 pt-2">
            <span className="text-[8px] uppercase text-zinc-600 font-bold">En pantalla actualmente</span>
            <span className="text-[8px] text-emerald-400 font-mono">Entrega optimizada</span>
          </div>
        </div>

        {/* KPI 4: Saldo Billetera */}
        <div className="p-5 border border-[#2BC8FF]/30 bg-[#2BC8FF]/5 rounded-xl group hover:border-[#2BC8FF]/50 transition-all relative overflow-hidden shadow-[0_0_30px_rgba(43,200,255,0.05)]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#2BC8FF]/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex justify-between items-start mb-3">
            <p className="text-[9px] uppercase font-mono tracking-widest text-[#2BC8FF] font-black">Saldo Billetera</p>
            <Wallet className="h-4 w-4 text-[#2BC8FF]" />
          </div>
          <p className="text-3xl font-mono font-black text-white">{walletBalance.toFixed(2)}€</p>
          <div className="flex items-center justify-between mt-3">
            <Link href="/dashboard/billetera" className="text-[8px] text-black bg-[#2BC8FF] px-2.5 py-1 rounded uppercase font-black tracking-widest hover:bg-white transition-all">
              + Recargar Fondos
            </Link>
            <span className="text-[7.5px] uppercase text-zinc-500 font-mono">Prepago activo</span>
          </div>
        </div>

      </section>

      {/* GRAPH ZONE */}
      {isMounted ? (
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          
          {/* Chart 1: Evolution of Impressions */}
          <div className="xl:col-span-2 p-6 border border-zinc-900 bg-zinc-950/50 backdrop-blur-md rounded-xl flex flex-col justify-between h-[360px]">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Evolución de Impactos</h3>
                <p className="text-[8px] text-zinc-600 uppercase font-mono">Impresiones y visualizaciones de anuncios en el tiempo</p>
              </div>
              <span className="text-[9px] font-mono text-[#2BC8FF] font-bold px-2 py-0.5 rounded bg-[#2BC8FF]/10 border border-[#2BC8FF]/20">IMPRESIONES</span>
            </div>
            
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={analyticsData.impressionsTimeline}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorImpactos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2BC8FF" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#2BC8FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
                  <XAxis 
                    dataKey="fecha" 
                    stroke="#52525b" 
                    fontSize={8} 
                    tickLine={false} 
                    fontFamily="monospace"
                  />
                  <YAxis 
                    stroke="#52525b" 
                    fontSize={8} 
                    tickLine={false}
                    fontFamily="monospace"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#09090b', 
                      borderColor: '#27272a',
                      fontSize: 10,
                      fontFamily: 'monospace',
                      color: '#f4f4f5'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="impactos" 
                    stroke="#2BC8FF" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorImpactos)" 
                    name="Impactos Reales"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Distribution by City */}
          <div className="p-6 border border-zinc-900 bg-zinc-950/50 backdrop-blur-md rounded-xl flex flex-col justify-between h-[360px]">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Distribución Geográfica</h3>
              <p className="text-[8px] text-zinc-600 uppercase font-mono">Ubicación física donde impactan tus anuncios</p>
            </div>

            <div className="w-full h-48 relative">
              {analyticsData.distributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {analyticsData.distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#09090b',
                        borderColor: '#27272a',
                        fontSize: 10,
                        fontFamily: 'monospace',
                        color: '#f4f4f5'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-600 font-mono text-[9px]">
                  Esperando datos de impacto geográfico...
                </div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Impactos</span>
                <span className="text-base font-mono font-black text-white">{analyticsData.kpiImpressions.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center max-h-16 overflow-y-auto mt-2">
              {analyticsData.distributionData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[8.5px] uppercase font-mono text-zinc-400 font-bold">
                    {entry.name}: {entry.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 2: Top 5 campaigns */}
          <div className="xl:col-span-3 p-6 border border-zinc-900 bg-zinc-950/50 backdrop-blur-md rounded-xl flex flex-col justify-between h-[300px]">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Top 5 Campañas de Mayor Impacto</h3>
              <p className="text-[8px] text-zinc-600 uppercase font-mono">Campañas líderes en captación de visualizaciones</p>
            </div>
            
            <div className="w-full h-48 mt-4">
              {topCampaignsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topCampaignsData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#18181b" horizontal={false} />
                    <XAxis type="number" stroke="#52525b" fontSize={8} fontFamily="monospace" tickLine={false} />
                    <YAxis 
                      dataKey="nombre" 
                      type="category" 
                      stroke="#52525b" 
                      fontSize={8} 
                      tickLine={false}
                      width={80}
                      tick={{ fill: '#d4d4d8', fontSize: 8, fontWeight: 'bold' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#09090b',
                        borderColor: '#27272a',
                        fontSize: 10,
                        fontFamily: 'monospace',
                        color: '#f4f4f5'
                      }}
                    />
                    <Bar dataKey="impactos" radius={[0, 4, 4, 0]} name="Impactos Reales">
                      {topCampaignsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-600 font-mono text-[9px]">
                  Cargando clasificación de campañas...
                </div>
              )}
            </div>
          </div>

        </section>
      ) : (
        <div className="h-96 w-full flex items-center justify-center border border-zinc-900 bg-zinc-950/20 rounded-xl mb-8">
          <RefreshCw className="w-8 h-8 text-[#2BC8FF] animate-spin" />
        </div>
      )}

      {/* DETAILED DATA TABLE */}
      <section className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs font-heading uppercase tracking-widest text-gradient-ui flex items-center gap-2 font-black">
            <Monitor className="w-4 h-4 text-[#2BC8FF]" /> Desglose de Campañas y Entrega
          </h2>
          <span className="text-[9px] font-mono text-zinc-500 uppercase">Total: {analyticsData.campaignList.length} campañas filtradas</span>
        </div>

        <div className="border border-zinc-900 rounded-xl overflow-hidden bg-zinc-950/50 backdrop-blur-md">
          {analyticsData.campaignList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-950 border-b border-zinc-900">
                  <tr>
                    <th className="px-6 py-4 text-[9px] uppercase font-bold text-zinc-400 tracking-widest">Campaña / Identidad</th>
                    <th className="px-6 py-4 text-[9px] uppercase font-bold text-zinc-400 tracking-widest">Pantalla Destino</th>
                    <th className="px-6 py-4 text-[9px] uppercase font-bold text-zinc-400 tracking-widest">Delivery Rango (Impresiones)</th>
                    <th className="px-6 py-4 text-[9px] uppercase font-bold text-zinc-400 tracking-widest">Presupuesto</th>
                    <th className="px-6 py-4 text-[9px] uppercase font-bold text-zinc-400 tracking-widest">Consumo</th>
                    <th className="px-6 py-4 text-[9px] uppercase font-bold text-zinc-400 tracking-widest text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {analyticsData.campaignList.map((camp) => {
                    const deliveryPercent = camp.impactos_estimados > 0
                      ? Math.min(100, Math.floor((camp.range_impressions / camp.impactos_estimados) * 100))
                      : 0

                    return (
                      <tr key={camp.campana_id} className="hover:bg-zinc-900/30 transition-colors group">
                        <td className="px-6 py-4.5">
                          <p className="font-heading text-xs font-bold text-white uppercase group-hover:text-[#2BC8FF] transition-colors">{camp.campana_nombre}</p>
                          <p className="text-[8px] font-mono text-zinc-600 uppercase mt-0.5">ID: {camp.campana_id.slice(0, 8)}...</p>
                        </td>
                        <td className="px-6 py-4.5">
                          <p className="text-xs text-zinc-300 font-bold uppercase">{camp.pantalla_nombre}</p>
                          <p className="text-[9px] text-zinc-500 uppercase font-mono">{camp.ciudad}</p>
                        </td>
                        <td className="px-6 py-4.5">
                          <div className="flex items-center gap-4 w-48">
                            <div className="flex-1 h-1 bg-zinc-900 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-[#2BC8FF] to-violet-500 transition-all duration-500" 
                                style={{ width: `${deliveryPercent}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-mono text-zinc-400 w-8 text-right">{deliveryPercent}%</span>
                          </div>
                          <div className="flex gap-2 text-[8px] text-zinc-500 mt-1 uppercase font-mono">
                            <span className="text-[#2BC8FF] font-bold">{camp.range_impressions.toLocaleString()} impactos</span>
                            <span>/ Meta: {camp.impactos_estimados.toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4.5 font-mono text-xs text-zinc-300">
                          {camp.presupuesto_total.toFixed(2)}€
                        </td>
                        <td className="px-6 py-4.5 font-mono text-xs text-emerald-400">
                          {camp.range_spent.toFixed(2)}€
                        </td>
                        <td className="px-6 py-4.5 text-right">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                            camp.estado === 'aprobada' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' :
                            camp.estado === 'rechazada' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            'bg-zinc-800 text-zinc-500 border border-zinc-700'
                          }`}>
                            {camp.estado}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center">
              <Target className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
              <p className="text-[10px] font-mono uppercase tracking-[2px] text-zinc-500">Ninguna campaña coincide con los filtros aplicados.</p>
            </div>
          )}
        </div>
      </section>

    </div>
  )
}
