'use client'

import * as React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { deletePantalla } from './actions'
import { toast } from 'sonner'
import { Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sendDirectMessageToHost } from '@/app/actions/contact'

function ContactHostDialog({ email, screenName }: { email: string, screenName: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.append('email', email)
    
    const res = await sendDirectMessageToHost(formData)
    if (res.success) {
      toast.success('Mensaje oficial enviado al anfitrión')
      setOpen(false)
    } else {
      toast.error(res.error || 'Error al enviar el mensaje')
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <button className="flex items-center gap-1 text-[10px] text-[#7C3CFF] hover:text-white transition-colors bg-[#7C3CFF]/10 px-2 py-1 rounded w-fit">
          <span>✉️</span> Contactar Dueño
        </button>
      } />
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-[#7C3CFF] uppercase tracking-widest text-sm font-black">
            Mensaje al Propietario
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSend} className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <Label className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">Pantalla Afectada</Label>
            <Input disabled value={screenName} className="bg-zinc-900 border-zinc-800 text-zinc-500 text-xs h-9 cursor-not-allowed italic" />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">Asunto del Correo</Label>
            <Input name="subject" required className="bg-zinc-900 border-zinc-700 focus-visible:ring-[#7C3CFF] text-sm h-10 font-bold" defaultValue={`Luminia: Aviso sobre tu pantalla - ${screenName}`} />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">Cuerpo del Mensaje</Label>
            <Textarea name="message" required className="bg-zinc-900 border-zinc-700 min-h-[140px] focus-visible:ring-[#7C3CFF] text-sm leading-relaxed" placeholder="Escribe aquí el mensaje oficial que recibirá el anfitrión. Este correo se enviará en formato HTML con el branding de LuminAdd." />
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading} className="text-xs uppercase hover:bg-zinc-800 text-zinc-400">Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-[#7C3CFF] text-black hover:bg-[#7C3CFF]/80 text-xs uppercase font-black tracking-widest shadow-[0_0_15px_rgba(124,60,255,0.2)]">
              {loading ? 'Enviando...' : 'Enviar Correo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function PantallasTable({ initialData }: { initialData: any[] }) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta pantalla? Las analíticas antiguas seguirán existiendo referenciando su ID.')) return;
    
    setLoading(id)
    const res = await deletePantalla(id)
    if (res.success) {
      toast.success('Pantalla eliminada')
    } else {
      toast.error('Error al eliminar')
    }
    setLoading(null)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-x-auto">
      <table className="w-full min-w-[700px] text-sm text-left text-zinc-300">
        <thead className="text-xs text-zinc-400 uppercase bg-zinc-950 border-b border-zinc-800">
          <tr>
            <th className="px-6 py-4">ID</th>
            <th className="px-6 py-4">Nombre y Ciudad</th>
            <th className="px-6 py-4">Host / Propietario</th>
            <th className="px-6 py-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {initialData.length === 0 && (
            <tr><td colSpan={4} className="p-6 text-center text-zinc-500">No hay pantallas registradas. Usa el botón de Nueva Pantalla.</td></tr>
          )}
          {initialData.map(p => {
            // 1. Prioridad: Host Propietario (ingresos)
            // 2. Backup: Admin que lo registró
            // 3. Fallback: SISTEMA
            const hostProfile = p.hosts?.[0]?.perfiles
            const creatorProfile = p.creador
            
            const hostEmail = hostProfile?.email || creatorProfile?.email
            const hostName = hostProfile?.nombre_empresa || hostProfile?.email
            const creatorName = creatorProfile?.nombre_empresa || creatorProfile?.email
            
            const hostInfo = hostName 
                ? hostName 
                : (creatorName ? `REG: ${creatorName}` : 'SISTEMA')
            
            return (
              <tr key={p.id} className="hover:bg-zinc-800/50">
                <td className="px-6 py-4 font-mono text-zinc-600 text-[10px]">{p.id.slice(0, 8)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <p className="font-heading font-bold text-zinc-100 uppercase text-xs">{p.nombre}</p>
                    {p.sospechoso && (
                      <span className="bg-red-500/20 text-red-500 border border-red-500/50 px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase" title={`Resolución: ${p.resolucion}`}>
                        Sospechoso
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-tighter mt-0.5">
                    {p.ciudad} {p.tamano_pulgadas ? `• ${p.tamano_pulgadas}”` : ''} {p.es_tactil ? '• Táctil' : ''}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs text-[#7C3CFF] font-bold uppercase tracking-tight">{hostInfo}</p>
                  <p className="text-[9px] text-zinc-500 uppercase tracking-tighter mb-1">
                    {p.es_publica ? 'RED PÚBLICA' : 'RED PRIVADA'}
                  </p>
                  {hostEmail && (
                    <ContactHostDialog email={hostEmail} screenName={p.nombre} />
                  )}
                </td>
              <td className="px-6 py-4 text-right flex justify-end gap-2">
                <Link href={`/player/${p.id}`} target="_blank">
                  <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-zinc-400 hover:text-[#7C3CFF] hover:bg-zinc-800"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </Link>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                    disabled={loading === p.id}
                    onClick={() => handleDelete(p.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </td>
            </tr>
          )})}
        </tbody>
      </table>
    </div>
  )
}



