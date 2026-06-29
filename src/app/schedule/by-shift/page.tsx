'use client'

import { useState, useMemo, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { mockShifts } from '@/lib/mock-data'
import { ScheduleService } from '@/lib/services/schedule-service'
import { EmployeeService } from '@/lib/services/employee-service'
import { ChevronLeft, ChevronRight, Users } from 'lucide-react'

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

export default function ScheduleByShiftPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [weekOffset, setWeekOffset] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  const isManagerOrAdmin = user?.role === 'hr_admin' || user?.role === 'store_manager' || user?.role === 'ceo' || user?.role === 'shift_leader'

  const weekDates = useMemo(() => {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + weekOffset * 7)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d.toISOString().split('T')[0]
    })
  }, [weekOffset])

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  const weekLabel = useMemo(() => {
    if (weekDates.length < 7) return ''
    const s = new Date(weekDates[0])
    const e = new Date(weekDates[6])
    return `${s.getDate()}/${s.getMonth() + 1} - ${e.getDate()}/${e.getMonth() + 1}`
  }, [weekDates])

  const activeStoreId = user?.store_id || 'store-001'

  const storeSchedules = useMemo(() => {
    return user ? ScheduleService.getStoreSchedules(user, activeStoreId, weekDates) : []
  }, [user, activeStoreId, weekDates])

  if (!user) return null

  if (user.role === 'employee') {
    return (
      <AppShell title="Lịch làm việc">
        <div className="py-20 text-center" style={{ color: 'var(--text-muted)' }}>
          Không có quyền
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell showNav contentWidth="full" contentInset="flush">
      <div className="space-y-5 animate-fade-in pb-20">
        {/* ─── Header ─── */}
        <div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">Lịch làm việc theo ca</h1>
          <p className="text-xs text-gray-400 mt-0.5">Xem lịch làm việc từ góc nhìn từng ca, để biết ca nào đang thiếu hoặc đã đủ người.</p>
        </div>

        {/* ─── Role-Based View Switcher Segment Bar ─── */}
        {isManagerOrAdmin && (
          <div className="flex bg-gray-100/80 p-1 rounded-2xl gap-1 w-full border border-gray-200/50">
            <button
              onClick={() => router.push('/schedule/by-shift')}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all bg-white text-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
            >
              Lịch làm việc theo ca
            </button>
            <button
              onClick={() => router.push('/schedule/manage')}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-gray-500 hover:text-gray-700"
            >
              Lịch làm việc theo nhân sự
            </button>
            <button
              onClick={() => router.push('/schedule/admin/review')}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-gray-500 hover:text-gray-700"
            >
              Duyệt lịch làm việc
            </button>
          </div>
        )}

        {/* Week Nav */}
        <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-2.5 shadow-[var(--shadow-card)]">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <div className="text-center">
            <span className="font-bold text-base text-gray-800 tracking-tight block">
              Tuần {weekLabel}
            </span>
            <button
              onClick={() => setWeekOffset(0)}
              className="text-[10px] font-bold text-primary-600 hover:text-primary-700 transition-colors"
            >
              {weekOffset === 0 ? 'Tuần này' : 'Quay lại tuần này'}
            </button>
          </div>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ChevronRight size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Shift Grid */}
        <div className="space-y-4">
          {mockShifts.map(shift => (
            <div key={shift.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-[var(--shadow-card)] animate-slide-up">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ background: shift.color }} />
                <h3 className="font-bold text-sm text-gray-800">{shift.name}</h3>
                <span className="text-xs text-gray-400 font-medium font-numeric">{shift.start_time} - {shift.end_time}</span>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {/* Headers */}
                {DAY_LABELS.map((label, i) => (
                  <div key={label} className="text-center text-[10px] font-black pb-1.5 uppercase tracking-wider"
                    style={{ color: weekDates[i] === today ? 'var(--primary-600)' : 'var(--text-muted)' }}>
                    {label}<br />
                    <span className="text-xs font-bold">{new Date(weekDates[i]).getDate()}</span>
                  </div>
                ))}

                {/* Cells */}
                {weekDates.map(date => {
                  const cellEmployees = storeSchedules
                    .filter(s => s.shift_id === shift.id && s.date === date)
                    .map(s => {
                      const emp = EmployeeService.getEmployeeById(s.employee_id)
                      return {
                        id: s.employee_id,
                        name: emp ? emp.full_name : 'Nhân viên'
                      }
                    })

                  const isToday = date === today
                  return (
                    <div key={date} className="rounded-2xl p-1.5 min-h-[72px] flex flex-col justify-between border transition-all"
                      style={{
                        background: isToday ? `${shift.color}15` : 'var(--gray-50)',
                        borderColor: isToday ? `${shift.color}50` : 'var(--gray-100)',
                      }}>
                      <div className="space-y-1">
                        {cellEmployees.map(emp => (
                          <div key={emp.id} className="text-[9px] font-black tracking-wide truncate px-1.5 py-0.5 rounded-lg text-center leading-none"
                            style={{ background: shift.color + '18', color: shift.color }}>
                            {emp.name.split(' ').slice(-1).join(' ')}
                          </div>
                        ))}
                      </div>
                      {cellEmployees.length > 0 && (
                        <div className="flex items-center justify-center gap-1 mt-1 bg-white/60 py-0.5 px-1 rounded-md border border-gray-200/20">
                          <Users size={9} className="text-gray-400" />
                          <span className="text-[9px] font-bold text-gray-500 font-numeric">{cellEmployees.length}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
