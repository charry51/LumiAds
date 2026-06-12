import { createAdminClient } from '@/lib/supabase/server';
import { Mail, Clock } from 'lucide-react';
import MessageDetail from './MessageDetail';
import DeleteMessageButton from './DeleteMessageButton';

export const dynamic = 'force-dynamic';

export default async function AdminMessagesPage() {
  try {
    const supabase = await createAdminClient();

    const { data: messages, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    console.log(`[AdminMessages] Cargados ${messages?.length || 0} mensajes. Error:`, error);

    if (error) {
      console.error('Error fetching messages from Supabase:', error);
      return (
        <div className="p-8 text-center bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-500 uppercase font-mono text-xs tracking-widest">Error cargando mensajes</p>
          <p className="text-[10px] text-zinc-500 mt-2">{error.message}</p>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading text-white uppercase tracking-tighter">Buzón de Contacto</h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono mt-1">Gestiona las consultas de preventa y soporte</p>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <div className="px-4 py-2 bg-[#0E1426] border border-white/[0.08] rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[10px] font-bold uppercase text-zinc-400">Total: {messages?.length || 0}</span>
            </div>
            <span className="text-[9px] font-mono text-zinc-600 uppercase">
              DB: {process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] || 'Desconocido'}
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {messages && messages.length > 0 ? (
            messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`cyber-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300 ${
                  msg.status === 'unread' ? 'border-primary/30 bg-primary/5 shadow-[0_0_20px_rgba(124,60,255,0.05)]' : 'border-white/[0.08] bg-[#0E1426]/40'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-tighter ${
                      msg.status === 'unread' ? 'bg-primary text-black' : 
                      msg.status === 'read' ? 'bg-zinc-800 text-zinc-400' : 
                      'bg-green-500 text-black'
                    }`}>
                      {msg.status === 'unread' ? 'No Leído' : msg.status === 'read' ? 'Leído' : 'Respondido'}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-heading text-white uppercase truncate mb-1">{msg.subject}</h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mb-3">
                    <span className="font-bold text-zinc-200">{msg.name}</span>
                    <span className="text-zinc-600">•</span>
                    <span className="font-mono">{msg.email}</span>
                  </div>
                  
                  <p className="text-sm text-zinc-500 line-clamp-1 italic">
                    "{msg.message}"
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <MessageDetail message={msg} />
                  <DeleteMessageButton id={msg.id} />
                </div>
              </div>
            ))
          ) : (
            <div className="py-24 text-center cyber-card border-dashed opacity-50">
               <Mail className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
               <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold">No hay mensajes pendientes</p>
            </div>
          )}
        </div>
      </div>
    );
  } catch (err: unknown) {
    console.error('Critical build/render error in AdminMessagesPage:', err);
    return (
      <div className="p-8 text-center bg-zinc-900 border border-zinc-800 rounded-xl">
        <p className="text-zinc-400 uppercase font-mono text-[10px] tracking-widest">Error crítico de renderizado</p>
        <p className="text-xs text-zinc-600 mt-2">Por favor, verifica la configuración del servidor.</p>
      </div>
    );
  }
}
