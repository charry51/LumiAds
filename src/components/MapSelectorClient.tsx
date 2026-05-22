'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icons in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom Icon for Selected Screen
const selectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

type Pantalla = {
  id: string
  nombre: string
  ubicacion: string
  ciudad: string
  latitud: number | null
  longitud: number | null
  precio_emision?: number
  precio_base?: number
}

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

function LocationMarker({ onSelect, externalPosition }: { onSelect?: (lat: number, lng: number) => void, externalPosition?: {lat: number, lng: number} | null }) {
  const [position, setPosition] = useState<[number, number] | null>(null)
  const map = useMap()

  // Sincronizar vuelo si el prop externalPosition cambia (búsqueda automática)
  useEffect(() => {
    if (externalPosition && isFinite(externalPosition.lat) && isFinite(externalPosition.lng)) {
      const newPos: [number, number] = [externalPosition.lat, externalPosition.lng]
      setPosition(newPos)
      map.flyTo(newPos, 15) // Zoom más cercano al buscar
    }
  }, [externalPosition, map])

  useMapEvents({
    click(e) {
      if (onSelect) {
        // Al hacer clic, actualiza su propio estado que sobreescribe la busqueda
        setPosition([e.latlng.lat, e.latlng.lng])
        onSelect(e.latlng.lat, e.latlng.lng)
        map.flyTo(e.latlng, map.getZoom())
      }
    },
  })

  return position === null ? null : (
    <Marker position={position} icon={selectedIcon}>
      <Popup>📍 Ubicación seleccionada para tu TV</Popup>
    </Marker>
  )
}

export interface MapSelectorProps {
  pantallas?: Pantalla[]
  onTogglePantalla?: (id: string) => void
  selectedIds?: string[]
  onSelect?: (lat: number, lng: number) => void
  externalPosition?: { lat: number; lng: number } | null
}

export default function MapSelectorClient({ 
  pantallas = [], 
  onTogglePantalla,
  selectedIds = [],
  onSelect,
  externalPosition
}: MapSelectorProps) {
  // Centro aproximado de España por defecto
  const [center, setCenter] = useState<[number, number]>([40.4168, -3.7038])

  // Centrar el mapa en la primera pantalla disponible con coordenadas
  useEffect(() => {
    if (Array.isArray(pantallas) && pantallas.length > 0) {
      const p = pantallas.find(p => p.latitud && p.longitud)
      if (p && p.latitud && p.longitud) {
        setCenter([p.latitud, p.longitud])
      }
    }
  }, [pantallas])

  const pantallasConGeo = (Array.isArray(pantallas) ? pantallas : []).filter(p => p.latitud !== null && p.longitud !== null)

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer center={center} zoom={6} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        {!onSelect && <ChangeView center={center} zoom={6} />}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {onSelect && <LocationMarker onSelect={onSelect} externalPosition={externalPosition} />}

        {pantallasConGeo.map((pantalla) => {
          const isSelected = selectedIds.includes(pantalla.id)
          const isHighDemand = (pantalla.precio_emision || 0) > (pantalla.precio_base || 50)
          
          return (
            <Marker 
              key={pantalla.id} 
              position={[pantalla.latitud!, pantalla.longitud!]}
              icon={isSelected ? selectedIcon : new L.Icon.Default()}
              eventHandlers={{
                  click: () => {
                      onTogglePantalla?.(pantalla.id)
                  },
              }}
            >
              <Popup>
                <div className="text-sm font-sans dark:text-zinc-900 min-w-[120px]">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <p className="font-bold uppercase text-[11px] leading-tight">{pantalla.nombre}</p>
                    {isHighDemand && (
                      <span className="text-[8px] bg-yellow-500 text-black px-1 py-0.5 rounded font-black whitespace-nowrap">
                        ⚡ ALTA
                      </span>
                    )}
                  </div>
                  <p className="opacity-60 text-[10px] uppercase font-mono">{pantalla.ciudad}</p>
                  
                  <button 
                    type="button"
                    onClick={() => onTogglePantalla?.(pantalla.id)}
                    className={`mt-3 w-full px-2 py-1.5 flex items-center justify-center rounded text-[10px] font-black uppercase transition-colors ${
                      isSelected 
                        ? 'bg-red-50 text-red-600 border border-red-200 shadow-sm' 
                        : 'bg-zinc-950 text-white hover:bg-black shadow-md'
                    }`}
                  >
                    {isSelected ? 'Desmarcar' : 'Seleccionar'}
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
