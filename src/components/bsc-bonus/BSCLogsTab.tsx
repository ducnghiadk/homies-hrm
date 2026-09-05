'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  User,
  Building2,
  AlertTriangle,
  Clock,
  Check,
  XCircle,
  ClipboardList,
  Eye,
  ShieldCheck,
  Filter,
  FileText,
  AlertCircle,
  X,
  Users,
  Store,
  Layers,
  ChevronDown,
  ChevronRight,
  Sliders,
} from 'lucide-react'
import { bscAdapter } from '@/lib/adapters/bsc-adapter'
import type { BSCApprovalStatus, BSCOperationErrorRecord, BSCEmployeePersonalData, BSCPersonalErrorRecord } from '@/lib/bsc-types'

interface BSCLogsTabProps {
  storeId: string
  period: string
  isManager?: boolean
}

type SubTab = 'by_employee' | 'by_operation' | 'all_timeline'

type CombinedLogItem =
  | (BSCOperationErrorRecord & { log_kind: 'operation'; employee_name?: string; proof_url?: string; date_logged?: string })
  | (BSCPersonalErrorRecord & { log_kind: 'personal'; employee_name: string; store_id: string; period?: string; proof_url?: string; date_logged?: string })

export default function BSCLogsTab({ storeId, period }: BSCLogsTabProps) {
  const router = useRouter()
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('by_employee')
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>(storeId || 'all')
  const [employeeFilterMode, setEmployeeFilterMode] = useState<'all' | 'has_errors' | 'clean'>('all')
  const [filterCategory, setFilterCategory] = useState<'all' | 'personal' | 'operation'>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewingProofItem, setViewingProofItem] = useState<CombinedLogItem | null>(null)
  const [expandedEmployees, setExpandedEmployees] = useState<Record<string, boolean>>({})

  // Adapter States
  const [opLogsData, setOpLogsData] = useState<BSCOperationErrorRecord[]>([])
  const [empLogsData, setEmpLogsData] = useState<BSCEmployeePersonalData[]>([])

  useEffect(() => {
    let isMounted = true
    async function loadLogs() {
      try {
        const [opErrs, empData] = await Promise.all([
          bscAdapter.getOperationErrors(selectedStoreFilter, period),
          bscAdapter.getEmployeePersonalData(selectedStoreFilter, period),
        ])
        if (isMounted) {
          setOpLogsData(opErrs)
          setEmpLogsData(empData)
        }
      } catch (err) {
        console.warn('[BSCLogsTab] Error loading logs from adapter:', err)
      }
    }
    loadLogs()
    return () => { isMounted = false }
  }, [selectedStoreFilter, period])

  // Stores catalog
  const storesCatalog = [
    { id: 'all', name: 'Tất cả chi nhánh' },
    { id: 'store-001', name: 'Hồ Bá Phấn (HBP)' },
    { id: 'store-002', name: 'Chi nhánh 429' },
  ]

  // Flatten personal errors
  const personalLogs: CombinedLogItem[] = empLogsData
    .filter(emp => (period === 'all' || emp.period === period) && (selectedStoreFilter === 'all' || emp.store_id === selectedStoreFilter))
    .flatMap(emp =>
      emp.errors.map(err => ({
        ...err,
        employee_name: emp.employee_name,
        store_id: emp.store_id,
        period: emp.period,
        log_kind: 'personal' as const,
      }))
    )

  // Filter store operation errors
  const opLogs: CombinedLogItem[] = opLogsData
    .filter(err => (selectedStoreFilter === 'all' || err.store_id === selectedStoreFilter) && (period === 'all' || err.period === period))
    .map(err => ({
      ...err,
      log_kind: 'operation' as const,
    }))

  const combinedLogs: CombinedLogItem[] = [...personalLogs, ...opLogs].filter(item => {
    if (filterCategory === 'personal' && item.log_kind !== 'personal') return false
    if (filterCategory === 'operation' && item.log_kind !== 'operation') return false
    if (filterStatus !== 'all' && item.approval_status !== filterStatus) return false

    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    const name = item.employee_name || ''
    const eventId = item.event_id || ''
    const orderCode = item.order_code || ''
    const groupName = item.group_name || ''
    const ex = item.example || ''
    return (
      name.toLowerCase().includes(term) ||
      eventId.toLowerCase().includes(term) ||
      orderCode.toLowerCase().includes(term) ||
      groupName.toLowerCase().includes(term) ||
      ex.toLowerCase().includes(term)
    )
  })

  // Filtered employees for Sub-Tab 1
  const filteredEmployees = empLogsData
    .filter(emp => selectedStoreFilter === 'all' || emp.store_id === selectedStoreFilter)
    .filter(emp => {
      const errorCount = emp.errors.length
      if (employeeFilterMode === 'has_errors') return errorCount > 0
      if (employeeFilterMode === 'clean') return errorCount === 0
      return true
    })
    .filter(emp => {
      if (!searchTerm.trim()) return true
      return emp.employee_name.toLowerCase().includes(searchTerm.toLowerCase())
    })

  const toggleExpand = (empId: string) => {
    setExpandedEmployees(prev => ({ ...prev, [empId]: !prev[empId] }))
  }

  // Calculate top macro stats
  const totalPersonalErrorsCount = personalLogs.length
  const totalOpErrorsCount = opLogs.length
  const totalAllErrors = totalPersonalErrorsCount + totalOpErrorsCount
  const penalizedEmployeesCount = empLogsData.filter(e => e.errors.length > 0 && (selectedStoreFilter === 'all' || e.store_id === selectedStoreFilter)).length
  const totalTeamCount = empLogsData.filter(e => selectedStoreFilter === 'all' || e.store_id === selectedStoreFilter).length
  const totalOpDeductionPoints = opLogs.reduce((sum, item) => sum + (item.points || 0), 0)
  const pendingCEOCount = combinedLogs.filter(i => i.approval_status === 'proposed_manager' || i.approval_status === 'pending_proof' || i.approval_status === 'pending_appeal').length

  const getStatusBadge = (status?: BSCApprovalStatus | string) => {
    switch (status) {
      case 'approved_ceo':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <Check size={11} className="stroke-[3]" /> Đã Duyệt Phạt
          </span>
        )
      case 'proposed_manager':
      case 'pending_proof':
      case 'pending_appeal':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <Clock size={11} /> Chờ CEO Duyệt
          </span>
        )
      case 'rejected_ceo':
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
            <XCircle size={11} /> Đã Miễn Phạt
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
            Ghi nhận
          </span>
        )
    }
  }

  const getPersonalMultiplierBadge = (points: number) => {
    if (points <= 1) {
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
          x1.00 (Giữ trọn 100%)
        </span>
      )
    }
    if (points <= 3) {
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 font-mono">
          x0.80 (Giảm 20% thưởng)
        </span>
      )
    }
    if (points <= 5) {
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 font-mono">
          x0.50 (Giảm 50% thưởng)
        </span>
      )
    }
    return (
      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-900 border border-red-300 font-mono">
        x0.00 (Mất thưởng kỳ)
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── 4 THẺ TÓM TẮT SỰ CỐ VĨ MÔ ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 sm:p-5 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>Tổng Sự Cố Ghi Nhận</span>
            <ClipboardList size={16} className="text-[#2F6FA8]" />
          </div>
          <div className="text-2xl font-bold text-[#001D3D] font-mono tabular-nums">
            {totalAllErrors} <span className="text-xs font-medium text-gray-400">sự cố</span>
          </div>
          <div className="text-[11px] text-gray-500 font-medium pt-1 border-t border-gray-100 flex justify-between">
            <span>Cá nhân: <strong className="text-gray-800 font-mono">{totalPersonalErrorsCount}</strong></span>
            <span>Vận hành: <strong className="text-gray-800 font-mono">{totalOpErrorsCount}</strong></span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>Nhân Sự Vi Phạm Kỷ Luật</span>
            <User size={16} className="text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-900 font-mono tabular-nums">
            {penalizedEmployeesCount} <span className="text-xs font-medium text-gray-400">/ {totalTeamCount} nhân sự</span>
          </div>
          <div className="text-[11px] text-gray-500 font-medium pt-1 border-t border-gray-100">
            {penalizedEmployeesCount === 0 ? (
              <span className="text-emerald-600 font-semibold">100% nhân sự đạt chuẩn x1.0</span>
            ) : (
              <span className="text-amber-700 font-semibold">{totalTeamCount - penalizedEmployeesCount} nhân sự đạt chuẩn 0 lỗi</span>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>Điểm Lỗi Vận Hành Quán</span>
            <Store size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-800 font-mono tabular-nums">
            -{totalOpDeductionPoints} <span className="text-xs font-medium text-gray-400">điểm trừ</span>
          </div>
          <div className="text-[11px] text-gray-500 font-medium pt-1 border-t border-gray-100">
            Trừ vào Tiêu chí 3 (Quy đổi đạt 4 / 5 điểm)
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>Sự Cố Chờ CEO Phê Duyệt</span>
            <AlertTriangle size={16} className="text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-700 font-mono tabular-nums">
            {pendingCEOCount} <span className="text-xs font-medium text-gray-400">cần xử lý</span>
          </div>
          <div className="text-[11px] text-gray-500 font-medium pt-1 border-t border-gray-100">
            {pendingCEOCount === 0 ? 'Đã duyệt toàn bộ sự cố' : 'Có sự cố cần xác nhận phạt'}
          </div>
        </div>
      </div>

      {/* ── BỘ ĐIỀU HƯỚNG 3 SUB-TABS TRỰC QUAN ── */}
      <div className="p-4 sm:p-5 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3.5">
          {/* 3 Sub-tabs Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveSubTab('by_employee')}
              className={`px-3.5 py-2 min-h-[38px] rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer flex-shrink-0 ${
                activeSubTab === 'by_employee'
                  ? 'bg-white text-[#2F6FA8] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users size={15} />
              <span>1. Lỗi Theo Từng Nhân Viên ({totalPersonalErrorsCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('by_operation')}
              className={`px-3.5 py-2 min-h-[38px] rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer flex-shrink-0 ${
                activeSubTab === 'by_operation'
                  ? 'bg-white text-[#2F6FA8] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Store size={15} />
              <span>2. Lỗi Vận Hành Cửa Hàng ({totalOpErrorsCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('all_timeline')}
              className={`px-3.5 py-2 min-h-[38px] rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer flex-shrink-0 ${
                activeSubTab === 'all_timeline'
                  ? 'bg-white text-[#2F6FA8] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Layers size={15} />
              <span>3. Dòng Thời Gian Audit ({totalAllErrors})</span>
            </button>
          </div>

          {/* Lọc cơ sở & Nút Cài Đặt */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => router.push('/settings/bsc?tab=penalties')}
              className="px-3 py-1.5 min-h-[36px] rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Cài đặt danh mục lỗi và điểm phạt"
            >
              <Sliders size={13} className="text-[#2F6FA8]" />
              <span>Cài Đặt Khung Lỗi ↗</span>
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] bg-gray-50 rounded-xl border border-gray-200 text-xs font-bold text-gray-800">
              <Building2 size={14} className="text-[#2F6FA8]" />
              <select
                value={selectedStoreFilter}
                onChange={e => setSelectedStoreFilter(e.target.value)}
                className="bg-transparent font-bold text-xs text-gray-800 focus:outline-none cursor-pointer"
              >
                {storesCatalog.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            SUB-TAB 1: LỖI THEO TỪNG NHÂN VIÊN (EMPLOYEE ERROR ROSTER)
            ══════════════════════════════════════════════════════════════ */}
        {activeSubTab === 'by_employee' && (
          <div className="space-y-4">
            {/* Bộ lọc nhân viên */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEmployeeFilterMode('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    employeeFilterMode === 'all'
                      ? 'bg-[#2F6FA8] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Tất cả nhân sự ({empLogsData.length})
                </button>
                <button
                  type="button"
                  onClick={() => setEmployeeFilterMode('has_errors')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    employeeFilterMode === 'has_errors'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  Có vi phạm ({penalizedEmployeesCount})
                </button>
                <button
                  type="button"
                  onClick={() => setEmployeeFilterMode('clean')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    employeeFilterMode === 'clean'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  Gương mẫu 0 lỗi ({totalTeamCount - penalizedEmployeesCount})
                </button>
              </div>

              {/* Tìm kiếm tên */}
              <div className="relative min-w-[220px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Tìm tên nhân viên..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:border-[#2F6FA8]"
                />
              </div>
            </div>

            {/* Danh sách thẻ nhân viên */}
            <div className="space-y-3">
              {filteredEmployees.map(emp => {
                const totalPoints = emp.errors.reduce((sum, e) => sum + e.points, 0)
                const hasErrors = emp.errors.length > 0
                const isExpanded = expandedEmployees[emp.employee_id] ?? hasErrors

                return (
                  <div
                    key={emp.employee_id}
                    className={`rounded-2xl border transition-all ${
                      hasErrors
                        ? 'border-amber-200 bg-amber-50/20'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    {/* Header nhân viên */}
                    <div
                      onClick={() => toggleExpand(emp.employee_id)}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-gray-50/60 rounded-2xl transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                          hasErrors ? 'bg-amber-100 text-amber-900' : 'bg-primary-50 text-[#2F6FA8]'
                        }`}>
                          <User size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-gray-900">{emp.employee_name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              {emp.role}
                            </span>
                            <span className="text-xs text-gray-400 font-mono">({emp.work_hours}h làm việc)</span>
                          </div>
                          <div className="text-xs text-gray-500 font-medium mt-0.5">
                            {hasErrors ? (
                              <span className="text-rose-600 font-bold font-mono">
                                ⚠️ Ghi nhận {emp.errors.length} lỗi vi phạm (Phạt tổng -{totalPoints} điểm)
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                <ShieldCheck size={13} /> Gương mẫu — Giữ trọn vẹn điểm kỷ luật!
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0 self-start sm:self-auto">
                        {getPersonalMultiplierBadge(totalPoints)}
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </div>
                      </div>
                    </div>

                    {/* Danh sách lỗi khi mở rộng */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-2">
                        {hasErrors ? (
                          <div className="space-y-2 pt-2">
                            {emp.errors.map(err => (
                              <div
                                key={err.id}
                                className="p-3.5 rounded-xl border border-amber-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-[#001D3D]">{err.group_name}</span>
                                    {err.sub_error_name && (
                                      <span className="text-gray-500 font-medium">• {err.sub_error_name}</span>
                                    )}
                                    <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                      -{err.points} điểm
                                    </span>
                                  </div>
                                  <p className="text-gray-700 font-medium">{err.example}</p>
                                  <div className="text-[11px] text-amber-800 font-semibold flex items-center gap-1.5">
                                    <AlertCircle size={13} className="text-amber-600" />
                                    <span>{err.impact}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-auto">
                                  {getStatusBadge(err.approval_status)}
                                  <button
                                    type="button"
                                    onClick={() => setViewingProofItem({
                                      ...err,
                                      employee_name: emp.employee_name,
                                      store_id: emp.store_id,
                                      period: emp.period,
                                      log_kind: 'personal',
                                    })}
                                    className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                                  >
                                    <Eye size={13} className="text-[#2F6FA8]" />
                                    <span>Bằng chứng</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-emerald-50/80 text-emerald-800 text-xs font-medium flex items-center gap-2 mt-2">
                            <ShieldCheck size={16} className="text-emerald-600" />
                            <span>Không có vi phạm nào được ghi nhận trong kỳ. Nhân sự được hưởng 100% hệ số chia thưởng!</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SUB-TAB 2: LỖI VẬN HÀNH CỬA HÀNG & THEO CA (STORE OPERATIONS)
            ══════════════════════════════════════════════════════════════ */}
        {activeSubTab === 'by_operation' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 font-medium flex items-center gap-2">
              <Store size={16} className="text-[#2F6FA8] flex-shrink-0" />
              <span>
                Các lỗi vận hành dưới đây sẽ bị trừ trực tiếp vào <strong>Tiêu Chí 3: Vận Hành &amp; Quầy Kệ (Trọng số 25%)</strong> của toàn bộ cửa hàng.
              </span>
            </div>

            {opLogs.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100">
                      <th className="py-3 px-4">Sự Cố &amp; Nhóm Lỗi Vận Hành</th>
                      <th className="py-3 px-3 text-center">Ca Trực</th>
                      <th className="py-3 px-3 text-center">Điểm Phạt</th>
                      <th className="py-3 px-4">Mô Tả Chi Tiết</th>
                      <th className="py-3 px-3 text-center">Trạng Thái</th>
                      <th className="py-3 px-3 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {opLogs.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50/60 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#001D3D]">{item.group_name}</div>
                          {item.sub_error_name && (
                            <div className="text-[11px] text-gray-500 font-medium">{item.sub_error_name}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-center font-medium text-gray-600">
                          {item.shift_name || 'Ca sáng'}
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono tabular-nums">
                          <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            -{item.points} điểm
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-700">
                          <div>{item.example}</div>
                          {'impact' in item && item.impact && <div className="text-[11px] text-amber-800 font-semibold">{item.impact}</div>}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {getStatusBadge(item.approval_status)}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setViewingProofItem(item)}
                            className="px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <Eye size={13} className="text-[#2F6FA8]" />
                            <span>Xem</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 rounded-2xl border border-dashed border-gray-200 bg-[#FFFDF7] text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                  <ShieldCheck size={24} />
                </div>
                <div className="space-y-1">
                  <div className="text-xs sm:text-sm font-bold text-[#001D3D]">
                    0 Sự Cố Vận Hành Ghi Nhận Trong Kỳ Này
                  </div>
                  <p className="text-xs text-gray-500 font-medium max-w-md mx-auto leading-relaxed">
                    Cửa hàng đang vận hành xuất sắc, giữ trọn vẹn điểm chuẩn cho Tiêu chí 3 (Vận hành &amp; SOP).
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => router.push('/kpi/violations/log')}
                    className="px-4 py-2 rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                  >
                    + Ghi Nhận Sự Cố Ca Mới
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/settings/bsc?tab=penalties')}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition cursor-pointer"
                  >
                    <Sliders size={13} className="inline mr-1 text-[#2F6FA8]" />
                    <span>Cài Đặt Khung Lỗi ↗</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SUB-TAB 3: TOÀN BỘ DÒNG THỜI GIAN AUDIT (AUDIT TIMELINE)
            ══════════════════════════════════════════════════════════════ */}
        {activeSubTab === 'all_timeline' && (
          <div className="space-y-4">
            {/* Bộ lọc thanh công cụ */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative min-w-[200px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Tìm theo sự cố, mã đơn..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:border-[#2F6FA8]"
                  />
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-200 text-xs font-bold text-gray-800">
                  <Filter size={13} className="text-gray-500" />
                  <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value as 'all' | 'personal' | 'operation')}
                    className="bg-transparent font-bold text-xs text-gray-800 focus:outline-none cursor-pointer"
                  >
                    <option value="all">Tất cả phân loại</option>
                    <option value="personal">Lỗi cá nhân</option>
                    <option value="operation">Lỗi vận hành quán</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-200 text-xs font-bold text-gray-800">
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="bg-transparent font-bold text-xs text-gray-800 focus:outline-none cursor-pointer"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="approved_ceo">Đã duyệt phạt</option>
                    <option value="pending_ceo">Chờ CEO duyệt</option>
                    <option value="waived">Đã miễn phạt</option>
                  </select>
                </div>
              </div>

              <div className="text-xs text-gray-500 font-semibold font-mono tabular-nums">
                Hiển thị: {combinedLogs.length} sự cố
              </div>
            </div>

            {/* Bảng Dòng thời gian */}
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100">
                    <th className="py-3 px-4">Phân Loại</th>
                    <th className="py-3 px-4">Sự Kiện &amp; Nhân Sự Liên Quan</th>
                    <th className="py-3 px-3 text-center">Điểm Phạt</th>
                    <th className="py-3 px-4">Tác Động Lên Quỹ / Hệ Số</th>
                    <th className="py-3 px-3 text-center">Trạng Thái</th>
                    <th className="py-3 px-3 text-center">Bằng Chứng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {combinedLogs.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-gray-50/60 transition">
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.log_kind === 'personal'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-blue-100 text-blue-900'
                        }`}>
                          {item.log_kind === 'personal' ? '👤 Cá nhân' : '🏪 Vận hành'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#001D3D]">
                          {item.group_name}: {item.sub_error_name || item.example}
                        </div>
                        <div className="text-[11px] text-gray-500 font-medium mt-0.5">
                          {item.employee_name && <span>Nhân viên: <strong>{item.employee_name}</strong> • </span>}
                          {item.occurred_at && <span>Thời gian: {item.occurred_at}</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono tabular-nums">
                        <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          -{item.points} điểm
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-700">
                        {('impact' in item && item.impact) ? item.impact : 'Trừ điểm đánh giá'}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {getStatusBadge(item.approval_status)}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setViewingProofItem(item)}
                          className="px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
                        >
                          <Eye size={13} className="text-[#2F6FA8]" />
                          <span>Xem</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL XEM BẰNG CHỨNG / BIÊN BẢN (PROOF VIEWER) ── */}
      {viewingProofItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#001D3D]">
                <FileText size={18} className="text-[#2F6FA8]" />
                <span>Bằng Chứng Vi Phạm &amp; Đối Soát</span>
              </div>
              <button
                type="button"
                onClick={() => setViewingProofItem(null)}
                className="w-8 h-8 rounded-xl hover:bg-gray-100 text-gray-500 flex items-center justify-center transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 space-y-1.5">
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Sự cố: {viewingProofItem.group_name}</span>
                  <span className="font-mono text-rose-600">-{viewingProofItem.points} điểm</span>
                </div>
                <p className="text-gray-700 font-medium">{viewingProofItem.example}</p>
                {viewingProofItem.employee_name && (
                  <div className="text-gray-500 font-medium">
                    Nhân sự: <strong>{viewingProofItem.employee_name}</strong>
                  </div>
                )}
                {viewingProofItem.occurred_at && (
                  <div className="text-gray-400 text-[11px]">
                    Thời gian ghi nhận: {viewingProofItem.occurred_at}
                  </div>
                )}
              </div>

              {/* Khung mô phỏng ảnh bằng chứng */}
              <div className="p-6 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-white text-[#2F6FA8] flex items-center justify-center mx-auto shadow-2xs">
                  <Eye size={24} />
                </div>
                <div className="font-bold text-gray-800 text-xs">Hình ảnh biên bản / Log camera</div>
                <p className="text-[11px] text-gray-500">
                  Dữ liệu đối soát đã được lưu trữ an toàn trong kho lưu trữ HRM Homies.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingProofItem(null)}
                className="px-4 py-2 rounded-xl bg-[#001D3D] text-white text-xs font-bold hover:bg-[#0a2e5c] transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
