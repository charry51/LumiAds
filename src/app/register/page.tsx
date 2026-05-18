import { signup } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Crear Cuenta | LumiAds',
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const resolvedSearchParams = await searchParams;
  return (
    <div className="min-h-screen bg-[#04060F] flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-lumi-violet selection:text-white">
      {/* Decorative Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-lumi-violet/10 rounded-full blur-[120px] pointer-events-none opacity-50" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-lumi-blue/10 rounded-full blur-[120px] pointer-events-none opacity-50" />
      
      <div className="w-full max-w-[460px] relative z-10">
        {/* Branding Logo */}
        <div className="mb-10 flex flex-col items-center text-center animate-fade-in">
          <Link href="/">
            <img src="/LogoTexto.png" alt="LumiAds" className="h-[100px] w-auto mb-2 drop-shadow-[0_0_30px_rgba(124,60,255,0.3)]" />
          </Link>
          <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-[0.5em] mt-4 opacity-80">Digital Signage Intelligence</p>
        </div>

        <div className="landing-glass-ui p-8 md:p-10 border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* Subtle Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          
          <header className="mb-8 relative z-10">
            <h2 className="text-3xl font-heading font-light text-white tracking-tighter leading-tight">
              Crea tu <br />
              <span className="text-gradient-ui font-medium">Cuenta</span>
            </h2>
            <p className="text-[11px] text-zinc-400 font-sans tracking-wide mt-2">Únete a la red publicitaria más avanzada del sector.</p>
          </header>

          <form className="flex flex-col gap-5 relative z-10" action={signup}>
            <div className="space-y-1.5">
              <Label htmlFor="nombre" className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 ml-1">Empresa / Nombre Completo</Label>
              <Input 
                id="nombre" 
                name="nombre" 
                type="text" 
                placeholder="Ej: Media Solutions S.L." 
                className="bg-black/40 border-white/5 focus:border-lumi-blue/50 focus:ring-1 focus:ring-lumi-blue/20 transition-all rounded-xl font-sans text-sm py-6 px-5 placeholder:text-zinc-700 text-white"
                required 
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 ml-1">Correo Electrónico</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="ceo@tuempresa.com" 
                className="bg-black/40 border-white/5 focus:border-lumi-blue/50 focus:ring-1 focus:ring-lumi-blue/20 transition-all rounded-xl font-sans text-sm py-6 px-5 placeholder:text-zinc-700 text-white"
                required 
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 ml-1">Contraseña</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                placeholder="••••••••••••"
                className="bg-black/40 border-white/5 focus:border-lumi-violet/50 focus:ring-1 focus:ring-lumi-violet/20 transition-all rounded-xl font-sans text-sm py-6 px-5 placeholder:text-zinc-700 text-white"
                required 
              />
            </div>
            
            {resolvedSearchParams?.message && (
              <div className="p-4 bg-red-500/5 border border-red-500/20 text-red-400 text-[10px] font-mono uppercase tracking-tighter rounded-lg">
                Alerta del Sistema: {resolvedSearchParams.message}
              </div>
            )}

            <button className="cyber-button-ui mt-4 py-4 text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(124,60,255,0.2)] hover:shadow-[0_0_60px_rgba(124,60,255,0.4)] transform hover:-translate-y-0.5 transition-all">
              Crear Cuenta
            </button>
          </form>

          <SocialAuthButtons />

          <footer className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center gap-4 relative z-10">
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest">
              <span className="text-zinc-600">¿Ya eres parte?</span>
              <Link href="/login" className="text-lumi-violet hover:text-white transition-colors underline underline-offset-4 decoration-lumi-violet/30">
                Inicia sesión
              </Link>
            </div>
          </footer>
        </div>
        
        {/* Footer info */}
        <div className="mt-8 flex justify-center items-center px-4">
           <span className="text-[8px] text-zinc-700 uppercase tracking-[0.3em]">Secure Registration Protocol v2.0</span>
        </div>
      </div>
    </div>
  )
}
