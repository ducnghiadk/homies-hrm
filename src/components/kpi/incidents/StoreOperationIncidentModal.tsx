'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  X,
  AlertTriangle,
  Building2,
  Calendar,
  Clock,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  FileText,
  User,
  Users,
  Check,
  Receipt,
  Layers,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { kpiBscSyncService } from '@/lib/services/kpi-bsc-sync-service'
import { useAuthStore } from '@/store/auth-store'
import { mockStores } from '@/lib/mock-data'
import { EmployeeService } from '@/lib/services/employee-service'
import { normalizeStoreId, isStoreMatch } from '@/lib/services/violation-permission-service'

import {
  incidentCatalogService,
  DEFAULT_FNB_ERROR_CATEGORIES,
  type ErrorScope,
  type UnifiedErrorCategory,
  type ErrorGroup,
} from '@/lib/services/incident-catalog-service'

export type { ErrorScope, UnifiedErrorCategory, ErrorGroup }
export const UNIFIED_FNB_ERROR_CATEGORIES = DEFAULT_FNB_ERROR_CATEGORIES

export const SHIFTS = [
  'Ca Sáng (06:30 - 12:00)',
  'Ca Trưa (12:00 - 17:00)',
  'Ca Tối (17:00 - 22:00)',
  'Ca Đêm / Dọn Quầy (22:00 - 02:00)',
]

export function getShiftFromDateTime(dateTimeStr: string): string {
  if (!dateTimeStr) return SHIFTS[0]
  try {
    const date = new Date(dateTimeStr)
    const hour = date.getHours()
    const minute = date.getMinutes()
    const timeVal = hour + minute / 60
    if (timeVal >= 6 && timeVal < 12) return SHIFTS[0]
    if (timeVal >= 12 && timeVal < 17) return SHIFTS[1]
    if (timeVal >= 17 && timeVal < 22) return SHIFTS[2]
    return SHIFTS[3]
  } catch {
    return SHIFTS[0]
  }
}

interface StoreOperationIncidentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  defaultStoreId?: string
  defaultPeriod?: string
  editingIncident?: any
}

export default function StoreOperationIncidentModal({
  isOpen,
  onClose,
  onSuccess,
  defaultStoreId,
  defaultPeriod,
  editingIncident,
}: StoreOperationIncidentModalProps) {
  const { user } = useAuthStore()

  // Dynamic incident catalog from settings
  const [catalogList, setCatalogList] = useState<UnifiedErrorCategory[]>(() =>
    incidentCatalogService.getActiveCategories()
  )

  useEffect(() => {
    const unsub = incidentCatalogService.subscribeToUpdates((list) => {
      setCatalogList(list.filter((c) => c.isActive !== false))
    })
    return () => unsub()
  }, [])

  const [storeId, setStoreId] = useState(defaultStoreId && defaultStoreId !== 'all' ? defaultStoreId : 'store-001')
  const [period, setPeriod] = useState(defaultPeriod || '2026-09')
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 16))
  const [shiftName, setShiftName] = useState(getShiftFromDateTime(new Date().toISOString()))

  // Error Selection
  const [selectedCategoryCode, setSelectedCategoryCode] = useState<string>(
    DEFAULT_FNB_ERROR_CATEGORIES[0].code
  )
  const [customErrorTitle, setCustomErrorTitle] = useState('')
  const [customScope, setCustomScope] = useState<ErrorScope>('dual_impact')

  // Penalty parameters
  const [employeePoints, setEmployeePoints] = useState(DEFAULT_FNB_ERROR_CATEGORIES[0].defaultEmployeePoints)
  const [storePoints, setStorePoints] = useState(DEFAULT_FNB_ERROR_CATEGORIES[0].defaultStorePoints)
  const [isLockBonus, setIsLockBonus] = useState(false)
  const [isOneStarImpact, setIsOneStarImpact] = useState(true)

  // Personnel & Details
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [orderCode, setOrderCode] = useState('')
  const [description, setDescription] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Current category definition
  const currentCategory = useMemo(() => {
    return (
      catalogList.find((c) => c.code === selectedCategoryCode) ||
      catalogList[0] ||
      DEFAULT_FNB_ERROR_CATEGORIES[0]
    )
  }, [catalogList, selectedCategoryCode])

  // Effective scope (handles CUSTOM-OTHER overrides)
  const effectiveScope: ErrorScope = useMemo(() => {
    if (selectedCategoryCode === 'CUSTOM-OTHER') return customScope
    return currentCategory.scope
  }, [selectedCategoryCode, customScope, currentCategory])

  // Danh sách nhân viên theo cửa hàng
  const storeStaffList = useMemo(() => {
    try {
      const allEmps = EmployeeService.getEmployees()
      const matched = allEmps.filter(e => isStoreMatch(e.store_id, storeId))
      if (matched.length > 0) return matched
    } catch {}
    return [
      { id: 'emp-001', full_name: 'Nguyễn Văn Minh', employee_code: 'BH-1001' },
      { id: 'emp-002', full_name: 'Trần Thị Lan', employee_code: 'BH-1002' },
      { id: 'emp-003', full_name: 'Lê Hoàng Tuấn', employee_code: 'BH-1003' },
      { id: 'emp-004', full_name: 'Phạm Thị Hoa', employee_code: 'BH-1004' },
      { id: 'emp-005', full_name: 'Nguyễn Đức Nghĩa', employee_code: 'BH-1005' },
    ]
  }, [storeId])

  useEffect(() => {
    if (storeStaffList.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(storeStaffList[0].id)
    }
  }, [storeStaffList, selectedEmployeeId])

  // Tự động nhận diện ca làm việc khi giờ thay đổi
  const handleDateTimeChange = (val: string) => {
    setOccurredAt(val)
    setShiftName(getShiftFromDateTime(val))
  }

  // Khi chọn lỗi trong danh mục -> Tự động điền điểm và thiết lập
  const handleCategorySelect = (code: string) => {
    setSelectedCategoryCode(code)
    const cat = catalogList.find((c) => c.code === code) || DEFAULT_FNB_ERROR_CATEGORIES.find((c) => c.code === code)
    if (cat) {
      setEmployeePoints(cat.defaultEmployeePoints)
      setStorePoints(cat.defaultStorePoints)
      setIsLockBonus(Boolean(cat.isLockBonus))
      setIsOneStarImpact(Boolean(cat.impactCSAT))
      if (!cat.hasOrderCode) {
        setOrderCode('')
      }
      if (cat.code === 'CUSTOM-OTHER') {
        setCustomScope('dual_impact')
      }
    }
  }

  // Prefill dữ liệu khi Admin bấm Sửa biên bản
  useEffect(() => {
    if (editingIncident) {
      const subCode = editingIncident.sub_error_id || editingIncident.violation_code || editingIncident.error_id
      const matched = catalogList.find((c) => c.code === subCode) || DEFAULT_FNB_ERROR_CATEGORIES.find((c) => c.code === subCode)
      if (matched) {
        setSelectedCategoryCode(matched.code)
        setEmployeePoints(editingIncident.points ?? editingIncident.penalty_points ?? matched.defaultEmployeePoints)
        setStorePoints(matched.defaultStorePoints)
        setIsOneStarImpact(Boolean(editingIncident.affects_customer_score || matched.impactCSAT))
        setIsLockBonus(Boolean(editingIncident.locks_personal_bonus || matched.isLockBonus))
      } else {
        setSelectedCategoryCode('CUSTOM-OTHER')
        setCustomErrorTitle(editingIncident.sub_error_name || editingIncident.error_name || '')
        if (editingIncident.employee_id) {
          setCustomScope(editingIncident.affects_customer_score ? 'dual_impact' : 'individual')
        } else {
          setCustomScope('store_operation')
        }
      }

      if (editingIncident.employee_id) setSelectedEmployeeId(editingIncident.employee_id)
      if (editingIncident.store_id) setStoreId(editingIncident.store_id)
      if (editingIncident.period) setPeriod(editingIncident.period)
      if (editingIncident.order_code) setOrderCode(editingIncident.order_code)
      if (editingIncident.evidence_url) setEvidenceUrl(editingIncident.evidence_url)
      if (editingIncident.example || editingIncident.description || editingIncident.evidence_note) {
        setDescription(editingIncident.example || editingIncident.description || editingIncident.evidence_note || '')
      }
      if (editingIncident.occurred_at) {
        setOccurredAt(editingIncident.occurred_at.slice(0, 16))
        setShiftName(editingIncident.shift_name || getShiftFromDateTime(editingIncident.occurred_at))
      }
    }
  }, [editingIncident])

  if (!isOpen) return null

  const selectedEmployee = storeStaffList.find(e => e.id === selectedEmployeeId)
  const currentStore = mockStores.find(s => s.id === storeId) || { name: 'Homies Milk Tea' }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!description.trim()) {
      toast.error('Vui lòng nhập mô tả chi tiết diễn biến sự cố!')
      return
    }

    if (effectiveScope !== 'store_operation' && !selectedEmployeeId) {
      toast.error('Vui lòng chọn nhân sự chịu trách nhiệm vi phạm!')
      return
    }

    if (selectedCategoryCode === 'CUSTOM-OTHER' && !customErrorTitle.trim()) {
      toast.error('Vui lòng nhập tên sự cố phát sinh ngoài danh mục!')
      return
    }

    setIsSubmitting(true)
    try {
      const isDual = effectiveScope === 'dual_impact'
      const isStoreOnly = effectiveScope === 'store_operation'

      const titlePart = selectedCategoryCode === 'CUSTOM-OTHER'
        ? customErrorTitle.trim()
        : currentCategory.name

      const hasOrder = Boolean(currentCategory.hasOrderCode && orderCode.trim())
      const fullDesc = `[${selectedCategoryCode}] ${titlePart}. ${description.trim()}${hasOrder ? ` (Mã đơn: #${orderCode.trim()})` : ''}`

      await kpiBscSyncService.logIncident({
        id: editingIncident?.id,
        is_operation_error: isStoreOnly,
        employee_id: isStoreOnly ? undefined : selectedEmployeeId,
        employee_name: isStoreOnly ? undefined : (selectedEmployee ? `${selectedEmployee.full_name} (${(selectedEmployee as any).employee_code || ''})` : undefined),
        store_id: storeId,
        period,
        occurred_at: occurredAt,
        shift_name: shiftName,
        violation_code: selectedCategoryCode,
        description: fullDesc,
        penalty_points: isStoreOnly ? storePoints : employeePoints,
        store_points: isDual ? storePoints : (isStoreOnly ? storePoints : 0),
        severity: currentCategory.severity,
        is_lock_bonus: isLockBonus,
        evidence_url: evidenceUrl.trim() || undefined,
        logged_by: user?.full_name || 'Quản lý cửa hàng',
        logged_by_role: user?.role || 'store_manager',
        impact_rating_1star: isDual || (selectedCategoryCode === 'CUSTOM-OTHER' && isOneStarImpact),
      })

      toast.success(
        editingIncident
          ? 'Đã cập nhật sự cố thành công & tính lại điểm BSC/KPI!'
          : isDual
          ? `Đã ghi nhận sự cố Tác Động Kép! Trừ ${employeePoints}đ nhân viên & trừ ${storePoints}đ CSAT của Quán trên bảng BSC.`
          : isStoreOnly
          ? `Đã ghi nhận sự cố vận hành ca! Trừ ${storePoints}đ điểm vận hành của Quán trên bảng BSC.`
          : `Đã ghi nhận lỗi cá nhân! Trừ ${employeePoints}đ hệ số chia thưởng BSC của nhân viên.`
      )

      onSuccess()
      onClose()
    } catch (err) {
      toast.error('Có lỗi xảy ra khi lưu sự cố. Vui lòng thử lại!')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-[#FFFDF7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#2F6FA8] flex items-center justify-center border border-blue-100 shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#001D3D] flex items-center gap-2">
                <span>{editingIncident ? 'Chỉnh Sửa Sự Cố (Admin/Quản Lý)' : 'Ghi Nhận Sự Cố & Vi Phạm'}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${editingIncident ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
                  {editingIncident ? 'Chế độ Chỉnh Sửa' : 'Tự Động Phân Bổ BSC & KPI'}
                </span>
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Chọn lỗi thực tế — Hệ thống tự động phân loại đối tượng và trừ điểm tương ứng.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Hàng 1: Cơ sở, Kỳ tháng, Ca làm việc, Thời điểm */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Cơ sở / Cửa hàng <span className="text-rose-500">*</span>
              </label>
              <select
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#2F6FA8]"
              >
                {mockStores.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Kỳ áp dụng <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="2026-09"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#2F6FA8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Ca làm việc (Tự nhận diện)
              </label>
              <select
                value={shiftName}
                onChange={(e) => setShiftName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#2F6FA8]"
              >
                {SHIFTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Hàng 2: Thời điểm xảy ra */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Thời điểm xảy ra sự cố <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => handleDateTimeChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#2F6FA8]"
            />
          </div>

          {/* Hàng 3: Danh Mục Sự Cố Chuẩn F&B (1 Dropdown Duy Nhất Phân Nhóm) */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700">
              Sự cố vi phạm chuẩn F&B Homies <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedCategoryCode}
              onChange={(e) => handleCategorySelect(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-800 focus:outline-none focus:border-[#2F6FA8]"
            >
              <optgroup label="🥤 ĐƠN HÀNG & KHÁCH HÀNG (APP / TẠI QUÁN)">
                {catalogList.filter(c => c.group === 'Đơn Hàng & Khách Hàng (App / Tại Quán)').map(c => (
                  <option key={c.code} value={c.code}>
                    {c.name} {c.scope === 'dual_impact' ? '⚡ [Tác động kép: Quán & Cá nhân]' : ''}
                  </option>
                ))}
              </optgroup>

              <optgroup label="🧋 PHA CHẾ & SOP CHẤT LƯỢNG">
                {catalogList.filter(c => c.group === 'Pha Chế & SOP Chất Lượng').map(c => (
                  <option key={c.code} value={c.code}>
                    {c.name} {c.scope === 'store_operation' ? '👥 [Lỗi toàn ca]' : ''}
                  </option>
                ))}
              </optgroup>

              <optgroup label="🧼 VỆ SINH & AN TOÀN THỰC PHẨM (VSATTP)">
                {catalogList.filter(c => c.group === 'Vệ Sinh & An Toàn Thực Phẩm').map(c => (
                  <option key={c.code} value={c.code}>
                    {c.name} {c.scope === 'dual_impact' ? '⚡ [Tác động kép nghiêm trọng]' : c.scope === 'store_operation' ? '👥 [Lỗi toàn ca]' : ''}
                  </option>
                ))}
              </optgroup>

              <optgroup label="⏰ GIỜ CÔNG, KỶ LUẬT & TIỀN BẠC">
                {catalogList.filter(c => c.group === 'Giờ Công & Kỷ Luật').map(c => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </optgroup>

              <optgroup label="📝 SỰ CỐ KHÁC NGOÀI DANH MỤC">
                {catalogList.filter(c => c.group === 'Khác / Bổ Sung').map(c => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Nếu chọn sự cố khác -> Cho phép tự gõ tên và chọn đối tượng chịu phạt */}
          {selectedCategoryCode === 'CUSTOM-OTHER' && (
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2.5 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-amber-950 mb-1">
                  Tên sự cố phát sinh ngoài danh mục <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={customErrorTitle}
                  onChange={(e) => setCustomErrorTitle(e.target.value)}
                  placeholder="VD: Làm vỡ bình trà ủ, cúp điện làm hỏng mẻ kem cheese..."
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-bold text-gray-800 focus:outline-none focus:border-[#2F6FA8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-950 mb-1">
                  Đối tượng chịu trách nhiệm sự cố này:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-amber-200 cursor-pointer text-xs font-bold text-gray-700">
                    <input
                      type="radio"
                      name="custom-scope"
                      value="individual"
                      checked={customScope === 'individual'}
                      onChange={() => setCustomScope('individual')}
                      className="text-[#2F6FA8]"
                    />
                    <span>1. Cá nhân vi phạm</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-amber-200 cursor-pointer text-xs font-bold text-gray-700">
                    <input
                      type="radio"
                      name="custom-scope"
                      value="store_operation"
                      checked={customScope === 'store_operation'}
                      onChange={() => setCustomScope('store_operation')}
                      className="text-[#2F6FA8]"
                    />
                    <span>2. Toàn ca vận hành quán</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-amber-200 cursor-pointer text-xs font-bold text-gray-700">
                    <input
                      type="radio"
                      name="custom-scope"
                      value="dual_impact"
                      checked={customScope === 'dual_impact'}
                      onChange={() => setCustomScope('dual_impact')}
                      className="text-[#2F6FA8]"
                    />
                    <span>3. Tác động kép (Cả hai)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Nhân viên vi phạm (Chỉ hiện nếu có phạt cá nhân hoặc tác động kép) */}
          {effectiveScope !== 'store_operation' ? (
            <div className="animate-fade-in">
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                <span>Nhân viên chịu trách nhiệm vi phạm <span className="text-rose-500">*</span></span>
                <span className="text-[11px] font-normal text-gray-500">Trừ vào hệ số chia thưởng bạn này</span>
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#2F6FA8]"
              >
                {storeStaffList.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.full_name} {(e as any).employee_code ? `(${(e as any).employee_code})` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center gap-2.5 text-xs text-blue-900 font-semibold animate-fade-in">
              <Users size={16} className="text-[#2F6FA8] shrink-0" />
              <span>Lỗi vận hành toàn ca: Trừ điểm tiêu chuẩn của Quán trên bảng BSC (Không phạt trừ cá nhân nhân viên nào).</span>
            </div>
          )}

          {/* ⚡ KHUNG TÓM TẮT TRỰC QUAN TÁC ĐỘNG (Visual Impact Box) */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-300 text-xs text-amber-950 space-y-1.5 shadow-2xs">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <Sparkles size={14} className="text-amber-700" />
              <span>Dự kiến phân bổ điểm trừ sau khi lưu:</span>
            </div>

            <div className="space-y-1 pl-4 text-[11px]">
              {effectiveScope !== 'store_operation' && (
                <div className="flex items-center gap-2 font-medium">
                  <span className="font-bold text-rose-700">• Cá nhân:</span>
                  <span>
                    <strong>{selectedEmployee?.full_name || 'Nhân sự'}</strong> — Trừ{' '}
                    <strong className="text-rose-700">{employeePoints}đ</strong> vào hệ số chia thưởng BSC &amp; lưu hồ sơ KPI
                    {isLockBonus ? ' (Khóa thưởng tháng về 0đ)' : ''}.
                  </span>
                </div>
              )}

              {(effectiveScope === 'store_operation' || effectiveScope === 'dual_impact') && (
                <div className="flex items-center gap-2 font-medium">
                  <span className="font-bold text-[#2F6FA8]">• Cửa hàng:</span>
                  <span>
                    <strong>{currentStore.name}</strong> — Trừ{' '}
                    <strong className="text-[#2F6FA8]">{storePoints}đ</strong> vào tiêu chí{' '}
                    <strong>{currentCategory.impactCSAT || isOneStarImpact ? 'Dịch vụ khách hàng (CSAT)' : 'Vận hành cửa hàng (SOP)'}</strong>{' '}
                    trên bảng quyết toán BSC tháng {period}.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tùy chỉnh điểm phạt nếu cần */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {effectiveScope !== 'store_operation' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Điểm phạt trừ hệ số thưởng cá nhân
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={employeePoints}
                    onChange={(e) => setEmployeePoints(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-rose-700 focus:outline-none focus:border-[#2F6FA8]"
                  />
                  <span className="text-xs font-bold text-gray-500 shrink-0">điểm</span>
                </div>
              </div>
            )}

            {(effectiveScope === 'store_operation' || effectiveScope === 'dual_impact') && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Điểm phạt trừ bảng quyết toán Quán
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={storePoints}
                    onChange={(e) => setStorePoints(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-[#2F6FA8] focus:outline-none focus:border-[#2F6FA8]"
                  />
                  <span className="text-xs font-bold text-gray-500 shrink-0">điểm</span>
                </div>
              </div>
            )}
          </div>

          {/* Lỗi nặng khóa thưởng (chỉ hiện nếu có phạt cá nhân) */}
          {effectiveScope !== 'store_operation' && (
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-rose-900 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">
              <input
                type="checkbox"
                checked={isLockBonus}
                onChange={(e) => setIsLockBonus(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded border-gray-300 focus:ring-rose-500"
              />
              <span>Khóa thưởng tháng về 0đ (Lỗi kỷ luật đặc biệt nghiêm trọng)</span>
            </label>
          )}

          {/* Phần thông tin bổ sung: Mã đơn (Chỉ hiện khi lỗi liên quan đơn hàng), Mô tả, Bằng chứng */}
          <div className="space-y-3 pt-1">
            {currentCategory.hasOrderCode && (
              <div className="animate-fade-in">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Mã đơn hàng liên quan (Grab / Shopee / POS nếu có)
                </label>
                <input
                  type="text"
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  placeholder="VD: #GF-9812 hoặc Bill 0042"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 focus:outline-none focus:border-[#2F6FA8]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Mô tả chi tiết sự việc <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ghi rõ diễn biến sự cố, nguyên nhân phát sinh..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 focus:outline-none focus:border-[#2F6FA8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Link ảnh bằng chứng / Camera (Google Drive / Ảnh quầy)
              </label>
              <input
                type="text"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 focus:outline-none focus:border-[#2F6FA8]"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-xs font-bold hover:bg-gray-100 transition cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Đang lưu...</span>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>{editingIncident ? 'Lưu Thay Đổi (Cập Nhật)' : 'Xác Nhận & Ghi Nhận Sự Cố'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
