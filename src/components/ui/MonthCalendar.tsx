'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns'
import { vi } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
}

interface MonthCalendarProps {
  selectedDate?: Date
  onSelectDate?: (date: Date) => void
  renderDayContent?: (date: Date) => React.ReactNode
  disabledDates?: Date[]
  highlightedDates?: { date: Date; color: string }[]
  minDate?: Date
  maxDate?: Date
  className?: string
}

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

export function MonthCalendar({
  selectedDate,
  onSelectDate,
  renderDayContent,
  disabledDates = [],
  highlightedDates = [],
  minDate,
  maxDate,
  className,
}: MonthCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date())

  // Generate calendar days (6 weeks grid)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })

    const days: CalendarDay[] = []
    let day = startDate

    while (day <= endDate) {
      days.push({
        date: new Date(day),
        isCurrentMonth: isSameMonth(day, currentMonth),
        isToday: isToday(day),
        isSelected: selectedDate ? isSameDay(day, selectedDate) : false,
      })
      day = addDays(day, 1)
    }

    return days
  }, [currentMonth, selectedDate])

  const isDisabled = (date: Date) => {
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    return disabledDates.some(d => isSameDay(d, date))
  }

  const getHighlightColor = (date: Date) => {
    const highlight = highlightedDates.find(h => isSameDay(h.date, date))
    return highlight?.color
  }

  const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const goToToday = () => {
    setCurrentMonth(new Date())
    onSelectDate?.(new Date())
  }

  return (
    <div className={cn('bg-white rounded-2xl shadow-[var(--shadow-card)] p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPrevMonth}
          className="w-10 h-10 rounded-xl flex items-center justify-center
            hover:bg-gray-100 active:bg-gray-200 transition-colors"
          aria-label="Tháng trước"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div className="text-center">
          <h3 className="text-base font-bold text-gray-900 tracking-tight capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: vi })}
          </h3>
          <button
            onClick={goToToday}
            className="text-xs text-primary-600 font-medium hover:underline mt-0.5"
          >
            Hôm nay
          </button>
        </div>

        <button
          onClick={goToNextMonth}
          className="w-10 h-10 rounded-xl flex items-center justify-center
            hover:bg-gray-100 active:bg-gray-200 transition-colors"
          aria-label="Tháng sau"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((day, index) => (
          <div
            key={day}
            className={cn(
              'text-center text-xs font-semibold py-2',
              index === 0 ? 'text-error-400' : 'text-gray-400',
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map((day, index) => {
          const disabled = isDisabled(day.date)
          const highlightColor = getHighlightColor(day.date)

          return (
            <button
              key={index}
              onClick={() => !disabled && day.isCurrentMonth && onSelectDate?.(day.date)}
              disabled={disabled || !day.isCurrentMonth}
              className={cn(
                'relative min-h-[48px] p-1 rounded-xl transition-all',
                'flex flex-col items-center justify-start',
                day.isCurrentMonth ? 'text-gray-900' : 'text-gray-200 pointer-events-none',
                day.isToday && !day.isSelected && 'ring-2 ring-primary-500 ring-offset-1',
                day.isSelected && 'bg-primary-500 text-white ring-0',
                !disabled && !day.isSelected && day.isCurrentMonth && 'hover:bg-gray-50 active:bg-gray-100',
                disabled && day.isCurrentMonth && 'opacity-40 cursor-not-allowed',
                highlightColor && !day.isSelected && day.isCurrentMonth && highlightColor,
              )}
            >
              <span className={cn(
                'text-sm font-medium leading-tight',
                day.isSelected && 'text-white',
              )}>
                {format(day.date, 'd')}
              </span>

              {renderDayContent && day.isCurrentMonth && (
                <div className="w-full mt-0.5">
                  {renderDayContent(day.date)}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
