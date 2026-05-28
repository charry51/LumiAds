'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tv, Loader2, MapPin, Monitor } from 'lucide-react'
import { activatePairingCode, getPairingMetadata } from '@/app/vincular/actions'
import { getScreenTier, getTierMultiplier, ScreenType, DensityLevel } from '@/lib/yield/pricing'
import MapSelector from '@/components/MapSelector'

export function ConectarPantallaModal({ trigger }: { trigger: React.ReactElement }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // --- ESTADOS VINCULACIÓN ---
  const [code, setCode] = useState('')
  const [nombreVincular, setNombreVincular] = useState('')
  const [ciudadVincular, setCiudadVincular] = useState('')
  const [ubicacionVincular, setUbicacionVincular] = useState('')
  const [esPublicaVincular, setEsPublicaVincular] = useState(true)
  const [tipoPantallaVincular, setTipoPantallaVincular] = useState<ScreenType>('gimnasio')
  const [densidadNivelVincular, setDensidadNivelVincular] = useState<DensityLevel>('medio')
  const [coordsVincular, setCoordsVincular] = useState<{ lat: number; lng: number } | null>(null)
  const [originalGPS, setOriginalGPS] = useState<{ lat: number; lng: number } | null>(null)
  const [fetchingMetadata, setFetchingMetadata] = useState(false)
  const [geocodingVincular, setGeocodingVincular] = useState(false)
  const [tamanoPulgadas, setTamanoPulgadas] = useState(40)
  const [resolucion, setResolucion] = useState('')
  const [esTactil, setEsTactil] = useState(false)
  const [sospechoso, setSospechoso] = useState(false)

  const currentTierVincular = getScreenTier(tipoPantallaVincular, densidadNivelVincular)
  const multiplierVincular = getTierMultiplier(tipoPantallaVincular, densidadNivelVincular)

  // 1. Limpiar código previo al abrir el modal
  useEffect(() => {
    if (open) {
      setCode('')
      if (typeof window !== 'undefined') {
        localStorage.removeItem('LuminAdd_latest_pairing_code')
      }
    }
  }, [open])

  // 2. Escuchar cambios en localStorage (para copiar el código desde la otra pestaña)
  useEffect(() => {
    if (!open) return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'LuminAdd_latest_pairing_code' && e.newValue) {
        setCode(e.newValue)
        toast.success(`Código de TV detectado y copiado: ${e.newValue}`)
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Polling de respaldo por si el evento de storage no se propaga a tiempo
    const pollInterval = setInterval(() => {
      const savedCode = localStorage.getItem('LuminAdd_latest_pairing_code')
      if (savedCode && savedCode !== code && code.length === 0) {
        setCode(savedCode)
        toast.success(`Código de TV detectado automáticamente: ${savedCode}`)
      }
    }, 1000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(pollInterval)
    }
  }, [open, code])

  // 3. Efecto: Buscar metadatos al introducir el código completo de 6 caracteres
  useEffect(() => {
    if (code.length === 6) {
      const fetchTVLocation = async () => {
        setFetchingMetadata(true)
        const res = await getPairingMetadata(code)
        
        if (res.capturado_at) {
          const captureTime = new Date(res.capturado_at).getTime()
          const now = Date.now()
          if (now - captureTime > 10 * 60 * 1000) {
            toast.error('El código ha expirado (más de 10 min). Genera uno nuevo en la TV.')
            setFetchingMetadata(false)
            return
          }
        }

        if (res.lat && res.lng) {
          const freshCoords = { lat: res.lat, lng: res.lng }
          setCoordsVincular(freshCoords)
          setOriginalGPS(freshCoords)
          toast.success('Ubicación de la TV detectada por GPS')
          
          if (res.resolucion) setResolucion(res.resolucion)
          if (res.es_tactil) setEsTactil(res.es_tactil)
          if (res.tamano_pulgadas_estimado) setTamanoPulgadas(res.tamano_pulgadas_estimado)
          
          // Detección sospechosa (Fraude)
          let isSuspicious = false
          if (res.es_tactil) isSuspicious = true
          if (res.resolucion) {
             const [w, h] = res.resolucion.split('x').map(Number)
             if (w < 800 && h < 800) isSuspicious = true
          }
          if (res.tamano_pulgadas_estimado && res.tamano_pulgadas_estimado < 20) isSuspicious = true
          setSospechoso(isSuspicious)

          // Analizar dirección a partir de las coordenadas de la TV
          analyzeLocationVincular(res.lat, res.lng)
        } else if (res.error) {
          toast.error(res.error)
        }
        setFetchingMetadata(false)
      }
      fetchTVLocation()
    }
  }, [code])

  // Geocodificación inversa para obtener la dirección a partir de coordenadas GPS
  const analyzeLocationVincular = async (lat: number, lng: number) => {
    setGeocodingVincular(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`)
      const result = await res.json()
      
      if (result && result.display_name) {
        setCiudadVincular(result.display_name)
        setUbicacionVincular(result.display_name)

        const lowerAddr = result.display_name.toLowerCase()
        const addrObj = result.address || {}

        // Smart Category Detection
        let detectedType: ScreenType | '' = ''
        const mainStreetKeywords = ['avenida', 'gran via', 'plaza', 'mayor', 'diagonal', 'recoletos', 'castellana', 'square', 'broadway', 'boulevard', 'pau claris']
        
        if (mainStreetKeywords.some(k => lowerAddr.includes(k))) {
          detectedType = 'calle_principal'
        }
        if (detectedType) setTipoPantallaVincular(detectedType)

        // Density Detection
        let detectedDensity: DensityLevel | '' = ''
        const hugeCities = ['madrid', 'barcelona', 'london', 'paris', 'berlin', 'new york', 'roma', 'sevilla', 'valencia', 'malaga']
        const cityName = (addrObj.city || addrObj.town || addrObj.municipality || '').toLowerCase()
        const isHugeCity = hugeCities.some(c => cityName.includes(c) || lowerAddr.includes(c))
        
        if (isHugeCity && mainStreetKeywords.some(k => lowerAddr.includes(k))) {
          detectedDensity = 'muy_alto'
        } else if (isHugeCity) {
          detectedDensity = 'alto'
        } else {
          detectedDensity = 'medio'
        }

        if (detectedDensity) setDensidadNivelVincular(detectedDensity)
      }
    } catch (err) {
      console.error("Analysis error:", err)
    } finally {
      setGeocodingVincular(false)
    }
  }

  // Haversine distance calculator
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3
    const f1 = lat1 * Math.PI/180
    const f2 = lat2 * Math.PI/180
    const df = (lat2-lat1) * Math.PI/180
    const dl = (lon2-lon1) * Math.PI/180
    const a = Math.sin(df/2) * Math.sin(df/2) +
              Math.cos(f1) * Math.cos(f2) *
              Math.sin(dl/2) * Math.sin(dl/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Ejecutar vinculación por código
  const handleVincular = async () => {
    if (!code || code.length < 6) {
      toast.error('Introduce el código de 6 caracteres que se muestra en tu TV')
      return
    }
    if (!nombreVincular || !ciudadVincular) {
      toast.error('El nombre y la ciudad de ubicación son obligatorios')
      return
    }
    if (esPublicaVincular && !coordsVincular) {
      toast.error('Para pantallas públicas es obligatorio marcar la ubicación en el mapa')
      return
    }

    setLoading(true)
    const result = await activatePairingCode(
      code,
      nombreVincular,
      ciudadVincular,
      ubicacionVincular || ciudadVincular,
      esPublicaVincular,
      coordsVincular?.lat,
      coordsVincular?.lng,
      tipoPantallaVincular,
      densidadNivelVincular,
      resolucion,
      esTactil,
      tamanoPulgadas,
      sospechoso
    )

    if (result.success) {
      toast.success('¡Pantalla vinculada correctamente!')
      setOpen(false)
      // Resetear estados
      setCode('')
      setNombreVincular('')
      setCiudadVincular('')
      setUbicacionVincular('')
      setCoordsVincular(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('LuminAdd_latest_pairing_code')
      }
      router.refresh()
    } else {
      toast.error(result.error || 'Error al vincular. Comprueba el código.')
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-[520px] bg-zinc-950 text-white border-zinc-900 max-h-[92vh] overflow-y-auto font-sans">
        <DialogHeader className="border-b border-zinc-900 pb-4">
          <DialogTitle className="font-heading uppercase tracking-[3px] text-sm text-center flex items-center justify-center gap-2">
            <Monitor className="w-5 h-5 text-violet-500" /> Vincular TV Receptor LumiAds
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-3">
          <div className="p-5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-4 shadow-xl">
            <p className="text-xs text-zinc-300 leading-relaxed text-center">
              Haz clic abajo para abrir la pantalla de vinculación en otra pestaña. El código que genere se copiará automáticamente aquí.
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <Button
                type="button"
                onClick={() => window.open('/vincular', '_blank')}
                className="w-full text-center py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-black text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgba(255,255,255,0.08)] duration-200 font-bold"
              >
                <Tv className="w-3.5 h-3.5 text-black" />
                Abrir vinculador en otra pestaña
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-zinc-400 text-[10px] uppercase tracking-widest font-mono">Código de Vinculación</Label>
            <Input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="Esperando código..."
              maxLength={6}
              className="bg-zinc-900 border-zinc-800 text-white text-2xl font-mono h-12 tracking-[0.5em] uppercase text-center focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              disabled={loading || fetchingMetadata}
            />
            {fetchingMetadata && (
              <span className="text-[9px] text-violet-400 flex items-center gap-1 font-mono uppercase tracking-wider animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" /> Descargando telemetría de dispositivo...
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label className="text-zinc-400 text-[10px] uppercase tracking-widest font-mono">Nombre de la Pantalla</Label>
              <Input
                value={nombreVincular}
                onChange={e => setNombreVincular(e.target.value)}
                placeholder="Ej: Recepción Gimnasio"
                className="bg-zinc-900 border-zinc-800 text-white h-10 text-xs"
                disabled={loading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-zinc-400 text-[10px] uppercase tracking-widest font-mono">Dirección Detectada</Label>
              <div className="relative">
                <Input
                  value={ciudadVincular}
                  readOnly
                  placeholder="Escribe el código para detectar..."
                  className="bg-zinc-900 border-zinc-800 text-zinc-500 h-10 text-xs cursor-not-allowed italic"
                />
                {geocodingVincular && <Loader2 className="w-4 h-4 absolute right-3 top-3 animate-spin text-violet-500" />}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label className="text-zinc-400 text-[10px] uppercase tracking-widest font-mono">Establecimiento</Label>
              <Select value={tipoPantallaVincular} onValueChange={v => setTipoPantallaVincular(v as ScreenType)}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white h-10 text-[11px] uppercase font-bold tracking-tight">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectItem value="bar">Bar (Standard)</SelectItem>
                  <SelectItem value="gimnasio">Gimnasio</SelectItem>
                  <SelectItem value="restaurante">Restaurante</SelectItem>
                  <SelectItem value="calle">Calle</SelectItem>
                  <SelectItem value="centro_comercial">Centro Comercial</SelectItem>
                  <SelectItem value="calle_principal">Calle Principal (Elite)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-zinc-400 text-[10px] uppercase tracking-widest font-mono">Densidad Población</Label>
              <Select value={densidadNivelVincular} disabled>
                <SelectTrigger className="bg-zinc-900/50 border-zinc-800/80 text-zinc-500 h-10 text-[11px] uppercase font-bold tracking-tight cursor-not-allowed">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="bajo">Baja</SelectItem>
                  <SelectItem value="medio">Media</SelectItem>
                  <SelectItem value="alto">Alta</SelectItem>
                  <SelectItem value="muy_alto">Muy Alta / Capital</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-zinc-400 text-[10px] uppercase tracking-widest font-mono flex justify-between">
              <span>Pulgadas Estimadas</span>
              <span className="text-[9px] text-violet-400 font-mono tracking-tighter uppercase font-bold">LuminHost Telemetría</span>
            </Label>
            <div className="bg-violet-950/20 border border-violet-500/20 rounded-lg h-10 flex items-center px-4 justify-between text-xs">
              <span className="font-bold text-white font-mono">{tamanoPulgadas}" pulgadas</span>
              <span className="text-[8px] text-violet-400 uppercase font-black tracking-widest">Hardware Verificado</span>
            </div>
          </div>

          {/* Alerta sospechosa */}
          {sospechoso && (
            <div className="p-3 border border-red-500/30 bg-red-950/20 rounded-lg text-[11px] text-red-400 leading-normal">
              <strong className="uppercase">⚠️ Hardware Sospechoso:</strong> El dispositivo reporta ser táctil y/o tener resolución pequeña. Se permitirá la vinculación, pero la cuenta será auditada manualmente para asegurar que sea una pantalla física fija.
            </div>
          )}

          {/* Yield feedback */}
          <div className="p-3.5 rounded-lg border border-zinc-900 bg-zinc-900/40 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono">Nivel de Ingresos</span>
              <span className="text-xs font-black uppercase text-violet-400">{currentTierVincular} Tier</span>
            </div>
            <div className="text-right">
              <span className="text-[8px] text-zinc-500 uppercase block font-bold">Multiplicador</span>
              <span className="text-base font-mono font-black text-white">x{multiplierVincular.toFixed(1)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-zinc-400 text-[10px] uppercase tracking-widest font-mono">Ubicación / Descripción interna</Label>
            <Input
              value={ubicacionVincular}
              onChange={e => setUbicacionVincular(e.target.value)}
              placeholder="Ej: Encima de las cintas de correr"
              className="bg-zinc-900 border-zinc-800 text-white h-10 text-xs"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-zinc-400 text-[10px] uppercase tracking-widest font-mono flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-violet-500" /> Posición GPS Verificada
            </Label>
            <div className="rounded-lg overflow-hidden border border-zinc-900 h-[140px] bg-zinc-900 relative">
              <MapSelector
                onSelect={(lat, lng) => {
                  if (originalGPS) {
                    const dist = calculateDistance(lat, lng, originalGPS.lat, originalGPS.lng)
                    if (dist > 100) {
                      toast.error('Por seguridad, no puedes alejar la posición más de 100m del GPS físico de la TV')
                      return
                    }
                  }
                  setCoordsVincular({ lat, lng })
                }}
                externalPosition={coordsVincular}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 py-2">
            <Label className="text-zinc-400 text-[10px] uppercase tracking-widest font-mono mb-1">Visibilidad Marketplace</Label>
            <div className="grid grid-cols-2 gap-2 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
              <button
                type="button"
                onClick={() => setEsPublicaVincular(true)}
                className={`flex flex-col items-center gap-0.5 py-2.5 rounded border transition-all ${
                  esPublicaVincular
                    ? 'bg-violet-600/20 border-violet-500/50 text-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-400'
                }`}
              >
                <span className="text-[9px] font-black uppercase tracking-tighter">🌐 Pública</span>
                <span className="text-[7px] opacity-60 uppercase font-mono">Abierta a Anunciantes</span>
              </button>
              <button
                type="button"
                onClick={() => setEsPublicaVincular(false)}
                className={`flex flex-col items-center gap-0.5 py-2.5 rounded border transition-all ${
                  !esPublicaVincular
                    ? 'bg-zinc-800 border-zinc-700 text-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-400'
                }`}
              >
                <span className="text-[9px] font-black uppercase tracking-tighter">🔒 Privada</span>
                <span className="text-[7px] opacity-60 uppercase font-mono">Uso Propio CMS</span>
              </button>
            </div>
          </div>

          <Button
            onClick={handleVincular}
            disabled={loading || fetchingMetadata}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black h-11 uppercase tracking-widest text-[10px] mt-2 shadow-lg shadow-violet-600/20"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Vinculando...</>
            ) : (
              <><Tv className="w-4 h-4 mr-2" /> Activar Pantalla Premium</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
