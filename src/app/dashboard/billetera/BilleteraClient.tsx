'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Wallet, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function BilleteraClient({
  initialBalance,
  paymentStatus,
}: {
  initialBalance: number
  paymentStatus?: string
}) {
  const [amount, setAmount] = useState<string>('50')
  const [loading, setLoading] = useState(false)

  const handleRecharge = async () => {
    const value = parseFloat(amount)
    if (Number.isNaN(value) || value <= 0) return alert('Importe invalido')

    setLoading(true)
    try {
      const res = await fetch('/api/stripe/billetera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: value }),
      })
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText)
      }
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error inesperado'
      alert('Error: ' + message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8 flex flex-col items-center justify-center font-sans">
      <div className="max-w-md w-full">
        <Link href="/dashboard" className="text-[10px] text-muted-foreground hover:text-primary uppercase tracking-[3px] font-bold flex items-center gap-2 mb-8">
          <ArrowLeft className="w-3 h-3" /> Volver al Dashboard
        </Link>
        <div className="cyber-card p-8 text-center bg-card shadow-2xl border-border">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
             <Wallet className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-heading uppercase tracking-widest mb-2">Recargar Billetera</h1>
          <p className="text-xs text-muted-foreground font-mono uppercase mb-6">Anade fondos para lanzar campanas.</p>

          <div className="mb-8 rounded-xl border border-border bg-background/60 p-5">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2">
              Saldo actual
            </p>
            <p className="text-4xl font-heading font-black text-primary">
              {initialBalance.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-[10px] uppercase font-bold tracking-widest text-muted-foreground text-left mb-2">Importe a recargar (EUR)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-background border border-border rounded p-3 text-xl font-heading text-foreground focus:outline-none focus:border-primary"
              placeholder="0.00"
            />
          </div>

          <Button
            onClick={handleRecharge}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest h-12 text-xs transition-all shadow-[0_0_15px_rgba(43,200,255,0.3)]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Recargar con Tarjeta'}
          </Button>

          {paymentStatus === 'success' && (
            <p className="mt-4 text-green-500 text-[10px] uppercase font-bold tracking-widest">Saldo anadido correctamente</p>
          )}
          {paymentStatus === 'canceled' && (
            <p className="mt-4 text-amber-500 text-[10px] uppercase font-bold tracking-widest">Pago cancelado</p>
          )}
          {paymentStatus === 'error' && (
            <p className="mt-4 text-red-500 text-[10px] uppercase font-bold tracking-widest">Pago aceptado, pero no se pudo confirmar el saldo. Vuelve a abrir la billetera.</p>
          )}
        </div>
      </div>
    </div>
  )
}
