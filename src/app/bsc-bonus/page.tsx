'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import BSCExecutiveCards from '@/components/bsc-bonus/BSCExecutiveCards'
import BSCScorecardGap from '@/components/bsc-bonus/BSCScorecardGap'
import BSCTeamTable from '@/components/bsc-bonus/BSCTeamTable'
import BSCIndividualDetailModal from '@/components/bsc-bonus/BSCIndividualDetailModal'
import BSCMonthlyInputForm from '@/components/bsc-bonus/BSCMonthlyInputForm'
import BSCMonthlyImportModal from '@/components/bsc-bonus/BSCMonthlyImportModal'
import BSCLogsTab from '@/components/bsc-bonus/BSCLogsTab'
import BSCRadarChart from '@/components/bsc-bonus/BSCRadarChart'
import BSCHistoryChart from '@/components/bsc-bonus/BSCHistoryChart'
import { calculateBSCTeamBonus } from '@/lib/bsc-engine'
import { bscAdapter } from '@/lib/adapters/bsc-adapter'
import { mockBSCRoadmapMilestones } from '@/lib/mock-data-bsc'
import type { BSCRevenueTarget, BSCEmployeePersonalData, BSCCriteriaInfo, BSCStoreResult, BSCPersonalErrorRecord, BSCOperationErrorRecord } from '@/lib/bsc-types'
import { useMounted } from '@/hooks/useMounted'
import BSCHandbookTab from '@/components/bsc-bonus/BSCHandbookTab'
import {
  Calendar,
  LayoutDashboard,
  ClipboardList,
  Sliders,
  Edit3,
  Building2,
  BarChart3,
  ChevronRight,
  FileSpreadsheet,
  Upload,
  ShieldAlert,
  ShieldCheck,
  Send,
  Sparkles,
  CheckCircle2,
  Rocket,
  Loader2,
  BookOpen,
  Users,
} from 'lucide-react'

type ActiveTab = 'overview' | 'settlement' | 'audit_report' | 'settings' | 'handbook'
export type BSCBonusPeriodStatus = 'draft' | 'pending_ceo' | 'published'

function getDynamicPeriods(currentPeriod: string, count: number = 3): string[] {
  const [yearStr, monthStr] = currentPeriod.split('-')
  const year = parseInt(yearStr, 10) || 2026
  const month = parseInt(monthStr, 10) || 7
  const periods: string[] = []

  for (let i = count - 1; i >= 0; i--) {
    let m = month - i
    let y = year
    while (m <= 0) {
      m += 12
      y -= 1
    }
    periods.push(`${y}-${String(m).padStart(2, '0')}`)
  }
  return periods
}

function BSCBonusContent() {
  const { user, isAuthenticated } = useAuthStore()
  const mounted = useMounted()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isCEO = ['ceo', 'area_manager', 'hr_admin'].includes(user?.role || '')
  const isStoreManager = user?.role === 'store_manager'
  const isShiftLeader = user?.role === 'shift_leader'
  const isManager = ['store_manager', 'shift_leader', 'area_manager', 'ceo', 'hr_admin'].includes(user?.role || '')
  const defaultTab: ActiveTab = isShiftLeader ? 'audit_report' : 'handbook'

  // ── URL SearchParams Synchronization ──
  const canSwitchStore = isCEO || (user?.secondary_store_ids && user.secondary_store_ids.length > 1) || isStoreManager
  const requestedTab = (searchParams.get('tab') as ActiveTab) || defaultTab
  const currentPeriod = searchParams.get('period') || '2026-08'
  const currentStoreId = canSwitchStore ? (searchParams.get('storeId') || user?.store_id || 'store-001') : (user?.store_id || 'store-001')

  const [allowStoreManagerViewBonus, setAllowStoreManagerViewBonus] = useState<boolean>(true)
  const canStoreManagerView = allowStoreManagerViewBonus || !isStoreManager
  const currentTab = (!canStoreManagerView && requestedTab === 'overview') ? 'handbook' : requestedTab

  const [selectedPeriod, setSelectedPeriod] = useState<string>(currentPeriod)
  const [selectedStoreId, setSelectedStoreId] = useState<string>(currentStoreId)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(user?.id || '')
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [approvalStatus, setApprovalStatus] = useState<BSCBonusPeriodStatus>('draft')
  const [isExporting, setIsExporting] = useState(false)
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  // Adapter States
  const [revenueTargets, setRevenueTargets] = useState<BSCRevenueTarget[]>([])
  const [empDataList, setEmpDataList] = useState<BSCEmployeePersonalData[]>([])
  const [criteriaList, setCriteriaList] = useState<BSCCriteriaInfo[]>([])
  const [opErrorsList, setOpErrorsList] = useState<BSCOperationErrorRecord[]>([])

  // Kiểm tra xác thực tức thì khi đã mount
  useEffect(() => {
    if (!mounted) return
    if (!isAuthenticated || !user) {
      router.replace('/login?redirect=/bsc-bonus')
    }
  }, [mounted, isAuthenticated, user, router])

  // Sync state to URL
  const updateUrlParams = (newParams: { tab?: ActiveTab; period?: string; storeId?: string }) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newParams.tab) params.set('tab', newParams.tab)
    if (newParams.period) params.set('period', newParams.period)
    if (newParams.storeId && canSwitchStore) params.set('storeId', newParams.storeId)
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handleTabChange = (tab: ActiveTab) => {
    updateUrlParams({ tab })
  }

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    updateUrlParams({ period })
  }

  const handleStoreChange = (storeId: string) => {
    if (!canSwitchStore) return
    setSelectedStoreId(storeId)
    setSelectedEmployeeId('')
    updateUrlParams({ storeId })
  }

  useEffect(() => {
    let isMounted = true
    async function loadBSCData() {
      try {
        const [targets, empData, criteria, opErrors, safety] = await Promise.all([
          bscAdapter.getRevenueTargets(selectedStoreId, selectedPeriod),
          bscAdapter.getEmployeePersonalData(selectedStoreId, selectedPeriod),
          bscAdapter.getCriteriaCatalog(),
          bscAdapter.getOperationErrors(selectedStoreId, selectedPeriod),
          bscAdapter.getSafetySettings(),
        ])
        if (isMounted) {
          setRevenueTargets(targets)
          setEmpDataList(empData)
          setCriteriaList(criteria)
          setOpErrorsList(opErrors)
          if (typeof safety?.allow_store_manager_view_bonus === 'boolean') {
            setAllowStoreManagerViewBonus(safety.allow_store_manager_view_bonus)
          }

          // Đồng bộ trạng thái duyệt từ database máy chủ
          const matchedTarget = targets.find(t => t.store_id === selectedStoreId && t.period === selectedPeriod)
          if (matchedTarget?.approval_status) {
            const mapped = matchedTarget.approval_status === 'approved_published' ? 'published' : matchedTarget.approval_status
            setApprovalStatus(mapped as BSCBonusPeriodStatus)
          }
        }
      } catch (err) {
        console.warn('[BSCBonusPage] Error loading adapter data:', err)
      }
    }
    loadBSCData()
    return () => { isMounted = false }
  }, [selectedStoreId, selectedPeriod, refreshKey])

  // Xử lý gửi duyệt và phê duyệt qua API Backend
  const handleManagerSubmit = async () => {
    setIsSubmittingApproval(true)
    try {
      const submitter = user?.full_name || 'Quản lý Huỳnh Lê Kiều Linh'
      const ok = await bscAdapter.saveRevenueTarget(selectedStoreId, selectedPeriod, {
        approval_status: 'pending_ceo',
        submitted_by: submitter,
        submitted_at: new Date().toISOString(),
      })
      if (ok) {
        setApprovalStatus('pending_ceo')
        setToastMessage(`Quản lý ${submitter} đã duyệt & gửi bản quyết toán BSC lên CEO phê duyệt!`)
        setRefreshKey(k => k + 1)
        setTimeout(() => setToastMessage(''), 4000)
      }
    } finally {
      setIsSubmittingApproval(false)
    }
  }

  const handleCEOApprove = async () => {
    setIsSubmittingApproval(true)
    try {
      const res = await bscAdapter.approveBSC(
        selectedStoreId,
        selectedPeriod,
        'approve',
        user?.full_name || 'CEO Nguyễn Đức Nghĩa'
      )
      if (res.success) {
        setApprovalStatus('published')
        setToastMessage(res.message || 'CEO đã phê duyệt & ban hành quyết toán BSC! Tiền thưởng đã tự động nhảy vào phiếu lương.')
        setRefreshKey(k => k + 1)
        setTimeout(() => setToastMessage(''), 4000)
      }
    } finally {
      setIsSubmittingApproval(false)
    }
  }

  const handleCEOReject = async () => {
    setIsSubmittingApproval(true)
    try {
      const res = await bscAdapter.approveBSC(
        selectedStoreId,
        selectedPeriod,
        'reject',
        user?.full_name || 'CEO Nguyễn Đức Nghĩa'
      )
      if (res.success) {
        setApprovalStatus('draft')
        setToastMessage('Đã trả về bản nháp để Quản lý cửa hàng rà soát lại số liệu.')
        setRefreshKey(k => k + 1)
        setTimeout(() => setToastMessage(''), 3500)
      }
    } finally {
      setIsSubmittingApproval(false)
    }
  }

  const handleCEOReopen = async () => {
    setIsSubmittingApproval(true)
    try {
      const res = await bscAdapter.approveBSC(
        selectedStoreId,
        selectedPeriod,
        'reopen',
        user?.full_name || 'CEO Nguyễn Đức Nghĩa'
      )
      if (res.success) {
        setApprovalStatus('pending_ceo')
        setToastMessage('Đã mở lại chế độ thẩm định BSC.')
        setRefreshKey(k => k + 1)
        setTimeout(() => setToastMessage(''), 3500)
      }
    } finally {
      setIsSubmittingApproval(false)
    }
  }

  // Khắc phục kẹt tải: Render ngay sau khi mount (< 500ms)
  if (!mounted) {
    return (
      <AppShell showNav className="w-full max-w-none">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2F6FA8] border-t-transparent" />
        </div>
      </AppShell>
    )
  }

  if (!user || !isAuthenticated) return null

  const storeId = isCEO ? selectedStoreId : (user.store_id || 'store-001')

  // Dynamic Calculations using adapter data sources
  const targetsSource = revenueTargets.length > 0 ? revenueTargets : undefined
  const empSource = empDataList.length > 0 ? empDataList : undefined
  const criteriaSource = criteriaList.length > 0 ? criteriaList : undefined

  const teamSummary = calculateBSCTeamBonus(storeId, selectedPeriod, targetsSource, empSource, undefined, criteriaSource)

  const formatVnd = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount)

  // Export summary report as CSV
  const handleExportCSV = () => {
    setIsExporting(true)
    try {
      const headers = ['Mã NV', 'Họ và tên', 'Chức vụ', 'Cấp bậc', 'Giờ làm (h)', 'Đủ giờ', 'Lỗi cá nhân (điểm)', 'Hệ số lỗi', 'Điểm chia', 'Tỷ lệ %', 'Thưởng BSC (VND)', 'Ghi chú']
      const rows = teamSummary.individual_results.map(r => [
        `"${r.employee_id}"`,
        `"${r.employee_name}"`,
        `"${r.role}"`,
        `"${r.level_label}"`,
        r.work_hours,
        r.is_eligible_hours ? 'Đạt' : 'Không',
        r.personal_error_count,
        r.personal_coefficient,
        r.personal_share_points,
        `${r.share_percentage}%`,
        r.bonus_amount,
        `"${r.lock_reason || ''}"`,
      ])

      const csvContent = '\uFEFF' + [
        `BÁO CÁO THƯỞNG BSC - ${teamSummary.store_name.toUpperCase()}`,
        `Kỳ xét: ${selectedPeriod}`,
        `Tổng quỹ thưởng: ${teamSummary.store_result.store_bonus_pool} VND`,
        `Thực chi nhân viên: ${teamSummary.total_distributed_bonus_amount} VND`,
        `Phần tiền giữ lại: ${teamSummary.retained_bonus_amount} VND`,
        '',
        headers.join(','),
        ...rows.map(row => row.join(',')),
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `Bao_Cao_Thuong_BSC_${teamSummary.store_name.replace(/\s+/g, '_')}_${selectedPeriod}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  // Selected employee result for modal
  const inspectedEmpId = selectedEmployeeId || user.id
  const currentEmpData = empDataList.find(e => e.employee_id === inspectedEmpId)
  const myErrors: BSCPersonalErrorRecord[] = currentEmpData?.errors || []

  // Dynamic available periods
  const availablePeriods = ['2026-08', '2026-07', '2026-06', '2026-05', '2026-04']
  const dynamicHistoryPeriods = getDynamicPeriods(selectedPeriod, 3)
  const historyData: BSCStoreResult[] = dynamicHistoryPeriods.map(p => {
    const summary = calculateBSCTeamBonus(storeId, p, targetsSource, empSource, undefined, criteriaSource)
    return summary.store_result
  })

  // Error metrics for selected store & period
  const storeOpErrors = opErrorsList.filter(
    e => (e.store_id === storeId || !e.store_id) && (!e.period || e.period === selectedPeriod)
  )
  const storeEmpList = empSource && empSource.length > 0 ? empSource : []
  const storePersErrors = storeEmpList
    .filter(e => (e.store_id === storeId || !e.store_id) && (!e.period || e.period === selectedPeriod))
    .flatMap(e => e.errors || [])

  const opErrorPoints = storeOpErrors.reduce((sum, e) => sum + (e.points || 0), 0)
  const criticalErrorCount = storeOpErrors.filter(e => e.event_category === 'critical' || Boolean(e.locks_personal_bonus)).length + storePersErrors.filter(e => Boolean(e.is_serious)).length

  return (
    <AppShell showNav className="w-full max-w-none">
      <div className="min-h-screen bg-[#FFF8E8] pb-12 w-full">
        {/* ══════════════════════════════════════════════════════════════
            TẦNG 1: EXECUTIVE COMMAND HEADER (TÍCH HỢP TOÀN BỘ ACTION PHÊ DUYỆT)
            ══════════════════════════════════════════════════════════════ */}
        <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-3.5 shadow-2xs w-full sticky top-0 z-30">
          <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Cột trái: Breadcrumb + Tiêu đề nghiệp vụ + Trạng thái */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <span>HRM Homies</span>
                <ChevronRight size={12} className="text-gray-400" />
                <span className="text-[#2F6FA8] font-bold">Thẩm Định &amp; Phê Duyệt BSC</span>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-[#001D3D] tracking-tight">
                  Báo Cáo Điểm &amp; Phê Duyệt Thưởng BSC
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  approvalStatus === 'published'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : approvalStatus === 'pending_ceo'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}>
                  {approvalStatus === 'published' ? '● Đã Công Bố' : approvalStatus === 'pending_ceo' ? '● Chờ CEO Phê Duyệt' : '○ Bản Nháp'}
                </span>

                {/* Badge Lộ Trình Từng Tháng */}
                {(() => {
                  const activeMilestone = mockBSCRoadmapMilestones.find(m => m.applied_month === selectedPeriod) || mockBSCRoadmapMilestones[0]
                  if (!activeMilestone) return null
                  if (isCEO) {
                    return (
                      <button
                        type="button"
                        onClick={() => router.push('/settings/bsc?tab=roadmap')}
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1 hover:bg-amber-100 transition cursor-pointer"
                        title="Nhấp để xem hoặc cấu hình Lộ trình BSC từng tháng"
                      >
                        <Rocket size={11} className="text-amber-700" />
                        <span>{activeMilestone.phase_name.split(':')[0]}: {activeMilestone.title_badge}</span>
                      </button>
                    )
                  }
                  return (
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1"
                    >
                      <Rocket size={11} className="text-amber-700" />
                      <span>{activeMilestone.phase_name.split(':')[0]}: {activeMilestone.title_badge}</span>
                    </span>
                  )
                })()}

                <span className="text-xs text-gray-400 font-medium hidden md:inline">
                  • {teamSummary.store_name} (Tháng {selectedPeriod.slice(5)}/{selectedPeriod.slice(0, 4)})
                </span>
              </div>
            </div>

            {/* Cột phải: Bộ điều khiển chọn Chi Nhánh, Kỳ Thưởng & Cụm Action Phê Duyệt */}
            <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
              {/* Chọn Chi Nhánh */}
              {canSwitchStore && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 transition">
                  <Building2 size={14} className="text-[#2F6FA8]" />
                  <select
                    value={selectedStoreId}
                    onChange={e => handleStoreChange(e.target.value)}
                    className="bg-transparent font-bold text-xs text-gray-800 focus:outline-none cursor-pointer"
                  >
                    <option value="store-001">Homies Hồ Bá Phấn (HBP)</option>
                    <option value="store-002">Homies Chi Nhánh 429</option>
                  </select>
                </div>
              )}

              {/* Chọn Kỳ Tính Thưởng */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 transition">
                <Calendar size={14} className="text-amber-600" />
                <select
                  value={selectedPeriod}
                  onChange={e => handlePeriodChange(e.target.value)}
                  className="bg-transparent font-bold text-xs text-gray-800 focus:outline-none cursor-pointer"
                >
                  {availablePeriods.map(p => (
                    <option key={p} value={p}>Kỳ: {p}</option>
                  ))}
                </select>
              </div>

              {/* Nút Xuất Báo Cáo */}
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={isExporting}
                className="px-3 py-1.5 min-h-[36px] rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Xuất file CSV"
              >
                <FileSpreadsheet size={14} className="text-[#2F6FA8]" />
                <span>{isExporting ? '...' : 'Xuất Excel'}</span>
              </button>

              {/* Nút Nạp File Quyết Toán Tháng */}
              {isManager && (
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-3 py-1.5 min-h-[36px] rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  title="Nạp file mẫu Excel/CSV hoặc nhập nhanh doanh thu & chi phí tháng"
                >
                  <Upload size={14} />
                  <span>Nạp File Quyết Toán</span>
                </button>
              )}

              {/* ── CỤM NÚT PHÊ DUYỆT CỦA CEO & QUẢN LÝ TRỰC TIẾP TRÊN HEADER ── */}
              {approvalStatus === 'draft' && isManager && (
                <button
                  type="button"
                  disabled={isSubmittingApproval}
                  onClick={handleManagerSubmit}
                  className="px-3.5 py-1.5 min-h-[36px] rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  {isSubmittingApproval ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  <span>Quản Lý Duyệt &amp; Gửi CEO</span>
                </button>
              )}

              {approvalStatus === 'pending_ceo' && isManager && !isCEO && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Đã Gửi CEO Duyệt</span>
                </div>
              )}

              {approvalStatus === 'pending_ceo' && isCEO && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isSubmittingApproval}
                    onClick={handleCEOReject}
                    className="px-3 py-1.5 min-h-[36px] rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 disabled:opacity-60 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title="Yêu cầu quản lý rà soát lại dữ liệu"
                  >
                    <ShieldAlert size={14} />
                    <span>Rà Soát Lại</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingApproval}
                    onClick={handleCEOApprove}
                    className="px-3.5 py-1.5 min-h-[36px] rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer animate-pulse"
                  >
                    {isSubmittingApproval ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    <span>Chốt &amp; Công Bố</span>
                  </button>
                </div>
              )}

              {approvalStatus === 'published' && isCEO && (
                <button
                  type="button"
                  disabled={isSubmittingApproval}
                  onClick={handleCEOReopen}
                  className="px-3 py-1.5 min-h-[36px] rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-emerald-100 transition"
                  title="Nhấn để mở lại chế độ duyệt nếu cần điều chỉnh"
                >
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>Đã Công Bố (Mở lại)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Thông báo thao tác duyệt thành công */}
        {toastMessage && (
          <div className="w-full px-4 sm:px-6 lg:px-8 pt-4">
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2.5 shadow-2xs animate-fade-in">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {/* ── NỘI DUNG CHÍNH (FULL WIDTH CONTAINER) ── */}
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Cụm chuyển đổi Tab tinh gọn & Nút dẫn sang Trung Tâm Cài Đặt BSC */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-white rounded-2xl border border-gray-100 shadow-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Tab 1: Sổ Tay & Thể Lệ BSC (Hiện đầu tiên theo flow) */}
              <button
                type="button"
                onClick={() => handleTabChange('handbook')}
                className={`px-4 py-2.5 min-h-[40px] rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  currentTab === 'handbook'
                    ? 'bg-[#2F6FA8] text-white shadow-xs'
                    : 'text-gray-600 hover:text-[#001D3D] hover:bg-gray-50'
                }`}
              >
                <BookOpen size={15} />
                <span>1. Thể Lệ &amp; Cách Tính BSC</span>
              </button>

              {/* Tab 2: Form Quyết Toán Tháng */}
              {(isStoreManager || isCEO) && (
                <button
                  type="button"
                  onClick={() => handleTabChange('settlement')}
                  className={`px-4 py-2.5 min-h-[40px] rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    currentTab === 'settlement'
                      ? 'bg-[#2F6FA8] text-white shadow-xs'
                      : 'text-gray-600 hover:text-[#001D3D] hover:bg-gray-50'
                  }`}
                >
                  <Edit3 size={15} />
                  <span>2. Form Quyết Toán Tháng</span>
                </button>
              )}

              {/* Tab 3: Báo Cáo & Phê Duyệt Điểm (CEO / HR Admin hoặc Quản lý cửa hàng nếu được Bật quyền) */}
              {(isCEO || (isStoreManager && allowStoreManagerViewBonus)) && (
                <button
                  type="button"
                  onClick={() => handleTabChange('overview')}
                  className={`px-4 py-2.5 min-h-[40px] rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    currentTab === 'overview'
                      ? 'bg-[#2F6FA8] text-white shadow-xs'
                      : 'text-gray-600 hover:text-[#001D3D] hover:bg-gray-50'
                  }`}
                >
                  <LayoutDashboard size={15} />
                  <span>{isCEO ? '3. Báo Cáo & Phê Duyệt Điểm' : '3. Báo Cáo Thưởng & VietQR'}</span>
                </button>
              )}

              {/* Tab Nhật Ký Lỗi Vận Hành: Cho Shift Leader, Store Manager và CEO */}
              {(isShiftLeader || isStoreManager || isCEO) && (
                <button
                  type="button"
                  onClick={() => handleTabChange('audit_report')}
                  className={`px-4 py-2.5 min-h-[40px] rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                    currentTab === 'audit_report'
                      ? 'bg-[#2F6FA8] text-white shadow-xs'
                      : 'text-gray-600 hover:text-[#001D3D] hover:bg-gray-50'
                  }`}
                >
                  <ClipboardList size={15} />
                  <span>{(isCEO || (isStoreManager && allowStoreManagerViewBonus)) ? '4. Nhật Ký Lỗi Vận Hành' : '3. Nhật Ký Lỗi Vận Hành'}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    currentTab === 'audit_report'
                      ? 'bg-white/20 text-white'
                      : criticalErrorCount > 0
                        ? 'bg-rose-100 text-rose-800 animate-pulse border border-rose-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-200'
                  }`}>
                    {storeOpErrors.length} lỗi ca • {storePersErrors.length} lỗi NV
                  </span>
                </button>
              )}
            </div>

            {/* Cụm công cụ bên phải: Bật/Tắt quyền Quản lý xem thưởng & Nút dẫn sang Cài đặt BSC */}
            {isCEO && (
              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                {/* Nút gạt nhanh quyền Quản lý xem Bảng thưởng & VietQR */}
                <button
                  type="button"
                  onClick={async () => {
                    const nextVal = !allowStoreManagerViewBonus
                    setAllowStoreManagerViewBonus(nextVal)
                    await bscAdapter.saveSafetySettings({ allow_store_manager_view_bonus: nextVal })
                    setToastMessage(nextVal 
                      ? 'Đã BẬT quyền cho Quản lý cửa hàng xem Bảng thưởng & Mã VietQR!' 
                      : 'Đã TẮT quyền xem Bảng thưởng & Mã VietQR của Quản lý cửa hàng!'
                    )
                    setTimeout(() => setToastMessage(''), 3500)
                  }}
                  className={`px-3 py-2 min-h-[38px] rounded-xl border text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-2xs ${
                    allowStoreManagerViewBonus
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                  }`}
                  title="Bật/Tắt quyền cho phép Quản lý cửa hàng xem Báo cáo thưởng BSC và Mã VietQR"
                >
                  <ShieldCheck size={14} className={allowStoreManagerViewBonus ? 'text-emerald-600' : 'text-gray-400'} />
                  <span>QL xem thưởng &amp; QR:</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                    allowStoreManagerViewBonus ? 'bg-emerald-200 text-emerald-900' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {allowStoreManagerViewBonus ? 'BẬT' : 'TẮT'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/settings/bsc?tab=roles')}
                  className="px-3.5 py-2 min-h-[38px] rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  title="Mở Cài Đặt Phân Quyền & Hệ Số Chức Danh BSC"
                >
                  <Sliders size={14} className="text-[#2F6FA8]" />
                  <span>Cài Đặt Phân Quyền ↗</span>
                </button>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════
              TAB 1: BÁO CÁO & PHÊ DUYỆT ĐIỂM (FLOW CHUẨN CEO & SIÊU LEAN)
              ══════════════════════════════════════════════════════════════ */}
          {currentTab === 'overview' && (
            <div className="space-y-6">
              {/* ── BANNER CHỜ CEO PHÊ DUYỆT ── */}
              {approvalStatus === 'pending_ceo' && (
                <div className="p-4 sm:p-5 rounded-2xl border border-amber-300 bg-[#FFFDF7] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 border border-amber-200 mt-0.5 sm:mt-0">
                      <Sparkles size={20} className="text-amber-700" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#001D3D] flex items-center gap-2 flex-wrap">
                        <span>Hồ Sơ Quyết Toán BSC Tháng {selectedPeriod.slice(5)}/{selectedPeriod.slice(0, 4)} Đang Chờ CEO Phê Duyệt</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                          ● Chờ CEO Phê Duyệt
                        </span>
                      </h4>
                      <p className="text-xs text-gray-600 font-medium mt-1 leading-relaxed">
                        Quản lý cửa hàng ({revenueTargets.find(t => t.store_id === selectedStoreId && t.period === selectedPeriod)?.submitted_by || 'Huỳnh Lê Kiều Linh'}) đã rà soát và gửi duyệt bảng thưởng BSC. {isCEO ? 'CEO vui lòng đối chiếu và bấm "Chốt & Công Bố" trên thanh công cụ để hoàn tất ban hành.' : 'Đang chờ CEO Nguyễn Đức Nghĩa xem xét và phê duyệt.'}
                      </p>
                    </div>
                  </div>

                  {isCEO && (
                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
                      <button
                        type="button"
                        disabled={isSubmittingApproval}
                        onClick={handleCEOReject}
                        className="px-3.5 py-2 min-h-[38px] rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <ShieldAlert size={14} />
                        <span>Yêu Cầu Rà Soát Lại</span>
                      </button>
                      <button
                        type="button"
                        disabled={isSubmittingApproval}
                        onClick={handleCEOApprove}
                        className="px-4 py-2 min-h-[38px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        {isSubmittingApproval ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        <span>Chốt &amp; Công Bố Thưởng</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
              {/* ── BANNER NHẬP LIỆU & CÀI ĐẶT TINH TẾ KHI CHƯA CÓ DỮ LIỆU QUYẾT TOÁN ── */}
              {teamSummary.store_result.revenue_target.actual_revenue_monthly === 0 && (
                <div className="p-4 sm:p-5 rounded-2xl border border-amber-200 bg-[#FFFDF7] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 border border-amber-200 mt-0.5 sm:mt-0">
                      <Sparkles size={20} className="text-amber-700" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#001D3D] flex items-center gap-2 flex-wrap">
                        <span>Kỳ Tháng {selectedPeriod.slice(5)}/{selectedPeriod.slice(0, 4)} của {teamSummary.store_name} Chưa Có Dữ Liệu Quyết Toán</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          ○ Đang Chờ Thiết Lập
                        </span>
                      </h4>
                      <p className="text-xs text-gray-600 font-medium mt-1 leading-relaxed">
                        Chưa ghi nhận doanh thu thực tế, định mức NVL và điểm đánh giá tháng này. Bạn có thể bắt đầu điền form hoặc kiểm tra lại cấu hình mục tiêu.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleTabChange('settlement')}
                      className="px-4 py-2 min-h-[38px] rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Edit3 size={14} />
                      <span>+ Nhập Số Liệu Quyết Toán</span>
                    </button>
                    {isCEO && (
                      <button
                        type="button"
                        onClick={() => router.push('/settings/bsc?tab=targets')}
                        className="px-3.5 py-2 min-h-[38px] rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                      >
                        <Sliders size={14} className="text-[#2F6FA8]" />
                        <span>Cài Đặt Target &amp; Mốc Hòa Vốn ↗</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── BƯỚC 1: 4 THẺ CHỈ SỐ VĨ MÔ TRẢI RỘNG TRÊN CÙNG ── */}
              <BSCExecutiveCards summary={teamSummary} />

              {/* ── BƯỚC 1.5: THẺ CẢNH BÁO & ĐỐI CHIẾU LỖI VẬN HÀNH THÁNG NÀY CHO CEO ── */}
              <div className="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/50 flex items-center justify-between gap-4 flex-wrap shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 border border-amber-200">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-amber-950">
                        Đối Chiếu Nhật Ký Sự Cố &amp; Vi Phạm Ca Tháng Này ({storeOpErrors.length} lỗi ca • {storePersErrors.length} lỗi cá nhân)
                      </h4>
                      {criticalErrorCount > 0 ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                          ⚠️ {criticalErrorCount} Lỗi Nghiêm Trọng Cần CEO Duyệt
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ✓ Không có sự cố ATTP nghiêm trọng
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-amber-900/80 mt-0.5">
                      {storeOpErrors.length > 0
                        ? `Tổng ${opErrorPoints} điểm lỗi vận hành đã trừ vào tiêu chí Vận Hành (${teamSummary.store_result.criteria_scores.find(c => c.key === 'operation')?.converted_score || 0}/5đ). ${storePersErrors.length} lỗi cá nhân đã giảm trừ vào hệ số thưởng nhân viên.`
                        : 'Chưa ghi nhận lỗi vận hành hoặc vi phạm cá nhân nào trong kỳ này.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-auto flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleTabChange('audit_report')}
                    className="px-4 py-2 min-h-[38px] rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <ClipboardList size={14} />
                    <span>Xem Nhật Ký Lỗi ➔</span>
                  </button>
                  {isCEO && (
                    <button
                      type="button"
                      onClick={() => router.push('/settings/bsc?tab=penalties')}
                      className="px-3 py-2 min-h-[38px] rounded-xl border border-amber-200 bg-white hover:bg-amber-50 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                      title="Cài đặt khung lỗi và điểm phạt"
                    >
                      <Sliders size={13} className="text-[#2F6FA8]" />
                      <span>Cài Đặt Khung Lỗi ↗</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ── BƯỚC 2: ĐỐI CHIẾU CHI TIẾT THEO TỶ LỆ VÀNG 2/3 + 1/3 ── */}
              <div className="lg:grid lg:grid-cols-3 lg:gap-6">
                {/* CỘT CHÍNH (2/3): Bảng Chấm Điểm 4 Tiêu Chí & Bảng Phân Chia Thưởng */}
                <div className="lg:col-span-2 space-y-6">
                  {/* 1. Bảng Chấm Điểm 4 Tiêu Chí BSC (Table Trực Quan) */}
                  <BSCScorecardGap
                    storeResult={teamSummary.store_result}
                    storeName={teamSummary.store_name}
                  />

                  {/* 2. Bảng Ma Trận Phân Chia Quỹ Thưởng Từng Nhân Sự */}
                  <BSCTeamTable
                    summary={teamSummary}
                    selectedEmployeeId={inspectedEmpId}
                    onSelectEmployee={empId => setSelectedEmployeeId(empId)}
                    onOpenDetailModal={empId => {
                      setSelectedEmployeeId(empId)
                      setIsDetailModalOpen(true)
                    }}
                  />
                </div>

                {/* CỘT PHỤ (1/3): Biểu Đồ Radar 4 Khía Cạnh & Lịch Sử Thưởng 3 Tháng */}
                <div className="mt-6 lg:mt-0 space-y-6">
                  {/* Sơ Đồ Radar 4 Khía Cạnh BSC */}
                  <div className="p-5 space-y-3 rounded-2xl border border-gray-100 bg-white shadow-xs">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <h4 className="text-sm font-bold text-[#001D3D] flex items-center gap-2">
                        <BarChart3 size={16} className="text-[#2F6FA8]" />
                        <span>Sơ Đồ Radar 4 Khía Cạnh</span>
                      </h4>
                      <span className="text-xs font-bold text-gray-500 font-mono tabular-nums">Mốc chuẩn 5.0đ</span>
                    </div>
                    {teamSummary.store_result.revenue_target.is_unlocked ? (
                      <BSCRadarChart scores={teamSummary.store_result.criteria_scores} />
                    ) : (
                      <div className="py-8 px-4 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2F6FA8] flex items-center justify-center mx-auto border border-blue-100">
                          <BarChart3 size={22} />
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-[#001D3D]">Chưa Có Dữ Liệu Chấm Điểm Radar</div>
                          <p className="text-[11px] text-gray-500 font-medium max-w-xs mx-auto leading-relaxed">
                            Sơ đồ 4 khía cạnh (Doanh thu, Hao hụt, Vận hành, CSKH) sẽ tự động hiển thị ngay sau khi hoàn tất quyết toán tháng.
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleTabChange('settlement')}
                            className="px-3 py-1.5 rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                          >
                            + Nhập Quyết Toán
                          </button>
                          {isCEO && (
                            <button
                              type="button"
                              onClick={() => router.push('/settings/bsc?tab=criteria')}
                              className="px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold transition cursor-pointer"
                            >
                              Cài Đặt Tiêu Chí ↗
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lịch Sử Thưởng 3 Tháng Gần Nhất */}
                  <BSCHistoryChart history={historyData} />
                </div>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 2: NHẬT KÝ ĐỐI CHIẾU DỮ LIỆU KỲ XÉT (READ-ONLY)
              ══════════════════════════════════════════════════════════════ */}
          {currentTab === 'audit_report' && (
            <BSCLogsTab
              storeId={storeId}
              period={selectedPeriod}
            />
          )}

          {/* TAB FORM NHẬP (QUẢN LÝ CƠ SỞ): QUYẾT TOÁN DỮ LIỆU THÁNG */}
          {currentTab === 'settlement' && isManager && (
            <div className="space-y-3">
              <BSCMonthlyInputForm
                storeId={storeId}
                period={selectedPeriod}
                isManager={isManager}
                isCEO={isCEO}
                onSuccess={() => setRefreshKey(prev => prev + 1)}
              />

              {/* BẢNG PHÂN BỔ THƯỞNG NHÂN VIÊN DỰA THEO CẤP BẬC VÀ GIỜ CÔNG */}
              {isManager && (
                <div className="pt-2">
                  <div className="card p-4 sm:p-5 rounded-2xl border border-gray-200/80 bg-white shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          approvalStatus === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-[#2F6FA8]'
                        }`}>
                          {approvalStatus === 'published' ? <CheckCircle2 size={18} /> : <Users size={18} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm sm:text-base font-bold text-[#001D3D]">
                              Bảng Phân Bổ Tiền Thưởng Nhân Viên — {teamSummary.store_name}
                            </h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              approvalStatus === 'published'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-blue-50 text-[#2F6FA8] border-blue-300'
                            }`}>
                              {approvalStatus === 'published' ? '● Đã Ban Hành Chính Thức' : '⚡ Tạm Tính Realtime (Theo Giờ & Cấp Bậc)'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">
                            {approvalStatus === 'published'
                              ? 'Đã được CEO Nguyễn Đức Nghĩa phê duyệt & ban hành vào bảng lương.'
                              : `Phân bổ quỹ thưởng ${formatVnd(teamSummary.store_result.store_bonus_pool)} theo: Giờ công thực tế (≥${teamSummary.store_result.revenue_target.min_hours_threshold || 110}h) × Hệ số cấp bậc (QL: 1.5, TC: 1.2, FT: 1.0, PT: 0.8) × Hệ số lỗi cá nhân.`}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleExportCSV}
                        disabled={isExporting}
                        className="px-3.5 py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs self-start sm:self-auto"
                      >
                        <FileSpreadsheet size={14} className="text-[#2F6FA8]" />
                        <span>{isExporting ? 'Đang xuất...' : 'Xuất Báo Cáo Quán (Excel)'}</span>
                      </button>
                    </div>

                    {/* Bảng chi tiết nhân viên */}
                    <BSCTeamTable
                      summary={teamSummary}
                      selectedEmployeeId={selectedEmployeeId}
                      onSelectEmployee={empId => setSelectedEmployeeId(empId)}
                      onOpenDetailModal={empId => {
                        setSelectedEmployeeId(empId)
                        setIsDetailModalOpen(true)
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB SỔ TAY & THỂ LỆ BSC (100% DỮ LIỆU THẬT) */}
          {currentTab === 'handbook' && (
            <BSCHandbookTab
              storeId={storeId}
              period={selectedPeriod}
              onGoToSettlement={() => handleTabChange('settlement')}
            />
          )}

          {/* Modal Nạp File Quyết Toán Tháng */}
          <BSCMonthlyImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            storeId={storeId}
            storeName={teamSummary.store_name}
            period={selectedPeriod}
            onSuccess={() => setRefreshKey(prev => prev + 1)}
          />

          {/* Modal Chi Tiết Thưởng BSC & Mã VietQR Thanh Toán */}
          <BSCIndividualDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            resultsList={teamSummary.individual_results}
            currentEmployeeId={inspectedEmpId}
            onSelectEmployee={empId => setSelectedEmployeeId(empId)}
            empDataList={empDataList}
            personalErrors={myErrors}
          />
        </div>
      </div>
    </AppShell>
  )
}

export default function BSCBonusPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-gray-500">Đang tải mô-đun Thưởng BSC...</div>}>
      <BSCBonusContent />
    </Suspense>
  )
}
