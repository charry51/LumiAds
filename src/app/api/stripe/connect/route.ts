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

    if (!stripe) {
      return new NextResponse("Stripe not configured", { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    let accountId = profile.stripe_account_id

    // Create a Stripe Express account if it doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: {
          transfers: { requested: true },
        },
      })
      accountId = account.id

      await supabase
        .from('perfiles')
        .update({ stripe_account_id: accountId })
        .eq('id', user.id)
    }

    // Create an account link for onboarding or dashboard
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/host`,
      return_url: `${appUrl}/host`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error: any) {
    console.error("[STRIPE_CONNECT]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
