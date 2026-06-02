import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardMainPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('perfiles').select('*').eq('id', user.id).single()

  let finalProfile = profile
  if (profile && !profile.organizacion_id) {
    const adminClient = await createAdminClient()
    const { data: org } = await adminClient
      .from('organizaciones')
      .insert({ nombre: `Organización de ${user.email || user.id}` })
      .select('id')
      .single()

    if (org) {
      const { data: updatedProfile } = await adminClient
        .from('perfiles')
        .update({ organizacion_id: org.id })
        .eq('id', user.id)
        .select('*')
        .single()
      if (updatedProfile) {
        finalProfile = updatedProfile
      }
    }
  }

  if (finalProfile?.rol === 'superadmin') {
    redirect('/admin')
  } else if (finalProfile?.rol === 'gestor_local' || finalProfile?.es_host) {
    redirect('/host')
  } else {
    redirect('/advertiser')
  }
}
