'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function WithdrawButton({ isConfigured }: { isConfigured: boolean }) {
  const [loading, setLoading] = useState(false)

  const handleWithdraw = async () => {
    setLoading(true)
    try {
      if (!isConfigured) {
         // Not configured, redirect to Stripe Onboarding
         const res = await fetch('/api/stripe/connect', { method: 'POST' })
         if (!res.ok) throw new Error(await res.text())
         const data = await res.json()
         if (data.url) window.location.href = data.url
         return
      }

      // Configured, request payout
      const res = await fetch('/api/stripe/payout', { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      
      toast.success("Pago en curso. Los fondos llegarán pronto a tu cuenta bancaria.")
      setTimeout(() => window.location.reload(), 2000)
    } catch (error: any) {
      toast.error(error.message || "Error procesando el retiro.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleWithdraw}
      disabled={loading}
      className="w-full mt-3 h-8 bg-violet-600 hover:bg-white text-black text-[9px] uppercase font-black tracking-widest transition-colors relative z-10"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isConfigured ? 'Retirar saldo' : 'Configurar Cuenta Bancaria')}
    </Button>
  )
}
