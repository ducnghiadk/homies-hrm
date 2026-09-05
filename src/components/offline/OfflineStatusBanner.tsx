'use client'

import { useEffect, useState } from 'react'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { cn } from '@/lib/utils'
import {
  WifiOff,
  RefreshCw,
  Check,
  AlertCircle,
  CloudOff,
  CloudUpload,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// OFFLINE INDICATOR BADGE
// ─────────────────────────────────────────────────────────────────────────────

type IndicatorSize = 'sm' | 'md' | 'lg'

interface OfflineIndicatorProps {
  pendingCount?: number
  size?: IndicatorSize
  showLabel?: boolean
}

export function OfflineIndicator({
  pendingCount = 0,
  size = 'md',
  showLabel = false,
}: OfflineIndicatorProps) {
  const isOnline = useNetworkStatus()

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }

  const labelSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  return (
    <div className="flex items-center gap-2">
      {/* Status dot */}
      <span
        className={cn(
          'rounded-full',
          sizeClasses[size],
          isOnline ? 'bg-success-500' : 'bg-warning-500'
        )}
        title={isOnline ? 'Online' : 'Offline'}
      />

      {/* Pending count badge */}
      {pendingCount > 0 && (
        <span className={cn(
          'flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning-100 text-warning-700 font-medium',
          labelSizes[size]
        )}>
          <CloudOff size={12} />
          {pendingCount}
        </span>
      )}

      {/* Label */}
      {showLabel && (
        <span className={cn(
          'font-medium',
          isOnline ? 'text-success-700' : 'text-warning-700'
        )}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// OFFLINE BANNER (Full width banner)
// ─────────────────────────────────────────────────────────────────────────────

interface OfflineBannerProps {
  className?: string
}

export function OfflineBanner({ className = '' }: OfflineBannerProps) {
  const isOnline = useNetworkStatus()
  const { pendingCount, lastSyncAgo } = useOfflineSync()

  if (isOnline) return null

  return (
    <div className={cn(
      'flex items-center justify-between gap-4 px-4 py-3 bg-warning-500 text-white',
      className
    )}>
      <div className="flex items-center gap-3">
        <WifiOff className="w-5 h-5" />
        <div>
          <p className="font-semibold">Bạn đang offline</p>
          <p className="text-sm opacity-90">
            {pendingCount > 0
              ? `${pendingCount} tác vụ đang chờ đồng bộ`
              : 'Dữ liệu đã được lưu locally'}
          </p>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="text-right">
          <p className="text-xs opacity-75">
            Đã đồng bộ lần cuối: {lastSyncAgo}
          </p>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SYNC STATUS COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface SyncStatusProps {
  pendingCount?: number
  className?: string
}

export function SyncStatus({ pendingCount = 0, className = '' }: SyncStatusProps) {
  const isOnline = useNetworkStatus()
  const { syncState, manualSync } = useOfflineSync()

  const getStatusIcon = () => {
    switch (syncState) {
      case 'syncing':
        return <RefreshCw className="w-4 h-4 animate-spin" />
      case 'success':
        return <Check className="w-4 h-4 text-success-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-error-500" />
      default:
        return isOnline ? <CloudUpload className="w-4 h-4" /> : <CloudOff className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusText = () => {
    if (syncState === 'syncing') return 'Đang đồng bộ...'
    if (syncState === 'success') return 'Đã đồng bộ'
    if (syncState === 'error') return 'Có lỗi'
    if (!isOnline) return 'Offline'
    if (pendingCount > 0) return `${pendingCount} đang chờ`
    return 'Đã đồng bộ'
  }

  return (
    <button
      onClick={isOnline && pendingCount > 0 ? manualSync : undefined}
      disabled={!isOnline || syncState === 'syncing'}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
        'bg-primary-50 hover:bg-gray-200 transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {getStatusIcon()}
      <span className="font-medium">{getStatusText()}</span>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PENDING OPERATIONS LIST
// ─────────────────────────────────────────────────────────────────────────────

interface PendingOperationsListProps {
  maxItems?: number
  className?: string
}

export function PendingOperationsList({
  maxItems = 10,
  className = '',
}: PendingOperationsListProps) {
  const isOnline = useNetworkStatus()
  const { stats, manualSync, retrySync } = useOfflineSync()
  const [operations, setOperations] = useState<Array<{
    id: string
    type: string
    createdAt: string
  }>>([])

  useEffect(() => {
    // Import dynamically to avoid circular deps
    import('@/lib/offline-store').then(({ getOperations }) => {
      setOperations(getOperations().slice(0, maxItems))
    })
  }, [maxItems])

  if (operations.length === 0) {
    return (
      <div className={cn('text-center py-8 text-gray-500', className)}>
        <CloudUpload className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Không có tác vụ đang chờ</p>
        <p className="text-sm">Tất cả dữ liệu đã được đồng bộ</p>
      </div>
    )
  }

  const typeLabels: Record<string, string> = {
    checkin: '📍 Check-in',
    leave_request: '📅 Đơn nghỉ phép',
    swap_request: '🔄 Đổi ca',
    task_complete: '✅ Hoàn thành task',
    kpi_feedback: '📊 Feedback KPI',
    recognition: '🏆 Khen thưởng',
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Tác vụ đang chờ ({stats.pending})</h3>
        {isOnline && stats.pending > 0 && (
          <button
            onClick={manualSync}
            className="text-sm text-primary hover:underline"
          >
            Đồng bộ ngay
          </button>
        )}
      </div>

      <div className="space-y-2">
        {operations.map((op) => (
          <div
            key={op.id}
            className="flex items-center gap-3 p-3 bg-vanilla-50 rounded-lg"
          >
            <span className="text-2xl">
              {typeLabels[op.type]?.split(' ')[0] || '📋'}
            </span>
            <div className="flex-1">
              <p className="font-medium">
                {typeLabels[op.type]?.split(' ').slice(1).join(' ') || op.type}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(op.createdAt).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {stats.failed > 0 && (
        <button
          onClick={retrySync}
          className="w-full p-3 bg-error-50 text-error-700 rounded-lg font-medium"
        >
          Thử lại {stats.failed} tác vụ thất bại
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

const offlineStatusBannerExports = {
  OfflineIndicator,
  OfflineBanner,
  SyncStatus,
  PendingOperationsList,
}

export default offlineStatusBannerExports
