'use client'

import { Suspense, useMemo, useState } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter, useSearchParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { ScheduleService, type ScheduleChangeLogFeed } from '@/lib/services/schedule-service'
import { EmployeeService } from '@/lib/services/employee-service'
import { getShiftById, getStoreById } from '@/lib/mock-data'
import { ArrowLeft, Building2, Calendar, Clock3, History, UserCog } from 'lucide-react'

function getActionMeta(log: ScheduleChangeLogFeed) {
  const changedAfterPublish =
    Boolean(log.after_state?.modified_after_publish) ||
    Boolean(log.before_state?.modified_after_publish)

  if (log.action === 'publish') {
    return {
      badgeLabel: 'CHỐT LỊCH',
      badgeClassName: 'bg-emerald-50 text-emerald-700',
      title: 'Đã chốt lịch tuần',
      description: 'Nhân viên đã có thể xem lịch chính thức.',
      reasonLabel: 'Tóm tắt chốt lịch',
    }
  }

  if (changedAfterPublish) {
    return {
      badgeLabel: 'SỬA SAU KHI CHỐT',
      badgeClassName: 'bg-amber-50 text-amber-700',
      title: log.action === 'cancel' ? 'Hủy ca sau khi đã chốt' : 'Điều chỉnh ca sau khi đã chốt',
      description: 'Thay đổi này xảy ra sau khi lịch đã chốt và nhân viên có thể đã xem lịch cũ.',
      reasonLabel: 'Lý do thay đổi',
    }
  }

  const actionMap: Record<Exclude<ScheduleChangeLogFeed['action'], 'publish'>, {
    badgeLabel: string
    title: string
    description: string
    reasonLabel: string
  }> = {
    create: {
      badgeLabel: 'TẠO CA',
      title: 'Tạo ca mới trong bản nháp',
      description: 'Ca được thêm trước khi chốt lịch.',
      reasonLabel: 'Ghi chú',
    },
    update: {
      badgeLabel: 'SỬA CA',
      title: 'Cập nhật ca trong bản nháp',
      description: 'Ca được chỉnh sửa trước khi chốt lịch.',
      reasonLabel: 'Ghi chú',
    },
    cancel: {
      badgeLabel: 'HỦY CA',
      title: 'Hủy ca trong bản nháp',
      description: 'Ca bị hủy trước khi chốt lịch.',
      reasonLabel: 'Ghi chú',
    },
    delete: {
      badgeLabel: 'GỠ CA',
      title: 'Gỡ ca khỏi bản nháp',
      description: 'Ca bị xóa trước khi chốt lịch.',
      reasonLabel: 'Ghi chú',
    },
  }

  return {
    ...actionMap[log.action],
    badgeClassName: 'bg-primary-50 text-primary-700',
  }
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function toDateInputValue(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function ScheduleHistoryPageContent() {
  const { user } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [actionFilter, setActionFilter] = useState<'all' | 'create' | 'update' | 'cancel' | 'delete' | 'publish'>('all')
  const [employeeFilter, setEmployeeFilter] = useState('all')
  const [actorFilter, setActorFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')

  const requestedStoreId = searchParams.get('storeId') || undefined
  const requestedWeekStart = searchParams.get('weekStart') || undefined

  const weekStateMeta = useMemo(() => {
    if (!user || !requestedStoreId || !requestedWeekStart) return null
    const week = ScheduleService.getScheduleWeek(requestedStoreId, requestedWeekStart)
    return week ? ScheduleService.getWeekStateMeta(week) : null
  }, [requestedStoreId, requestedWeekStart, user])

  const allLogs = useMemo<ScheduleChangeLogFeed[]>(() => {
    if (!user) return []
    return ScheduleService.getChangeLogFeed(user, {
      storeId: requestedStoreId,
      weekStart: requestedWeekStart,
    })
  }, [requestedStoreId, requestedWeekStart, user])

  const logs = useMemo<ScheduleChangeLogFeed[]>(() => {
    return allLogs.filter(log => {
      const matchAction = actionFilter === 'all' || log.action === actionFilter
      const matchEmployee = employeeFilter === 'all' || log.employee_id === employeeFilter
      const matchActor = actorFilter === 'all' || log.changed_by === actorFilter
      const matchDate = !dateFilter || toDateInputValue(log.changed_at) === dateFilter
      return matchAction && matchEmployee && matchActor && matchDate
    })
  }, [actionFilter, actorFilter, allLogs, dateFilter, employeeFilter])

  const employeeOptions = useMemo(() => {
    const ids = Array.from(new Set(allLogs.map(log => log.employee_id).filter(Boolean)))
    return ids
      .map(id => ({ id, name: EmployeeService.getEmployeeById(id)?.full_name || id }))
      .sort((left, right) => left.name.localeCompare(right.name))
  }, [allLogs])

  const actorOptions = useMemo(() => {
    const ids = Array.from(new Set(allLogs.map(log => log.changed_by).filter(Boolean)))
    return ids
      .map(id => ({ id, name: EmployeeService.getEmployeeById(id)?.full_name || id }))
      .sort((left, right) => left.name.localeCompare(right.name))
  }, [allLogs])

  if (!user) return null

  if (user.role === 'employee') {
    return (
      <AppShell title="Lịch sử thay đổi lịch">
        <div className="py-20 text-center text-gray-500">Bạn không có quyền xem lịch sử thay đổi lịch tổng.</div>
      </AppShell>
    )
  }

  return (
    <AppShell showNav>
      <div className="space-y-5 pb-20">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm font-medium text-primary-500 hover:text-primary-600"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>

        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-800">Lịch sử thay đổi lịch</h1>
          <p className="mt-0.5 text-xs text-gray-400">
            Theo dõi ai đã tạo, sửa, hủy hoặc chốt lịch để dễ đối soát vận hành.
          </p>
        </div>

        <div className="grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:grid-cols-3">
          <div className="rounded-xl bg-vanilla-50 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-400">Chi nhánh</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Building2 size={14} className="text-gray-400" />
              {requestedStoreId ? getStoreById(requestedStoreId)?.name || requestedStoreId : 'Tất cả chi nhánh'}
            </p>
          </div>
          <div className="rounded-xl bg-vanilla-50 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-400">Tuần đang xem</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Calendar size={14} className="text-gray-400" />
              {requestedWeekStart || 'Tất cả'}
            </p>
          </div>
          <div className="rounded-xl bg-vanilla-50 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-400">Tổng log</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-800">
              <History size={14} className="text-gray-400" />
              {logs.length} thay đổi
            </p>
          </div>
        </div>

        {weekStateMeta && (
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${weekStateMeta.tone}`}>{weekStateMeta.label}</span>
              <span className="text-sm font-semibold text-gray-800">Trạng thái tuần đang xem</span>
            </div>
            <p className="mt-2 text-sm text-gray-600">{weekStateMeta.description}</p>
          </div>
        )}

        <div className="grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-4">
          <select
            value={actionFilter}
            onChange={event => setActionFilter(event.target.value as typeof actionFilter)}
            className="rounded-xl border border-gray-200 bg-vanilla-50 px-3 py-2 text-sm text-gray-700"
          >
            <option value="all">Tất cả thao tác</option>
            <option value="publish">Chốt lịch</option>
            <option value="create">Tạo ca</option>
            <option value="update">Sửa ca</option>
            <option value="cancel">Hủy ca</option>
            <option value="delete">Gỡ ca</option>
          </select>
          <select
            value={employeeFilter}
            onChange={event => setEmployeeFilter(event.target.value)}
            className="rounded-xl border border-gray-200 bg-vanilla-50 px-3 py-2 text-sm text-gray-700"
          >
            <option value="all">Tất cả nhân viên</option>
            {employeeOptions.map(option => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>
          <select
            value={actorFilter}
            onChange={event => setActorFilter(event.target.value)}
            className="rounded-xl border border-gray-200 bg-vanilla-50 px-3 py-2 text-sm text-gray-700"
          >
            <option value="all">Tất cả người sửa</option>
            {actorOptions.map(option => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-vanilla-50 px-3 py-2 text-sm text-gray-700">
            <Calendar size={14} className="text-gray-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={event => setDateFilter(event.target.value)}
              className="w-full bg-transparent outline-none"
            />
          </label>
        </div>

        <div className="space-y-3">
          {logs.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-12 text-center text-sm text-gray-400">
              Chưa có lịch sử thay đổi nào trong phạm vi đang xem.
            </div>
          )}

          {logs.map(log => {
            const employee = log.employee_id ? EmployeeService.getEmployeeById(log.employee_id) : null
            const beforeShift = log.before_state?.shift_id ? getShiftById(log.before_state.shift_id) : null
            const afterShift = log.after_state?.shift_id ? getShiftById(log.after_state.shift_id) : null
            const actionMeta = getActionMeta(log)
            const displayReason = log.reason?.trim() || (log.action === 'publish' ? 'Đã chốt lịch tuần.' : 'Không có lý do được ghi lại.')

            return (
              <div key={log.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${actionMeta.badgeClassName}`}>
                        {actionMeta.badgeLabel}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {log.employee_name || employee?.full_name || 'Thay đổi cấp tuần / hệ thống'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-800">{actionMeta.title}</p>
                      <p className="text-xs text-gray-500">{actionMeta.description}</p>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>{log.store_name}</span>
                      <span>Ngày áp dụng: {log.date}</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 size={12} />
                        Lúc sửa: {formatDateTime(log.changed_at)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <UserCog size={12} />
                        Người sửa: {log.actor_name}
                      </span>
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-vanilla-50 px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {actionMeta.reasonLabel}
                      </p>
                      <p className="mt-1 text-sm text-gray-700">{displayReason}</p>
                    </div>
                  </div>

                  <div className="grid min-w-[240px] grid-cols-1 gap-2 rounded-xl bg-vanilla-50 p-3 text-xs text-gray-600">
                    <div>
                      <p className="font-semibold text-gray-500">Trước</p>
                      <p>{log.before_shift_name || (beforeShift ? `${beforeShift.name} (${beforeShift.start_time} - ${beforeShift.end_time})` : '-')}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-500">Sau</p>
                      <p>{log.after_shift_name || (afterShift ? `${afterShift.name} (${afterShift.start_time} - ${afterShift.end_time})` : '-')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}

export default function ScheduleHistoryPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-gray-500">Đang tải lịch sử thay đổi...</div>}>
      <ScheduleHistoryPageContent />
    </Suspense>
  )
}
