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
      .select('stripe_account_id, es_host')
      .eq('id', user.id)
      .single()

    if (!profile?.es_host) {
       return new NextResponse("Not a host", { status: 403 })
    }

    if (!profile.stripe_account_id) {
       return new NextResponse("Please configure your payout account first", { status: 400 })
    }

    if (!stripe) {
      return new NextResponse("Stripe not configured", { status: 500 })
    }

    // Get all host records for this user
    const { data: hosts } = await supabase
      .from('hosts')
      .select('id, saldo_pendiente, saldo_pagado')
      .eq('perfil_id', user.id)

    if (!hosts || hosts.length === 0) {
      return new NextResponse("No hosts found", { status: 404 })
    }

    let totalPayout = 0
    for (const h of hosts) {
      totalPayout += (h.saldo_pendiente || 0)
    }

    if (totalPayout < 50) {
      return new NextResponse("Minimum payout is 50€", { status: 400 })
    }

    // Send transfer via Stripe Connect
    const transfer = await stripe.transfers.create({
      amount: Math.round(totalPayout * 100),
      currency: 'eur',
      destination: profile.stripe_account_id,
      description: 'LumiAds DOOH Earnings Payout',
    })

    // Update balances
    for (const h of hosts) {
      if ((h.saldo_pendiente || 0) > 0) {
         await supabase
           .from('hosts')
           .update({ 
             saldo_pendiente: 0, 
             saldo_pagado: (h.saldo_pagado || 0) + (h.saldo_pendiente || 0) 
           })
           .eq('id', h.id)
      }
    }

    return NextResponse.json({ success: true, transferId: transfer.id })
  } catch (error: any) {
    console.error("[STRIPE_PAYOUT]", error)
    return new NextResponse(error.message || "Internal Error", { status: 500 })
  }
}
