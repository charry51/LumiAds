'use client'

import { useState, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Wallet, Loader2, ArrowLeft, DollarSign, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function BilleteraForm() {
  const [amount, setAmount] = useState<string>('100')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')

  const presets = ['20', '50', '100', '250', '500', '1000']

  const handleRecharge = async () => {
    const value = parseFloat(amount)
    if (isNaN(value) || value <= 0) return alert('Importe inválido')

    setLoading(true)
    try {
      const res = await fetch('/api/stripe/billetera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: value, returnTo })
      })
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText)
      }
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      alert('Error: ' + error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#04060F] text-zinc-100 p-4 sm:p-8 flex flex-col items-center justify-center font-sans selection:bg-[#2BC8FF]/30 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#7C3CFF]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-[#2BC8FF]/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <Link href={returnTo || "/dashboard"} className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-[3px] font-black flex items-center gap-2 mb-8 transition-colors group">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> 
          {returnTo ? "Volver" : "Volver al Dashboard"}
        </Link>

        <div className="bg-[#04060F]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.02] before:to-transparent before:pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#7C3CFF] via-[#C94BFF] to-[#2BC8FF]" />

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7C3CFF]/20 to-[#2BC8FF]/20 border border-white/10 flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(43,200,255,0.15)]">
             <Wallet className="w-8 h-8 text-[#2BC8FF]" />
          </div>

          <h1 className="text-2xl font-black uppercase tracking-tight text-white text-center">Recargar Billetera</h1>
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest text-center mt-2 mb-8">
             Añade fondos sin límites para tus campañas DOOH programáticas.
          </p>

          {/* Preset buttons */}
          <div className="grid grid-cols-3 gap-2.5 mb-6">
            {presets.map((preset) => {
              const isActive = amount === preset
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={`
                    py-3 rounded-xl font-mono text-sm font-black transition-all duration-300 border
                    ${isActive 
                      ? 'bg-[#7C3CFF]/20 border-[#2BC8FF]/50 text-white shadow-[0_0_15px_rgba(124,60,255,0.3)]' 
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:border-white/20 hover:text-zinc-200'
                    }
                  `}
                >
                  {preset}€
                </button>
              )
            })}
          </div>

          <div className="mb-8 space-y-2">
            <label className="block text-[9px] uppercase font-black tracking-widest text-zinc-400 text-left">
               Importe Personalizado (€)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-zinc-500 font-mono">
                €
              </span>
              <input 
                type="number" 
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-9 text-2xl font-mono font-black text-white focus:outline-none focus:border-[#2BC8FF]/50 hover:bg-white/10 transition-colors"
                placeholder="0.00"
              />
            </div>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest text-left mt-1">
               Puedes introducir cualquier importe de recarga que desees.
            </p>
          </div>

          <Button 
            onClick={handleRecharge} 
            disabled={loading || !amount || parseFloat(amount) <= 0}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#7C3CFF] via-[#C94BFF] to-[#2BC8FF] text-white font-black uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(124,60,255,0.3)] hover:shadow-[0_0_30px_rgba(43,200,255,0.5)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none border-none"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirmar e ir al Pago'}
          </Button>

          {success && (
            <div className="mt-6 flex items-center justify-center gap-2 text-emerald-400 animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[10px] uppercase font-black tracking-widest">¡Saldo añadido con éxito!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BilleteraPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#04060F] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#2BC8FF]" /></div>}>
      <BilleteraForm />
    </Suspense>
  )
}
