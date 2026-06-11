import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Obtener destino de la cookie temporal (suplantación) o del parámetro query
  const cookieStore = await cookies()
  const impersonateNext = cookieStore.get('impersonate_next')?.value
  const next = impersonateNext || searchParams.get('next') || '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Borrar la cookie para limpiar la suplantación de la sesión actual
      if (impersonateNext) {
        cookieStore.delete('impersonate_next')
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?message=No se pudo autenticar con el proveedor social`)
}
