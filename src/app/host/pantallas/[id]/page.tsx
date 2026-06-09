import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Tv, TrendingUp, Wallet, Zap, Monitor, ExternalLink, Activity, Clock, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function PantallaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('perfiles')
    .select('rol, plan_id, suscripcion_activa')
    .eq('id', user.id)
    .single()

  const isSuperAdmin = profile?.rol === 'superadmin'
  const activePlan = profile?.plan_id?.toLowerCase()
  const hasSubscription = profile?.suscripcion_activa && (activePlan === 'premium' || activePlan === 'gold')

  if (!isSuperAdmin && !hasSubscription) {
    redirect('/planes/seleccionar')
  }

  // Fetch the host record (id param is the host record ID)
  const { data: hostData } = await supabase
    .from('hosts')
    .select('*, pantallas(id, nombre, ciudad, estado, precio_emision, ubicacion, tipo_pantalla, densidad_poblacion_nivel, precio_base_impacto, plan_host, es_publica, latitud, longitud)')
    .eq('id', id)
    .eq('perfil_id', user.id)
    .single()

  if (!hostData) redirect('/host')

  const pantalla = (Array.isArray(hostData.pantallas) ? hostData.pantallas[0] : hostData.pantallas) as any

  // Fetch commissions for this host
  const { data: comisiones } = await supabase
    .from('comisiones')
    .select('*, campanas(nombre_campana)')
    .eq('host_id', hostData.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const totalGenerado = (hostData.saldo_pendiente || 0) + (hostData.saldo_pagado || 0)
  const totalPendiente = hostData.saldo_pendiente || 0
  const totalComisiones = comisiones?.length || 0
  const hostTier = pantalla?.plan_host || 'basic'

  const tierColors: Record<string, { border: string; badge: string; text: string; glow: string }> = {
    gold: {
      border: 'border-amber-500/40',
      badge: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      text: 'text-amber-400',
      glow: 'shadow-[0_0_40px_rgba(245,158,11,0.08)]',
    },
    premium: {
      border: 'border-violet-500/30',
      badge: 'bg-violet-500/10 border-violet-500/30 text-violet-400',
      text: 'text-violet-400',
      glow: 'shadow-[0_0_40px_rgba(124,60,255,0.08)]',
    },
    basic: {
      border: 'border-zinc-800',
      badge: 'bg-zinc-800 border-zinc-700 text-zinc-400',
      text: 'text-zinc-400',
      glow: '',
    },
  }

  const colors = tierColors[hostTier] || tierColors.basic

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-4 sm:p-8 font-sans selection:bg-violet-500/30">

      {/* HEADER */}
      <header className="mb-8 flex items-center justify-between border-b border-zinc-900 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/host" className="group flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver
          </Link>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center">
              <Monitor className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter text-white">{pantalla?.nombre}</h1>
              <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-[3px]">{pantalla?.ubicacion} · {pantalla?.ciudad}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded border ${colors.badge}`}>
            {hostTier}
          </span>
          <span className={`flex items-center gap-1.5 text-[9px] font-bold uppercase px-3 py-1.5 rounded border ${
            pantalla?.estado === 'activa'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-zinc-900 border-zinc-800 text-zinc-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${pantalla?.estado === 'activa' ? 'bg-emerald-400 shadow-[0_0_6px_#10B981] animate-pulse' : 'bg-zinc-600'}`} />
            {pantalla?.estado === 'activa' ? 'En línea' : 'Offline'}
          </span>
        </div>
      </header>

      {/* STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-5 border border-zinc-900 bg-zinc-950/80 rounded-xl group hover:border-violet-500/30 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <p className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Total Generado</p>
            <TrendingUp className="h-3.5 w-3.5 text-violet-500" />
          </div>
          <p className="text-3xl font-mono font-black text-white">{totalGenerado.toFixed(2)}€</p>
          <p className="text-[8px] uppercase text-zinc-600 mt-1 font-bold">Histórico</p>
        </div>

        <div className="p-5 border border-zinc-900 bg-zinc-950/80 rounded-xl group hover:border-emerald-500/30 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <p className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Saldo Retirable</p>
            <Wallet className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <p className="text-3xl font-mono font-black text-emerald-400">{totalPendiente.toFixed(2)}€</p>
          <p className="text-[8px] uppercase text-zinc-600 mt-1 font-bold">Pendiente</p>
        </div>

        <div className="p-5 border border-zinc-900 bg-zinc-950/80 rounded-xl group hover:border-blue-500/30 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <p className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Emisiones</p>
            <BarChart3 className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <p className="text-3xl font-mono font-black text-white">{totalComisiones}</p>
          <p className="text-[8px] uppercase text-zinc-600 mt-1 font-bold">Anuncios emitidos</p>
        </div>

        <div className="p-5 border border-zinc-900 bg-zinc-950/80 rounded-xl group hover:border-violet-500/30 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <p className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Revenue Share</p>
            <Zap className="h-3.5 w-3.5 text-violet-500" />
          </div>
          <p className="text-3xl font-mono font-black text-white">{hostData.porcentaje}%</p>
          <p className="text-[8px] uppercase text-zinc-600 mt-1 font-bold">De cada anuncio</p>
        </div>
      </div>

      {/* MAIN GRID: Live Preview + Ledger */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* LIVE PREVIEW */}
        <div className="xl:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] uppercase tracking-[3px] text-zinc-400 flex items-center gap-2 font-black">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              Vista en Vivo
            </h2>
            <Link
              href={`/player/${pantalla?.id}`}
              target="_blank"
              className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Abrir emisión
            </Link>
          </div>

          <div className={`relative border ${colors.border} rounded-xl overflow-hidden bg-zinc-950 ${colors.glow}`}>
            {/* TV frame top bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-900 bg-black">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${pantalla?.estado === 'activa' ? 'bg-emerald-400 animate-pulse shadow-[0_0_5px_#10B981]' : 'bg-zinc-600'}`} />
                <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">
                  {pantalla?.estado === 'activa' ? 'LIVE · Emitiendo' : 'OFFLINE'}
                </span>
              </div>
              <span className="text-[8px] font-mono text-zinc-700 uppercase tracking-widest">{pantalla?.id?.slice(0, 8)}...</span>
            </div>

            {/* iFrame */}
            <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
              <iframe
                src={`/player/${pantalla?.id}`}
                className="absolute inset-0 w-full h-full border-0"
                title={`Vista en vivo: ${pantalla?.nombre}`}
                allow="autoplay"
              />
              {/* Overlay gradient for aesthetic */}
              <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-b-xl" />
            </div>

            {/* Bottom info bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-zinc-900 bg-black">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">{pantalla?.tipo_pantalla || 'Pantalla Digital'}</span>
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">{pantalla?.ciudad}</span>
            </div>
          </div>

          {/* Screen info */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl">
              <p className="text-[8px] uppercase font-bold tracking-widest text-zinc-500 mb-1">Precio Emisión</p>
              <p className="text-lg font-mono font-black text-white">{pantalla?.precio_emision ? `${pantalla.precio_emision}€` : '—'}</p>
            </div>
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl">
              <p className="text-[8px] uppercase font-bold tracking-widest text-zinc-500 mb-1">Impacto Base</p>
              <p className="text-lg font-mono font-black text-white">{pantalla?.precio_base_impacto ? `${pantalla.precio_base_impacto}€` : '—'}</p>
            </div>
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl">
              <p className="text-[8px] uppercase font-bold tracking-widest text-zinc-500 mb-1">Visibilidad</p>
              <p className="text-lg font-mono font-black text-white">{pantalla?.densidad_poblacion_nivel || '—'}</p>
            </div>
          </div>
        </div>

        {/* LEDGER */}
        <div className="xl:col-span-2">
          <h2 className="text-[11px] uppercase tracking-[3px] text-zinc-400 flex items-center gap-2 font-black mb-4">
            <Clock className="w-3.5 h-3.5 text-violet-500" />
            Historial de Ingresos
          </h2>

          <div className="border border-zinc-900 rounded-xl overflow-hidden bg-zinc-950">
            {comisiones && comisiones.length > 0 ? (
              <div className="divide-y divide-zinc-900 max-h-[560px] overflow-y-auto">
                {comisiones.map((com: any) => (
                  <div key={com.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-900/40 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-white uppercase truncate">{com.campanas?.nombre_campana || 'Campaña'}</p>
                      <p className="text-[8px] font-mono text-zinc-600 mt-0.5">{new Date(com.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span className="text-[11px] font-mono font-black text-emerald-400 ml-4">+{com.comision?.toFixed(4)}€</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Tv className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                <p className="text-[9px] font-mono uppercase tracking-[2px] text-zinc-500">Sin emisiones registradas aún.</p>
                <p className="text-[8px] font-mono text-zinc-700 mt-1">Los ingresos aparecerán aquí en tiempo real.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
