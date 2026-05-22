import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { logout } from '@/app/login/actions'
import { Building2, Users2, Target, BarChart, ChevronRight, Search, Briefcase, PlusCircle, Monitor } from 'lucide-react'

export default async function AgencyDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.rol !== 'comercial' && profile?.rol !== 'gestor_local' && profile?.rol !== 'superadmin') {
    redirect('/dashboard') // Fallback a su panel correspondiente
  }

  // Fetch some metrics for the agency
  const { count: totalClientes } = await supabase.from('perfiles').select('*', { count: 'exact', head: true }).in('rol', ['cliente'])
  const { count: totalPantallas } = await supabase.from('pantallas').select('*', { count: 'exact', head: true })
  
  // Mock data for Agency view (Leads, Active Campaigns, etc.)
  const leads = [
    { id: 1, name: 'TechGym Solutions', status: 'Negociando', value: '3,000€' },
    { id: 2, name: 'Burger King Local', status: 'Cerrado', value: '1,500€' },
    { id: 3, name: 'Clínica Dental Sonrisas', status: 'Primer Contacto', value: '500€' },
  ]

  return (
    <div className="min-h-screen bg-[#050B14] text-slate-300 font-sans p-4 sm:p-8 selection:bg-blue-500/30">
      
      {/* HEADER AGENCY */}
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800 pb-8 relative">
        <div className="flex items-center gap-4 relative z-10">
           <div className="w-12 h-12 bg-slate-900 border border-slate-700 rounded flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.15)]">
             <Building2 className="w-6 h-6 text-blue-400" />
           </div>
           <div>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black uppercase tracking-tighter text-white">Lumi<span className="text-blue-500">Agency</span></span>
                <span className="bg-blue-500/10 text-blue-400 text-[9px] font-black px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-widest">B2B PORTAL</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[4px]">Gestión Comercial y Operativa</p>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 justify-end w-full md:w-auto">
          <div className="relative hidden md:block">
             <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-600" />
             <input 
               type="text" 
               placeholder="Buscar cliente, campaña..." 
               className="bg-slate-900 border border-slate-800 rounded pl-9 pr-4 py-2 text-[10px] uppercase font-bold tracking-widest focus:border-blue-500 focus:outline-none text-white w-64 transition-all"
             />
          </div>

          <Link href="/dashboard/perfil">
             <Button variant="outline" className="border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 flex gap-2 items-center text-[10px] uppercase font-bold tracking-widest px-4 h-9 rounded">
                Mi Perfil
             </Button>
          </Link>
          
          <form action={logout}>
            <Button variant="outline" type="submit" className="border-slate-800 bg-slate-900 text-slate-500 hover:text-red-400 hover:bg-slate-800 text-[10px] uppercase font-bold tracking-widest px-4 h-9 rounded">Salir</Button>
          </form>
        </div>
      </header>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
         <div className="p-6 bg-slate-900/50 border border-slate-800 rounded flex items-center justify-between group hover:border-blue-500/50 transition-colors">
            <div>
               <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Cartera de Clientes</p>
               <p className="text-4xl font-black text-white font-mono">{totalClientes || 0}</p>
            </div>
            <Users2 className="w-8 h-8 text-blue-500/50 group-hover:text-blue-400 transition-colors" />
         </div>
         <div className="p-6 bg-slate-900/50 border border-slate-800 rounded flex items-center justify-between group hover:border-blue-500/50 transition-colors">
            <div>
               <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Pantallas en Red</p>
               <p className="text-4xl font-black text-white font-mono">{totalPantallas || 0}</p>
            </div>
            <Monitor className="w-8 h-8 text-blue-500/50 group-hover:text-blue-400 transition-colors" />
         </div>
         <div className="p-6 bg-slate-900/50 border border-slate-800 rounded flex items-center justify-between group hover:border-blue-500/50 transition-colors">
            <div>
               <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Pipeline Mensual</p>
               <p className="text-4xl font-black text-white font-mono">5,000€</p>
            </div>
            <BarChart className="w-8 h-8 text-blue-500/50 group-hover:text-blue-400 transition-colors" />
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* CRM Leads */}
         <div className="bg-slate-900/30 border border-slate-800 rounded overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
               <h2 className="text-[11px] uppercase tracking-widest font-black text-white flex items-center gap-2">
                 <Briefcase className="w-4 h-4 text-blue-400" /> CRM / Leads Activos
               </h2>
               <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white text-[9px] uppercase font-bold tracking-widest h-7 rounded">
                  <PlusCircle className="w-3 h-3 mr-1" /> Nuevo Lead
               </Button>
            </div>
            <div className="divide-y divide-slate-800">
               {leads.map(lead => (
                 <div key={lead.id} className="p-5 flex items-center justify-between hover:bg-slate-900/50 transition-colors cursor-pointer group">
                    <div>
                       <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{lead.name}</p>
                       <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-1">Valor Est.: {lead.value}</p>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className={`text-[9px] uppercase font-bold px-2 py-1 rounded tracking-widest ${
                         lead.status === 'Cerrado' ? 'bg-emerald-500/10 text-emerald-400' :
                         lead.status === 'Negociando' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'
                       }`}>
                         {lead.status}
                       </span>
                       <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Campañas Gestionadas */}
         <div className="bg-slate-900/30 border border-slate-800 rounded overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
               <h2 className="text-[11px] uppercase tracking-widest font-black text-white flex items-center gap-2">
                 <Target className="w-4 h-4 text-blue-400" /> Campañas de Clientes
               </h2>
               <Link href="/admin/campanas" className="text-[9px] uppercase font-bold text-blue-400 hover:text-blue-300">
                  Ver Todas →
               </Link>
            </div>
            <div className="p-12 flex flex-col items-center justify-center text-center opacity-50">
               <Target className="w-12 h-12 text-slate-700 mb-4" />
               <p className="text-[10px] uppercase tracking-[3px] font-mono text-slate-500">Selecciona un cliente para ver sus campañas activas.</p>
            </div>
         </div>
      </div>

    </div>
  )
}
