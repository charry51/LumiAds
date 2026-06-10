'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Loader2, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { reactivateCampaign } from '@/app/actions/reactivateCampaign'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export function ReactivarCampaignButton({ campaignId, currentBudget }: { campaignId: string, currentBudget: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState<string>('50')

  const handleReactivate = async () => {
    const value = parseFloat(amount)
    if (isNaN(value) || value <= 0) {
      toast.error('Por favor ingresa un monto válido mayor a 0.')
      return
    }

    setLoading(true)
    const result = await reactivateCampaign(campaignId, value)
    
    if (result.type === 'error') {
      toast.error(result.message)
      setLoading(false)
    } else {
      toast.success(result.message)
      setIsOpen(false)
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger 
        render={
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white text-[9px] uppercase font-black tracking-widest px-3 h-7 rounded shadow-[0_0_10px_rgba(249,115,22,0.2)] border-none flex items-center gap-1">
             <Plus className="w-3 h-3" /> Reactivar
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px] bg-zinc-950 border border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white font-black uppercase tracking-widest">
            <Wallet className="w-5 h-5 text-orange-500" />
            Reactivar Campaña
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs mt-2">
            Tu campaña se ha quedado sin presupuesto y se ha detenido. Añade más presupuesto desde tu billetera para que vuelva a emitirse.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-2 block">
            Añadir Inversión (€)
          </label>
          <Input 
            type="number"
            min={1}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-zinc-900 border-zinc-800 text-white font-mono text-xl focus:border-orange-500"
            placeholder="0.00"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} className="border-zinc-800 bg-transparent text-zinc-400 hover:text-white">
            Cancelar
          </Button>
          <Button 
            onClick={handleReactivate} 
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold uppercase tracking-widest"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Pagar {amount ? `${parseFloat(amount).toFixed(2)}€` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
