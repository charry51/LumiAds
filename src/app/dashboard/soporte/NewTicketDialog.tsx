'use client'

import * as React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { createSupportTicket } from '@/app/actions/support'
import { toast } from 'sonner'
import { LifeBuoy, Loader2 } from 'lucide-react'

const ticketCategories = [
  {
    value: 'Problema con la pantalla / Interfaz visual',
    description: 'Errores de visualización, bloqueos o distorsiones en la interfaz.',
  },
  {
    value: 'Fallo en la aplicación / Error de carga',
    description: 'Caídas de la app, errores de carga o contenido que no aparece.',
  },
  {
    value: 'Problema de cuenta / Inicio de sesión',
    description: 'Problemas para entrar, restablecer contraseña o permisos de usuario.',
  },
  {
    value: 'Otro problema (Especificar)',
    description: 'Cualquier otra incidencia que necesites comunicar al soporte.',
  },
]

export function NewTicketDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ticketCategory, setTicketCategory] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const asunto = (formData.get('asunto') as string)?.trim()
    const mensaje = (formData.get('mensaje') as string)?.trim()

    if (!ticketCategory || !asunto || !mensaje) {
      toast.error('Selecciona categoría, asunto y descripción antes de enviar.')
      return
    }

    setLoading(true)
    formData.set('categoria', ticketCategory)

    const payload = {
      categoria: ticketCategory,
      asunto,
      mensaje,
    }
    console.log('Enviar ticket:', payload)

    try {
      const res = await createSupportTicket(formData)
      if (res?.success) {
        toast.success('Ticket creado correctamente. El soporte te responderá pronto.')
        setOpen(false)
        setTicketCategory('')
        e.currentTarget.reset()
      } else {
        toast.error(res?.error || 'No se pudo crear el ticket. Intenta de nuevo.')
      }
    } catch (error: any) {
      console.error('Error al enviar ticket:', error)
      toast.error('Error al enviar ticket. Revisa la consola.')
    } finally {
      setLoading(false)
    }
  }

  const isSubmitDisabled = loading || !ticketCategory

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button className="bg-[#7C3CFF] text-black hover:bg-[#7C3CFF]/90 font-black uppercase tracking-widest text-[10px] gap-2 px-6 h-12 shadow-[0_0_20px_rgba(124,60,255,0.2)] transition-all active:scale-95">
          <LifeBuoy className="w-4 h-4" /> Nuevo Ticket de Soporte
        </Button>
      } />
      <DialogContent className="bg-zinc-950 border-zinc-900 text-white sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="text-[#7C3CFF] font-heading font-black uppercase tracking-[0.2em] text-sm flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#7C3CFF] animate-pulse" />
            Abrir Nuevo Ticket
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          <div className="space-y-3">
            <Label className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Selecciona la categoría *</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {ticketCategories.map((category) => {
                const active = ticketCategory === category.value
                return (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => setTicketCategory(category.value)}
                    className={`rounded-2xl border px-4 py-4 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-[#7C3CFF] ${
                      active
                        ? 'border-[#7C3CFF] bg-[#7C3CFF]/10 text-white'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-[#7C3CFF] hover:bg-zinc-900/80'
                    }`}
                  >
                    <span className="block font-semibold">{category.value}</span>
                    <span className="text-[11px] text-zinc-500">{category.description}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Asunto *</Label>
            <Input
              name="asunto"
              placeholder="Ej: No puedo acceder a mi cuenta"
              className="bg-zinc-900 border-zinc-800 h-11 text-sm focus-visible:ring-[#7C3CFF]"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Descripción detallada *</Label>
              <span className="text-[9px] text-zinc-500 uppercase tracking-[0.24em]">Mínimo 10 caracteres</span>
            </div>
            <Textarea
              name="mensaje"
              placeholder="Describe qué sucede, cuándo aparece el problema y qué has intentado..."
              className="bg-zinc-900 border-zinc-800 min-h-[140px] text-sm leading-relaxed focus-visible:ring-[#7C3CFF]"
              required
              minLength={10}
            />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] text-zinc-500">
              {ticketCategory ? `Categoría seleccionada: ${ticketCategory}` : 'Selecciona una categoría para activar el envío.'}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="text-[10px] uppercase font-bold text-zinc-500 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitDisabled}
                className="bg-[#7C3CFF] text-black hover:bg-[#7C3CFF]/90 font-black uppercase tracking-widest text-[10px] px-6 h-11 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> Enviando...
                  </span>
                ) : (
                  'Enviar Ticket'
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}



