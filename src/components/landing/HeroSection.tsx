'use client'

import Link from 'next/link'
import { Monitor, Megaphone, MoveRight } from 'lucide-react'

export default function HeroSection() {
  const scrollToPricing = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const el = document.getElementById('host-pricing')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen flex flex-col md:flex-row overflow-hidden bg-black pt-32 md:pt-0">
      {/* Rutas Duales (Split Screen) */}
      
      {/* RUTA A: ANUNCIANTES (Izquierda / Arriba) */}
      <div className="flex-1 relative flex items-center justify-center p-8 md:p-16 min-h-[50vh] md:min-h-screen group border-b md:border-b-0 md:border-r border-white/10 hover:flex-[1.2] transition-all duration-700 ease-in-out cursor-pointer overflow-hidden">
        
        {/* Fondo Decorativo */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-[#2BC8FF]/10 z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#2BC8FF]/10 rounded-full blur-[100px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left w-full max-w-lg">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-8 text-[#2BC8FF] shadow-[0_0_30px_rgba(43,200,255,0)] group-hover:shadow-[0_0_30px_rgba(43,200,255,0.2)] transition-shadow duration-500">
            <Megaphone className="w-10 h-10 md:w-14 md:h-14" />
          </div>
          
          <h2 className="text-4xl md:text-6xl font-heading font-light tracking-tighter text-white mb-4 leading-tight">
            Quiero <span className="text-[#2BC8FF] font-medium">anunciar</span> mi marca
          </h2>
          
          <p className="text-zinc-400 text-lg mb-10 max-w-md">
            Lanza campañas publicitarias en pantallas físicas del mundo real en minutos. Paga solo por el alcance real con la máxima flexibilidad.
          </p>
          
          <Link href="/register?type=advertiser" className="group/btn flex items-center gap-3 px-8 py-4 rounded-full bg-[#2BC8FF] text-black font-bold uppercase tracking-widest text-[11px] hover:bg-white transition-all shadow-[0_0_20px_rgba(43,200,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] w-full sm:w-auto justify-center">
            Explorar Mapa Público
            <MoveRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
          </Link>
        </div>

        <div className="absolute bottom-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none translate-x-10 translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0">
           <Megaphone className="w-64 h-64 text-[#2BC8FF]" />
        </div>
      </div>

      {/* RUTA B: HOSTS (Derecha / Abajo) */}
      <div className="flex-1 relative flex items-center justify-center p-8 md:p-16 min-h-[50vh] md:min-h-screen group hover:flex-[1.2] transition-all duration-700 ease-in-out cursor-pointer overflow-hidden">
        
        {/* Fondo Decorativo */}
        <div className="absolute inset-0 bg-gradient-to-tl from-black via-black to-[#7C3CFF]/10 z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#7C3CFF]/10 rounded-full blur-[100px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left w-full max-w-lg">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-8 text-[#7C3CFF] shadow-[0_0_30px_rgba(124,60,255,0)] group-hover:shadow-[0_0_30px_rgba(124,60,255,0.2)] transition-shadow duration-500">
            <Monitor className="w-10 h-10 md:w-14 md:h-14" />
          </div>
          
          <h2 className="text-4xl md:text-6xl font-heading font-light tracking-tighter text-white mb-4 leading-tight">
            Quiero <span className="text-[#7C3CFF] font-medium">rentabilizar</span> pantallas
          </h2>
          
          <p className="text-zinc-400 text-lg mb-10 max-w-md">
            Conecta los televisores de tu local a LumiAds. Decide tu precio, muestra publicidad y genera ingresos extra cada mes.
          </p>
          
          <a href="#host-pricing" onClick={scrollToPricing} className="group/btn flex items-center gap-3 px-8 py-4 rounded-full bg-transparent border border-[#7C3CFF]/50 text-[#7C3CFF] font-bold uppercase tracking-widest text-[11px] hover:bg-[#7C3CFF] hover:text-white transition-all shadow-[0_0_20px_rgba(124,60,255,0)] hover:shadow-[0_0_30px_rgba(124,60,255,0.3)] w-full sm:w-auto justify-center">
            Ver Planes de Host
            <MoveRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
          </a>
        </div>

        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none translate-x-10 -translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0">
           <Monitor className="w-64 h-64 text-[#7C3CFF]" />
        </div>
      </div>
      
    </section>
  )
}
