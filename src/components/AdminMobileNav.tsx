'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminMobileNav() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="md:hidden">
      {/* Top Bar */}
      <div className="bg-black border-b border-zinc-900 p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-3">
           <img src="/LogoPequeno.png" alt="LuminAdd" className="h-10 w-auto" />
           <img src="/LogoTexto.png" alt="LuminAdd" className="h-[40px] w-auto" />
           <span className="text-[8px] text-[#7C3CFF] font-black uppercase tracking-[0.2em] border-l border-zinc-800 pl-2 ml-1">Admin</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="text-zinc-400">
          {isOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Overlay Menu */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/95 z-40 pt-20 px-6 animate-in fade-in duration-200">
          <nav className="flex flex-col gap-4">
            <Link 
              href="/admin" 
              onClick={() => setIsOpen(false)}
              className="text-2xl font-bold py-4 border-b border-zinc-800 text-zinc-300 hover:text-primary"
            >
              Resumen Global
            </Link>
            <Link 
              href="/admin/campanas" 
              onClick={() => setIsOpen(false)}
              className="text-2xl font-bold py-4 border-b border-zinc-800 text-zinc-300 hover:text-primary"
            >
              Gestión de Campañas
            </Link>
            <Link 
              href="/admin/pantallas" 
              onClick={() => setIsOpen(false)}
              className="text-2xl font-bold py-4 border-b border-zinc-800 text-zinc-300 hover:text-primary"
            >
              Red de Pantallas
            </Link>
            <Link 
              href="/admin/soporte" 
              onClick={() => setIsOpen(false)}
              className="text-2xl font-bold py-4 border-b border-zinc-800 text-[#7C3CFF] hover:text-[#7C3CFF]/80"
            >
              Soporte Técnico
            </Link>
            <Link 
              href="/admin/mensajes" 
              onClick={() => setIsOpen(false)}
              className="text-2xl font-bold py-4 border-b border-zinc-800 text-zinc-300 hover:text-primary"
            >
              Mensajes
            </Link>
            <Link 
              href="/dashboard" 
              onClick={() => setIsOpen(false)}
              className="mt-8 text-lg font-medium text-zinc-500 hover:text-white"
            >
              ← Volver a Cliente
            </Link>
          </nav>
        </div>
      )}
    </div>
  )
}



