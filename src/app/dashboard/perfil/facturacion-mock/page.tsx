'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  CreditCard, 
  FileText, 
  Calendar, 
  Download, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'

const mockInvoices = [
  { id: 'INV-2026-001', date: '01/05/2026', amount: '149,00 €', status: 'Pagada', plan: 'Presencia Pro' },
  { id: 'INV-2026-002', date: '01/04/2026', amount: '149,00 €', status: 'Pagada', plan: 'Presencia Pro' },
  { id: 'INV-2026-003', date: '01/03/2026', amount: '149,00 €', status: 'Pagada', plan: 'Presencia Pro' },
]

export default function FacturacionMockPage() {
  return (
    <div className="p-8 min-h-screen bg-background text-foreground font-sans">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/dashboard/perfil">
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-white group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Volver a Mi Perfil
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl font-heading font-black uppercase tracking-tighter mb-2 text-gradient-ui">
          Portal de Facturación
        </h1>

        {/* Sandbox Warning */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20 mb-10">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
          <div>
            <p className="text-xs font-bold text-yellow-500 uppercase">Modo Sandbox</p>
            <p className="text-[11px] text-zinc-400">
              Estás visualizando un portal de facturación simulado. Los datos son de demostración. Conecta Stripe en producción para activar el portal real.
            </p>
          </div>
        </div>

        {/* Método de Pago */}
        <div className="cyber-card p-6 border-white/5 mb-6">
          <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            Método de Pago
          </h2>
          <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 rounded-md bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center text-white text-[9px] font-black">
                VISA
              </div>
              <div>
                <p className="text-sm text-white font-mono">•••• •••• •••• 4242</p>
                <p className="text-[10px] text-zinc-500">Expira 12/2028</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="text-[10px] uppercase tracking-wider border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500">
              Actualizar
            </Button>
          </div>
        </div>

        {/* Suscripción Actual */}
        <div className="cyber-card p-6 border-white/5 mb-6">
          <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Suscripción Actual
          </h2>
          <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <div>
              <p className="text-lg font-heading font-bold text-white uppercase">Plan Presencia Pro</p>
              <p className="text-[10px] text-zinc-500 mt-1">Renovación automática: 01/06/2026</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-mono font-bold text-white">149€<span className="text-[10px] text-zinc-500 font-normal">/mes</span></p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-bold border border-emerald-500/20 uppercase mt-1">
                <CheckCircle className="w-3 h-3" /> Activa
              </span>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Link href="/dashboard/planes" className="flex-1">
              <Button variant="outline" className="w-full text-[10px] uppercase tracking-wider border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500">
                Cambiar Plan
              </Button>
            </Link>
            <Button variant="outline" className="flex-1 text-[10px] uppercase tracking-wider border-red-900/30 text-red-400 hover:text-red-300 hover:border-red-800/50 hover:bg-red-950/20">
              Cancelar Suscripción
            </Button>
          </div>
        </div>

        {/* Historial de Facturas */}
        <div className="cyber-card p-6 border-white/5">
          <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Historial de Facturas
          </h2>
          <div className="space-y-3">
            {mockInvoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-white font-mono font-bold">{invoice.id}</p>
                    <p className="text-[10px] text-zinc-500">{invoice.plan} · {invoice.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-white font-mono font-bold">{invoice.amount}</p>
                    <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400 font-bold uppercase">
                      <CheckCircle className="w-3 h-3" /> {invoice.status}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
