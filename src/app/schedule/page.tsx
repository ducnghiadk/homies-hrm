'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth-store'
import { ScheduleService } from '@/lib/services/schedule-service'
import { getShiftById, getStoreById, mockAttendances, type Attendance, type Schedule } from '@/lib/mock-data'
import { releasePublishedShift } from '@/lib/mock-data-open-shifts'
import { notifyOpenShiftCreated } from '@/lib/notifications/open-shift-notifications'
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  History,
  MapPin,
  Send,
  Settings2,
  Shuffle,
} from 'lucide-react'

function toDateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getWeekAnchor(rawWeekStart: string | null): Date {
  const base = rawWeekStart ? new Date(`${rawWeekStart}T00:00:00`) : new Date()
  const safeBase = Number.isNaN(base.getTime()) ? new Date() : base
  const monday = new Date(safeBase)
  const day = monday.getDay()
  monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1))
  monday.setHours(0, 0, 0, 0)
  return monday
}

const weekdayShort = new Intl.DateTimeFormat('vi-VN', { weekday: 'short' })
const weekdayLong = new Intl.DateTimeFormat('vi-VN', { weekday: 'long' })
const monthDay = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' })
const fullDate = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

function getAttendanceForDay(employeeId: string, date: string): Attendance | undefined {
  return mockAttendances.find(attendance => attendance.employee_id === employeeId && attendance.date === date)
}

function SchedulePageContent() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState<string>(toDateString(new Date()))

  useEffect(() => {
    const weekStart = searchParams.get('weekStart')
    const explicitSelectedDate = searchParams.get('selectedDate')
    const legacyDate = searchParams.get('date')
    const month = searchParams.get('month')
    const storeId = searchParams.get('storeId')
    const nextParams = new URLSearchParams()

    if (weekStart) nextParams.set('weekStart', weekStart)
    if (explicitSelectedDate) nextParams.set('selectedDate', explicitSelectedDate)
    else if (legacyDate) nextParams.set('selectedDate', legacyDate)
    if (storeId) nextParams.set('storeId', storeId)

    const hasStage2Query = Boolean(weekStart || explicitSelectedDate || legacyDate || month || storeId)
    if (!hasStage2Query) return

    const nextUrl = nextParams.toString() ? `/schedules?${nextParams.toString()}` : '/schedules'
    router.replace(nextUrl)
  }, [router, searchParams])

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  const weekAnchor = useMemo(() => getWeekAnchor(searchParams.get('weekStart')), [searchParams])

  const weekDates = useMemo(() => {
    const monday = new Date(weekAnchor)
    monday.setDate(weekAnchor.getDate() + weekOffset * 7)
    return Array.from({ length: 7 }, (_, index) => {
      const current = new Date(monday)
      current.setDate(monday.getDate() + index)
      return current
    })
  }, [weekAnchor, weekOffset])

  const weekStrs = useMemo(() => weekDates.map(toDateString), [weekDates])
  const nextWeekStrs = useMemo(() => {
    const nextMonday = new Date(weekDates[0] || new Date())
    nextMonday.setDate(nextMonday.getDate() + 7)
    return Array.from({ length: 7 }, (_, index) => {
      const current = new Date(nextMonday)
      current.setDate(nextMonday.getDate() + index)
      return toDateString(current)
    })
  }, [weekDates])
  const today = toDateString(new Date())
  const isManagerOrAdmin = ['ceo', 'hr_admin', 'store_manager', 'shift_leader'].includes(user?.role || '')

  const resolvedSelectedDate = weekStrs.includes(selectedDate)
    ? selectedDate
    : (weekStrs.includes(today) ? today : weekStrs[0]) || today

  const allSchedules = useMemo(() => {
    if (!user) return []
    return ScheduleService.getSchedulesForUser(user, user.id)
  }, [user])

  const weekSchedules = useMemo(() => {
    return allSchedules
      .filter(schedule => weekStrs.includes(schedule.date))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [allSchedules, weekStrs])

  const scheduleByDate = useMemo(() => {
    const nextMap = new Map<string, Schedule>()
    weekSchedules.forEach(schedule => nextMap.set(schedule.date, schedule))
    return nextMap
  }, [weekSchedules])

  const weekPublished = useMemo(() => {
    if (!user || !weekStrs[0]) return false
    return ScheduleService.isWeekPublished(user.store_id, weekStrs[0])
  }, [user, weekStrs])
  const weekStateMeta = useMemo(() => {
    if (!user || !weekStrs[0]) return null
    const week = ScheduleService.getScheduleWeek(user.store_id, weekStrs[0])
    return week ? ScheduleService.getWeekStateMeta(week) : null
  }, [user, weekStrs])
  const nextWeekPublished = useMemo(() => {
    if (!user || !nextWeekStrs[0]) return false
    return ScheduleService.isWeekPublished(user.store_id, nextWeekStrs[0])
  }, [nextWeekStrs, user])

  const todaySchedule = scheduleByDate.get(today)
  const selectedSchedule = scheduleByDate.get(resolvedSelectedDate)
  const selectedShift = selectedSchedule ? getShiftById(selectedSchedule.shift_id) : null
  const selectedStore = selectedSchedule ? getStoreById(selectedSchedule.store_id) : null
  const selectedAttendance = user ? getAttendanceForDay(user.id, resolvedSelectedDate) : undefined
  const changedCount = weekSchedules.filter(schedule => schedule.modified_after_publish).length
  const totalHours = weekSchedules.reduce((sum, schedule) => {
    const shift = getShiftById(schedule.shift_id)
    if (!shift) return sum
    const [startHour, startMinute] = shift.start_time.split(':').map(Number)
    const [endHour, endMinute] = shift.end_time.split(':').map(Number)
    return sum + (endHour + endMinute / 60) - (startHour + startMinute / 60)
  }, 0)

  const nextShift = weekSchedules.find(schedule => schedule.date >= today)
  const weekLabel = `${monthDay.format(weekDates[0])} - ${monthDay.format(weekDates[6])}`

  const releaseSelectedShift = () => {
    if (!user || !selectedSchedule || !selectedShift || !selectedStore) return
    const confirmed = window.confirm('Nhả ca này ra danh sách ca trống để đồng nghiệp có thể đăng ký nhận?')
    if (!confirmed) return
    const created = releasePublishedShift(selectedSchedule.id, user.id, `Nhân viên ${user.full_name} chủ động nhả ca cần hỗ trợ`)
    if (!created) return
    notifyOpenShiftCreated({
      openShiftId: created.id,
      storeId: created.store_id,
      storeName: selectedStore.name,
      shiftId: created.shift_id,
      shiftName: selectedShift.name,
      startTime: selectedShift.start_time,
      endTime: selectedShift.end_time,
      date: created.date,
      positionId: created.position_id,
      positionName: 'Ca trống cần người phù hợp',
      createdByName: user.full_name,
    })
    router.push(`/schedule/open-shifts?tab=my&openShiftId=${created.id}`)
  }

  if (!user) return null

  return (
    <AppShell showNav>
      <div className="animate-fade-in space-y-5 pb-20">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-800">Lịch của tôi</h1>
            <p className="mt-0.5 text-xs text-gray-400">
              Xem lịch tuần chính thức, thay đổi mới và chi tiết từng ca làm.
            </p>
          </div>

          {isManagerOrAdmin && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => router.push('/schedules')}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Settings2 size={14} /> Quản lý phân ca
              </button>
              <button
                onClick={() => router.push(`/schedule/history?storeId=${user.store_id}&weekStart=${weekStrs[0]}`)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-100"
              >
                <History size={14} /> Lịch sử thay đổi
              </button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setWeekOffset(offset => offset - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-gray-100"
            >
              <ChevronLeft size={18} className="text-gray-500" />
            </button>

            <div className="text-center">
              <div className="text-base font-bold tracking-tight text-gray-800">Tuần {weekLabel}</div>
              <button
                onClick={() => setWeekOffset(0)}
                className="text-[10px] font-bold text-primary-600 transition-colors hover:text-primary-700"
              >
                {weekOffset === 0 ? 'Tuần hiện tại' : 'Quay lại tuần hiện tại'}
              </button>
            </div>

            <button
              onClick={() => setWeekOffset(offset => offset + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-gray-100"
            >
              <ChevronRight size={18} className="text-gray-500" />
            </button>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                {weekStateMeta && (
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${weekStateMeta.tone}`}>
                    {weekStateMeta.label}
                  </span>
                )}
                {changedCount > 0 && (
                  <span className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-[11px] font-bold text-primary-700">
                    {changedCount} ca đã đổi sau khi đã chốt
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {weekStateMeta?.description || (weekPublished
                  ? 'Đây là lịch tuần chính thức đang áp dụng cho nhân sự.'
                  : 'Quản lý vẫn đang hoàn thiện lịch tuần. Bản nháp sẽ không hiện cho nhân viên cho tới khi tuần này được chốt.')}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl bg-white px-3 py-3">
                  <div className="text-[11px] font-medium text-gray-400">Số ca trong tuần</div>
                  <div className="mt-1 text-lg font-bold text-gray-800">{weekSchedules.length}</div>
                </div>
                <div className="rounded-xl bg-white px-3 py-3">
                  <div className="text-[11px] font-medium text-gray-400">Tổng giờ dự kiến</div>
                  <div className="mt-1 text-lg font-bold text-gray-800">{Math.round(totalHours * 10) / 10}h</div>
                </div>
                <div className="rounded-xl bg-white px-3 py-3">
                  <div className="text-[11px] font-medium text-gray-400">Ca tiếp theo</div>
                  <div className="mt-1 text-sm font-bold text-gray-800">
                    {nextShift ? monthDay.format(new Date(`${nextShift.date}T00:00:00`)) : 'Chưa có'}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                <Clock3 size={16} className="text-primary-600" />
                Ca hôm nay
              </div>
              {todaySchedule ? (
                <div className="mt-3 rounded-2xl border border-primary-100 bg-primary-50 p-4">
                  <div className="text-sm font-bold text-gray-800">{getShiftById(todaySchedule.shift_id)?.name || 'Ca làm'}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {getShiftById(todaySchedule.shift_id)?.start_time} - {getShiftById(todaySchedule.shift_id)?.end_time}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                    {(() => {
                      const assignmentMeta = ScheduleService.getAssignmentStateMeta(todaySchedule)
                      return <span className={`inline-flex items-center rounded-full bg-white px-2 py-1 font-bold ${assignmentMeta.tone}`}>{assignmentMeta.label}</span>
                    })()}
                    {todaySchedule.change_reason && <span className="text-gray-500">Lý do thay đổi: {todaySchedule.change_reason}</span>}
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
                  {weekPublished ? 'Hôm nay bạn không có ca làm.' : 'Hôm nay chưa có ca chính thức vì tuần này chưa được chốt.'}
                </div>
              )}
            </div>
          </div>
        </div>

        {user.role === 'employee' && weekPublished && (
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => router.push('/schedule/swap')}
              className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-colors hover:bg-gray-50"
            >
              <div>
                <div className="text-sm font-bold text-gray-800">Đổi ca / nhờ thay ca</div>
                <div className="mt-1 text-xs text-gray-400">Theo dõi đủ trạng thái: chờ đồng nghiệp, chờ quản lý, đã duyệt hoặc bị từ chối.</div>
              </div>
              <Shuffle size={18} className="text-primary-600" />
            </button>
            <button
              onClick={() => router.push('/schedule/open-shifts')}
              className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-colors hover:bg-gray-50"
            >
              <div>
                <div className="text-sm font-bold text-gray-800">Nhận ca trống</div>
                <div className="mt-1 text-xs text-gray-400">Xem trạng thái ca trống, gửi yêu cầu nhận và theo dõi chờ duyệt hoặc tự duyệt.</div>
              </div>
              <Send size={18} className="text-primary-600" />
            </button>
          </div>
        )}

        {!weekPublished && user.role === 'employee' && (
          <div className="rounded-2xl border border-warning-200 bg-warning-50 px-4 py-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 text-warning-600" />
              <div>
                <p className="text-sm font-bold text-warning-800">Lịch tuần này chưa được chốt chính thức</p>
                <p className="mt-1 text-xs leading-relaxed text-warning-700">
                  Nhân viên chỉ nhìn thấy lịch chính thức sau khi quản lý chốt lịch. Nếu bạn chưa thấy ca, nghĩa là tuần này vẫn đang ở bản nháp và chưa có lịch chính thức để áp dụng.
                </p>
              </div>
            </div>
          </div>
        )}

        {user.role === 'employee' && !nextWeekPublished && (
          <div className="rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3">
            <div className="flex items-start gap-2">
              <CalendarDays size={16} className="mt-0.5 text-primary-600" />
              <div>
                <p className="text-sm font-bold text-primary-800">Lịch tuần sau chưa được quản lý chốt</p>
                <p className="mt-1 text-xs leading-relaxed text-primary-700">
                  Bạn có thể xem lịch tuần này, còn tuần sau sẽ hiện rõ sau khi quản lý chốt bản chính thức.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[var(--shadow-card)]">
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays size={16} className="text-primary-600" />
              <h2 className="text-sm font-bold text-gray-800">Lịch tuần của tôi</h2>
            </div>

            <div className="space-y-2">
              {weekDates.map(date => {
                const dateStr = toDateString(date)
                const schedule = scheduleByDate.get(dateStr)
                const shift = schedule ? getShiftById(schedule.shift_id) : null
                const isTodayDate = dateStr === today
                const isSelected = resolvedSelectedDate === dateStr

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-primary-200 bg-primary-50'
                        : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-14 shrink-0 text-center ${isTodayDate ? 'text-primary-700' : 'text-gray-500'}`}>
                      <div className="text-[11px] font-bold uppercase">{weekdayShort.format(date)}</div>
                      <div className="text-lg font-bold">{date.getDate()}</div>
                    </div>

                    <div className="min-w-0 flex-1">
                      {shift ? (
                        <>
                          {(() => {
                            const assignmentMeta = schedule ? ScheduleService.getAssignmentStateMeta(schedule) : null
                            return (
                              <>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-1.5 rounded-full" style={{ backgroundColor: shift.color }} />
                            <div>
                              <div className="text-sm font-bold text-gray-800">{shift.name}</div>
                              <div className="text-xs text-gray-400">{shift.start_time} - {shift.end_time}</div>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                            {assignmentMeta && <span className={`rounded-full px-2 py-1 font-semibold ${assignmentMeta.tone}`}>{assignmentMeta.label}</span>}
                            {schedule && schedule.status === 'published' && (
                              <span className="rounded-full bg-success-50 px-2 py-1 font-semibold text-success-700">
                                Đã chốt
                              </span>
                            )}
                            {schedule && schedule.modified_after_publish && (
                              <span className="rounded-full border border-primary-200 bg-primary-50 px-2 py-1 font-semibold text-primary-700">
                                Mới cập nhật sau khi đã chốt
                              </span>
                            )}
                          </div>
                              </>
                            )
                          })()}
                        </>
                      ) : (
                        <div>
                          <div className="text-sm font-semibold text-gray-600">
                            {weekPublished ? 'Không có ca' : 'Chưa có lịch chính thức'}
                          </div>
                          <div className="mt-1 text-xs text-gray-400">
                            {weekPublished ? 'Ngày này hiện không được phân ca.' : 'Quản lý chưa chốt tuần này.'}
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-bold text-gray-800">Chi tiết ngày đã chọn</h2>
            <p className="mt-1 text-xs text-gray-400">
              {resolvedSelectedDate ? `${weekdayLong.format(new Date(`${resolvedSelectedDate}T00:00:00`))}, ${fullDate.format(new Date(`${resolvedSelectedDate}T00:00:00`))}` : 'Chọn một ngày để xem chi tiết'}
            </p>

            {selectedSchedule && selectedShift ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl p-4" style={{ background: `${selectedShift.color}12` }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-bold text-gray-800">{selectedShift.name}</div>
                      <div className="mt-1 text-sm text-gray-500">{selectedShift.start_time} - {selectedShift.end_time}</div>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-gray-700">
                      {ScheduleService.getAssignmentStateMeta(selectedSchedule).label}
                    </span>
                  </div>
                </div>

                {selectedStore && (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="mt-0.5 text-gray-400" />
                      <div>
                        <div className="text-xs font-medium text-gray-400">Chi nhánh</div>
                        <div className="text-sm font-bold text-gray-800">{selectedStore.name}</div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedSchedule.modified_after_publish && (
                  <div className="rounded-2xl border border-primary-300 bg-primary-50 px-4 py-4 shadow-sm shadow-primary-100/60">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-white p-2 text-primary-700">
                        <AlertTriangle size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-primary-700">
                            Lịch chính thức đã đổi
                          </span>
                          <span className="text-xs font-semibold text-primary-700">
                            Đã sửa sau khi chốt
                          </span>
                        </div>
                        <div className="mt-2 text-sm font-bold text-primary-900">
                          Ca này không còn giống bản bạn đã xem lúc lịch vừa được chốt.
                        </div>
                        <div className="mt-3 rounded-2xl border border-primary-200 bg-white/80 px-3 py-3">
                          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary-600">
                            Lý do thay đổi
                          </div>
                          <div className="mt-1 text-sm font-semibold text-primary-900">
                            {selectedSchedule.change_reason || 'Chưa có ghi chú lý do thay đổi.'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {weekPublished && user.role === 'employee' && (
                  <button
                    onClick={releaseSelectedShift}
                    className="w-full rounded-2xl border border-primary-200 bg-white px-4 py-3 text-sm font-bold text-primary-700 transition-colors hover:bg-primary-50"
                  >
                    Nhả ca này để đồng nghiệp nhận
                  </button>
                )}

                {selectedAttendance && (
                  <div className="rounded-2xl border border-success-100 bg-success-50 px-4 py-3">
                    <div className="text-sm font-bold text-success-800">Chấm công</div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      <div>
                        <div className="text-[11px] text-success-600">Check-in</div>
                        <div className="text-sm font-bold text-gray-800">{selectedAttendance.check_in_time || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-success-600">Check-out</div>
                        <div className="text-sm font-bold text-gray-800">{selectedAttendance.check_out_time || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-success-600">Tổng giờ</div>
                        <div className="text-sm font-bold text-gray-800">{selectedAttendance.total_hours.toFixed(1)}h</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
                <div className="text-sm font-semibold text-gray-600">
                  {weekPublished ? 'Ngày này không có ca làm' : 'Ngày này chưa có lịch chính thức'}
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  {weekPublished
                    ? 'Nếu bạn cần đổi ca hoặc xin nghỉ, hãy dùng luồng yêu cầu ở giai đoạn tiếp theo.'
                    : 'Quản lý vẫn đang hoàn thiện lịch tuần và chưa chốt cho nhân viên.'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

export default function SchedulePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
            <p className="text-sm font-medium text-gray-500">Đang tải lịch làm việc...</p>
          </div>
        </div>
      }
    >
      <SchedulePageContent />
    </Suspense>
  )
}


