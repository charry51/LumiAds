'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Eye } from 'lucide-react'

export function CampaignPreview({ url, nombre }: { url: string, nombre: string }) {
  const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(url)

  return (
    <Dialog>
      <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-zinc-800 bg-background shadow-sm hover:bg-zinc-800 hover:text-accent-foreground h-9 px-3 gap-2">
        <Eye className="w-4 h-4" /> Previsualizar anuncio
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-zinc-950 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Previsualización: {nombre}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 flex items-center justify-center bg-black rounded-lg overflow-hidden aspect-video">
          {isImage ? (
            <img src={url} alt={nombre} className="max-w-full max-h-full object-contain" />
          ) : (
            <video src={url} controls autoPlay className="max-w-full max-h-full" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
