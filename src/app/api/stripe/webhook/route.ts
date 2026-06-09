import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { creditWalletRechargeSession } from '@/lib/wallet-recharge'
import { syncPlanToScreens } from '@/app/actions/profile'
import Stripe from 'stripe'

type InvoiceWithSubscription = Stripe.Invoice & {
  subscription?: string | Stripe.Subscription | null
}

type SubscriptionWithPeriodEnd = Stripe.Subscription & {
  current_period_end?: number
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Error desconocido'
}

function getSubscriptionId(subscription: string | Stripe.Subscription | null | undefined) {
  if (!subscription) return null
  return typeof subscription === 'string' ? subscription : subscription.id
}

function getCustomerId(subscription: Stripe.Subscription) {
  return typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id
}

function getSubscriptionPriceId(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.price.id ?? null
}

function getCurrentPeriodEnd(subscription: Stripe.Subscription) {
  const currentPeriodEnd = (subscription as SubscriptionWithPeriodEnd).current_period_end
  return currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null
}

export async function POST(req: Request) {
  if (!stripe) {
    return new NextResponse('Stripe not initialized', { status: 503 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return new NextResponse('Stripe webhook secret is not configured', { status: 500 })
  }

  const body = await req.text()
  const signature = req.headers.get('Stripe-Signature')

  if (!signature) {
    return new NextResponse('Stripe signature is required', { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error: unknown) {
    const message = getErrorMessage(error)
    console.error(`[WEBHOOK_ERROR] ${message}`)
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 })
  }

  const supabase = await createAdminClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    if (!session?.metadata?.userId) {
      return new NextResponse('User id is required in metadata', { status: 400 })
    }

    if (session.metadata.type === 'billetera_recharge') {
      const latestSession = await stripe.checkout.sessions.retrieve(session.id)
      await creditWalletRechargeSession({
        session: latestSession,
        stripe,
        supabase,
      })
    } else {
      const subscriptionId = getSubscriptionId(session.subscription)
      if (!subscriptionId) {
        return new NextResponse('Subscription id is required', { status: 400 })
      }

      const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)

      await supabase
        .from('perfiles')
        .update({
          stripe_subscription_id: stripeSubscription.id,
          stripe_customer_id: getCustomerId(stripeSubscription),
          stripe_price_id: getSubscriptionPriceId(stripeSubscription),
          stripe_current_period_end: getCurrentPeriodEnd(stripeSubscription),
          plan_id: session.metadata.planId,
          suscripcion_activa: true,
        })
        .eq('id', session.metadata.userId)

      await syncPlanToScreens(session.metadata.userId, session.metadata.planId, true)
    }
  }

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as InvoiceWithSubscription
    const subscriptionId = getSubscriptionId(invoice.subscription)

    if (subscriptionId) {
      const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)

      await supabase
        .from('perfiles')
        .update({
          stripe_price_id: getSubscriptionPriceId(stripeSubscription),
          stripe_current_period_end: getCurrentPeriodEnd(stripeSubscription),
          suscripcion_activa: true,
        })
        .eq('stripe_subscription_id', stripeSubscription.id)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const { data: profile } = await supabase
      .from('perfiles')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (profile) {
      await supabase
        .from('perfiles')
        .update({
          suscripcion_activa: false,
          plan_id: null,
        })
        .eq('id', profile.id)

      await syncPlanToScreens(profile.id, null, false)
    }
  }

  return new NextResponse(null, { status: 200 })
}
