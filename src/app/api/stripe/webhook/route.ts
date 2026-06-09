import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { syncPlanToScreens } from '@/app/actions/profile'


export async function POST(req: Request) {
  if (!stripe) {
    return new NextResponse('Stripe not initialized', { status: 503 })
  }
  const body = await req.text()
  const signature = req.headers.get('Stripe-Signature') as string

  let event: Stripe.Event
  
  if (!stripe) {
    return new NextResponse("Stripe is not configured", { status: 500 })
  }

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    console.error(`[WEBHOOK_ERROR] ${error.message}`)
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const subscription = event.data.object as Stripe.Subscription

  // Admin client needed to bypass RLS since webhook comes from outside
  const supabase = await createAdminClient()

  if (event.type === 'checkout.session.completed') {
    if (!session?.metadata?.userId) {
      return new NextResponse('User id is required in metadata', { status: 400 })
    }

    if (session.metadata.type === 'billetera_recharge') {
       const amountStr = session.metadata.amount
       const amount = parseFloat(amountStr || '0')
       
       if (amount > 0) {
          const { data: profile } = await supabase.from('perfiles').select('saldo_billetera').eq('id', session.metadata.userId).single()
          await supabase.from('perfiles').update({
             saldo_billetera: (profile?.saldo_billetera || 0) + amount
          }).eq('id', session.metadata.userId)
       }
    } else {
       // Retrieve the subscription details from Stripe
       const stripeSubscription = (await stripe.subscriptions.retrieve(
         session.subscription as string
       )) as any;

       await supabase
         .from('perfiles')
         .update({
           stripe_subscription_id: stripeSubscription.id,
           stripe_customer_id: (stripeSubscription as any).customer as string,
           stripe_price_id: (stripeSubscription as any).items.data[0].price.id,
           stripe_current_period_end: new Date(
             (stripeSubscription as any).current_period_end * 1000
           ).toISOString(),
           plan_id: session.metadata.planId,
           suscripcion_activa: true,
         })
         .eq('id', session.metadata.userId)

       // Sync screens immediately
       await syncPlanToScreens(session.metadata.userId, session.metadata.planId, true)
    }
  }

  if (event.type === 'invoice.payment_succeeded') {
    // Retrieve the subscription details from Stripe
    const stripeSubscription = (await stripe.subscriptions.retrieve(
      session.subscription as string
    )) as any;

    await supabase
      .from('perfiles')
      .update({
        stripe_price_id: (stripeSubscription as any).items.data[0].price.id,
        stripe_current_period_end: new Date(
          (stripeSubscription as any).current_period_end * 1000
        ).toISOString(),
        suscripcion_activa: true,
      })
      .eq('stripe_subscription_id', (stripeSubscription as any).id)
  }
  
  if (event.type === 'customer.subscription.deleted') {
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
