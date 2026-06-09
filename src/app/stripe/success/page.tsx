import { redirect } from 'next/navigation'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { creditWalletRechargeSession } from '@/lib/wallet-recharge'

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let homePath = '/dashboard'

  if (user) {
    const { data: profile } = await supabase
      .from('perfiles')
      .select('es_anunciante, es_host')
      .eq('id', user.id)
      .single()

    if (profile?.es_anunciante) {
      homePath = '/advertiser'
    } else if (profile?.es_host) {
      homePath = '/host'
    }
  }

  const sessionId = params.session_id

  if (!sessionId || !stripe || !user) {
    redirect(homePath)
  }

  let redirectPath = homePath

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const sessionType = session.metadata?.type
    const planId = typeof session.metadata?.planId === 'string' ? session.metadata.planId : null

    if (sessionType === 'billetera_recharge') {
      try {
        await creditWalletRechargeSession({
          expectedUserId: user.id,
          session,
          stripe,
          supabase,
        })
      } catch (userClientError) {
        console.error('[STRIPE_SUCCESS_USER_WALLET]', userClientError)
        const adminClient = await createAdminClient()
        await creditWalletRechargeSession({
          expectedUserId: user.id,
          session,
          stripe,
          supabase: adminClient,
        })
      }
      redirectPath = '/dashboard/billetera?payment=success'
    } else if (planId && session.payment_status === 'paid') {
      const adminClient = await createAdminClient()
      await adminClient
        .from('perfiles')
        .update({
          plan_id: planId,
          suscripcion_activa: true,
          plan_host: homePath === '/host' ? planId : null,
        })
        .eq('id', user.id)
    }
  } catch (error) {
    console.error('[STRIPE_SUCCESS]', error)
    redirectPath = '/dashboard/billetera?payment=error'
  }

  redirect(redirectPath)
}
