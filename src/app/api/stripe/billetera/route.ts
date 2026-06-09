import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { amount } = await req.json()

    if (!amount || amount <= 0) {
      return new NextResponse("Monto inválido", { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { data: profile } = await supabase
      .from('perfiles')
      .select('stripe_customer_id, es_anunciante')
      .eq('id', user.id)
      .single()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    if (!stripe) {
      console.log("⚠️ Ejecutando en MODO SANDBOX (Billetera)")
      
      const { data: currentProfile } = await supabase
          .from('perfiles')
          .select('saldo_billetera')
          .eq('id', user.id)
          .single()
      
      await supabase
        .from('perfiles')
        .update({
          saldo_billetera: (currentProfile?.saldo_billetera || 0) + amount,
        })
        .eq('id', user.id)

      return NextResponse.json({ url: `${appUrl}/advertiser` })
    }

    const isValidCustomer = profile?.stripe_customer_id && !profile.stripe_customer_id.includes('sandbox')

    const stripeSession = await stripe.checkout.sessions.create({
      success_url: `${appUrl}/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/billetera?payment=canceled`,
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: isValidCustomer ? undefined : user.email,
      customer: isValidCustomer ? profile.stripe_customer_id : undefined,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Recarga de Billetera LumiAds',
              description: 'Saldo para campañas DOOH'
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        type: 'billetera_recharge',
        amount: amount.toString()
      },
    })

    return NextResponse.json({ url: stripeSession.url })
  } catch (error: any) {
    console.error("[STRIPE_BILLETERA]", error)
    return new NextResponse("Error interno al procesar el pago", { status: 500 })
  }
}
