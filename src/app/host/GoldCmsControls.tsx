'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, History, Tv, Loader2, Trash2, Check, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function GoldCmsControls({ pantallaId }: { pantallaId: string }) {
  const [isMounted, setIsMounted] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [cmsFiles, setCmsFiles] = useState<string[]>([])
  const [activePlaylist, setActivePlaylist] = useState<string[]>([])
  const [currentlyPlayingIndex, setCurrentlyPlayingIndex] = useState(0)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar datos de localStorage al montar
  useEffect(() => {
    setIsMounted(true)
    const storedFiles = localStorage.getItem(`cms_files_${pantallaId}`)
    const storedPlaylist = localStorage.getItem(`active_playlist_${pantallaId}`)

    if (storedFiles) {
      setCmsFiles(JSON.parse(storedFiles))
    } else {
      const defaultFiles = ['Promo_Verano.mp4', 'Corporate_Presentation.mp4', 'Menu_Del_Dia.jpg']
      setCmsFiles(defaultFiles)
      localStorage.setItem(`cms_files_${pantallaId}`, JSON.stringify(defaultFiles))
    }

    if (storedPlaylist) {
      setActivePlaylist(JSON.parse(storedPlaylist))
    } else {
      const defaultPlaylist = ['Promo_Verano.mp4']
      setActivePlaylist(defaultPlaylist)
      localStorage.setItem(`active_playlist_${pantallaId}`, JSON.stringify(defaultPlaylist))
    }
  }, [pantallaId])

  // Efecto para simular el ciclo de reproducción entre los elementos activos
  useEffect(() => {
    if (activePlaylist.length <= 1) return

    const interval = setInterval(() => {
      setCurrentlyPlayingIndex((prev) => (prev + 1) % activePlaylist.length)
    }, 3500) // Cambia el archivo mostrado cada 3.5 segundos

    return () => clearInterval(interval)
  }, [activePlaylist])

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10 opacity-50">
        <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-xl flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
        </div>
      </div>
    )
  }

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadProgress(0)

    // Simular progreso de subida
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            const newFiles = [...cmsFiles]
            if (!newFiles.includes(file.name)) {
              newFiles.push(file.name)
              setCmsFiles(newFiles)
              localStorage.setItem(`cms_files_${pantallaId}`, JSON.stringify(newFiles))
            }
            
            // Añadir al bucle de emisión activo
            const newPlaylist = [...activePlaylist]
            if (!newPlaylist.includes(file.name)) {
              newPlaylist.push(file.name)
              setActivePlaylist(newPlaylist)
              localStorage.setItem(`active_playlist_${pantallaId}`, JSON.stringify(newPlaylist))
            }

            setCurrentlyPlayingIndex(newPlaylist.length - 1)
            setUploading(false)
            toast.success(`"${file.name}" subido e inyectado al bucle de emisión`)
          }, 400)
          return 100
        }
        return prev + 10
      })
    }, 120)
  }

  const togglePlaylistFile = (fileName: string) => {
    const isActive = activePlaylist.includes(fileName)
    if (isActive) {
      if (activePlaylist.length <= 1) {
        toast.warning('La lista de emisión debe contener al menos 1 archivo activo.')
        return
      }
      const newPlaylist = activePlaylist.filter((f) => f !== fileName)
      setActivePlaylist(newPlaylist)
      localStorage.setItem(`active_playlist_${pantallaId}`, JSON.stringify(newPlaylist))
      toast.info(`"${fileName}" quitado del bucle de emisión`)
    } else {
      const newPlaylist = [...activePlaylist, fileName]
      setActivePlaylist(newPlaylist)
      localStorage.setItem(`active_playlist_${pantallaId}`, JSON.stringify(newPlaylist))
      toast.success(`"${fileName}" añadido al bucle de emisión`)
    }
    setCurrentlyPlayingIndex(0)
  }

  const deleteFile = (fileName: string) => {
    const newFiles = cmsFiles.filter((f) => f !== fileName)
    setCmsFiles(newFiles)
    localStorage.setItem(`cms_files_${pantallaId}`, JSON.stringify(newFiles))
    toast.info(`"${fileName}" eliminado de la biblioteca`)

    const newPlaylist = activePlaylist.filter((f) => f !== fileName)
    if (newPlaylist.length === 0 && newFiles.length > 0) {
      newPlaylist.push(newFiles[0])
    }
    setActivePlaylist(newPlaylist)
    localStorage.setItem(`active_playlist_${pantallaId}`, JSON.stringify(newPlaylist))
    setCurrentlyPlayingIndex(0)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="video/*,image/*"
        className="hidden"
      />

      {/* SUBIR CONTENIDO CARD */}
      <div
        onClick={handleUploadClick}
        className="p-6 bg-zinc-950 border border-amber-500/20 hover:border-amber-500/50 transition-colors rounded-xl flex flex-col items-center justify-center text-center cursor-pointer group relative overflow-hidden"
      >
        {uploading ? (
          <>
            <div className="absolute inset-0 bg-amber-500/5 flex flex-col items-center justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500 mb-2" />
              <p className="text-[10px] font-mono text-amber-400 font-bold">Subiendo... {uploadProgress}%</p>
              <div className="w-24 h-1 bg-zinc-900 rounded-full mt-2 overflow-hidden border border-zinc-800">
                <div
                  className="h-full bg-amber-500 transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
            <div className="opacity-0">
              <div className="w-12 h-12 rounded-full mb-4">
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="text-xs">Subir</h3>
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-xs font-black uppercase text-white mb-2">Subir contenido</h3>
            <p className="text-[9px] font-mono text-zinc-500 tracking-[1px]">Sube videos o imágenes</p>
          </>
        )}
      </div>

      {/* LIBRERÍA CMS CARD */}
      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogTrigger render={
          <div className="p-6 bg-zinc-950 border border-amber-500/20 hover:border-amber-500/50 transition-colors rounded-xl flex flex-col items-center justify-center text-center cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <History className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-xs font-black uppercase text-white mb-2">Librería CMS</h3>
            <p className="text-[9px] font-mono text-zinc-500 tracking-[1px]">Organiza tus contenidos</p>
          </div>
        } />
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-amber-500 uppercase tracking-widest text-sm font-black flex items-center gap-2">
              <span>📂</span> Biblioteca de Contenidos Privados
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[300px] overflow-y-auto divide-y divide-zinc-900 pr-1 mt-4">
            {cmsFiles.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-8 italic font-mono">No hay archivos en tu biblioteca. ¡Sube tu primer contenido!</p>
            ) : (
              cmsFiles.map((file) => {
                const isActive = activePlaylist.includes(file)
                return (
                  <div key={file} className="flex items-center justify-between py-3 hover:bg-zinc-900/30 px-2 rounded-lg transition-colors">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className={`text-xs font-bold truncate ${isActive ? 'text-amber-400' : 'text-zinc-300'}`}>
                        {file}
                      </p>
                      <p className="text-[9.5px] font-mono text-zinc-600 uppercase mt-0.5">
                        {isActive ? '● Activo en bucle de emisión' : 'Contenido Offline'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => togglePlaylistFile(file)}
                        className={`h-7 px-3 rounded text-[9px] uppercase font-black tracking-widest transition-all ${
                          isActive 
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.1)]' 
                            : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        {isActive ? '✓ En bucle' : 'Programar'}
                      </button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteFile(file)}
                        className="h-7 text-red-500 hover:text-red-400 hover:bg-red-950/20 px-2.5"
                        aria-label={`Eliminar ${file}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLibraryOpen(false)}
              className="border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 text-xs uppercase"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EMISIÓN ACTUAL CARD */}
      <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-4 animate-pulse">
          <Tv className="w-6 h-6 text-amber-500" />
        </div>
        <h3 className="text-xs font-black uppercase text-amber-400 mb-2">Bucle de Emisión</h3>
        <p className="text-[9px] font-mono text-amber-500/60 tracking-[1px] truncate max-w-full px-2" title={activePlaylist[currentlyPlayingIndex]}>
          {activePlaylist[currentlyPlayingIndex] || 'Ninguno'}
        </p>
        {activePlaylist.length > 1 && (
          <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-1.5 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
            {activePlaylist.length} archivos rotando
          </p>
        )}
      </div>
    </div>
  )
}
