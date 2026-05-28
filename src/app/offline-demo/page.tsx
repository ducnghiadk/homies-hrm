'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { PendingOperationsList } from '@/components/offline/OfflineStatusBanner'
import { OfflineCheckinCard, OfflineCheckinHistory } from '@/components/offline/OfflineCheckin'
import { cn } from '@/lib/utils'
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  CloudOff,
  CloudUpload,
  Database,
  Smartphone,
  Zap,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// OFFLINE MODE DEMO PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function OfflineDemoPage() {
  const isOnline = useNetworkStatus()
  const {
    pendingCount,
    stats,
    syncState,
    lastSyncAgo,
    queueOperation,
    manualSync,
  } = useOfflineSync('demo-user', 'store-001')

  const [activeTab, setActiveTab] = useState<'overview' | 'checkin' | 'operations'>('overview')

  return (
    <AppShell title="📱 Offline Mode Demo" backHref="/">
      {/* Online/Offline Status Header */}
      <Card className={cn(
        'p-4 mb-4 border-2',
        isOnline ? 'border-success-200 bg-success-50' : 'border-warning-200 bg-warning-50'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              isOnline ? 'bg-success-100' : 'bg-warning-100'
            )}>
              {isOnline ? (
                <Wifi className="w-6 h-6 text-success-600" />
              ) : (
                <WifiOff className="w-6 h-6 text-warning-600" />
              )}
            </div>
            <div>
              <p className="font-bold text-lg">
                {isOnline ? '🟢 Online' : '🟠 Offline Mode'}
              </p>
              <p className="text-sm text-gray-600">
                {isOnline
                  ? 'Kết nối internet đang hoạt động'
                  : 'Không có kết nối - dữ liệu được lưu locally'}
              </p>
            </div>
          </div>

          {pendingCount > 0 && (
            <div className="text-right">
              <div className="flex items-center gap-2 px-3 py-2 bg-warning-100 rounded-full">
                <CloudOff className="w-5 h-5 text-warning-600" />
                <span className="font-bold text-warning-700">{pendingCount}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">đang chờ sync</p>
            </div>
          )}
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Tổng quan', icon: Database },
          { id: 'checkin', label: 'Check-in', icon: Smartphone },
          { id: 'operations', label: 'Tác vụ', icon: CloudUpload },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'overview' | 'checkin' | 'operations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* How it works */}
          <Card className="p-4">
            <h3 className="font-bold text-lg mb-4">🔄 Cách hoạt động</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">1</div>
                <div>
                  <p className="font-semibold">Khi có mạng</p>
                  <p className="text-sm text-gray-600">Dữ liệu được gửi ngay lên server</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-warning-100 flex items-center justify-center text-warning-600 font-bold">2</div>
                <div>
                  <p className="font-semibold">Khi mất mạng</p>
                  <p className="text-sm text-gray-600">Dữ liệu được lưu trong điện thoại</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center text-success-600 font-bold">3</div>
                <div>
                  <p className="font-semibold">Khi có mạng trở lại</p>
                  <p className="text-sm text-gray-600">Tự động đồng bộ tất cả dữ liệu</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats */}
          <Card className="p-4">
            <h3 className="font-bold text-lg mb-4">📊 Thống kê</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-primary">{stats.total}</p>
                <p className="text-sm text-gray-600">Tổng tác vụ</p>
              </div>
              <div className="bg-warning-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-warning-600">{stats.pending}</p>
                <p className="text-sm text-gray-600">Đang chờ</p>
              </div>
              <div className="bg-success-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-success-600">{stats.synced}</p>
                <p className="text-sm text-gray-600">Đã đồng bộ</p>
              </div>
              <div className="bg-error-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-error-600">{stats.failed}</p>
                <p className="text-sm text-gray-600">Thất bại</p>
              </div>
            </div>
          </Card>

          {/* Sync Button */}
          {pendingCount > 0 && isOnline && (
            <Button onClick={manualSync} className="w-full" size="lg">
              <RefreshCw className={cn('w-5 h-5 mr-2', syncState === 'syncing' && 'animate-spin')} />
              Đồng bộ ngay ({pendingCount})
            </Button>
          )}

          {/* Last sync */}
          <Card className="p-4 bg-gray-50">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                Đồng bộ lần cuối: <strong>{lastSyncAgo}</strong>
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* Checkin Tab */}
      {activeTab === 'checkin' && (
        <div className="space-y-4">
          <OfflineCheckinCard />
          <OfflineCheckinHistory />
        </div>
      )}

      {/* Operations Tab */}
      {activeTab === 'operations' && (
        <div className="space-y-4">
          {/* Simulate adding operations */}
          <Card className="p-4">
            <h3 className="font-bold text-lg mb-4">🧪 Test thử</h3>
            <p className="text-sm text-gray-600 mb-4">
              Nhấn các nút bên dưới để tạo tác vụ offline (thử khi không có mạng)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  queueOperation('checkin', {
                    message: 'Test check-in',
                    time: new Date().toISOString(),
                  }, 'demo-user', 'store-001')
                }}
              >
                📍 Check-in
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  queueOperation('leave_request', {
                    type: 'personal',
                    message: 'Test đơn nghỉ',
                  }, 'demo-user', 'store-001')
                }}
              >
                📅 Đơn nghỉ
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  queueOperation('task_complete', {
                    task: 'Test task',
                  }, 'demo-user', 'store-001')
                }}
              >
                ✅ Task
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  queueOperation('recognition', {
                    to: 'colleague',
                    message: 'Test khen thưởng',
                  }, 'demo-user', 'store-001')
                }}
              >
                🏆 Khen thưởng
              </Button>
            </div>
          </Card>

          {/* Pending list */}
          <PendingOperationsList />
        </div>
      )}

      {/* Info Box */}
      <Card className="p-4 mt-4 bg-primary-50 border-primary-200">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-primary-500 mt-0.5" />
          <div>
            <p className="font-medium text-primary-900">Offline-first Architecture</p>
            <p className="text-sm text-primary-700 mt-1">
              Ứng dụng hoạt động bình thường khi không có internet.
              Check-in, tạo đơn nghỉ, hoàn thành task đều được lưu locally và đồng bộ tự động khi có mạng.
            </p>
          </div>
        </div>
      </Card>
    </AppShell>
  )
}
