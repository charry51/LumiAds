import { stripe } from './stripe'
import { createAdminClient } from './supabase/server'

/**
 * Gets the existing Stripe customer ID from database, or searches Stripe by email to avoid duplicates,
 * or creates a new Stripe customer. Updates the user profile in database with the resolved customer ID.
 */
export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string | null> {
  if (!stripe) return null

  const supabase = await createAdminClient()

  // 1. Fetch user profile
  const { data: profile } = await supabase
    .from('perfiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  let customerId = profile?.stripe_customer_id

  // 2. If valid customer id, return it
  if (customerId && !customerId.includes('sandbox')) {
    try {
      // Retrieve to ensure it still exists in Stripe
      const existingCustomer = await stripe.customers.retrieve(customerId)
      if (existingCustomer && !existingCustomer.deleted) {
        return customerId
      }
    } catch (e) {
      console.warn(`Customer ${customerId} not found in Stripe, creating new one.`)
    }
  }

  // 3. Search Stripe by email to avoid duplicates
  try {
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1
    })

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id
      
      // Save it in profile
      await supabase
        .from('perfiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
      
      return customerId
    }
  } catch (e) {
    console.error("Error listing Stripe customers:", e)
  }

  // 4. Create new Stripe customer if not found
  try {
    const customer = await stripe.customers.create({
      email: email,
      metadata: { supabaseUserId: userId },
    })

    customerId = customer.id

    // Save in profile
    await supabase
      .from('perfiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId)

    return customerId
  } catch (e) {
    console.error("Error creating Stripe customer:", e)
    return null
  }
}
