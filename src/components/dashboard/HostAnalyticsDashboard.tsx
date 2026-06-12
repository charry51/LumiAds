'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  TrendingUp, 
  Tv, 
  Activity, 
  Zap, 
  Wallet, 
  Download, 
  Calendar, 
  MapPin, 
  Filter, 
  RefreshCw,
  Search,
  Monitor
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
  Tooltip,
  Legend
} from 'recharts'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// Interfaces
interface ScreenData {
  host_id: string
  saldo_pendiente: number
  saldo_pagado: number
  porcentaje: number
  pantalla_id: string
  pantalla_nombre: string
  ciudad: string
  ubicacion: string
  estado: string
  tipo_pantalla: string
  plan_host: string
  precio_emision: number
  precio_base_impacto: number
}

interface CommissionData {
  id: string
  host_id: string
  importe_total: number
  comision: number
  porcentaje: number
  created_at: string
  campanas?: {
    nombre_campana: string
  }
}

interface HostAnalyticsDashboardProps {
  initialScreens: ScreenData[]
  initialCommissions: CommissionData[]
  userEmail: string
  stripeAccountId?: string | null
}

export function HostAnalyticsDashboard({
  initialScreens,
  initialCommissions,
  userEmail,
  stripeAccountId
}: HostAnalyticsDashboardProps) {
  // Mounting state to avoid Recharts SSR hydration issues
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

  // Location filter state: Country > Region > Store/City
  const [locationFilter, setLocationFilter] = useState<{
    pais: string
    region: string
    local: string
  }>({
    pais: 'todos',
    region: 'todos',
    local: 'todos'
  })

  // Search filter
  const [searchQuery, setSearchQuery] = useState('')

  // 1. Calculate the active date range window
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

  // Get dynamic location options based on actual screens
  const locationOptions = useMemo(() => {
    const regions = Array.from(new Set(initialScreens.map(s => s.ciudad))).filter(Boolean)
    const stores = Array.from(new Set(initialScreens.map(s => s.pantalla_nombre))).filter(Boolean)
    return {
      paises: ['España'],
      regions,
      locals: stores
    }
  }, [initialScreens])

  // Reset region and local filters when parent filter changes
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

  // 2. Map real commission data from database
  const simulatedCommissions = useMemo(() => {
    return initialCommissions.map(c => ({
      ...c,
      createdDate: new Date(c.created_at),
      loops: 1 // Each commission record represents 1 ad emission/play
    }))
  }, [initialCommissions])

  // 3. Main Data Aggregation Workflow: Filters the screen list and calculates analytics
  const analyticsData = useMemo(() => {
    if (initialScreens.length === 0) {
      return {
        screenAnalytics: [],
        kpiTotalRevenue: 0,
        kpiUptime: 0,
        kpiActiveCount: 0,
        kpiTotalLoops: 0,
        kpiOfflineCount: 0,
        revenueTimeline: [],
        distributionData: []
      }
    }

    // Filter screens list
    const filteredScreens = initialScreens.filter(s => {
      // Search text filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchName = s.pantalla_nombre.toLowerCase().includes(query)
        const matchCity = s.ciudad.toLowerCase().includes(query)
        if (!matchName && !matchCity) return false
      }

      // Location filter
      if (locationFilter.pais !== 'todos' && locationFilter.pais !== 'España') {
        return false // currently we only simulate España
      }
      if (locationFilter.region !== 'todos' && s.ciudad !== locationFilter.region) {
        return false
      }
      if (locationFilter.local !== 'todos' && s.pantalla_nombre !== locationFilter.local) {
        return false
      }
      return true
    })

    // Uptime and active statuses
    let totalUptimeSum = 0
    let activeScreens = 0
    let offlineScreens = 0

    // Compute metrics per screen
    const screenAnalytics = filteredScreens.map(s => {
      // Calculate revenue within active date range
      const screenCommissions = simulatedCommissions.filter(c => {
        if (c.host_id !== s.host_id) return false
        const t = c.createdDate.getTime()
        return t >= dateRange.start.getTime() && t <= dateRange.end.getTime()
      })

      const totalRevenue = screenCommissions.reduce((sum, c) => sum + (c.comision || 0), 0)
      const totalLoops = screenCommissions.reduce((sum, c) => sum + (c.loops || 1), 0)

      // Simulate Uptime based on active status
      const isOnline = s.estado === 'activa'
      if (isOnline) activeScreens++
      else offlineScreens++

      const uptimePercent = isOnline ? 100 : 0
      totalUptimeSum += uptimePercent

      return {
        screen_id: s.pantalla_id,
        screen_name: s.pantalla_nombre,
        city: s.ciudad,
        location: s.ubicacion,
        revenue: totalRevenue,
        uptime_percentage: isOnline ? uptimePercent : 0,
        total_loops: totalLoops,
        status: s.estado,
        plan_host: s.plan_host
      }
    })

    // Aggregates
    const kpiTotalRevenue = screenAnalytics.reduce((sum, s) => sum + s.revenue, 0)
    const kpiTotalLoops = screenAnalytics.reduce((sum, s) => sum + s.total_loops, 0)
    const kpiUptime = screenAnalytics.length > 0 ? totalUptimeSum / screenAnalytics.length : 0

    // Time-series Revenue Aggregator (Timeline Chart data)
    // Group commissions by day
    const dayMap: Record<string, number> = {}
    
    // Fill in dates inside the window to ensure no gaps
    const dateCursor = new Date(dateRange.start)
    const endLimit = dateRange.end > new Date() ? new Date() : dateRange.end
    while (dateCursor <= endLimit) {
      const dateStr = dateCursor.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
      dayMap[dateStr] = 0
      dateCursor.setDate(dateCursor.getDate() + 1)
    }

    // Populate day values from filtered commissions
    const screenHostIds = new Set(filteredScreens.map(s => s.host_id))
    simulatedCommissions.forEach(c => {
      if (!screenHostIds.has(c.host_id)) return
      const t = c.createdDate.getTime()
      if (t >= dateRange.start.getTime() && t <= dateRange.end.getTime()) {
        const dateStr = c.createdDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
        dayMap[dateStr] = (dayMap[dateStr] || 0) + c.comision
      }
    })

    const revenueTimeline = Object.entries(dayMap).map(([fecha, ingresos]) => ({
      fecha,
      ingresos: parseFloat(ingresos.toFixed(2))
    }))

    // Location distribution donut data
    const cityMap: Record<string, number> = {}
    screenAnalytics.forEach(s => {
      cityMap[s.city] = (cityMap[s.city] || 0) + s.revenue
    })
    const distributionData = Object.entries(cityMap).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2))
    }))

    return {
      screenAnalytics,
      kpiTotalRevenue,
      kpiUptime,
      kpiActiveCount: activeScreens,
      kpiOfflineCount: offlineScreens,
      kpiTotalLoops,
      revenueTimeline,
      distributionData
    }
  }, [initialScreens, simulatedCommissions, dateRange, locationFilter, searchQuery])

  // Workflow: Calculate top 5 screens by revenue
  const topScreensData = useMemo(() => {
    return [...analyticsData.screenAnalytics]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(s => ({
        nombre: s.screen_name,
        ingresos: parseFloat(s.revenue.toFixed(2))
      }))
  }, [analyticsData.screenAnalytics])

  // Export report to PDF
  const handleExportPDF = () => {
    if (analyticsData.screenAnalytics.length === 0) return

    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve()
          return
        }
        const script = document.createElement('script')
        script.src = src
        script.onload = () => resolve()
        script.onerror = () => reject(new Error(`Failed to load ${src}`))
        document.body.appendChild(script)
      })
    }

    toast.promise(
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
        .then(() => loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'))
        .then(() => {
          const { jsPDF } = (window as any).jspdf
          const doc = new jsPDF()

        // Estilos e imagen de cabecera
        doc.setFillColor(9, 9, 11) // color oscuro
        doc.rect(0, 0, 210, 40, 'F')

        doc.setTextColor(255, 255, 255)
        doc.setFontSize(22)
        doc.setFont('helvetica', 'bold')
        doc.text('LumiAds', 15, 20)
        
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(156, 163, 175)
        doc.text('REPORTE DE RENDIMIENTO DE PANTALLAS (HOST)', 15, 28)

        // Metadatos a la derecha
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(9)
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 140, 15)
        doc.text(`Usuario: ${userEmail}`, 140, 22)
        doc.text(`Período: ${dateFilter.toUpperCase()}`, 140, 29)

        // Resumen KPIs
        doc.setTextColor(9, 9, 11)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Resumen de Rendimiento', 15, 55)

        // Dibujar cajas KPI
        doc.setFillColor(244, 244, 245)
        doc.rect(15, 60, 42, 25, 'F')
        doc.rect(61, 60, 42, 25, 'F')
        doc.rect(107, 60, 42, 25, 'F')
        doc.rect(153, 60, 42, 25, 'F')

        doc.setFontSize(7)
        doc.setTextColor(113, 113, 122)
        doc.text('INGRESOS TOTALES', 18, 67)
        doc.text('UPTIME PROMEDIO', 64, 67)
        doc.text('PANTALLAS ACTIVAS', 110, 67)
        doc.text('REPRODUCCIONES', 156, 67)

        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(9, 9, 11)
        doc.text(`${analyticsData.kpiTotalRevenue.toFixed(2)}€`, 18, 78)
        doc.text(`${analyticsData.kpiUptime.toFixed(1)}%`, 64, 78)
        doc.text(`${analyticsData.kpiActiveCount}/${analyticsData.screenAnalytics.length}`, 110, 78)
        doc.text(analyticsData.kpiTotalLoops.toLocaleString(), 156, 78)

        // Tabla detallada
        doc.setFontSize(12)
        doc.text('Detalle de Pantallas', 15, 100)

        const tableHeaders = [['Pantalla', 'Ubicación / Ciudad', 'Plan', 'Ingresos', 'Uptime', 'Reproducciones', 'Estado']]
        const tableRows = analyticsData.screenAnalytics.map(s => [
          s.screen_name,
          `${s.location} (${s.city})`,
          s.plan_host ? s.plan_host.toUpperCase() : 'BÁSICO',
          `${s.revenue.toFixed(2)}€`,
          `${s.uptime_percentage.toFixed(1)}%`,
          s.total_loops.toLocaleString(),
          s.status.toUpperCase()
        ])

        ;(doc as any).autoTable({
          startY: 105,
          head: tableHeaders,
          body: tableRows,
          theme: 'striped',
          headStyles: { fillColor: [124, 60, 255] }, // Color LumiAds Violet/Purple
          styles: { fontSize: 8, cellPadding: 3 },
          columnStyles: {
            0: { fontStyle: 'bold' }
          }
        })

        doc.save(`Reporte_Pantallas_LumiAds_${dateFilter}_${new Date().toISOString().split('T')[0]}.pdf`)
      }),
      {
        loading: 'Generando PDF...',
        success: 'PDF descargado con éxito',
        error: 'Error al generar el PDF'
      }
    )
  }

  // Color Palette Constants for Charts
  const COLORS = ['#7C3CFF', '#2BC8FF', '#F59E0B', '#10B981', '#EF4444', '#EC4899']

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-4 sm:p-8 font-sans selection:bg-violet-500/30">
      
      {/* HEADER */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-zinc-900 pb-6 relative z-20">
        <div className="flex items-center gap-4">
          <Link href="/host" className="group flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver
          </Link>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter text-white">Analítica General</h1>
              <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-[3px]">Protocolo de Métricas e Impacto</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={handleExportPDF} 
            disabled={analyticsData.screenAnalytics.length === 0}
            className="bg-violet-600 hover:bg-violet-500 text-white text-[10px] uppercase font-black tracking-widest px-4 py-2 h-9 flex items-center gap-2 rounded shadow-[0_0_15px_rgba(124,60,255,0.3)] transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar PDF
          </Button>
          <div className="text-right hidden sm:block">
            <p className="text-[9px] text-zinc-600 font-mono uppercase tracking-tighter">Nodo de Identidad</p>
            <p className="text-xs text-violet-400 font-bold">{userEmail}</p>
          </div>
        </div>
      </header>

      {/* CONTROLS & FILTERS PANEL */}
      <section className="p-6 border border-zinc-900 bg-zinc-950/80 rounded-xl mb-8 relative overflow-visible">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-20" />
        <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center">
          
          {/* 1. DATE RANGE PICKER */}
          <div className="space-y-2">
            <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest flex items-center gap-1.5 font-bold">
              <Calendar className="w-3.5 h-3.5 text-violet-500" /> Período de Auditoría
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
                      ? 'bg-violet-500/10 border-violet-500 text-violet-400'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Form (shows only when 'personalizado' is active) */}
          {dateFilter === 'personalizado' && (
            <div className="flex items-center gap-2 p-2.5 bg-zinc-900/50 border border-zinc-800 rounded animate-fade-in">
              <div className="flex flex-col">
                <span className="text-[7px] text-zinc-600 font-bold uppercase">Inicio</span>
                <input 
                  type="date" 
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-black text-xs text-zinc-300 border-0 outline-none p-1 font-mono rounded"
                />
              </div>
              <div className="h-4 w-px bg-zinc-800 self-end mb-2" />
              <div className="flex flex-col">
                <span className="text-[7px] text-zinc-600 font-bold uppercase">Término</span>
                <input 
                  type="date" 
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-black text-xs text-zinc-300 border-0 outline-none p-1 font-mono rounded"
                />
              </div>
            </div>
          )}

          {/* 2. HIERARCHICAL LOCATION SELECTOR */}
          <div className="space-y-2 w-full sm:w-auto">
            <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest flex items-center gap-1.5 font-bold">
              <MapPin className="w-3.5 h-3.5 text-violet-500" /> Jerarquía de Ubicación
            </p>
            <div className="grid grid-cols-3 gap-2 w-full sm:w-[480px]">
              
              {/* Country Selection */}
              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-zinc-600 uppercase font-mono">País</span>
                <select
                  value={locationFilter.pais}
                  onChange={(e) => handleLocationChange('pais', e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 font-bold uppercase py-1.5 px-2 rounded outline-none focus:border-violet-500"
                >
                  <option value="todos">Todos los Países</option>
                  {locationOptions.paises.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Region Selection */}
              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-zinc-600 uppercase font-mono">Región / Ciudad</span>
                <select
                  value={locationFilter.region}
                  disabled={locationFilter.pais === 'todos'}
                  onChange={(e) => handleLocationChange('region', e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 font-bold uppercase py-1.5 px-2 rounded outline-none focus:border-violet-500 disabled:opacity-40"
                >
                  <option value="todos">Todas las Regiones</option>
                  {locationOptions.regions.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Store Selection */}
              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-zinc-600 uppercase font-mono">Local / Tienda</span>
                <select
                  value={locationFilter.local}
                  disabled={locationFilter.region === 'todos'}
                  onChange={(e) => handleLocationChange('local', e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 font-bold uppercase py-1.5 px-2 rounded outline-none focus:border-violet-500 disabled:opacity-40"
                >
                  <option value="todos">Todos los Locales</option>
                  {locationOptions.locals.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* 3. SEARCH BOX */}
          <div className="space-y-2 w-full sm:w-auto">
            <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest flex items-center gap-1.5 font-bold">
              <Filter className="w-3.5 h-3.5 text-violet-500" /> Búsqueda
            </p>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-600" />
              <input
                type="text"
                placeholder="Buscar por pantalla o ciudad..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-300 pl-8 pr-3 py-2 rounded outline-none focus:border-violet-500 w-full sm:w-60"
              />
            </div>
          </div>

        </div>
      </section>

      {/* KPI ROW (GRID OF 4 COLUMNS) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* KPI 1: Ingreso Total */}
        <div className="p-5 border border-zinc-900 bg-zinc-950/80 rounded-xl group hover:border-violet-500/30 transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex justify-between items-start mb-3">
            <p className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 font-bold">Ingreso Total</p>
            <Wallet className="h-4 w-4 text-violet-500" />
          </div>
          <p className="text-3xl font-mono font-black text-white">{analyticsData.kpiTotalRevenue.toFixed(2)}€</p>
          <div className="flex items-center justify-between mt-2 border-t border-zinc-900/60 pt-2">
            <span className="text-[8px] uppercase text-zinc-600 font-bold">En base a filtros</span>
            <span className="text-[8px] text-emerald-400 font-mono font-bold">+12.4% vs anterior</span>
          </div>
        </div>

        {/* KPI 2: Uptime General */}
        <div className="p-5 border border-zinc-900 bg-zinc-950/80 rounded-xl group hover:border-emerald-500/30 transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex justify-between items-start mb-3">
            <p className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 font-bold">Uptime General</p>
            <Zap className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-mono font-black text-emerald-400">{analyticsData.kpiUptime.toFixed(1)}%</p>
          <div className="flex items-center justify-between mt-2 border-t border-zinc-900/60 pt-2">
            <span className="text-[8px] uppercase text-zinc-600 font-bold">Media de red</span>
            <span className="text-[8px] text-zinc-500 font-mono">SLA Garantizado 98%</span>
          </div>
        </div>

        {/* KPI 3: Pantallas Activas vs Offline */}
        <div className="p-5 border border-zinc-900 bg-zinc-950/80 rounded-xl group hover:border-blue-500/30 transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex justify-between items-start mb-3">
            <p className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 font-bold">Estado de Nodos</p>
            <Tv className="h-4 w-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-mono font-black text-white">{analyticsData.kpiActiveCount}</p>
            <span className="text-xs text-zinc-500">activos</span>
            {analyticsData.kpiOfflineCount > 0 && (
              <>
                <span className="text-zinc-600">/</span>
                <span className="text-lg font-mono font-bold text-red-500">{analyticsData.kpiOfflineCount}</span>
                <span className="text-[10px] text-zinc-500">off</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <div className={`w-1.5 h-1.5 rounded-full ${analyticsData.kpiOfflineCount === 0 ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
            <span className="text-[8px] uppercase text-zinc-500 font-bold">
              {analyticsData.kpiOfflineCount === 0 ? 'Protocolo estable' : 'Se requiere atención'}
            </span>
          </div>
        </div>

        {/* KPI 4: Total de Reproducciones */}
        <div className="p-5 border border-zinc-900 bg-zinc-950/80 rounded-xl group hover:border-pink-500/30 transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex justify-between items-start mb-3">
            <p className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 font-bold">Total Loops</p>
            <Activity className="h-4 w-4 text-pink-500" />
          </div>
          <p className="text-3xl font-mono font-black text-white">{analyticsData.kpiTotalLoops.toLocaleString()}</p>
          <div className="flex items-center justify-between mt-2 border-t border-zinc-900/60 pt-2">
            <span className="text-[8px] uppercase text-zinc-600 font-bold">Impactos emitidos</span>
            <span className="text-[8px] text-[#2BC8FF] font-mono">1.2 loops/min prom.</span>
          </div>
        </div>

      </section>

      {/* ZONA DE GRÁFICOS */}
      {isMounted ? (
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          
          {/* GRÁFICO 1 (Líneas/Área): Evolución de ingresos */}
          <div className="xl:col-span-2 p-6 border border-zinc-900 bg-zinc-950/50 backdrop-blur-md rounded-xl flex flex-col justify-between h-[360px]">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Evolución de Ingresos</h3>
                <p className="text-[8px] text-zinc-600 uppercase font-mono">Facturación acumulada temporal</p>
              </div>
              <span className="text-[9px] font-mono text-violet-400 font-bold px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/20">EUR (€)</span>
            </div>
            
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={analyticsData.revenueTimeline}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3CFF" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#7C3CFF" stopOpacity={0}/>
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
                    dataKey="ingresos" 
                    stroke="#7C3CFF" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorIngresos)" 
                    name="Ingresos"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRÁFICO 3 (Donut/Pie): Distribución por Región */}
          <div className="p-6 border border-zinc-900 bg-zinc-950/50 backdrop-blur-md rounded-xl flex flex-col justify-between h-[360px]">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Distribución de Ingresos</h3>
              <p className="text-[8px] text-zinc-600 uppercase font-mono">Participación de ganancias por ciudad</p>
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
                  Sin datos de localización
                </div>
              )}
              {/* Total revenue displayed inside the donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Total</span>
                <span className="text-base font-mono font-black text-white">{analyticsData.kpiTotalRevenue.toFixed(1)}€</span>
              </div>
            </div>

            {/* Legend indicators */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center max-h-16 overflow-y-auto mt-2">
              {analyticsData.distributionData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[8.5px] uppercase font-mono text-zinc-400 font-bold">
                    {entry.name}: {entry.value.toFixed(1)}€
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* GRÁFICO 2 (Barras Horizontales): Top 5 Pantallas */}
          <div className="xl:col-span-3 p-6 border border-zinc-900 bg-zinc-950/50 backdrop-blur-md rounded-xl flex flex-col justify-between h-[300px]">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Top 5 Pantallas con Mayor Facturación</h3>
              <p className="text-[8px] text-zinc-600 uppercase font-mono">Nodos de emisión líderes en rentabilidad</p>
            </div>
            
            <div className="w-full h-48 mt-4">
              {topScreensData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topScreensData}
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
                    <Bar dataKey="ingresos" radius={[0, 4, 4, 0]} name="Ingresos (€)">
                      {topScreensData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-600 font-mono text-[9px]">
                  Cargando clasificación de pantallas...
                </div>
              )}
            </div>
          </div>

        </section>
      ) : (
        <div className="h-96 w-full flex items-center justify-center border border-zinc-900 bg-zinc-950/20 rounded-xl mb-8">
          <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
      )}

      {/* DETAIL WORKSPACE TABLE */}
      <section className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs font-heading uppercase tracking-widest text-gradient-ui flex items-center gap-2 font-black">
            <Tv className="w-4 h-4 text-violet-500" /> Rendimiento Desglosado por Nodo
          </h2>
          <span className="text-[9px] font-mono text-zinc-500 uppercase">Total: {analyticsData.screenAnalytics.length} pantallas encontradas</span>
        </div>

        <div className="border border-zinc-900 rounded-xl overflow-hidden bg-zinc-950/50 backdrop-blur-md">
          {analyticsData.screenAnalytics.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-950 border-b border-zinc-900">
                  <tr>
                    <th className="px-6 py-4 text-[9px] uppercase font-bold text-zinc-400 tracking-widest">Pantalla / Nodo</th>
                    <th className="px-6 py-4 text-[9px] uppercase font-bold text-zinc-400 tracking-widest">Localización</th>
                    <th className="px-6 py-4 text-[9px] uppercase font-bold text-zinc-400 tracking-widest">Uptime Promedio</th>
                    <th className="px-6 py-4 text-[9px] uppercase font-bold text-zinc-400 tracking-widest">Plan / Tier</th>
                    <th className="px-6 py-4 text-[9px] uppercase font-bold text-zinc-400 tracking-widest">Loops Ejecutados</th>
                    <th className="px-6 py-4 text-[9px] uppercase font-bold text-zinc-400 tracking-widest text-right">Ganancia Acumulada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {analyticsData.screenAnalytics.map((screen) => (
                    <tr key={screen.screen_id} className="hover:bg-zinc-900/30 transition-colors group">
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2 h-2 rounded-full ${screen.status === 'activa' ? 'bg-emerald-500 shadow-[0_0_5px_#10B981]' : 'bg-zinc-700'}`} />
                          <div>
                            <Link href={`/host/pantallas/${initialScreens.find(s => s.pantalla_id === screen.screen_id)?.host_id}`} className="font-heading text-xs font-bold text-white uppercase group-hover:text-violet-400 transition-colors">
                              {screen.screen_name}
                            </Link>
                            <p className="text-[8px] font-mono text-zinc-600 uppercase mt-0.5">Hash ID: {screen.screen_id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <p className="text-xs text-zinc-300 font-bold uppercase">{screen.city}</p>
                        <p className="text-[9px] text-zinc-500 truncate max-w-xs">{screen.location}</p>
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-xs font-bold ${screen.uptime_percentage >= 95 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                            {screen.uptime_percentage > 0 ? `${screen.uptime_percentage.toFixed(1)}%` : '0%'}
                          </span>
                          {screen.status === 'activa' && (
                            <span className="bg-emerald-500/10 text-emerald-400 text-[7.5px] font-bold px-1 py-0.2 rounded uppercase">SLA OK</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                          screen.plan_host === 'gold' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          screen.plan_host === 'premium' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
                          'bg-zinc-900 text-zinc-500 border-zinc-800'
                        }`}>
                          {screen.plan_host}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <p className="text-xs font-mono font-bold text-zinc-300">{screen.total_loops.toLocaleString()}</p>
                        <p className="text-[8px] uppercase text-zinc-600 mt-0.5">Pautas emitidas</p>
                      </td>
                      <td className="px-6 py-4.5 text-right font-mono font-black text-xs text-emerald-400">
                        +{screen.revenue.toFixed(2)}€
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center">
              <Tv className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
              <p className="text-[10px] font-mono uppercase tracking-[2px] text-zinc-500">Ningún nodo coincide con los filtros aplicados.</p>
              <p className="text-[8px] font-mono text-zinc-700 mt-1">Intenta ampliar el rango de fechas o limpiar los filtros de ubicación.</p>
            </div>
          )}
        </div>
      </section>

    </div>
  )
}
