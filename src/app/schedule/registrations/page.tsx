'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import {
  ShiftRegistrationService,
  type HeatmapCell,
  type CoverageRateResult,
  type StaffRegistrationSummary,
} from '@/lib/services/scheduling/shift-registration-service'
import { getStoresList, mockStores } from '@/lib/mock-data'
import { getMondayOfDate, formatDateString } from '@/lib/mock-data-registration-weeks'
import RegistrationHeaderAndKpis from '@/components/scheduling/registrations/RegistrationHeaderAndKpis'
import RegistrationMatrixAndStaffView from '@/components/scheduling/registrations/RegistrationMatrixAndStaffView'
import {
  RegistrationCellDrawer,
  ZaloReminderModal,
} from '@/components/scheduling/registrations/RegistrationCellDrawer'
import { CheckCircle2, AlertCircle } from 'lucide-react'

export default function ShiftRegistrationsHeatmapPage() {
  // 1. Quản lý Tuần được chọn
  const today = useMemo(() => new Date(), [])
  const thisMon = useMemo(() => getMondayOfDate(today), [today])
  const nextMon = useMemo(() => {
    const d = new Date(thisMon)
    d.setDate(thisMon.getDate() + 7)
    return d
  }, [thisMon])
  const prevMon = useMemo(() => {
    const d = new Date(thisMon)
    d.setDate(thisMon.getDate() - 7)
    return d
  }, [thisMon])

  const thisMonStr = useMemo(() => formatDateString(thisMon), [thisMon])
  const nextMonStr = useMemo(() => formatDateString(nextMon), [nextMon])
  const prevMonStr = useMemo(() => formatDateString(prevMon), [prevMon])

  // Mặc định chọn Tuần tới (đúng thực tế xếp lịch của Store Manager)
  const [selectedWeek, setSelectedWeek] = useState<string>(nextMonStr)
  // Mặc định chọn Store Hồ Bá Phấn (store-001)
  const [selectedStoreId, setSelectedStoreId] = useState<string>('store-001')

  // State tương tác UI
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'RISK' | 'PENDING' | 'APPROVED'>('ALL')
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null)
  const [isZaloModalOpen, setIsZaloModalOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [dataVersion, setDataVersion] = useState(0)
  const [stores, setStores] = useState<Array<{ id: string; name: string; is_active?: boolean }>>(() => getStoresList())
  const [dataSource, setDataSource] = useState<'ipos_cloud' | 'homies_native' | 'internal_db'>('ipos_cloud')
  const [weekStatus, setWeekStatus] = useState<'draft' | 'published'>('draft')
  const [toastNotice, setToastNotice] = useState<{ message: string; type: 'success' | 'info' } | null>(null)

  // Đọc storeId & weekStart từ URL nếu được điều hướng từ Bảng Xếp Lịch
  useEffect(() => {
    if (typeof window === 'undefined') return
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search)
      const storeParam = params.get('storeId')
      const weekParam = params.get('weekStart')
      if (storeParam) {
        setSelectedStoreId(storeParam)
      }
      if (weekParam && /^\d{4}-\d{2}-\d{2}$/.test(weekParam)) {
        const [y, m, d] = weekParam.split('-').map(Number)
        setSelectedWeek(formatDateString(getMondayOfDate(new Date(y, m - 1, d))))
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  // Hiển thị thông báo Toast nhanh
  const showToast = useCallback((message: string, type: 'success' | 'info' = 'success') => {
    setToastNotice({ message, type })
    setTimeout(() => {
      setToastNotice(null)
    }, 3000)
  }, [])

  // Nạp danh sách chi nhánh đang hoạt động từ máy chủ (/api/stores)
  useEffect(() => {
    fetch('/api/stores', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : null))
      .then(json => {
        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          setStores(json.data.filter((s: { is_active?: boolean }) => s.is_active !== false))
        }
      })
      .catch(() => {})
  }, [])

  // Đồng bộ ca đăng ký, nhân sự thực tế từ Database máy chủ & kiểm tra chế độ iPOS / Homies Tự Vận Hành + trạng thái chốt tuần
  const syncData = useCallback(async (storeId: string, week: string) => {
    setIsSyncing(true)
    try {
      const regParams = new URLSearchParams({
        store_id: storeId,
        week,
        status: 'all',
      })
      const [modeRes, weekStatusRes] = await Promise.all([
        fetch('/api/ipos/cloud-worker', { cache: 'no-store' }).catch(() => null),
        fetch(`/api/shifts/register?${regParams.toString()}`, { cache: 'no-store' }).catch(() => null),
        ShiftRegistrationService.syncEmployeesFromServer(),
        ShiftRegistrationService.syncRegistrationsFromServer(storeId, week),
      ])
      if (modeRes && modeRes.ok) {
        const modeJson = await modeRes.json().catch(() => null)
        const shiftsEnabled = modeJson?.data_mode
          ? Boolean(modeJson.data_mode.ipos_master_enabled && modeJson.data_mode.modules?.shifts)
          : modeJson?.config?.is_enabled !== false && modeJson?.config?.sync_shifts !== false
        setDataSource(shiftsEnabled ? 'ipos_cloud' : 'homies_native')
      }
      if (weekStatusRes && weekStatusRes.ok) {
        const weekJson = await weekStatusRes.json().catch(() => null)
        setWeekStatus(weekJson?.week_status === 'published' ? 'published' : 'draft')
      }
      setDataVersion(v => v + 1)
    } catch (err) {
      console.error('Lỗi khi đồng bộ ca đăng ký:', err)
    } finally {
      setIsSyncing(false)
    }
  }, [])

  useEffect(() => {
    if (selectedStoreId && selectedWeek) {
      syncData(selectedStoreId, selectedWeek)
    }
  }, [selectedStoreId, selectedWeek, syncData])

  // Tự động cập nhật ngay khi gạt Công tắc Vận hành trên thanh Header
  useEffect(() => {
    const handleModeChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{
        ipos_master_enabled?: boolean
        modules?: { shifts?: boolean }
      }>
      const detail = customEvent.detail
      if (detail) {
        const shiftsEnabled = Boolean(detail.ipos_master_enabled && detail.modules?.shifts)
        setDataSource(shiftsEnabled ? 'ipos_cloud' : 'homies_native')
      }
      if (selectedStoreId && selectedWeek) {
        syncData(selectedStoreId, selectedWeek)
      }
    }
    window.addEventListener('homies-data-mode-changed', handleModeChanged)
    return () => window.removeEventListener('homies-data-mode-changed', handleModeChanged)
  }, [selectedStoreId, selectedWeek, syncData])

  // 2. Lấy dữ liệu Coverage & Heatmap & Staff Overview
  const coverageData: CoverageRateResult = useMemo(() => {
    return ShiftRegistrationService.getCoverageRate(selectedStoreId, selectedWeek)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreId, selectedWeek, dataVersion])

  const heatmapCells: HeatmapCell[] = useMemo(() => {
    return ShiftRegistrationService.getHeatmapData(selectedStoreId, selectedWeek)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreId, selectedWeek, dataVersion])

  const staffOverview: StaffRegistrationSummary[] = useMemo(() => {
    return ShiftRegistrationService.getStaffOverview(selectedStoreId, selectedWeek)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreId, selectedWeek, dataVersion])

  // Thống kê tổng hợp
  const stats = useMemo(() => {
    const emptyCount = heatmapCells.filter(c => c.status === 'EMPTY').length
    const riskCount = heatmapCells.filter(c => c.status === 'RISK').length
    const fullCount = heatmapCells.filter(c => c.status === 'FULL').length

    let totalRegistrations = 0
    let approvedTotal = 0
    let pendingTotal = 0

    heatmapCells.forEach(cell => {
      totalRegistrations += cell.count
      approvedTotal += cell.approvedCount
      pendingTotal += cell.pendingCount
    })

    return {
      emptyCount,
      riskCount,
      fullCount,
      totalRegistrations,
      approvedTotal,
      pendingTotal,
    }
  }, [heatmapCells])

  // Cập nhật selectedCell khi dữ liệu thay đổi
  useEffect(() => {
    if (selectedCell) {
      const updated = heatmapCells.find(
        c => c.date === selectedCell.date && c.shiftId === selectedCell.shiftId
      )
      if (updated) setSelectedCell(updated)
    }
  }, [heatmapCells, selectedCell])

  // 3. Handlers phê duyệt & từ chối
  const handleApproveOne = async (registrationId: string) => {
    ShiftRegistrationService.approveRegistration(registrationId, 'Quản lý cửa hàng')
    setDataVersion(v => v + 1)
    showToast('Đã duyệt thành công 1 ca đăng ký')

    // Gọi API lưu DB máy chủ ngầm
    fetch('/api/shifts/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registration_ids: [registrationId],
        action: 'approve',
      }),
    }).catch(err => console.error('Lỗi API approve:', err))
  }

  const handleRejectOne = async (registrationId: string) => {
    ShiftRegistrationService.rejectRegistration(registrationId)
    setDataVersion(v => v + 1)
    showToast('Đã từ chối 1 ca đăng ký', 'info')

    fetch('/api/shifts/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registration_ids: [registrationId],
        action: 'reject',
      }),
    }).catch(err => console.error('Lỗi API reject:', err))
  }

  const handleApproveCell = (date: string, shiftId: string) => {
    const res = ShiftRegistrationService.approveCell(
      selectedStoreId,
      date,
      shiftId,
      'Quản lý cửa hàng'
    )
    setDataVersion(v => v + 1)
    showToast(`Đã duyệt thành công ${res.approvedCount} ca trong khung giờ này`)
  }

  const handleApproveAll = () => {
    const res = ShiftRegistrationService.approveAllPendingForWeek(
      selectedStoreId,
      selectedWeek
    )
    setDataVersion(v => v + 1)
    showToast(`Đã duyệt toàn bộ ${res.approvedCount} ca rảnh của tuần`)
  }

  const handleApproveStaffAll = async (staffId: string) => {
    const staffRegs = heatmapCells
      .flatMap(c => c.registrations)
      .filter(r => r.employee_id === staffId && r.status === 'PENDING')

    staffRegs.forEach(r => {
      ShiftRegistrationService.approveRegistration(r.id, 'Quản lý cửa hàng')
    })
    setDataVersion(v => v + 1)
    showToast(`Đã duyệt toàn bộ ${staffRegs.length} ca của nhân sự`)

    if (staffRegs.length > 0) {
      fetch('/api/shifts/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_ids: staffRegs.map(r => r.id),
          action: 'approve',
        }),
      }).catch(err => console.error('Lỗi API approve staff:', err))
    }
  }

  const currentStore = stores.find(s => s.id === selectedStoreId) || stores[0] || mockStores[0]

  return (
    <AppShell>
      <div className="w-full max-w-none bg-[#FFF8E8] min-h-screen pb-12 space-y-6">
        {/* TẦNG 1 & TẦNG 2: COMMAND HEADER & 4 KPI CARDS VĨ MÔ */}
        <RegistrationHeaderAndKpis
          selectedStoreId={selectedStoreId}
          onSelectStoreId={setSelectedStoreId}
          selectedWeek={selectedWeek}
          onSelectWeek={setSelectedWeek}
          thisMonStr={thisMonStr}
          nextMonStr={nextMonStr}
          prevMonStr={prevMonStr}
          isSyncing={isSyncing}
          onRefresh={() => syncData(selectedStoreId, selectedWeek)}
          onApproveAll={handleApproveAll}
          pendingTotal={stats.pendingTotal}
          coverageData={coverageData}
          totalRegistrations={stats.totalRegistrations}
          approvedTotal={stats.approvedTotal}
          riskCount={stats.riskCount}
          emptyCount={stats.emptyCount}
          fullCount={stats.fullCount}
          filterStatus={filterStatus}
          onSelectFilterStatus={setFilterStatus}
          dataSource={dataSource}
          stores={stores}
          weekStatus={weekStatus}
          scheduleHref={`/schedule?storeId=${encodeURIComponent(selectedStoreId)}&weekStart=${encodeURIComponent(selectedWeek)}`}
        />

        {/* TẦNG 3: BẢNG MA TRẬN 7X3 & THEO DÕI NHÂN VIÊN */}
        <div className="px-4 sm:px-6 lg:px-8 w-full">
          <RegistrationMatrixAndStaffView
            selectedStoreId={selectedStoreId}
            selectedWeek={selectedWeek}
            heatmapCells={heatmapCells}
            staffOverview={staffOverview}
            coverageData={coverageData}
            filterStatus={filterStatus}
            onSelectFilterStatus={setFilterStatus}
            onSelectCell={setSelectedCell}
            onApproveCell={handleApproveCell}
            onOpenZaloModal={() => setIsZaloModalOpen(true)}
            onApproveStaffAll={handleApproveStaffAll}
          />
        </div>

        {/* DRAWER BÓC TÁCH CHI TIẾT Ô CA */}
        <RegistrationCellDrawer
          isOpen={!!selectedCell}
          cell={selectedCell}
          onClose={() => setSelectedCell(null)}
          onApproveOne={handleApproveOne}
          onRejectOne={handleRejectOne}
          onApproveCell={handleApproveCell}
        />

        {/* MODAL SOẠN NHẮC NHỞ QUA ZALO */}
        <ZaloReminderModal
          isOpen={isZaloModalOpen}
          onClose={() => setIsZaloModalOpen(false)}
          storeName={currentStore.name}
          weekStartDate={selectedWeek}
          missingStaff={coverageData.missingEmployees}
        />

        {/* TOAST THÔNG BÁO THÀNH CÔNG */}
        {toastNotice && (
          <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
            <div
              className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold text-white ${
                toastNotice.type === 'success'
                  ? 'bg-emerald-600 border-emerald-500'
                  : 'bg-[#2F6FA8] border-blue-500'
              }`}
            >
              <CheckCircle2 size={16} />
              <span>{toastNotice.message}</span>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
