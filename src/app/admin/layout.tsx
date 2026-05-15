import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminMobileNav from '@/components/AdminMobileNav'
import { Users } from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener perfil del usuario
  const { data: perfil, error: perfilError } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  // Verificar si tiene rol de gestión (superadmin, comercial o gestor_local)
  const rolesPermitidos = ['superadmin', 'comercial', 'gestor_local']
  
  if (perfilError || !perfil || !rolesPermitidos.includes(perfil.rol)) {
    redirect('/dashboard')
  }

  // Obtener conteo de tickets pendientes para el badge
  const { count: pendingTickets } = await supabase
    .from('soporte_tickets')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'PENDIENTE')

  return (
    <div className="dark min-h-screen bg-zinc-950 text-zinc-100 flex font-[family-name:var(--font-geist-sans)]">
      {/* Navegación Móvil (Solo visible en < md) */}
      <AdminMobileNav />

      {/* Sidebar Admin (Escritorio) */}
      <aside className="hidden md:flex w-64 border-r border-zinc-900 bg-black flex-col flex-shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <img src="/LogoPequeno.png" alt="LuminAdd Icon" className="h-[60px] w-auto" />
            <img src="/LogoTexto.png" alt="LuminAdd" className="h-[80px] w-auto" />
          </div>
          <span className="text-[10px] text-[#7C3CFF] font-black uppercase tracking-[0.3em] mt-2 block pl-1">Admin Panel</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link href="/admin" className="block px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-md transition-colors">
            Resumen Global
          </Link>

          {/* Comercial: Gestión de Campañas y Pantallas */}
          {(perfil.rol === 'superadmin' || perfil.rol === 'comercial') && (
            <>
              <Link href="/admin/campanas" className="block px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-md transition-colors">
                Gestión de Campañas
              </Link>
              <Link href="/admin/pantallas" className="block px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-md transition-colors">
                Red de Pantallas
              </Link>
            </>
          )}

          {/* Gestor Local: Soporte Técnico y Mensajes */}
          {(perfil.rol === 'superadmin' || perfil.rol === 'gestor_local') && (
            <>
              <Link href="/admin/soporte" className="block px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-md transition-colors flex items-center justify-between group">
                <span>Soporte Técnico</span>
                {pendingTickets && pendingTickets > 0 ? (
                   <span className="bg-[#7C3CFF] text-black text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse shadow-[0_0_10px_rgba(124,60,255,0.4)]">
                     {pendingTickets}
                   </span>
                ) : (
                   <div className="w-1.5 h-1.5 rounded-full bg-[#7C3CFF] opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </Link>
              <Link href="/admin/mensajes" className="block px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-md transition-colors">
                Mensajes de Contacto
              </Link>
            </>
          )}

          {/* Superadmin: Gestión de Usuarios */}
          {perfil.rol === 'superadmin' && (
            <Link href="/admin/usuarios" className="block px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-md transition-colors flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Gestión de Usuarios</span>
            </Link>
          )}
        </nav>
        <div className="p-4 border-t border-zinc-900">
          <Link href="/dashboard" className="block px-4 py-2 text-sm text-zinc-500 hover:text-white transition-colors">
            ← Volver a Cliente
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full pt-16 md:pt-0">
        <div className="p-4 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}


