'use client'

import { useState, useMemo, useCallback } from 'react'
import { format, addDays, startOfWeek } from 'date-fns'
import { vi } from 'date-fns/locale'
import { CalendarDays, MailOpen, Save, User, Clock, Shirt } from 'lucide-react'

import DateScroller from './DateScroller'
import MobileShiftCard from './MobileShiftCard'
import MobileSummaryBar from './MobileSummaryBar'
import MobileWeekOverview from './MobileWeekOverview'
import MobileBottomSheet from '@/components/ui/MobileBottomSheet'

import type { ScheduleResult, ScheduleShift } from '@/lib/mock-data-smart-schedule'

interface MobileScheduleViewProps {
  schedule: ScheduleResult
  onEditShift?: (shift: ScheduleShift) => void
  onDeleteShift?: (shiftId: string) => void
  onAddShift?: () => void
  onPublish?: () => void
}

export default function MobileScheduleView({
  schedule,
  onEditShift,
  onDeleteShift,
  onAddShift,
  onPublish,
}: MobileScheduleViewProps) {
  const weekStart = useMemo(
    () => startOfWeek(new Date(schedule.weekStart), { weekStartsOn: 1 }),
    [schedule.weekStart]
  )

  const [selectedDate, setSelectedDate] = useState(weekStart)
  const [currentWeekStart, setCurrentWeekStart] = useState(weekStart)
  const [showEditSheet, setShowEditSheet] = useState(false)
  const [editingShift, setEditingShift] = useState<ScheduleShift | null>(null)

  // Shifts per day map
  const shiftsPerDay = useMemo(() => {
    const map: Record<string, number> = {}
    schedule.shifts.forEach(s => {
      map[s.date] = (map[s.date] || 0) + 1
    })
    return map
  }, [schedule.shifts])

  // Shifts for selected date
  const dayShifts = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    return schedule.shifts.filter(s => s.date === dateStr)
  }, [schedule.shifts, selectedDate])

  // Day totals
  const dayTotals = useMemo(() => {
    const totalHours = dayShifts.reduce((sum, s) => {
      const [sh, sm] = s.startTime.split(':').map(Number)
      const [eh, em] = s.endTime.split(':').map(Number)
      return sum + ((eh * 60 + em) - (sh * 60 + sm)) / 60
    }, 0)
    // Rough cost estimate
    const estimatedCost = dayShifts.reduce((sum, s) => {
      const hours = (() => {
        const [sh2, sm2] = s.startTime.split(':').map(Number)
        const [eh2, em2] = s.endTime.split(':').map(Number)
        return ((eh2 * 60 + em2) - (sh2 * 60 + sm2)) / 60
      })()
      return sum + hours * 35000
    }, 0)
    return { totalShifts: dayShifts.length, totalHours, estimatedCost }
  }, [dayShifts])

  const handleWeekChange = useCallback((direction: 'prev' | 'next') => {
    setCurrentWeekStart(prev => addDays(prev, direction === 'next' ? 7 : -7))
  }, [])

  const handleEditShift = useCallback((shift: ScheduleShift) => {
    if (!onEditShift) return
    setEditingShift(shift)
    setShowEditSheet(true)
  }, [onEditShift])

  const handleDeleteShift = useCallback((shiftId: string) => {
    if (!onDeleteShift) return
    if (confirm('Bạn có chắc muốn xóa ca này?')) {
      onDeleteShift(shiftId)
    }
  }, [onDeleteShift])

  return (
    <div className="pb-20">
      {/* Week Overview (top card) */}
      <div className="px-4 pt-4 pb-2">
        <MobileWeekOverview
          schedule={schedule}
          weekStart={currentWeekStart}
          onSelectDay={setSelectedDate}
          onPublish={onPublish}
        />
      </div>

      {/* Date Scroller */}
      <DateScroller
        weekStart={currentWeekStart}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        shiftsPerDay={shiftsPerDay}
        onWeekChange={handleWeekChange}
      />

      {/* Day Header */}
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
          <CalendarDays size={14} className="text-gray-400" /> {format(selectedDate, "EEEE, dd/MM/yyyy", { locale: vi })}
        </h3>
        <p className="text-xs text-gray-400">{dayShifts.length} ca làm việc</p>
      </div>

      {/* Shift List */}
      <div className="px-4 space-y-2.5">
        {dayShifts.length === 0 && (
          <div className="text-center py-12">
            <MailOpen size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500 font-medium">Không có ca nào</p>
            <p className="text-xs text-gray-400 mt-1">Nhấn &quot;Thêm ca&quot; để bắt đầu</p>
          </div>
        )}

        {dayShifts.map(shift => (
          <MobileShiftCard
            key={shift.id}
            shift={shift}
            onEdit={() => handleEditShift(shift)}
            onDelete={() => handleDeleteShift(shift.id)}
          />
        ))}
      </div>

      {/* Sticky Summary Bar */}
      <MobileSummaryBar
        totalShifts={dayTotals.totalShifts}
        totalHours={dayTotals.totalHours}
        estimatedCost={dayTotals.estimatedCost}
        onAddShift={onAddShift ? () => onAddShift() : undefined}
      />

      {/* Edit Bottom Sheet */}
      <MobileBottomSheet
        isOpen={showEditSheet}
        onClose={() => { setShowEditSheet(false); setEditingShift(null) }}
        title="Sửa ca làm việc"
        snapPoints={[0.55, 0.85]}
        showFooter={Boolean(onEditShift)}
        footerContent={
          <div className="flex gap-2">
            <button
              onClick={() => { setShowEditSheet(false); setEditingShift(null) }}
              className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-primary-50 rounded-xl active:bg-gray-200"
            >
              Hủy
            </button>
            <button
              onClick={() => {
                if (editingShift && onEditShift) onEditShift(editingShift)
                setShowEditSheet(false)
                setEditingShift(null)
              }}
              className="flex-1 py-2.5 text-sm font-bold text-white bg-primary rounded-xl active:scale-[0.98]"
            >
              <Save size={14} className="inline mr-1" /> Lưu
            </button>
          </div>
        }
      >
        {editingShift && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><User size={12} /> Nhân viên</label>
              <div className="w-full p-3 bg-vanilla-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700">
                {editingShift.employeeName}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Clock size={12} /> Bắt đầu</label>
                <input
                  type="time"
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm"
                  defaultValue={editingShift.startTime}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Clock size={12} /> Kết thúc</label>
                <input
                  type="time"
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm"
                  defaultValue={editingShift.endTime}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Shirt size={12} /> Vị trí</label>
              <select
                className="w-full p-3 border border-gray-200 rounded-xl text-sm"
                defaultValue={editingShift.position}
              >
                <option value="barista">Pha chế</option>
                <option value="cashier">Thu ngân</option>
                <option value="support">Hỗ trợ</option>
                <option value="store_manager">Quản lý</option>
              </select>
            </div>
          </div>
        )}
      </MobileBottomSheet>
    </div>
  )
}
