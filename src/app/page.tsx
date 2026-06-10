import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import HeroSection from '@/components/landing/HeroSection'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createClient()
  await supabase.auth.getUser()

  return (
    <div className="dark h-[100svh] w-screen overflow-hidden bg-black flex flex-col selection:bg-lumi-violet selection:text-white">
      <header className="fixed top-0 left-0 w-full z-[100] border-b border-white/[0.08] bg-black/75 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 h-20 flex items-center justify-between relative">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/LogoPequeno.png"
              alt="LumiAds Icon"
              width={512}
              height={512}
              className="h-[36px] md:h-[48px] w-auto group-hover:scale-110 transition-transform"
            />
            <Image
              src="/LogoTexto.png"
              alt="LumiAds Brand"
              width={720}
              height={400}
              className="h-[48px] md:h-[60px] w-auto hidden sm:block"
            />
          </Link>

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
              Iniciar sesion
            </Link>
          </div>

          <Link
            href="/login"
            className="relative z-10 sm:hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main className="h-[100svh] overflow-hidden">
        <HeroSection />
      </main>
    </div>
  )
}
