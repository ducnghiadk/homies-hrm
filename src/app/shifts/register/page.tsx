'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth-store'
import { mockStores, getStoreById, mockPositions } from '@/lib/mock-data'
import { ShiftRegistrationService } from '@/lib/services/scheduling/shift-registration-service'
import {
  Calendar,
  Clock,
  Check,
  ChevronLeft,
  ChevronRight,
  Store,
  Briefcase,
  AlertCircle,
  Send,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Unlock
} from 'lucide-react'

// Danh sách 3 ca làm việc chuẩn Homies Milk Tea
const SHIFTS = [
  { id: 'shift-001', name: 'Ca Sáng', time: '08:30 - 12:00', hours: 3.5 },
  { id: 'shift-002', name: 'Ca Trưa', time: '12:00 - 17:00', hours: 5.0 },
  { id: 'shift-003', name: 'Ca Tối', time: '17:00 - 22:00', hours: 5.0 },
]

// Vị trí mong muốn cơ bản cho Part-time
const DESIRED_POSITIONS = [
  { id: 'pos-001', name: 'Pha chế (Barista)' },
  { id: 'pos-002', name: 'Thu ngân (Cashier)' },
]

const DAY_NAMES = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật']

// Helper tính thứ 2 của một ngày
function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(date.setDate(diff))
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function formatDisplayDate(dateStr: string): string {
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`
  }
  return dateStr
}

export default function ShiftRegisterPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  // Mặc định chọn tuần sau (Tuần kế tiếp tính từ hôm nay)
  const [weekOffset, setWeekOffset] = useState<number>(1) // 0: tuần này, 1: tuần tới
  const [selectedStoreId, setSelectedStoreId] = useState<string>('store-001')
  const [desiredPositionId, setDesiredPositionId] = useState<string>('pos-001')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  // Cấu trúc selections: Record<date, Set<shift_id>>
  const [selectedShifts, setSelectedShifts] = useState<Record<string, string[]>>({})

  // Khởi tạo store ban đầu từ user
  useEffect(() => {
    if (user?.store_id) {
      setSelectedStoreId(user.store_id)
    }
    if (user?.position_id === 'pos-002') {
      setDesiredPositionId('pos-002')
    }
  }, [user])

  // Tính 7 ngày của tuần được chọn
  const { weekStartStr, weekDays } = useMemo(() => {
    const today = new Date()
    const baseMonday = getMonday(today)
    baseMonday.setDate(baseMonday.getDate() + weekOffset * 7)

    const days: { dateStr: string; dayName: string; displayDate: string }[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseMonday)
      d.setDate(baseMonday.getDate() + i)
      const dateStr = formatDate(d)
      days.push({
        dateStr,
        dayName: DAY_NAMES[i],
        displayDate: formatDisplayDate(dateStr),
      })
    }

    return {
      weekStartStr: formatDate(baseMonday),
      weekDays: days,
    }
  }, [weekOffset])

  // Tự động kiểm tra hạn chốt 22:00 tối Thứ 6 hàng tuần
  const { isLocked, deadlineText } = useMemo(() => {
    // Quản lý hoặc CEO luôn có thể mở khóa để chỉnh sửa
    const isManagerOrCeo = user?.role === 'ceo' || user?.role === 'store_manager' || user?.role === 'hr_admin'

    const now = new Date()
    const targetMonday = new Date(weekStartStr)
    const deadlineFriday = new Date(targetMonday)
    deadlineFriday.setDate(deadlineFriday.getDate() - 3) // Thứ 6 trước tuần làm
    deadlineFriday.setHours(22, 0, 0, 0)

    const locked = !isManagerOrCeo && now.getTime() > deadlineFriday.getTime()
    const deadlineText = `22:00 Thứ 6 (${deadlineFriday.getDate().toString().padStart(2, '0')}/${(deadlineFriday.getMonth() + 1).toString().padStart(2, '0')})`

    return { isLocked: locked, deadlineText }
  }, [weekStartStr, user?.role])

  // Lọc danh sách store mà nhân viên này được phép đăng ký (quán chính + allowed_store_ids)
  const availableStores = useMemo(() => {
    if (!user) return mockStores
    return mockStores.filter(s => {
      if (s.id === user.store_id) return true
      if (user.secondary_store_ids?.includes(s.id)) return true
      return true // Cho phép linh hoạt chọn cả 2 cơ sở Homies
    })
  }, [user])

  // Toggle chọn ca
  const toggleShift = (dateStr: string, shiftId: string) => {
    if (isLocked) return
    setSelectedShifts(prev => {
      const current = prev[dateStr] || []
      const exists = current.includes(shiftId)
      const updated = exists ? current.filter(id => id !== shiftId) : [...current, shiftId]
      return {
        ...prev,
        [dateStr]: updated,
      }
    })
  }

  // Chọn nhanh: Cả ngày (3 ca)
  const selectAllDay = (dateStr: string) => {
    setSelectedShifts(prev => ({
      ...prev,
      [dateStr]: ['shift-001', 'shift-002', 'shift-003'],
    }))
  }

  // Chọn nhanh: Nghỉ ngày này (0 ca)
  const clearDay = (dateStr: string) => {
    setSelectedShifts(prev => ({
      ...prev,
      [dateStr]: [],
    }))
  }

  // Tổng số ca đã chọn
  const totalSelectedShiftsCount = useMemo(() => {
    return Object.values(selectedShifts).reduce((acc, shifts) => acc + shifts.length, 0)
  }, [selectedShifts])

  // Xử lý gửi đăng ký
  const handleSubmit = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để đăng ký ca làm việc!')
      return
    }

    if (totalSelectedShiftsCount === 0) {
      alert('Bạn chưa chọn ca làm việc nào. Vui lòng chọn ít nhất 1 ca rảnh trong tuần!')
      return
    }

    setIsSubmitting(true)

    // Tạo mảng đăng ký
    const items: { date: string; shiftId: string; positionId: string; notes?: string }[] = []
    Object.entries(selectedShifts).forEach(([date, shiftIds]) => {
      shiftIds.forEach(shiftId => {
        items.push({
          date,
          shiftId,
          positionId: desiredPositionId,
          notes: notes.trim() || undefined,
        })
      })
    })

    try {
      await ShiftRegistrationService.submitRegistrationsAsync(
        user.id,
        selectedStoreId,
        weekStartStr,
        items
      )

      setSuccessToast(`Gửi đăng ký ${items.length} ca rảnh thành công! Quản lý sẽ sớm xét duyệt vào lịch tuần.`)
      setTimeout(() => {
        router.push('/my-schedule')
      }, 1600)
    } catch {
      alert('Có lỗi xảy ra khi gửi đăng ký. Vui lòng thử lại!')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-[#FFF8E8] pb-28">
        {/* Header di động */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-xl mx-auto px-4 py-3.5 flex items-center justify-between">
            <Link
              href="/my-schedule"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2F6FA8] hover:text-[#1D3E61] transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Lịch của tôi</span>
            </Link>
            <h1 className="text-sm font-bold text-[#001D3D] text-center">
              Đăng Ký Ca Làm Việc
            </h1>
            <div className="w-12 text-right">
              <span className="text-[11px] font-mono tabular-nums font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#2F6FA8]">
                {totalSelectedShiftsCount} ca
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 pt-4 space-y-4">
          {/* Banner hướng dẫn thân thiện */}
          <div className="bg-gradient-to-r from-blue-50/80 to-amber-50/60 rounded-2xl p-4 border border-blue-100/60 shadow-xs flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#2F6FA8] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles size={16} />
            </div>
            <div className="text-xs text-gray-700 leading-relaxed">
              <p className="font-bold text-[#001D3D] text-sm mb-0.5">
                Đăng ký ca rảnh tuần tới
              </p>
              <p className="text-gray-600">
                Nhân viên vui lòng chọn các ca rảnh trước <strong>22:00 tối Thứ 6</strong>. Hệ thống sẽ tự động khóa để Quản lý chốt lịch vào Thứ 7.
              </p>
            </div>
          </div>

          {/* Banner thông báo đã khóa hạn chốt 22h00 Thứ 6 */}
          {isLocked && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200 shadow-xs flex items-start gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Lock size={16} />
              </div>
              <div className="text-xs text-amber-900 leading-relaxed">
                <p className="font-bold text-sm mb-0.5 text-amber-950">
                  Đã chốt hạn đăng ký ca tuần ({deadlineText})
                </p>
                <p className="text-amber-800">
                  Form đăng ký ca rảnh đã <strong>tự động khóa lúc 22h00 tối Thứ 6</strong> để Quản lý chốt lịch Thứ 7. Nếu cần đăng ký bổ sung gấp, vui lòng liên hệ trực tiếp Quản lý cửa hàng.
                </p>
              </div>
            </div>
          )}

          {/* Chọn tuần và Chi nhánh */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3.5">
            {/* Bộ chuyển đổi Tuần */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-[#2F6FA8]" />
                <span className="text-xs font-bold text-gray-800">Chọn tuần làm:</span>
              </div>
              <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setWeekOffset(0)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    weekOffset === 0
                      ? 'bg-white text-[#2F6FA8] shadow-xs font-bold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Tuần này
                </button>
                <button
                  type="button"
                  onClick={() => setWeekOffset(1)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    weekOffset === 1
                      ? 'bg-[#2F6FA8] text-white shadow-xs font-bold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Tuần tới
                </button>
              </div>
            </div>

            {/* Chọn Cơ sở */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Store size={14} className="text-[#2F6FA8]" />
                <span>Chi nhánh đăng ký làm việc:</span>
              </label>
              <select
                value={selectedStoreId}
                onChange={e => setSelectedStoreId(e.target.value)}
                className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 focus:outline-none focus:border-[#2F6FA8] focus:bg-white transition-all"
              >
                {availableStores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name} ({store.address})
                  </option>
                ))}
              </select>
            </div>

            {/* Chọn Vị trí mong muốn */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Briefcase size={14} className="text-[#2F6FA8]" />
                <span>Vị trí ưu tiên đảm nhiệm:</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DESIRED_POSITIONS.map(pos => {
                  const isSelected = desiredPositionId === pos.id
                  return (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => setDesiredPositionId(pos.id)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        isSelected
                          ? 'border-[#2F6FA8] bg-blue-50/70 text-[#2F6FA8] shadow-2xs'
                          : 'border-gray-200 bg-gray-50/50 text-gray-600 hover:bg-gray-100/60'
                      }`}
                    >
                      {isSelected && <Check size={14} />}
                      <span>{pos.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Lưới 7 ngày đăng ký ca */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                Lịch 7 ngày ({weekDays[0].displayDate} - {weekDays[6].displayDate})
              </span>
              <span className="text-[11px] text-gray-500">Chạm để chọn ca</span>
            </div>

            {weekDays.map(day => {
              const dayShifts = selectedShifts[day.dateStr] || []
              const hasSelected = dayShifts.length > 0

              return (
                <div
                  key={day.dateStr}
                  className={`bg-white rounded-2xl p-3.5 border transition-all shadow-xs space-y-2.5 ${
                    hasSelected ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-100'
                  }`}
                >
                  {/* Tiêu đề ngày */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#001D3D] bg-gray-100 px-2 py-0.5 rounded-md">
                        {day.dayName}
                      </span>
                      <span className="text-xs font-mono font-medium text-gray-500">
                        {day.displayDate}
                      </span>
                      {hasSelected && (
                        <span className="text-[10px] font-bold text-[#1E9E57] bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                          {dayShifts.length} ca đã chọn
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => selectAllDay(day.dateStr)}
                        className="text-gray-500 hover:text-[#2F6FA8] font-medium px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors"
                      >
                        Cả ngày
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={() => clearDay(day.dateStr)}
                        className="text-gray-400 hover:text-rose-600 font-medium px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors"
                      >
                        Nghỉ
                      </button>
                    </div>
                  </div>

                  {/* 3 nút bấm nhanh cho 3 ca */}
                  <div className="grid grid-cols-3 gap-2 pt-0.5">
                    {SHIFTS.map(shift => {
                      const isChosen = dayShifts.includes(shift.id)
                      return (
                        <button
                          key={shift.id}
                          type="button"
                          onClick={() => toggleShift(day.dateStr, shift.id)}
                          className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 active:scale-95 cursor-pointer ${
                            isChosen
                              ? 'bg-gradient-to-b from-[#2F6FA8] to-[#1D3E61] text-white border-[#2F6FA8] shadow-xs'
                              : 'bg-gray-50/70 border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            {isChosen && <Check size={12} className="text-white" />}
                            <span className="text-xs font-bold leading-tight">{shift.name}</span>
                          </div>
                          <span
                            className={`text-[10px] font-mono tabular-nums leading-none ${
                              isChosen ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
                            {shift.time}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Ghi chú thêm */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <AlertCircle size={14} className="text-[#D97706]" />
              <span>Ghi chú cho Trưởng ca / Quản lý (Tùy chọn):</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="VD: Em bận học sáng T3, có thể tăng ca tối T5..."
              className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#2F6FA8] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Thanh cố định ở đáy màn hình di động (Sticky CTA) */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-4 z-40 shadow-lg">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] text-gray-500 font-medium">Tổng ca đăng ký</p>
              <p className="text-sm font-extrabold text-[#001D3D] font-mono tabular-nums">
                {totalSelectedShiftsCount} ca rảnh
              </p>
            </div>

            <button
              type="button"
              disabled={isSubmitting || totalSelectedShiftsCount === 0 || isLocked}
              onClick={handleSubmit}
              className={`flex-1 max-w-[240px] py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all ${
                totalSelectedShiftsCount > 0 && !isSubmitting && !isLocked
                  ? 'bg-[#2F6FA8] hover:bg-[#1D3E61] text-white active:scale-98 cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLocked ? (
                <>
                  <Lock size={15} />
                  <span>Đã chốt hạn Thứ 6</span>
                </>
              ) : isSubmitting ? (
                <span>Đang gửi...</span>
              ) : (
                <>
                  <Send size={15} />
                  <span>Gửi Đăng Ký Lịch Tuần</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Toast thông báo thành công */}
        {successToast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#1E9E57] text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2.5 max-w-sm text-center">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{successToast}</span>
          </div>
        )}
      </div>
    </AppShell>
  )
}
