import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateStripeCustomer } from '@/lib/stripe-customers'

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

    const customerId = await getOrCreateStripeCustomer(user.id, user.email!)

    if (!customerId) {
      return new NextResponse("Error al resolver cliente de Stripe", { status: 500 })
    }

    // Intentar abrir el portal de facturación con el customer ID
    try {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${appUrl}/dashboard/perfil`,
      })
      return NextResponse.json({ url: stripeSession.url })
    } catch (portalError: any) {
      // Si por alguna razón el customer no existe en Stripe (fue borrado), forzar nueva creación
      if (portalError?.message?.includes('No such customer')) {
        await supabase
          .from('perfiles')
          .update({ stripe_customer_id: null })
          .eq('id', user.id)
          
        const newCustomerId = await getOrCreateStripeCustomer(user.id, user.email!)
        if (!newCustomerId) {
          throw new Error("No se pudo recrear el cliente de Stripe")
        }

        // Reintentar con el nuevo customer
        const stripeSession = await stripe.billingPortal.sessions.create({
          customer: newCustomerId,
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
