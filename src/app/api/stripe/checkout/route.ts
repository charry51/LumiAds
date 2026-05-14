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

    // Get user profile to check if they already have a stripe_customer_id
    const { data: profile } = await supabase
      .from('perfiles')
      .select('stripe_customer_id, nombre_empresa')
      .eq('id', user.id)
      .single()

    const plan = subscriptionPlans.find((p) => p.id === planId)

    if (!plan || (!stripe && !plan.stripePriceId && false)) { // No bloquear si estamos en sandbox
      // Dejamos pasar si es sandbox aunque no haya price ID
    }

    if (!plan || (stripe && !plan.stripePriceId)) {
      return new NextResponse("Plan not found or Stripe Price ID missing", { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // --- MODO SANDBOX (Si no hay claves de Stripe) ---
    if (!stripe) {
      console.log("⚠️ Ejecutando en MODO SANDBOX (Sin claves de Stripe)")
      
      // En modo sandbox, actualizamos la DB directamente (simulando el Webhook)
      await supabase
        .from('perfiles')
        .update({
          plan_id: plan.id,
          suscripcion_activa: true,
          stripe_customer_id: 'cus_sandbox_test',
          stripe_current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', user.id)

      // Devolvemos una URL de éxito directa
      return NextResponse.json({ url: `${appUrl}/dashboard?sandbox=true` })
    }

    // Validar si el customer ID es válido (no es de sandbox)
    const isValidCustomer = profile?.stripe_customer_id && !profile.stripe_customer_id.includes('sandbox');

    // --- MODO REAL (Si hay claves de Stripe) ---
    if (!stripe) throw new Error("Stripe not initialized"); // Should be caught by the block above, but satisfies TS
    const stripeSession = await stripe.checkout.sessions.create({
      success_url: `${appUrl}/dashboard/perfil?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/planes`,
      payment_method_types: ['card'],
      mode: 'subscription',
      billing_address_collection: 'auto',
      customer_email: isValidCustomer ? undefined : user.email,
      customer: isValidCustomer ? profile.stripe_customer_id : undefined,
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        planId: plan.id,
      },
      subscription_data: {
        // If it's 'presencia', give a 30-day trial
        trial_period_days: plan.id === 'presencia' ? 30 : undefined,
        metadata: {
          userId: user.id,
          planId: plan.id,
        }
      }
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
