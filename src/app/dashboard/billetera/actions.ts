'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function simularRecarga(amount: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autorizado' }

  // Obtener saldo actual
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('saldo_billetera')
    .eq('id', user.id)
    .single()

  const nuevoSaldo = (perfil?.saldo_billetera || 0) + amount

  // Actualizar
  const { error } = await supabase
    .from('perfiles')
    .update({ saldo_billetera: nuevoSaldo })
    .eq('id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/billetera')
  
  return { success: true, nuevoSaldo }
}
