'use client'

import * as React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { replyToSupportTicket } from '@/app/actions/support'
import { toast } from 'sonner'
import { Send, Loader2, Paperclip, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function SupportReplyForm({ ticketId, esAdmin = false }: { ticketId: string, esAdmin?: boolean }) {
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [archivoUrl, setArchivoUrl] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `tickets/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('support-attachments')
      .upload(filePath, file)

    if (uploadError) {
      toast.error('Error al subir archivo')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('support-attachments')
      .getPublicUrl(filePath)

    setArchivoUrl(publicUrl)
    setUploading(false)
    toast.success('Archivo preparado')
  }

  const handleSend = async () => {
    if (!mensaje.trim()) return
    setLoading(true)

    const res = await replyToSupportTicket(ticketId, mensaje, archivoUrl, esAdmin)
    if (res.success) {
      setMensaje('')
      setArchivoUrl(null)
      toast.success('Mensaje enviado')
      router.refresh()
    } else {
      toast.error(res.error || 'Error al enviar respuesta')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="relative group">
        <Textarea 
          placeholder="Escribe tu respuesta aquí..."
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          className="bg-zinc-900/50 border-zinc-800 min-h-[100px] text-sm focus-visible:ring-[#7C3CFF] transition-all resize-none"
        />
        
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
           <input 
              type="file" 
              id="reply-photo" 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileUpload} 
           />
           <label 
              htmlFor="reply-photo"
              className={`p-2 rounded-lg cursor-pointer hover:bg-zinc-800 transition-all ${archivoUrl ? 'text-[#7C3CFF] bg-[#7C3CFF]/10' : 'text-zinc-500'}`}
           >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
           </label>

           <Button 
                onClick={handleSend}
                disabled={loading || !mensaje.trim()} 
                className="bg-[#7C3CFF] text-black hover:bg-[#7C3CFF]/90 h-9 px-4 font-black uppercase tracking-widest text-[9px]"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-3 h-3 mr-2" /> Enviar</>}
            </Button>
        </div>
      </div>

      {archivoUrl && (
        <div className="flex items-center justify-between p-2 bg-[#7C3CFF]/5 border border-[#7C3CFF]/20 rounded-lg">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded overflow-hidden border border-[#7C3CFF]/30">
                 <img src={archivoUrl} className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] text-zinc-400 font-mono italic">Imagen adjunta lista para enviar</span>
           </div>
           <button onClick={() => setArchivoUrl(null)} className="text-[9px] text-red-500 uppercase font-black hover:underline px-2">Quitar</button>
        </div>
      )}
    </div>
  )
}
