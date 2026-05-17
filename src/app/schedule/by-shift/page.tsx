'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { mockShiftGrid, mockShiftTypes } from '@/lib/mock-data-scheduling'
import { ChevronLeft, ChevronRight, Users } from 'lucide-react'

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

export default function ScheduleByShiftPage() {
  const [selectedStore] = useState('store-001')
  const [weekOffset, setWeekOffset] = useState(0)

  const weekDates = (() => {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - now.getDay() + 1 + weekOffset * 7)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d.toISOString().split('T')[0]
    })
  })()

  const today = new Date().toISOString().split('T')[0]
  const weekLabel = (() => {
    const s = new Date(weekDates[0])
    const e = new Date(weekDates[6])
    return `${s.getDate()}/${s.getMonth() + 1} - ${e.getDate()}/${e.getMonth() + 1}`
  })()

  return (
    <AppShell title="Lịch theo ca">
      <div className="space-y-4">
        {/* Week Nav */}
        <div className="flex items-center justify-between animate-fade-in">
          <button className="btn btn-ghost p-2" onClick={() => setWeekOffset(w => w - 1)}>
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{weekLabel}</div>
            <button className="text-xs font-medium" style={{ color: 'var(--primary)' }} onClick={() => setWeekOffset(0)}>
              {weekOffset === 0 ? 'Tuần này' : 'Về tuần này'}
            </button>
          </div>
          <button className="btn btn-ghost p-2" onClick={() => setWeekOffset(w => w + 1)}>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Shift Grid */}
        {mockShiftTypes.map(shift => (
          <div key={shift.id} className="card animate-slide-up">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ background: shift.color }} />
              <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{shift.name}</h3>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{shift.start} - {shift.end}</span>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {/* Headers */}
              {DAY_LABELS.map((label, i) => (
                <div key={label} className="text-center text-xs font-bold pb-1"
                  style={{ color: weekDates[i] === today ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {label}<br />{new Date(weekDates[i]).getDate()}
                </div>
              ))}

              {/* Cells */}
              {weekDates.map(date => {
                const cell = mockShiftGrid.find(c => c.date === date && c.shift_id === shift.id)
                const isToday = date === today
                return (
                  <div key={date} className="rounded-lg p-1 min-h-[60px]"
                    style={{
                      background: isToday ? shift.color + '15' : 'var(--gray-50)',
                      border: isToday ? `1px solid ${shift.color}40` : '1px solid var(--gray-100)',
                    }}>
                    {cell?.employees.map(emp => (
                      <div key={emp.id} className="text-[9px] font-medium truncate mb-0.5 px-1 py-0.5 rounded"
                        style={{ background: shift.color + '20', color: shift.color }}>
                        {emp.name.split(' ').slice(-2).join(' ')}
                      </div>
                    ))}
                    {cell && (
                      <div className="flex items-center justify-center gap-0.5 mt-1">
                        <Users size={8} style={{ color: 'var(--text-muted)' }} />
                        <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>{cell.employees.length}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  )
}
