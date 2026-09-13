'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  ShieldAlert,
  CheckCircle2,
  User,
  Store,
  AlertTriangle,
  Receipt,
  ChevronRight,
  ChevronLeft,
  Info,
  ExternalLink,
} from 'lucide-react'
import {
  bscOperationErrorGroups,
  bscPersonalErrorGroups,
  bscSubErrorCatalog,
  findErrorEventByOrderCode,
} from '@/lib/mock-data-bsc'
import { bscAdapter } from '@/lib/adapters/bsc-adapter'

import type {
  BSCPersonalErrorGroup,
  BSCOperationGroup,
  BSCSourceType,
  BSCApprovalStatus,
} from '@/lib/bsc-types'

// Reusable Info Tooltip Component for "Chữ i Nhỏ"
function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-flex items-center ml-1.5">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="w-4 h-4 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition flex items-center justify-center cursor-pointer border border-blue-200 focus:outline-none"
        aria-label="Giải thích thông tin"
      >
        <Info size={11} />
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-64 p-2.5 bg-gray-900 text-white text-[11px] font-medium rounded-xl shadow-lg z-50 pointer-events-none leading-tight animate-fade-in font-sans">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </span>
  )
}

interface BSCLogEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  storeId: string
  period: string
}

export default function BSCLogEditorModal({
  isOpen,
  onClose,
  onSuccess,
  storeId,
  period,
}: BSCLogEditorModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [storeEmployees, setStoreEmployees] = useState<{ id: string; name: string; role: string }[]>([])

  // Step 1: Event Category
  const [eventCategory, setEventCategory] = useState<'operation_store' | 'personal' | 'customer_feedback' | 'critical'>('operation_store')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [employeeTargetMode, setEmployeeTargetMode] = useState<'single' | 'whole_shift' | 'multiple' | 'unknown'>('single')

  // Step 2: Error Selection (Group & Sub-error)
  const [personalGroupKey, setPersonalGroupKey] = useState(bscPersonalErrorGroups[0]?.key || 'gio_lam_cham_cong')
  const [opGroupKey, setOpGroupKey] = useState(bscOperationErrorGroups[0]?.key || 'lam_don')
  const [selectedSubErrorId, setSelectedSubErrorId] = useState<string>('')
  const [errorPoints, setErrorPoints] = useState(1)
  const [isSerious, setIsSerious] = useState(false)

  // Step 3: Event Info, Shift & Duplicate Protection
  const [occurredDate, setOccurredDate] = useState(() => new Date().toISOString().slice(0, 10))

  useEffect(() => {
    let isMounted = true
    async function loadStoreStaff() {
      const empData = await bscAdapter.getEmployeePersonalData(storeId, period)
      if (isMounted) {
        if (empData && empData.length > 0) {
          const list = empData.map(e => ({
            id: e.employee_id,
            name: e.employee_name,
            role: e.role,
          }))
          setStoreEmployees(list)
          setSelectedEmployeeId(prev => prev || (list[0] ? list[0].id : 'emp-001'))
        } else {
          // Default fallback staff list for initial clean state
          setStoreEmployees([
            { id: 'emp-001', name: 'Nguyễn Văn Minh', role: 'employee' },
            { id: 'emp-002', name: 'Trần Thị Lan', role: 'employee' },
            { id: 'emp-003', name: 'Lê Hoàng Tuấn', role: 'shift_leader' },
            { id: 'emp-004', name: 'Phạm Thị Hoa', role: 'employee' },
            { id: 'emp-005', name: 'Nguyễn Đức Nghĩa', role: 'store_manager' },
          ])
          setSelectedEmployeeId(prev => prev || 'emp-001')
        }
      }
    }
    if (isOpen) {
      loadStoreStaff()
    }
    return () => { isMounted = false }
  }, [isOpen, storeId, period])
  const [occurredTime, setOccurredTime] = useState('14:20')
  const [shiftName, setShiftName] = useState<'Ca Sáng (06:00 - 14:00)' | 'Ca Chiều (14:00 - 22:00)' | 'Ca Tối (22:00 - 06:00)'>('Ca Chiều (14:00 - 22:00)')
  const [sourceType, setSourceType] = useState<BSCSourceType>('grab')
  const [orderCode, setOrderCode] = useState('')
  const [description, setDescription] = useState('')
  const [duplicateOrderWarning, setDuplicateOrderWarning] = useState<string | null>(null)

  // Step 4: Multi-Scope Control
  const [affectsOpScore, setAffectsOpScore] = useState(true)
  const [affectsPersonalMultiplier, setAffectsPersonalMultiplier] = useState(false)
  const [affectsCustomerScore, setAffectsCustomerScore] = useState(false)
  const [locksPersonalBonus, setLocksPersonalBonus] = useState(false)
  const [scopeReason, setScopeReason] = useState('')

  // Step 5: Mandatory Evidence & Approval Status
  const [evidenceType, setEvidenceType] = useState<'order_code' | 'image' | 'camera' | 'customer_chat' | 'verifier_confirm'>('customer_chat')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [evidenceNote, setEvidenceNote] = useState('')
  const [verifierName, setVerifierName] = useState('Quản Lý Nguyễn Văn A')
  const [approvalStatus, setApprovalStatus] = useState<BSCApprovalStatus>('proposed_manager')

  if (!isOpen) return null

  // Check duplicate order code on blur
  const handleOrderCodeChange = (val: string) => {
    setOrderCode(val)
    if (val.trim()) {
      const existing = findErrorEventByOrderCode(val)
      if (existing) {
        setDuplicateOrderWarning(`Cảnh báo: Mã đơn ${val.toUpperCase()} đã có sự kiện lỗi "${existing.event_id}" (${existing.example}). Cân nhắc xem xét sự kiện đã ghi nhận!`)
      } else {
        setDuplicateOrderWarning(null)
      }
    } else {
      setDuplicateOrderWarning(null)
    }
  }

  // Handle sub-error change
  const handleSubErrorChange = (subId: string) => {
    setSelectedSubErrorId(subId)
    const matched = bscSubErrorCatalog.find(s => s.id === subId)
    if (matched) {
      setErrorPoints(matched.suggested_points)
      setIsSerious(matched.severity === 'critical')
      if (matched.severity === 'critical') setLocksPersonalBonus(true)
    }
  }

  const activeGroupKey = eventCategory === 'personal' ? personalGroupKey : opGroupKey
  const availableSubErrors = bscSubErrorCatalog.filter(sub => sub.group_key === activeGroupKey)

  const activeScopesCount = [affectsOpScore, affectsPersonalMultiplier, affectsCustomerScore, locksPersonalBonus].filter(Boolean).length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const storePrefix = storeId === 'store-001' ? 'HBP' : '429'
    const eventId = `ERR-${storePrefix}-${period.replace('-', '')}-${String(Math.floor(Math.random() * 8999 + 1000))}`
    const subObj = bscSubErrorCatalog.find(s => s.id === selectedSubErrorId)
    const formattedOccurred = `${occurredDate} ${occurredTime}`

    const finalStatus: BSCApprovalStatus = (!evidenceNote.trim() && !orderCode.trim())
      ? 'pending_proof'
      : approvalStatus

    if (eventCategory === 'personal') {
      const groupObj = bscPersonalErrorGroups.find(g => g.key === personalGroupKey)

      const record = {
        id: `pers-err-${Date.now()}`,
        event_id: eventId,
        employee_id: selectedEmployeeId,
        period,
        shift_name: shiftName,
        event_category: eventCategory,
        group: personalGroupKey as BSCPersonalErrorGroup,
        group_name: groupObj?.name || 'Lỗi cá nhân',
        sub_error_id: selectedSubErrorId,
        sub_error_name: subObj?.name,
        example: description.trim() || subObj?.name || 'Ghi nhận sự kiện lỗi cá nhân',
        impact: isSerious ? 'Lỗi đặc biệt nghiêm trọng (Khóa 0đ)' : `Ảnh hưởng hệ số cá nhân (Trừ ${errorPoints}đ lỗi)`,
        points: errorPoints,
        is_serious: isSerious,
        occurred_at: formattedOccurred,
        source_type: sourceType,
        order_code: orderCode.trim() || undefined,
        evidence_type: evidenceType,
        evidence_url: evidenceUrl.trim() || undefined,
        evidence_note: evidenceNote.trim() || undefined,
        verifier_name: verifierName.trim() || undefined,
        scope_reason: activeScopesCount > 1 ? scopeReason.trim() : undefined,
        affects_op_score: affectsOpScore,
        affects_personal_multiplier: affectsPersonalMultiplier,
        affects_customer_score: affectsCustomerScore,
        locks_personal_bonus: locksPersonalBonus,
        approval_status: finalStatus,
      }

      await bscAdapter.addPersonalError(selectedEmployeeId, period, record)
    } else {
      const groupObj = bscOperationErrorGroups.find(g => g.key === opGroupKey)

      const record = {
        id: `op-err-${Date.now()}`,
        event_id: eventId,
        store_id: storeId,
        period,
        shift_name: shiftName,
        event_category: eventCategory,
        group: opGroupKey as BSCOperationGroup,
        group_name: groupObj?.name || 'Lỗi vận hành',
        sub_error_id: selectedSubErrorId,
        sub_error_name: subObj?.name,
        example: description.trim() || subObj?.name || 'Ghi nhận sự kiện lỗi vận hành ca',
        points: errorPoints,
        occurred_at: formattedOccurred,
        source_type: sourceType,
        order_code: orderCode.trim() || undefined,
        evidence_type: evidenceType,
        evidence_url: evidenceUrl.trim() || undefined,
        evidence_note: evidenceNote.trim() || undefined,
        verifier_name: verifierName.trim() || undefined,
        scope_reason: activeScopesCount > 1 ? scopeReason.trim() : undefined,
        affects_op_score: affectsOpScore,
        affects_personal_multiplier: affectsPersonalMultiplier,
        affects_customer_score: affectsCustomerScore,
        locks_personal_bonus: locksPersonalBonus,
        approval_status: finalStatus,
      }

      await bscAdapter.addOperationError(record)
    }

    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-xs animate-fade-in">
      {/* Container Max-W-4XL for Spacious Apple SaaS Modal Layout */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-gray-200/80 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-gray-50/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center">
                Ghi Nhận Sự Kiện Lỗi Vi Phạm BSC Homies
                <InfoTooltip text="Mỗi sự cố thực tế ghi nhận bằng 01 Mã Sự Kiện Lỗi duy nhất, không tạo 3 lỗi rời rạc cho cùng 1 vụ việc." />
              </h3>
              <p className="text-xs text-gray-500 font-medium">Khung nhập chuẩn Apple Lean rộng rãi – Đảm bảo minh bạch &amp; chống ghi trùng lỗi 100%</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-2xl hover:bg-gray-100 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Wizard Stepper Tabs Header */}
        <div className="px-8 py-3 bg-gray-100/70 border-b border-gray-200/60 flex items-center justify-between text-xs font-bold text-gray-600 flex-shrink-0 overflow-x-auto">
          {[
            { step: 1, title: '1. Phân Loại Sự Kiện' },
            { step: 2, title: '2. Danh Mục Lỗi' },
            { step: 3, title: '3. Vụ Việc & Ca Làm' },
            { step: 4, title: '4. Phạm Vi Ảnh Hưởng' },
            { step: 5, title: '5. Bằng Chứng & Phê Duyệt' },
          ].map(s => (
            <button
              key={s.step}
              type="button"
              onClick={() => setCurrentStep(s.step as 1 | 2 | 3 | 4 | 5)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition cursor-pointer whitespace-nowrap text-xs ${
                currentStep === s.step
                  ? 'bg-white text-primary shadow-xs font-black ring-1 ring-primary/20'
                  : currentStep > s.step
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                currentStep === s.step ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {s.step}
              </span>
              <span>{s.title}</span>
            </button>
          ))}
        </div>

        {/* Form Body Scrollable */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6 text-xs overflow-y-auto flex-1">
          {/* STEP 1: PHÂN LOẠI SỰ KIỆN LỖI */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              {/* Decision Helper Box */}
              <div className="p-5 rounded-3xl bg-blue-50/80 border border-blue-200 text-blue-950 space-y-2 font-medium shadow-2xs">
                <div className="font-bold text-sm flex items-center text-blue-900">
                  <Info size={18} className="mr-2 text-blue-700" />
                  Hướng Dẫn Quy Trình Chọn Đúng Sự Kiện Lỗi:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-relaxed pt-1">
                  <div className="p-3 bg-white/80 rounded-2xl border border-blue-100 space-y-1">
                    <strong className="text-blue-900 block font-bold">Lỗi Vận Hành Cửa Hàng:</strong>
                    <p className="text-gray-700 text-[11px]">Khi sự cố làm ảnh hưởng đơn hàng, quy trình ca, hoặc điểm tiêu chí BSC cửa hàng.</p>
                  </div>
                  <div className="p-3 bg-white/80 rounded-2xl border border-blue-100 space-y-1">
                    <strong className="text-blue-900 block font-bold">Gắn Thêm Phạm Vi Cá Nhân / Khách Hàng:</strong>
                    <p className="text-gray-700 text-[11px]">Gắn ở bước 4 nếu soi được camera nhân sự gây lỗi hoặc khách nhắn phản ánh.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="font-bold text-gray-900 text-sm flex items-center">
                  Bước 1/5: Chọn Loại Sự Kiện Chính
                  <InfoTooltip text="Chọn nhóm bản chất sự cố. Phạm vi ảnh hưởng chi tiết sẽ chọn ở bước 4." />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEventCategory('operation_store')
                      setOpGroupKey('lam_don')
                      setSelectedSubErrorId('sub-op-01')
                      setAffectsOpScore(true)
                    }}
                    className={`p-5 rounded-3xl border text-left transition space-y-2 cursor-pointer shadow-2xs ${
                      eventCategory === 'operation_store'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        <Store size={20} />
                      </div>
                      <div>
                        <strong className="text-gray-900 font-bold text-sm block">Lỗi Vận Hành Cửa Hàng</strong>
                        <span className="text-[11px] text-gray-500 font-medium">Bản chất sự cố thuộc ca làm</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium leading-normal pl-1">
                      Lỗi đơn hàng, đóng gói, thiếu món, dán tem date, quy trình ca làm việc.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEventCategory('personal')
                      setPersonalGroupKey('gio_lam_cham_cong')
                      setSelectedSubErrorId('sub-pers-01')
                      setAffectsPersonalMultiplier(true)
                      setAffectsOpScore(false)
                    }}
                    className={`p-5 rounded-3xl border text-left transition space-y-2 cursor-pointer shadow-2xs ${
                      eventCategory === 'personal'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                        <User size={20} />
                      </div>
                      <div>
                        <strong className="text-gray-900 font-bold text-sm block">Lỗi Cá Nhân Nhân Viên</strong>
                        <span className="text-[11px] text-gray-500 font-medium">Chỉ liên quan kỷ luật cá nhân</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium leading-normal pl-1">
                      Đi trễ, về sớm, đồng phục, thái độ giao tiếp, không làm phân công ca.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEventCategory('customer_feedback')
                      setOpGroupKey('kiem_giao_don')
                      setSelectedSubErrorId('sub-op-03')
                      setAffectsCustomerScore(true)
                    }}
                    className={`p-5 rounded-3xl border text-left transition space-y-2 cursor-pointer shadow-2xs ${
                      eventCategory === 'customer_feedback'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-blue-100 text-[#2F6FA8] flex items-center justify-center font-bold">
                        <Receipt size={20} />
                      </div>
                      <div>
                        <strong className="text-gray-900 font-bold text-sm block">Lỗi Khách Hàng Phản Ánh</strong>
                        <span className="text-[11px] text-gray-500 font-medium">Khách phản hồi trực tiếp/App</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium leading-normal pl-1">
                      Khách đánh giá 1-3 sao hoặc nhắn Zalo/Grab/Shopee có nội dung rõ ràng.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEventCategory('critical')
                      setOpGroupKey('critical_attp')
                      setSelectedSubErrorId('sub-op-06')
                      setIsSerious(true)
                      setLocksPersonalBonus(true)
                      setErrorPoints(5)
                    }}
                    className={`p-5 rounded-3xl border text-left transition space-y-2 cursor-pointer shadow-2xs ${
                      eventCategory === 'critical'
                        ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-300'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                        <ShieldAlert size={20} />
                      </div>
                      <div>
                        <strong className="text-rose-950 font-bold text-sm block">Lỗi Đặc Biệt Nghiêm Trọng</strong>
                        <span className="text-[11px] text-rose-800 font-medium">Cần CEO/HR Admin duyệt mở</span>
                      </div>
                    </div>
                    <p className="text-xs text-rose-900 font-medium leading-normal pl-1">
                      ATTP, dị vật trong ly, che giấu lỗi, gian dối dữ liệu, xúc phạm khách.
                    </p>
                  </button>
                </div>
              </div>

              {/* Target Personnel Selection */}
              {eventCategory === 'personal' ? (
                <div className="space-y-2 pt-2">
                  <label className="font-bold text-gray-900 text-xs flex items-center">
                    Chọn nhân viên chịu trách nhiệm cá nhân
                    <InfoTooltip text="Chọn đích danh nhân sự trực tiếp gây sự cố." />
                  </label>
                  <select
                    value={selectedEmployeeId}
                    onChange={e => setSelectedEmployeeId(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white font-bold text-gray-800 outline-none text-xs focus:border-primary"
                  >
                    {storeEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} — {emp.role === 'shift_leader' ? 'Trưởng ca' : emp.role === 'store_manager' ? 'Quản lý' : 'Nhân viên'}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  <label className="font-bold text-gray-900 text-xs flex items-center">
                    Đối tượng liên quan trong ca làm
                    <InfoTooltip text="Chọn Toàn ca vận hành nếu chưa rõ người, hoặc chọn Đích danh nếu đã soi camera xác minh." />
                  </label>
                  <select
                    value={employeeTargetMode}
                    onChange={e => setEmployeeTargetMode(e.target.value as 'single' | 'whole_shift' | 'multiple' | 'unknown')}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white font-bold text-gray-800 outline-none text-xs focus:border-primary"
                  >
                    <option value="whole_shift">Toàn Ca Vận Hành (Chưa xác định người cụ thể)</option>
                    <option value="single">Một Nhân Viên Cụ Thể (Đã soi camera / đối chiếu bill)</option>
                    <option value="multiple">Nhiều Nhân Viên Trong Ca</option>
                    <option value="unknown">Chưa Xác Định Người Gây Lỗi</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: DANH MỤC LỖI 2 TẦNG */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 rounded-3xl bg-amber-50/80 border border-amber-200 text-amber-950 font-medium text-xs shadow-2xs">
                <strong>Bước 2/5:</strong> Chọn Nhóm Lỗi → Lỗi Chi Tiết 2 Tầng. Hệ thống tự nhảy điểm lỗi chuẩn.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-bold text-gray-900 text-xs flex items-center">
                    Tầng 1: Chọn nhóm vi phạm chính
                    <InfoTooltip text="Phân nhóm lỗi theo danh mục Homies." />
                  </label>
                  {eventCategory === 'personal' ? (
                    <select
                      value={personalGroupKey}
                      onChange={e => {
                        setPersonalGroupKey(e.target.value)
                        setSelectedSubErrorId('')
                      }}
                      className="w-full px-4 py-3 rounded-2xl border border-amber-300 bg-amber-50/50 font-bold text-amber-950 outline-none text-xs"
                    >
                      {bscPersonalErrorGroups.filter(g => !g.is_serious).map(grp => (
                        <option key={grp.key} value={grp.key}>{grp.name}</option>
                      ))}
                    </select>
                  ) : eventCategory === 'critical' ? (
                    <select
                      value={opGroupKey}
                      onChange={e => {
                        setOpGroupKey(e.target.value)
                        setSelectedSubErrorId('')
                      }}
                      className="w-full px-4 py-3 rounded-2xl border border-rose-300 bg-rose-50/60 font-bold text-rose-950 outline-none text-xs"
                    >
                      {bscOperationErrorGroups.filter(g => g.is_critical || g.key === 'critical_attp' || g.key === 'attp_tem_date').map(grp => (
                        <option key={grp.key} value={grp.key}>{grp.name}</option>
                      ))}
                      {bscPersonalErrorGroups.filter(g => g.is_serious || g.key === 'nghiem_trong_ca_nhan').map(grp => (
                        <option key={grp.key} value={grp.key}>Lỗi Cá Nhân: {grp.name}</option>
                      ))}
                    </select>
                  ) : eventCategory === 'customer_feedback' ? (
                    <select
                      value={opGroupKey}
                      onChange={e => {
                        setOpGroupKey(e.target.value)
                        setSelectedSubErrorId('')
                      }}
                      className="w-full px-4 py-3 rounded-2xl border border-blue-200 bg-blue-50/40 font-bold text-[#001D3D] outline-none text-xs"
                    >
                      {bscOperationErrorGroups.filter(g => ['kiem_giao_don', 'dong_goi_giao_app', 'lam_don'].includes(g.key)).map(grp => (
                        <option key={grp.key} value={grp.key}>{grp.name}</option>
                      ))}
                      {bscPersonalErrorGroups.filter(g => ['thai_do_khach'].includes(g.key)).map(grp => (
                        <option key={grp.key} value={grp.key}>Lỗi Cá Nhân: {grp.name}</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={opGroupKey}
                      onChange={e => {
                        setOpGroupKey(e.target.value)
                        setSelectedSubErrorId('')
                      }}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white font-bold text-gray-800 outline-none text-xs"
                    >
                      {bscOperationErrorGroups.filter(g => !g.is_critical).map(grp => (
                        <option key={grp.key} value={grp.key}>{grp.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-gray-900 text-xs flex items-center">
                    Tầng 2: Chọn lỗi chi tiết chuẩn (Điểm gợi ý)
                    <InfoTooltip text="Chọn lỗi chi tiết có sẵn hoặc gõ mô tả tự do ở bước sau." />
                  </label>
                  <select
                    value={selectedSubErrorId}
                    onChange={e => handleSubErrorChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-primary/40 bg-blue-50/40 font-bold text-gray-900 outline-none text-xs"
                  >
                    <option value="">
                      {availableSubErrors.length > 0
                        ? `-- Chọn 1 lỗi chi tiết thuộc nhóm đã chọn (${availableSubErrors.length} lỗi) --`
                        : '-- Gõ mô tả vụ việc chi tiết ở bước sau --'}
                    </option>
                    {availableSubErrors.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        [{sub.code}] {sub.name} (Gợi ý: {sub.suggested_points}đ lỗi)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-gray-50 border border-gray-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-900 text-xs flex items-center">
                    Số điểm lỗi tích lũy sự kiện
                    <InfoTooltip text="Số điểm ảnh hưởng thưởng. Được tự điều chỉnh nếu có tình tiết giảm nhẹ." />
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={errorPoints}
                    onChange={e => setErrorPoints(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 bg-white font-black text-gray-900 text-sm outline-none"
                  />
                </div>

                <div className="flex items-center sm:justify-end pt-2 sm:pt-0">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-700 p-3 rounded-2xl bg-rose-50 border border-rose-200">
                    <input
                      type="checkbox"
                      checked={isSerious}
                      onChange={e => {
                        setIsSerious(e.target.checked)
                        if (e.target.checked) setLocksPersonalBonus(true)
                      }}
                      className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                    />
                    <span>Khóa 0đ thưởng cá nhân tháng này</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: VỤ VIỆC, CA LÀM & CHỐNG TÍNH TRÙNG ĐƠN */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 rounded-3xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 font-medium text-xs shadow-2xs">
                <strong>Bước 3/5:</strong> Nhập ngày giờ xảy ra, Ca làm, Nguồn phát hiện &amp; Mã đơn để chống tính trùng lỗi.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-900 text-xs block">Ngày xảy ra</label>
                  <input
                    type="date"
                    value={occurredDate}
                    onChange={e => setOccurredDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 bg-white font-bold text-gray-800 outline-none text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-gray-900 text-xs block">Giờ xảy ra</label>
                  <input
                    type="time"
                    value={occurredTime}
                    onChange={e => setOccurredTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 bg-white font-bold text-gray-800 outline-none text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-gray-900 text-xs flex items-center">
                    Ca làm việc
                    <InfoTooltip text="Ca Sáng / Ca Chiều / Ca Tối dùng đối chiếu danh sách trực ca." />
                  </label>
                  <select
                    value={shiftName}
                    onChange={e => setShiftName(e.target.value as 'Ca Sáng (06:00 - 14:00)' | 'Ca Chiều (14:00 - 22:00)' | 'Ca Tối (22:00 - 06:00)')}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 bg-white font-bold text-gray-800 outline-none text-xs"
                  >
                    <option value="Ca Sáng (06:00 - 14:00)">Ca Sáng (06:00 - 14:00)</option>
                    <option value="Ca Chiều (14:00 - 22:00)">Ca Chiều (14:00 - 22:00)</option>
                    <option value="Ca Tối (22:00 - 06:00)">Ca Tối (22:00 - 06:00)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-900 text-xs flex items-center">
                    Nguồn phát hiện sự cố
                    <InfoTooltip text="Nguồn chứng minh lỗi từ kiểm tra nội bộ hay phản ánh từ App/Khách." />
                  </label>
                  <select
                    value={sourceType}
                    onChange={e => setSourceType(e.target.value as BSCSourceType)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 bg-white font-bold text-gray-800 outline-none text-xs"
                  >
                    <option value="grab">Đơn hàng GrabFood</option>
                    <option value="shopeefood">Đơn hàng ShopeeFood</option>
                    <option value="internal">Kiểm tra nội bộ ca làm</option>
                    <option value="customer">Khách phản ánh trực tiếp</option>
                    <option value="google_review">Đánh giá Google Maps</option>
                    <option value="camera">Trích xuất Camera</option>
                    <option value="pos">Hệ thống máy POS</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-gray-900 text-xs flex items-center">
                    Mã đơn hàng (Order Code)
                    <InfoTooltip text="Nhập mã đơn để hệ thống tự quét chống ghi trùng lỗi." />
                  </label>
                  <input
                    type="text"
                    value={orderCode}
                    onChange={e => handleOrderCodeChange(e.target.value)}
                    placeholder="VD: GRAB-1204, SPF-8832..."
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 bg-white font-mono font-bold text-gray-900 outline-none text-xs"
                  />
                </div>
              </div>

              {/* Duplicate Order Code Warning */}
              {duplicateOrderWarning && (
                <div className="p-4 rounded-3xl bg-amber-50 border border-amber-300 text-amber-950 font-medium text-xs flex items-start gap-3 animate-shake">
                  <AlertTriangle size={18} className="text-amber-700 flex-shrink-0 mt-0.5" />
                  <span>{duplicateOrderWarning}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-gray-900 text-xs flex items-center">
                  Mô tả chi tiết vụ việc (Rõ ràng, không cảm tính)
                  <InfoTooltip text="Mô tả ngắn diễn biến vụ việc khách quan." />
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="VD: Đơn #1204 thiếu topping trân châu. Khách nhắn Zalo phản ánh lúc 14:20. Camera thấy NV A không kiểm bill trước khi bàn giao..."
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white font-medium text-gray-800 outline-none text-xs"
                />
              </div>
            </div>
          )}

          {/* STEP 4: PHẠM VI ĂNH HƯỞNG & LÝ DO ĐA CHIỀU */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 rounded-3xl bg-blue-50/80 border border-blue-200 text-blue-950 font-medium text-xs shadow-2xs">
                <strong>Bước 4/5:</strong> Chọn phạm vi ảnh hưởng. Ghi nhận trên 01 sự kiện lỗi duy nhất, không tạo 3 lỗi rời rạc.
              </div>

              <div className="p-6 rounded-3xl border border-gray-200 bg-gray-50/70 space-y-4">
                <h4 className="font-bold text-gray-900 text-sm flex items-center">
                  Các Phạm Vi Thưởng Bị Ảnh Hưởng
                  <InfoTooltip text="Một sự kiện lỗi có thể ảnh hưởng nhiều lớp thưởng nhưng chỉ lưu 1 dòng nhật ký." />
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-gray-800">
                  <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-gray-200 cursor-pointer shadow-2xs hover:border-primary/40 transition">
                    <input
                      type="checkbox"
                      checked={affectsOpScore}
                      onChange={e => setAffectsOpScore(e.target.checked)}
                      className="rounded text-primary h-4 w-4"
                    />
                    <span className="flex items-center">
                      Ảnh hưởng Vận Hành cửa hàng
                      <InfoTooltip text="Tính vào Tiêu chí Vận hành BSC của toàn ca cửa hàng." />
                    </span>
                  </label>

                  <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-gray-200 cursor-pointer shadow-2xs hover:border-primary/40 transition">
                    <input
                      type="checkbox"
                      checked={affectsPersonalMultiplier}
                      onChange={e => setAffectsPersonalMultiplier(e.target.checked)}
                      className="rounded text-primary h-4 w-4"
                    />
                    <span className="flex items-center">
                      Ảnh hưởng Hệ số cá nhân
                      <InfoTooltip text="Tính vào Bậc hệ số thưởng cá nhân nhân viên liên quan." />
                    </span>
                  </label>

                  <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-gray-200 cursor-pointer shadow-2xs hover:border-primary/40 transition">
                    <input
                      type="checkbox"
                      checked={affectsCustomerScore}
                      onChange={e => setAffectsCustomerScore(e.target.checked)}
                      className="rounded text-primary h-4 w-4"
                    />
                    <span className="flex items-center">
                      Ảnh hưởng Điểm khách hàng
                      <InfoTooltip text="Tính vào Tiêu chí Khách hàng phản ánh của BSC." />
                    </span>
                  </label>

                  <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-gray-200 cursor-pointer shadow-2xs hover:border-rose-300 transition">
                    <input
                      type="checkbox"
                      checked={locksPersonalBonus}
                      onChange={e => setLocksPersonalBonus(e.target.checked)}
                      className="rounded text-rose-600 h-4 w-4"
                    />
                    <span className="flex items-center text-rose-950 font-bold">
                      Khóa thưởng cá nhân
                      <InfoTooltip text="Nhân sự gây lỗi nặng không nhận thưởng cá nhân tháng đó." />
                    </span>
                  </label>
                </div>
              </div>

              {activeScopesCount > 1 && (
                <div className="p-5 rounded-3xl border border-rose-300 bg-rose-50 space-y-3 animate-shake shadow-2xs">
                  <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                    <AlertTriangle size={18} />
                    <span>Cảnh báo: Sự kiện này đang ảnh hưởng {activeScopesCount} lớp thưởng!</span>
                  </div>
                  <p className="text-xs text-rose-900 font-medium leading-relaxed">
                    Bắt buộc nhập lý do vì sao sự kiện duy nhất này lại làm ảnh hưởng đa chiều trước khi gửi CEO duyệt.
                  </p>
                  <input
                    type="text"
                    required
                    value={scopeReason}
                    onChange={e => setScopeReason(e.target.value)}
                    placeholder="VD: Đơn thiếu topping đã đến tay khách, khách nhắn Zalo và camera thấy NV A không kiểm bill..."
                    className="w-full px-4 py-3 rounded-2xl border border-rose-300 bg-white font-semibold text-rose-950 outline-none text-xs"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 5: BẰNG CHỨNG BẮT BUỘC & PHÊ DUYỆT */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 rounded-3xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 font-medium text-xs shadow-2xs">
                <strong>Bước 5/5:</strong> Nhập Bằng Chứng Bắt Buộc &amp; Trạng Thái Phê Duyệt (Chỉ CEO duyệt mới tính thưởng).
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-900 text-xs flex items-center">
                    Loại bằng chứng xác minh
                    <InfoTooltip text="Bắt buộc có ít nhất 1 loại bằng chứng thực tế." />
                  </label>
                  <select
                    value={evidenceType}
                    onChange={e => setEvidenceType(e.target.value as 'order_code' | 'image' | 'camera' | 'customer_chat' | 'verifier_confirm')}
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 bg-white font-bold text-gray-800 outline-none text-xs"
                  >
                    <option value="customer_chat">Zalo / Tin nhắn phản ánh của khách</option>
                    <option value="order_code">Mã đơn hàng App / POS</option>
                    <option value="image">Ảnh chụp sản phẩm / bill lỗi</option>
                    <option value="camera">Video trích xuất Camera</option>
                    <option value="verifier_confirm">Xác minh trực tiếp Quản lý</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-gray-900 text-xs block">Người xác minh sự cố</label>
                  <input
                    type="text"
                    value={verifierName}
                    onChange={e => setVerifierName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 bg-white font-bold text-gray-800 outline-none text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-900 text-xs flex items-center">
                  Link Bằng Chứng Cloud (Google Drive / Video Camera / OneDrive)
                  <InfoTooltip text="Quản lý paste đường dẫn lưu video camera hoặc folder ảnh để CEO bấm mở xem trực tiếp 1-click." />
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={evidenceUrl}
                    onChange={e => setEvidenceUrl(e.target.value)}
                    placeholder="VD: https://drive.google.com/file/d/1A2b3C... (Link video camera hoặc folder ảnh)"
                    className="flex-1 px-4 py-2.5 rounded-2xl border border-gray-200 bg-white font-mono text-xs font-semibold text-gray-900 outline-none focus:border-primary"
                  />
                  {evidenceUrl.trim() && (
                    <a
                      href={evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-2xl bg-blue-50 border border-blue-200 text-primary font-bold hover:bg-blue-100 transition flex items-center gap-1 cursor-pointer text-xs whitespace-nowrap"
                    >
                      <ExternalLink size={14} /> Thử Link
                    </a>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-900 text-xs flex items-center">
                  Ghi chú bằng chứng &amp; Ghi chú xử lý
                  <InfoTooltip text="Ghi chú thêm cách đã xử lý (đã xin lỗi khách, đã đền bù, đã làm lại đơn...)" />
                </label>
                <textarea
                  rows={2.5}
                  value={evidenceNote}
                  onChange={e => setEvidenceNote(e.target.value)}
                  placeholder="Ghi chú bằng chứng & Đã xử lý (VD: Ảnh nhắn Zalo 14:20 + Video Camera mốc 14:15. Đã xin lỗi khách và hoàn tiền 15.000đ)"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white font-medium text-gray-800 outline-none text-xs"
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="font-bold text-gray-900 text-xs flex items-center">
                  Trạng thái phê duyệt đề xuất
                  <InfoTooltip text="Chỉ sự kiện ở trạng thái 'CEO duyệt' mới chính thức tính vào BSC hoặc thưởng cá nhân." />
                </label>
                <select
                  value={approvalStatus}
                  onChange={e => setApprovalStatus(e.target.value as BSCApprovalStatus)}
                  className="w-full px-4 py-3 rounded-2xl border border-indigo-200 bg-indigo-50/60 font-bold text-indigo-950 outline-none text-xs"
                >
                  <option value="proposed_manager">Quản Lý Đề Xuất – Chờ CEO Duyệt</option>
                  <option value="pending_proof">Chờ Xác Minh (Chưa đủ bằng chứng)</option>
                  <option value="pending_appeal">Chờ NV Giải Trình (Thời hạn 48h)</option>
                  <option value="draft">Bản Nháp (Chưa gửi)</option>
                </select>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between pt-5 border-t border-gray-100 flex-shrink-0">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((currentStep - 1) as 1 | 2 | 3 | 4 | 5)}
                  className="px-5 py-2.5 rounded-2xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <ChevronLeft size={16} /> Quay Lại
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition cursor-pointer text-xs"
              >
                Hủy
              </button>

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((currentStep + 1) as 1 | 2 | 3 | 4 | 5)}
                  className="px-6 py-2.5 rounded-2xl bg-primary text-white font-bold hover:bg-[#1D3E61] transition flex items-center gap-1.5 cursor-pointer shadow-xs text-xs"
                >
                  Tiếp Theo <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-7 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition flex items-center gap-2 cursor-pointer shadow-xs text-xs"
                >
                  <CheckCircle2 size={16} /> Hoàn Tất &amp; Gửi Ghi Nhận Sự Kiện
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
