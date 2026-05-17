'use client'

import { format, addDays } from 'date-fns'
import { AlertTriangle, Users, Banknote, Share, CalendarDays } from 'lucide-react'
import type { ScheduleResult } from '@/lib/mock-data-smart-schedule'

interface MobileWeekOverviewProps {
  schedule: ScheduleResult
  weekStart: Date
  onSelectDay: (date: Date) => void
  onPublish?: () => void
}

const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

export default function MobileWeekOverview({
  schedule,
  weekStart,
  onSelectDay,
  onPublish,
}: MobileWeekOverviewProps) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayShifts = schedule.shifts.filter(s => s.date === dateStr)
    const hasWarning = schedule.warnings.some(w =>
      w.affectedShifts?.some(sid =>
        dayShifts.some(s => s.id === sid)
      )
    )
    return { date, dateStr, shiftCount: dayShifts.length, hasWarning }
  })

  const maxShifts = Math.max(...days.map(d => d.shiftCount), 1)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-800">
          <CalendarDays size={14} className="text-gray-400 inline mr-1" />
          {format(weekStart, 'dd/MM')} — {format(addDays(weekStart, 6), 'dd/MM')}
        </h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          schedule.status === 'published'
            ? 'bg-green-100 text-green-700'
            : 'bg-amber-100 text-amber-700'
        }`}>
          {schedule.status === 'published' ? 'Đã xuất bản' : 'Nháp'}
        </span>
      </div>

      {/* Day grid with bar chart */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {days.map((day, i) => (
          <button
            key={day.dateStr}
            onClick={() => onSelectDay(day.date)}
            className="flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <span className="text-xs text-gray-400 font-medium">{dayLabels[i]}</span>

            {/* Mini bar */}
            <div className="w-full h-8 flex items-end justify-center">
              <div
                className={`w-4 rounded-t transition-all ${
                  day.hasWarning ? 'bg-red-400' : 'bg-primary/60'
                }`}
                style={{ height: `${(day.shiftCount / maxShifts) * 100}%`, minHeight: day.shiftCount > 0 ? 4 : 0 }}
              />
            </div>

            <span className="text-xs font-bold text-gray-700">
              {day.shiftCount}<span className="text-[9px] font-normal text-gray-400"> ca</span>
            </span>

            {day.hasWarning && (
              <AlertTriangle size={10} className="text-red-500" />
            )}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-100 pt-3 mb-3">
        <span className="flex items-center gap-1">
          <Users size={12} />
          {schedule.stats.totalShifts} ca
        </span>
        <span>{schedule.stats.totalHours}h</span>
        <span className="flex items-center gap-1">
          <Banknote size={12} />
          {(schedule.stats.totalCost / 1_000_000).toFixed(1)} triệu
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {schedule.status === 'draft' && onPublish && (
          <button
            onClick={onPublish}
            className="flex-1 py-2.5 bg-primary text-white text-xs font-bold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            <Share size={12} /> Xuất bản
          </button>
        )}
        <button
          onClick={() => onSelectDay(addDays(weekStart, 0))}
          className="flex-1 py-2.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-xl active:bg-gray-100 transition-colors"
        >
          Xem chi tiết
        </button>
      </div>
    </div>
  )
}
