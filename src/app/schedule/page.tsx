'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import {
  mockSchedules, mockAttendances, mockShifts,
  getShiftById, getStoreById,
  type Schedule, type Attendance, type Shift,
} from '@/lib/mock-data'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isToday, addMonths, subMonths,
  startOfWeek, endOfWeek, isBefore,
} from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  ChevronLeft, ChevronRight, Clock, MapPin, X,
  Calendar as CalendarIcon, CheckCircle2, XCircle, Download, ClipboardList, ArrowRightLeft, Briefcase,
  AlertTriangle,
} from 'lucide-react'
import { formatTime } from '@/lib/utils'
import { checkDayUnderstaffing } from '@/lib/understaffing-alert'

// ─── Extended schedule generation ───
// Mock data only has 1-2 weeks. For demo, generate a full-month pattern.
function getExtendedSchedules(employeeId: string): Schedule[] {
  // First use real data
  const real = mockSchedules.filter(s => s.employee_id === employeeId)

  // Derive the employee's typical shift & store from real data
  const sample = real[0]
  if (!sample) return real

  // Generate more schedules across the month (Mon–Fri pattern)
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const extended: Schedule[] = [...real]
  const existingDates = new Set(real.map(s => s.date))

  // Cycle through shifts for variety
  const shiftCycle = ['shift-001', 'shift-002', 'shift-001', 'shift-002', 'shift-001']

  days.forEach((day, i) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const dayOfWeek = day.getDay()
    // Skip weekends and already-existing dates
    if (dayOfWeek === 0 || dayOfWeek === 6) return
    if (existingDates.has(dateStr)) return

    extended.push({
      id: `sch-ext-${dateStr}-${employeeId}`,
      org_id: 'org-001',
      store_id: sample.store_id,
      employee_id: employeeId,
      shift_id: shiftCycle[dayOfWeek - 1] ?? 'shift-001',
      date: dateStr,
    })
  })

  return extended.sort((a, b) => a.date.localeCompare(b.date))
}

export default function SchedulePage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])

  // All schedules for this user (extended)
  const allSchedules = useMemo(
    () => (user ? getExtendedSchedules(user.id) : []),
    [user],
  )

  // ─── Understaffing status per day (manager/admin only) ───
  const isManagerOrAdmin = user?.role === 'hr_admin' || user?.role === 'store_manager'
  const daysInMonth_forStaffing = useMemo(
    () => {
      const ms = startOfMonth(currentDate)
      const me = endOfMonth(currentDate)
      return eachDayOfInterval({ start: ms, end: me })
    },
    [currentDate],
  )
  const dayStaffingMap = useMemo(() => {
    if (!isManagerOrAdmin || !user) return new Map<string, 'critical' | 'warning' | 'ok'>()
    const map = new Map<string, 'critical' | 'warning' | 'ok'>()
    for (const date of daysInMonth_forStaffing) {
      const dateStr = format(date, 'yyyy-MM-dd')
      const alerts = checkDayUnderstaffing(user.store_id, dateStr)
      if (alerts.some(a => a.level === 'critical')) map.set(dateStr, 'critical')
      else if (alerts.some(a => a.level === 'warning')) map.set(dateStr, 'warning')
      else map.set(dateStr, 'ok')
    }
    return map
  }, [isManagerOrAdmin, daysInMonth_forStaffing, user])

  if (!user) return null

  // ─── Month calendar data ───
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const monthStr = format(currentDate, 'yyyy-MM')

  const monthSchedules = allSchedules.filter(s => s.date.startsWith(monthStr))

  const getScheduleForDay = (date: Date): Schedule | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return monthSchedules.find(s => s.date === dateStr)
  }

  const getAttendanceForDay = (date: Date): Attendance | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return mockAttendances.find(a => a.employee_id === user.id && a.date === dateStr)
  }

  // ─── This week list ───
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // ─── Month stats ───
  const shiftCounts: Record<string, number> = {}
  let totalHours = 0
  monthSchedules.forEach(s => {
    const shift = getShiftById(s.shift_id)
    if (shift) {
      shiftCounts[shift.name] = (shiftCounts[shift.name] || 0) + 1
      // Calculate hours from time strings
      const [sh, sm] = shift.start_time.split(':').map(Number)
      const [eh, em] = shift.end_time.split(':').map(Number)
      totalHours += (eh + em / 60) - (sh + sm / 60)
    }
  })

  // ─── Shift color legend ───
  const shiftLegend: { name: string; color: string }[] = mockShifts.map(s => ({
    name: s.name, color: s.color,
  }))

  // ─── Selected day detail ───
  const selectedSchedule = selectedDate ? getScheduleForDay(selectedDate) : undefined
  const selectedShift = selectedSchedule ? getShiftById(selectedSchedule.shift_id) : undefined
  const selectedStore = selectedSchedule ? getStoreById(selectedSchedule.store_id) : undefined
  const selectedAttendance = selectedDate ? getAttendanceForDay(selectedDate) : undefined
  const isPast = selectedDate ? isBefore(selectedDate, today) && !isToday(selectedDate) : false


  return (
    <AppShell showNav>
      <div className="space-y-5 animate-fade-in pb-20">
        {/* ─── Header ─── */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Lịch làm việc</h1>
            <p className="text-xs text-gray-400 mt-0.5">Lịch cá nhân của bạn</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/schedule/open-shifts')}
              className="h-10 px-3 rounded-xl bg-amber-50 text-amber-700 text-xs font-medium flex items-center gap-1.5 hover:bg-amber-100 transition-colors border border-amber-200"
            >
              <Briefcase size={16} /> Ca trống
            </button>
            <button
              onClick={() => router.push('/schedule/swap/list')}
              className="h-10 px-3 rounded-xl bg-gray-100 text-gray-600 text-xs font-medium flex items-center gap-1.5 hover:bg-gray-200 transition-colors"
            >
              <ArrowRightLeft size={16} /> Đổi ca
            </button>
            <button
              onClick={() => router.push('/schedule/preferences')}
              className="h-10 px-3 rounded-xl bg-primary-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-primary-700 transition-colors shadow-sm"
            >
              <ClipboardList size={16} /> Đăng ký ca
            </button>
            <button
              onClick={() => alert('Tính năng xuất ICS sẽ sớm ra mắt!')}
              className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              title="Xuất lịch"
            >
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* ─── Month Navigation ─── */}
        <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-2 shadow-[var(--shadow-card)]">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <span className="font-bold text-base text-gray-800 capitalize tracking-tight">
            {format(currentDate, 'MMMM yyyy', { locale: vi })}
          </span>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ChevronRight size={20} className="text-gray-500" />
          </button>
        </div>

        {/* ─── Shift Color Legend ─── */}
        <div className="flex items-center gap-3 flex-wrap">
          {shiftLegend.map(s => (
            <div key={s.name} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-xs text-gray-500">{s.name}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="text-xs text-gray-500">Nghỉ phép</span>
          </div>
          {isManagerOrAdmin && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={10} className="text-red-500" />
              <span className="text-xs text-gray-500">Thiếu người</span>
            </div>
          )}
        </div>

        {/* ─── Calendar Grid ─── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-[var(--shadow-card)]">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-gray-400 py-1.5 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Padding for first week */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
              <div key={`pad-${i}`} className="aspect-square" />
            ))}

            {daysInMonth.map(date => {
              const schedule = getScheduleForDay(date)
              const shift = schedule ? getShiftById(schedule.shift_id) : null
              const isSelected = selectedDate && isSameDay(date, selectedDate)
              const isTodayDate = isToday(date)
              const dayOfWeek = date.getDay()
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
              const staffStatus = dayStaffingMap.get(format(date, 'yyyy-MM-dd'))

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all relative
                    ${isSelected ? 'ring-2 ring-primary-600 ring-offset-1 shadow-md scale-105 z-10 bg-primary-50' : ''}
                    ${isTodayDate && !isSelected ? 'ring-2 ring-primary-500 ring-offset-1' : ''}
                    ${isWeekend && !schedule ? 'text-gray-300' : ''}
                    ${staffStatus === 'critical' && !isSelected ? 'bg-red-50' : ''}
                    ${staffStatus === 'warning' && !isSelected ? 'bg-amber-50' : ''}
                  `}
                >
                  <span className={`text-xs font-bold ${isTodayDate ? 'text-primary-600' : isWeekend ? 'text-gray-400' : 'text-gray-800'}`}>
                    {format(date, 'd')}
                  </span>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {shift && (
                      <div
                        className="w-[6px] h-[6px] rounded-full"
                        style={{ backgroundColor: shift.color }}
                      />
                    )}
                    {staffStatus && staffStatus !== 'ok' && (
                      <AlertTriangle size={8} className={staffStatus === 'critical' ? 'text-red-500' : 'text-amber-500'} />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ─── This Week List ─── */}
        <div>
          <h2 className="text-sm font-bold text-gray-800 tracking-tight mb-3">Tuần này</h2>
          <div className="space-y-2">
            {weekDays.map(day => {
              const schedule = allSchedules.find(s => s.date === format(day, 'yyyy-MM-dd'))
              const shift = schedule ? getShiftById(schedule.shift_id) : null
              const attendance = getAttendanceForDay(day)
              const isTodayDate = isToday(day)
              const dayOfWeek = day.getDay()
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    isTodayDate ? 'bg-primary-50 border border-primary-200' : 'bg-white border border-gray-100'
                  } hover:shadow-sm`}
                >
                  {/* Day label */}
                  <div className={`w-11 text-center shrink-0 ${isTodayDate ? 'text-primary-600' : 'text-gray-500'}`}>
                    <p className="text-xs font-bold uppercase">
                      {format(day, 'EEE', { locale: vi })}
                    </p>
                    <p className="text-lg font-bold leading-tight">{format(day, 'd')}</p>
                  </div>

                  {/* Shift info */}
                  <div className="flex-1 min-w-0">
                    {shift ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-8 rounded-full" style={{ backgroundColor: shift.color }} />
                        <div>
                          <p className="text-sm font-bold text-gray-800">{shift.name}</p>
                          <p className="text-xs text-gray-400 font-numeric">{shift.start_time} – {shift.end_time}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">{isWeekend ? 'Cuối tuần' : 'Nghỉ'}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="shrink-0">
                    {shift && attendance?.check_in_time ? (
                      <CheckCircle2 size={18} className="text-green-500" />
                    ) : shift && isBefore(day, today) && !isTodayDate ? (
                      <XCircle size={18} className="text-red-400" />
                    ) : shift ? (
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                    ) : null}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ─── Month Statistics ─── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-bold text-gray-800 tracking-tight mb-3">Thống kê tháng</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-primary-700 font-numeric">{monthSchedules.length}</p>
              <p className="text-xs text-gray-500">Tổng số ca</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-amber-700 font-numeric">{Math.round(totalHours)}</p>
              <p className="text-xs text-gray-500">Giờ dự kiến</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
            {mockShifts.map(s => {
              const count = shiftCounts[s.name] || 0
              return (
                <div key={s.id} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-xs text-gray-500">{s.name}: <b className="text-gray-800 font-numeric">{count}</b></span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── Day Detail Bottom Sheet ─── */}
      {selectedDate && (
        <>
          <div className="fixed inset-0 bg-dark-900/40 backdrop-blur-sm z-50 transition-opacity" onClick={() => setSelectedDate(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-[32px] p-6 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-slide-up max-w-[500px] mx-auto">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5" />

            {/* Header */}
            <div className="flex justify-between items-center mb-5">
              <div>
                <p className="text-xs text-gray-400 capitalize">{format(selectedDate, 'EEEE', { locale: vi })}</p>
                <h2 className="text-lg font-bold text-gray-800 tracking-tight">{format(selectedDate, 'd MMMM yyyy', { locale: vi })}</h2>
              </div>
              <button onClick={() => setSelectedDate(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <X size={16} />
              </button>
            </div>

            {selectedSchedule && selectedShift ? (
              <div className="space-y-3">
                {/* Shift card */}
                <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: `${selectedShift.color}15` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${selectedShift.color}25` }}>
                    <Clock size={20} style={{ color: selectedShift.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800">{selectedShift.name}</p>
                    <p className="text-xs text-gray-400 font-numeric">{selectedShift.start_time} – {selectedShift.end_time}</p>
                  </div>
                  <div className="px-2 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-700">
                    Đã xác nhận
                  </div>
                </div>

                {/* Store info */}
                {selectedStore && (
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    <MapPin size={16} className="text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Cửa hàng</p>
                      <p className="text-sm font-bold text-gray-800">{selectedStore.name}</p>
                    </div>
                  </div>
                )}

                {/* Attendance info (for past days) */}
                {isPast && selectedAttendance && (
                  <div className="bg-green-50 rounded-xl p-3 space-y-2">
                    <p className="text-xs text-green-600 font-bold uppercase tracking-wider">Chấm công</p>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-400">Check-in</p>
                        <p className="font-bold text-gray-800 font-numeric">
                          {selectedAttendance.check_in_time ? formatTime(selectedAttendance.check_in_time) : '—'}
                        </p>
                      </div>
                      <div className="text-gray-300">→</div>
                      <div>
                        <p className="text-xs text-gray-400">Check-out</p>
                        <p className="font-bold text-gray-800 font-numeric">
                          {selectedAttendance.check_out_time ? formatTime(selectedAttendance.check_out_time) : '—'}
                        </p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-xs text-gray-400">Tổng</p>
                        <p className="font-bold text-primary-600">{selectedAttendance.total_hours.toFixed(1)}h</p>
                      </div>
                    </div>
                    {selectedAttendance.status === 'late' && (
                      <p className="text-xs text-amber-600">⚠️ Trễ {selectedAttendance.late_minutes} phút</p>
                    )}
                  </div>
                )}

                {isPast && !selectedAttendance && (
                  <div className="bg-red-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-red-500 font-medium">Không có dữ liệu chấm công</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-dashed border-gray-200">
                  <CalendarIcon size={28} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-500 font-medium">Bạn không có lịch làm ngày này</p>
                <p className="text-xs text-gray-400 mt-1">{selectedDate.getDay() === 0 || selectedDate.getDay() === 6 ? 'Cuối tuần' : 'Không có ca'}</p>
                {!isPast && selectedDate.getDay() !== 0 && selectedDate.getDay() !== 6 && (
                  <button className="mt-4 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold shadow-md active:scale-[0.97] transition-transform">
                    Đăng ký ca
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </AppShell>
  )
}
