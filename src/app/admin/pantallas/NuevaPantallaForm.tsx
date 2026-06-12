'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createPantalla } from './actions'
import { PairingForm } from './PairingForm'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tv, MapPin } from 'lucide-react'
import MapSelector from '@/components/MapSelector'

export function NuevaPantallaForm() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'manual' | 'vincular'>('vincular')
  const [esPublica, setEsPublica] = useState(true)
  const [ciudad, setCiudad] = useState('')
  const [latitud, setLatitud] = useState<string>('')
  const [longitud, setLongitud] = useState<string>('')
  const [geocoding, setGeocoding] = useState(false)

  // Auto-busqueda en mapa cuando cambia la ciudad (debounce 1s)
  useEffect(() => {
    if (!ciudad || ciudad.trim().length < 4) return
    const delayDebounceFn = setTimeout(async () => {
      setGeocoding(true)
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(ciudad)}&limit=1`)
        const data = await res.json()
        if (data && data.length > 0) {
          setLatitud(data[0].lat)
          setLongitud(data[0].lon)
        }
      } catch (err) {
        console.error("Geocoding error:", err)
      } finally {
        setGeocoding(false)
      }
    }, 1000)
    return () => clearTimeout(delayDebounceFn)
  }, [ciudad])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.append('es_publica', esPublica.toString())
    
    if (!formData.get('nombre') || !formData.get('ciudad') || !formData.get('latitud') || !formData.get('longitud')) {
        toast.error('Nombre, Ciudad, Latitud y Longitud son requeridos');
        setLoading(false);
        return;
    }

    const res = await createPantalla(formData)
    
    if (res.success) {
      toast.success('Pantalla añadida correctamente')
      setOpen(false)
    } else {
      toast.error('Error: ' + res.error)
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <Button className="bg-[#7C3CFF] text-black hover:bg-[#C94BFF] font-bold">
            + Añadir Pantalla
          </Button>
        } 
      />
      <DialogContent className="sm:max-w-[480px] bg-card text-white border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading uppercase tracking-widest text-sm">Nueva Pantalla en la Red</DialogTitle>
        </DialogHeader>

        {/* Pestañas */}
        <div className="flex gap-1 p-1 bg-black/40 border border-white/5 rounded-lg mt-2">
          <button
            onClick={() => setTab('vincular')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[11px] font-black uppercase tracking-widest transition-all ${
              tab === 'vincular' 
                ? 'bg-primary text-black shadow-md' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Tv className="w-3.5 h-3.5" /> Vincular TV
          </button>
          <button
            onClick={() => setTab('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[11px] font-black uppercase tracking-widest transition-all ${
              tab === 'manual' 
                ? 'bg-white/10 text-white shadow-md' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" /> Manual
          </button>
        </div>

        {/* Contenido de pairing */}
        {tab === 'vincular' && (
          <PairingForm />
        )}

        {/* Formulario manual */}
        {tab === 'manual' && (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-zinc-500 text-xs uppercase tracking-widest">Nombre Público</Label>
              <Input id="nombre" name="nombre" placeholder="Ej: LED Centro Comercial" className="bg-black/20 border-white/10" disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ciudad" className="text-zinc-500 text-xs uppercase tracking-widest flex items-center justify-between">
                  Dirección completa
                  {geocoding && <span className="text-[9px] text-zinc-500 animate-pulse lowercase">buscando en mapa...</span>}
              </Label>
              <Input 
                id="ciudad" name="ciudad" 
                placeholder="Ej: Madrid, Calle Gran Vía 15" 
                value={ciudad}
                onChange={e => setCiudad(e.target.value)}
                className="bg-black/20 border-white/10" disabled={loading} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ubicacion" className="text-zinc-500 text-xs uppercase tracking-widest">Ubicación Fina</Label>
              <Input id="ubicacion" name="ubicacion" placeholder="Ej: Planta 2, Zona Restauración" className="bg-black/20 border-white/10" disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacidad_impactos_diarios" className="text-zinc-500 text-xs uppercase tracking-widest">Impactos disponibles al dia</Label>
              <Input
                id="capacidad_impactos_diarios"
                name="capacidad_impactos_diarios"
                type="number"
                min="1"
                step="1"
                defaultValue="1000"
                placeholder="1000"
                className="bg-black/20 border-white/10"
                disabled={loading}
              />
            </div>

             <div className="flex flex-col gap-2">
              <div className="rounded-xl overflow-hidden border border-white/10 h-[150px] bg-black/40 w-full relative z-0">
                  <MapSelector 
                      onSelect={(lat, lng) => {
                          setLatitud(lat.toString())
                          setLongitud(lng.toString())
                      }}
                      externalPosition={(latitud && longitud) ? { lat: parseFloat(latitud), lng: parseFloat(longitud) } : null}
                  />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label htmlFor="latitud" className="text-zinc-500 text-xs uppercase tracking-widest">Latitud</Label>
                  <Input 
                    id="latitud" name="latitud" placeholder="40.4168" type="number" step="any" 
                    value={latitud}
                    onChange={e => setLatitud(e.target.value)}
                    className="bg-black/20 border-white/10" disabled={loading} 
                  />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="longitud" className="text-zinc-500 text-xs uppercase tracking-widest">Longitud</Label>
                  <Input 
                    id="longitud" name="longitud" placeholder="-3.7038" type="number" step="any" 
                    value={longitud}
                    onChange={e => setLongitud(e.target.value)}
                    className="bg-black/20 border-white/10" disabled={loading} 
                  />
              </div>
            </div>
            <div className="flex flex-col gap-2 py-2">
              <Label className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Visibilidad Marketplace</Label>
              <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-xl border border-white/10">
                  <button
                      type="button"
                      onClick={() => setEsPublica(true)}
                      className={`flex flex-col items-center gap-1 py-3 rounded-lg border transition-all ${
                          esPublica 
                              ? 'bg-primary/20 border-primary/50 text-white' 
                              : 'border-transparent text-zinc-500 hover:text-zinc-400'
                      }`}
                  >
                      <span className="text-[10px] font-black uppercase tracking-tighter">🌐 Pública</span>
                      <span className="text-[8px] opacity-60 uppercase">Disponible</span>
                  </button>
                  <button
                      type="button"
                      onClick={() => setEsPublica(false)}
                      className={`flex flex-col items-center gap-1 py-3 rounded-lg border transition-all ${
                          !esPublica 
                              ? 'bg-white/10 border-white/20 text-white' 
                              : 'border-transparent text-zinc-500 hover:text-zinc-400'
                      }`}
                  >
                      <span className="text-[10px] font-black uppercase tracking-tighter">🔒 Privada</span>
                      <span className="text-[8px] opacity-60 uppercase">Uso Propio</span>
                  </button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-[#7C3CFF] text-black hover:bg-[#C94BFF] font-black uppercase tracking-widest" disabled={loading}>
              {loading ? 'Guardando...' : 'Añadir a Inventario'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
