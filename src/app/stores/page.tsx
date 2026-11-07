'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MapPin, Navigation, Phone, Users, ShieldCheck, Clock, ExternalLink } from 'lucide-react'

interface StoreItem {
  id: string
  name: string
  code: string
  address: string
  latitude: number
  longitude: number
  radius_meters: number
  phone: string
  manager_name: string
  active_staff_count: number
  is_active: boolean
}

const DEFAULT_STORES: StoreItem[] = [
  {
    id: 'store-001',
    name: 'Homies Milk Tea - Hồ Bá Phấn',
    code: 'HBP',
    address: '49 Hồ Bá Phấn, P. Phước Long A, TP. Thủ Đức, TP.HCM',
    latitude: 10.822435,
    longitude: 106.762649,
    radius_meters: 100,
    phone: '0901 234 567',
    manager_name: 'Huỳnh Lê Kiều Linh & Trần Công Huy',
    active_staff_count: 8,
    is_active: true,
  },
  {
    id: 'store-002',
    name: 'Homies Milk Tea - Đường 429',
    code: '429',
    address: '59 Đường 429, P. Tăng Nhơn Phú A, TP. Thủ Đức, TP.HCM',
    latitude: 10.84478,
    longitude: 106.78652,
    radius_meters: 100,
    phone: '0901 234 568',
    manager_name: 'Nguyễn Thị Kiều Ý & Huỳnh Lê Kiều Linh',
    active_staff_count: 6,
    is_active: true,
  },
  {
    id: 'store-003',
    name: 'Homies Milk Tea - Lê Văn Sỹ',
    code: 'LVS',
    address: '350 Lê Văn Sỹ, Phường 14, Quận 3, TP.HCM',
    latitude: 10.7892,
    longitude: 106.6781,
    radius_meters: 100,
    phone: '0901 234 569',
    manager_name: 'Đang bổ nhiệm',
    active_staff_count: 0,
    is_active: true,
  },
]

export default function StoresPage() {
  const [stores, setStores] = useState<StoreItem[]>(DEFAULT_STORES)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadStores() {
      try {
        setLoading(true)
        const res = await fetch('/api/employees')
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          const staffCountByStore: Record<string, number> = {}
          json.data.forEach((e: any) => {
            if (e.store_id) {
              staffCountByStore[e.store_id] = (staffCountByStore[e.store_id] || 0) + 1
            }
          })
          setStores(prev =>
            prev.map(s => ({
              ...s,
              active_staff_count: staffCountByStore[s.id] ?? s.active_staff_count,
            }))
          )
        }
      } catch {
        // Fallback to DEFAULT_STORES
      } finally {
        setLoading(false)
      }
    }
    loadStores()
  }, [])

  return (
    <AppShell title="Quản lý Cửa hàng">
      <div className="space-y-6 pb-20 max-w-6xl mx-auto">
        {/* Header banner */}
        <div className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 text-accent-300 text-xs font-semibold uppercase tracking-wider">
              <MapPin size={16} /> Mạng lưới chi nhánh Homies Milk Tea
            </div>
            <h1 className="text-2xl font-bold font-['Poppins']">Danh sách Cơ sở Vận hành</h1>
            <p className="text-gray-300 text-sm mt-1 max-w-2xl">
              Quản lý thông tin định vị GPS, cấu hình bán kính chấm công chuẩn 100m và phân bổ nhân sự theo từng cơ sở.
            </p>
          </div>
        </div>

        {/* Store Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <Card key={store.id} className="p-6 border border-gray-100 hover:shadow-md transition-shadow bg-white flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-primary-50 text-primary-700 font-bold border border-primary-200">
                        {store.code}
                      </span>
                      <Badge variant="success" className="text-xs">Đang hoạt động</Badge>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 font-['Poppins']">{store.name}</h2>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                    <MapPin size={20} />
                  </div>
                </div>

                <div className="space-y-3 text-sm text-gray-600 mb-6">
                  <div className="flex items-start gap-2.5">
                    <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>{store.address}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Navigation size={16} className="text-gray-400 flex-shrink-0" />
                    <span>
                      Tọa độ GPS: <strong className="text-gray-800 font-mono">{store.latitude.toFixed(6)}, {store.longitude.toFixed(6)}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>
                      Bán kính chấm công hợp lệ: <strong className="text-emerald-700 font-semibold">{store.radius_meters}m</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Users size={16} className="text-gray-400 flex-shrink-0" />
                    <span>
                      Quản lý phụ trách: <strong className="text-gray-800">{store.manager_name}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Phone size={16} className="text-gray-400 flex-shrink-0" />
                    <span>Hotline quán: <strong>{store.phone}</strong></span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Quy mô: <strong className="text-primary-700 font-semibold">{store.active_staff_count} nhân sự</strong>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                >
                  Xem bản đồ <ExternalLink size={12} />
                </a>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
