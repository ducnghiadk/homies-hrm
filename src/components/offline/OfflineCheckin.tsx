'use client'

import { useState, useEffect, useCallback } from 'react'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useOfflineCheckin } from '@/hooks/useOfflineSync'
import { useAuthStore } from '@/store/auth-store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import {
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  CloudOff,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type CheckinStatus = 'idle' | 'checking' | 'success' | 'error'

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

// ─────────────────────────────────────────────────────────────────────────────
// OFFLINE CHECKIN CARD
// ─────────────────────────────────────────────────────────────────────────────

interface OfflineCheckinCardProps {
  onSuccess?: (data: LocationData) => void
  className?: string
}

export function OfflineCheckinCard({ onSuccess, className = '' }: OfflineCheckinCardProps) {
  const { user } = useAuthStore()
  const isOnline = useNetworkStatus()
  const { pendingCount, saveCheckin, lastSyncAgo } = useOfflineCheckin(
    user?.id || '',
    user?.store_id || ''
  )

  const [status, setStatus] = useState<CheckinStatus>('idle')
  const [location, setLocation] = useState<LocationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null)

  // Get location
  const getLocation = useCallback((): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Trình duyệt không hỗ trợ GPS'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          })
        },
        (err) => {
          reject(new Error(`Lỗi GPS: ${err.message}`))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    })
  }, [])

  // Calculate distance (mock - in production use actual store coordinates)
  const calculateDistance = (): number => {
    // Mock: Return random distance between 10-200 meters
    // In production, calculate distance to store coordinates
    return Math.floor(Math.random() * 190) + 10
  }

  // Handle check-in
  const handleCheckin = async () => {
    setStatus('checking')
    setError(null)

    try {
      // Get location
      const loc = await getLocation()
      setLocation(loc)

      // Calculate distance
      const distance = calculateDistance()
      setDistanceMeters(distance)

      // Save to offline store (or sync immediately if online)
      saveCheckin({
        latitude: loc.latitude,
        longitude: loc.longitude,
        distanceMeters: distance,
      })

      setStatus('success')
      onSuccess?.(loc)

      // Reset after 3 seconds
      setTimeout(() => {
        setStatus('idle')
        setLocation(null)
        setDistanceMeters(null)
      }, 3000)

    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Lỗi không xác định')

      // Reset after 3 seconds
      setTimeout(() => {
        setStatus('idle')
        setError(null)
      }, 3000)
    }
  }

  // Get status icon
  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      case 'success':
        return <CheckCircle className="w-8 h-8 text-success-500" />
      case 'error':
        return <XCircle className="w-8 h-8 text-error-500" />
      default:
        return <MapPin className="w-8 h-8 text-primary" />
    }
  }

  // Get status text
  const getStatusText = () => {
    switch (status) {
      case 'checking':
        return 'Đang lấy vị trí...'
      case 'success':
        return '✅ Check-in thành công!'
      case 'error':
        return `❌ ${error}`
      default:
        return isOnline ? 'Bấm để check-in' : 'Check-in offline'
    }
  }

  return (
    <Card className={cn('p-6 text-center', className)}>
      {/* Header with offline indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-5 h-5 text-success-500" />
          ) : (
            <WifiOff className="w-5 h-5 text-warning-500" />
          )}
          <span className={cn(
            'text-sm font-medium',
            isOnline ? 'text-success-700' : 'text-warning-700'
          )}>
            {isOnline ? 'Online' : 'Offline Mode'}
          </span>
        </div>

        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 bg-warning-100 rounded-full">
            <CloudOff className="w-4 h-4 text-warning-600" />
            <span className="text-sm font-medium text-warning-700">
              {pendingCount} đang chờ
            </span>
          </div>
        )}
      </div>

      {/* Location icon */}
      <div className="flex justify-center mb-4">
        <div className={cn(
          'w-20 h-20 rounded-full flex items-center justify-center transition-colors',
          status === 'success' ? 'bg-success-100' :
          status === 'error' ? 'bg-error-100' :
          'bg-primary/10'
        )}>
          {getStatusIcon()}
        </div>
      </div>

      {/* Status text */}
      <p className={cn(
        'text-lg font-semibold mb-2',
        status === 'success' ? 'text-success-700' :
        status === 'error' ? 'text-error-700' :
        'text-gray-900'
      )}>
        {getStatusText()}
      </p>

      {/* Location details */}
      {location && distanceMeters !== null && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <MapPin className="w-4 h-4 inline mr-1" />
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </p>
          <p className="text-sm text-gray-600">
            <Clock className="w-4 h-4 inline mr-1" />
            Cách cửa hàng: {distanceMeters}m
          </p>
        </div>
      )}

      {/* Last sync time */}
      {!isOnline && (
        <p className="text-xs text-gray-500 mb-4">
          Đã đồng bộ lần cuối: {lastSyncAgo}
        </p>
      )}

      {/* Check-in button */}
      <Button
        onClick={handleCheckin}
        disabled={status === 'checking'}
        className={cn(
          'w-full',
          status === 'success' && 'bg-success-500 hover:bg-success-600',
          status === 'error' && 'bg-error-500 hover:bg-error-600'
        )}
      >
        {status === 'checking' ? (
          <>
            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
            Đang xử lý...
          </>
        ) : (
          <>
            <MapPin className="w-5 h-5 mr-2" />
            {status === 'success' ? 'Đã check-in!' : status === 'error' ? 'Thử lại' : 'Check-in'}
          </>
        )}
      </Button>

      {/* Info text */}
      <p className="text-xs text-gray-500 mt-4">
        {isOnline
          ? '📍 Check-in sẽ được gửi ngay lập tức'
          : '📱 Check-in sẽ được lưu và đồng bộ khi có mạng'}
      </p>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// OFFLINE CHECKIN HISTORY
// ─────────────────────────────────────────────────────────────────────────────

interface OfflineCheckinHistoryProps {
  className?: string
}

export function OfflineCheckinHistory({ className = '' }: OfflineCheckinHistoryProps) {
  const isOnline = useNetworkStatus()
  const [pendingCheckins, setPendingCheckins] = useState<Array<{
    id: string
    check_in_time: string
    sync_status: string
  }>>([])

  useEffect(() => {
    // Load pending check-ins
    import('@/lib/offline-checkin').then(({ getPendingCheckins }) => {
      setPendingCheckins(getPendingCheckins())
    })
  }, [])

  if (pendingCheckins.length === 0) {
    return (
      <div className={cn('text-center py-6', className)}>
        <CheckCircle className="w-12 h-12 mx-auto mb-2 text-success-500" />
        <p className="text-gray-600">Tất cả check-ins đã đồng bộ</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="font-semibold text-gray-900">
        Check-ins đang chờ ({pendingCheckins.length})
      </h3>

      {pendingCheckins.map((checkin) => (
        <Card key={checkin.id} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {new Date(checkin.check_in_time).toLocaleString('vi-VN')}
              </p>
              <p className="text-sm text-gray-500">
                ID: {checkin.id}
              </p>
            </div>
            <div className={cn(
              'px-3 py-1 rounded-full text-sm font-medium',
              checkin.sync_status === 'pending' ? 'bg-warning-100 text-warning-700' :
              checkin.sync_status === 'synced' ? 'bg-success-100 text-success-700' :
              'bg-error-100 text-error-700'
            )}>
              {checkin.sync_status === 'pending' ? '⏳ Chờ' :
               checkin.sync_status === 'synced' ? '✅ OK' : '⚠️ Cần xem'}
            </div>
          </div>
        </Card>
      ))}

      {!isOnline && (
        <p className="text-sm text-gray-500 text-center">
          Sẽ tự động đồng bộ khi có kết nối
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

const offlineCheckinExports = {
  OfflineCheckinCard,
  OfflineCheckinHistory,
}

export default offlineCheckinExports
