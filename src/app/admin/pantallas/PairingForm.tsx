'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { activatePairingCode, getPairingMetadata } from '@/app/vincular/actions'
import { 
  getScreenTier, 
  getTierMultiplier,
  ScreenType, 
  DensityLevel 
} from '@/lib/yield/pricing'
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
import { Tv, Loader2, CheckCircle2, MapPin } from 'lucide-react'
import MapSelector from '@/components/MapSelector'

export function PairingForm() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [nombre, setNombre] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [esPublica, setEsPublica] = useState(true)
  const [tipoPantalla, setTipoPantalla] = useState<ScreenType>('gimnasio')
  const [densidadNivel, setDensidadNivel] = useState<DensityLevel>('medio')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [originalGPS, setOriginalGPS] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchingMetadata, setFetchingMetadata] = useState(false)
  const [success, setSuccess] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [tamanoPulgadas, setTamanoPulgadas] = useState(40)
  const [resolucion, setResolucion] = useState('')
  const [esTactil, setEsTactil] = useState(false)
  const [sospechoso, setSospechoso] = useState(false)

  const currentTier = getScreenTier(tipoPantalla, densidadNivel)
  const multiplier = getTierMultiplier(tipoPantalla, densidadNivel)

  // 1. Efecto: Al introducir el código completo, buscar ubicación de la TV
  useEffect(() => {
    if (code.length === 6) {
      const fetchTVLocation = async () => {
        setFetchingMetadata(true)
        const res = await getPairingMetadata(code)
        
        // Anti-Fraud logic based on resolution & expiration
        if (res.capturado_at) {
          const captureTime = new Date(res.capturado_at).getTime()
          const now = Date.now()
          if (now - captureTime > 10 * 60 * 1000) {
            toast.error('El código ha expirado (más de 10 min). Por seguridad, la TV debe mostrar uno nuevo.')
            setFetchingMetadata(false)
            return
          }
        }

        if (res.lat && res.lng) {
          const freshCoords = { lat: res.lat, lng: res.lng }
          setCoords(freshCoords)
          setOriginalGPS(freshCoords)
          toast.success('Ubicación de la TV detectada por GPS')
          
          if (res.resolucion) setResolucion(res.resolucion)
          if (res.es_tactil) setEsTactil(res.es_tactil)
          
          if (res.tamano_pulgadas_estimado) setTamanoPulgadas(res.tamano_pulgadas_estimado)
          
          // Suspicious constraints: touch device OR very small resolution
          let isSuspicious = false
          if (res.es_tactil) isSuspicious = true
          if (res.resolucion) {
             const [w, h] = res.resolucion.split('x').map(Number)
             if (w < 800 && h < 800) isSuspicious = true // Mobile typical
          }
          if (res.tamano_pulgadas_estimado && res.tamano_pulgadas_estimado < 20) isSuspicious = true // Demasiado pequeño para signage
          setSospechoso(isSuspicious)

          // Trigger automatic address analysis
          AnalyzeLocation(res.lat, res.lng)
        } else if (res.error) {
          toast.error(res.error)
        }
        setFetchingMetadata(false)
      }
      fetchTVLocation()
    }
  }, [code])

  // Función para analizar ubicación e IA (Refactorizada de useEffect)
  const AnalyzeLocation = async (lat: number, lng: number) => {
    setGeocoding(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`)
      const result = await res.json()
      
      if (result && result.display_name) {
        setCiudad(result.display_name)
        setUbicacion(result.display_name)

        const lowerAddr = result.display_name.toLowerCase()
        const addrObj = result.address || {}

        // --- SMART DETECTION LOGIC ---
        let detectedType: ScreenType | '' = ''
        const mainStreetKeywords = ['avenida', 'gran via', 'plaza', 'mayor', 'diagonal', 'recoletos', 'castellana', 'square', 'broadway', 'boulevard', 'pau claris']
        
        if (mainStreetKeywords.some(k => lowerAddr.includes(k))) {
          detectedType = 'calle_principal'
        }
        if (detectedType) setTipoPantalla(detectedType)

        // DENSITY DETECTION
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

        if (detectedDensity) setDensidadNivel(detectedDensity)
      }
    } catch (err) {
      console.error("Analysis error:", err)
    } finally {
      setGeocoding(false)
    }
  }

  // --- HAIVERSINE DISTANCE (Radius Lock) ---
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // in metres
  }

  const handleActivate = async () => {
    if (!code || code.length < 6) {
      toast.error('Introduce el código de 6 caracteres que aparece en la TV')
      return
    }
    if (!nombre || !ciudad) {
      toast.error('El nombre y la ciudad son obligatorios')
      return
    }

    if (esPublica && !coords) {
      toast.error('Para pantallas públicas es obligatorio marcar la ubicación en el mapa')
      return
    }

    setLoading(true)
    const result = await activatePairingCode(
      code, 
      nombre, 
      ciudad, 
      ubicacion || ciudad, 
      esPublica,
      coords?.lat,
      coords?.lng,
      tipoPantalla,
      densidadNivel,
      resolucion,
      esTactil,
      tamanoPulgadas,
      sospechoso
    )

    if (result.success) {
      setSuccess(true)
      toast.success('¡Pantalla vinculada! La TV redirigirá automáticamente al reproductor.')
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } else {
      toast.error(result.error || 'Error al vincular. Comprueba el código.')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-400" />
        <p className="text-green-500 dark:text-green-400 font-heading font-black uppercase tracking-widest text-sm">¡Vinculada con éxito!</p>
        <p className="text-muted-foreground text-xs">La TV se está conectando al reproductor...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
        <p className="text-[10px] text-primary font-mono uppercase tracking-widest flex items-center gap-2">
          <Tv className="w-3 h-3" />
          Enciende la TV y abre <strong>LuminAdd.app/vincular</strong> en el navegador.
          Verás un código de 6 caracteres. Introdúcelo aquí.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-muted-foreground text-xs uppercase tracking-widest">Código de la TV</Label>
        <Input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="LM-4F9"
          maxLength={6}
          className="bg-muted border-border text-foreground text-2xl font-mono h-14 tracking-[0.5em] uppercase text-center focus:border-primary"
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-widest">Nombre de la Pantalla</Label>
          <Input
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej: TV Recepción Bar"
            className="bg-muted border-border text-foreground h-10"
            disabled={loading}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-widest">Dirección (Detectada por GPS)</Label>
          <div className="relative">
            <Input
              value={ciudad}
              readOnly
              placeholder="Detectando ubicación..."
              className="bg-zinc-900 border-zinc-800 text-zinc-500 h-10 cursor-not-allowed italic"
            />
            {geocoding && <Loader2 className="w-4 h-4 absolute right-3 top-3 animate-spin text-primary" />}
          </div>
        </div>
      </div>

      {/* LuminAdd v3.0: Categorización Categoría y Densidad */}
      <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-widest">Tipo de Establecimiento</Label>
            <Select value={tipoPantalla} onValueChange={(v) => setTipoPantalla(v as ScreenType)}>
              <SelectTrigger className="bg-muted border-border text-foreground h-10 text-[11px] uppercase font-bold tracking-tight">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
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
            <Label className="text-muted-foreground text-xs uppercase tracking-widest">Densidad Población</Label>
            <Select value={densidadNivel} disabled>
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-500 h-10 text-[11px] uppercase font-bold tracking-tight cursor-not-allowed">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="bajo">Baja Densidad</SelectItem>
                <SelectItem value="medio">Media</SelectItem>
                <SelectItem value="alto">Alta</SelectItem>
                <SelectItem value="muy_alto">Muy Alta / Capital</SelectItem>
              </SelectContent>
            </Select>
          </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-muted-foreground text-xs uppercase tracking-widest flex justify-between">
           <span>Tamaño de la Pantalla (Detección Automática)</span>
           <span className="text-[10px] text-[#7C3CFF] font-mono tracking-tighter uppercase font-black">LuminAdd Telemetry Active</span>
        </Label>
        <div className="bg-[#7C3CFF]/5 border border-[#7C3CFF]/30 rounded-lg h-12 flex items-center px-4 justify-between">
          <span className="text-xl font-black text-white font-mono">{tamanoPulgadas}"</span>
          <span className="text-[9px] text-[#7C3CFF] uppercase font-bold tracking-widest">Hardware Verificado</span>
        </div>
        <p className="text-[9px] text-zinc-500 italic">El tamaño físico se detecta automáticamente analizando la densidad de píxeles y el hardware del equipo.</p>
      </div>

      {/* WARNING FLAG ANTI-FRAUDE */}
      {sospechoso && (
         <div className="p-4 border-2 border-red-500/50 bg-red-500/10 rounded-xl flex flex-col gap-2 mt-2">
             <div className="flex items-center gap-2 text-red-500 font-black uppercase tracking-widest text-sm">
                <span>⚠️</span> EQUIPO SOSPECHOSO (RIESGO ALTO)
             </div>
             <p className="text-xs text-red-400/80">
                 El sistema ha detectado que el dispositivo emisor es <strong>{esTactil ? 'TÁCTIL' : ''}</strong> y tiene una resolución de <strong>{resolucion}</strong>. 
                 Esto no corresponde a una pantalla publicitaria estándar.
                 <br/><br/>
                 Se permitirá el registro de la pantalla (ej. para Tótems verticales), pero la cuenta quedará marcada y bajo observación manual para evitar fraudes.
             </p>
         </div>
      )}

      {/* NEW: Yield Tier Feedback */}
      <div className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-500 ${
        currentTier === 'Elite' ? 'bg-[#7C3CFF]/10 border-[#7C3CFF]/30 shadow-[0_0_15px_rgba(124,60,255,0.1)]' :
        currentTier === 'Premium' ? 'bg-[#7C3CFF]/10 border-[#7C3CFF]/30 shadow-[0_0_15px_rgba(124,60,255,0.1)]' :
        'bg-muted/50 border-border'
      }`}>
        <div className="flex flex-col">
          <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-mono">Potencial de Ingresos</span>
          <span className={`text-sm font-black uppercase tracking-widest ${
            currentTier === 'Elite' ? 'text-[#7C3CFF]' :
            currentTier === 'Premium' ? 'text-[#7C3CFF]' :
            'text-foreground'
          }`}>{currentTier} TIER</span>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-muted-foreground uppercase block font-bold">Multiplicador Yield</span>
          <span className={`text-xl font-mono font-black ${
            currentTier === 'Elite' ? 'text-lumi-violet dark:text-[#7C3CFF]' : 'text-muted-foreground'
          }`}>x{multiplier.toFixed(1)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-muted-foreground text-xs uppercase tracking-widest">Ubicación / Descripción</Label>
        <Input
          value={ubicacion}
          onChange={e => setUbicacion(e.target.value)}
          placeholder="Ej: Entrada principal, a la derecha"
          className="bg-muted border-border text-foreground h-10"
          disabled={loading}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-muted-foreground text-xs uppercase tracking-widest mb-1 flex items-center gap-2">
            <MapPin className="w-3 h-3 text-primary" /> Posición en el Mapa
            {geocoding && <span className="text-[9px] text-muted-foreground animate-pulse ml-2 lowercase">buscando...</span>}
        </Label>
        <div className="rounded-xl overflow-hidden border border-border h-[200px] bg-muted/30 relative">
            <MapSelector 
                onSelect={(lat, lng) => {
                  if (originalGPS) {
                    const dist = calculateDistance(lat, lng, originalGPS.lat, originalGPS.lng)
                    if (dist > 100) {
                      toast.error('Margen de corrección excedido (máx 100m)')
                      return
                    }
                  }
                  setCoords({ lat, lng })
                }}
                externalPosition={coords}
            />
            {originalGPS && (
              <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md border border-[#7C3CFF]/30 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                <div className="w-2 h-2 bg-[#7C3CFF] rounded-full animate-pulse" />
                <span className="text-[9px] text-[#7C3CFF] font-black uppercase tracking-widest">GPS Verificado (±100m)</span>
              </div>
            )}
        </div>
      </div>


      <Button
        onClick={handleActivate}
        disabled={loading}
        className="bg-primary hover:bg-primary/90 text-black font-black h-12 uppercase tracking-widest text-xs mt-2 shadow-[0_0_20px_rgba(124,60,255,0.2)]"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Vinculando...</>
        ) : (
          <><Tv className="w-4 h-4 mr-2" /> Activar Pantalla Premium</>
        )}
      </Button>
    </div>
  )
}



