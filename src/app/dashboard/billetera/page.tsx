'use client'

import { useState } from 'react'
import { simularRecarga } from './actions'
import { Button } from '@/components/ui/button'
import { Wallet, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function BilleteraPage() {
  const [amount, setAmount] = useState<string>('50')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleRecharge = async () => {
    const value = parseFloat(amount)
    if (isNaN(value) || value <= 0) return alert('Importe inválido')

    setLoading(true)
    const res = await simularRecarga(value)
    if (res.success) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } else {
      alert('Error: ' + res.error)
    }
    setLoading(false)
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
          <p className="text-xs text-muted-foreground font-mono uppercase mb-8">Pay-as-you-go. Añade fondos para lanzar campañas.</p>

          <div className="mb-6">
            <label className="block text-[10px] uppercase font-bold tracking-widest text-muted-foreground text-left mb-2">Importe a Recargar (€)</label>
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
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simular Pago Test'}
          </Button>

          {success && (
            <p className="mt-4 text-green-500 text-[10px] uppercase font-bold tracking-widest">¡Saldo añadido exitosamente!</p>
          )}
        </div>
      </div>
    </div>
  )
}
