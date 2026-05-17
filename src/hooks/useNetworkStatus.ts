'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to detect online/offline status with event listeners.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Set initial value from browser (default true for SSR)
    setIsOnline(navigator.onLine)

    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return isOnline
}
