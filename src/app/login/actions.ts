'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    let errorMessage = "Ocurrió un error al iniciar sesión."
    if (error.message.includes("Invalid login credentials")) {
      errorMessage = "Credenciales incorrectas."
    } else if (error.message.includes("Email not confirmed")) {
      errorMessage = "Debes confirmar tu correo electrónico primero."
    }
    redirect('/login?message=' + encodeURIComponent(errorMessage))
  }

  const { data: userAuth } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('perfiles').select('*').eq('id', userAuth?.user?.id).single()

  revalidatePath('/', 'layout')

  if (profile?.rol === 'superadmin') {
    redirect('/admin')
  } else if (profile?.rol === 'comercial' || profile?.rol === 'gestor_local') {
    redirect('/agency')
  } else if (profile?.es_host) {
    redirect('/host')
  } else {
    redirect('/advertiser')
  }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const nombre = formData.get('nombre') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const rolPrincipal = formData.get('rol_principal') as string

  const redirectTarget = rolPrincipal === 'host'
    ? '/planes/seleccionar?role=host'
    : '/advertiser'

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombre: nombre,
      }
    }
  })

  if (error) {
    let errorMessage = error.message
    if (error.message.includes('User already registered') || error.message.includes('already exists')) {
      errorMessage = 'Este correo electrónico ya está registrado.'
    }
    redirect('/register?message=' + encodeURIComponent(errorMessage))
  }

  if (!data?.user) {
    redirect('/register?message=' + encodeURIComponent('No pudimos crear tu cuenta. Inténtalo de nuevo.'))
  }

  const signIn = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signIn.error) {
    redirect('/register?message=' + encodeURIComponent('No se pudo iniciar sesión automáticamente. Intenta iniciar sesión.'))
  }

  const userId = signIn.data.user?.id || data.user.id

  if (!userId) {
    redirect('/register?message=' + encodeURIComponent('No pudimos completar el registro. Inténtalo de nuevo.'))
  }

  // Usar admin client para evitar problemas de RLS
  const admin = await createAdminClient()
  const { error: profileError } = await admin.from('perfiles').update({
    es_anunciante: rolPrincipal === 'anunciante',
    es_host: rolPrincipal === 'host',
  }).eq('id', userId)

  if (profileError) {
    redirect('/register?message=' + encodeURIComponent('No pudimos guardar tu rol. Intenta iniciar sesión.'))
  }

  revalidatePath('/', 'layout')

  redirect(redirectTarget)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
