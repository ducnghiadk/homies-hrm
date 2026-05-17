'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth-store'
import { getStoreById, mockStores } from '@/lib/mock-data'
import {
  getStoreWifiConfigs,
  addWifiConfig,
  toggleWifiConfig,
  removeWifiConfig,
  type StoreWifiConfig,
} from '@/lib/mock-data-wifi'
import {
  ArrowLeft, Wifi, WifiOff, Plus, Trash2, ToggleLeft, ToggleRight, Router,
} from 'lucide-react'

export default function WifiConfigPage() {
  const { user } = useAuthStore()
  const router = useRouter()

  // Store managers see their store; admins see all
  const isAdmin = user?.role === 'hr_admin' || user?.role === 'ceo'
  const stores = isAdmin ? mockStores.filter(s => s.is_active) : user ? [getStoreById(user.store_id)].filter(Boolean) : []

  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id ?? '')
  const [configs, setConfigs] = useState<StoreWifiConfig[]>(
    selectedStoreId ? getStoreWifiConfigs(selectedStoreId) : []
  )
  const [showAddForm, setShowAddForm] = useState(false)
  const [newSsid, setNewSsid] = useState('')
  const [newBssid, setNewBssid] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const refreshConfigs = (storeId: string) => {
    setConfigs(getStoreWifiConfigs(storeId))
  }

  const handleStoreChange = (storeId: string) => {
    setSelectedStoreId(storeId)
    refreshConfigs(storeId)
    setShowAddForm(false)
  }

  const handleAdd = () => {
    if (!newSsid.trim()) return
    addWifiConfig(selectedStoreId, newSsid.trim(), newBssid.trim())
    refreshConfigs(selectedStoreId)
    setNewSsid('')
    setNewBssid('')
    setShowAddForm(false)
    setToast('Đã thêm WiFi mới')
    setTimeout(() => setToast(null), 2500)
  }

  const handleToggle = (id: string) => {
    toggleWifiConfig(id)
    refreshConfigs(selectedStoreId)
  }

  const handleRemove = (id: string) => {
    removeWifiConfig(id)
    refreshConfigs(selectedStoreId)
    setToast('Đã xóa WiFi')
    setTimeout(() => setToast(null), 2500)
  }

  const selectedStore = getStoreById(selectedStoreId)

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-dark-700 hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-dark-700">WiFi Check-in</h1>
          <p className="text-xs text-gray-400">Cấu hình WiFi cho chấm công</p>
        </div>
      </div>

      {/* Store selector (for admins with multiple stores) */}
      {stores.length > 1 && (
        <div className="mb-4">
          <label className="text-xs text-gray-500 font-medium mb-1 block">Cửa hàng</label>
          <select
            value={selectedStoreId}
            onChange={e => handleStoreChange(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {stores.map(s => s && (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Current store info */}
      {selectedStore && (
        <div className="bg-primary-50 rounded-2xl p-4 mb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <Router size={20} className="text-primary-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-dark-700">{selectedStore.name}</p>
            <p className="text-xs text-gray-400">{selectedStore.address}</p>
          </div>
        </div>
      )}

      {/* WiFi list */}
      <div className="space-y-3 mb-5">
        {configs.length === 0 && (
          <div className="text-center py-8">
            <WifiOff size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">Chưa có WiFi nào được cấu hình</p>
            <p className="text-xs text-gray-300 mt-1">Thêm WiFi cửa hàng để bật check-in qua WiFi</p>
          </div>
        )}

        {configs.map(cfg => (
          <div
            key={cfg.id}
            className={`bg-white border rounded-2xl p-4 flex items-center gap-3 transition-all ${
              cfg.is_active ? 'border-green-200' : 'border-gray-200 opacity-60'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              cfg.is_active ? 'bg-green-50' : 'bg-gray-100'
            }`}>
              <Wifi size={20} className={cfg.is_active ? 'text-green-500' : 'text-gray-400'} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-dark-700 truncate">{cfg.wifi_ssid}</p>
              <p className="text-xs text-gray-400 font-mono truncate">
                {cfg.wifi_bssid || 'Không có BSSID'}
              </p>
              <p className={`text-xs font-medium mt-0.5 ${cfg.is_active ? 'text-green-500' : 'text-gray-400'}`}>
                {cfg.is_active ? 'Đang sử dụng' : 'Đã tắt'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleToggle(cfg.id)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title={cfg.is_active ? 'Tắt' : 'Bật'}
              >
                {cfg.is_active ? (
                  <ToggleRight size={22} className="text-green-500" />
                ) : (
                  <ToggleLeft size={22} className="text-gray-400" />
                )}
              </button>
              <button
                onClick={() => handleRemove(cfg.id)}
                className="p-2 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500"
                title="Xóa"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add WiFi form */}
      {showAddForm ? (
        <div className="bg-white border border-primary-200 rounded-2xl p-4 space-y-3 animate-fade-in">
          <p className="text-sm font-bold text-dark-700">Thêm WiFi mới</p>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tên WiFi (SSID) *</label>
            <input
              type="text"
              value={newSsid}
              onChange={e => setNewSsid(e.target.value)}
              placeholder="VD: BobaHouse_Q1"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">BSSID (tùy chọn)</label>
            <input
              type="text"
              value={newBssid}
              onChange={e => setNewBssid(e.target.value)}
              placeholder="VD: AA:BB:CC:11:22:33"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300 font-mono"
            />
            <p className="text-xs text-gray-300 mt-1">Địa chỉ MAC của router, giúp tránh giả mạo tên WiFi</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setShowAddForm(false); setNewSsid(''); setNewBssid('') }}
              className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-500 text-sm font-medium"
            >
              Hủy
            </button>
            <button
              onClick={handleAdd}
              disabled={!newSsid.trim()}
              className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
            >
              Lưu
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 text-sm font-medium flex items-center justify-center gap-2 hover:border-primary-300 hover:text-primary-500 transition-colors"
        >
          <Plus size={18} />
          Thêm WiFi mới
        </button>
      )}

      {/* Info note */}
      <div className="mt-6 bg-blue-50 rounded-xl p-3">
        <p className="text-xs text-blue-600 font-medium mb-1">💡 Hướng dẫn</p>
        <ul className="text-xs text-blue-500 space-y-1">
          <li>• Nhân viên kết nối WiFi cửa hàng sẽ được xác nhận vị trí tự động</li>
          <li>• BSSID giúp phân biệt WiFi cửa hàng với WiFi giả mạo cùng tên</li>
          <li>• Tắt WiFi để tạm ngưng cho phép check-in qua WiFi đó</li>
        </ul>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-dark-700 text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}
    </AppShell>
  )
}
