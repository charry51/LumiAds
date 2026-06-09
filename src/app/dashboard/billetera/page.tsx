import { redirect } from 'next/navigation'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { reconcileWalletRechargesForUser } from '@/lib/wallet-recharge'
import { BilleteraClient } from './BilleteraClient'

export default async function BilleteraPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  if (stripe) {
    try {
      try {
        await reconcileWalletRechargesForUser({
          stripe,
          supabase,
          userId: user.id,
        })
      } catch (userClientError) {
        console.error('[WALLET_RECONCILE_USER]', userClientError)
        const adminClient = await createAdminClient()
        await reconcileWalletRechargesForUser({
          stripe,
          supabase: adminClient,
          userId: user.id,
        })
      }
    } catch (error) {
      console.error('[WALLET_RECONCILE]', error)
    }
  }

  const { data: profile } = await supabase
    .from('perfiles')
    .select('saldo_billetera')
    .eq('id', user.id)
    .single()

  return (
    <BilleteraClient
      initialBalance={Number(profile?.saldo_billetera || 0)}
      paymentStatus={params.payment}
    />
  )
}
