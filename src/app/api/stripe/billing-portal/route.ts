import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { data: profile } = await supabase
      .from('perfiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!stripe || !profile?.stripe_customer_id || profile.stripe_customer_id.includes('sandbox')) {
      // En modo sandbox, no hay portal real
      return new NextResponse("Portal no disponible en modo Sandbox", { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    if (!stripe) throw new Error("Stripe not initialized");
    const stripeSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/dashboard/perfil`,
    })

    return NextResponse.json({ url: stripeSession.url })
  } catch (error) {
    console.error("[STRIPE_BILLING_PORTAL]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
