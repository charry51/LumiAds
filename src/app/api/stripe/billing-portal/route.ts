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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Si no hay Stripe configurado, redirigir al mock
    if (!stripe) {
      return NextResponse.json({ 
        url: `${appUrl}/dashboard/perfil/facturacion-mock`,
        warning: "Visualizando Portal de Facturación en Modo Sandbox (Sin claves de Stripe)."
      })
    }

    // Determinar el customer ID válido
    let customerId = profile?.stripe_customer_id

    // Si no tiene customer ID o es de sandbox, crear uno nuevo en Stripe
    if (!customerId || customerId.includes('sandbox')) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: { supabaseUserId: user.id },
      })
      customerId = customer.id

      // Guardar el nuevo customer ID real en Supabase
      await supabase
        .from('perfiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Intentar abrir el portal de facturación con el customer ID
    try {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${appUrl}/dashboard/perfil`,
      })
      return NextResponse.json({ url: stripeSession.url })
    } catch (portalError: any) {
      // Si el customer no existe en Stripe (fue borrado), crear uno nuevo
      if (portalError?.message?.includes('No such customer')) {
        const customer = await stripe.customers.create({
          email: user.email!,
          metadata: { supabaseUserId: user.id },
        })
        customerId = customer.id

        await supabase
          .from('perfiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id)

        // Reintentar con el nuevo customer
        const stripeSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${appUrl}/dashboard/perfil`,
        })
        return NextResponse.json({ url: stripeSession.url })
      }
      throw portalError
    }
  } catch (error: any) {
    console.error("[STRIPE_BILLING_PORTAL]", error)

    // Si es un error de configuración del portal (no hay productos/suscripciones configuradas)
    if (error?.message?.includes('portal configuration') || error?.code === 'portal_customers_not_supported') {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      return NextResponse.json({
        url: `${appUrl}/dashboard/perfil/facturacion-mock`,
        warning: "El Portal de Facturación de Stripe requiere configuración adicional. Mostrando vista simulada."
      })
    }

    return new NextResponse(error?.message || "Internal Error", { status: 500 })
  }
}
