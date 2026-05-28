'use client'

import { useState, useMemo } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import { StatCard, Badge, SectionGroup, EmptyState } from '@/components/ui'
import { getShiftById } from '@/lib/mock-data'
import { AttendanceService } from '@/lib/services/attendance-service'
import { formatTime, formatHours, getStatusLabel } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Clock, CheckCircle2, AlertTriangle, Timer, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_BADGE_VARIANT: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
  on_time: 'success',
  late: 'error',
  early: 'warning',
  absent: 'default',
}

export default function AttendanceHistoryPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [monthOffset, setMonthOffset] = useState(0)

  const currentMonth = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + monthOffset)
    return d
  }, [monthOffset])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])
  if (!user) return null

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7 // Mon=0
  const today = new Date().toISOString().split('T')[0]

  const myAttendances = AttendanceService.getEmployeeAttendances(user.id)

  const getAttForDate = (dateStr: string) => myAttendances.find(a => a.date === dateStr)

  const statusDotColor = (status?: string) => {
    switch (status) {
      case 'on_time': return 'bg-success-500'
      case 'late': return 'bg-error-500'
      case 'early': return 'bg-warning-500'
      case 'absent': return 'bg-gray-400'
      default: return 'bg-gray-200'
    }
  }

  // Summary stats for month
  const monthDates = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month, i + 1)
    return d.toISOString().split('T')[0]
  })
  const monthAtt = myAttendances.filter(a => monthDates.includes(a.date))
  const onTime = monthAtt.filter(a => a.status === 'on_time').length
  const late = monthAtt.filter(a => a.status === 'late').length
  const totalHours = monthAtt.reduce((s, a) => s + a.total_hours, 0)

  const monthLabel = currentMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })

  return (
    <AppShell title="Lịch sử chấm công">
      <div className="space-y-5 pb-20">
        {/* ─── Month Navigation ─── */}
        <div className="flex items-center justify-between">
          <button
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
            onClick={() => setMonthOffset(m => m - 1)}
          >
            <ChevronLeft size={20} className="text-gray-400" />
          </button>
          <div className="text-center">
            <div className="font-bold text-sm text-gray-800 capitalize tracking-tight">{monthLabel}</div>
            {monthOffset !== 0 && (
              <button
                className="text-xs text-primary-600 font-medium hover:underline"
                onClick={() => setMonthOffset(0)}
              >
                Tháng này
              </button>
            )}
          </div>
          <button
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
            onClick={() => setMonthOffset(m => m + 1)}
          >
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        </div>

        {/* ─── Summary Stats — color-coded StatCards ─── */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard
            icon={CheckCircle2}
            label="Đúng giờ"
            value={onTime}
            iconColor="text-success-600"
            iconBg="bg-success-100"
            className="bg-success-50 border-success-200"
            valueClassName="text-success-700"
          />
          <StatCard
            icon={AlertTriangle}
            label="Trễ"
            value={late}
            iconColor="text-error-600"
            iconBg="bg-error-100"
            className="bg-error-50 border-error-200"
            valueClassName="text-error-700"
          />
          <StatCard
            icon={Timer}
            label="Tổng giờ"
            value={formatHours(totalHours)}
            iconColor="text-primary-600"
            iconBg="bg-primary-100"
            className="bg-primary-50 border-primary-200"
            valueClassName="text-primary-700"
          />
        </div>

        {/* ─── Calendar Grid — shadow-card ─── */}
        <div className="bg-white rounded-2xl p-3 shadow-[var(--shadow-card)]">
          <div className="grid grid-cols-7 gap-1 text-center">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
              <div key={d} className="text-[10px] uppercase font-semibold py-1 text-gray-400">{d}</div>
            ))}
            {/* Empty cells before first day */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
            {/* Days */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
              const att = getAttForDate(dateStr)
              const isToday = dateStr === today

              return (
                <div
                  key={i}
                  className={cn(
                    'relative rounded-lg py-1.5 flex flex-col items-center transition-colors',
                    isToday && 'ring-2 ring-primary-500 ring-offset-1 bg-primary-50',
                  )}
                >
                  <span className={cn(
                    'text-xs font-medium',
                    isToday ? 'text-primary-600 font-bold' : 'text-gray-700',
                  )}>
                    {i + 1}
                  </span>
                  <div className={cn('w-1.5 h-1.5 rounded-full mt-0.5', statusDotColor(att?.status))} />
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 justify-center mt-3 pt-3 border-t border-gray-100">
            {[
              { cls: 'bg-success-500', label: 'Đúng giờ' },
              { cls: 'bg-error-500', label: 'Trễ' },
              { cls: 'bg-gray-200', label: 'Không có' },
            ].map(({ cls, label }) => (
              <div key={label} className="flex items-center gap-1 text-xs text-gray-500">
                <div className={cn('w-2 h-2 rounded-full', cls)} /> {label}
              </div>
            ))}
          </div>
        </div>

        {/* ─── Detail List — SectionGroup ─── */}
        <SectionGroup title="Chi tiết tháng này" icon={CalendarDays}>
          {monthAtt.length === 0 ? (
            <EmptyState
              variant="no-data"
              title="Chưa có dữ liệu"
              description="Không có bản ghi chấm công nào trong tháng này"
            />
          ) : (
            <div className="space-y-1">
              {monthAtt.sort((a, b) => b.date.localeCompare(a.date)).map(att => {
                const shift = att.shift_id ? getShiftById(att.shift_id) : null
                return (
                  <div
                    key={att.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    {/* Day number */}
                    <div className="w-8 text-center flex-shrink-0">
                      <div className="text-sm font-bold text-gray-800 font-numeric">
                        {new Date(att.date).getDate()}
                      </div>
                      <div className="text-[9px] text-gray-400 uppercase">
                        {new Date(att.date).toLocaleDateString('vi-VN', { weekday: 'short' }).replace('.', '')}
                      </div>
                    </div>

                    {/* Time + Shift */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Clock size={10} className="text-gray-400" />
                        <span className="font-numeric">
                          {att.check_in_time ? formatTime(att.check_in_time) : '--:--'}
                        </span>
                        <span className="text-gray-300">→</span>
                        <span className="font-numeric">
                          {att.check_out_time ? formatTime(att.check_out_time) : '--:--'}
                        </span>
                      </div>
                      {shift && (
                        <div className="text-xs mt-0.5 font-medium" style={{ color: shift.color }}>
                          {shift.name}
                        </div>
                      )}
                    </div>

                    {/* Status + Total */}
                    <div className="text-right flex-shrink-0 space-y-0.5">
                      <Badge variant={STATUS_BADGE_VARIANT[att.status] || 'default'}>
                        {getStatusLabel(att.status)}
                      </Badge>
                      {att.total_hours > 0 && (
                        <div className="text-xs text-gray-400 font-numeric">{formatHours(att.total_hours)}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </SectionGroup>
      </div>
    </AppShell>
  )
}
