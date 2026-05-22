'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Server } from 'lucide-react'
import { actualizarSaasScreen } from '@/app/actions/saas'

export function SaasControls({ 
  pantallaId, 
  esPublicaInitial, 
  precioBaseInitial, 
  suscripcionActiva 
}: { 
  pantallaId: string;
  esPublicaInitial: boolean;
  precioBaseInitial: number;
  suscripcionActiva: boolean;
}) {
  const [esPublica, setEsPublica] = useState(esPublicaInitial)
  const [precioBase, setPrecioBase] = useState(precioBaseInitial.toString())
  const [loading, setLoading] = useState(false)

  const handleUpdate = async () => {
    setLoading(true)
    const res = await actualizarSaasScreen(pantallaId, esPublica, parseFloat(precioBase))
    if (!res.success) alert(res.error)
    else alert('Configuración actualizada')
    setLoading(false)
  }

  const handleSimularPago = async () => {
    setLoading(true)
    const res = await actualizarSaasScreen(pantallaId, esPublica, parseFloat(precioBase), true)
    if (res.success) {
      alert('Pago de cuota SaaS simulado correctamente. Pantalla activada.')
      window.location.reload()
    } else {
      alert(res.error)
    }
    setLoading(false)
  }

  return (
    <div className="cyber-glass-ui p-6 mt-6 border-lumi-violet/30 bg-card/50">
      <h3 className="text-sm font-heading uppercase text-gradient-ui mb-4 flex items-center gap-2">
        <Server className="w-4 h-4" /> Configuración SaaS & Marketplace
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-[10px] uppercase text-muted-foreground mb-2 font-bold tracking-widest">Visibilidad en Marketplace</label>
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setEsPublica(true)}
               className={`px-4 py-2 text-xs uppercase font-bold tracking-widest rounded transition-all ${esPublica ? 'bg-[#2BC8FF] text-black shadow-[0_0_10px_rgba(43,200,255,0.4)]' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
             >
               Pública (Híbrida)
             </button>
             <button 
               onClick={() => setEsPublica(false)}
               className={`px-4 py-2 text-xs uppercase font-bold tracking-widest rounded transition-all ${!esPublica ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
             >
               Privada (SaaS)
             </button>
          </div>
          <p className="text-[9px] text-zinc-500 mt-2 font-mono uppercase">
            {esPublica ? 'La pantalla recibirá anuncios de terceros de la red de LumiAds.' : 'Uso exclusivo como tu CMS Privado.'}
          </p>
        </div>
        <div>
          <label className="block text-[10px] uppercase text-muted-foreground mb-2 font-bold tracking-widest">Tu Precio Base (por impacto)</label>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              step="0.01"
              value={precioBase}
              onChange={(e) => setPrecioBase(e.target.value)}
              className="bg-background border border-border p-2 w-32 rounded text-foreground font-heading focus:border-[#7C3CFF] focus:outline-none"
            />
            <span className="text-xs text-muted-foreground font-mono">€</span>
          </div>
          <p className="text-[9px] text-zinc-500 mt-2 font-mono uppercase">LumiAds sumará un % de markup sobre este precio en el marketplace.</p>
        </div>
      </div>

      <div className="flex gap-4 items-center">
         <Button onClick={handleUpdate} disabled={loading} className="cyber-button-ui uppercase text-[10px] font-bold">
           Guardar Preferencias
         </Button>

         {!suscripcionActiva ? (
           <Button onClick={handleSimularPago} disabled={loading} className="bg-green-600 hover:bg-green-500 text-white uppercase text-[10px] shadow-[0_0_15px_rgba(34,197,94,0.3)] font-bold">
             {esPublica ? 'Pagar Cuota Híbrida (9€/mes)' : 'Pagar Cuota Privada (29€/mes)'}
           </Button>
         ) : (
           <span className="text-[10px] text-green-500 uppercase font-bold tracking-widest bg-green-500/10 px-3 py-2 rounded">✓ Suscripción SaaS Activa</span>
         )}
      </div>
    </div>
  )
}
