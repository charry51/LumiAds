import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { resetPassword } from '@/app/login/actions'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginErrorToast } from '@/components/auth/LoginErrorToast'

export const metadata: Metadata = {
  title: 'Recuperar Contraseña | LumiAds',
}

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ message?: string, email?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const initialEmail = resolvedSearchParams.email || '';
  return (
    <div className="min-h-screen bg-[#04060F] flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-lumi-violet selection:text-white">
      {/* Decorative Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-lumi-violet/10 rounded-full blur-[120px] pointer-events-none opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-lumi-blue/10 rounded-full blur-[120px] pointer-events-none opacity-50" />
      
      <div className="w-full max-w-[440px] relative z-10">
        {/* Branding Logo */}
        <div className="mb-10 flex flex-col items-center text-center animate-fade-in">
          <Link href="/">
            <img src="/LogoTexto.png" alt="LumiAds" className="h-[120px] w-auto mb-2 drop-shadow-[0_0_30px_rgba(124,60,255,0.3)]" />
          </Link>
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-lumi-blue to-transparent mt-2" />
        </div>

        <div className="landing-glass-ui p-8 md:p-10 border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* Subtle Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          
          <header className="mb-6 relative z-10">
            <h2 className="text-3xl font-heading font-light text-white tracking-tighter leading-tight">
              Recuperar <br />
              <span className="text-gradient-ui font-medium">Contraseña</span>
            </h2>
            <p className="text-[11px] text-zinc-400 font-sans tracking-wide mt-2">Ingresa tu correo para recibir un enlace de recuperación.</p>
          </header>

          <form className="flex flex-col gap-5 relative z-10" action={resetPassword}>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 ml-1">Correo Electrónico</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                defaultValue={initialEmail}
                placeholder="usuario@red-lumi.ads" 
                className="bg-black/40 border-white/5 focus:border-lumi-blue/50 focus:ring-1 focus:ring-lumi-blue/20 transition-all rounded-xl font-sans text-sm py-6 px-5 placeholder:text-zinc-700 text-white"
                required 
              />
            </div>

            <button className="cyber-button-ui mt-4 py-4 text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(124,60,255,0.2)] hover:shadow-[0_0_60px_rgba(124,60,255,0.4)] transform hover:-translate-y-0.5 transition-all">
              Enviar enlace
            </button>
          </form>
          
          <footer className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center gap-4 relative z-10">
            <Link href="/login" className="text-lumi-blue hover:text-white transition-colors text-[10px] uppercase font-bold tracking-widest underline underline-offset-4 decoration-lumi-blue/30">
              Volver a Iniciar Sesión
            </Link>
          </footer>
        </div>
        
        <Suspense fallback={null}>
          <LoginErrorToast />
        </Suspense>
      </div>
    </div>
  )
}
