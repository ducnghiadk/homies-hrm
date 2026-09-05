'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { OfflineIndicator } from '@/components/offline/OfflineStatusBanner'
import {
  getOperations,
  clearSyncedOperations,
} from '@/lib/offline-store'
import {
  Settings,
  RefreshCw,
  Wifi,
  WifiOff,
  Database,
  Trash2,
  CheckCircle,
  XCircle,
  Info,
  Smartphone,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Helper functions
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function getStorageUsed(): string {
  if (typeof window === 'undefined') return '0 KB'
  let total = 0
  try {
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length
      }
    }
  } catch { /* ignore */ }
  return formatBytes(total * 2)
}

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

// Components
function StatusCard({
  title, value, icon: Icon, color, subtext,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  color: string
  subtext?: string
}) {
  return (
    <div className="bg-vanilla-50 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
  )
}

function SyncStatusCard({
  syncState, lastSync, onSync, isOnline,
}: {
  syncState: SyncStatus
  lastSync: string
  onSync: () => void
  isOnline: boolean
}) {
  const statusConfig = {
    idle: { icon: <Database size={24} />, text: 'Sẵn sàng', color: 'text-gray-500 bg-primary-50' },
    syncing: { icon: <RefreshCw size={24} className="animate-spin" />, text: 'Đang đồng bộ...', color: 'text-primary-500 bg-primary-100' },
    success: { icon: <CheckCircle size={24} />, text: 'Thành công', color: 'text-success-500 bg-success-100' },
    error: { icon: <XCircle size={24} />, text: 'Có lỗi', color: 'text-error-500 bg-error-100' },
  }
  const config = statusConfig[syncState]

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center', config.color)}>
            {config.icon}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{config.text}</p>
            <p className="text-sm text-gray-500">Lần cuối: {lastSync}</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={onSync}
          disabled={!isOnline || syncState === 'syncing'}
          variant={syncState === 'error' ? 'danger' : 'outline'}
        >
          <RefreshCw size={16} className={cn(syncState === 'syncing' && 'animate-spin')} />
          Sync ngay
        </Button>
      </div>
    </Card>
  )
}

function PendingOperationsList() {
  const [operations, setOperations] = useState<Array<{ id: string; type: string; status: string; createdAt: string }>>([])

  useEffect(() => {
    const ops = getOperations()
    const mappedOps = ops.filter(op => op.status === 'pending' || op.status === 'failed').slice(0, 5).map(op => ({
      id: op.id,
      type: op.type,
      status: op.status,
      createdAt: op.createdAt,
    }))
    setTimeout(() => {
      setOperations(mappedOps)
    }, 0)
  }, [])

  const typeLabels: Record<string, string> = {
    checkin: '📍 Check-in',
    leave_request: '📅 Đơn nghỉ phép',
    swap_request: '🔄 Đổi ca',
    task_complete: '✅ Hoàn thành task',
    kpi_feedback: '📊 Feedback KPI',
    recognition: '🏆 Khen thưởng',
  }

  if (operations.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <CheckCircle className="w-12 h-12 mx-auto mb-2 text-success-500" />
        <p>Tất cả dữ liệu đã được đồng bộ</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {operations.map((op) => (
        <div key={op.id} className="flex items-center justify-between p-3 bg-vanilla-50 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-xl">{typeLabels[op.type]?.split(' ')[0] || '📋'}</span>
            <div>
              <p className="text-sm font-medium">
                {typeLabels[op.type]?.split(' ').slice(1).join(' ') || op.type}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(op.createdAt).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
          <span className={cn(
            'px-2 py-1 rounded-full text-xs font-medium',
            op.status === 'pending' ? 'bg-warning-100 text-warning-700' :
            op.status === 'failed' ? 'bg-error-100 text-error-700' : 'bg-success-100 text-success-700'
          )}>
            {op.status === 'pending' ? '⏳ Chờ' : op.status === 'failed' ? '❌ Thất bại' : '✅ OK'}
          </span>
        </div>
      ))}
    </div>
  )
}

// Main Page
export default function SettingsSystemPage() {
  const isOnline = useNetworkStatus()
  const { stats, syncState, lastSyncAgo, manualSync, retrySync } = useOfflineSync()
  const [systemInfo, setSystemInfo] = useState<{
    appVersion: string
    lastUpdated: string
    deviceId: string
    storageUsed: string
  }>({
    appVersion: '1.0.0',
    lastUpdated: '',
    deviceId: '',
    storageUsed: '0 KB',
  })

  useEffect(() => {
    let deviceId = localStorage.getItem('offline_device_id')
    if (!deviceId) {
      deviceId = `device-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('offline_device_id', deviceId)
    }
    const info = {
      appVersion: '1.0.0',
      lastUpdated: new Date().toLocaleDateString('vi-VN'),
      deviceId,
      storageUsed: getStorageUsed(),
    }
    setTimeout(() => {
      setSystemInfo(info)
    }, 0)
  }, [])

  const handleClearCache = () => {
    if (confirm('Xóa cache đồng bộ đã hoàn thành? (Dữ liệu chưa sync sẽ không bị xóa)')) {
      clearSyncedOperations()
      alert('Đã xóa cache!')
      window.location.reload()
    }
  }

  return (
    <AppShell title="⚙️ Hệ Thống" backHref="/settings">
      {/* Network Status */}
      <Card className={cn(
        'p-4 mb-4',
        isOnline ? 'bg-success-50 border-success-200' : 'bg-warning-50 border-warning-200'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? <Wifi className="w-6 h-6 text-success-600" /> : <WifiOff className="w-6 h-6 text-warning-600" />}
            <div>
              <p className="font-semibold">{isOnline ? '🟢 Kết nối Internet' : '🟠 Offline Mode'}</p>
              <p className="text-sm text-gray-600">
                {isOnline ? 'Dữ liệu sẽ được đồng bộ ngay' : 'Dữ liệu được lưu locally'}
              </p>
            </div>
          </div>
          <OfflineIndicator pendingCount={stats.pending} size="lg" showLabel />
        </div>
      </Card>

      {/* Sync Status */}
      <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
        <Database size={20} />
        Trạng thái đồng bộ
      </h2>
      <SyncStatusCard syncState={syncState} lastSync={lastSyncAgo} onSync={manualSync} isOnline={isOnline} />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 my-4">
        <StatusCard title="Tổng tác vụ" value={stats.total} icon={Database} color="bg-primary-100 text-primary-600" />
        <StatusCard title="Đang chờ" value={stats.pending} icon={Clock} color="bg-warning-100 text-warning-600" subtext={stats.pending > 0 ? 'Sẽ sync khi online' : undefined} />
        <StatusCard title="Đã đồng bộ" value={stats.synced} icon={CheckCircle} color="bg-success-100 text-success-600" />
        <StatusCard title="Thất bại" value={stats.failed} icon={AlertTriangle} color={stats.failed > 0 ? 'bg-error-100 text-error-600' : 'bg-primary-50 text-gray-400'} subtext={stats.failed > 0 ? 'Nhấn Sync để thử lại' : undefined} />
      </div>

      {/* Pending Operations */}
      {stats.pending > 0 && (
        <>
          <h2 className="font-bold text-lg mb-3">Tác vụ đang chờ</h2>
          <Card className="p-4 mb-4">
            <PendingOperationsList />
            {stats.failed > 0 && (
              <Button variant="danger" size="sm" className="w-full mt-3" onClick={retrySync}>
                <RefreshCw size={16} className="mr-2" />
                Thử lại {stats.failed} tác vụ thất bại
              </Button>
            )}
          </Card>
        </>
      )}

      {/* System Info */}
      <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
        <Smartphone size={20} />
        Thông tin thiết bị
      </h2>
      <Card className="p-4 mb-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Phiên bản app</span>
            <span className="font-medium">{systemInfo.appVersion}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Cập nhật cuối</span>
            <span className="font-medium">{systemInfo.lastUpdated}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Device ID</span>
            <span className="font-mono text-xs">{systemInfo.deviceId.slice(0, 16)}...</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600">Dung lượng cache</span>
            <span className="font-medium">{systemInfo.storageUsed}</span>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
        <Settings size={20} />
        Thao tác
      </h2>
      <div className="space-y-2">
        <Button variant="outline" className="w-full justify-start" onClick={handleClearCache}>
          <Trash2 size={16} className="mr-2" />
          Xóa cache đã đồng bộ
        </Button>
      </div>

      {/* Info */}
      <Card className="p-4 mt-4 bg-vanilla-50">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-gray-400 mt-0.5" />
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-900">Sync tự động</p>
            <p className="mt-1">
              Dữ liệu check-in, đơn nghỉ phép, công việc khi offline sẽ được tự động
              đồng bộ khi thiết bị có kết nối internet.
            </p>
          </div>
        </div>
      </Card>
    </AppShell>
  )
}
