import Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'

type CreditWalletRechargeOptions = {
  expectedUserId?: string
  session: Stripe.Checkout.Session
  stripe: Stripe
  supabase: SupabaseClient
}

type ReconcileWalletRechargesOptions = {
  stripe: Stripe
  supabase: SupabaseClient
  userId: string
}

export async function creditWalletRechargeSession({
  expectedUserId,
  session,
  stripe,
  supabase,
}: CreditWalletRechargeOptions) {
  if (session.metadata?.type !== 'billetera_recharge') {
    return { credited: false, reason: 'not_wallet_recharge' }
  }

  const userId = session.metadata.userId
  if (!userId) {
    throw new Error('La recarga no tiene usuario asociado')
  }

  if (expectedUserId && expectedUserId !== userId) {
    throw new Error('La recarga no pertenece al usuario actual')
  }

  if (session.payment_status !== 'paid') {
    return { credited: false, reason: 'payment_not_paid' }
  }

  if (session.metadata.wallet_credited === 'true') {
    return { credited: false, reason: 'already_credited' }
  }

  const amount = typeof session.amount_total === 'number'
    ? session.amount_total / 100
    : Number.parseFloat(session.metadata.amount || '0')

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Importe de recarga no valido')
  }

  const { data: profile, error: profileError } = await supabase
    .from('perfiles')
    .select('saldo_billetera')
    .eq('id', userId)
    .single()

  if (profileError) {
    throw profileError
  }

  const currentBalance = Number(profile?.saldo_billetera || 0)
  const { error: updateError } = await supabase
    .from('perfiles')
    .update({ saldo_billetera: currentBalance + amount })
    .eq('id', userId)

  if (updateError) {
    throw updateError
  }

  await stripe.checkout.sessions.update(session.id, {
    metadata: {
      ...session.metadata,
      wallet_credited: 'true',
      wallet_credited_at: new Date().toISOString(),
    },
  })

  return { credited: true, amount }
}

export async function reconcileWalletRechargesForUser({
  stripe,
  supabase,
  userId,
}: ReconcileWalletRechargesOptions) {
  const sessions = await stripe.checkout.sessions.list({ limit: 100 })
  let creditedCount = 0

  for (const session of sessions.data) {
    if (
      session.metadata?.type === 'billetera_recharge' &&
      session.metadata.userId === userId &&
      session.payment_status === 'paid' &&
      session.metadata.wallet_credited !== 'true'
    ) {
      const result = await creditWalletRechargeSession({
        expectedUserId: userId,
        session,
        stripe,
        supabase,
      })

      if (result.credited) {
        creditedCount += 1
      }
    }
  }

  return { creditedCount }
}
