'use client'

import { Target, Monitor, Lock, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { requestUserRole } from './actions'
import { useState } from 'react'

export function RoleManager({ 
  esAnuncianteInitial, 
  esHostInitial 
}: { 
  esAnuncianteInitial: boolean; 
  esHostInitial: boolean; 
}) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleRequest = async (role: string, isCurrentlyActive: boolean) => {
    setLoading(role)
    const requestType = isCurrentlyActive ? 'Baja' : 'Alta'
    const res = await requestUserRole(role, requestType)
    
    if (res.success) {
      toast.success(`Solicitud enviada al administrador para gestionar el rol de ${role}. Te notificaremos cuando se apruebe.`)
    } else {
      toast.error(res.error || 'Hubo un error al enviar la solicitud.')
    }
    setLoading(null)
  }

  return (
    <div className="flex flex-col gap-4">
        {/* Anunciante Role */}
        <div className={`p-4 rounded-xl border transition-all duration-300 flex items-center justify-between ${esAnuncianteInitial ? 'bg-lumi-blue/10 border-lumi-blue/30 shadow-[0_0_15px_rgba(43,200,255,0.1)]' : 'bg-black/20 border-white/5'}`}>
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${esAnuncianteInitial ? 'bg-[#2BC8FF] text-black shadow-[0_0_10px_#2BC8FF]' : 'bg-zinc-800 text-zinc-500'}`}>
                    <Target className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      Cuenta de Anunciante
                      {esAnuncianteInitial ? (
                        <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1"><CheckCircle2 className="w-2 h-2" /> ACTIVA</span>
                      ) : (
                        <span className="text-[8px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded border border-zinc-700 flex items-center gap-1"><Lock className="w-2 h-2" /> BLOQUEADA</span>
                      )}
                    </h4>
                    <p className="text-[10px] text-zinc-400 mt-1">Lanza campañas y gestiona presupuestos en el Marketplace.</p>
                </div>
            </div>
            
            <Button 
               variant="outline"
               onClick={() => handleRequest('Anunciante', esAnuncianteInitial)}
               disabled={loading === 'Anunciante'}
               className={`text-[9px] uppercase font-bold tracking-widest h-8 ${esAnuncianteInitial ? 'border-red-900/50 text-red-500 bg-red-950/20 hover:bg-red-900/40 hover:text-red-400' : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white'}`}
            >
               {loading === 'Anunciante' ? <Loader2 className="w-3 h-3 animate-spin" /> : (esAnuncianteInitial ? 'Solicitar Baja' : 'Solicitar Acceso')}
            </Button>
        </div>

        {/* Host Role */}
        <div className={`p-4 rounded-xl border transition-all duration-300 flex items-center justify-between ${esHostInitial ? 'bg-[#7C3CFF]/10 border-[#7C3CFF]/30 shadow-[0_0_15px_rgba(124,60,255,0.1)]' : 'bg-black/20 border-white/5'}`}>
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${esHostInitial ? 'bg-[#7C3CFF] text-black shadow-[0_0_10px_#7C3CFF]' : 'bg-zinc-800 text-zinc-500'}`}>
                    <Monitor className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      Cuenta de Host (Dueño)
                      {esHostInitial ? (
                        <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1"><CheckCircle2 className="w-2 h-2" /> ACTIVA</span>
                      ) : (
                        <span className="text-[8px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded border border-zinc-700 flex items-center gap-1"><Lock className="w-2 h-2" /> BLOQUEADA</span>
                      )}
                    </h4>
                    <p className="text-[10px] text-zinc-400 mt-1">Monetiza tus pantallas y gestiona tu CMS privado (SaaS).</p>
                </div>
            </div>
            
            <Button 
               variant="outline"
               onClick={() => handleRequest('Host', esHostInitial)}
               disabled={loading === 'Host'}
               className={`text-[9px] uppercase font-bold tracking-widest h-8 ${esHostInitial ? 'border-red-900/50 text-red-500 bg-red-950/20 hover:bg-red-900/40 hover:text-red-400' : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white'}`}
            >
               {loading === 'Host' ? <Loader2 className="w-3 h-3 animate-spin" /> : (esHostInitial ? 'Solicitar Baja' : 'Solicitar Acceso')}
            </Button>
        </div>

        <p className="text-[9px] text-zinc-500 italic mt-2 text-center uppercase">
            Los roles están gestionados por el administrador. Solicita el alta para activar nuevas funciones.
        </p>
    </div>
  )
}
