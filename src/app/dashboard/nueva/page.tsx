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

  if (!profile?.plan_id || profile?.suscripcion_activa === false) {
     redirect('/dashboard/planes')
  }

  // Fetch only active, public screens with Yield data.
  const { data: pantallas, error } = await supabase
    .from('pantallas')
    .select('id, nombre, ubicacion, ciudad, latitud, longitud, precio_emision, precio_base')
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
    <div className="max-w-4xl mx-auto py-12 px-6 bg-background text-foreground min-h-screen">
      <header className="mb-8 border-b border-border pb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="icon" className="rounded-full border-border hover:bg-muted h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <img src="/LogoPequeno.png" alt="LuminAdd Logo" className="h-10 w-auto" />
        </div>
        <div>
            <h1 className="text-2xl font-bold text-foreground italic tracking-tight uppercase group flex items-center gap-2">
                CONFIGURAR <span className="text-[#7C3CFF] NOT-italic drop-shadow-[0_0_8px_rgba(124,60,255,0.4)]">EMISIÓN</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] bg-[#7C3CFF]/10 text-[#7C3CFF] font-bold px-3 py-1 rounded-full border border-[#7C3CFF]/30 uppercase tracking-widest">
                    Modo: {profile.planes.nombre}
                </span>
            </div>
        </div>
      </header>
      
      <div className="p-8 border border-border rounded-2xl shadow-2xl bg-card">
        <CampaignForm pantallas={pantallas || []} userPlan={profile.planes.nombre} />
      </div>
    </div>
  )
}



