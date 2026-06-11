'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Megaphone, Monitor, MoveRight } from 'lucide-react'

export default function HeroSection() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      setIsAuthenticated(Boolean(data.user))
    })
  }, [])

  useEffect(() => {
    const supabase = createClient()

    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken) {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        }).then(({ data, error }) => {
          if (!error && data.session) {
            // Limpiar el hash de la URL para una URL limpia
            window.history.replaceState(null, '', window.location.pathname)
            // Redirigir al dashboard para enrutar por rol
            window.location.href = '/dashboard'
          } else if (error) {
            console.error('Error setting session manually:', error)
          }
        })
      }
    }
  }, [])

  const hostHref = isAuthenticated
    ? '/host'
    : '/register?type=host&returnTo=%2Fplanes%2Fseleccionar%3Frole%3Dhost'

  return (
    <section className="relative h-[100svh] grid grid-rows-2 md:grid-cols-2 md:grid-rows-1 overflow-hidden bg-black pt-20 md:pt-0">
      {/* Advertiser Column */}
      <div className="relative flex min-h-0 items-center justify-center p-5 sm:p-8 md:p-16 group border-b md:border-b-0 md:border-r border-white/10 transition-colors duration-300 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-[#2BC8FF]/10 z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#2BC8FF]/10 rounded-full blur-[100px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left w-full max-w-lg">
          <div className="mb-3 md:mb-5 inline-flex items-center gap-2 rounded-full border border-[#2BC8FF]/30 bg-[#2BC8FF]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#2BC8FF]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Sin elegir plan
          </div>

          <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/10 mb-4 md:mb-8 text-[#2BC8FF] shadow-[0_0_30px_rgba(43,200,255,0)] group-hover:shadow-[0_0_30px_rgba(43,200,255,0.2)] transition-shadow duration-500">
            <Megaphone className="w-8 h-8 md:w-14 md:h-14" />
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-6xl font-heading font-light tracking-tighter text-white mb-3 md:mb-4 leading-tight">
            Quiero <span className="text-[#2BC8FF] font-medium">anunciar</span> mi marca
          </h2>

          <p className="text-zinc-400 text-sm sm:text-base md:text-lg mb-5 md:mb-10 max-w-md">
            Regístrate como anunciante y entra directo al panel para crear campañas, elegir pantallas y controlar tu inversión.
          </p>

          <Link
            href="/register?type=advertiser"
            className="group/btn flex items-center gap-3 px-8 py-4 rounded-full bg-[#2BC8FF] text-black font-bold uppercase tracking-widest text-[11px] hover:bg-white transition-all shadow-[0_0_20px_rgba(43,200,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] w-full sm:w-auto justify-center"
          >
            Crear cuenta anunciante
            <MoveRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
          </Link>

          <Link
            href="/informacion/anunciante"
            className="mt-3 w-full sm:w-auto px-8 py-3 rounded-full border border-white/10 text-white hover:bg-white/10 transition-all text-[10px] uppercase tracking-widest font-bold bg-white/5 backdrop-blur-sm text-center"
          >
            Más información
          </Link>
        </div>

        <div className="absolute bottom-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none translate-x-10 translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0">
          <Megaphone className="w-64 h-64 text-[#2BC8FF]" />
        </div>
      </div>

      {/* Screen Manager Column */}
      <div className="relative flex min-h-0 items-center justify-center p-5 sm:p-8 md:p-16 group transition-colors duration-300 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-[#7C3CFF]/10 z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#7C3CFF]/10 rounded-full blur-[100px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left w-full max-w-lg">
          <div className="mb-3 md:mb-5 inline-flex items-center gap-2 rounded-full border border-[#7C3CFF]/30 bg-[#7C3CFF]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#B99CFF]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Plan después del registro
          </div>

          <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/10 mb-4 md:mb-8 text-[#7C3CFF] shadow-[0_0_30px_rgba(124,60,255,0)] group-hover:shadow-[0_0_30px_rgba(124,60,255,0.2)] transition-shadow duration-500">
            <Monitor className="w-8 h-8 md:w-14 md:h-14" />
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-6xl font-heading font-light tracking-tighter text-white mb-3 md:mb-4 leading-tight">
            Quiero <span className="text-[#7C3CFF] font-medium">rentabilizar</span> pantallas
          </h2>

          <p className="text-zinc-400 text-sm sm:text-base md:text-lg mb-5 md:mb-10 max-w-md">
            Crea tu cuenta como gestor, elige Premium o Gold y empieza a conectar tus pantallas al panel.
          </p>

          <Link
            href={hostHref}
            className="group/btn flex items-center gap-3 px-8 py-4 rounded-full bg-[#7C3CFF] text-white font-bold uppercase tracking-widest text-[11px] hover:bg-white hover:text-black transition-all shadow-[0_0_20px_rgba(124,60,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] w-full sm:w-auto justify-center"
          >
            Crear cuenta gestor
            <MoveRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
          </Link>

          <Link
            href="/informacion/gestor-pantallas"
            className="mt-3 w-full sm:w-auto px-8 py-3 rounded-full border border-white/10 text-white hover:bg-white/10 transition-all text-[10px] uppercase tracking-widest font-bold bg-white/5 backdrop-blur-sm text-center"
          >
            Más información
          </Link>
        </div>

        <div className="absolute bottom-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none translate-x-10 translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0">
          <Monitor className="w-64 h-64 text-[#7C3CFF]" />
        </div>
      </div>
    </section>
  )
}
