import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardMainPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('perfiles').select('*').eq('id', user.id).single()

  if (profile?.rol === 'superadmin') {
    redirect('/admin')
  } else if (profile?.rol === 'comercial' || profile?.rol === 'gestor_local') {
    redirect('/agency')
  } else if (profile?.es_host) {
    redirect('/host')
  } else {
    redirect('/advertiser')
  }
}
