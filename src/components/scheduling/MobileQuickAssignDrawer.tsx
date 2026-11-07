'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Zap, X, Calendar, Clock, User, Check, AlertCircle, CheckCircle2, ChevronRight, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { addSchedule, mockPositions, mockStores } from '@/lib/mock-data'

interface Props {
  storeId?: string | null
  weekStart?: string | null
  onSuccess?: () => void
}

const SHIFT_OPTIONS = [
  { id: 'shift-001', name: 'Ca Sáng', time: '08:30 - 12:00', hours: 3.5, color: 'border-amber-400 bg-amber-50 text-amber-900' },
  { id: 'shift-002', name: 'Ca Trưa', time: '12:00 - 17:00', hours: 5.0, color: 'border-blue-400 bg-blue-50 text-blue-900' },
  { id: 'shift-003', name: 'Ca Tối', time: '17:00 - 22:00', hours: 5.0, color: 'border-indigo-400 bg-indigo-50 text-indigo-900' },
]

const DAY_NAMES = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật']

export default function MobileQuickAssignDrawer({ storeId = 'store-001', weekStart, onSuccess }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDayOffset, setSelectedDayOffset] = useState(0) // 0: Thứ 2 ... 6: Chủ nhật
  const [selectedShiftId, setSelectedShiftId] = useState('shift-001')
  const [selectedEmpId, setSelectedEmpId] = useState('')
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Tính 7 ngày trong tuần
  const weekDays = useMemo(() => {
    let monday: Date
    if (weekStart) {
      monday = new Date(weekStart)
    } else {
      const today = new Date()
      const day = today.getDay()
      const diff = today.getDate() - day + (day === 0 ? -6 : 1)
      monday = new Date(today.setDate(diff))
    }

    return DAY_NAMES.map((name, idx) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + idx)
      const dateStr = d.toISOString().split('T')[0]
      const displayDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
      return { name, dateStr, displayDate }
    })
  }, [weekStart])

  // Lấy danh sách nhân viên từ Server API
  useEffect(() => {
    async function loadStaff() {
      try {
        setLoading(true)
        const targetStore = storeId || 'store-001'
        const res = await fetch(`/api/employees?store_id=${targetStore}`)
        const json = await res.json()
        if (json.success && json.data) {
          setEmployees(json.data)
          if (json.data.length > 0 && !selectedEmpId) {
            setSelectedEmpId(json.data[0].id)
          }
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false)
      }
    }
    if (isOpen) {
      loadStaff()
    }
  }, [isOpen, storeId])

  // Xử lý gán ca nhanh (1 chạm không cần kéo thả)
  const handleAssign = async () => {
    if (!selectedEmpId) return

    const dayObj = weekDays[selectedDayOffset]
    const shiftObj = SHIFT_OPTIONS.find((s) => s.id === selectedShiftId)
    const empObj = employees.find((e) => e.id === selectedEmpId)

    if (!dayObj || !shiftObj || !empObj) return

    try {
      setSubmitting(true)

      // 1. Lưu vào Server API
      await fetch('/api/shifts/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: empObj.id,
          employee_name: empObj.full_name,
          store_id: storeId || 'store-001',
          date: dayObj.dateStr,
          shift_id: shiftObj.id,
          shift_name: `${shiftObj.name} (${shiftObj.time})`,
          position_id: empObj.position_id || 'pos-001',
          notes: '[Mobile 1-Tap] Gán nhanh trên điện thoại',
        }),
      })

      // 2. Lưu vào state bộ nhớ client
      addSchedule(
        storeId || 'store-001',
        empObj.id,
        shiftObj.id,
        dayObj.dateStr,
        '[Mobile 1-Tap] Gán nhanh trên điện thoại',
        'published',
        empObj.position_id || 'pos-001'
      )

      setToast(`Đã gán ${empObj.full_name} vào ${shiftObj.name} ngày ${dayObj.displayDate} thành công!`)
      setTimeout(() => {
        setToast(null)
        setIsOpen(false)
        if (onSuccess) onSuccess()
      }, 1500)
    } catch {
      setToast('Lỗi khi gán ca. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Nút bấm nổi cố định dành riêng cho điện thoại */}
      <div className="md:hidden fixed bottom-20 right-4 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-xs rounded-full shadow-xl shadow-emerald-700/30 active:scale-95 transition-all border border-emerald-400/40"
        >
          <Zap size={16} className="animate-bounce" />
          <span>Gán ca nhanh</span>
        </button>
      </div>

      {/* Modal / Bottom Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-slide-up">
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Zap size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900 font-['Poppins']">Gán Ca Nhanh Mobile</h2>
                  <p className="text-[11px] text-gray-500">Thao tác 1 chạm không lo trượt tay khi kéo thả</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-200/80 text-gray-600 flex items-center justify-center hover:bg-gray-300 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1">
              {/* Bước 1: Chọn ngày trong tuần */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar size={14} className="text-emerald-600" />
                  <span>1. Chọn Ngày Làm Việc:</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
                  {weekDays.map((day, idx) => {
                    const isSelected = selectedDayOffset === idx
                    return (
                      <button
                        key={day.dateStr}
                        type="button"
                        onClick={() => setSelectedDayOffset(idx)}
                        className={`p-2 rounded-xl text-center border transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-bold'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="text-[11px] leading-tight">{day.name}</div>
                        <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-gray-400'}`}>
                          {day.displayDate}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Bước 2: Chọn khung ca chuẩn */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock size={14} className="text-emerald-600" />
                  <span>2. Chọn Khung Ca Homies:</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {SHIFT_OPTIONS.map((shift) => {
                    const isSelected = selectedShiftId === shift.id
                    return (
                      <button
                        key={shift.id}
                        type="button"
                        onClick={() => setSelectedShiftId(shift.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-3 h-3 rounded-full border ${isSelected ? 'bg-emerald-600 border-emerald-600' : 'border-gray-400'}`} />
                          <div>
                            <div className="font-bold text-xs text-gray-900">{shift.name}</div>
                            <div className="text-[11px] text-gray-500 font-mono mt-0.5">{shift.time} ({shift.hours}h)</div>
                          </div>
                        </div>
                        <Badge variant="neutral" className="text-[10px]">{shift.hours} giờ công</Badge>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Bước 3: Chọn nhân viên */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User size={14} className="text-emerald-600" />
                  <span>3. Chọn Nhân Sự Gán Ca:</span>
                </label>
                {loading ? (
                  <div className="py-4 text-center text-xs text-gray-400">Đang tải danh sách nhân sự...</div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {employees.map((emp) => {
                      const isSelected = selectedEmpId === emp.id
                      return (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => setSelectedEmpId(emp.id)}
                          className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                            isSelected
                              ? 'bg-emerald-50/80 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                              : 'bg-gray-50/80 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                              {emp.full_name?.charAt(0) || 'N'}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-gray-900">{emp.full_name}</div>
                              <div className="text-[10px] text-gray-500">
                                {emp.employee_code} • {emp.department_name || 'Nhân viên'}
                              </div>
                            </div>
                          </div>
                          {isSelected && <Check size={16} className="text-emerald-600 shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer CTA */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-xs h-11 px-4"
              >
                Hủy
              </Button>

              <Button
                variant="primary"
                disabled={submitting || !selectedEmpId}
                onClick={handleAssign}
                className="flex-1 h-11 text-xs font-bold rounded-xl shadow-md bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span>Đang gán ca...</span>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Xác nhận Gán Ca 1-Chạm</span>
                  </>
                )}
              </Button>
            </div>

            {/* Toast thông báo */}
            {toast && (
              <div className="p-3 bg-emerald-700 text-white text-xs text-center font-semibold flex items-center justify-center gap-2 animate-fade-in">
                <CheckCircle2 size={16} />
                <span>{toast}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
