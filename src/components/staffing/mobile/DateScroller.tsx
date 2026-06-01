'use client'

import { useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { vi } from 'date-fns/locale'

interface DateScrollerProps {
  weekStart: Date
  selectedDate: Date
  onSelectDate: (date: Date) => void
  shiftsPerDay: Record<string, number>
  onWeekChange: (direction: 'prev' | 'next') => void
}

const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

export default function DateScroller({
  weekStart,
  selectedDate,
  onSelectDate,
  shiftsPerDay,
  onWeekChange,
}: DateScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const isSelected = useCallback(
    (day: Date) => format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'),
    [selectedDate]
  )

  const getShiftCount = useCallback(
    (day: Date) => shiftsPerDay[format(day, 'yyyy-MM-dd')] || 0,
    [shiftsPerDay]
  )

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
      {/* Week label */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <button
          onClick={() => onWeekChange('prev')}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full active:bg-gray-100"
          aria-label="Tuần trước"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-xs font-medium text-gray-500">
          {format(weekStart, "'Tuần' dd/MM", { locale: vi })} — {format(addDays(weekStart, 6), 'dd/MM')}
        </span>
        <button
          onClick={() => onWeekChange('next')}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full active:bg-gray-100"
          aria-label="Tuần sau"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day pills */}
      <div ref={scrollRef} className="flex px-2 pb-3 gap-1 overflow-x-auto no-scrollbar">
        {days.map(day => {
          const sel = isSelected(day)
          const count = getShiftCount(day)
          const dayOfWeek = day.getDay()
          const label = dayLabels[dayOfWeek]

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`
                flex-1 min-w-[44px] flex flex-col items-center py-2 rounded-xl
                transition-all duration-200 active:scale-95
                ${sel
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              <span className={`text-xs font-medium ${sel ? 'text-white/80' : 'text-gray-400'}`}>
                {label}
              </span>
              <span className="text-lg font-bold leading-tight">
                {format(day, 'd')}
              </span>
              {/* Shift dots */}
              {count > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {Array.from({ length: Math.min(count, 4) }, (_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-1 rounded-full ${
                        sel ? 'bg-white/70' : 'bg-primary/60'
                      }`}
                    />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
