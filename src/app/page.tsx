import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import HeroSection from '@/components/landing/HeroSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import PricingSection from '@/components/landing/PricingSection'
import ContactSection from '@/components/landing/ContactSection'
export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const hostCtaHref = user
    ? '/host'
    : '/register?type=host&returnTo=%2Fplanes%2Fseleccionar%3Frole%3Dhost'
  
  /*
  // 1. Estadísticas Globales para el Hero
  const { data: statsData } = await supabase.from('campanas').select('impactos_reales, presupuesto_total')
  const { count: totalNodes } = await supabase.from('pantallas').select('*', { count: 'exact', head: true })
  
  // Últimas campañas para el "Live Logic Feed"
  const { data: recentCampaigns } = await supabase
    .from('campanas')
    .select('id, nombre_campana, impactos_reales, created_at, pantallas(nombre)')
    .order('created_at', { ascending: false })
    .limit(5)

  const totalImpacts = statsData?.reduce((sum, c) => sum + (c.impactos_reales || 0), 0) || 0
  const totalYield = statsData?.reduce((sum, c) => sum + (c.presupuesto_total || 0), 0) || 0

  const stats = {
    totalImpacts,
    totalYield,
    totalNodes: totalNodes || 0,
    liveFeed: recentCampaigns?.map(c => ({
      time: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      node: (Array.isArray(c.pantallas) ? c.pantallas[0]?.nombre : (c.pantallas as any)?.nombre)?.split(' ')[0] || 'NODO',
      action: 'PoP Verificado', // En español
      res: `+${(c.impactos_reales || 0)}`
    })) || []
  }
  */

  return (
    <div className="dark min-h-screen bg-black flex flex-col selection:bg-lumi-violet selection:text-white">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 w-full z-[100] border-b border-white/[0.08] bg-black/75 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 h-20 flex items-center justify-between relative">
          <Link href="/" className="flex items-center gap-2 group">
             <img src="/LogoPequeno.png" alt="LumiAds Icon" className="h-[36px] md:h-[48px] w-auto group-hover:scale-110 transition-transform" />
             <img src="/LogoTexto.png" alt="LumiAds Brand" className="h-[48px] md:h-[60px] w-auto hidden sm:block" />
          </Link>
          
          {/* Centered Navigation - Absolute positioned relative to the full-width header for perfect screen centering */}
          <nav className="hidden md:flex absolute inset-x-0 top-0 bottom-0 pointer-events-none items-center justify-center" aria-label="Navegación principal">
             <div className="flex items-center gap-10 text-[11px] uppercase tracking-[0.24em] font-bold text-zinc-400 pointer-events-auto">
                <Link href="#features" className="hover:text-lumi-violet transition-colors">Funciones</Link>
                <Link href="#host-pricing" className="hover:text-lumi-violet transition-colors">Planes</Link>
                <Link href="#contacto" className="hover:text-lumi-violet transition-colors">Contacto</Link>
             </div>
          </nav>

          <div className="relative z-10 hidden sm:flex items-center gap-3">
             <Link
               href="/register"
               className="px-5 py-2.5 rounded-full bg-[#2BC8FF] text-black hover:bg-white transition-all text-[10px] uppercase tracking-widest font-black"
             >
               Crear cuenta
             </Link>
             <Link 
               href="/login" 
               className="px-6 py-2.5 rounded-full border border-white/10 text-white hover:bg-white/10 transition-all text-[10px] uppercase tracking-widest font-bold bg-white/5 backdrop-blur-sm"
             >
               Iniciar sesión
             </Link>
          </div>

          <details className="relative z-20 sm:hidden group">
            <summary className="list-none cursor-pointer rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white">
              Menú
            </summary>
            <div className="absolute right-0 mt-3 w-[min(82vw,280px)] rounded-2xl border border-white/10 bg-black/95 p-3 shadow-2xl">
              <nav className="grid gap-1 text-sm" aria-label="Navegación móvil">
                <Link href="#features" className="rounded-xl px-4 py-3 text-zinc-300 hover:bg-white/10 hover:text-white">Funciones</Link>
                <Link href="#host-pricing" className="rounded-xl px-4 py-3 text-zinc-300 hover:bg-white/10 hover:text-white">Planes</Link>
                <Link href="#contacto" className="rounded-xl px-4 py-3 text-zinc-300 hover:bg-white/10 hover:text-white">Contacto</Link>
                <Link href="/register" className="mt-2 rounded-xl bg-[#2BC8FF] px-4 py-3 text-center text-sm font-bold text-black">Crear cuenta</Link>
                <Link href="/login" className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-bold text-white">Iniciar sesión</Link>
              </nav>
            </div>
          </details>
        </div>
      </header>

      <main className="flex-grow">
        <HeroSection />

        <FeaturesSection />
        
        <PricingSection />

        <ContactSection />
        
        {/* CTA Final */}
        <section className="py-32 bg-black text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-lumi-violet/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="container mx-auto px-4 max-w-4xl relative z-10">
               <h2 className="text-4xl md:text-6xl font-heading text-white tracking-tighter mb-5 leading-tight">
                  ¿Listo para activar <br />
                  <span className="text-gradient-ui">tu red digital?</span>
               </h2>
               <p className="mx-auto mb-8 max-w-2xl text-sm sm:text-base text-zinc-400">
                  Crea anuncios o monetiza pantallas desde un flujo claro, sin pasos escondidos.
               </p>
               <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/register?type=advertiser" className="inline-flex w-full sm:w-auto justify-center px-8 py-4 rounded-full bg-[#2BC8FF] text-black font-bold uppercase tracking-widest text-[11px] hover:bg-white transition-all shadow-[0_0_20px_rgba(43,200,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                     Quiero anunciar
                  </Link>
                  <Link href={hostCtaHref} className="inline-flex w-full sm:w-auto justify-center px-8 py-4 rounded-full bg-transparent border border-[#7C3CFF]/50 text-[#7C3CFF] font-bold uppercase tracking-widest text-[11px] hover:bg-[#7C3CFF] hover:text-white transition-all shadow-[0_0_20px_rgba(124,60,255,0)] hover:shadow-[0_0_30px_rgba(124,60,255,0.3)]">
                     Quiero monetizar pantallas
                  </Link>
               </div>
            </div>
        </section>
      </main>

      <footer className="py-12 border-t border-white/5 bg-black">
         <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8 text-[10px] uppercase tracking-widest font-bold text-zinc-600">
            <div className="flex flex-wrap items-center justify-center gap-3">
               <img src="/LogoPequeno.png" alt="LumiAds" className="h-4 w-auto grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" />
               <span className="text-zinc-300">© 2026 <img src="/LogoTexto.png" alt="LumiAds" className="h-3 w-auto inline-block mx-1" /></span>
               <span>•</span>
               <span>Digital Signage Intelligence</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6">
               <Link href="/terminos" className="hover:text-white transition-colors">Términos</Link>
               <Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
               <Link href="/#contacto" className="hover:text-white transition-colors">Contacto</Link>
            </div>
         </div>
      </footer>
    </div>
  )
}
