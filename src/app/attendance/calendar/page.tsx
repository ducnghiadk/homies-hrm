'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { getCalendarByEmployee } from '@/lib/mock-data-attendance'
import type { CalendarDay, AttStatus } from '@/lib/mock-data-attendance'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const statusColors: Record<string, string> = {
  on_time: '#10b981', late: '#f59e0b', early_leave: '#f97316',
  absent: '#ef4444', day_off: '#9ca3af', leave: '#3b82f6',
}

export default function AttendanceCalendarPage() {
  const [month, setMonth] = useState(2)
  const [year] = useState(2026)
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const blanks = Array.from({ length: firstDay }, (_, i) => i)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Use helper to get calendar for current employee
  const calendarData: CalendarDay[] = getCalendarByEmployee('emp-005')

  return (
    <AppShell title="Lịch chấm công">
      <div className="space-y-4">
        <div className="flex items-center justify-between animate-fade-in">
          <button className="btn btn-ghost p-2" onClick={() => setMonth(m => m > 1 ? m - 1 : 12)}><ChevronLeft size={20} /></button>
          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Tháng {month}/{year}</span>
          <button className="btn btn-ghost p-2" onClick={() => setMonth(m => m < 12 ? m + 1 : 1)}><ChevronRight size={20} /></button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 animate-fade-in">
          {[{ l: 'Đúng giờ', s: 'on_time' }, { l: 'Đi muộn', s: 'late' }, { l: 'Vắng', s: 'absent' }, { l: 'Nghỉ', s: 'day_off' }, { l: 'Phép', s: 'leave' }].map(x => (
            <div key={x.s} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ background: statusColors[x.s] }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{x.l}</span>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div className="card animate-slide-up">
          <div className="grid grid-cols-7 gap-1">
            {DAY_LABELS.map(d => (
              <div key={d} className="text-center text-xs font-bold py-1" style={{ color: 'var(--text-muted)' }}>{d}</div>
            ))}
            {blanks.map(i => <div key={`b${i}`} />)}
            {days.map(d => {
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
              const entry = calendarData.find(c => c.date === dateStr)
              const color = entry ? statusColors[entry.status] || '#9ca3af' : 'var(--gray-200)'
              const today = new Date().getDate() === d && new Date().getMonth() + 1 === month
              return (
                <div key={d} className="text-center py-1.5 rounded-lg relative"
                  style={{
                    background: entry ? color + '15' : 'transparent',
                    border: today ? `2px solid var(--primary)` : entry ? `1px solid ${color}30` : 'none',
                  }}>
                  <div className="text-xs font-medium" style={{ color: entry ? color : 'var(--text-muted)' }}>{d}</div>
                  {entry?.hours && entry.hours > 0 && (
                    <div className="text-[7px]" style={{ color: 'var(--text-muted)' }}>{entry.hours.toFixed(1)}h</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="card text-center p-3"><div className="text-lg font-bold text-emerald-500">{calendarData.filter(c => c.status === 'on_time').length}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>Đúng giờ</div></div>
          <div className="card text-center p-3"><div className="text-lg font-bold text-blue-500">{calendarData.filter(c => c.status === 'leave').length}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>Nghỉ phép</div></div>
          <div className="card text-center p-3"><div className="text-lg font-bold text-red-500">{calendarData.filter(c => c.status === 'absent').length}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>Vắng</div></div>
        </div>
      </div>
    </AppShell>
  )
}
