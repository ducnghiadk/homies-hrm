'use client'

import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Calendar, Users, AlertTriangle } from 'lucide-react'
import { MonthCalendar } from '@/components/ui/MonthCalendar'
import { BottomSheet, Avatar, SectionGroup } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { LeaveCalendarEntry, BlackoutDate, LeaveType } from '@/lib/mock-data-leave'
import { LEAVE_TYPE_MAP } from '@/lib/mock-data-leave'

// Leave type dot colors
const LEAVE_DOT_COLORS: Record<string, string> = {
  annual: 'bg-blue-500',
  sick: 'bg-red-500',
  unpaid: 'bg-gray-400',
  wedding: 'bg-pink-500',
  bereavement: 'bg-purple-500',
  maternity: 'bg-amber-500',
  personal: 'bg-cyan-500',
}

interface LeaveCalendarProps {
  entries: LeaveCalendarEntry[]
  blackoutDates?: BlackoutDate[]
  onDateSelect?: (date: Date, entries: LeaveCalendarEntry[]) => void
}

export default function LeaveCalendar({ entries, blackoutDates = [], onDateSelect }: LeaveCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Entries for selected date
  const selectedDateEntries = useMemo(() => {
    if (!selectedDate) return []
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    return entries.filter(e => e.date === dateStr)
  }, [selectedDate, entries])

  // Blackout info for selected date
  const selectedDateBlackout = useMemo(() => {
    if (!selectedDate) return null
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    return blackoutDates.find(b => b.date === dateStr) ?? null
  }, [selectedDate, blackoutDates])

  // Blackout dates as Date objects for highlights
  const blackoutHighlights = useMemo(() =>
    blackoutDates.map(b => ({ date: parseISO(b.date), color: 'bg-red-50' })),
    [blackoutDates],
  )

  // Handle date click
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setShowDetails(true)
    const dateStr = format(date, 'yyyy-MM-dd')
    onDateSelect?.(date, entries.filter(e => e.date === dateStr))
  }

  // Day content renderer — leave dots + blackout bar
  const renderDayContent = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayEntries = entries.filter(e => e.date === dateStr)
    const isBlackout = blackoutDates.some(b => b.date === dateStr)

    if (dayEntries.length === 0 && !isBlackout) return null

    return (
      <div className="flex flex-wrap gap-0.5 justify-center">
        {isBlackout && (
          <div className="w-full h-0.5 bg-red-400 rounded-full mb-0.5" />
        )}
        {dayEntries.slice(0, 3).map((entry, i) => (
          <div
            key={i}
            className={cn('w-1.5 h-1.5 rounded-full', LEAVE_DOT_COLORS[entry.leave_type] || 'bg-gray-400')}
          />
        ))}
        {dayEntries.length > 3 && (
          <span className="text-[7px] text-gray-400 font-bold leading-none">
            +{dayEntries.length - 3}
          </span>
        )}
      </div>
    )
  }

  // Summary stats
  const stats = useMemo(() => {
    const uniqueEmployees = new Set(entries.map(e => e.employee_id)).size
    return {
      totalEntries: entries.length,
      uniqueEmployees,
      blackoutCount: blackoutDates.length,
    }
  }, [entries, blackoutDates])

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-1">
        {(['annual', 'sick', 'unpaid', 'personal'] as LeaveType[]).map(t => (
          <div key={t} className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className={cn('w-2 h-2 rounded-full', LEAVE_DOT_COLORS[t])} />
            <span>{LEAVE_TYPE_MAP[t]?.name || t}</span>
          </div>
        ))}
        {blackoutDates.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-3 h-0.5 rounded-full bg-red-400" />
            <span>Ngày cấm</span>
          </div>
        )}
      </div>

      {/* Calendar */}
      <MonthCalendar
        selectedDate={selectedDate ?? undefined}
        onSelectDate={handleDateSelect}
        renderDayContent={renderDayContent}
        highlightedDates={blackoutHighlights}
      />

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-blue-700">{stats.totalEntries}</p>
          <p className="text-xs text-blue-600">Lượt nghỉ</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-emerald-700">{stats.uniqueEmployees}</p>
          <p className="text-xs text-emerald-600">Nhân viên</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-red-700">{stats.blackoutCount}</p>
          <p className="text-xs text-red-600">Ngày cấm</p>
        </div>
      </div>

      {/* Details Bottom Sheet */}
      <BottomSheet
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title={selectedDate ? format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: vi }) : ''}
        snapPoints={[0.45, 0.8]}
      >
        <div className="p-4 space-y-4">
          {/* Blackout warning */}
          {selectedDateBlackout && (
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">Ngày cấm nghỉ</p>
                <p className="text-xs text-red-600 mt-0.5">{selectedDateBlackout.reason}</p>
              </div>
            </div>
          )}

          {/* Leave entries */}
          {selectedDateEntries.length > 0 ? (
            <SectionGroup title={`Nhân viên nghỉ (${selectedDateEntries.length})`} icon={Users}>
              <div className="divide-y divide-gray-50">
                {selectedDateEntries.map((entry, index) => {
                  const typeInfo = LEAVE_TYPE_MAP[entry.leave_type]
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 px-3 py-3"
                    >
                      <Avatar name={entry.employee_name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {entry.employee_name}
                        </p>
                        <p className="text-xs text-gray-500">{typeInfo?.name || entry.leave_type}</p>
                      </div>
                      <div
                        className={cn('w-2.5 h-2.5 rounded-full', LEAVE_DOT_COLORS[entry.leave_type] || 'bg-gray-400')}
                      />
                    </div>
                  )
                })}
              </div>
            </SectionGroup>
          ) : !selectedDateBlackout ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-400">Không có ai nghỉ ngày này</p>
            </div>
          ) : null}
        </div>
      </BottomSheet>
    </div>
  )
}
