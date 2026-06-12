'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

export function ActiveScreensMonitor() {
  const [onlineCount, setOnlineCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    // Escuchar cualquier canal que empiece por screen_ (esto requiere que RLS deje ver presence, 
    // pero presence suele ser abierto o manejado por supabase configs. 
    // Para simplificar, nos conectaremos un canal global 'system_status' donde los screens reportan, 
    // o iteramos canales, pero 'presence' es un único canal compartido a veces.
    // Vamos a usar un canal compartido 'LuminAddNetwork' para presence en lugar de canales únicos.
    
    const channel = supabase.channel('LuminAddNetwork')

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      // Contar cuántos dispositivos están online (keys en el state)
      const count = Object.keys(state).length
      setOnlineCount(count)
    })

    channel.subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  return (
    <Card className="bg-card border-border text-white border-l-4 border-l-green-500 shadow-soft">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-zinc-500">Pantallas Online (Realtime)</CardTitle>
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-green-400">{onlineCount}</div>
      </CardContent>
    </Card>
  )
}



