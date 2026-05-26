import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PlanSelectionClient } from '@/components/billing/PlanSelectionClient'

export default async function PlanSelectionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/register?type=host&returnTo=/planes/seleccionar')
  }

  const { data: profile } = await supabase
    .from('perfiles')
    .select('es_host, es_anunciante')
    .eq('id', user.id)
    .single()

  if (!profile?.es_host) {
    redirect('/advertiser')
  }

  return (
    <div className="min-h-screen bg-[#04060F] px-6 py-12 md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-8 md:p-10 shadow-[0_0_80px_rgba(0,0,0,0.5)]">
          <PlanSelectionClient />
        </div>
      </div>
    </div>
  )
}
