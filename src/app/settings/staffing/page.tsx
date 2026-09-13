'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { useSettingPermissions } from '@/hooks/usePermissions'
import {
  mockStores, mockEmployees, mockPositions, mockShifts,
  type Store, type Position,
} from '@/lib/mock-data'
import {
  staffingRequirements, updateRequirement, getRequiredStaff,
  type StaffingRequirement,
} from '@/lib/mock-data-staffing'
import { staffingAdapter } from '@/lib/adapters'
import {
  Users,
  CheckCircle2,
  Clock,
  SlidersHorizontal,
  Store as StoreIcon,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  Save,
  Plus,
  Minus,
  Calendar,
  AlertCircle,
  Calculator,
  DollarSign,
  BarChart3,
  Flame,
  Bike,
  ShoppingBag,
  Layers,
} from 'lucide-react'

// Helper format tiền tệ
const formatVnd = (value: number) => `${Math.round(value).toLocaleString('vi-VN')} đ`

// Vị trí chức danh cấp quầy (level 1-2) — lọc từ mockPositions thật
const STORE_LEVEL_POSITIONS = mockPositions.filter(p => p.level <= 2)

// Lấy tên position theo ID
function posName(posId: string): string {
  return mockPositions.find(p => p.id === posId)?.name || posId
}

// Phân loại FT/PT dựa trên position.level thật
function classifyFtPt(employees: typeof mockEmployees) {
  const ft = employees.filter(e => {
    const pos = mockPositions.find(p => p.id === e.position_id)
    return pos ? pos.level >= 2 : (e.role === 'store_manager' || e.role === 'ceo')
  })
  return { fullTime: ft.length, partTime: employees.length - ft.length }
}

// Cấu hình định biên mỗi ca — map 1:1 với mockShifts & staffingRequirements
type ShiftStaffingRow = {
  shiftId: string
  shiftName: string
  timeRange: string
  color: string
  positions: {
    positionId: string
    positionName: string
    requiredCount: number
    isMandatory: boolean
  }[]
}

export default function StaffingSettingsPage() {
  const { canManagePayroll } = useSettingPermissions()
  const router = useRouter()

  // ─── State Chọn Chi Nhánh & Ngày ───
  const [selectedStoreId, setSelectedStoreId] = useState<string>(mockStores[0]?.id || 'store-001')
  const [dayMode, setDayMode] = useState<'weekday' | 'weekend'>('weekday')
  const [storeModel, setStoreModel] = useState<'takeaway_kiosk' | 'dinein_store'>('takeaway_kiosk')

  // ─── Tham Số Kinh Doanh ───
  const [weekdayRevenue, setWeekdayRevenue] = useState<number>(10000000)
  const [weekendRevenue, setWeekendRevenue] = useState<number>(16000000)
  const [avgCupPrice, setAvgCupPrice] = useState<number>(32000)
  const [appOrderRatio, setAppOrderRatio] = useState<number>(65)
  const [takeawaySpeed, setTakeawaySpeed] = useState<number>(35)
  const [hourlyWage, setHourlyWage] = useState<number>(24000)
  const [targetLaborCostPercent, setTargetLaborCostPercent] = useState<number>(17)

  const [savedNotice, setSavedNotice] = useState<string | null>(null)

  // ─── Doanh thu hiện tại theo chế độ ngày (FIX LỖ HỔNG 5) ───
  const currentDailyRevenue = dayMode === 'weekday' ? weekdayRevenue : weekendRevenue
  const setCurrentRevenue = (val: number) => {
    if (dayMode === 'weekday') setWeekdayRevenue(val)
    else setWeekendRevenue(val)
  }

  // ─── Chi nhánh đang chọn ───
  const currentStore = useMemo(() => {
    return mockStores.find(s => s.id === selectedStoreId) || mockStores[0]
  }, [selectedStoreId])

  // ─── Nhân sự thực tế: Dùng position.level chuẩn (FIX LỖ HỔNG 1) ───
  const storeEmployees = useMemo(() => {
    return mockEmployees.filter(e => e.store_id === selectedStoreId && e.status === 'active')
  }, [selectedStoreId])

  const { fullTime: actualFT, partTime: actualPT } = useMemo(
    () => classifyFtPt(storeEmployees),
    [storeEmployees]
  )

  // Force re-render khi thay đổi staffingRequirements (mutable)
  const [renderKey, setRenderKey] = useState(0)

  // ─── Bảng Định Biên Từng Ca: Đọc từ staffingRequirements THẬT (FIX LỖ HỔNG 2 & 3) ───
  const shiftRows: ShiftStaffingRow[] = useMemo(() => {
    return mockShifts.map(shift => {
      const reqs = staffingRequirements.filter(
        r => r.store_id === selectedStoreId && r.shift_id === shift.id
      )
      const positions = reqs.map(r => ({
        positionId: r.position_id,
        positionName: posName(r.position_id),
        requiredCount: r.required_count,
        isMandatory: r.is_mandatory,
      }))
      // Đảm bảo luôn hiện tối thiểu các vị trí cấp quầy (pos-001..004) nếu chưa có
      STORE_LEVEL_POSITIONS.forEach(pos => {
        if (!positions.find(p => p.positionId === pos.id)) {
          positions.push({
            positionId: pos.id,
            positionName: pos.name,
            requiredCount: 0,
            isMandatory: pos.id === 'pos-004',
          })
        }
      })
      // Sắp xếp: mandatory trước, rồi theo id
      positions.sort((a, b) => {
        if (a.isMandatory !== b.isMandatory) return a.isMandatory ? -1 : 1
        return a.positionId.localeCompare(b.positionId)
      })
      return {
        shiftId: shift.id,
        shiftName: shift.name,
        timeRange: `${shift.start_time} - ${shift.end_time}`,
        color: shift.color,
        positions,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreId, renderKey])

  // Tổng nhân sự required từ bảng thật
  const totalRequiredPerDay = useMemo(() => {
    return shiftRows.reduce((sum, row) => {
      return sum + row.positions.reduce((s, p) => s + p.requiredCount, 0)
    }, 0)
  }, [shiftRows])

  // ─── Công Thức Toán Học Minh Bạch (FIX LỖ HỔNG 4) ───
  const mathFormula = useMemo(() => {
    const totalCups = Math.round(currentDailyRevenue / avgCupPrice)
    const appCups = Math.round(totalCups * (appOrderRatio / 100))
    const walkinCups = totalCups - appCups

    // Giờ pha chế = Tổng ly / Năng suất
    const directBrewingHours = Math.round((totalCups / takeawaySpeed) * 10) / 10

    // Giờ đóng gói App (FIX: 20 giây/ly thực tế)
    const appPackagingHours = Math.round((appCups * 20 / 3600) * 10) / 10

    // Giờ chuẩn bị & dọn dẹp
    const prepCleanupHours = storeModel === 'takeaway_kiosk' ? 3.5 : 6.0

    const totalDailyLaborHours = Math.round(directBrewingHours + appPackagingHours + prepCleanupHours)

    // Chi phí lương
    const totalDailyLaborCost = totalDailyLaborHours * hourlyWage
    const actualLaborCostPercent = Math.round((totalDailyLaborCost / currentDailyRevenue) * 1000) / 10

    return {
      totalCups, appCups, walkinCups,
      directBrewingHours, appPackagingHours, prepCleanupHours,
      totalDailyLaborHours,
      totalDailyLaborCost, actualLaborCostPercent,
    }
  }, [currentDailyRevenue, avgCupPrice, appOrderRatio, takeawaySpeed, storeModel, hourlyWage])

  // ─── Load cấu hình chi nhánh từ localStorage ───
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`homies_staffing_store_${selectedStoreId}`)
      if (saved) {
        try {
          const cfg = JSON.parse(saved)
          if (cfg.storeModel) setStoreModel(cfg.storeModel)
          if (cfg.weekdayRevenue) setWeekdayRevenue(cfg.weekdayRevenue)
          if (cfg.weekendRevenue) setWeekendRevenue(cfg.weekendRevenue)
          if (cfg.avgCupPrice) setAvgCupPrice(cfg.avgCupPrice)
          if (cfg.appOrderRatio) setAppOrderRatio(cfg.appOrderRatio)
          if (cfg.takeawaySpeed) setTakeawaySpeed(cfg.takeawaySpeed)
          if (cfg.hourlyWage) setHourlyWage(cfg.hourlyWage)
          if (cfg.targetLaborCostPercent) setTargetLaborCostPercent(cfg.targetLaborCostPercent)
        } catch (e) {
          console.warn('Lỗi đọc cấu hình chi nhánh:', e)
        }
      }
    }
  }, [selectedStoreId])

  // ─── Cập nhật staffingRequirements trực tiếp (FIX LỖ HỔNG 3) ───
  const handleUpdateRequirement = (shiftId: string, positionId: string, delta: number) => {
    if (!canManagePayroll) return
    const req = staffingRequirements.find(
      r => r.store_id === selectedStoreId && r.shift_id === shiftId && r.position_id === positionId
    )
    const current = req?.required_count || 0
    const next = Math.max(0, current + delta)
    updateRequirement(selectedStoreId, shiftId, positionId, next)
    setRenderKey(k => k + 1)
  }

  // ─── Lưu toàn bộ ───
  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`homies_staffing_store_${selectedStoreId}`, JSON.stringify({
        storeId: selectedStoreId,
        storeModel,
        weekdayRevenue,
        weekendRevenue,
        avgCupPrice,
        appOrderRatio,
        takeawaySpeed,
        hourlyWage,
        targetLaborCostPercent,
        updatedAt: new Date().toISOString(),
      }))
    }
    staffingAdapter.saveAdminSettings({
      productivity: takeawaySpeed,
      appOrderTimeBuffer: Math.round(appOrderRatio / 2),
      defaultSalaryFT: storeModel === 'takeaway_kiosk' ? 6500000 : 7500000,
      defaultSalaryPT: hourlyWage,
      bhxhRatio: 30,
      costWarningThreshold: targetLaborCostPercent,
    })
    setSavedNotice(`Đã lưu định biên & đồng bộ cho: ${currentStore.name}`)
    setTimeout(() => setSavedNotice(null), 4500)
  }

  const handleReset = () => {
    setWeekdayRevenue(10000000)
    setWeekendRevenue(16000000)
    setAvgCupPrice(32000)
    setAppOrderRatio(65)
    setTakeawaySpeed(35)
    setHourlyWage(24000)
    setTargetLaborCostPercent(17)
    setSavedNotice('Đã khôi phục về mẫu Trà Sữa Takeaway chuẩn.')
    setTimeout(() => setSavedNotice(null), 4000)
  }

  return (
    <AppShell title="Định biên & Tối ưu nhân sự">
      <div className="w-full min-h-screen bg-[#FFF8E8] pb-12 font-sans">

        {/* TẦNG 1: HEADER */}
        <div className="sticky top-0 z-30 w-full border-b border-gray-100 bg-white px-4 py-3 shadow-2xs sm:px-6 lg:px-8">
          <div className="flex w-full flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <span>HRM Homies</span>
                <ChevronRight size={12} className="text-gray-400" />
                <span>Cài Đặt Hệ Thống</span>
                <ChevronRight size={12} className="text-gray-400" />
                <span className="font-bold text-[#2F6FA8]">Định Biên Nhân Sự</span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-lg font-bold tracking-tight text-[#001D3D] sm:text-xl">
                  Quản Trị Định Biên &amp; Tối Ưu Nhân Lực Chuỗi
                </h1>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  mathFormula.actualLaborCostPercent <= targetLaborCostPercent
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border border-amber-300 bg-amber-50 text-amber-800'
                }`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                  Labor Cost: {mathFormula.actualLaborCostPercent}% (Mục tiêu: ≤{targetLaborCostPercent}%)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => router.push('/schedule')}
                className="flex min-h-[34px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-xs transition hover:bg-gray-50 cursor-pointer">
                <span>Mở Bảng Xếp Ca</span>
                <ChevronRight size={13} />
              </button>
              <button type="button" onClick={handleReset}
                className="flex min-h-[34px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-xs transition hover:bg-gray-50 cursor-pointer">
                <RotateCcw size={13} />
                <span>Khôi Phục Mẫu</span>
              </button>
              <button type="button" onClick={handleSave}
                className="flex min-h-[34px] items-center gap-1.5 rounded-xl bg-[#2F6FA8] px-4 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#1D3E61] cursor-pointer">
                <Save size={13} />
                <span>Lưu Định Biên</span>
              </button>
            </div>
          </div>

          {savedNotice && (
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>{savedNotice}</span>
            </div>
          )}
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 mt-4 space-y-4">

          {/* THANH CHỌN CHI NHÁNH & HIỆN TRẠNG */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                  <StoreIcon size={16} className="text-[#2F6FA8]" />
                  <span>Cửa hàng:</span>
                </div>
                <select value={selectedStoreId} onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-gray-50/80 px-3.5 py-1.5 text-xs font-bold text-[#001D3D] outline-none focus:border-[#2F6FA8] focus:bg-white shadow-2xs">
                  {mockStores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name} ({store.is_active ? 'Hoạt động' : 'Tạm dừng'})
                    </option>
                  ))}
                </select>
                <span className="text-xs text-gray-400 font-medium hidden sm:inline">
                  {currentStore.address}
                </span>
              </div>

              <div className="flex items-center gap-3 bg-blue-50/60 border border-blue-200/60 px-3.5 py-1.5 rounded-xl text-xs">
                <span className="text-gray-500 font-medium">Nhân sự thực tế:</span>
                <span className="font-bold text-[#001D3D]">{storeEmployees.length} người</span>
                <span className="font-mono text-[11px] font-bold text-[#2F6FA8] bg-white px-2 py-0.5 rounded border border-blue-200">
                  {actualFT} Full-time / {actualPT} Part-time
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Mô hình:</span>
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
                  <button type="button" onClick={() => { setStoreModel('takeaway_kiosk'); setTargetLaborCostPercent(17) }}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg transition cursor-pointer ${storeModel === 'takeaway_kiosk' ? 'bg-[#2F6FA8] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}>
                    <Bike size={13} /><span>Takeaway / Kiosk</span>
                  </button>
                  <button type="button" onClick={() => { setStoreModel('dinein_store'); setTargetLaborCostPercent(21) }}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg transition cursor-pointer ${storeModel === 'dinein_store' ? 'bg-[#2F6FA8] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}>
                    <StoreIcon size={13} /><span>Có Chỗ Ngồi</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Thời điểm:</span>
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
                  <button type="button" onClick={() => setDayMode('weekday')}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg transition cursor-pointer ${dayMode === 'weekday' ? 'bg-white text-[#001D3D] shadow-2xs' : 'text-gray-500 hover:text-gray-900'}`}>
                    <Calendar size={13} /><span>Ngày Thường</span>
                  </button>
                  <button type="button" onClick={() => setDayMode('weekend')}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg transition cursor-pointer ${dayMode === 'weekend' ? 'bg-amber-500 text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'}`}>
                    <Flame size={13} /><span>Cuối Tuần</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* TẦNG 2: 4 THẺ VĨ MÔ */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Doanh Thu Ngày ({dayMode === 'weekday' ? 'T2-T5' : 'T6-CN'})</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#2F6FA8]"><DollarSign size={18} /></div>
              </div>
              <div className="mt-2">
                <span className="font-mono text-2xl sm:text-3xl font-bold tabular-nums tracking-tight text-[#001D3D]">{formatVnd(currentDailyRevenue)}</span>
              </div>
              <p className="mt-1 text-[11px] font-medium text-gray-500">
                ~<strong className="font-mono text-gray-800">{mathFormula.totalCups} ly</strong> ({mathFormula.appCups} App + {mathFormula.walkinCups} Quầy)
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Tổng Giờ Công Cần Thiết</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Clock size={18} /></div>
              </div>
              <div className="mt-2">
                <span className="font-mono text-2xl sm:text-3xl font-bold tabular-nums tracking-tight text-emerald-700">{mathFormula.totalDailyLaborHours} <span className="text-xs font-normal text-gray-500">giờ / ngày</span></span>
              </div>
              <p className="mt-1 text-[11px] font-medium text-emerald-700">
                {mathFormula.directBrewingHours}h pha + {mathFormula.appPackagingHours}h gói App + {mathFormula.prepCleanupHours}h dọn
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Nhân Sự Hiện Có Tại Quán</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Users size={18} /></div>
              </div>
              <div className="mt-2">
                <span className="font-mono text-2xl sm:text-3xl font-bold tabular-nums tracking-tight text-[#001D3D]">
                  {actualFT} FT <span className="text-xs font-normal text-gray-400">/</span> {actualPT} PT
                </span>
              </div>
              <p className="mt-1 text-[11px] font-medium text-gray-500">
                Tổng {storeEmployees.length} nhân viên (FT = level ≥ 2 trong danh mục)
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Chi Phí Lương / Doanh Thu</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600"><TrendingUp size={18} /></div>
              </div>
              <div className="mt-2">
                <span className={`font-mono text-2xl sm:text-3xl font-bold tabular-nums tracking-tight ${
                  mathFormula.actualLaborCostPercent <= targetLaborCostPercent ? 'text-emerald-700' : 'text-amber-800'
                }`}>{mathFormula.actualLaborCostPercent}% <span className="text-xs font-normal text-gray-500">doanh thu</span></span>
              </div>
              <p className="mt-1 text-[11px] font-medium text-purple-700">
                Tiền lương ngày: <strong className="font-mono">{formatVnd(mathFormula.totalDailyLaborCost)}</strong>
              </p>
            </div>
          </div>

          {/* TẦNG 3: BẢNG ĐỊNH BIÊN + THAM SỐ */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">

            {/* CỘT CHÍNH (8/12) */}
            <div className="space-y-4 lg:col-span-8">

              {/* BÓC TÁCH CÔNG THỨC + THANH TRƯỢT */}
              <div className="rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50/70 via-white to-amber-50/40 p-5 shadow-xs space-y-4">
                <div className="space-y-0.5">
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-[#2F6FA8]/10 px-2 py-0.5 text-[11px] font-bold text-[#2F6FA8]">
                    <Calculator size={13} />
                    <span>Công Thức Tính Giờ Công Từ Doanh Thu</span>
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-[#001D3D]">
                    Bóc tách minh bạch: Doanh thu ➔ Số ly ➔ Tổng giờ ➔ Chi phí lương
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-xl bg-white p-3.5 border border-gray-100 space-y-1">
                    <span className="text-[11px] font-bold uppercase text-gray-400">Bước 1: DT ➔ Ly</span>
                    <div className="font-mono text-base font-bold text-[#001D3D]">{mathFormula.totalCups} ly / ngày</div>
                    <p className="text-[11px] text-gray-500 leading-4">
                      = {formatVnd(currentDailyRevenue)} ÷ {formatVnd(avgCupPrice)}. Gồm <strong>{mathFormula.appCups} ly App</strong> ({appOrderRatio}%).
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-3.5 border border-gray-100 space-y-1">
                    <span className="text-[11px] font-bold uppercase text-gray-400">Bước 2: Ly ➔ Giờ</span>
                    <div className="font-mono text-base font-bold text-emerald-700">{mathFormula.totalDailyLaborHours} giờ / ngày</div>
                    <p className="text-[11px] text-gray-500 leading-4">
                      = {mathFormula.directBrewingHours}h pha + {mathFormula.appPackagingHours}h gói (20s/ly) + {mathFormula.prepCleanupHours}h dọn.
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-3.5 border border-gray-100 space-y-1">
                    <span className="text-[11px] font-bold uppercase text-gray-400">Bước 3: Chi Phí</span>
                    <div className="font-mono text-base font-bold text-[#2F6FA8]">{formatVnd(mathFormula.totalDailyLaborCost)}</div>
                    <p className="text-[11px] text-gray-500 leading-4">
                      = {mathFormula.totalDailyLaborHours}h × {formatVnd(hourlyWage)}/h = <strong>{mathFormula.actualLaborCostPercent}%</strong> DT.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-700">Doanh thu ngày ({dayMode === 'weekday' ? 'Ngày Thường' : 'Cuối Tuần'}):</span>
                    <span className="font-mono text-sm font-bold text-[#2F6FA8]">{formatVnd(currentDailyRevenue)}</span>
                  </div>
                  <input type="range" min={4000000} max={35000000} step={500000}
                    value={currentDailyRevenue}
                    onChange={(e) => setCurrentRevenue(Number(e.target.value))}
                    className="w-full accent-[#2F6FA8] cursor-pointer" />
                </div>
              </div>

              {/* BẢNG ĐỊNH BIÊN TỪNG CA — ĐỌC TỪ staffingRequirements THẬT */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-sm font-bold text-[#001D3D] flex items-center gap-2">
                      <Layers size={16} className="text-[#2F6FA8]" />
                      <span>Định Biên Từng Ca — Vị Trí Chuẩn Từ Danh Mục Homies</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Dữ liệu đồng bộ trực tiếp với Bảng Xếp Ca. Tăng/giảm cập nhật ngay lập tức.
                    </p>
                  </div>
                  <div className="text-xs font-bold text-[#001D3D] bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl shrink-0">
                    Tổng / ngày: <span className="font-mono text-sm text-[#2F6FA8]">{totalRequiredPerDay} nhân sự</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {shiftRows.map((row) => {
                    const shiftTotal = row.positions.reduce((s, p) => s + p.requiredCount, 0)
                    return (
                      <div key={row.shiftId} className="rounded-xl p-4 border border-gray-100 bg-gray-50/70 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: row.color }}></div>
                            <span className="font-bold text-sm text-[#001D3D]">{row.shiftName}</span>
                            <span className="font-mono text-xs font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                              {row.timeRange}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-[#001D3D] bg-white border border-gray-200 px-2.5 py-1 rounded-lg">
                            Tổng: <span className="font-mono text-sm font-bold text-[#2F6FA8]">{shiftTotal}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {row.positions.map((pos) => (
                            <div key={pos.positionId}
                              className={`rounded-lg bg-white p-2.5 border flex items-center justify-between ${
                                pos.isMandatory ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200/80'
                              }`}>
                              <div>
                                <span className="text-xs font-bold text-gray-800 block">{pos.positionName}</span>
                                <span className="text-[10px] text-gray-400">
                                  {pos.isMandatory ? 'Bắt buộc' : pos.positionId}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button type="button" disabled={!canManagePayroll}
                                  onClick={() => handleUpdateRequirement(row.shiftId, pos.positionId, -1)}
                                  className="h-6 w-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition cursor-pointer disabled:opacity-40">
                                  <Minus size={11} />
                                </button>
                                <span className="font-mono text-sm font-bold text-gray-900 w-4 text-center">{pos.requiredCount}</span>
                                <button type="button" disabled={!canManagePayroll}
                                  onClick={() => handleUpdateRequirement(row.shiftId, pos.positionId, 1)}
                                  className="h-6 w-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition cursor-pointer disabled:opacity-40">
                                  <Plus size={11} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* CỘT PHỤ (4/12): THAM SỐ VẬN HÀNH */}
            <div className="space-y-4 lg:col-span-4">
              <div className="sticky top-20 rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2F6FA8]"><SlidersHorizontal size={18} /></div>
                  <div>
                    <h3 className="text-sm font-bold text-[#001D3D]">Tham Số Vận Hành</h3>
                    <p className="text-[11px] text-gray-400 font-medium">Custom Business Rules</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>Tốc độ ra ly:</span>
                    <span className="font-mono text-sm text-[#2F6FA8] font-bold">{takeawaySpeed} ly/h</span>
                  </div>
                  <input type="range" min={20} max={50} step={5} value={takeawaySpeed}
                    onChange={(e) => setTakeawaySpeed(Number(e.target.value))}
                    className="w-full accent-[#2F6FA8] cursor-pointer" />
                  <p className="text-[11px] text-gray-400">Bình ủ trà + máy dập nắp: 35–45 ly/h</p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>Tỷ trọng đơn App:</span>
                    <span className="font-mono text-sm text-amber-700 font-bold">{appOrderRatio}%</span>
                  </div>
                  <input type="range" min={20} max={85} step={5} value={appOrderRatio}
                    onChange={(e) => setAppOrderRatio(Number(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer" />
                </div>

                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>Giá bán trung bình (AOV):</span>
                    <span className="font-mono text-sm text-gray-900 font-bold">{formatVnd(avgCupPrice)}</span>
                  </div>
                  <input type="range" min={22000} max={50000} step={1000} value={avgCupPrice}
                    onChange={(e) => setAvgCupPrice(Number(e.target.value))}
                    className="w-full accent-[#2F6FA8] cursor-pointer" />
                </div>

                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>Đơn giá lương Part-time:</span>
                    <span className="font-mono text-sm text-emerald-700 font-bold">{formatVnd(hourlyWage)}/h</span>
                  </div>
                  <input type="range" min={20000} max={32000} step={1000} value={hourlyWage}
                    onChange={(e) => setHourlyWage(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer" />
                </div>

                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>Trần chi phí nhân công:</span>
                    <span className="font-mono text-sm text-purple-700 font-bold">{targetLaborCostPercent}% DT</span>
                  </div>
                  <input type="range" min={14} max={25} step={1} value={targetLaborCostPercent}
                    onChange={(e) => setTargetLaborCostPercent(Number(e.target.value))}
                    className="w-full accent-purple-600 cursor-pointer" />
                </div>

                {/* Card Hiện Trạng */}
                <div className="rounded-2xl bg-[#001D3D] p-4 text-white space-y-2 shadow-md">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 block">
                    So Khớp Định Biên vs Thực Tế
                  </span>
                  <div className="text-xs text-gray-300 space-y-1">
                    <div className="flex justify-between">
                      <span>Định biên cần / ngày:</span>
                      <strong className="text-white font-mono">{totalRequiredPerDay} nhân sự (3 ca)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Quán hiện có:</span>
                      <strong className="text-emerald-400 font-mono">{actualFT} FT + {actualPT} PT = {storeEmployees.length}</strong>
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-white/15 text-[11px] text-gray-300">
                    {storeEmployees.length >= Math.ceil(totalRequiredPerDay / mockShifts.length * 1.3) ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Đội ngũ đủ xoay ca linh hoạt
                      </span>
                    ) : (
                      <span className="text-amber-300 font-bold flex items-center gap-1">
                        <AlertCircle size={12} /> Cần xem xét tuyển thêm nhân sự Part-time
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
