'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter, useSearchParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import {
  mockStores,
  getPositionById,
} from '@/lib/mock-data'
import { storeAdapter, employeeAdapter } from '@/lib/adapters'
import { EmployeeService } from '@/lib/services/employee-service'
import { ScheduleService } from '@/lib/services/schedule-service'
import { ShiftTemplateService } from '@/lib/services/shift-template-service'
import { getRegistrationWeekByWeek } from '@/lib/mock-data-registration-weeks'
import { getInitials } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Plus, X, Copy, Search, CheckCircle2, AlertTriangle, History, Save } from 'lucide-react'

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

type CoverageFilter = 'all' | 'assigned' | 'unassigned'

function toDateString(date: Date) {
  return date.toISOString().split('T')[0]
}

function getWeekAnchor(rawWeekStart: string | null): Date {
  if (rawWeekStart) {
    const parsed = new Date(`${rawWeekStart}T00:00:00`)
    if (!Number.isNaN(parsed.getTime())) {
      const monday = new Date(parsed)
      const day = monday.getDay()
      monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1))
      return monday
    }
  }

  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1))
  return monday
}

const weekStatusStyles: Record<string, { label: string; badge: string; note: string }> = {
  published: {
    label: 'Đã xuất bản',
    badge: 'bg-success-50 text-success-700 border-success-200',
    note: 'Tuần này đã chốt và đang là lịch chính thức.',
  },
  reviewing: {
    label: 'Đang duyệt',
    badge: 'bg-warning-50 text-warning-700 border-warning-200',
    note: 'Lịch đang trong giai đoạn rà soát trước khi publish.',
  },
  open: {
    label: 'Đang mở đăng ký',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    note: 'Nhân viên vẫn có thể đăng ký ca mong muốn cho tuần này.',
  },
  closed: {
    label: 'Đã đóng đăng ký',
    badge: 'bg-primary-50 text-gray-700 border-gray-200',
    note: 'Đã khóa đăng ký và đang chờ manager xếp lịch.',
  },
  draft: {
    label: 'Nháp thủ công',
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    note: 'Tuần này chưa có bản publish, đang là bản draft nội bộ.',
  },
  empty: {
    label: 'Chưa cấu hình',
    badge: 'bg-primary-50 text-gray-600 border-gray-200',
    note: 'Tuần này chưa có registration week hoặc chưa tạo lịch.',
  },
}

function getWarningSignature(warning: {
  type: string
  employee_id?: string
  date?: string
  shift_id?: string
  code?: string
}) {
  return [
    warning.type,
    warning.employee_id || '',
    warning.date || '',
    warning.shift_id || '',
    warning.code || '',
  ].join(':')
}

function ScheduleManagePageContent() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [weekOffset, setWeekOffset] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{ empId: string; date: string } | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [search, setSearch] = useState('')
  const [positionFilter, setPositionFilter] = useState('all')
  const [coverageFilter, setCoverageFilter] = useState<CoverageFilter>('all')
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [changeReason, setChangeReason] = useState('')
  const [focusEmployeeId, setFocusEmployeeId] = useState<string | null>(null)
  const [selectedStoreId, setSelectedStoreId] = useState(() => {
    const requestedStoreId = searchParams.get('storeId')
    return requestedStoreId || 'store-001'
  })
  const [stores, setStores] = useState(mockStores)

  useEffect(() => {
    storeAdapter.getStores().then(res => setStores(res))
    employeeAdapter.getAllEmployees().then(res => {
      if (res && res.length) {
        EmployeeService.syncEmployeesFromAdapter(res)
        setRefreshTrigger(k => k + 1)
      }
    })
  }, [])

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated || !user || user.role === 'employee') return
    const nextSearch = searchParams.toString()
    router.replace(nextSearch ? `/schedules?${nextSearch}` : '/schedules')
  }, [isAuthenticated, router, searchParams, user])

  useEffect(() => {
    if (!actionMessage) return
    const timer = window.setTimeout(() => setActionMessage(null), 3500)
    return () => window.clearTimeout(timer)
  }, [actionMessage])

  const focusDate = searchParams.get('focusDate') || ''
  const weekAnchor = useMemo(
    () => getWeekAnchor(searchParams.get('weekStart')),
    [searchParams],
  )

  const availableStores = useMemo(() => {
    if (!user) return []
    if (user.role === 'ceo' || user.role === 'hr_admin') {
      return stores.filter(store => store.is_active)
    }
    return stores.filter(store => store.id === user.store_id)
  }, [user, stores])

  const activeStoreId = useMemo(() => {
    if (!user) return selectedStoreId
    if (user.role === 'ceo' || user.role === 'hr_admin') {
      return availableStores.some(store => store.id === selectedStoreId)
        ? selectedStoreId
        : availableStores[0]?.id || user.store_id
    }
    return user.store_id
  }, [availableStores, selectedStoreId, user])

  const weekDates = useMemo(() => {
    const monday = new Date(weekAnchor)
    monday.setDate(weekAnchor.getDate() + weekOffset * 7)
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + index)
      return date
    })
  }, [weekAnchor, weekOffset])

  const previousWeekStrs = useMemo(() => {
    return weekDates.map(date => {
      const previous = new Date(date)
      previous.setDate(date.getDate() - 7)
      return toDateString(previous)
    })
  }, [weekDates])

  const weekStrs = useMemo(() => weekDates.map(toDateString), [weekDates])
  const today = toDateString(new Date())

  const weekSchedules = useMemo(() => {
    void refreshTrigger
    return user ? ScheduleService.getStoreSchedules(user, activeStoreId, weekStrs) : []
  }, [activeStoreId, refreshTrigger, weekStrs, user])

  const registrationWeek = useMemo(
    () => getRegistrationWeekByWeek(activeStoreId, weekStrs[0]),
    [activeStoreId, weekStrs],
  )

  const storeEmps = useMemo(() => {
    if (!user) return []
    return ScheduleService.getEligibleEmployees(user, activeStoreId)
  }, [user, activeStoreId])

  const isPublished = useMemo(() => {
    return activeStoreId && weekStrs[0] ? ScheduleService.isWeekPublished(activeStoreId, weekStrs[0]) : false
  }, [activeStoreId, weekStrs])
  const weekMeta = useMemo(() => {
    return activeStoreId && weekStrs[0] ? ScheduleService.getWeekMeta(activeStoreId, weekStrs[0]) : null
  }, [activeStoreId, weekStrs])
  const weekWarnings = useMemo(() => {
    if (!user) return []
    return ScheduleService.validateWeekSchedules(user, activeStoreId, weekStrs)
  }, [user, activeStoreId, weekStrs])
  const blockingWarnings = useMemo(() => {
    if (!user) return []
    return ScheduleService.getBlockingWeekWarnings(user, activeStoreId, weekStrs)
  }, [user, activeStoreId, weekStrs])
  const publishSummary = useMemo(() => {
    if (!user) return null
    return ScheduleService.getPublishSummary(user, activeStoreId, weekStrs)
  }, [user, activeStoreId, weekStrs])
  const shiftTemplates = useMemo(() => {
    return ShiftTemplateService.getActiveForStore(activeStoreId)
  }, [activeStoreId])

  if (!user || user.role === 'employee') {
    return (
      <AppShell title="Xếp lịch">
        <div className="py-20 text-center" style={{ color: 'var(--text-muted)' }}>
          Không có quyền
        </div>
      </AppShell>
    )
  }

  const positionOptions = Array.from(new Set(storeEmps.map(emp => emp.position_id)))
    .map(positionId => ({ id: positionId, name: getPositionById(positionId)?.name || positionId }))

  const filteredEmployees = storeEmps.filter(emp => {
    const name = emp.full_name.toLowerCase()
    const code = emp.employee_code.toLowerCase()
    const positionName = getPositionById(emp.position_id)?.name.toLowerCase() || ''
    const matchesSearch = !search || name.includes(search.toLowerCase()) || code.includes(search.toLowerCase()) || positionName.includes(search.toLowerCase())
    const matchesPosition = positionFilter === 'all' || emp.position_id === positionFilter
    const hasShiftThisWeek = weekSchedules.some(schedule => schedule.employee_id === emp.id)
    const matchesCoverage =
      coverageFilter === 'all' ||
      (coverageFilter === 'assigned' && hasShiftThisWeek) ||
      (coverageFilter === 'unassigned' && !hasShiftThisWeek)

    return matchesSearch && matchesPosition && matchesCoverage
  })

  const addSchedule = (empId: string, date: string, shiftId: string) => {
    const result = ScheduleService.assignSchedule(
      user!,
      activeStoreId,
      empId,
      shiftId,
      date,
      undefined,
      isPublished ? changeReason.trim() : undefined
    )
    if (!result) {
      setActionMessage(
        isPublished
          ? 'Không thể lưu thay đổi. Vui lòng nhập lý do hợp lệ hoặc kiểm tra trạng thái nhân viên.'
          : 'Không thể xếp ca cho nhân viên này.'
      )
      return
    }
    setRefreshTrigger(prev => prev + 1)
    setShowAddModal(false)
    setSelectedCell(null)
    setChangeReason('')
    setActionMessage(isPublished ? 'Đã cập nhật ca và ghi nhận thay đổi sau publish.' : 'Đã thêm ca vào lịch tuần.')
  }

  const removeSchedule = (id: string) => {
    const target = weekSchedules.find(schedule => schedule.id === id)
    if (!target) return
    const reason = isPublished ? prompt('Nhập lý do thay đổi lịch sau khi đã publish:') || '' : ''
    if (isPublished && !reason.trim()) {
      setActionMessage('Cần nhập lý do khi hủy ca sau publish.')
      return
    }
    const success = ScheduleService.deleteSchedule(user!, activeStoreId, target.employee_id, target.date, reason)
    if (!success) {
      setActionMessage('Không thể gỡ ca. Vui lòng kiểm tra lại quyền hoặc lý do thay đổi.')
      return
    }
    setRefreshTrigger(prev => prev + 1)
    setActionMessage(isPublished ? 'Đã hủy ca và lưu lý do thay đổi.' : 'Đã gỡ ca khỏi lịch tuần.')
  }


  const handlePublishWeek = () => {
    if (!user || !activeStoreId || !weekStrs[0]) return
    if (blockingWarnings.length > 0) {
      setActionMessage(`Chưa thể xuất bản. Cần xử lý ${blockingWarnings.length} lỗi chặn trong tuần này trước.`)
      return
    }
    const confirmed = confirm(
      isPublished
        ? 'Lịch tuần này đã xuất bản rồi. Bạn có muốn xuất bản lại để cập nhật các thay đổi không?'
        : 'Bạn có chắc chắn muốn xuất bản lịch tuần này cho toàn bộ nhân viên không?'
    )
    if (!confirmed) return

    const success = ScheduleService.publishWeek(user, activeStoreId, weekStrs)
    if (success) {
      setRefreshTrigger(prev => prev + 1)
      setActionMessage('Đã xuất bản lịch tuần thành công! Nhân viên đã có thể xem lịch chính thức.')
    } else {
      setActionMessage('Không thể xuất bản lịch tuần. Vui lòng kiểm tra quyền hạn.')
    }
  }

  const handleSaveDraft = () => {
    const success = ScheduleService.saveDraftWeek(user!, activeStoreId, weekStrs)
    setRefreshTrigger(prev => prev + 1)
    setActionMessage(success ? 'Đã lưu nháp lịch tuần.' : 'Không thể lưu nháp lịch tuần.')
  }

  const handleCopyPreviousWeek = () => {
    if (isPublished) {
      setActionMessage('Không thể copy vào một tuần đã xuất bản. Hãy chỉnh trực tiếp từng ca và nhập lý do thay đổi.')
      return
    }
    const hasExistingSchedules = weekSchedules.length > 0
    if (hasExistingSchedules) {
      const confirmed = confirm('Tuần này đã có một phần lịch. Hệ thống chỉ copy vào các ô còn trống, bạn muốn tiếp tục chứ?')
      if (!confirmed) return
    }

    const copied = ScheduleService.copyPreviousWeekDetailed(user!, activeStoreId, previousWeekStrs, weekStrs)
    setRefreshTrigger(prev => prev + 1)
    setActionMessage(
      copied.copied > 0
        ? `Đã copy ${copied.copied} ca. Bỏ qua ${copied.skipped_invalid_employee} ca do nhân sự không còn hợp lệ và ${copied.skipped_existing_assignment} ca do tuần này đã có lịch.`
        : 'Không có ca mới nào được copy. Có thể tuần trước trống hoặc tuần này đã có đủ lịch.',
    )
  }

  const weekLabel = `${weekDates[0].getDate()}/${weekDates[0].getMonth() + 1} - ${weekDates[6].getDate()}/${weekDates[6].getMonth() + 1}`
  const storeName = availableStores.find(store => store.id === activeStoreId)?.name || 'Cửa hàng'
  const assignedEmployeeCount = new Set(weekSchedules.map(schedule => schedule.employee_id)).size
  const unassignedEmployeeCount = Math.max(storeEmps.length - assignedEmployeeCount, 0)
  const weekStatusKey = isPublished
    ? 'published'
    : (weekMeta?.status || registrationWeek?.status || (weekSchedules.length > 0 ? 'draft' : 'empty'))
  const weekStatus = weekStatusStyles[weekStatusKey]
  const blockingWarningSignatures = new Set(blockingWarnings.map(getWarningSignature))
  const jumpToWarning = (employeeId?: string, date?: string) => {
    if (employeeId) {
      const employee = storeEmps.find(item => item.id === employeeId)
      if (employee) setSearch(employee.full_name)
      setFocusEmployeeId(employeeId)
      requestAnimationFrame(() => {
        document.getElementById(`schedule-row-${employeeId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }
    if (date) {
      router.replace(`/schedule/manage?storeId=${activeStoreId}&weekStart=${weekStrs[0]}&focusDate=${date}`)
    }
  }

  return (
    <AppShell showNav>
      <div className="animate-fade-in space-y-5 pb-20">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-800">Xếp lịch làm việc</h1>
          <p className="mt-0.5 text-xs text-gray-400">Bảng phân ca hàng tuần cho nhân viên</p>
        </div>

        <div className="flex w-full gap-1 rounded-2xl border border-gray-200/50 bg-primary-50 p-1">
          <button
            onClick={() => router.push('/schedule/manage')}
            className="flex-1 rounded-xl bg-white px-3 py-2 text-xs font-bold text-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all"
          >
            Quản lý phân ca
          </button>
          <button
            onClick={() => router.push('/schedule/admin/registration')}
            className="flex-1 px-3 py-2 text-xs font-bold text-gray-500 transition-all hover:text-gray-700"
          >
            Cấu hình mở ca
          </button>
          <button
            onClick={() => router.push(`/schedule/admin/review?weekStart=${weekStrs[0]}`)}
            className="flex-1 px-3 py-2 text-xs font-bold text-gray-500 transition-all hover:text-gray-700"
          >
            Duyệt ca & Sắp xếp
          </button>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setWeekOffset(offset => offset - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-primary-50"
            >
              <ChevronLeft size={20} className="text-gray-500" />
            </button>
            <div className="text-center">
              <span className="block text-base font-bold tracking-tight text-gray-800">
                Tuần {weekLabel}
              </span>
              <button
                onClick={() => setWeekOffset(0)}
                className="text-[10px] font-bold text-primary-600 transition-colors hover:text-primary-700"
              >
                {weekOffset === 0 ? 'Tuần này' : 'Quay lại tuần này'}
              </button>
            </div>
            <button
              onClick={() => setWeekOffset(offset => offset + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-primary-50"
            >
              <ChevronRight size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-[1.3fr_1fr]">
            <div className="rounded-2xl border border-gray-100 bg-vanilla-50 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${weekStatus.badge}`}>
                  {weekStatus.label}
                </span>
                <span className="text-xs font-semibold text-gray-700">{storeName}</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">{weekStatus.note}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-gray-500">
                <span>{weekSchedules.length} ca trong tuần</span>
                <span>{assignedEmployeeCount}/{storeEmps.length} nhân viên đã có lịch</span>
                <span>{unassignedEmployeeCount} nhân viên còn trống</span>
                {registrationWeek?.registration_deadline && (
                  <span>Deadline đăng ký: {registrationWeek.registration_deadline.replace('T', ' ')}</span>
                )}
              </div>
              {focusDate && weekStrs.includes(focusDate) && (
                <div className="mt-3 rounded-xl bg-warning-50 px-3 py-2 text-xs font-medium text-warning-700">
                  Đang focus ngày {focusDate.slice(8, 10)}/{focusDate.slice(5, 7)} từ luồng staffing.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-3">
              <div className="flex flex-col gap-2">
                {(user.role === 'ceo' || user.role === 'hr_admin') && (
                  <select
                    value={activeStoreId}
                    onChange={event => setSelectedStoreId(event.target.value)}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700"
                  >
                    {availableStores.map(store => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                )}

                <div className="grid gap-2 md:grid-cols-2">
                  <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-vanilla-50 px-3 py-2 text-xs text-gray-500">
                    <Search size={14} />
                    <input
                      value={search}
                      onChange={event => setSearch(event.target.value)}
                      placeholder="Tìm tên, mã NV, vị trí..."
                      className="w-full bg-transparent text-gray-700 outline-none placeholder:text-gray-400"
                    />
                  </label>

                  <select
                    value={positionFilter}
                    onChange={event => setPositionFilter(event.target.value)}
                    className="rounded-xl border border-gray-200 bg-vanilla-50 px-3 py-2 text-xs font-medium text-gray-700"
                  >
                    <option value="all">Tất cả vị trí</option>
                    {positionOptions.map(position => (
                      <option key={position.id} value={position.id}>
                        {position.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'all', label: 'Toàn bộ' },
                    { key: 'assigned', label: 'Đã có lịch' },
                    { key: 'unassigned', label: 'Chưa có lịch' },
                  ].map(option => (
                    <button
                      key={option.key}
                      onClick={() => setCoverageFilter(option.key as CoverageFilter)}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
                        coverageFilter === option.key
                          ? 'bg-primary text-white'
                          : 'bg-primary-50 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleSaveDraft}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-vanilla-50"
                >
                  <Save size={14} /> Lưu nháp
                </button>

                <button
                  onClick={handleCopyPreviousWeek}
                  disabled={isPublished}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                    isPublished
                      ? 'cursor-not-allowed border-gray-200 bg-primary-50 text-gray-400'
                      : 'border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100'
                  }`}
                >
                  <Copy size={14} /> Copy lịch từ tuần trước
                </button>

                <button
                  onClick={handlePublishWeek}
                  disabled={blockingWarnings.length > 0}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all shadow-sm ${
                    blockingWarnings.length > 0
                      ? 'cursor-not-allowed border-gray-200 bg-primary-50 text-gray-400 shadow-none'
                      : isPublished
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'border-transparent bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  <CheckCircle2 size={14} /> {isPublished ? 'Xuất bản lại tuần này' : 'Xuất bản lịch tuần này'}
                </button>

                <button
                  onClick={() => router.push(`/schedule/history?storeId=${activeStoreId}&weekStart=${weekStrs[0]}`)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-vanilla-50 px-3 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-primary-50"
                >
                  <History size={14} /> Lịch sử thay đổi
                </button>
                <button
                  onClick={() => router.push('/schedule/templates')}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-vanilla-50 px-3 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-primary-50"
                >
                  Templates ca
                </button>
              </div>
            </div>
          </div>
        </div>

        {publishSummary && (
          <div className="grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:grid-cols-5">
            <div className="rounded-xl bg-vanilla-50 p-3">
              <p className="text-[11px] text-gray-400">Tổng ca</p>
              <p className="mt-1 text-lg font-bold text-gray-800">{publishSummary.totalAssignments}</p>
            </div>
            <div className="rounded-xl bg-vanilla-50 p-3">
              <p className="text-[11px] text-gray-400">Nhân sự đã có lịch</p>
              <p className="mt-1 text-lg font-bold text-gray-800">{publishSummary.assignedEmployees}</p>
            </div>
            <div className="rounded-xl bg-vanilla-50 p-3">
              <p className="text-[11px] text-gray-400">Nhân sự còn trống</p>
              <p className="mt-1 text-lg font-bold text-gray-800">{publishSummary.unassignedEmployees}</p>
            </div>
            <div className="rounded-xl bg-error-50 p-3">
              <p className="text-[11px] text-error-500">Lỗi chặn</p>
              <p className="mt-1 text-lg font-bold text-error-700">{publishSummary.blockingWarnings.length}</p>
            </div>
            <div className="rounded-xl bg-primary-50 p-3">
              <p className="text-[11px] text-primary-500">Đổi sau publish</p>
              <p className="mt-1 text-lg font-bold text-primary-700">{publishSummary.changedAfterPublishCount}</p>
            </div>
          </div>
        )}

        {weekWarnings.length > 0 && (
          <div className={`rounded-2xl px-4 py-3 ${blockingWarnings.length > 0 ? 'border border-error-200 bg-error-50' : 'border border-amber-200 bg-amber-50'}`}>
            <div className={`mb-2 flex items-center gap-2 text-sm font-bold ${blockingWarnings.length > 0 ? 'text-error-800' : 'text-amber-800'}`}>
              <AlertTriangle size={16} />
              {blockingWarnings.length > 0 ? 'Lỗi chặn xuất bản' : 'Cảnh báo lịch tuần'}
            </div>
            <div className="space-y-2">
              {weekWarnings.slice(0, 6).map((warning, index) => (
                <div
                  key={`${warning.type}-${warning.employee_id || 'store'}-${warning.date || index}`}
                  className={`flex flex-col gap-2 rounded-xl border px-3 py-2 text-xs ${
                    blockingWarningSignatures.has(getWarningSignature(warning))
                      ? 'border-error-200 bg-white text-error-700'
                      : 'border-amber-200 bg-white text-amber-700'
                  } md:flex-row md:items-center md:justify-between`}
                >
                  <div className="space-y-1">
                    <p className="font-bold">{warning.code || warning.type}</p>
                    <p>{warning.message}</p>
                    {(warning.employee_id || warning.date) && (
                      <p className="text-[11px] opacity-80">
                        {warning.employee_id ? `NV: ${EmployeeService.getEmployeeById(warning.employee_id)?.full_name || warning.employee_id}` : ''} {warning.date ? `· Ngày: ${warning.date}` : ''}
                      </p>
                    )}
                  </div>
                  {(warning.employee_id || warning.date) && (
                    <button
                      onClick={() => jumpToWarning(warning.employee_id, warning.date)}
                      className="rounded-lg border border-current/20 px-2.5 py-1 font-bold"
                    >
                      Đưa tới ô lỗi
                    </button>
                  )}
                </div>
              ))}
              {weekWarnings.length > 6 && <p className={`text-xs ${blockingWarnings.length > 0 ? 'text-error-700' : 'text-amber-700'}`}>Còn {weekWarnings.length - 6} cảnh báo khác chưa hiển thị.</p>}
            </div>
          </div>
        )}

        {actionMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {actionMessage}
          </div>
        )}

        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-xs" style={{ minWidth: '680px' }}>
            <thead>
              <tr>
                <th
                  className="sticky left-0 py-2 px-1 text-left font-semibold"
                  style={{ background: 'var(--background)', width: '140px', color: 'var(--text-secondary)' }}
                >
                  Nhân viên
                </th>
                {weekDates.map((date, index) => {
                  const isToday = weekStrs[index] === today
                  const isFocused = weekStrs[index] === focusDate
                  return (
                    <th
                      key={weekStrs[index]}
                      className="rounded-lg px-1 py-2 text-center font-semibold"
                      style={{
                        color: isFocused ? '#B45309' : isToday ? 'var(--primary)' : 'var(--text-secondary)',
                        background: isFocused ? '#FFF8E8' : isToday ? 'var(--primary-50)' : undefined,
                      }}
                    >
                      <div>{DAY_LABELS[index]}</div>
                      <div className="font-bold">{date.getDate()}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => (
                <tr
                  key={emp.id}
                  id={`schedule-row-${emp.id}`}
                  className={`border-t ${focusEmployeeId === emp.id ? 'bg-primary-50/40' : ''}`}
                  style={{ borderColor: 'var(--gray-100)' }}
                >
                  <td className="sticky left-0 bg-white py-2 px-1">
                    <div className="flex items-center gap-2">
                      <div className="avatar" style={{ width: 26, height: 26, fontSize: 10 }}>
                        {getInitials(emp.full_name)}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold text-gray-800">
                          {emp.full_name}
                        </div>
                        <div className="truncate text-[10px] text-gray-400">
                          {getPositionById(emp.position_id)?.name || emp.position_id}
                        </div>
                      </div>
                    </div>
                  </td>
                  {weekStrs.map(dateStr => {
                    const cellScheds = weekSchedules.filter(schedule => schedule.employee_id === emp.id && schedule.date === dateStr)
                    const isCurrentDay = dateStr === today
                    const isFocused = dateStr === focusDate

                    return (
                      <td
                        key={dateStr}
                        className="align-top px-0.5 py-1 text-center"
                        style={{
                          background: isFocused ? '#FFFBEB' : isCurrentDay ? 'var(--primary-50)' : undefined,
                        }}
                      >
                        {cellScheds.map(schedule => {
                          const shift = ShiftTemplateService.getById(schedule.shift_id)
                          return (
                            <div
                              key={schedule.id}
                              className="group relative mb-0.5 rounded-md px-1 py-0.5"
                              style={{ background: `${shift?.color || '#9CA3AF'}22`, borderLeft: `2px solid ${shift?.color || '#9CA3AF'}` }}
                            >
                              <span className="text-[9px] font-bold" style={{ color: shift?.color || '#6B7280' }}>
                                {shift?.name.replace('Ca ', '')}
                              </span>
                              <button
                                onClick={() => removeSchedule(schedule.id)}
                                className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                                style={{ background: 'var(--error)', color: 'white', fontSize: '8px' }}
                              >
                                <X size={8} />
                              </button>
                            </div>
                          )
                        })}
                        <button
                          onClick={() => {
                            setSelectedCell({ empId: emp.id, date: dateStr })
                            setChangeReason('')
                            setShowAddModal(true)
                          }}
                          className="w-full rounded-md py-1 text-[10px] text-gray-400 transition-opacity hover:bg-primary-50"
                          style={{ opacity: cellScheds.length === 0 ? 1 : 0.5 }}
                        >
                          <Plus size={10} className="mx-auto" />
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {filteredEmployees.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">
              Không có nhân viên nào khớp bộ lọc hiện tại.
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
                {shiftTemplates.map(shift => (
                  <div key={shift.id} className="flex items-center gap-1.5 text-xs">
                    <div className="h-3 w-3 rounded" style={{ background: shift.color }} />
                    <span>
                {shift.name} ({shift.start_time}-{shift.end_time})
              </span>
            </div>
          ))}
        </div>

        {showAddModal && selectedCell && (
          <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="w-full max-w-lg animate-slide-up rounded-t-2xl bg-white p-5" style={{ maxHeight: '50vh' }}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold">
                  Thêm ca — {EmployeeService.getEmployeeById(selectedCell.empId)?.full_name?.split(' ').pop()} ({selectedCell.date.slice(5)})
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setSelectedCell(null)
                    setChangeReason('')
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: 'var(--gray-100)' }}
                >
                  <X size={16} />
                </button>
              </div>
              {isPublished && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <label className="mb-1 block text-xs font-bold text-amber-800">Lý do thay đổi sau publish</label>
                  <textarea
                    value={changeReason}
                    onChange={event => setChangeReason(event.target.value)}
                    rows={2}
                    placeholder="Ví dụ: nhân viên xin đổi ca, điều chỉnh vận hành đột xuất..."
                    className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none"
                  />
                </div>
              )}
              <div className="space-y-2">
                {shiftTemplates.map(shift => (
                  <button
                    key={shift.id}
                    className="flex w-full items-center gap-3 rounded-xl p-3 text-left"
                    style={{ background: `${shift.color}15`, border: `1px solid ${shift.color}30` }}
                    onClick={() => addSchedule(selectedCell.empId, selectedCell.date, shift.id)}
                  >
                    <div className="h-8 w-4 rounded" style={{ background: shift.color }} />
                    <div>
                      <div className="text-sm font-semibold">{shift.name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {shift.start_time} - {shift.end_time}
                      </div>
                      <div className="mt-1 text-[10px] text-gray-500">
                        {ShiftTemplateService.getPositionLabels(shift).join(', ') || 'Không khóa vị trí'} · Max {shift.max_headcount || '∞'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}

export default function ScheduleManagePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-vanilla-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm font-medium">Đang tải dữ liệu xếp lịch...</p>
        </div>
      </div>
    }>
      <ScheduleManagePageContent />
    </Suspense>
  )
}
