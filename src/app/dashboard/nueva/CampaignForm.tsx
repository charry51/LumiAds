'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createCampaign } from './actions'
import { Slider } from '@/components/ui/slider'
import MapSelector from '@/components/MapSelector'
import { createClient } from '@/lib/supabase/client'
import { calculateEstimatedImpacts, ScreenType, DensityLevel } from '@/lib/yield/pricing'
import { Wallet, UploadCloud, Monitor, Zap, MapPin, CheckCircle2 } from 'lucide-react'

type Pantalla = {
  id: string
  nombre: string
  ubicacion: string
  ciudad: string
  latitud: number | null
  longitud: number | null
  precio_emision: number
  precio_base: number
  tipo_pantalla?: ScreenType
  densidad_poblacion_nivel?: DensityLevel
  precio_base_impacto?: number
  comision_markup_porcentaje?: number
}

export default function CampaignForm({ pantallas, userPlan = 'Plan Básico', walletBalance = 0 }: { pantallas: Pantalla[], userPlan?: string, walletBalance?: number }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedMapScreens, setSelectedMapScreens] = useState<string[]>([])
  const [screenWeights, setScreenWeights] = useState<Record<string, number>>({})
  const [selectedCity, setSelectedCity] = useState<string>('todas')
  
  const uniqueCities = Array.from(new Set(pantallas.map(p => p.ciudad).filter(Boolean))).sort()
  // Drag and Drop States
  const [dragActive, setDragActive] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [targetType, setTargetType] = useState<ScreenType>('gimnasio')
  const [targetDensity, setTargetDensity] = useState<DensityLevel>('medio')
  
  // Días de la semana (0=Dom, 1=Lun, ..., 6=Sab)
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]) // Por defecto Lun-Vie
  
  const [presupuestoTotal, setPresupuestoTotal] = useState<number>(100)
  const [prioridad, setPrioridad] = useState<number>(1)
  const [duracion, setDuracion] = useState<number>(10)
  
  const planFrequency = userPlan.includes('Dominio') ? 4 : userPlan.includes('Expansión') ? 3 : userPlan.includes('Impacto') ? 2 : 1

  const selectedScreensFull = pantallas.filter(p => selectedMapScreens.includes(p.id))
  
  const totalWeight = selectedScreensFull.reduce((sum, s) => sum + (screenWeights[s.id] || 1), 0)
  
  const impactosEstimados = selectedScreensFull.length > 0 
    ? Math.floor(selectedScreensFull.reduce((sum, screen) => {
        const weight = screenWeights[screen.id] || 1
        const budgetFraction = totalWeight > 0 ? (weight / totalWeight) : 0
        const screenBudget = presupuestoTotal * budgetFraction
        
        return sum + calculateEstimatedImpacts({
          presupuestoTotal: screenBudget,
          prioridad,
          duracionSegundos: duracion,
          zona: 'standard',
          tipoPantalla: screen.tipo_pantalla || 'gimnasio',
          densidadNivel: screen.densidad_poblacion_nivel || 'medio',
          frecuenciaRelativa: planFrequency,
          precioBaseImpacto: screen.precio_base_impacto,
          comisionMarkupPorcentaje: screen.comision_markup_porcentaje
        })
      }, 0))
    : calculateEstimatedImpacts({
        presupuestoTotal,
        prioridad,
        duracionSegundos: duracion,
        zona: 'standard',
        tipoPantalla: targetType,
        densidadNivel: targetDensity,
        frecuenciaRelativa: planFrequency,
      })

  const isPremium = userPlan.toLowerCase().includes('expansión') || userPlan.toLowerCase().includes('dominio')

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const toggleScreen = (id: string) => {
     setSelectedMapScreens(prev => {
       const isSelected = prev.includes(id)
       if (isSelected) {
         setScreenWeights(w => {
           const newW = { ...w }
           delete newW[id]
           return newW
         })
         return prev.filter(s => s !== id)
       } else {
         setScreenWeights(w => ({ ...w, [id]: 1 }))
         return [...prev, id]
       }
     })
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const extractVideoDuration = async (file: File) => {
    if (!file.type.startsWith('video/')) {
        setDuracion(10) // Default para imágenes
        return
    }
    try {
        const video = document.createElement('video')
        video.preload = 'metadata'
        const videoDuration = await new Promise<number>((resolve, reject) => {
            video.onloadedmetadata = () => {
                window.URL.revokeObjectURL(video.src)
                resolve(video.duration)
            }
            video.onerror = () => reject('Error')
            video.src = URL.createObjectURL(file)
        })
        setDuracion(Math.round(videoDuration))
    } catch (err) {
        setDuracion(10)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      setFileName(file.name)
      if (fileInputRef.current) {
         const dataTransfer = new DataTransfer()
         dataTransfer.items.add(file)
         fileInputRef.current.files = dataTransfer.files
      }
      await extractVideoDuration(file)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFileName(file.name)
      await extractVideoDuration(file)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const file = fileInputRef.current?.files?.[0]
    
    if (selectedMapScreens.length === 0) {
       toast.error('Debes seleccionar al menos una pantalla en el marketplace.')
       setIsLoading(false)
       return
    }
    formData.set('pantalla_ids', selectedMapScreens.join(','))
    formData.set('pantalla_id', selectedMapScreens[0]) // Para retrocompatibilidad o campañas de 1 pantalla

    if (!file || file.size === 0) {
      toast.error('Debes seleccionar un archivo de video o imagen.')
      setIsLoading(false)
      return
    }

    if (file.type.startsWith('video/')) {
      try {
        const video = document.createElement('video')
        video.preload = 'metadata'
        
        const videoDuration = await new Promise<number>((resolve, reject) => {
          video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src)
            resolve(video.duration)
          }
          video.onerror = () => reject('Error al cargar metadatos del video')
          video.src = URL.createObjectURL(file)
        })

        if (videoDuration < 5) {
          toast.error(`El video es demasiado corto (${Math.round(videoDuration)}s). El mínimo permitido es 5s.`)
          setIsLoading(false)
          return
        }
        if (videoDuration > 30.5) {
          toast.error(`El video es demasiado largo (${Math.round(videoDuration)}s). El máximo permitido es 30s.`)
          setIsLoading(false)
          return
        }
      } catch (err) {
        toast.error('No se pudo validar la duración del video. Intenta con otro archivo.')
        setIsLoading(false)
        return
      }
    }

    try {
      const supabase = createClient()
      setIsUploading(true)
      setUploadProgress(0)

      const fileExt = file.name.split('.').pop()
      const generatedFileName = `${crypto.randomUUID()}.${fileExt}`
      const filePath = `${generatedFileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('creatividades')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          // @ts-ignore
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100
            setUploadProgress(Math.round(percent))
          }
        })

      if (uploadError) {
        throw new Error(`Error en Storage: ${uploadError.message}`)
      }

      const { data: { publicUrl } } = supabase.storage
        .from('creatividades')
        .getPublicUrl(uploadData.path)

      const payloadData = {
        nombre_campana: formData.get('nombre_campana') as string,
        fecha_inicio: formData.get('fecha_inicio') as string,
        fecha_fin: formData.get('fecha_fin') as string,
        video_url: publicUrl,
        hora_inicio: (formData.get('hora_inicio') as string) || '',
        hora_fin: (formData.get('hora_fin') as string) || '',
        pantalla_id: selectedMapScreens[0],
        pantalla_idsRaw: selectedMapScreens.join(','),
        pantalla_weights: JSON.stringify(screenWeights),
        dias_semana: selectedDays,
        presupuesto_total: presupuestoTotal,
        prioridad: prioridad,
        impactos_estimados: impactosEstimados,
        duracion_segundos: duracion
      }

      const result = await createCampaign(payloadData)
      
      if (result.type === 'error') {
        toast.error(result.message)
      } else {
        toast.success(result.message)
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error: any) {
      console.error('Error al crear campaña:', error)
      toast.error(`Error: ${error.message || 'Consulta la consola'}`)
    } finally {
      setIsLoading(false)
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8 relative">
      
      {/* LEFT COLUMN: Main Form Configuration */}
      <div className="flex-1 flex flex-col gap-8 w-full max-w-full">
        
        {/* WALLET HEADER */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-[#2BC8FF]/10 blur-3xl rounded-full pointer-events-none" />
           <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7C3CFF]/20 to-[#2BC8FF]/20 border border-white/10 flex items-center justify-center shadow-[0_0_15px_rgba(43,200,255,0.15)]">
                 <Wallet className="w-6 h-6 text-[#2BC8FF]" />
              </div>
              <div>
                 <h2 className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400 mb-1">Saldo Disponible en Monedero</h2>
                 <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black font-mono text-white tabular-nums tracking-tighter">
                      {walletBalance.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-lg font-bold text-[#2BC8FF]">€</span>
                 </div>
              </div>
           </div>
           
            <div className="relative z-10 flex items-center gap-3">
               <Link href="/dashboard/billetera?returnTo=/dashboard/nueva">
                  <Button type="button" variant="outline" className="border-[#2BC8FF]/30 bg-[#2BC8FF]/5 text-[#2BC8FF] hover:bg-[#2BC8FF] hover:text-black text-[9px] uppercase font-black tracking-widest px-4 h-9 transition-all">
                     Recargar Billetera
                  </Button>
               </Link>
               <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-zinc-300 font-bold flex items-center gap-2 hidden sm:flex">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Billetera Activa
               </div>
            </div>
        </div>

        {/* DETAILS & SCHEDULE */}
        <div className="flex flex-col gap-6">
           <div className="flex flex-col gap-2">
             <Label htmlFor="nombre_campana" className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Nombre de la Campaña</Label>
             <Input 
                id="nombre_campana" 
                name="nombre_campana" 
                placeholder="Ej. Lanzamiento Perfume 2026" 
                required 
                disabled={isLoading} 
                className="bg-white/5 border-white/10 focus:border-[#2BC8FF]/50 text-white h-14 rounded-xl px-4 text-base transition-colors hover:bg-white/10" 
             />
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div className="flex flex-col gap-2">
               <Label htmlFor="fecha_inicio" className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Fecha de Inicio</Label>
               <Input id="fecha_inicio" name="fecha_inicio" type="date" required disabled={isLoading} className="bg-white/5 border-white/10 focus:border-[#2BC8FF]/50 text-white h-14 rounded-xl px-4 transition-colors hover:bg-white/10 [color-scheme:dark]" />
             </div>
             <div className="flex flex-col gap-2">
               <Label htmlFor="fecha_fin" className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Fecha de Fin</Label>
               <Input id="fecha_fin" name="fecha_fin" type="date" required disabled={isLoading} className="bg-white/5 border-white/10 focus:border-[#2BC8FF]/50 text-white h-14 rounded-xl px-4 transition-colors hover:bg-white/10 [color-scheme:dark]" />
             </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div className="flex flex-col gap-2">
               <Label htmlFor="hora_inicio" className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Hora Inicio Emisión</Label>
               <Input id="hora_inicio" name="hora_inicio" type="time" defaultValue="00:00" required disabled={isLoading} className="bg-white/5 border-white/10 focus:border-[#2BC8FF]/50 text-white h-14 rounded-xl px-4 transition-colors hover:bg-white/10 [color-scheme:dark]" />
             </div>
             <div className="flex flex-col gap-2">
               <Label htmlFor="hora_fin" className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Hora Fin Emisión</Label>
               <Input id="hora_fin" name="hora_fin" type="time" defaultValue="23:59" required disabled={isLoading} className="bg-white/5 border-white/10 focus:border-[#2BC8FF]/50 text-white h-14 rounded-xl px-4 transition-colors hover:bg-white/10 [color-scheme:dark]" />
             </div>
           </div>

           <div className="flex flex-col gap-3 mt-2">
             <Label className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Días de Emisión</Label>
             <div className="flex flex-wrap gap-2">
               {[
                 { id: 1, label: 'L' }, { id: 2, label: 'M' }, { id: 3, label: 'X' },
                 { id: 4, label: 'J' }, { id: 5, label: 'V' }, { id: 6, label: 'S' }, { id: 0, label: 'D' }
               ].map((day) => {
                 const isSelected = selectedDays.includes(day.id)
                 return (
                   <button
                     key={day.id}
                     type="button"
                     onClick={() => toggleDay(day.id)}
                     className={`
                       h-12 w-12 rounded-full flex items-center justify-center text-sm font-black transition-all duration-300 border
                       ${isSelected 
                         ? 'bg-[#7C3CFF]/20 border-[#2BC8FF]/50 text-white shadow-[0_0_15px_rgba(124,60,255,0.4)]' 
                         : 'bg-white/5 border-white/10 text-zinc-500 hover:bg-white/10 hover:border-white/20 hover:text-zinc-300'
                       }
                     `}
                   >
                     {day.label}
                   </button>
                 )
               })}
             </div>
           </div>
        </div>

        {/* DRAG AND DROP UPLOAD */}
        <div className="flex flex-col gap-2 mt-4">
           <Label className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Creatividad (HD 1920x1080)</Label>
           <div 
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                 relative flex flex-col items-center justify-center p-10 mt-2 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden group
                 ${dragActive || fileName 
                    ? 'border-[#2BC8FF] bg-[#2BC8FF]/5 shadow-[0_0_30px_rgba(43,200,255,0.1)]' 
                    : 'border-white/20 bg-white/5 hover:border-[#7C3CFF]/50 hover:bg-[#7C3CFF]/5'
                 }
              `}
           >
              <input 
                 ref={fileInputRef}
                 type="file" 
                 accept="image/*,video/mp4"
                 onChange={handleFileChange}
                 className="hidden"
                 required
              />
              
              <div className="absolute inset-0 bg-gradient-to-tr from-[#7C3CFF]/10 to-[#2BC8FF]/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="w-16 h-16 mb-4 rounded-full bg-black/50 border border-white/10 flex items-center justify-center backdrop-blur-sm relative z-10 group-hover:scale-110 transition-transform duration-500">
                 {fileName ? <CheckCircle2 className="w-8 h-8 text-[#2BC8FF]" /> : <UploadCloud className="w-8 h-8 text-zinc-400 group-hover:text-[#2BC8FF] transition-colors" />}
              </div>
              
              <p className="text-white font-bold text-lg relative z-10 text-center">
                 {fileName ? fileName : 'Arrastra tu archivo aquí'}
              </p>
              <p className="text-zinc-500 text-[11px] uppercase tracking-widest font-bold mt-2 relative z-10 text-center">
                 {fileName ? 'Haz clic para cambiar' : 'o haz clic para explorar (.mp4, .jpg, .png)'}
              </p>
           </div>
           {isUploading && (
             <div className="mt-4 space-y-2">
               <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                 <div 
                   className="bg-gradient-to-r from-[#7C3CFF] to-[#2BC8FF] h-full transition-all duration-300 shadow-[0_0_10px_rgba(43,200,255,0.8)]" 
                   style={{ width: `${uploadProgress}%` }}
                 />
               </div>
               <p className="text-[9px] text-[#2BC8FF] font-mono text-right uppercase tracking-widest">
                 {uploadProgress}%
               </p>
             </div>
           )}
        </div>

        {/* SCREEN SELECTOR MARKETPLACE */}
        <div className="flex flex-col gap-4 mt-6">
           <div className="flex items-center justify-between">
             <Label className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Marketplace de Pantallas</Label>
             <select 
               value={selectedCity} 
               onChange={(e) => setSelectedCity(e.target.value)}
               className="bg-white/5 border border-white/10 text-white text-xs rounded-lg px-3 py-1 focus:outline-none focus:border-[#2BC8FF]/50"
             >
               <option value="todas">Todas las ciudades</option>
               {uniqueCities.map(city => (
                 <option key={city} value={city}>{city}</option>
               ))}
             </select>
           </div>
           
           {isPremium ? (
              <div className="h-[500px] rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_20px_rgba(124,60,255,0.1)]">
                 <MapSelector 
                    pantallas={pantallas} 
                    onTogglePantalla={toggleScreen}
                    selectedIds={selectedMapScreens}
                 />
              </div>
           ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {pantallas.filter(p => selectedCity === 'todas' || p.ciudad === selectedCity).length === 0 ? (
                    <div className="col-span-full p-8 text-center text-zinc-500 border border-white/10 bg-white/5 rounded-2xl">No hay pantallas disponibles en esta ciudad.</div>
                 ) : (
                    pantallas.filter(p => selectedCity === 'todas' || p.ciudad === selectedCity).map((pantalla) => {
                       const isSelected = selectedMapScreens.includes(pantalla.id)
                       const isHighDemand = pantalla.precio_emision > (pantalla.precio_base || 50)
                       
                       return (
                          <div 
                             key={pantalla.id}
                             className={`
                                p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group
                                ${isSelected 
                                   ? 'border-[#2BC8FF] bg-[#2BC8FF]/10 shadow-[0_0_20px_rgba(43,200,255,0.2)]' 
                                   : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 cursor-pointer'
                                }
                             `}
                          >
                             {/* Selected Glow */}
                             {isSelected && <div className="absolute -top-10 -right-10 w-20 h-20 bg-[#2BC8FF]/30 blur-2xl rounded-full pointer-events-none" />}
                             
                             <div className="flex justify-between items-start mb-3 relative z-10" onClick={!isSelected ? () => toggleScreen(pantalla.id) : undefined}>
                                <div className={isSelected ? 'cursor-pointer' : ''} onClick={isSelected ? () => toggleScreen(pantalla.id) : undefined}>
                                   <h3 className="text-white font-bold text-sm uppercase tracking-tight hover:text-[#2BC8FF] transition-colors">{pantalla.nombre}</h3>
                                   <div className="flex items-center gap-1 text-zinc-400 text-[10px] uppercase font-mono mt-1">
                                      <MapPin className="w-3 h-3" /> {pantalla.ciudad}
                                   </div>
                                </div>
                                <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${isHighDemand ? 'bg-[#7C3CFF]/20 text-[#C94BFF] border-[#7C3CFF]/30' : 'bg-white/10 text-zinc-300 border-white/10'}`}>
                                   {isHighDemand ? 'Premium' : 'Standard'}
                                </div>
                             </div>
                             
                             <div className="flex items-end justify-between relative z-10 mt-6" onClick={!isSelected ? () => toggleScreen(pantalla.id) : undefined}>
                                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                                   Precio por Impacto
                                </div>
                                <div className="text-lg font-black font-mono text-white tracking-tighter flex items-center gap-1">
                                   {((pantalla.precio_base_impacto ?? 0.05) * (1 + (pantalla.comision_markup_porcentaje ?? 30) / 100)).toFixed(3)} <span className="text-[#2BC8FF] text-xs">€/Impacto</span>
                                </div>
                             </div>

                             {isSelected && (
                               <div className="mt-4 pt-4 border-t border-[#2BC8FF]/20 relative z-10">
                                 <div className="flex justify-between items-center mb-2">
                                   <Label className="text-[9px] uppercase font-bold tracking-widest text-[#2BC8FF]">Prioridad / Peso</Label>
                                   <span className="text-xs font-mono text-white">{screenWeights[pantalla.id] || 1}/10</span>
                                 </div>
                                 <input 
                                   type="range" 
                                   min="1" 
                                   max="10" 
                                   step="1"
                                   value={screenWeights[pantalla.id] || 1}
                                   onChange={(e) => setScreenWeights(prev => ({ ...prev, [pantalla.id]: parseInt(e.target.value) }))}
                                   className="w-full accent-[#2BC8FF]"
                                 />
                               </div>
                             )}
                          </div>
                       )
                    })
                 )}
              </div>
           )}
        </div>

      </div>

      {/* RIGHT COLUMN: Sticky Budget Summary */}
      <div className="w-full lg:w-[380px] shrink-0">
         <div className="sticky top-28 bg-[#04060F]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.02] before:to-transparent before:pointer-events-none">
            
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-[#7C3CFF] via-[#C94BFF] to-[#2BC8FF]" />

            <div>
               <h3 className="text-[11px] text-zinc-400 uppercase font-black tracking-[0.2em] mb-6 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#C94BFF]" /> Configuración Smart
               </h3>
               
               <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-end mb-2">
                     <Label className="text-zinc-300 font-bold uppercase tracking-widest text-[10px]">Inversión Total (€)</Label>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={presupuestoTotal || ''}
                    onChange={(e) => setPresupuestoTotal(parseFloat(e.target.value) || 0)}
                    className={`bg-white/5 border-white/10 text-white h-14 rounded-xl px-4 text-2xl font-mono font-black transition-colors focus:border-[#C94BFF]/50 ${presupuestoTotal > walletBalance ? 'border-red-500/50 text-red-400 focus:border-red-500' : ''}`}
                    placeholder="Ej. 150.50"
                  />
                  {presupuestoTotal > walletBalance && (
                     <div className="flex flex-col gap-2 mt-2">
                        <p className="text-[9px] text-red-400 font-bold uppercase tracking-widest flex items-center gap-1">
                           ⚠️ Saldo insuficiente en billetera (Máx. {walletBalance.toLocaleString('es-ES')}€)
                        </p>
                        <Link href="/dashboard/billetera?returnTo=/dashboard/nueva" className="self-start">
                           <Button type="button" size="sm" className="bg-[#2BC8FF] hover:bg-[#2BC8FF]/80 text-black text-[9px] uppercase font-black tracking-widest px-3 h-7 rounded shadow-[0_0_10px_rgba(43,200,255,0.2)] border-none">
                              Recargar Saldo
                           </Button>
                        </Link>
                     </div>
                  )}
               </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-white/10 pt-6">
               <div className="flex justify-between items-end mb-2">
                  <Label className="text-zinc-300 font-bold uppercase tracking-widest text-[10px]">Duración Detectada</Label>
               </div>
               <div className="bg-white/5 border border-white/10 rounded-xl h-12 flex items-center px-4 justify-between">
                   <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Longitud de Archivo</span>
                   <span className="text-xl font-mono text-[#2BC8FF] font-black tracking-tighter">{duracion}s</span>
               </div>
            </div>

            <div className="bg-gradient-to-br from-[#7C3CFF]/10 to-[#2BC8FF]/10 border border-[#2BC8FF]/20 rounded-2xl p-6 mt-2 relative overflow-hidden flex flex-col items-center justify-center text-center">
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2BC8FF]/20 via-transparent to-transparent opacity-50" />
               <span className="text-[#2BC8FF] text-[10px] uppercase tracking-[0.2em] font-black mb-2 relative z-10">Retorno Estimado</span>
               {impactosEstimados > 0 ? (
                  <>
                     <span className="text-6xl font-mono text-white font-black tracking-tighter drop-shadow-[0_0_15px_rgba(43,200,255,0.4)] relative z-10">
                         {impactosEstimados.toLocaleString('es-ES')}
                     </span>
                     <span className="text-zinc-300 font-bold text-[10px] uppercase tracking-widest mt-2 relative z-10">Impactos Garantizados</span>
                  </>
               ) : (
                  <span className="text-zinc-500 text-sm font-mono relative z-10 py-4">Esperando configuración...</span>
               )}
            </div>

            <Button 
               type="submit" 
               disabled={isLoading || presupuestoTotal > walletBalance || selectedMapScreens.length === 0}
               className="w-full h-16 rounded-2xl bg-gradient-to-r from-[#7C3CFF] via-[#C94BFF] to-[#2BC8FF] text-white font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(124,60,255,0.3)] hover:shadow-[0_0_30px_rgba(43,200,255,0.5)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none border-none"
            >
               {isLoading ? (isUploading ? 'Subiendo Media...' : 'Procesando IA...') : 'Pagar con Saldo'}
            </Button>
         </div>
      </div>
    </form>
  )
}
