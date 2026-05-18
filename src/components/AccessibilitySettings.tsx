'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { 
  Sun, 
  Moon, 
  Type, 
  Check,
  Layout
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const FONT_SIZES = [
  { id: 'standard', label: 'Estándar', value: '16px', desc: 'Vista clásica balanceada' },
  { id: 'large', label: 'Grande', value: '18px', desc: 'Mejor legibilidad para paneles' },
  { id: 'extra', label: 'Enorme', value: '20px', desc: 'Máximo contraste y tamaño' }
]

export function AccessibilitySettings() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [fontSize, setFontSize] = useState('standard')

  useEffect(() => {
    setMounted(true)
    const savedSize = localStorage.getItem('LuminAdd-ui-scale') || 'standard'
    updateFontSize(savedSize)
  }, [])

  const updateFontSize = (sizeId: string) => {
    setFontSize(sizeId)
    localStorage.setItem('LuminAdd-ui-scale', sizeId)
    const val = FONT_SIZES.find(s => s.id === sizeId)?.value || '16px'
    document.documentElement.style.setProperty('--ui-scale', val)
  }

  if (!mounted) return (
    <div className="animate-pulse space-y-8">
        <div className="h-24 bg-zinc-900/50 rounded-xl" />
        <div className="h-48 bg-zinc-900/50 rounded-xl" />
    </div>
  )

  return (
    <div className="space-y-10 max-w-2xl">
      {/* Eliminado selector de tema: Forzando Dark Mode */}

      {/* Tamaño de Letra */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
            <Type className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-heading uppercase tracking-widest font-black">Escalado de Interfaz</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Ajusta el tamaño del texto para una lectura más cómoda sin comprometer el diseño.</p>
        
        <div className="flex flex-col gap-2">
          {FONT_SIZES.map((size) => (
            <button
              key={size.id}
              onClick={() => updateFontSize(size.id)}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                fontSize === size.id 
                  ? 'bg-zinc-900 dark:bg-zinc-900 light:bg-white border-primary light:border-blue-500 text-white dark:text-white light:text-slate-900 shadow-lg' 
                  : 'bg-zinc-900/20 dark:bg-zinc-900/20 light:bg-slate-50 border-border text-zinc-500 hover:border-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded flex items-center justify-center font-bold font-mono border ${
                    fontSize === size.id ? 'bg-primary light:bg-blue-500 text-black light:text-white border-primary light:border-blue-500' : 'bg-zinc-900 dark:bg-zinc-900 light:bg-slate-100 border-zinc-800 dark:border-zinc-800 light:border-slate-200'
                }`}>
                    {size.id === 'standard' ? 'Aa' : size.id === 'large' ? 'Ab' : 'Ac'}
                </div>
                <div className="text-left">
                    <p className="text-xs font-bold uppercase">{size.label}</p>
                    <p className="text-[10px] opacity-60 font-mono">{size.desc}</p>
                </div>
              </div>
              {fontSize === size.id && <Check className="w-5 h-5 text-primary light:text-blue-500" />}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}



