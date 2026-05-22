import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft, User, ShieldCheck, Mail, Clock, ExternalLink, Tag, AlertTriangle } from 'lucide-react'
import { SupportReplyForm } from '../SupportReplyForm'
import { MarkTicketReadOnMount } from '@/components/MarkTicketReadOnMount'

export const dynamic = 'force-dynamic'

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { id } = await params
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Fetch Ticket details
  const { data: ticket, error: ticketErr } = await supabase
    .from('soporte_tickets')
    .select('*, perfiles:user_id(email, nombre_empresa)')
    .eq('id', id)
    .single()

  if (!ticket || ticketErr) notFound()

  // Seguridad: Solo el dueño o un admin pueden verlo
  const { data: profile } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
  if (ticket.user_id !== user.id && profile?.rol !== 'superadmin') {
     redirect('/dashboard')
  }

  // 2. Fetch Messages
  const { data: mensajes } = await supabase
    .from('soporte_mensajes')
    .select('*')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })

  return (
    <div className="min-h-screen bg-zinc-950 text-foreground p-4 sm:p-8 font-sans">
      <MarkTicketReadOnMount ticketId={ticket.id} />
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Breadcrumbs / Back */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-900 pb-8">
          <div className="flex flex-col gap-4">
            <Link href="/dashboard/soporte" className="flex items-center gap-2 text-zinc-500 hover:text-[#7C3CFF] transition-colors text-[10px] uppercase font-black tracking-widest group">
                 <ChevronLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> 
                 Volver al Listado
            </Link>
            <div>
              <h1 className="text-2xl font-heading text-white uppercase tracking-tighter italic">
                {ticket.asunto}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                 <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-tighter ${
                    ticket.estado === 'PENDIENTE' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                    ticket.estado === 'EN_PROCESO' ? 'bg-[#7C3CFF]/20 text-[#7C3CFF] border border-[#7C3CFF]/30' :
                    ticket.estado === 'RESUELTO' ? 'bg-green-500/20 text-green-500 border border-green-500/30' :
                    'bg-zinc-800 text-zinc-500'
                  }`}>
                    {ticket.estado}
                 </span>
                 <span className="text-[10px] text-zinc-500 font-mono">#{ticket.id.slice(0, 8)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 text-right">
             <div className="flex items-center gap-2 px-3 py-1 bg-[#7C3CFF]/10 border border-[#7C3CFF]/30 text-[#7C3CFF] rounded-full text-[9px] font-black uppercase tracking-widest">
                <Tag className="w-3 h-3" /> {ticket.categoria}
             </div>
             <div className={`flex items-center gap-2 px-3 py-1 border rounded-full text-[9px] font-black uppercase tracking-widest ${
               ticket.prioridad === 'URGENTE' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
               ticket.prioridad === 'ALTA' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
               'bg-zinc-800 border-zinc-700 text-zinc-400'
             }`}>
                <AlertTriangle className="w-3 h-3" /> {ticket.prioridad}
             </div>
          </div>
        </header>

        {/* Conversation Thread */}
        <div className="space-y-6">
          {mensajes?.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col ${msg.es_admin ? 'items-start' : 'items-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                 {msg.es_admin ? (
                   <>
                    <ShieldCheck className="w-3 h-3 text-[#7C3CFF]" />
                    <span className="text-[9px] text-[#7C3CFF] font-black uppercase tracking-widest">Soporte LuminAdd</span>
                   </>
                 ) : (
                   <>
                    <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Tu Mensaje</span>
                    <User className="w-3 h-3 text-zinc-600" />
                   </>
                 )}
              </div>

              <div className={`cyber-card max-w-[85%] md:max-w-[70%] p-4 ${
                msg.es_admin 
                  ? 'bg-zinc-900 border-zinc-800 shadow-[0_0_15px_rgba(124,60,255,0.05)]' 
                  : 'bg-zinc-800/20 border-zinc-700'
              }`}>
                <p className="text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap">
                  {msg.mensaje}
                </p>
                
                {msg.archivo_url && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-zinc-800 group relative">
                    <img src={msg.archivo_url} alt="Adjunto" className="w-full h-auto object-cover max-h-[300px]" />
                    <a 
                      href={msg.archivo_url} 
                      target="_blank" 
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                    >
                       <ExternalLink className="w-5 h-5 text-white" />
                       <span className="text-[10px] text-white font-black uppercase tracking-widest">Ver original</span>
                    </a>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-zinc-800 flex justify-between items-center text-[8px] text-zinc-600 uppercase font-mono italic">
                   <span>{new Date(msg.created_at).toLocaleDateString()}</span>
                   <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reply Zone */}
        {ticket.estado !== 'CERRADO' ? (
          <div className="mt-12 pt-12 border-t border-zinc-900">
             <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Mail className="w-4 h-4 text-[#7C3CFF] opacity-50" />
                   <h2 className="text-xs font-black uppercase tracking-widest text-[#7C3CFF]">Escribir Respuesta</h2>
                </div>
                <span className="text-[9px] text-zinc-600 uppercase font-mono italic flex items-center gap-2">
                   <Clock className="w-3 h-3" /> Tiempo est. respuesta: {ticket.prioridad === 'URGENTE' ? '2h' : '12h'}
                </span>
             </div>
             <SupportReplyForm ticketId={ticket.id} esAdmin={profile?.rol === 'superadmin'} />
          </div>
        ) : (
          <div className="mt-12 py-8 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl text-center">
             <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold font-heading italic">
                Esta incidencia ha sido marcada como cerrada. No puedes enviar más mensajes.
             </p>
             <Link href="/dashboard/soporte" className="inline-block mt-4 text-[10px] text-[#7C3CFF] uppercase font-black hover:underline tracking-widest transition-all">
                Abrir un nuevo ticket si el problema persiste
             </Link>
          </div>
        )}
      </div>
    </div>
  )
}



