'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { logPlayback } from '../actions'
import { createClient } from '@/lib/supabase/client'

type CampaignItem = {
  id: string;
  url_video: string;
  hora_inicio: string;
  hora_fin: string;
  prioridad: number;
  dias_semana?: number[];
}

const OFFLINE_LOG_KEY = 'LuminAdd_offline_logs'

function getOfflineLogs(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(OFFLINE_LOG_KEY) || '[]') } catch { return [] }
}

function addOfflineLog(campaignId: string, screenId: string) {
  const logs = getOfflineLogs()
  logs.push(JSON.stringify({ campaignId, screenId, ts: Date.now() }))
  localStorage.setItem(OFFLINE_LOG_KEY, JSON.stringify(logs))
}

function clearOfflineLogs() {
  localStorage.removeItem(OFFLINE_LOG_KEY)
}

export default function PlaylistRunner({ screenId, playlist }: { screenId: string, playlist: CampaignItem[] }) {
  const [currentCampaign, setCurrentCampaign] = useState<CampaignItem | null>(null)
  const [hasHydrated, setHasHydrated] = useState(false)
  const [cachedUrls, setCachedUrls] = useState<Record<string, string>>({})
  const [isOnline, setIsOnline] = useState(true)
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [cacheStatus, setCacheStatus] = useState<'idle' | 'caching' | 'ready'>('idle')
  const sessionId = useRef(typeof window !== 'undefined' ? crypto.randomUUID() : '')
  const videoRef = useRef<HTMLVideoElement>(null)
  const supabase = createClient()

  // --- ELASTIC ENGINE: Weighted Selection ---
  const getNextCampaign = useCallback((pool: CampaignItem[], currentId?: string) => {
    if (pool.length === 0) return null
    if (pool.length === 1) return pool[0]

    // 1. Filter by valid time range and days of week
    const now = new Date()
    const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, ...
    const currentMins = now.getHours() * 60 + now.getMinutes()
    
    let validPool = pool.filter(c => {
        // Check days of week
        if (c.dias_semana && Array.isArray(c.dias_semana) && c.dias_semana.length > 0) {
            if (!c.dias_semana.includes(currentDay)) return false
        }

        if (!c.hora_inicio || !c.hora_fin) return true
        const [hI, mI] = c.hora_inicio.split(':').map(Number)
        const [hF, mF] = c.hora_fin.split(':').map(Number)
        return currentMins >= (hI * 60 + (mI || 0)) && currentMins <= (hF * 60 + (mF || 0))
    })

    if (validPool.length === 0) return null

    // 1.5. Prevent back-to-back repeats if possible
    if (validPool.length > 1 && currentId) {
       validPool = validPool.filter(c => c.id !== currentId)
    }

    // 2. Weight-based random pick (Share of Voice)
    const totalWeight = validPool.reduce((sum, c) => sum + (c.prioridad || 1), 0)
    let random = Math.random() * totalWeight
    
    for (const campaign of validPool) {
        random -= (campaign.prioridad || 1)
        if (random <= 0) return campaign
    }
    
    return validPool[0]
  }, [])

  // 1. Service Worker Registration
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => console.log('[LuminAdd] SW Registered:', reg.scope))
        .catch((err) => console.error('[LuminAdd] SW Error:', err))
    }
  }, [])

  // 2. Connectivity & Sync
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      const pendingLogs = getOfflineLogs()
      if (pendingLogs.length > 0) {
        for (const logStr of pendingLogs) {
          try {
            const { campaignId, screenId: sId } = JSON.parse(logStr)
            await logPlayback(campaignId, sId)
          } catch (e) {
            console.error('[LuminAdd] Sync Error:', e)
          }
        }
        clearOfflineLogs()
      }
    }
    const handleOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 3. Pre-caching
  useEffect(() => {
    setHasHydrated(true)
    if (playlist.length === 0) return

    const preloadMedia = async () => {
      setCacheStatus('caching')
      const newCachedUrls: Record<string, string> = {}
      const cache = await caches.open('LuminAdd-media-v3')

      for (const item of playlist) {
        if (!item.url_video) continue
        try {
          let response = await cache.match(item.url_video)
          if (!response) {
            try {
              await cache.add(item.url_video)
              response = await cache.match(item.url_video)
            } catch {
              newCachedUrls[item.url_video] = item.url_video
              continue
            }
          }
          if (response) {
            const blob = await response.blob()
            newCachedUrls[item.url_video] = URL.createObjectURL(blob)
          }
        } catch {
          newCachedUrls[item.url_video] = item.url_video
        }
      }

      setCachedUrls(newCachedUrls)
      setCacheStatus('ready')
      
      // Initialize first campaign if not set
      if (!currentCampaign) {
          setCurrentCampaign(getNextCampaign(playlist))
      }
    }

    preloadMedia()
  }, [playlist, getNextCampaign, currentCampaign])

  // 4. Presence & Anti-Duplication
  useEffect(() => {
    if (!screenId || !hasHydrated) return
    
    // Channel name must be screen-specific for performance and isolation
    const channel = supabase.channel(`player_session:${screenId}`, {
      config: { presence: { key: screenId } }
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const presences = state[screenId] || []
        
        if (presences.length > 1) {
          // Logic: The most recent session (highest online_at) wins.
          // This handles reloads gracefully.
          const sorted = [...presences] as any[]
          sorted.sort((a, b) => (b.online_at || 0) - (a.online_at || 0))
          const latestSession = sorted[0]?.sessionId
          
          if (sessionId.current !== latestSession) {
            console.warn('[LuminAdd Security] Duplicate session detected. This instance is now inactive.')
            setIsDuplicate(true)
          }
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ 
            sessionId: sessionId.current, 
            online_at: Date.now(), 
            status: isOnline ? 'playing' : 'offline' 
          })
        }
      })

    return () => { channel.unsubscribe() }
  }, [screenId, supabase, isOnline, hasHydrated])

  // 5. Playback Switcher
  const handleNext = useCallback(async () => {
    if (currentCampaign?.id) {
      if (isOnline) {
        logPlayback(currentCampaign.id, screenId).catch(() => addOfflineLog(currentCampaign.id, screenId))
      } else {
        addOfflineLog(currentCampaign.id, screenId)
      }
    }
    
    // Pick next campaign
    const next = getNextCampaign(playlist, currentCampaign?.id)
    
    // If it's the same campaign (single item loop)
    if (next && currentCampaign && next.id === currentCampaign.id) {
      // Force React to re-trigger the image timer by doing a shallow clone
      // or if it's a video, restart the video.
      const isImg = /\.(jpg|jpeg|png|webp|gif)(?:\?.*)?$/i.test(next.url_video)
      if (isImg) {
        setCurrentCampaign({ ...next }) // trigger re-render for image timer
      } else if (videoRef.current) {
        videoRef.current.currentTime = 0
        videoRef.current.play().catch(e => console.warn('[LuminAdd] Loop play blocked:', e))
      }
    } else {
      setCurrentCampaign(next)
    }
  }, [currentCampaign, playlist, screenId, isOnline, getNextCampaign])

  // Autoplay & Visibility checks (Anti-Fraud)
  useEffect(() => {
    if (videoRef.current && hasHydrated) {
      // Intentar reproducir si es visible
      if (!document.hidden) {
        videoRef.current.play().catch(e => console.warn('Autoplay blocked:', e))
      }
    }
  }, [currentCampaign, hasHydrated])

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return

    const handleVisibilityChange = () => {
      if (!videoRef.current) return
      if (document.hidden) {
        console.log('[LuminAdd Anti-Fraud] Pantalla oculta, pausando reproducción.')
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch(e => console.warn(e))
      }
    }

    const handleBlur = () => {
      if (videoRef.current) videoRef.current.pause()
    }

    const handleFocus = () => {
      if (videoRef.current && !document.hidden) {
        videoRef.current.play().catch(e => console.warn(e))
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
    }
  }, [hasHydrated])

  const isImage = currentCampaign?.url_video ? /\.(jpg|jpeg|png|webp|gif)(?:\?.*)?$/i.test(currentCampaign.url_video) : false
  const activeUrl = currentCampaign ? (cachedUrls[currentCampaign.url_video] || currentCampaign.url_video) : null

  // Image Rotation
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isImage && currentCampaign && hasHydrated) {
      // Removed document.hidden check from timer start to ensure images always rotate
      // even if tab is in background (less critical than video autoplay)
      timer = setTimeout(handleNext, 10000)
    }
    return () => { if (timer) clearTimeout(timer) }
  }, [currentCampaign, isImage, hasHydrated, handleNext])

  if (!hasHydrated) return <div className="w-screen h-screen bg-[#0a0a0f]" />

  if (isDuplicate) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0f] text-white p-12 text-center">
        <div className="border border-red-500/30 bg-red-500/5 p-12 max-w-2xl rounded-xl backdrop-blur-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
             <span className="text-red-500 text-2xl font-bold">!</span>
          </div>
          <h1 className="text-3xl font-heading mb-4 text-red-500 font-black uppercase tracking-tighter">Sesión Duplicada</h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Esta pantalla ya se está reproduciendo en otro dispositivo o pestaña. 
            <br/><br/>
            Por seguridad y para garantizar la precisión de las métricas, solo permitimos una instancia activa por ID de pantalla.
          </p>
          <div className="mt-8 pt-8 border-t border-white/5">
             <p className="text-[10px] text-zinc-600 uppercase font-mono">Screen ID: {screenId}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentCampaign) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0f] text-white p-12 text-center">
        <div className="landing-glass-ui p-12 max-w-2xl border-dashed border-2 animate-pulse-gold">
          <img src="/LogoTexto.png" alt="LuminAdd" className="h-12 w-auto inline-block text-6xl font-heading mb-6 text-gradient-ui font-black" />
          <h2 className="text-2xl font-sans text-white/40 uppercase tracking-widest">Available Space</h2>
          <p className="mt-8 text-zinc-500 font-mono text-xs uppercase tracking-tighter">Waiting for programmatic auctions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-black relative flex items-center justify-center">
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="absolute top-6 left-6 z-50 flex items-center gap-3 bg-black/80 border border-[#7C3CFF]/40 px-4 py-2 rounded-full backdrop-blur-md shadow-lg">
          <span className="w-2 h-2 rounded-full bg-[#7C3CFF] animate-pulse" />
          <span className="text-[#7C3CFF] text-[10px] font-bold uppercase tracking-wider">OFFLINE MODE ACTIVE</span>
        </div>
      )}

      {/* Media Content */}
      <div className="w-full h-full flex items-center justify-center animate-in fade-in duration-1000">
        {isImage ? (
            activeUrl && <img src={activeUrl} alt="Campaign" className="w-full h-full object-contain shadow-2xl" />
        ) : (
            activeUrl && (
            <video
                ref={videoRef}
                key={activeUrl}
                src={activeUrl}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain"
                onEnded={handleNext}
                onError={() => {
                console.error('[LuminAdd] Error:', activeUrl)
                handleNext()
                }}
            />
            )
        )}
      </div>

      {/* Cyber Overlay Details (Lux branding) */}
      <div className="absolute bottom-6 right-6 opacity-30 hover:opacity-100 transition-opacity">
         <img src="/LogoTexto.png" alt="LuminAdd" className="h-5 w-auto inline-block text-gradient-ui font-black text-xl tracking-tighter" /> <span className="text-[10px] opacity-50"> v2</span>
      </div>
    </div>
  )
}



