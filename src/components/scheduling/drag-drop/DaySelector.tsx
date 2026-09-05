'use client'

import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { vi } from 'date-fns/locale'

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

interface DaySelectorProps {
  weekStart: Date
  selectedDate: Date
  onSelectDate: (date: Date) => void
}

export default function DaySelector({ weekStart, selectedDate, onSelectDate }: DaySelectorProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const selectedIdx = days.findIndex(d => format(d, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'))

  const handlePrev = () => {
    if (selectedIdx > 0) onSelectDate(days[selectedIdx - 1])
  }
  const handleNext = () => {
    if (selectedIdx < 6) onSelectDate(days[selectedIdx + 1])
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Arrow Nav */}
        <button
          onClick={handlePrev}
          disabled={selectedIdx <= 0}
          className="p-2 rounded-lg hover:bg-primary-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            <CalendarDays size={16} className="inline mr-1 text-gray-400" /> {format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
          </div>
        </div>

        <button
          onClick={handleNext}
          disabled={selectedIdx >= 6}
          className="p-2 rounded-lg hover:bg-primary-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Quick-pick buttons */}
      <div className="flex justify-center gap-1.5 mt-3">
        {days.map((day, i) => {
          const dayOfWeek = day.getDay()
          const isSelected = i === selectedIdx
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

          return (
            <button
              key={i}
              onClick={() => onSelectDate(day)}
              className={`
                relative px-3 py-1.5 rounded-lg text-sm font-semibold transition-all
                ${isSelected
                  ? 'bg-primary text-white shadow-md shadow-primary/30 scale-105'
                  : isWeekend
                    ? 'bg-warning-50 text-warning-700 hover:bg-warning-100'
                    : 'bg-primary-50 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              {DAY_LABELS[dayOfWeek]}
              <div className="text-xs font-normal opacity-80">
                {format(day, 'dd')}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
