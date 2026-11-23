'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth-store'
import { ScheduleService } from '@/lib/services/schedule-service'
import { getShiftById, getStoreById, mockAttendances, mockEmployees, type Attendance, type Schedule } from '@/lib/mock-data'
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

function getShiftDisplayInfo(schedule: Schedule): {
  name: string
  timeRange: string
  color: string
  hours: number
  startMinutes: number
  startTime: string
  endTime: string
} {
  const known = getShiftById(schedule.shift_id)
  if (known) {
    const startParts = known.start_time.split(':').map(Number)
    const endParts = known.end_time.split(':').map(Number)
    const sh = startParts[0] || 0
    const sm = startParts[1] || 0
    const eh = endParts[0] || 0
    const em = endParts[1] || 0
    let diff = (eh * 60 + em) - (sh * 60 + sm)
    if (diff < 0) diff += 24 * 60
    return {
      name: known.name,
      timeRange: `${known.start_time} - ${known.end_time}`,
      color: known.color,
      hours: Math.round((diff / 60) * 10) / 10,
      startMinutes: sh * 60 + sm,
      startTime: known.start_time,
      endTime: known.end_time,
    }
  }

  const notesText = (schedule.notes || '').trim()
  const match = notesText.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/)
  if (match) {
    const startTime = match[1]
    const endTime = match[2]
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    let diff = (eh * 60 + em) - (sh * 60 + sm)
    if (diff < 0) diff += 24 * 60
    return {
      name: notesText || schedule.shift_id,
      timeRange: `${startTime} - ${endTime}`,
      color: '#7C3AED',
      hours: Math.round((diff / 60) * 10) / 10,
      startMinutes: sh * 60 + sm,
      startTime,
      endTime,
    }
  }

  return {
    name: notesText || schedule.shift_id || 'Ca làm',
    timeRange: 'Theo phân công',
    color: '#2F6FA8',
    hours: 0,
    startMinutes: 9999,
    startTime: '',
    endTime: '',
  }
}

function getAttendanceForDay(employeeId: string, date: string): Attendance | undefined {
  return mockAttendances.find(attendance => attendance.employee_id === employeeId && attendance.date === date)
}

function MySchedulePageContent() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
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

    const nextUrl = nextParams.toString() ? `/schedule?${nextParams.toString()}` : '/schedule'
    router.replace(nextUrl)
  }, [router, searchParams])

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.push('/login?redirect=/my-schedule')
  }, [hasHydrated, isAuthenticated, router])

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
  const [viewEmployeeId, setViewEmployeeId] = useState<string>('')
  const isManagerOrAdmin = ['ceo', 'hr_admin', 'store_manager', 'shift_leader'].includes(user?.role || '')
  const [serverEmployees, setServerEmployees] = useState<Array<{
    id: string
    full_name: string
    employee_code?: string
    store_id?: string
    role?: string
  }>>([])
  const employeeOptions = useMemo(() => {
    const baseList = serverEmployees.length > 0 ? serverEmployees : mockEmployees
    if (!user) return []
    return baseList.filter(
      e =>
        e.id !== user.id &&
        e.role !== 'ceo' &&
        (['ceo', 'hr_admin'].includes(user.role) || e.store_id === user.store_id)
    )
  }, [serverEmployees, user])

  const targetUserId = isManagerOrAdmin && viewEmployeeId ? viewEmployeeId : user?.id || ''
  const targetEmployee = useMemo(() => {
    const baseList = serverEmployees.length > 0 ? serverEmployees : mockEmployees
    return baseList.find(e => e.id === targetUserId) || user
  }, [serverEmployees, targetUserId, user])

  const resolvedSelectedDate = weekStrs.includes(selectedDate)
    ? selectedDate
    : (weekStrs.includes(today) ? today : weekStrs[0]) || today

  const [fetchedData, setFetchedData] = useState<{
    key: string
    schedules: Schedule[]
    weekPublished: boolean
    nextWeekPublished: boolean
  }>({
    key: '',
    schedules: [],
    weekPublished: false,
    nextWeekPublished: false,
  })

  const requestKey =
    targetUserId && weekStrs[0] && weekStrs[6] && nextWeekStrs[0]
      ? `${targetUserId}|${weekStrs[0]}|${weekStrs[6]}|${nextWeekStrs[0]}`
      : ''
  const isLoadingWeek = Boolean(requestKey && fetchedData.key !== requestKey)

  useEffect(() => {
    if (!isManagerOrAdmin) return
    let active = true
    fetch('/api/employees?status=active', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : null))
      .then(json => {
        if (active && json?.success && Array.isArray(json.data)) {
          setServerEmployees(json.data)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [isManagerOrAdmin])

  useEffect(() => {
    if (!requestKey || !targetUserId || !weekStrs[0] || !weekStrs[6] || !nextWeekStrs[0]) return
    let active = true

    const currentParams = new URLSearchParams({
      employee_id: targetUserId,
      from_date: weekStrs[0],
      to_date: weekStrs[6],
      week_start: weekStrs[0],
      published_only: '1',
      include_meta: '1',
    })
    const nextParams = new URLSearchParams({
      employee_id: targetUserId,
      from_date: nextWeekStrs[0],
      to_date: nextWeekStrs[6],
      week_start: nextWeekStrs[0],
      published_only: '1',
      include_meta: '1',
    })

    Promise.all([
      fetch(`/api/schedules?${currentParams.toString()}`, { cache: 'no-store' }).then(res =>
        res.ok ? res.json() : null
      ),
      fetch(`/api/schedules?${nextParams.toString()}`, { cache: 'no-store' }).then(res =>
        res.ok ? res.json() : null
      ),
    ])
      .then(([currentJson, nextJson]) => {
        if (!active) return
        const isCurrPublished = Boolean(currentJson?.is_week_published)
        const list: Schedule[] =
          isCurrPublished && currentJson?.success && Array.isArray(currentJson.data)
            ? currentJson.data.map((s: Record<string, unknown>) => ({
                id: String(s.id || `sch-${Date.now()}`),
                org_id: 'org-001',
                store_id: String(s.store_id || user?.store_id || 'store-001'),
                employee_id: String(s.employee_id || targetUserId),
                employee_name: s.employee_name ? String(s.employee_name) : undefined,
                shift_id: String(s.shift_id || 'shift-001'),
                assigned_position_id: s.assigned_position_id ? String(s.assigned_position_id) : undefined,
                date: String(s.date || '').slice(0, 10),
                notes: s.notes ? String(s.notes) : s.shift_name ? String(s.shift_name) : undefined,
                status: 'published' as const,
                modified_after_publish: Boolean(s.modified_after_publish),
                change_reason: s.change_reason ? String(s.change_reason) : undefined,
                updated_at: String(s.updated_at || new Date().toISOString()),
              }))
            : []

        setFetchedData({
          key: requestKey,
          schedules: list,
          weekPublished: isCurrPublished,
          nextWeekPublished: Boolean(nextJson?.is_week_published),
        })
      })
      .catch(err => {
        console.warn('[MySchedulePage] Lỗi tải lịch chính thức từ /api/schedules:', err)
        if (!active) return
        setFetchedData({
          key: requestKey,
          schedules: [],
          weekPublished: false,
          nextWeekPublished: false,
        })
      })

    return () => {
      active = false
    }
  }, [requestKey, targetUserId, weekStrs, nextWeekStrs, user?.store_id])

  const weekPublished = fetchedData.key === requestKey ? fetchedData.weekPublished : false
  const nextWeekPublished = fetchedData.key === requestKey ? fetchedData.nextWeekPublished : false

  const weekSchedules = useMemo(() => {
    if (!weekPublished || fetchedData.key !== requestKey) return []
    return fetchedData.schedules
      .filter(schedule => weekStrs.includes(schedule.date))
      .sort((a, b) => {
        const d = a.date.localeCompare(b.date)
        if (d !== 0) return d
        return getShiftDisplayInfo(a).startMinutes - getShiftDisplayInfo(b).startMinutes
      })
  }, [fetchedData, requestKey, weekPublished, weekStrs])

  const schedulesByDate = useMemo(() => {
    const nextMap = new Map<string, Schedule[]>()
    weekSchedules.forEach(schedule => {
      const list = nextMap.get(schedule.date) || []
      list.push(schedule)
      list.sort((a, b) => getShiftDisplayInfo(a).startMinutes - getShiftDisplayInfo(b).startMinutes)
      nextMap.set(schedule.date, list)
    })
    return nextMap
  }, [weekSchedules])

  const weekStateMeta = useMemo(() => {
    if (isLoadingWeek) {
      return {
        label: 'Đang tải lịch tuần',
        tone: 'bg-gray-100 text-gray-600 border-gray-200',
        description: 'Đang kiểm tra trạng thái chốt lịch chính thức từ đám mây...',
      }
    }
    if (weekPublished) {
      return {
        label: 'Đã chốt chính thức',
        tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        description: 'Đây là lịch đi làm chính thức do Quản lý đã chốt trên Homies.',
      }
    }
    return {
      label: 'Chưa chốt lịch',
      tone: 'bg-amber-50 text-amber-800 border-amber-200',
      description: 'Quản lý đang xếp lịch, tuần này chưa có lịch chính thức.',
    }
  }, [isLoadingWeek, weekPublished])

  const todaySchedules = schedulesByDate.get(today) || []
  const selectedSchedules = schedulesByDate.get(resolvedSelectedDate) || []
  const selectedAttendance = targetUserId ? getAttendanceForDay(targetUserId, resolvedSelectedDate) : undefined
  const changedCount = weekSchedules.filter(schedule => schedule.modified_after_publish).length
  const totalHours = weekSchedules.reduce((sum, schedule) => {
    return sum + getShiftDisplayInfo(schedule).hours
  }, 0)

  const nextShift = weekSchedules.find(schedule => schedule.date >= today)
  const weekLabel = `${monthDay.format(weekDates[0])} - ${monthDay.format(weekDates[6])}`

  const releaseShift = (schedule: Schedule) => {
    const info = getShiftDisplayInfo(schedule)
    const storeName = getStoreById(schedule.store_id)?.name || schedule.store_id
    if (!user) return
    const confirmed = window.confirm(
      `Nhả ${info.name} (${info.timeRange}) ngày ${schedule.date} ra danh sách ca trống để đồng nghiệp có thể đăng ký nhận?`
    )
    if (!confirmed) return
    const created = releasePublishedShift(
      schedule.id,
      user.id,
      `Nhân viên ${user.full_name} chủ động nhả ca cần hỗ trợ`,
      {
        schedule,
        employee: {
          id: user.id,
          full_name: user.full_name,
          position_id: schedule.assigned_position_id || user.position_id || 'pos-001',
        },
      }
    )
    if (!created) {
      window.alert('Không thể nhả ca này. Chỉ chủ ca chính thức mới được nhả ca ra danh sách ca trống.')
      return
    }
    notifyOpenShiftCreated({
      openShiftId: created.id,
      storeId: created.store_id,
      storeName,
      shiftId: created.shift_id,
      shiftName: info.name,
      startTime: info.startTime,
      endTime: info.endTime,
      date: created.date,
      positionId: created.position_id,
      positionName: 'Ca trống cần người phù hợp',
      createdByName: user.full_name,
    })
    router.push(`/schedule/open-shifts?tab=my&openShiftId=${created.id}`)
  }

  if (!hasHydrated) {
    return (
      <AppShell showNav>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
        </div>
      </AppShell>
    )
  }

  if (!user || !isAuthenticated) return null

  return (
    <AppShell showNav>
      <div className="animate-fade-in space-y-5 pb-20">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-800">
              {isManagerOrAdmin && targetEmployee && targetUserId !== user.id
                ? `Lịch cá nhân: ${targetEmployee.full_name}`
                : 'Lịch của tôi'}
            </h1>
            <p className="mt-0.5 text-xs text-gray-400">
              Xem lịch tuần chính thức, thay đổi mới và chi tiết từng ca làm.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => router.push('/shifts/register')}
              className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-bold text-sky-800 transition-colors hover:bg-sky-100 shadow-2xs cursor-pointer"
            >
              <CalendarDays size={14} className="text-sky-600" />
              Đăng ký ca tuần
            </button>

            {isManagerOrAdmin && (
              <div className="flex flex-wrap items-center gap-2">
                {/* Bộ lọc chọn nhân viên dành cho CEO / Quản lý */}
                <div className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-1.5">
                <span className="text-xs font-bold text-[#2F6FA8]">Nhân viên:</span>
                <select
                  value={targetUserId}
                  onChange={e => setViewEmployeeId(e.target.value)}
                  className="rounded-lg border border-blue-300 bg-white px-2.5 py-1 text-xs font-bold text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-[#2F6FA8] cursor-pointer"
                >
                  <option value={user.id}>Chính tôi ({user.full_name})</option>
                  {employeeOptions.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} {emp.employee_code ? `(${emp.employee_code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => router.push('/schedule')}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-vanilla-50"
              >
                <Settings2 size={14} /> Quản lý phân ca
              </button>
              <button
                onClick={() => router.push(`/schedule/history?storeId=${user.store_id}&weekStart=${weekStrs[0]}`)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-vanilla-50 px-3 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-primary-50"
              >
                <History size={14} /> Lịch sử thay đổi
              </button>
            </div>
          )}
        </div>
      </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setWeekOffset(offset => offset - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-primary-50"
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
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-primary-50"
            >
              <ChevronRight size={18} className="text-gray-500" />
            </button>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-gray-100 bg-vanilla-50 p-4">
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
                {weekStateMeta.description}
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
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                  <Clock3 size={16} className="text-primary-600" />
                  Ca hôm nay
                </div>
                {todaySchedules.length > 1 && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-[#2F6FA8]">
                    {todaySchedules.length} ca
                  </span>
                )}
              </div>
              {todaySchedules.length > 0 ? (
                <div className="mt-3 space-y-2.5">
                  {todaySchedules.map(todaySchedule => {
                    const info = getShiftDisplayInfo(todaySchedule)
                    const assignmentMeta = ScheduleService.getAssignmentStateMeta(todaySchedule)
                    return (
                      <div key={todaySchedule.id} className="rounded-2xl border border-primary-100 bg-primary-50 p-3.5">
                        <div className="text-sm font-bold text-gray-800">{info.name}</div>
                        <div className="mt-1 text-xs text-gray-500">{info.timeRange}</div>
                        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px]">
                          <span className={`inline-flex items-center rounded-full bg-white px-2 py-1 font-bold ${assignmentMeta.tone}`}>
                            {assignmentMeta.label}
                          </span>
                          {todaySchedule.change_reason && (
                            <span className="text-gray-500">Lý do thay đổi: {todaySchedule.change_reason}</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="mt-3 rounded-2xl border border-dashed border-gray-200 bg-vanilla-50 px-4 py-5 text-sm text-gray-500">
                  {isLoadingWeek
                    ? 'Đang tải lịch hôm nay...'
                    : weekPublished
                    ? 'Hôm nay bạn không có ca làm.'
                    : 'Quản lý đang xếp lịch, tuần này chưa có lịch chính thức.'}
                </div>
              )}
            </div>
          </div>
        </div>

        {user.role === 'employee' && weekPublished && (
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => router.push('/schedule/swap')}
              className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-colors hover:bg-vanilla-50"
            >
              <div>
                <div className="text-sm font-bold text-gray-800">Đổi ca / nhờ thay ca</div>
                <div className="mt-1 text-xs text-gray-400">Theo dõi đủ trạng thái: chờ đồng nghiệp, chờ quản lý, đã duyệt hoặc bị từ chối.</div>
              </div>
              <Shuffle size={18} className="text-primary-600" />
            </button>
            <button
              onClick={() => router.push('/schedule/open-shifts')}
              className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-colors hover:bg-vanilla-50"
            >
              <div>
                <div className="text-sm font-bold text-gray-800">Nhận ca trống</div>
                <div className="mt-1 text-xs text-gray-400">Xem trạng thái ca trống, gửi yêu cầu nhận và theo dõi chờ duyệt hoặc tự duyệt.</div>
              </div>
              <Send size={18} className="text-primary-600" />
            </button>
          </div>
        )}

        {!isLoadingWeek && !weekPublished && (
          <div className="rounded-2xl border border-warning-200 bg-warning-50 px-4 py-3.5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={16} className="mt-0.5 text-warning-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-warning-800">Quản lý đang xếp lịch, tuần này chưa có lịch chính thức</p>
                <p className="mt-1 text-xs leading-relaxed text-warning-700">
                  Nhân viên chỉ nhìn thấy lịch đi làm sau khi Quản lý bấm Chốt Lịch Chính Thức trên Homies. Bản nháp đang sắp xếp và lịch rảnh sẽ không hiển thị tại đây.
                </p>
              </div>
            </div>
          </div>
        )}

        {user.role === 'employee' && !nextWeekPublished && weekPublished && (
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
                const daySchedules = schedulesByDate.get(dateStr) || []
                const isTodayDate = dateStr === today
                const isSelected = resolvedSelectedDate === dateStr

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-primary-200 bg-primary-50'
                        : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-vanilla-50'
                    }`}
                  >
                    <div className={`w-14 shrink-0 text-center pt-0.5 ${isTodayDate ? 'text-primary-700' : 'text-gray-500'}`}>
                      <div className="text-[11px] font-bold uppercase">{weekdayShort.format(date)}</div>
                      <div className="text-lg font-bold">{date.getDate()}</div>
                      {daySchedules.length > 1 && (
                        <div className="mt-1 inline-block rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-[#2F6FA8]">
                          {daySchedules.length} ca
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-2.5">
                      {daySchedules.length > 0 ? (
                        daySchedules.map(schedule => {
                          const info = getShiftDisplayInfo(schedule)
                          const assignmentMeta = ScheduleService.getAssignmentStateMeta(schedule)
                          return (
                            <div
                              key={schedule.id}
                              className="rounded-xl border border-gray-100/80 bg-white/80 p-2.5"
                            >
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-1.5 rounded-full shrink-0" style={{ backgroundColor: info.color }} />
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-bold text-gray-800 truncate">{info.name}</div>
                                  <div className="text-xs text-gray-400">{info.timeRange}</div>
                                </div>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                                <span className={`rounded-full px-2 py-0.5 font-semibold ${assignmentMeta.tone}`}>
                                  {assignmentMeta.label}
                                </span>
                                <span className="rounded-full bg-success-50 px-2 py-0.5 font-semibold text-success-700">
                                  Đã chốt
                                </span>
                                {schedule.modified_after_publish && (
                                  <span className="rounded-full border border-primary-200 bg-primary-50 px-2 py-0.5 font-semibold text-primary-700">
                                    Mới cập nhật sau khi đã chốt
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="py-1">
                          <div className="text-sm font-semibold text-gray-600">
                            {isLoadingWeek ? 'Đang kiểm tra...' : weekPublished ? 'Không có ca' : 'Chưa có lịch chính thức'}
                          </div>
                          <div className="mt-1 text-xs text-gray-400">
                            {isLoadingWeek
                              ? 'Đang tải dữ liệu tuần từ đám mây.'
                              : weekPublished
                              ? 'Ngày này hiện không được phân ca.'
                              : 'Quản lý đang xếp lịch, tuần này chưa có lịch chính thức.'}
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

            {selectedSchedules.length > 0 ? (
              <div className="mt-4 space-y-4">
                {selectedSchedules.map(schedule => {
                  const info = getShiftDisplayInfo(schedule)
                  const store = getStoreById(schedule.store_id)
                  return (
                    <div key={schedule.id} className="space-y-3 rounded-2xl border border-gray-100 p-3">
                      <div className="rounded-2xl p-4" style={{ background: `${info.color}12` }}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-base font-bold text-gray-800">{info.name}</div>
                            <div className="mt-1 text-sm text-gray-500">{info.timeRange}</div>
                          </div>
                          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-gray-700">
                            {ScheduleService.getAssignmentStateMeta(schedule).label}
                          </span>
                        </div>
                      </div>

                      {store && (
                        <div className="rounded-2xl border border-gray-100 bg-vanilla-50 px-4 py-3">
                          <div className="flex items-start gap-3">
                            <MapPin size={16} className="mt-0.5 text-gray-400" />
                            <div>
                              <div className="text-xs font-medium text-gray-400">Chi nhánh</div>
                              <div className="text-sm font-bold text-gray-800">{store.name}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {schedule.modified_after_publish && (
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
                                  {schedule.change_reason || 'Chưa có ghi chú lý do thay đổi.'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {weekPublished && user.role === 'employee' && (
                        <button
                          onClick={() => releaseShift(schedule)}
                          className="w-full rounded-2xl border border-primary-200 bg-white px-4 py-2.5 text-sm font-bold text-primary-700 transition-colors hover:bg-primary-50"
                        >
                          Nhả ca này để đồng nghiệp nhận
                        </button>
                      )}
                    </div>
                  )
                })}

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
                        <div className="text-sm font-bold text-gray-800">{(selectedAttendance.total_hours || 0).toFixed(1)}h</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-vanilla-50 px-4 py-8 text-center">
                <div className="text-sm font-semibold text-gray-600">
                  {isLoadingWeek
                    ? 'Đang tải chi tiết...'
                    : weekPublished
                    ? 'Ngày này không có ca làm'
                    : 'Quản lý đang xếp lịch, tuần này chưa có lịch chính thức'}
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  {isLoadingWeek
                    ? 'Đang kiểm tra lịch đã chốt từ hệ thống.'
                    : weekPublished
                    ? 'Nếu bạn cần đổi ca hoặc xin nghỉ, hãy dùng mục Xin đổi ca.'
                    : 'Khi nào Quản lý bấm Chốt Lịch Chính Thức trên Homies, ca làm của bạn sẽ hiện đầy đủ tại đây.'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

export default function MySchedulePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-vanilla-50">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
            <p className="text-sm font-medium text-gray-500">Đang tải lịch làm việc...</p>
          </div>
        </div>
      }
    >
      <MySchedulePageContent />
    </Suspense>
  )
}
