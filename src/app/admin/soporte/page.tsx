import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { 
  LifeBuoy, 
  Clock, 
  MessageSquare, 
  User, 
  ShieldAlert, 
  History,
  ArrowUpRight 
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminSupportPage() {
  const supabase = await createAdminClient()

  // Fetch all tickets with user names/emails
  const { data: tickets, error } = await supabase
    .from('soporte_tickets')
    .select('*, perfiles:user_id(email, nombre_empresa), soporte_mensajes(count)')
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="p-8 text-red-500">Error: {error.message}</div>
  }

  const pendingCount = tickets?.filter(t => t.estado === 'PENDIENTE').length || 0
  const inProgressCount = tickets?.filter(t => t.estado === 'EN_PROCESO').length || 0

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/[0.08] pb-8">
        <div>
          <h1 className="text-3xl font-heading text-white uppercase tracking-tighter italic font-black">
             Centro de Resoluciones
          </h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mt-1">
             Gestión del sistema de tickets de soporte técnico
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="px-6 py-3 bg-[#0E1426] border border-white/[0.08] rounded-xl flex items-center gap-4">
            <div className="text-center">
               <p className="text-[8px] text-zinc-500 uppercase font-mono mb-1">Pendientes</p>
               <p className="text-xl font-heading text-amber-500">{pendingCount}</p>
            </div>
            <div className="w-px h-8 bg-white/[0.08]" />
            <div className="text-center">
               <p className="text-[8px] text-zinc-500 uppercase font-mono mb-1">En Proceso</p>
               <p className="text-xl font-heading text-lumi-violet">{inProgressCount}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {tickets && tickets.length > 0 ? (
          tickets.map((ticket) => (
            <Link 
              key={ticket.id} 
              href={`/admin/soporte/${ticket.id}`}
              className="group block"
            >
              <div className={`cyber-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300 ${
                ticket.estado === 'PENDIENTE' ? 'border-amber-500/30 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.05)]' : 'bg-black/40'
              }`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-tighter ${
                      ticket.estado === 'PENDIENTE' ? 'bg-amber-500 text-black' :
                      ticket.estado === 'EN_PROCESO' ? 'bg-[#7C3CFF] text-black' :
                      ticket.estado === 'RESUELTO' ? 'bg-green-500 text-black' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>
                      {ticket.estado}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-tighter ${
                      ticket.prioridad === 'URGENTE' ? 'bg-red-600 text-white animate-pulse' :
                      ticket.prioridad === 'ALTA' ? 'bg-lumi-magenta/50 text-amber-200' :
                      'bg-zinc-800/50 text-zinc-500'
                    }`}>
                      {ticket.prioridad}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">#{ticket.id.slice(0, 5)}</span>
                  </div>
                  
                  <h3 className="text-xl font-heading text-white uppercase truncate mb-2 group-hover:text-[#7C3CFF] transition-colors">{ticket.asunto}</h3>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-300 bg-black/20 border border-white/5 px-2 py-1 rounded">
                      <User className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="font-bold">{ticket.perfiles?.nombre_empresa || 'Empresa Desconocida'}</span>
                      <span className="text-zinc-600 font-mono text-[10px]">({ticket.perfiles?.email})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-500 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(ticket.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                     <p className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest mb-1">Categoría</p>
                     <p className="text-xs text-zinc-400 font-heading italic uppercase">{ticket.categoria}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full border border-zinc-800 flex items-center justify-center group-hover:bg-[#7C3CFF]/10 group-hover:border-[#7C3CFF]/50 transition-all">
                     <ArrowUpRight className="w-5 h-5 text-zinc-500 group-hover:text-[#7C3CFF]" />
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="py-24 text-center cyber-card border-dashed opacity-50">
             <ShieldAlert className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
             <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold">No hay tickets en la cola</p>
          </div>
        )}
      </div>
    </div>
  )
}
