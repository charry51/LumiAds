'use client'
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generatePairingCode, checkPairingStatus } from './actions'

// Generar un ID de dispositivo persistente (se guarda en localStorage)
function getDeviceId(): string {
  if (typeof window === 'undefined') return ''
  const key = 'LuminAdd_device_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

export default function VincularPage() {
  const router = useRouter()
  const [code, setCode] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutos
  const [status, setStatus] = useState<'localizando' | 'denegado' | 'esperando' | 'vinculado' | 'expirado'>('localizando')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [pantallaId, setPantallaId] = useState<string | null>(null)

  const initPairing = useCallback(async (lat?: number, lng?: number) => {
    const deviceId = getDeviceId()
    
    // Capturar telemetría del dispositivo (Anti-Fraude)
    const resolucion = `${window.screen.width}x${window.screen.height}`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const maxTouchPoints = navigator.maxTouchPoints || (navigator as any).msMaxTouchPoints || 0
    const esTactil = maxTouchPoints > 0

    // Algoritmo de Estimación de Pulgadas (App Detection)
    let inches = 40 // Default: Standard Digital Signage TV
    
    const logicalDiagonal = Math.sqrt(Math.pow(window.screen.width, 2) + Math.pow(window.screen.height, 2))
    const isMobile = /iPhone|Android|Mobile|iPad/i.test(navigator.userAgent) || (esTactil && logicalDiagonal < 1200)
    const isTablet = esTactil && logicalDiagonal >= 1200 && logicalDiagonal < 1800

    if (isMobile) {
      inches = 6 // Estimación Smartphone
    } else if (isTablet) {
      inches = 11 // Estimación Tablet
    } else {
      // Es una TV o Monitor (Detección por resolución lógica)
      const w = window.screen.width
      const dpr = window.devicePixelRatio || 1

      if (w >= 3840) inches = 55 // 4K TV sin escalado
      else if (w >= 2560) inches = 32 // Monitor de alta gama
      else if (w >= 1920 && dpr === 1) inches = 43 // TV / Signage estándar (no escalada)
      else if (w >= 1920) inches = 27 // Monitor de oficina con escalado
      else if (w >= 1440) inches = 24 // Monitor estándar
      else if (w >= 1280) inches = 15 // Laptop típico
      else inches = 13 // Ultrabook / Pequeño
    }

    const result = await generatePairingCode(deviceId, lat, lng, resolucion, esTactil, inches)
    if ('code' in result) {
      setCode(result.code)
      localStorage.setItem('LuminAdd_latest_pairing_code', result.code)
      setTimeLeft(600)
      setStatus('esperando')
    }
  }, [])

  // 1. Solicitar Geolocalización Obligatoria (Forzando lectura fresca)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!navigator.geolocation) {
       setStatus('denegado')
       return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setCoords({ lat: latitude, lng: longitude })
        initPairing(latitude, longitude)
      },
      (err) => {
        console.error("Geo error:", err)
        setStatus('denegado')
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000,
        maximumAge: 0 // Evita usar caché del GPS
      }
    )
  }, [initPairing])

  // Cuenta atrás
  useEffect(() => {
    if (status !== 'esperando') return
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setStatus('expirado')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [status])

  // Polling: comprobar si la TV ya fue vinculada (cada 3 seg)
  useEffect(() => {
    if (status !== 'esperando') return
    const poll = setInterval(async () => {
      const deviceId = getDeviceId()
      const result = await checkPairingStatus(deviceId)
      if (result.estado === 'vinculado' && result.pantallaId) {
        setStatus('vinculado')
        setPantallaId(result.pantallaId)
        clearInterval(poll)
        // Redirigir al player en 2 segundos
        setTimeout(() => {
          router.push(`/player/${result.pantallaId}`)
        }, 2500)
      } else if (result.estado === 'expirado') {
        setStatus('expirado')
        clearInterval(poll)
      }
    }, 3000)
    return () => clearInterval(poll)
  }, [status, router])

  const mins = Math.floor(timeLeft / 60)
  const secs = String(timeLeft % 60).padStart(2, '0')

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Botón de volver */}
      <div className="absolute top-8 left-8 z-50">
        <Link href="/dashboard">
          <Button variant="ghost" className="text-zinc-500 hover:text-white flex gap-2 items-center text-[10px] uppercase font-bold tracking-widest">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
        </Link>
      </div>

      {/* Fondo decorativo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,60,255,0.05)_0%,transparent_70%)]" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#7C3CFF] to-transparent opacity-60" />

      <div className="relative z-10 flex flex-col items-center gap-8 text-center px-8">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-4">
          <img src="/LogoPequeno.png" alt="LuminAdd" className="h-14 w-auto" />
          <span className="text-4xl font-black text-white tracking-[0.2em] uppercase"
            style={{ fontFamily: 'var(--font-heading)' }}>
            LumiAds
          </span>
        </div>

        <p className="text-zinc-400 text-xl uppercase tracking-[0.3em] text-sm">
          Vincula esta pantalla a tu cuenta
        </p>

        {/* Estado: LOCALIZANDO */}
        {status === 'localizando' && (
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 border-4 border-[#7C3CFF]/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-[#7C3CFF] rounded-full border-t-transparent animate-spin" />
              <div className="absolute inset-4 bg-[#7C3CFF]/5 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 bg-[#7C3CFF] rounded-full animate-pulse shadow-[0_0_20px_#7C3CFF]" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-white text-2xl font-black uppercase tracking-tighter">Localizando Pantalla</h3>
              <p className="text-zinc-500 text-sm max-w-xs mx-auto">Verificando presencia física para cumplir con las normativas de monetización publicitaria.</p>
            </div>
          </div>
        )}

        {/* Estado: DENEGADO */}
        {status === 'denegado' && (
          <div className="flex flex-col items-center gap-6">
            <div className="w-24 h-24 bg-red-500/10 border-2 border-red-500/30 rounded-full flex items-center justify-center">
              <span className="text-5xl">📍</span>
            </div>
            <div className="space-y-4">
              <h3 className="text-red-500 text-2xl font-black uppercase tracking-tighter">Ubicación Obligatoria</h3>
              <p className="text-zinc-400 text-base max-w-md">No podemos vincular esta pantalla sin verificar su ubicación real. Es un requisito de seguridad para los anunciantes.</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition-all"
              >
                Reintentar y Permitir GPS
              </button>
            </div>
          </div>
        )}

        {/* Estado: ESPERANDO */}
        {status === 'esperando' && (
          <>
            <div className="flex items-center gap-3 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-500 text-[10px] uppercase font-black tracking-widest">Ubicación Verificada: {coords?.lat.toFixed(4)}, {coords?.lng.toFixed(4)}</span>
            </div>
            <p className="text-zinc-500 text-base mb-2">
              Desde tu panel de control, ve a <strong className="text-white">Añadir Pantalla → Vincular TV</strong> y escribe:
            </p>

            {/* Código grande para ver desde lejos */}
            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-[#7C3CFF]/20 rounded-full" />
              <div className="relative bg-zinc-900/80 border-2 border-[#7C3CFF]/40 rounded-2xl px-16 py-8 backdrop-blur-sm shadow-[0_0_60px_rgba(124,60,255,0.1)]">
                <span className="text-8xl font-black text-white tracking-[0.3em]"
                  style={{ fontFamily: 'var(--font-mono)' }}>
                  {code || '···'}
                </span>
              </div>
            </div>

            {/* Cuenta atrás */}
            <div className="flex items-center gap-2 text-zinc-600 text-sm font-mono mt-4">
              <div className="w-2 h-2 bg-[#7C3CFF] rounded-full animate-pulse" />
              Este código caduca en{' '}
              <span className="text-[#7C3CFF] font-bold">{mins}:{secs}</span>
            </div>

            <p className="text-zinc-700 text-[10px] uppercase tracking-[0.4em] mt-4 font-black">
              LumiAds v3.0 · SMART GEOLOCATION LOCKED
            </p>
          </>
        )}

        {/* Estado: VINCULADO */}
        {status === 'vinculado' && (
          <>
            <div className="text-8xl mb-4">✅</div>
            <h2 className="text-5xl font-black text-white uppercase tracking-tight">
              ¡Vinculada!
            </h2>
            <p className="text-zinc-400 text-xl">
              Esta pantalla ya es parte de tu red LumiAds.
            </p>
            <div className="flex items-center gap-2 text-[#7C3CFF] font-mono animate-pulse">
              <div className="w-2 h-2 bg-[#7C3CFF] rounded-full animate-pulse" />
              Iniciando reproductor...
            </div>
          </>
        )}

        {/* Estado: EXPIRADO */}
        {status === 'expirado' && (
          <>
            <div className="text-8xl mb-4">⏱️</div>
            <h2 className="text-5xl font-black text-white uppercase tracking-tight">
              Código expirado
            </h2>
            <p className="text-zinc-400 text-xl mb-6">
              El código ha caducado. Genera uno nuevo.
            </p>
            <button
              onClick={() => initPairing()}
              className="bg-[#7C3CFF] hover:bg-[#00bbdd] text-black font-black px-12 py-4 rounded-xl text-xl uppercase tracking-widest transition-all"
            >
              Generar nuevo código
            </button>
          </>
        )}
      </div>

      {/* Instrucciones inferiores */}
      {status === 'esperando' && (
        <div className="absolute bottom-8 flex items-center gap-8 text-zinc-700 text-[10px] uppercase tracking-widest font-mono">
          <span>1. Abre LumiAds.app en tu ordenador</span>
          <span className="text-zinc-800">|</span>
          <span>2. Ve a Pantallas → Vincular TV</span>
          <span className="text-zinc-800">|</span>
          <span>3. Introduce el código de arriba</span>
        </div>
      )}
    </div>
  )
}



