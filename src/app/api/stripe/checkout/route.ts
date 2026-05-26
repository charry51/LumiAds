import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { subscriptionPlans } from '@/config/subscriptions'

export async function POST(req: Request) {
  try {
    const { planId } = await req.json()

    if (!planId) {
      return new NextResponse("Plan ID is required", { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { data: profile } = await supabase
      .from('perfiles')
      .select('stripe_customer_id, nombre_empresa, es_host, es_anunciante')
      .eq('id', user.id)
      .single()

    const plan = subscriptionPlans.find((p) => p.id === planId)

    if (!plan) {
      return new NextResponse("Plan not found", { status: 404 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const userHomePath = profile?.es_host ? '/host' : '/advertiser'

    let priceId = plan.stripePriceId

    if (stripe && !priceId) {
      try {
        console.log(`🔍 Buscando o creando producto/precio en Stripe para el plan: ${plan.name}`)
        const existingProducts = await stripe.products.list({ limit: 100 })
        let product = existingProducts.data.find(p => p.metadata.planId === plan.id)

        if (product) {
          const prices = await stripe.prices.list({ product: product.id, limit: 1 })
          if (prices.data.length > 0) {
            priceId = prices.data[0].id
          }
        }

        if (!priceId) {
          if (!product) {
            product = await stripe.products.create({
              name: `LumiAds - ${plan.name}`,
              metadata: { planId: plan.id }
            })
          }

          const planPriceAmount = plan.id === 'presencia' ? 7900
            : plan.id === 'presencia_pro' ? 14900
              : plan.id === 'impacto_senior' ? 29900
                : 49900

          const price = await stripe.prices.create({
            product: product.id,
            unit_amount: planPriceAmount,
            currency: 'eur',
            recurring: {
              interval: 'month',
            },
          })
          priceId = price.id
        }
        console.log(`✅ Usando Price ID dinámico: ${priceId}`)
      } catch (stripeSetupError) {
        console.error("❌ Error al auto-configurar producto/precio en Stripe:", stripeSetupError)
      }
    }

    if (!stripe || !priceId) {
      console.log("⚠️ Ejecutando en MODO SANDBOX (Sin claves de Stripe o sin Price ID)")

      await supabase
        .from('perfiles')
        .update({
          plan_id: plan.id,
          suscripcion_activa: true,
          stripe_customer_id: 'cus_sandbox_test',
          stripe_current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', user.id)

      return NextResponse.json({ url: `${appUrl}${userHomePath}` })
    }

    const isValidCustomer = profile?.stripe_customer_id && !profile.stripe_customer_id.includes('sandbox')

    const stripeSession = await stripe.checkout.sessions.create({
      success_url: `${appUrl}/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/planes/seleccionar?role=host`,
      payment_method_types: ['card'],
      mode: 'subscription',
      billing_address_collection: 'auto',
      customer_email: isValidCustomer ? undefined : user.email,
      customer: isValidCustomer ? profile.stripe_customer_id : undefined,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        planId: plan.id,
      },
      subscription_data: {
        trial_period_days: plan.id === 'presencia' ? 30 : undefined,
        metadata: {
          userId: user.id,
          planId: plan.id,
        },
      },
    })

    return NextResponse.json({ url: stripeSession.url })
  } catch (error: any) {
    console.error("[STRIPE_CHECKOUT]", error)
    const message = error.message?.includes('column')
      ? "Error de Base de Datos: ¿Has ejecutado el script SQL de Stripe en Supabase?"
      : "Error interno al procesar el pago"
    return new NextResponse(message, { status: 500 })
  }
}
