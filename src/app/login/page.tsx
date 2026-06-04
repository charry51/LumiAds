import type { Metadata } from 'next'
import { login } from '@/app/login/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons'
import { ForgotPasswordLink } from '@/components/auth/ForgotPasswordLink'
import { Suspense } from 'react'
import { LoginErrorToast } from '@/components/auth/LoginErrorToast'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Iniciar Sesión | LumiAds',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const resolvedSearchParams = await searchParams;
  return (
    <div className="min-h-screen bg-[#04060F] flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-lumi-violet selection:text-white">
      {/* Decorative Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-lumi-violet/10 rounded-full blur-[120px] pointer-events-none opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-lumi-blue/10 rounded-full blur-[120px] pointer-events-none opacity-50" />
      
      <div className="w-full max-w-[440px] relative z-10">
        {/* Back Arrow */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
          Volver al inicio
        </Link>

        {/* Branding Logo */}
        <div className="mb-10 flex flex-col items-center text-center animate-fade-in">
          <Link href="/">
            <img src="/LogoTexto.png" alt="LumiAds" className="h-[120px] w-auto mb-2 drop-shadow-[0_0_30px_rgba(124,60,255,0.3)]" />
          </Link>
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-lumi-blue to-transparent mt-2" />
          <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-[0.5em] mt-4 opacity-80">Digital Signage Intelligence</p>
        </div>

        <div className="landing-glass-ui p-8 md:p-10 border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* Subtle Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          
          <header className="mb-6 relative z-10">
            <h2 className="text-3xl font-heading font-light text-white tracking-tighter leading-tight">
              Bienvenido a <br />
              <span className="text-gradient-ui font-medium">LumiAds</span>
            </h2>
            <p className="text-sm text-zinc-400 font-sans mt-2">Entra para crear campañas, gestionar pantallas o revisar tu panel.</p>
          </header>

          <div className="mb-6 rounded-xl border border-lumi-blue/20 bg-lumi-blue/5 px-4 py-3 relative z-10">
            <p className="text-[10px] uppercase tracking-[0.24em] font-bold text-lumi-blue">Acceso único</p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-200">
              Usa el mismo correo para anunciante, gestor de pantallas o admin. Te llevamos al panel que corresponda.
            </p>
          </div>

          <form className="flex flex-col gap-5 relative z-10" action={login}>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 ml-1">Correo electrónico</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                autoComplete="email"
                placeholder="tu@email.com"
                className="bg-black/40 border-white/5 focus:border-lumi-blue/50 focus:ring-1 focus:ring-lumi-blue/20 transition-all rounded-xl font-sans text-sm py-6 px-5 placeholder:text-zinc-700 text-white"
                required 
              />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <Label htmlFor="password" className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Contraseña</Label>
                <ForgotPasswordLink />
              </div>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                autoComplete="current-password"
                placeholder="••••••••••••"
                className="bg-black/40 border-white/5 focus:border-lumi-violet/50 focus:ring-1 focus:ring-lumi-violet/20 transition-all rounded-xl font-sans text-sm py-6 px-5 placeholder:text-zinc-700 text-white"
                required 
              />
            </div>

            <button className="cyber-button-ui mt-4 py-4 text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(124,60,255,0.2)] hover:shadow-[0_0_60px_rgba(124,60,255,0.4)] transform hover:-translate-y-0.5 transition-all">
              Iniciar sesión
            </button>
          </form>

          <SocialAuthButtons />

          <footer className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center gap-4 relative z-10">
            <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-widest">
              <span className="text-zinc-600">¿Nuevo en la red?</span>
              <Link href="/register" className="text-lumi-blue hover:text-white transition-colors underline underline-offset-4 decoration-lumi-blue/30">
                Crea tu cuenta
              </Link>
            </div>
          </footer>
        </div>
        
        {/* Footer info */}
        <div className="mt-8 flex justify-between items-center px-4">
           <span className="text-[8px] text-zinc-700 uppercase tracking-widest">v2.0 Stable Build</span>
           <span className="text-[8px] text-zinc-700 uppercase tracking-widest">© 2026 LumiAds Platform</span>
        </div>
        
        <Suspense fallback={null}>
          <LoginErrorToast />
        </Suspense>
      </div>
    </div>
  )
}
