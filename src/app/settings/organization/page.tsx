'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { mockOrg, mockStores, type Store } from '@/lib/mock-data'
import { storeAdapter } from '@/lib/adapters'
import { OrganizationGeneralTab } from '@/components/settings/OrganizationGeneralTab'
import { VIETNAM_PROVINCES } from '@/lib/data/vietnam-locations'
import {
  Building2,
  Store as StoreIcon,
  Plus,
  Edit2,
  MapPin,
  Phone,
  CheckCircle,
  Search,
  Radio,
  Navigation,
  ExternalLink,
  Map,
  Sparkles,
  Loader2,
  Link2,
} from 'lucide-react'

function OrganizationSettingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') === 'branches' ? 'branches' : 'general'
  const [activeTab, setActiveTab] = useState<'general' | 'branches'>(initialTab)

  // Organization state
  const [orgData, setOrgData] = useState({
    name: 'Homies Milk Tea',
    shortName: 'HOMIES',
    taxCode: '0312345678',
    address: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
    phone: '1900 6868',
    email: 'contact@homiesmilktea.vn',
    signerName: 'Hoàng Thị Yến',
    signerTitle: 'Trưởng phòng Nhân sự',
    timezone: 'Asia/Ho_Chi_Minh (GMT+7)',
    currency: 'VND (₫)',
  })

  // Stores state
  const [stores, setStores] = useState<Store[]>(mockStores)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal state for adding/editing store
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)

  // 4-level Address Form State
  const [storeForm, setStoreForm] = useState({
    name: '',
    phone: '',
    provinceId: 'hcm',
    districtId: 'thu-duc',
    wardName: 'Phường Phước Long A',
    streetAddress: '49 Hồ Bá Phấn',
    latitude: 10.825000,
    longitude: 106.765000,
    checkin_radius_meters: 100,
    is_active: true,
  })

  // Google Maps link or raw coordinates input helper
  const [gmapsInput, setGmapsInput] = useState('')

  // Auto coordinate updating states
  const [isAutoUpdatingCoords, setIsAutoUpdatingCoords] = useState(false)
  const [autoCoordStatus, setAutoCoordStatus] = useState<string | null>(null)
  const autoCoordDebounceRef = useRef<NodeJS.Timeout | null>(null)

  // Loading states for GPS
  const [isLocating, setIsLocating] = useState(false)

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Load saved organization & stores from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedOrg = localStorage.getItem('homies_org_info')
      if (savedOrg) {
        try {
          setOrgData(JSON.parse(savedOrg))
        } catch (e) {
          console.error('Failed to parse saved org info', e)
        }
      }

      const savedStores = localStorage.getItem('homies_stores')
      if (savedStores) {
        try {
          setStores(JSON.parse(savedStores))
        } catch (e) {
          console.error('Failed to parse saved stores', e)
        }
      } else {
        storeAdapter.getStores().then(res => setStores(res))
      }
    }
  }, [])

  // Sync tab with URL
  const handleTabChange = (tab: 'general' | 'branches') => {
    setActiveTab(tab)
    router.replace(`/settings/organization?tab=${tab}`, { scroll: false })
  }

  // Save Organization Info
  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault()
    if (typeof window !== 'undefined') {
      localStorage.setItem('homies_org_info', JSON.stringify(orgData))
    }
    showToast('Đã lưu thông tin doanh nghiệp thành công!')
  }

  // Helper to get selected province object
  const selectedProvince = VIETNAM_PROVINCES.find(p => p.id === storeForm.provinceId) || VIETNAM_PROVINCES[0]
  // Helper to get selected district object
  const selectedDistrict = selectedProvince.districts.find(d => d.id === storeForm.districtId) || selectedProvince.districts[0]

  // Construct Clean Full Address string automatically
  const computedFullAddress = [
    storeForm.streetAddress.trim(),
    storeForm.wardName,
    selectedDistrict?.name,
    selectedProvince?.name,
  ]
    .filter(Boolean)
    .join(', ')

  // Auto-fetch coordinates whenever computedFullAddress changes
  useEffect(() => {
    if (!isModalOpen || !storeForm.streetAddress.trim()) return

    if (autoCoordDebounceRef.current) {
      clearTimeout(autoCoordDebounceRef.current)
    }

    autoCoordDebounceRef.current = setTimeout(async () => {
      setIsAutoUpdatingCoords(true)
      try {
        const query = encodeURIComponent(`${computedFullAddress}, Vietnam`)
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=vn&limit=1&q=${query}`
        )
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          const lat = Number(parseFloat(data[0].lat).toFixed(6))
          const lng = Number(parseFloat(data[0].lon).toFixed(6))
          setStoreForm(prev => ({ ...prev, latitude: lat, longitude: lng }))
          setAutoCoordStatus('Tọa độ đã tự động cập nhật theo địa chỉ này!')
        } else {
          setAutoCoordStatus('Đã dùng tọa độ mặc định của khu vực')
        }
      } catch (err) {
        console.warn('Auto geocode error:', err)
      } finally {
        setIsAutoUpdatingCoords(false)
      }
    }, 500)
  }, [computedFullAddress, isModalOpen])

  // Open modal for Add
  const handleOpenAddModal = () => {
    setEditingStore(null)
    setAutoCoordStatus(null)
    setGmapsInput('')
    setStoreForm({
      name: '',
      phone: '',
      provinceId: 'hcm',
      districtId: 'thu-duc',
      wardName: 'Phường Phước Long A',
      streetAddress: '',
      latitude: 10.7736,
      longitude: 106.7024,
      checkin_radius_meters: 100,
      is_active: true,
    })
    setIsModalOpen(true)
  }

  // Open modal for Edit
  const handleOpenEditModal = (store: Store) => {
    setEditingStore(store)
    setAutoCoordStatus(null)
    setGmapsInput('')

    // Try parsing existing address if formatted as street, ward, district, province
    const parts = store.address.split(',').map(p => p.trim())
    let street = store.address
    let provId = 'hcm'
    let distId = 'thu-duc'
    let ward = 'Phường Phước Long A'

    if (parts.length >= 2) {
      street = parts[0]
      // match province
      const foundProv = VIETNAM_PROVINCES.find(p => store.address.includes(p.name))
      if (foundProv) {
        provId = foundProv.id
        const foundDist = foundProv.districts.find(d => store.address.includes(d.name))
        if (foundDist) {
          distId = foundDist.id
          const foundWard = foundDist.wards.find(w => store.address.includes(w))
          if (foundWard) {
            ward = foundWard
          }
        }
      }
    }

    setStoreForm({
      name: store.name,
      phone: store.phone || '',
      provinceId: provId,
      districtId: distId,
      wardName: ward,
      streetAddress: street,
      latitude: store.latitude,
      longitude: store.longitude,
      checkin_radius_meters: store.checkin_radius_meters,
      is_active: store.is_active,
    })
    setIsModalOpen(true)
  }

  // Handle Province selection change
  const handleProvinceChange = (provinceId: string) => {
    const prov = VIETNAM_PROVINCES.find(p => p.id === provinceId) || VIETNAM_PROVINCES[0]
    const firstDist = prov.districts[0]
    const firstWard = firstDist?.wards[0] || ''
    setStoreForm(prev => ({
      ...prev,
      provinceId,
      districtId: firstDist?.id || '',
      wardName: firstWard,
    }))
  }

  // Handle District selection change
  const handleDistrictChange = (districtId: string) => {
    const dist = selectedProvince.districts.find(d => d.id === districtId)
    const firstWard = dist?.wards[0] || ''
    setStoreForm(prev => ({
      ...prev,
      districtId,
      wardName: firstWard,
    }))
  }

  // Smart Helper: Parse Google Maps link or raw coordinates (e.g. 10.825123, 106.764512)
  const handleParseGmapsInput = (inputVal?: string) => {
    const text = inputVal !== undefined ? inputVal : gmapsInput
    if (!text.trim()) {
      alert('Vui lòng dán link Google Maps hoặc tọa độ (VD: 10.825123, 106.764512)')
      return
    }

    // Regex match latitude and longitude numbers in URL or text string
    const match = text.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/)
    if (match && match[1] && match[2]) {
      const lat = Number(parseFloat(match[1]).toFixed(6))
      const lng = Number(parseFloat(match[2]).toFixed(6))

      setStoreForm(prev => ({ ...prev, latitude: lat, longitude: lng }))
      setAutoCoordStatus(`📌 Đã cập nhật từ Google Maps: ${lat}, ${lng}`)
      showToast(`📌 Đã cập nhật tọa độ Google Maps: ${lat}, ${lng}`)
    } else {
      alert(
        'Không tìm thấy con số tọa độ trong nội dung đã dán. Vui lòng copy đường link đầy đủ của Google Maps hoặc gõ trực tiếp dạng: 10.825123, 106.764512'
      )
    }
  }

  // Smart Helper: Get Current Device GPS Location
  const handleGetCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Trình duyệt không hỗ trợ định vị GPS')
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setIsLocating(false)
        const lat = Number(pos.coords.latitude.toFixed(6))
        const lng = Number(pos.coords.longitude.toFixed(6))
        setStoreForm(prev => ({ ...prev, latitude: lat, longitude: lng }))
        setAutoCoordStatus('Đã lấy tọa độ GPS chính xác vị trí thực tế!')
        showToast('📍 Đã lấy tọa độ GPS thực tế!')
      },
      err => {
        setIsLocating(false)
        console.warn('Geolocation error:', err)
        alert(
          'Không thể lấy vị trí GPS. Vui lòng cho phép quyền truy cập vị trí trên trình duyệt hoặc nhập tọa độ thủ công.'
        )
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Save Store (Add / Edit)
  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault()
    if (!storeForm.name.trim() || !storeForm.streetAddress.trim()) {
      alert('Vui lòng nhập tên cửa hàng và số nhà / tên đường')
      return
    }

    const fullAddress = computedFullAddress

    let updatedStores: Store[] = []
    if (editingStore) {
      updatedStores = stores.map(s =>
        s.id === editingStore.id
          ? {
              ...s,
              name: storeForm.name,
              address: fullAddress,
              phone: storeForm.phone,
              latitude: Number(storeForm.latitude),
              longitude: Number(storeForm.longitude),
              checkin_radius_meters: Number(storeForm.checkin_radius_meters),
              is_active: storeForm.is_active,
            }
          : s
      )
      showToast(`Đã cập nhật cửa hàng ${storeForm.name}!`)
    } else {
      const newStore: Store = {
        id: `store-${Date.now()}`,
        org_id: mockOrg.id,
        name: storeForm.name,
        address: fullAddress,
        phone: storeForm.phone,
        latitude: Number(storeForm.latitude),
        longitude: Number(storeForm.longitude),
        checkin_radius_meters: Number(storeForm.checkin_radius_meters),
        is_active: storeForm.is_active,
      }
      updatedStores = [...stores, newStore]
      showToast(`Đã thêm cửa hàng ${storeForm.name}!`)
    }

    setStores(updatedStores)
    if (typeof window !== 'undefined') {
      localStorage.setItem('homies_stores', JSON.stringify(updatedStores))
    }
    setIsModalOpen(false)
  }

  // Toggle Store Active Status
  const handleToggleStoreStatus = (storeId: string) => {
    const updated = stores.map(s => (s.id === storeId ? { ...s, is_active: !s.is_active } : s))
    setStores(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('homies_stores', JSON.stringify(updated))
    }
    const changedStore = updated.find(s => s.id === storeId)
    if (changedStore) {
      void storeAdapter.upsertStore(changedStore)
    }
    showToast('Đã cập nhật trạng thái cửa hàng!')
  }

  const filteredStores = stores.filter(
    s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AppShell title="Doanh nghiệp & Chi nhánh" backHref="/settings">
      <div className="space-y-5 pb-24">
        {/* Navigation Tabs (HOMIES Design Token: bg-white / primary active) */}
        <div className="flex bg-primary-50 p-1.5 rounded-2xl gap-1">
          <button
            onClick={() => handleTabChange('general')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              activeTab === 'general'
                ? 'bg-white text-[#2F6FA8] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Building2 size={16} />
            <span>Thông tin chung</span>
          </button>

          <button
            onClick={() => handleTabChange('branches')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              activeTab === 'branches'
                ? 'bg-white text-[#2F6FA8] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <StoreIcon size={16} />
            <span>Chi nhánh & Cửa hàng ({stores.length})</span>
          </button>
        </div>

        {/* TAB 1: THÔNG TIN CHUNG DOANH NGHIỆP */}
        {activeTab === 'general' && (
          <OrganizationGeneralTab
            orgData={orgData}
            setOrgData={setOrgData}
            onSave={handleSaveOrg}
          />
        )}

        {/* TAB 2: CHI NHÁNH & CỬA HÀNG */}
        {activeTab === 'branches' && (
          <div className="space-y-4 animate-fade-in">
            {/* Action Toolbar & Search */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc địa chỉ cửa hàng..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#2F6FA8] outline-none"
                />
              </div>

              <Button onClick={handleOpenAddModal} className="gap-2 shrink-0 bg-[#2F6FA8] hover:bg-[#1D3E61] text-white">
                <Plus size={16} />
                <span>Thêm cửa hàng mới</span>
              </Button>
            </div>

            {/* Stores List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredStores.map(store => {
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${store.latitude},${store.longitude}`
                )}`

                return (
                  <Card
                    key={store.id}
                    className={`p-4 border transition-all ${
                      store.is_active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-vanilla-50 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#E6F0FA] flex items-center justify-center shrink-0">
                          <StoreIcon size={20} className="text-[#2F6FA8]" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-[#001D3D]">{store.name}</h3>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1 ${
                              store.is_active
                                ? 'bg-[#DDF4EC] text-[#1E9E57]'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {store.is_active ? '🟢 Đang hoạt động' : '⚪ Tạm ngưng'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenEditModal(store)}
                        className="p-2 text-gray-400 hover:text-[#2F6FA8] hover:bg-primary-50 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>

                    <div className="mt-3.5 space-y-2 text-xs text-gray-600 border-t pt-3">
                      {/* INTERACTIVE GOOGLE MAPS ADDRESS LINK */}
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 text-gray-700 hover:text-[#2F6FA8] group transition-colors"
                        title="Bấm để mở bản đồ Google Maps"
                      >
                        <MapPin size={15} className="text-[#2F6FA8] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium underline underline-offset-2 decoration-gray-300 group-hover:decoration-[#2F6FA8] flex-1">
                          {store.address}
                        </span>
                        <ExternalLink size={13} className="text-gray-400 group-hover:text-[#2F6FA8] shrink-0 mt-0.5" />
                      </a>

                      {store.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-gray-400 shrink-0" />
                          <span>{store.phone}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] bg-vanilla-50 rounded-lg p-2 mt-1">
                        <div className="flex items-center gap-1.5">
                          <Radio size={13} className="text-[#2F6FA8] shrink-0" />
                          <span>
                            Lat <strong className="font-mono text-gray-800">{store.latitude}</strong>, Lng{' '}
                            <strong className="font-mono text-gray-800">{store.longitude}</strong>
                          </span>
                        </div>
                        <span className="bg-[#E6F0FA] text-[#2F6FA8] px-2 py-0.5 rounded font-bold">
                          R = {store.checkin_radius_meters}m
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t flex justify-between items-center">
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-[#2F6FA8] hover:underline flex items-center gap-1"
                      >
                        <Map size={13} />
                        <span>Mở Google Maps</span>
                      </a>

                      <button
                        onClick={() => handleToggleStoreStatus(store.id)}
                        className="text-xs font-semibold text-gray-500 hover:text-[#2F6FA8]"
                      >
                        {store.is_active ? 'Tạm ngưng hoạt động' : 'Kích hoạt cửa hàng'}
                      </button>
                    </div>
                  </Card>
                )
              })}

              {filteredStores.length === 0 && (
                <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                  <StoreIcon size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm font-medium text-gray-500">Không tìm thấy cửa hàng nào</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL ADD / EDIT STORE WITH 4-LEVEL ADMINISTRATIVE ADDRESS PICKER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-bold text-base text-[#001D3D]">
                {editingStore ? 'Chỉnh sửa Cửa hàng' : 'Thêm Cửa hàng mới'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStore} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Tên cửa hàng / Chi nhánh *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Homies Milk Tea - Hồ Bá Phấn"
                  value={storeForm.name}
                  onChange={e => setStoreForm({ ...storeForm, name: e.target.value })}
                  className="w-full bg-vanilla-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-[#001D3D] focus:ring-2 focus:ring-[#2F6FA8] outline-none"
                />
              </div>

              {/* 4-LEVEL ADMINISTRATIVE ADDRESS PICKER CONTAINER */}
              <div className="bg-vanilla-50 border border-gray-200 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#001D3D] flex items-center gap-1.5">
                    <MapPin size={14} className="text-[#2F6FA8]" />
                    Cấu trúc địa chỉ 4 cấp (Chuẩn Việt Nam)
                  </span>
                  <span className="text-[10px] bg-[#E6F0FA] text-[#2F6FA8] font-bold px-2 py-0.5 rounded">
                    Chuẩn 100%
                  </span>
                </div>

                {/* ROW 1: TỈNH / THÀNH & QUẬN / HUYỆN */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 mb-1 block">Tỉnh / Thành phố *</label>
                    <select
                      value={storeForm.provinceId}
                      onChange={e => handleProvinceChange(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-medium text-[#001D3D] focus:ring-2 focus:ring-[#2F6FA8] outline-none"
                    >
                      {VIETNAM_PROVINCES.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 mb-1 block">Quận / Huyện *</label>
                    <select
                      value={storeForm.districtId}
                      onChange={e => handleDistrictChange(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-medium text-[#001D3D] focus:ring-2 focus:ring-[#2F6FA8] outline-none"
                    >
                      {selectedProvince.districts.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ROW 2: PHƯỜNG / XÃ & SỐ NHÀ / ĐƯỜNG */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 mb-1 block">Phường / Xã *</label>
                    <select
                      value={storeForm.wardName}
                      onChange={e => setStoreForm({ ...storeForm, wardName: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-medium text-[#001D3D] focus:ring-2 focus:ring-[#2F6FA8] outline-none"
                    >
                      {selectedDistrict.wards.map((w, idx) => (
                        <option key={idx} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 mb-1 block">Số nhà & Tên đường *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: 49 Hồ Bá Phấn"
                      value={storeForm.streetAddress}
                      onChange={e => setStoreForm({ ...storeForm, streetAddress: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#001D3D] focus:ring-2 focus:ring-[#2F6FA8] outline-none"
                    />
                  </div>
                </div>

                {/* LIVE COMPUTED FULL ADDRESS DISPLAY */}
                <div className="bg-[#DDF4EC] border border-[#1E9E57]/30 rounded-xl p-2.5 space-y-1">
                  <span className="text-[10px] font-bold text-[#107C41] flex items-center gap-1 uppercase tracking-wider">
                    <Sparkles size={12} /> Địa chỉ đầy đủ hoàn chỉnh:
                  </span>
                  <p className="text-xs font-bold text-gray-900 leading-snug">{computedFullAddress}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Số điện thoại liên hệ</label>
                <input
                  type="text"
                  placeholder="VD: 0919246273"
                  value={storeForm.phone}
                  onChange={e => setStoreForm({ ...storeForm, phone: e.target.value })}
                  className="w-full bg-vanilla-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#001D3D] focus:ring-2 focus:ring-[#2F6FA8] outline-none"
                />
              </div>

              {/* SMART GPS HELPER CONTAINER WITH AUTO-COORDINATE & GOOGLE MAPS LINK PARSER */}
              <div className="bg-[#FFF8E8] border border-[#F6C85F]/50 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Radio size={14} className="text-[#2F6FA8]" />
                    <span className="text-xs font-bold text-[#001D3D]">Tọa độ GPS Check-in</span>
                    {isAutoUpdatingCoords && (
                      <Loader2 size={12} className="text-[#2F6FA8] animate-spin ml-1" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={isLocating}
                    className="px-2.5 py-1.5 bg-[#2F6FA8] text-white hover:bg-[#1D3E61] rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all disabled:opacity-50 shrink-0"
                  >
                    <Navigation size={13} />
                    <span>{isLocating ? 'Đang định vị...' : '📍 Lấy GPS vị trí này'}</span>
                  </button>
                </div>

                {/* Auto coordinate status indicator */}
                {autoCoordStatus && (
                  <div className="text-[11px] font-semibold text-[#107C41] bg-[#DDF4EC] px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <CheckCircle size={12} className="shrink-0" />
                    <span>{autoCoordStatus}</span>
                  </div>
                )}

                {/* SMART GOOGLE MAPS LINK / COORDINATE PASTE INPUT */}
                <div className="space-y-1 bg-white p-2 rounded-xl border border-gray-200">
                  <label className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
                    <Link2 size={12} className="text-[#2F6FA8]" /> Dán Link hoặc Tọa độ từ Google Maps
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Dán link Google Maps hoặc tọa độ (VD: 10.825123, 106.764512)..."
                      value={gmapsInput}
                      onChange={e => {
                        setGmapsInput(e.target.value)
                        if (e.target.value.includes('http') || e.target.value.includes(',')) {
                          handleParseGmapsInput(e.target.value)
                        }
                      }}
                      className="flex-1 bg-vanilla-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-[#001D3D] outline-none focus:ring-1 focus:ring-[#2F6FA8]"
                    />
                    <button
                      type="button"
                      onClick={() => handleParseGmapsInput()}
                      className="px-2.5 py-1.5 bg-[#E6F0FA] text-[#2F6FA8] hover:bg-[#2F6FA8] hover:text-white rounded-lg text-xs font-bold shrink-0 transition-colors"
                    >
                      📌 Cập nhật
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 mb-1 block">Vĩ độ (Latitude)</label>
                    <input
                      type="number"
                      step="any"
                      value={storeForm.latitude}
                      onChange={e => setStoreForm({ ...storeForm, latitude: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-[#001D3D] font-mono focus:ring-2 focus:ring-[#2F6FA8] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 mb-1 block">Kinh độ (Longitude)</label>
                    <input
                      type="number"
                      step="any"
                      value={storeForm.longitude}
                      onChange={e => setStoreForm({ ...storeForm, longitude: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-[#001D3D] font-mono focus:ring-2 focus:ring-[#2F6FA8] outline-none"
                    />
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${storeForm.latitude},${storeForm.longitude}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-[#2F6FA8] hover:underline flex items-center gap-1"
                  >
                    <Map size={12} />
                    <span>🗺️ Xem thử ghim vị trí này trên Google Maps</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  Bán kính check-in hợp lệ (Meters)
                </label>
                <input
                  type="number"
                  value={storeForm.checkin_radius_meters}
                  onChange={e =>
                    setStoreForm({ ...storeForm, checkin_radius_meters: parseInt(e.target.value) || 100 })
                  }
                  className="w-full bg-vanilla-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#001D3D] focus:ring-2 focus:ring-[#2F6FA8] outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="store_is_active"
                  checked={storeForm.is_active}
                  onChange={e => setStoreForm({ ...storeForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-[#2F6FA8] rounded border-gray-300"
                />
                <label htmlFor="store_is_active" className="text-xs font-medium text-gray-700">
                  Cửa hàng đang hoạt động
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 min-h-[44px]"
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" className="flex-1 font-bold bg-[#2F6FA8] hover:bg-[#1D3E61] text-white min-h-[44px]">
                  {editingStore ? 'Cập nhật' : 'Thêm mới'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#001D3D] text-white px-5 py-2.5 rounded-2xl shadow-xl text-xs font-medium flex items-center gap-2 animate-fade-in">
          <CheckCircle size={16} className="text-[#1E9E57] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </AppShell>
  )
}

export default function OrganizationSettingsPage() {
  return (
    <Suspense fallback={null}>
      <OrganizationSettingsContent />
    </Suspense>
  )
}
