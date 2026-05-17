'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ─── Custom markers ───
const storeIcon = new L.DivIcon({
  html: `<div style="width:32px;height:32px;background:#ef4444;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

const userIcon = new L.DivIcon({
  html: `<div style="width:20px;height:20px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 6px rgba(59,130,246,0.25),0 2px 8px rgba(0,0,0,0.2)"></div>`,
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

// ─── Auto-fit bounds ───
function FitBounds({ storePos, userPos }: { storePos: { lat: number; lng: number }; userPos: { lat: number; lng: number } | null }) {
  const map = useMap()

  useEffect(() => {
    if (userPos) {
      const bounds = L.latLngBounds(
        [storePos.lat, storePos.lng],
        [userPos.lat, userPos.lng]
      )
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 })
    } else {
      map.setView([storePos.lat, storePos.lng], 16)
    }
  }, [map, storePos, userPos])

  return null
}

type Props = {
  storePos: { lat: number; lng: number }
  userPos: { lat: number; lng: number } | null
  radius: number
  storeName: string
}

export default function CheckinMap({ storePos, userPos, radius }: Props) {
  return (
    <MapContainer
      center={[storePos.lat, storePos.lng]}
      zoom={16}
      scrollWheelZoom={false}
      zoomControl={false}
      attributionControl={false}
      dragging={true}
      style={{ width: '100%', height: '100%' }}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Store marker */}
      <Marker position={[storePos.lat, storePos.lng]} icon={storeIcon} />

      {/* Radius circle */}
      <Circle
        center={[storePos.lat, storePos.lng]}
        radius={radius}
        pathOptions={{
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.08,
          weight: 2,
          dashArray: '6 4',
        }}
      />

      {/* User marker */}
      {userPos && (
        <Marker position={[userPos.lat, userPos.lng]} icon={userIcon} />
      )}

      <FitBounds storePos={storePos} userPos={userPos} />
    </MapContainer>
  )
}
