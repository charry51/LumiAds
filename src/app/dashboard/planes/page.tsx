import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function PlanesPage() {
  const supabase = await createClient()
  
  // Obtener planes
  const { data: planes } = await supabase
    .from('planes')
    .select('*')
    .order('precio_mensual', { ascending: true })

  // Obtener plan actual del usuario
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('perfiles')
    .select('plan_id')
    .eq('id', user?.id)
    .single()

  return (
    <div className="p-8 min-h-screen bg-background text-foreground font-sans">
      
      {/* Botón de volver */}
      <div className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
        <Link href="/dashboard">
          <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-white group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver al Dashboard
          </Button>
        </Link>
      </div>

      <header className="text-center mb-16">
        <h1 className="text-5xl font-heading uppercase tracking-tighter text-foreground dark:text-zinc-100 mb-4">Planes de Emisión</h1>
        <p className="text-sm text-muted-foreground font-mono uppercase tracking-[3px] max-w-2xl mx-auto">
          Potencia tus pantallas con la mejor estrategia de contenidos.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {planes?.map((plan) => (
          <div key={plan.id} className={`cyber-card light:bg-white light:border-slate-100 p-6 flex flex-col transition-all relative ${
            profile?.plan_id === plan.id ? 'ring-2 ring-primary ring-offset-4 ring-offset-background' : ''
          }`}>
            {profile?.plan_id === plan.id && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 w-full flex justify-center">
                <span className="bg-primary text-black text-[9px] uppercase font-black px-4 py-1.5 rounded-full tracking-[2px] shadow-[0_0_20px_rgba(124,60,255,0.3)]">
                  Tu Plan Actual
                </span>
              </div>
            )}

            {plan.id === 'presencia' && profile?.plan_id !== 'presencia' && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10 w-full flex justify-center">
                <span className="bg-[#FFD700] text-black text-[10px] uppercase font-black px-5 py-2 rounded-full tracking-widest shadow-[0_0_30px_rgba(255,215,0,0.4)] border border-white/20 animate-bounce">
                   🎁 ¡30 DÍAS GRATIS!
                </span>
              </div>
            )}
            
            <div className="mb-6 pt-4">
              <h3 className="text-xl font-heading text-foreground dark:text-zinc-100 light:text-black uppercase mb-2 tracking-tight">{plan.nombre}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-mono font-bold text-primary">{plan.precio_mensual}€</span>
                <span className="text-[10px] text-zinc-500 font-mono uppercase">/ mensual</span>
              </div>
            </div>

            <div className="flex-1 mb-8">
              <ul className="space-y-3 text-[11px] font-mono uppercase tracking-tight text-zinc-400">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(124,60,255,0.8)]"></span>
                  {plan.id === 'dominio' ? 'Pantallas Ilimitadas' : `${plan.max_pantallas} Nodos de pantalla`}
                </li>
                <li className="flex items-center gap-2 text-[#7C3CFF] font-bold">
                  <span className="w-1.5 h-1.5 bg-[#7C3CFF] rounded-full"></span>
                  Frecuencia {plan.frecuencia_relativa}x 
                  <span className="text-[8px] opacity-70 ml-1">
                    ({plan.id === 'presencia' ? '1 cada 2 bucles' : 
                      plan.id === 'presencia_pro' ? 'Máx 1 por bucle' :
                      plan.id === 'impacto_senior' ? 'Mín 2 por bucle' : '2-5 por bucle'})
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full opacity-50"></span>
                  Slots de {plan.max_duracion_segundos}s
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-secondary rounded-full"></span>
                  Prioridad {plan.prioridad}
                </li>
                {(plan.id === 'impacto_senior' || plan.id === 'dominio') && (
                  <li className="flex items-center gap-2 text-green-400">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    Elección de Franjas Horarias
                  </li>
                )}
              </ul>
            </div>

            <div className="mt-auto">
              {profile?.plan_id === plan.id ? (
                <button className="w-full py-3 text-[10px] uppercase font-black tracking-widest border border-zinc-800 text-zinc-600 cursor-not-allowed">
                  Tu Plan Actual
                </button>
              ) : (
                <Link href={`/dashboard/planes/checkout?plan=${plan.id}`} className="w-full">
                  <button className="cyber-button-ui w-full text-[11px] font-black uppercase tracking-[2px]">
                    Contratar Plan
                  </button>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
