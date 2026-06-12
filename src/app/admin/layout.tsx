import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Users, ActivitySquare, ShieldAlert, Monitor, DollarSign, LogOut } from 'lucide-react'
import { AdminContactNavLink } from '@/components/admin/AdminContactNavLink'

export const dynamic = 'force-dynamic'

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

  // Verificar si tiene rol de superadmin (El nuevo panel admin es SOLO para superadmin)
  if (perfilError || !perfil || perfil.rol !== 'superadmin') {
    redirect('/login?message=' + encodeURIComponent('Acceso denegado. Se requiere nivel de Superadmin.'))
  }

  const adminClient = await createAdminClient()

  // Obtener conteo de tickets pendientes
  const { count: pendingTickets } = await supabase
    .from('soporte_tickets')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'PENDIENTE')

  // Mensajes de contacto sin leer (buzón público)
  const { count: unreadContactMessages } = await adminClient
    .from('contact_messages')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'unread')

  return (
    <div className="dark min-h-screen bg-background text-zinc-100 flex font-[family-name:var(--font-geist-sans)] selection:bg-lumi-violet/30">
      
      {/* Sidebar Admin (God Mode) */}
      <aside className="w-72 border-r border-white/[0.08] bg-[#0E1426]/75 flex-col flex-shrink-0 hidden md:flex relative overflow-hidden backdrop-blur-xl">
        {/* Glow effect */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-lumi-violet/5 to-transparent pointer-events-none" />
        
        <div className="p-8 relative z-10 border-b border-white/[0.08]">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/LogoPequeno.png"
              alt="LumiAds Icon"
              width={512}
              height={512}
              className="h-[52px] md:h-[64px] w-auto group-hover:scale-110 transition-transform"
            />
            <Image
              src="/LogoTexto.png"
              alt="LumiAds Brand"
              width={720}
              height={400}
              className="h-[64px] md:h-[82px] w-auto"
            />
          </Link>
          <span className="text-[9px] text-lumi-blue font-black uppercase tracking-[0.4em] block mt-3 drop-shadow-[0_0_8px_rgba(43,200,255,0.2)]">Admin Console</span>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-1 relative z-10 overflow-y-auto">
          <div className="mb-6 px-4">
             <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-[2px]">Core Systems</p>
          </div>
          
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-lumi-violet/10 border border-transparent hover:border-lumi-violet/15 rounded-lg transition-all group">
            <ActivitySquare className="w-4 h-4 text-zinc-500 group-hover:text-lumi-blue transition-colors" />
            <span className="font-bold tracking-wide">Centro de Control</span>
          </Link>
          
          <Link href="/admin/campanas" className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-lumi-violet/10 border border-transparent hover:border-lumi-violet/15 rounded-lg transition-all group">
            <DollarSign className="w-4 h-4 text-zinc-500 group-hover:text-lumi-blue transition-colors" />
            <span className="font-bold tracking-wide">Auditoría Financiera</span>
          </Link>

          <Link href="/admin/pantallas" className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-lumi-violet/10 border border-transparent hover:border-lumi-violet/15 rounded-lg transition-all group">
            <Monitor className="w-4 h-4 text-zinc-500 group-hover:text-lumi-blue transition-colors" />
            <span className="font-bold tracking-wide">Red de Nodos (Hosts)</span>
          </Link>

          <Link href="/admin/usuarios" className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-lumi-violet/10 border border-transparent hover:border-lumi-violet/15 rounded-lg transition-all group">
            <Users className="w-4 h-4 text-zinc-500 group-hover:text-lumi-blue transition-colors" />
            <span className="font-bold tracking-wide">Directorio de Usuarios</span>
          </Link>

          <div className="mt-8 mb-4 px-4 pt-4 border-t border-white/[0.08]">
             <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-[2px]">Atención & Soporte</p>
          </div>

          <Link href="/admin/soporte" className="flex items-center justify-between px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-lumi-violet/10 border border-transparent hover:border-lumi-violet/15 rounded-lg transition-all group">
            <div className="flex items-center gap-3">
               <ShieldAlert className="w-4 h-4 text-zinc-500 group-hover:text-lumi-blue transition-colors" />
               <span className="font-bold tracking-wide">Tickets de Sistema</span>
            </div>
            {pendingTickets && pendingTickets > 0 ? (
               <span className="bg-lumi-violet text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(124,60,255,0.5)] animate-pulse">
                 {pendingTickets}
               </span>
            ) : null}
          </Link>

          <AdminContactNavLink initialUnreadCount={unreadContactMessages || 0} />

        </nav>
        
        <div className="p-6 border-t border-white/[0.08] relative z-10 bg-black/20">
           <form action="/login" method="POST" className="w-full">
              <button className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-white/10 text-xs text-zinc-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all uppercase tracking-widest font-bold">
                 <LogOut className="w-3 h-3" />
                 Cerrar Sesión Admin
              </button>
           </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />
        <div className="p-4 sm:p-10 relative z-10">
          {children}
        </div>
      </main>
    </div>
  )
}
