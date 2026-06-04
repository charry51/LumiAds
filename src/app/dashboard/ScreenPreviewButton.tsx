'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Monitor, X, Info } from 'lucide-react'

interface ScreenPreviewButtonProps {
  screenId: string
  screenName: string
  accentColor: string
}

export function ScreenPreviewButton({ screenId, screenName, accentColor }: ScreenPreviewButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="h-7 text-[9px] uppercase font-bold transition-all hover:bg-white/5"
        style={{ 
           borderColor: `${accentColor}55`, 
           color: accentColor 
        }}
        onClick={() => setIsOpen(true)}
      >
        <Monitor className="w-3.5 h-3.5 mr-1" />
        Previsualizar pantalla
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-zinc-950 rounded-2xl border border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
            
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <div>
                  <h3 className="text-sm font-heading font-bold uppercase tracking-wider text-white">
                    {screenName}
                  </h3>
                  <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
                    ID del Canal: {screenId}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                aria-label="Cerrar previsualización"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content (Monitor Frame) */}
            <div className="p-8 bg-zinc-950 flex flex-col items-center justify-center">
              {/* Physical Screen Mock Frame */}
              <div className="w-full max-w-3xl rounded-xl border-[12px] border-zinc-900 bg-zinc-900 shadow-2xl relative aspect-video overflow-hidden">
                <iframe 
                  src={`/player/${screenId}`} 
                  className="w-full h-full bg-black border-0"
                  allow="autoplay; encrypted-media"
                />
              </div>
              
              {/* Stand/Foot of the TV screen */}
              <div className="w-24 h-4 bg-zinc-900 rounded-t-lg shadow-md -mt-0.5" />
              <div className="w-40 h-2 bg-zinc-800 rounded-lg shadow-lg" />
            </div>

            {/* Footer Bar */}
            <div className="p-3 border-t border-zinc-800 bg-zinc-900/30 flex justify-between items-center px-6">
              <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-mono uppercase">
                <Info className="w-3.5 h-3.5 text-primary" />
                <span>Simulador de pantalla digital LumiAds.</span>
              </div>
              <span className="text-[9px] text-zinc-400 font-mono bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
                RESOLUCIÓN: 1920 x 1080 (ESCALADO)
              </span>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
