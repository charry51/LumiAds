import { createClient, createAdminClient } from '@/lib/supabase/server'
import { UserRoleToggle } from './UserRoleToggle'
import { UserPlanToggle } from './UserPlanToggle'
import { DeleteUserButton } from './DeleteUserButton'
import { ImpersonateUserButton } from './ImpersonateUserButton'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Users, Search, Filter } from 'lucide-react'

export default async function UserManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const supabase = await createClient()
  const adminClient = await createAdminClient()
  const resolvedSearchParams = await searchParams;
  const searchQuery = resolvedSearchParams?.q || ''

  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // Construir query para buscar usuarios usando el cliente admin para saltar RLS
  let query = adminClient
    .from('perfiles')
    .select('*, planes(nombre)')
    .order('created_at', { ascending: false })

  if (searchQuery) {
    query = query.or(`nombre.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,nombre_empresa.ilike.%${searchQuery}%`)
  }

  const { data: usuarios } = await query

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-500">
            Gestión de Usuarios
          </h1>
          <p className="text-zinc-500 flex items-center gap-2 mt-1">
            <Users className="h-4 w-4 text-indigo-500" />
            Control de accesos y roles de la plataforma
          </p>
        </div>
      </header>

      <Card className="bg-zinc-900/50 border-zinc-800/50">
        <CardHeader className="pb-0">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
             <form className="relative flex-1 max-w-sm" method="GET">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input 
                  type="text" 
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Buscar por nombre o correo..." 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-[#7C3CFF] transition-all"
                />
             </form>
             <div className="flex gap-2">
                <button className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white transition-colors">
                   <Filter className="h-3.5 w-3.5" /> Filtrar por Rol
                </button>
             </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-xl border border-zinc-800 overflow-x-auto bg-black/20">
            <table className="w-full min-w-[800px] whitespace-nowrap text-sm text-left">
              <thead className="bg-zinc-950/50 text-zinc-400 font-medium">
                <tr>
                  <th className="px-6 py-4">Usuario / Empresa</th>
                  <th className="px-6 py-4">Rol Actual</th>
                  <th className="px-6 py-4">Cambiar Plan</th>
                  <th className="px-6 py-4">Asignar Permisos</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {usuarios && usuarios.length > 0 ? usuarios.map(user => (
                  <tr key={user.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-200">
                        {user.nombre || user.nombre_empresa || 'Cliente Sin Nombre'}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {user.email || 'Sin email'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                         user.rol === 'superadmin' ? 'bg-[#7C3CFF]/10 text-[#7C3CFF]' : 
                         user.rol === 'gestor_local' ? 'bg-purple-500/10 text-purple-400' :
                         'bg-zinc-500/10 text-zinc-400'
                       }`}>
                         {user.rol === 'superadmin' ? 'Admin' :
                          user.rol === 'gestor_local' ? 'Gestor de Pantallas' :
                          user.rol === 'cliente' ? 'Anunciante' : user.rol}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <UserPlanToggle userId={user.id} currentPlanId={user.plan_id || 'basic'} userRole={user.rol} />
                    </td>
                    <td className="px-6 py-4">
                       <UserRoleToggle userId={user.id} currentRole={user.rol} />
                    </td>
                    <td className="px-6 py-4 text-right">
                       <ImpersonateUserButton 
                         userId={user.id} 
                         userName={user.nombre || user.nombre_empresa || user.email || 'Usuario'} 
                         userRole={user.rol}
                         isCurrentUser={currentUser?.id === user.id} 
                       />
                       <DeleteUserButton 
                         userId={user.id} 
                         userName={user.nombre || user.nombre_empresa || user.email || 'Usuario'} 
                         isCurrentUser={currentUser?.id === user.id} 
                       />
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">No se encontraron usuarios</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
