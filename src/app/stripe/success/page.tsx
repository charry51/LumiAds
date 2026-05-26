import { redirect } from 'next/navigation'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripeApiVersion = '2026-04-22.dahlia' as const

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let homePath = '/advertiser'

  if (user) {
    const { data: profile } = await supabase
      .from('perfiles')
      .select('es_host')
      .eq('id', user.id)
      .single()

    if (profile?.es_host) {
      homePath = '/host'
    }
  }

  const sessionId = searchParams.session_id

  if (!sessionId) {
    redirect(homePath)
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY

  if (!stripeSecret) {
    redirect(homePath)
  }

  try {
    const stripe = new Stripe(stripeSecret, { apiVersion: stripeApiVersion })
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const planId = typeof session.metadata?.planId === 'string' ? session.metadata.planId : null

    if (user && planId) {
      await supabase
        .from('perfiles')
        .update({
          plan_id: planId,
          suscripcion_activa: true,
          plan_host: homePath === '/host' ? planId : null,
        })
        .eq('id', user.id)
    }
  } catch {
    // Si no podemos recuperar la sesión, seguimos con el redirect al home correspondiente.
  }

  redirect(homePath)
}
