import { createClient } from '@/lib/supabase/server'
import { NewTicketDialog } from './NewTicketDialog'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { 
  LifeBuoy, 
  ArrowLeft,
  Clock,
  CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SoporteTicketList } from '@/components/SoporteTicketList'

export const dynamic = 'force-dynamic'

export default async function SoportePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: tickets } = await supabase
    .from('soporte_tickets')
    .select('*, soporte_mensajes(count)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 sm:p-8 font-sans">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-zinc-900 pb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="icon" className="rounded-full border-zinc-800 bg-zinc-900/50 hover:bg-[#7C3CFF]/10 hover:border-[#7C3CFF]/30 h-10 w-10 text-zinc-400 hover:text-[#7C3CFF] transition-all">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#7C3CFF]/10 rounded-lg">
                <LifeBuoy className="w-6 h-6 text-[#7C3CFF]" />
              </div>
              <h1 className="text-3xl font-heading uppercase font-black italic text-transparent bg-clip-text bg-gradient-to-br from-[#7C3CFF] to-[#00a1ff] pr-4 pb-2">
                Soporte Técnico
              </h1>
            </div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-mono pl-1">
              Gestión de incidencias y consultas directas con el equipo LuminAdd
            </p>
          </div>
        </div>

        <NewTicketDialog />
      </header>

      <SoporteTicketList tickets={tickets || []} />

      <footer className="mt-12 pt-8 border-t border-zinc-900 grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="p-4 bg-zinc-900/30 rounded-xl border border-zinc-800 flex items-center gap-4">
            <Clock className="w-5 h-5 text-[#7C3CFF] opacity-50" />
            <div>
               <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Tiempo de respuesta</p>
               <p className="text-xs text-zinc-300 font-heading tracking-tight uppercase">Menos de 24 horas</p>
            </div>
         </div>
         <div className="p-4 bg-zinc-900/30 rounded-xl border border-zinc-800 flex items-center gap-4">
            <CheckCircle2 className="w-5 h-5 text-green-500 opacity-50" />
            <div>
               <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Estado del Sistema</p>
               <p className="text-xs text-zinc-300 font-heading tracking-tight uppercase text-green-400">Totalmente Operativo</p>
            </div>
         </div>
      </footer>
    </div>
  )
}



