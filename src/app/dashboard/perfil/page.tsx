import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  User, 
  Mail, 
  Shield, 
  ArrowLeft,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AccessibilitySettings } from '@/components/AccessibilitySettings'
import { ProfileForm } from './ProfileForm'
import { PlanManager } from './PlanManager'


export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const success = resolvedParams.success === 'true';
  const sessionId = resolvedParams.session_id as string;

  const supabase = await createClient()

  // Recuperar sesión activa
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // --- FALLBACK DE ACTUALIZACIÓN INMEDIATA (Para local/webhooks lentos) ---
  if (success && sessionId) {
    try {
      const { stripe } = await import('@/lib/stripe')
      if (stripe) {
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        
        if (session.payment_status === 'paid' && session.metadata?.userId === user.id) {
          // Actualizamos el perfil directamente si el pago fue exitoso
          await supabase
            .from('perfiles')
            .update({
              plan_id: session.metadata.planId,
              suscripcion_activa: true,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string
            })
            .eq('id', user.id)
        }
      }
    } catch (error) {
      console.error("[STRIPE_FALLBACK_UPDATE_ERROR]", error)
    }
  }

  const { data: profile } = await supabase
    .from('perfiles')
    .select('*, planes(nombre)')
    .eq('id', user.id)
    .single()

  return (
    <div className="p-8 min-h-screen bg-background text-foreground font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header de Navegación */}
        <div className="mb-10 flex items-center justify-between">
            <Link href="/dashboard">
                <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-white group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Volver al Dashboard
                </Button>
            </Link>
            <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary animate-spin-slow" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Configuración de Cuenta</span>
            </div>
        </div>

        <h1 className="text-4xl font-heading font-black uppercase tracking-tighter mb-12 text-gradient-ui">Mi Perfil</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          
          {/* Columna Izquierda: Info Usuario */}
          <div className="md:col-span-1 space-y-6">
            <div className="cyber-card p-6 bg-zinc-900/50 dark:bg-zinc-900/50 light:bg-white light:border-slate-100 transition-all duration-500 shadow-sm light:shadow-slate-200/50">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary p-0.5 mb-4 shadow-[0_0_20px_rgba(124,60,255,0.2)]">
                    <div className="w-full h-full bg-zinc-950 rounded-[inherit] flex items-center justify-center">
                        <User className="w-8 h-8 text-primary" />
                    </div>
                </div>
                <h2 className="text-xl font-heading font-bold text-white mb-1 uppercase tracking-tight">{profile?.nombre_empresa || profile?.nombre || 'Usuario LuminAdd'}</h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <Mail className="w-3 h-3" />
                    {user.email}
                </div>
                
                <div className="pt-4 border-t border-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-zinc-500 uppercase font-black uppercase">Plan Actual</span>
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-bold border border-primary/20 uppercase">
                            {profile?.planes?.nombre || 'Básico'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-500 uppercase font-black uppercase">Rol</span>
                        <div className="flex items-center gap-1 text-[10px] text-zinc-300 font-bold uppercase">
                            <Shield className="w-3 h-3 text-secondary" />
                            {profile?.rol || 'Cliente'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-[10px] text-primary font-bold uppercase mb-1">Nota de Seguridad</p>
                <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                    Tus preferencias se sincronizan automáticamente en todos tus dispositivos vinculados a esta cuenta.
                </p>
            </div>
          </div>

          {/* Columna Derecha: Configuración */}
          <div className="md:col-span-2 space-y-8">
            
            {/* Gestión del Plan */}
            <div className="cyber-card p-8 border-white/5 relative overflow-hidden transition-all duration-500 shadow-sm">
                <h3 className="text-xl font-heading font-black tracking-tight uppercase text-white mb-6 flex items-center gap-2">
                    Gestión de Suscripción
                </h3>
                <PlanManager 
                    planName={profile?.planes?.nombre} 
                    isSubscribed={profile?.suscripcion_activa ?? false} 
                />
            </div>

            {/* Información del Perfil */}
            <div className="cyber-card p-8 border-white/5 relative overflow-hidden transition-all duration-500 shadow-sm">
                <h3 className="text-xl font-heading font-black tracking-tight uppercase text-white mb-6 flex items-center gap-2">
                    Información Personal y Corporativa
                </h3>
                <ProfileForm 
                    initialData={{
                        nombre: profile?.nombre || '',
                        nombre_empresa: profile?.nombre_empresa || '',
                        nif: profile?.nif || '',
                        telefono: profile?.telefono || ''
                    }}
                />
            </div>
          
            {/* Tema y Accesibilidad */}
            <div className="cyber-card p-8 border-white/5 dark:border-white/5 light:border-slate-100 light:bg-white relative overflow-hidden transition-all duration-500 shadow-sm light:shadow-slate-200/50">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <Settings className="w-40 h-40" />
                </div>
                <AccessibilitySettings />
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}



