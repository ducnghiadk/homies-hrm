'use client'

import { useState } from 'react'
import { getAllWifiSSIDs } from '@/lib/mock-data-wifi'
import { getStoreById } from '@/lib/mock-data'
import { Wifi, WifiOff, ChevronDown } from 'lucide-react'

type SimulatedWifi = {
  ssid: string
  bssid?: string
} | null

type Props = {
  onWifiChange: (wifi: SimulatedWifi) => void
  currentWifi: SimulatedWifi
}

export default function WifiSimulator({ onWifiChange, currentWifi }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  const allWifi = getAllWifiSSIDs()

  const options = [
    { label: 'Không kết nối WiFi', value: 'none' },
    ...allWifi.map(w => {
      const store = getStoreById(w.storeId)
      return {
        label: `${w.ssid} (${store?.name ?? w.storeId})`,
        value: w.ssid,
      }
    }),
    { label: 'WiFi khác (không phải cửa hàng)', value: 'other' },
  ]

  const handleSelect = (value: string) => {
    setIsOpen(false)
    if (value === 'none') {
      onWifiChange(null)
    } else if (value === 'other') {
      onWifiChange({ ssid: 'HomeWiFi_Personal' })
    } else {
      onWifiChange({ ssid: value })
    }
  }

  return (
    <div className="relative">
      {/* Label */}
      <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
        <span className="bg-warning-100 text-warning-600 px-1.5 py-0.5 rounded text-[9px] font-bold">DEMO</span>
        WiFi đang kết nối (giả lập)
      </p>

      {/* Dropdown trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 bg-vanilla-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-left transition-colors hover:bg-primary-50"
      >
        {currentWifi ? (
          <Wifi size={14} className="text-primary-500 shrink-0" />
        ) : (
          <WifiOff size={14} className="text-gray-400 shrink-0" />
        )}
        <span className="flex-1 truncate text-dark-700">
          {currentWifi ? currentWifi.ssid : 'Không kết nối WiFi'}
        </span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in">
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 hover:bg-vanilla-50 transition-colors ${
                (currentWifi?.ssid === opt.value || (!currentWifi && opt.value === 'none'))
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-dark-700'
              }`}
            >
              {opt.value === 'none' ? (
                <WifiOff size={14} className="text-gray-400" />
              ) : (
                <Wifi size={14} className="text-primary-500" />
              )}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
