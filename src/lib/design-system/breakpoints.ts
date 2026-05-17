'use client'

import { useState, useEffect } from 'react'

// ── Breakpoint values ──
export const breakpoints = {
  mobile: 0,     // 0 - 639px
  tablet: 640,   // 640 - 1023px
  desktop: 1024, // 1024+
} as const

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

// ── Hook: detect current device ──
export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop')

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth
      if (w < 640) setDeviceType('mobile')
      else if (w < 1024) setDeviceType('tablet')
      else setDeviceType('desktop')
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return deviceType
}

// ── Hook: check if mobile ──
export function useIsMobile(): boolean {
  const device = useDeviceType()
  return device === 'mobile'
}
