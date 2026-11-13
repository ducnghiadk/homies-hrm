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
  Plus,
  Share2,
  Pencil,
  Calendar,
  Camera,
  CheckCircle2,
  ExternalLink,
  ImageIcon,
  Maximize2,
  Sparkles,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { bscAdapter } from '@/lib/adapters/bsc-adapter'
import StoreOperationIncidentModal from '@/components/kpi/incidents/StoreOperationIncidentModal'
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
  const [isLogEditorOpen, setIsLogEditorOpen] = useState(false)
  const [editingLogItem, setEditingLogItem] = useState<CombinedLogItem | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isAttachingProof, setIsAttachingProof] = useState(false)
  const [inputProofUrl, setInputProofUrl] = useState('')
  const [isSavingProof, setIsSavingProof] = useState(false)

  const handleQuickApprove = async (item: CombinedLogItem) => {
    setApprovingId(item.id)
    try {
      const ok = await bscAdapter.approveLog(item.id)
      if (ok) {
        toast.success(`CEO đã duyệt biên bản: ${item.sub_error_name || item.example || item.group_name}`)
        await loadLogs()
      } else {
        toast.error('Không thể duyệt biên bản, vui lòng thử lại!')
      }
    } catch {
      toast.error('Lỗi kết nối khi duyệt biên bản')
    } finally {
      setApprovingId(null)
    }
  }

  // Adapter States
  const [opLogsData, setOpLogsData] = useState<BSCOperationErrorRecord[]>([])
  const [empLogsData, setEmpLogsData] = useState<BSCEmployeePersonalData[]>([])

  const loadLogs = React.useCallback(async () => {
    try {
      const [opErrs, empData] = await Promise.all([
        bscAdapter.getOperationErrors(selectedStoreFilter, period),
        bscAdapter.getEmployeePersonalData(selectedStoreFilter, period),
      ])
      setOpLogsData(opErrs)
      setEmpLogsData(empData)
    } catch (err) {
      console.warn('[BSCLogsTab] Error loading logs from adapter:', err)
    }
  }, [selectedStoreFilter, period])

  useEffect(() => {
    void loadLogs()
  }, [loadLogs])

  // ── Hỗ trợ Chụp màn hình rồi Paste (Ctrl + V) trực tiếp ảnh vào Biên bản ──
  useEffect(() => {
    if (!viewingProofItem) return

    const handleWindowPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (!file) continue

          const reader = new FileReader()
          reader.onload = async (event) => {
            const dataUrl = event.target?.result as string
            if (dataUrl) {
              toast.info('Đang lưu ảnh chụp màn hình vừa dán...')
              try {
                const ok = await bscAdapter.updateProof(
                  viewingProofItem.id,
                  dataUrl,
                  viewingProofItem.evidence_note
                )
                if (ok) {
                  toast.success('Đã dán và lưu ảnh chụp màn hình thành công!')
                  setViewingProofItem(prev => (prev ? { ...prev, evidence_url: dataUrl } : null))
                  void loadLogs()
                } else {
                  toast.error('Không thể lưu ảnh vừa dán, vui lòng thử lại!')
                }
              } catch {
                toast.error('Lỗi khi lưu ảnh chụp màn hình')
              }
            }
          }
          reader.readAsDataURL(file)
          e.preventDefault()
          break
        }
      }
    }

    window.addEventListener('paste', handleWindowPaste)
    return () => window.removeEventListener('paste', handleWindowPaste)
  }, [viewingProofItem, loadLogs])

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

    const term = (searchTerm || '').trim().toLowerCase()
    if (!term) return true
    const name = String(item.employee_name || '').toLowerCase()
    const eventId = String(item.event_id || '').toLowerCase()
    const orderCode = String(item.order_code || '').toLowerCase()
    const groupName = String(item.group_name || '').toLowerCase()
    const ex = String(item.example || '').toLowerCase()
    return (
      name.includes(term) ||
      eventId.includes(term) ||
      orderCode.includes(term) ||
      groupName.includes(term) ||
      ex.includes(term)
    )
  })

  // Filtered employees for Sub-Tab 1
  const filteredEmployees = empLogsData
    .filter(emp => selectedStoreFilter === 'all' || emp.store_id === selectedStoreFilter)
    .filter(emp => {
      const errorCount = (emp.errors || []).length
      if (employeeFilterMode === 'has_errors') return errorCount > 0
      if (employeeFilterMode === 'clean') return errorCount === 0
      return true
    })
    .filter(emp => {
      const term = (searchTerm || '').trim().toLowerCase()
      if (!term) return true
      return String(emp.employee_name || '').toLowerCase().includes(term)
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

  const isApproved = (status?: string) => status === 'approved_ceo' || status === 'confirmed'

  const renderProofButton = (item: CombinedLogItem, defaultLabel: string = 'Bằng chứng') => {
    const hasPhoto = Boolean(item.evidence_url || item.proof_url)
    return (
      <button
        type="button"
        onClick={() => setViewingProofItem(item)}
        className={`px-2.5 py-1 rounded-lg border text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer ${
          hasPhoto
            ? 'border-blue-300 bg-blue-50 hover:bg-blue-100 text-[#1D3E61] shadow-2xs'
            : 'border-gray-200 hover:bg-gray-100 text-gray-700'
        }`}
        title={hasPhoto ? 'Đã có ảnh bằng chứng — bấm để xem' : 'Xem chi tiết & bằng chứng'}
      >
        {hasPhoto ? (
          <Camera size={13} className="text-[#2F6FA8]" />
        ) : (
          <Eye size={13} className="text-[#2F6FA8]" />
        )}
        <span>{hasPhoto ? 'Có ảnh' : defaultLabel}</span>
      </button>
    )
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
              onClick={() => {
                const url = `${window.location.origin}/kpi/violations/public`
                navigator.clipboard.writeText(url)
                toast.success('Đã sao chép link Form Leader nhập: ' + url)
              }}
              className="px-3.5 py-1.5 min-h-[36px] rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              title="Sao chép link gửi Trưởng ca (Leader) nhập lỗi trên điện thoại tại quán"
            >
              <Share2 size={13} className="text-amber-700" />
              <span>Link Leader Nhập (Public)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLogEditorOpen(true)}
              className="px-3.5 py-1.5 min-h-[36px] rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              title="Ghi nhận lỗi nhân sự hoặc sự cố ca mới"
            >
              <Plus size={14} />
              <span>Ghi Nhận Sự Cố / Lỗi Mới</span>
            </button>

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
                                  {!isApproved(err.approval_status) && (
                                    <button
                                      type="button"
                                      disabled={approvingId === err.id}
                                      onClick={() => handleQuickApprove({
                                        ...err,
                                        employee_name: emp.employee_name,
                                        store_id: emp.store_id,
                                        period: emp.period,
                                        log_kind: 'personal',
                                      })}
                                      className="px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                                      title="CEO Duyệt 1 chạm biên bản này"
                                    >
                                      <Check size={13} className="stroke-[3]" />
                                      <span>{approvingId === err.id ? 'Đang duyệt...' : 'Duyệt'}</span>
                                    </button>
                                  )}
                                  {renderProofButton({
                                    ...err,
                                    employee_name: emp.employee_name,
                                    store_id: emp.store_id,
                                    period: emp.period,
                                    log_kind: 'personal',
                                  }, 'Bằng chứng')}
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
                          <div className="flex items-center justify-center gap-1.5">
                            {!isApproved(item.approval_status) && (
                              <button
                                type="button"
                                disabled={approvingId === item.id}
                                onClick={() => handleQuickApprove(item)}
                                className="px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer shadow-2xs"
                                title="CEO Duyệt 1 chạm biên bản này"
                              >
                                <Check size={12} className="stroke-[3]" />
                                <span>{approvingId === item.id ? '...' : 'Duyệt'}</span>
                              </button>
                            )}
                            {renderProofButton(item, 'Xem')}
                          </div>
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
                    onClick={() => setIsLogEditorOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] text-white text-xs font-bold shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>+ Ghi Nhận Sự Cố Ca Mới</span>
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
                        <div className="flex items-center justify-center gap-1.5">
                          {!isApproved(item.approval_status) && (
                            <button
                              type="button"
                              disabled={approvingId === item.id}
                              onClick={() => handleQuickApprove(item)}
                              className="px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer shadow-2xs"
                              title="CEO Duyệt 1 chạm biên bản này"
                            >
                              <Check size={12} className="stroke-[3]" />
                              <span>{approvingId === item.id ? '...' : 'Duyệt'}</span>
                            </button>
                          )}
                          {renderProofButton(item, 'Xem')}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLogItem(item)
                              setIsLogEditorOpen(true)
                            }}
                            className="px-2 py-1 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer shadow-2xs"
                            title="Chỉnh sửa biên bản sự cố này (Admin)"
                          >
                            <Pencil size={12} className="text-amber-800" />
                            <span>Sửa</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL XEM BẰNG CHỨNG / BIÊN BẢN (PROOF VIEWER) VỚI CON MỘC THỜI GIAN CHUẨN ── */}
      {viewingProofItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-gray-100 my-auto max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2F6FA8] flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#001D3D]">Hồ Sơ Bằng Chứng &amp; Mộc Xác Thực</span>
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                      {viewingProofItem.event_id || viewingProofItem.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">Đối soát tính toàn vẹn dữ liệu vận hành &amp; kỷ luật</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isApproved(viewingProofItem.approval_status) ? (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 size={12} />
                    <span>Đã Duyệt BSC</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    <Clock size={12} />
                    <span>Chờ CEO Duyệt</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setViewingProofItem(null)
                    setIsAttachingProof(false)
                    setInputProofUrl('')
                  }}
                  className="w-8 h-8 rounded-xl hover:bg-gray-100 text-gray-500 flex items-center justify-center transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Thông tin sự cố */}
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/90 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-bold text-gray-900">
                    {viewingProofItem.sub_error_name || viewingProofItem.example || viewingProofItem.group_name}
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-mono font-bold text-xs bg-rose-100 text-rose-700 border border-rose-200">
                    -{viewingProofItem.points} điểm BSC
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-600 pt-1 border-t border-gray-200/60">
                  <div>
                    <span className="text-gray-400">Đối tượng: </span>
                    <strong className="text-gray-800">
                      {viewingProofItem.employee_name || (viewingProofItem.log_kind === 'personal' ? 'Nhân sự' : 'Cả quán (Vận hành)')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-400">Chi nhánh: </span>
                    <strong className="text-gray-800">{viewingProofItem.store_id || 'Homies Hồ Bá Phấn (HBP)'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400">Ca làm việc: </span>
                    <strong className="text-gray-800">{viewingProofItem.shift_name || 'Ca làm'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400">Kỳ đánh giá: </span>
                    <strong className="text-gray-800">{viewingProofItem.period || period}</strong>
                  </div>
                </div>

                {viewingProofItem.order_code && (
                  <div className="text-[11px] text-gray-500">
                    Mã đơn liên quan: <strong className="font-mono text-gray-700">{viewingProofItem.order_code}</strong>
                  </div>
                )}
              </div>

              {/* ── KHU VỰC BẰNG CHỨNG HÌNH ẢNH & CON MỘC THỜI GIAN (TIMESTAMP WATERMARK) ── */}
              {Boolean(viewingProofItem.evidence_url || viewingProofItem.proof_url) ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800 flex items-center gap-1.5 text-xs">
                      <Camera size={14} className="text-[#2F6FA8]" />
                      <span>Hình ảnh bằng chứng thực tế &amp; Mộc điện tử</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsLightboxOpen(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2F6FA8] hover:underline cursor-pointer"
                    >
                      <Maximize2 size={12} />
                      <span>Phóng to toàn màn hình</span>
                    </button>
                  </div>

                  <div className="relative rounded-2xl overflow-hidden border border-gray-300 bg-black shadow-md group">
                    {/* Ảnh bằng chứng */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={viewingProofItem.evidence_url || viewingProofItem.proof_url}
                      alt="Bằng chứng sự cố"
                      className="w-full max-h-72 object-contain mx-auto transition-transform group-hover:scale-[1.01]"
                    />

                    {/* MỘC KIỂM ĐỊNH THỜI GIAN ĐÓNG TRỰC TIẾP TRÊN ẢNH (WATERMARK SEAL) */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 text-white backdrop-blur-[2px]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                          <ShieldCheck size={13} className="text-amber-300 shrink-0" />
                          <span>MỘC KIỂM ĐỊNH THỜI GIAN HOMIES HRM</span>
                        </div>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/20 text-white">
                          Verified Audit
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-gray-200 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>📅 {viewingProofItem.occurred_at ? new Date(viewingProofItem.occurred_at).toLocaleString('vi-VN') : 'Không rõ mốc giờ'}</span>
                        <span>📍 {viewingProofItem.store_id || 'store-001'}</span>
                        {viewingProofItem.shift_name && <span>⏰ {viewingProofItem.shift_name}</span>}
                      </div>
                      <div className="text-[10px] text-gray-300 mt-0.5 truncate">
                        👤 {viewingProofItem.employee_name || 'Nhân sự'} • Mã sự kiện: {viewingProofItem.event_id || viewingProofItem.id}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* THẺ CHỨNG THỰC ĐIỆN TỬ TỪ BOT ZALO KHI CHƯA ĐÍNH KÈM FILE ẢNH */
                <div className="space-y-2">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200/80 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-[#0068FF] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                          Zalo
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-xs">Chứng thực tin nhắn &amp; Mốc thời gian Bot Hermes</div>
                          <div className="text-[11px] text-blue-800">Dữ liệu ghi nhận trực tiếp từ nhóm điều hành ca quán</div>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                        <ShieldCheck size={11} />
                        <span>Mộc số toàn vẹn</span>
                      </span>
                    </div>

                    {/* Mộc thời gian đối soát */}
                    <div className="p-2.5 rounded-xl bg-white/80 border border-blue-100 font-mono text-[11px] text-gray-700 space-y-1">
                      <div className="flex items-center justify-between text-gray-500">
                        <span>MỐC THỜI GIAN SỰ CỐ:</span>
                        <strong className="text-blue-900">
                          {viewingProofItem.occurred_at ? new Date(viewingProofItem.occurred_at).toLocaleString('vi-VN') : 'Mặc định ca hiện tại'}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-gray-500">
                        <span>NGƯỜI XÁC NHẬN:</span>
                        <span className="text-gray-800">{viewingProofItem.verifier_name || 'Hermes AI Assistant'}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-500">
                        <span>MÃ HỒ SƠ TRA CỨU:</span>
                        <span className="text-gray-800 font-bold">{viewingProofItem.event_id || viewingProofItem.id}</span>
                      </div>
                    </div>

                    {/* Nội dung trích dẫn từ Zalo */}
                    {viewingProofItem.evidence_note && (
                      <div className="text-[11px] text-gray-700 bg-white/70 p-2.5 rounded-xl border border-gray-200/70">
                        <span className="font-semibold text-gray-500">Trích xuất ngữ cảnh: </span>
                        <span>{viewingProofItem.evidence_note}</span>
                      </div>
                    )}

                    {/* Nút bật/tắt đính kèm ảnh */}
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[11px] text-gray-500">Cần lưu thêm ảnh camera hoặc biên bản giấy?</span>
                      <button
                        type="button"
                        onClick={() => setIsAttachingProof(prev => !prev)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 text-[11px] font-bold transition cursor-pointer"
                      >
                        <Camera size={12} />
                        <span>{isAttachingProof ? 'Thu gọn' : 'Đính kèm ảnh bằng chứng'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Form đính kèm ảnh bằng chứng nhanh */}
                  {isAttachingProof && (
                    <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2.5 animate-in fade-in duration-150">
                      <div className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                        <Upload size={13} className="text-[#2F6FA8]" />
                        <span>Đính kèm link hình ảnh bằng chứng (Camera / Google Drive / URL ảnh)</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="Dán link ảnh (https://...)"
                          value={inputProofUrl}
                          onChange={(e) => setInputProofUrl(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-300 bg-white outline-none focus:border-[#2F6FA8]"
                        />
                        <button
                          type="button"
                          disabled={!inputProofUrl.trim() || isSavingProof}
                          onClick={async () => {
                            if (!inputProofUrl.trim()) return
                            setIsSavingProof(true)
                            try {
                              const ok = await bscAdapter.updateProof(viewingProofItem.id, inputProofUrl.trim(), viewingProofItem.evidence_note)
                              if (ok) {
                                toast.success('Đã lưu ảnh bằng chứng vào biên bản thành công!')
                                setViewingProofItem({
                                  ...viewingProofItem,
                                  evidence_url: inputProofUrl.trim(),
                                })
                                setIsAttachingProof(false)
                                await loadLogs()
                              } else {
                                toast.error('Không thể lưu ảnh bằng chứng, vui lòng thử lại!')
                              }
                            } catch {
                              toast.error('Lỗi khi lưu ảnh bằng chứng')
                            } finally {
                              setIsSavingProof(false)
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                        >
                          {isSavingProof ? 'Đang lưu...' : 'Lưu Ảnh'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Thanh hướng dẫn dán ảnh chụp màn hình nhanh */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/70 text-[11px] text-blue-900 font-medium">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#2F6FA8] shrink-0" />
                  <span>Mẹo: Chụp màn hình xong bấm <strong>Ctrl + V</strong> ở bất kỳ đâu để dán ảnh tức thì!</span>
                </div>
                <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded-md border border-blue-200 text-blue-800 font-bold shrink-0">
                  Ctrl + V
                </span>
              </div>
            </div>

            {/* Footer hành động */}
            <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100">
              <button
                type="button"
                onClick={async () => {
                  if (!confirm('Bạn có chắc muốn hủy bỏ bản ghi sự cố này không? (Sau khi hủy, điểm trừ sẽ được thu hồi)')) return
                  try {
                    const success = await bscAdapter.removeOperationError(viewingProofItem.id)
                    if (success) {
                      toast.success('Đã hủy bỏ bản ghi sự cố thành công!')
                      setViewingProofItem(null)
                      void loadLogs()
                    } else {
                      toast.error('Không thể hủy sự cố. Vui lòng thử lại!')
                    }
                  } catch {
                    toast.error('Có lỗi xảy ra khi hủy sự cố')
                  }
                }}
                className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition cursor-pointer"
              >
                Hủy Bỏ / Thu Hồi
              </button>

              <div className="flex items-center gap-2">
                {!isApproved(viewingProofItem.approval_status) && (
                  <button
                    type="button"
                    disabled={approvingId === viewingProofItem.id}
                    onClick={async () => {
                      await handleQuickApprove(viewingProofItem)
                      setViewingProofItem(null)
                    }}
                    className="px-4 py-2 rounded-xl border border-emerald-500 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Check size={14} className="stroke-[3]" />
                    <span>{approvingId === viewingProofItem.id ? 'Đang duyệt...' : 'Duyệt Biên Bản Ngay'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const itemToEdit = viewingProofItem
                    setViewingProofItem(null)
                    setEditingLogItem(itemToEdit)
                    setIsLogEditorOpen(true)
                  }}
                  className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Pencil size={13} className="text-amber-800" />
                  <span>Sửa</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewingProofItem(null)
                    setIsAttachingProof(false)
                    setInputProofUrl('')
                  }}
                  className="px-4 py-2 rounded-xl bg-[#001D3D] text-white text-xs font-bold hover:bg-[#0a2e5c] transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LIGHTBOX PHÓNG TO ẢNH BẰNG CHỨNG CÓ CON MỘC XÁC THỰC ── */}
      {isLightboxOpen && viewingProofItem && (viewingProofItem.evidence_url || viewingProofItem.proof_url) && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition cursor-pointer"
            >
              <X size={24} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={viewingProofItem.evidence_url || viewingProofItem.proof_url}
              alt="Bằng chứng phóng to"
              className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-white/20"
            />
            <div className="mt-3 w-full bg-black/80 text-white p-3 rounded-2xl border border-white/10 text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <ShieldCheck size={16} />
                <span>MỘC KIỂM ĐỊNH THỜI GIAN HOMIES HRM: {viewingProofItem.occurred_at ? new Date(viewingProofItem.occurred_at).toLocaleString('vi-VN') : ''}</span>
              </div>
              <div className="text-gray-300 font-mono text-[11px]">
                {viewingProofItem.store_id} • {viewingProofItem.employee_name || 'Vận hành quán'} • {viewingProofItem.event_id}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── POPUP NHẬP / CHỈNH SỬA LỖI ĐỒNG BỘ THỐNG NHẤT (BSC & KPI CHUNG) ── */}
      <StoreOperationIncidentModal
        isOpen={isLogEditorOpen}
        onClose={() => {
          setIsLogEditorOpen(false)
          setEditingLogItem(null)
        }}
        onSuccess={() => {
          setIsLogEditorOpen(false)
          setEditingLogItem(null)
          void loadLogs()
        }}
        defaultStoreId={selectedStoreFilter === 'all' ? (storeId || 'store-001') : selectedStoreFilter}
        defaultPeriod={period}
        editingIncident={editingLogItem}
      />
    </div>
  )
}
