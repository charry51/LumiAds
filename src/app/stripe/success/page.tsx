import { redirect } from 'next/navigation'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { syncPlanToScreens } from '@/app/actions/profile'
import { cookies } from 'next/headers'

const stripeApiVersion = '2026-04-22.dahlia' as const

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
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

  const resolvedSearchParams = await searchParams
  const sessionId = resolvedSearchParams.session_id

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

    if (session.metadata?.type === 'billetera_recharge') {
      homePath = '/advertiser'
      const amount = parseFloat(session.metadata.amount || '0')
      const isProcessed = session.metadata.processed === 'true'

      if (!isProcessed && amount > 0 && user) {
        // Mark as processed in Stripe first to avoid double crediting
        await stripe.checkout.sessions.update(sessionId, {
          metadata: {
            ...session.metadata,
            processed: 'true'
          }
        })

        const { data: profile } = await supabase
          .from('perfiles')
          .select('saldo_billetera')
          .eq('id', user.id)
          .single()

        const currentBalance = parseFloat(profile?.saldo_billetera?.toString() || '0')
        const newBalance = currentBalance + amount

        const { error: updateError } = await supabase
          .from('perfiles')
          .update({ saldo_billetera: newBalance })
          .eq('id', user.id)

        if (updateError) {
          console.error("Error updating wallet balance:", updateError)
        }
      }
    } else if (user && planId) {
      await supabase
        .from('perfiles')
        .update({
          plan_id: planId,
          suscripcion_activa: true,
        })
        .eq('id', user.id)

      // Sync screens immediately
      await syncPlanToScreens(user.id, planId, true)
    }
  } catch (error) {
    console.error("Error in SuccessPage:", error)
  }

  redirect(homePath)
}
