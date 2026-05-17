'use client'

import { useState, useMemo } from 'react'
import {
  LEAVE_TYPES, LEAVE_TYPE_MAP,
  mockBlackoutDates, validateLeaveRequest, calculateBusinessDays,
} from '@/lib/mock-data-leave'
import type {
  LeaveType, LeaveRequest, LeaveQuota, LeaveValidationResult,
} from '@/lib/mock-data-leave'
import {
  getAffectedShifts, findAvailableReplacements,
  type AffectedShift, type ReplacementCandidate,
} from '@/lib/replacement-finder'
import { createReplacementRequest } from '@/lib/replacement-request'
import {
  X, Send, Upload, AlertTriangle, CheckCircle2, Info, Pencil, Plus,
  Sun, Sunset, Paperclip, Clock, Users, Star, MapPin, ChevronDown,
} from 'lucide-react'

interface LeaveRequestFormProps {
  quota: LeaveQuota
  existingRequests: LeaveRequest[]
  onSubmit: (request: Partial<LeaveRequest>) => void
  onClose: () => void
  initialData?: Partial<LeaveRequest>
  mode?: 'create' | 'edit'
}

export default function LeaveRequestForm({
  quota,
  existingRequests,
  onSubmit,
  onClose,
  initialData,
  mode = 'create',
}: LeaveRequestFormProps) {
  const [selectedType, setSelectedType] = useState<LeaveType>(initialData?.leave_type || 'annual')
  const [startDate, setStartDate] = useState(initialData?.start_date || '')
  const [endDate, setEndDate] = useState(initialData?.end_date || '')
  const [isHalfDay, setIsHalfDay] = useState(initialData?.isHalfDay || false)
  const [halfDayPeriod, setHalfDayPeriod] = useState<'morning' | 'afternoon'>(
    initialData?.halfDayPeriod || 'morning'
  )
  const [reason, setReason] = useState(initialData?.reason || '')
  const [replacementSelections, setReplacementSelections] = useState<Record<string, string>>({})

  // Calculate days
  const days = useMemo(() => {
    if (!startDate || !endDate) return 0
    if (isHalfDay) return 0.5
    return calculateBusinessDays(startDate, endDate)
  }, [startDate, endDate, isHalfDay])

  // Detect affected shifts
  const affectedShifts = useMemo<AffectedShift[]>(() => {
    if (!startDate) return []
    const end = isHalfDay ? startDate : endDate
    if (!end) return []
    return getAffectedShifts(quota.employee_id, startDate, end)
  }, [quota.employee_id, startDate, endDate, isHalfDay])

  // Get replacement candidates per shift
  const replacementOptions = useMemo(() => {
    const map: Record<string, ReplacementCandidate[]> = {}
    affectedShifts.forEach(shift => {
      const key = `${shift.date}-${shift.shiftPeriod}`
      map[key] = findAvailableReplacements(
        shift.date, shift.shiftPeriod, shift.storeId,
        shift.positionId, quota.employee_id,
      )
    })
    return map
  }, [affectedShifts, quota.employee_id])

  const hasConflict = affectedShifts.length > 0
  const allReplacementsSelected = hasConflict
    ? affectedShifts.every(s => replacementSelections[`${s.date}-${s.shiftPeriod}`])
    : true

  // Build partial request for validation
  const partialRequest = useMemo<Partial<LeaveRequest>>(() => ({
    employee_id: quota.employee_id,
    leave_type: selectedType,
    leave_type_label: LEAVE_TYPE_MAP[selectedType].name,
    start_date: startDate,
    end_date: isHalfDay ? startDate : endDate,
    days,
    isHalfDay,
    halfDayPeriod: isHalfDay ? halfDayPeriod : undefined,
    reason,
    hasScheduleConflict: hasConflict,
    conflictingShifts: affectedShifts.map(s => ({
      shiftId: s.scheduleId,
      date: s.date,
      time: `${s.startTime} - ${s.endTime}`,
      position: s.position,
    })),
  }), [quota.employee_id, selectedType, startDate, endDate, days, isHalfDay, halfDayPeriod, reason, hasConflict, affectedShifts])

  // Validate
  const validation = useMemo<LeaveValidationResult>(() => {
    if (!startDate) return { isValid: true, errors: [], warnings: [] }
    return validateLeaveRequest(partialRequest, quota, existingRequests, mockBlackoutDates)
  }, [partialRequest, quota, existingRequests, startDate])

  const typeQuota = quota.quotas[selectedType]
  const typeInfo = LEAVE_TYPE_MAP[selectedType]
  const todayStr = new Date().toISOString().split('T')[0]

  const canSubmit = startDate && (isHalfDay || endDate) && reason.trim().length > 0 && validation.isValid && allReplacementsSelected

  const handleSubmit = () => {
    if (!canSubmit) return

    const leaveId = `LR-${Date.now()}`
    const employee = { id: quota.employee_id, name: '' }

    // Create replacement requests for each affected shift
    affectedShifts.forEach(shift => {
      const key = `${shift.date}-${shift.shiftPeriod}`
      const selectedId = replacementSelections[key]
      if (selectedId) {
        const candidates = replacementOptions[key] || []
        const candidate = candidates.find(c => c.id === selectedId)
        createReplacementRequest({
          leave_request_id: leaveId,
          original_employee_id: quota.employee_id,
          original_employee_name: employee.name,
          replacement_employee_id: selectedId,
          replacement_employee_name: candidate?.name || '',
          shift_date: shift.date,
          shift_period: shift.shiftPeriod,
          shift_name: shift.shiftName,
          shift_time: `${shift.startTime} - ${shift.endTime}`,
          store_id: shift.storeId,
          store_name: shift.storeName,
          position: shift.position,
        })
      }
    })

    onSubmit({
      ...partialRequest,
      id: leaveId,
      status: hasConflict ? 'pending' : 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg max-h-[92vh] bg-white rounded-t-3xl sm:rounded-3xl overflow-y-auto shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">
            {mode === 'edit' ? <><Pencil size={14} className="inline" /> Sửa đơn</> : <><Plus size={14} className="inline" /> Tạo đơn xin nghỉ</>}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* ─── LEAVE TYPE SELECTOR ─── */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
              Loại nghỉ phép
            </label>
            <div className="grid grid-cols-4 gap-2">
              {LEAVE_TYPES.filter(t => t.type !== 'maternity').map(t => {
                const q = quota.quotas[t.type]
                const isSelected = selectedType === t.type
                const isExhausted = q.total > 0 && q.remaining <= 0

                return (
                  <button
                    key={t.type}
                    onClick={() => !isExhausted && setSelectedType(t.type)}
                    disabled={isExhausted}
                    className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-current shadow-sm scale-[1.02]'
                        : isExhausted
                        ? 'border-gray-100 opacity-40 cursor-not-allowed'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                    style={isSelected ? { borderColor: t.colorHex, background: t.colorHex + '08' } : undefined}
                  >
                    <span className="text-xl">{t.icon}</span>
                    <span className="text-xs font-medium text-gray-600 text-center leading-tight">
                      {t.name}
                    </span>
                    {q.total > 0 && (
                      <span
                        className="text-[9px] font-bold"
                        style={{ color: q.remaining <= 2 ? '#ef4444' : t.colorHex }}
                      >
                        {q.remaining} ngày
                      </span>
                    )}
                    {isExhausted && (
                      <span className="text-[8px] text-red-400 font-medium">Hết quota</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ─── DATE PICKER ─── */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
              Thời gian nghỉ
            </label>

            {/* Half-day toggle */}
            <label className="flex items-center gap-2 mb-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={isHalfDay}
                onChange={e => setIsHalfDay(e.target.checked)}
                className="w-4 h-4 rounded accent-primary-500"
              />
              <span className="text-xs text-gray-600 group-hover:text-gray-800 transition-colors">
                Nghỉ nửa ngày
              </span>
              {isHalfDay && (
                <div className="flex gap-1 ml-2">
                  {(['morning', 'afternoon'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setHalfDayPeriod(p)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                        halfDayPeriod === p
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {p === 'morning' ? <><Sun size={12} className="inline" /> Sáng</> : <><Sunset size={12} className="inline" /> Chiều</>}
                    </button>
                  ))}
                </div>
              )}
            </label>

            <div className={`grid ${isHalfDay ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  {isHalfDay ? 'Ngày nghỉ' : 'Từ ngày'}
                </label>
                <input
                  type="date"
                  value={startDate}
                  min={todayStr}
                  onChange={e => {
                    setStartDate(e.target.value)
                    if (isHalfDay || !endDate || e.target.value > endDate) setEndDate(e.target.value)
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
                />
              </div>
              {!isHalfDay && (
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Đến ngày</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || todayStr}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
                  />
                </div>
              )}
            </div>

            {/* Days summary */}
            {startDate && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="text-gray-500">→</span>
                <span className="font-semibold" style={{ color: typeInfo.colorHex }}>
                  {days} {days === 0.5 ? 'nửa ngày' : 'ngày làm việc'}
                </span>
                {typeQuota.total > 0 && (
                  <span className="text-gray-400">
                    (còn {typeQuota.remaining} ngày {typeInfo.name.toLowerCase()})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ─── REASON ─── */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
              Lý do xin nghỉ
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Nhập lý do chi tiết..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 resize-none placeholder-gray-300 focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
            />
          </div>

          {/* ─── FILE ATTACHMENT (mock) ─── */}
          {typeInfo.requiresDocument && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                <Paperclip size={12} className="inline mr-1" /> Giấy tờ đính kèm
                {typeInfo.requiresDocumentAfterDays > 0
                  ? ` (bắt buộc nếu nghỉ > ${typeInfo.requiresDocumentAfterDays} ngày)`
                  : ' (bắt buộc)'}
              </label>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 text-xs text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-all">
                <Upload size={16} />
                Chọn file (ảnh, PDF)
              </button>
            </div>
          )}

          {/* ─── AFFECTED SHIFTS & REPLACEMENT SELECTION ─── */}
          {hasConflict && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-amber-500" />
                <span className="text-xs font-semibold text-amber-700">
                  Có {affectedShifts.length} ca làm bị ảnh hưởng
                </span>
              </div>
              <div className="space-y-3">
                {affectedShifts.map(shift => {
                  const key = `${shift.date}-${shift.shiftPeriod}`
                  const candidates = replacementOptions[key] || []
                  const selected = replacementSelections[key]
                  const selectedCandidate = candidates.find(c => c.id === selected)
                  const d = new Date(shift.date)
                  const dayNames = ['CN','T2','T3','T4','T5','T6','T7']
                  const dayLabel = `${dayNames[d.getDay()]} ${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}`

                  return (
                    <div key={key} className="bg-amber-50/60 border border-amber-100 rounded-xl p-3 space-y-2.5">
                      {/* Shift info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock size={13} className="text-amber-500" />
                          <span className="text-xs font-bold text-gray-700">
                            {dayLabel} — {shift.shiftName}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {shift.startTime} - {shift.endTime}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        <MapPin size={10} />
                        <span>{shift.storeName}</span>
                        <span>•</span>
                        <span>{shift.position}</span>
                      </div>

                      {/* Replacement picker */}
                      <div>
                        <label className="text-[10px] font-medium text-gray-500 mb-1 flex items-center gap-1">
                          <Users size={10} />
                          Chọn người thay ({candidates.length} người rảnh)
                        </label>
                        <div className="relative">
                          <select
                            value={selected || ''}
                            onChange={e => {
                              setReplacementSelections(prev => ({ ...prev, [key]: e.target.value }))
                            }}
                            className={`w-full px-3 py-2 rounded-lg border text-xs appearance-none bg-white pr-8 ${
                              selected
                                ? 'border-emerald-300 text-gray-700'
                                : 'border-amber-200 text-gray-400'
                            } focus:ring-2 focus:ring-primary-200 focus:border-primary-400`}
                          >
                            <option value="">— Chọn người thay —</option>
                            {candidates.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.isRegisteredAvailable ? '⭐ ' : ''}
                                {c.name} ({c.position})
                                {c.sameStore ? '' : ` — ${c.storeId}`}
                                {c.isRegisteredAvailable ? ' — Đã đăng ký rảnh' : ''}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Top suggestion */}
                      {!selected && candidates.length > 0 && candidates[0].isRegisteredAvailable && (
                        <button
                          type="button"
                          onClick={() => setReplacementSelections(prev => ({ ...prev, [key]: candidates[0].id }))}
                          className="flex items-center gap-1.5 text-[10px] text-primary-600 font-medium hover:underline"
                        >
                          <Star size={10} className="text-amber-400 fill-amber-400" />
                          Gợi ý: {candidates[0].name} (đăng ký rảnh)
                        </button>
                      )}

                      {/* Selected confirmation */}
                      {selectedCandidate && (
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-medium">
                          <CheckCircle2 size={10} />
                          {selectedCandidate.name} sẽ thay ca này
                          {selectedCandidate.isRegisteredAvailable && (
                            <span className="text-amber-500 flex items-center gap-0.5">
                              <Star size={8} className="fill-amber-400" /> Rảnh
                            </span>
                          )}
                        </div>
                      )}

                      {/* No candidates */}
                      {candidates.length === 0 && (
                        <div className="text-[10px] text-red-500 italic">
                          Không tìm thấy người thay — quản lý sẽ tự sắp xếp
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Overall status */}
              {!allReplacementsSelected && (
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-600">
                  <Info size={10} />
                  Vui lòng chọn người thay cho tất cả ca bị ảnh hưởng
                </div>
              )}
            </div>
          )}

          {/* ─── VALIDATION RESULTS ─── */}
          {startDate && (validation.errors.length > 0 || validation.warnings.length > 0) && (
            <div className="space-y-2">
              {validation.errors.map((err, i) => (
                <div key={`e-${i}`} className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100">
                  <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-red-700">{err.message}</span>
                </div>
              ))}
              {validation.warnings.map((warn, i) => (
                <div key={`w-${i}`} className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-100">
                  <Info size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-amber-700">{warn.message}</span>
                    {warn.suggestion && (
                      <div className="text-xs text-amber-500 mt-0.5">{warn.suggestion}</div>
                    )}
                  </div>
                </div>
              ))}

              {validation.isValid && validation.warnings.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span className="text-xs text-emerald-700">Đơn hợp lệ — có thể gửi</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer: actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-[2] py-3 rounded-xl text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Send size={16} />
            {mode === 'edit' ? 'Cập nhật' : hasConflict ? 'Gửi đơn + Đổi ca' : 'Gửi đơn'}
          </button>
        </div>
      </div>
    </div>
  )
}
