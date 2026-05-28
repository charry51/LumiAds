import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import CampaignForm from './CampaignForm'

export default async function NuevaCampanaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // FORZAR ONBOARDING
  const { data: profile } = await supabase
    .from('perfiles')
    .select('*, planes(nombre)')
    .eq('id', user?.id)
    .single()

  if (!profile?.es_anunciante && (!profile?.plan_id || profile?.suscripcion_activa === false)) {
     redirect('/dashboard/planes')
  }

  // Fetch only active, public screens with Yield data.
  const { data: pantallas, error } = await supabase
    .from('pantallas')
    .select('id, nombre, ubicacion, ciudad, latitud, longitud, precio_emision, precio_base, precio_base_impacto, comision_markup_porcentaje, tipo_pantalla, densidad_poblacion_nivel')
    .eq('estado', 'activa')
    .eq('es_publica', true)

  if (error) {
    return (
      <div className="p-8 text-red-500 bg-red-50 rounded-lg">
        <h1>Error cargando pantallas</h1>
        <p>{error.message}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#04060F] text-zinc-100 font-sans selection:bg-[#2BC8FF]/30 relative overflow-hidden">
      {/* Glow Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#7C3CFF]/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-[#2BC8FF]/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 relative z-10">
        <header className="mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="icon" className="rounded-full border-white/10 bg-white/5 hover:bg-white/10 hover:text-white text-zinc-400 transition-all h-10 w-10 backdrop-blur-md">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <img src="/LogoPequeno.png" alt="LuminAdd Logo" className="h-10 w-auto filter drop-shadow-[0_0_10px_rgba(43,200,255,0.3)]" />
          </div>
          <div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                  Configurar <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3CFF] to-[#2BC8FF]">Emisión</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] bg-[#7C3CFF]/10 text-[#7C3CFF] font-black px-2.5 py-0.5 rounded border border-[#7C3CFF]/30 uppercase tracking-[0.2em]">
                      Modo: {profile.planes?.nombre || 'PROGRAMÁTICO'}
                  </span>
              </div>
          </div>
        </header>
        
        <div className="w-full">
          <CampaignForm 
            pantallas={pantallas || []} 
            userPlan={profile.planes?.nombre || 'Programático'} 
            walletBalance={profile.saldo_billetera || 0}
          />
        </div>
      </div>
    </div>
  )
}



