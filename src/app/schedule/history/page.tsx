'use client'

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Building2, Calendar, Clock3, History, UserCog } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth-store'
import {
  type ScheduleApprovalLog,
  type ScheduleEditLog,
  getScheduleApprovalLogsForWeek,
  getScheduleEditLogsForWeek,
} from '@/lib/mock-data-schedule-weeks'
import { getPositionById, getShiftById, getStoreById, mockEmployees } from '@/lib/mock-data'
import { getRegistrationWeekByWeek } from '@/lib/mock-data-registration-weeks'

type ReviewHistoryAction = ScheduleEditLog['action'] | 'publish'

type ReviewHistoryRow = {
  id: string
  action: ReviewHistoryAction
  employee_id: string | null
  employee_name: string
  actor_id: string
  actor_name: string
  store_id: string
  store_name: string
  date: string
  changed_at: string
  before_shift_id: string | null
  after_shift_id: string | null
  reason: string
  summary: string
}

function getEmployeeName(employeeId: string | null) {
  if (!employeeId) return 'Cap tuan / he thong'
  return mockEmployees.find((employee) => employee.id === employeeId)?.full_name || employeeId
}

function getActionMeta(action: ReviewHistoryAction) {
  switch (action) {
    case 'approve_from_registration':
      return { badgeLabel: 'DUYET TU DANG KY', badgeClassName: 'bg-sky-50 text-sky-700', title: 'Copy dang ky sang lich nhap' }
    case 'create':
      return { badgeLabel: 'THEM NHAP', badgeClassName: 'bg-emerald-50 text-emerald-700', title: 'Them ca trong ban nhap' }
    case 'update':
      return { badgeLabel: 'SUA NHAP', badgeClassName: 'bg-amber-50 text-amber-700', title: 'Sua ca trong ban nhap' }
    case 'remove':
      return { badgeLabel: 'XOA NHAP', badgeClassName: 'bg-rose-50 text-rose-700', title: 'Xoa ca khoi ban nhap' }
    case 'publish':
      return { badgeLabel: 'DUYET LICH', badgeClassName: 'bg-violet-50 text-violet-700', title: 'Duyet lich lam viec' }
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

function describeShift(shiftId: string | null) {
  if (!shiftId) return '-'
  const shift = getShiftById(shiftId)
  return shift ? `${shift.name} (${shift.start_time} - ${shift.end_time})` : shiftId
}

function buildSummary(log: ScheduleEditLog) {
  if (log.action === 'approve_from_registration') return 'Lay dang ky nhan vien lam ban nhap ban dau.'
  if (log.action === 'create') return 'Quan ly them ca moi vao lich nhap.'
  if (log.action === 'update') return 'Quan ly doi ca trong lich nhap.'
  return 'Quan ly go ca khoi lich nhap.'
}

function mapEditLog(storeId: string, log: ScheduleEditLog): ReviewHistoryRow {
  return {
    id: log.id,
    action: log.action,
    employee_id: log.employee_id,
    employee_name: getEmployeeName(log.employee_id),
    actor_id: log.changed_by,
    actor_name: getEmployeeName(log.changed_by),
    store_id: storeId,
    store_name: getStoreById(storeId)?.name || storeId,
    date: log.date,
    changed_at: log.changed_at,
    before_shift_id: log.before_state?.shift_id || null,
    after_shift_id: log.after_state?.shift_id || null,
    reason: log.reason || buildSummary(log),
    summary: buildSummary(log),
  }
}

function mapApprovalLog(storeId: string, weekStart: string, log: ScheduleApprovalLog): ReviewHistoryRow {
  return {
    id: log.id,
    action: 'publish',
    employee_id: null,
    employee_name: 'Lich lam viec tuan',
    actor_id: log.approved_by,
    actor_name: getEmployeeName(log.approved_by),
    store_id: storeId,
    store_name: getStoreById(storeId)?.name || storeId,
    date: weekStart,
    changed_at: log.approved_at,
    before_shift_id: null,
    after_shift_id: null,
    reason: `Tong ${log.snapshot.totalRegistrations} dang ky. ${log.snapshot.manualChanges} thay doi tay. ${log.snapshot.finalPublishedAssignments} ca duoc chot.`,
    summary: 'Duyet lich lam viec tu ban nhap sang lich chinh thuc.',
  }
}

function ScheduleHistoryPageContent() {
  const { user } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [actionFilter, setActionFilter] = useState<'all' | ReviewHistoryAction>('all')
  const [employeeFilter, setEmployeeFilter] = useState('all')
  const [actorFilter, setActorFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')

  const requestedStoreId = searchParams.get('storeId') || user?.store_id || 'store-001'
  const requestedWeekStart = searchParams.get('weekStart') || ''

  const registrationWeek = useMemo(
    () => (requestedWeekStart ? getRegistrationWeekByWeek(requestedStoreId, requestedWeekStart) : null),
    [requestedStoreId, requestedWeekStart]
  )

  const allLogs = useMemo<ReviewHistoryRow[]>(() => {
    if (!requestedWeekStart) return []

    const editLogs = getScheduleEditLogsForWeek(requestedStoreId, requestedWeekStart).map((log) =>
      mapEditLog(requestedStoreId, log)
    )
    const approvalLogs = getScheduleApprovalLogsForWeek(requestedStoreId, requestedWeekStart).map((log) =>
      mapApprovalLog(requestedStoreId, requestedWeekStart, log)
    )

    return [...approvalLogs, ...editLogs].sort((left, right) => right.changed_at.localeCompare(left.changed_at))
  }, [requestedStoreId, requestedWeekStart])

  const logs = useMemo(
    () => allLogs.filter((log) => {
      const matchAction = actionFilter === 'all' || log.action === actionFilter
      const matchEmployee = employeeFilter === 'all' || log.employee_id === employeeFilter
      const matchActor = actorFilter === 'all' || log.actor_id === actorFilter
      const matchDate = !dateFilter || toDateInputValue(log.changed_at) === dateFilter
      return matchAction && matchEmployee && matchActor && matchDate
    }),
    [actionFilter, actorFilter, allLogs, dateFilter, employeeFilter]
  )

  const employeeOptions = useMemo(() => {
    const ids = Array.from(new Set(allLogs.map((log) => log.employee_id).filter(Boolean))) as string[]
    return ids.map((id) => ({ id, name: getEmployeeName(id) })).sort((left, right) => left.name.localeCompare(right.name))
  }, [allLogs])

  const actorOptions = useMemo(() => {
    const ids = Array.from(new Set(allLogs.map((log) => log.actor_id).filter(Boolean)))
    return ids.map((id) => ({ id, name: getEmployeeName(id) })).sort((left, right) => left.name.localeCompare(right.name))
  }, [allLogs])

  if (!user) return null

  if (user.role === 'employee') {
    return (
      <AppShell title="Lịch sử duyệt lịch" contentWidth="full" contentInset="flush">
        <div className="py-20 text-center text-gray-500">{'B\u1ea1n kh\u00f4ng c\u00f3 quy\u1ec1n xem l\u1ecbch s\u1eed duy\u1ec7t l\u1ecbch.'}</div>
      </AppShell>
    )
  }

  return (
    <AppShell showNav contentWidth="full" contentInset="flush">
      <div className="space-y-5 pb-20">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm font-medium text-primary-500 hover:text-primary-600"
        >
          <ArrowLeft size={16} /> Quay lai
        </button>

        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-800">Lịch sử duyệt lịch</h1>
          <p className="mt-0.5 text-xs text-gray-400">
            Theo dõi approve từ đăng ký, sửa tay trong bản nhập, và lần duyệt thành lịch làm việc.
          </p>
        </div>

        <div className="grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:grid-cols-4">
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-400">Chi nhanh</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Building2 size={14} className="text-gray-400" />
              {getStoreById(requestedStoreId)?.name || requestedStoreId}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-400">Tuan dang xem</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Calendar size={14} className="text-gray-400" />
              {requestedWeekStart || 'Chua chon tuan'}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-400">Trang thai dot</p>
            <p className="mt-1 text-sm font-semibold text-gray-800">{registrationWeek?.status || 'khong ro'}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-400">Tong log</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-800">
              <History size={14} className="text-gray-400" />
              {logs.length} su kien
            </p>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-4">
          <select
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value as typeof actionFilter)}
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
          >
            <option value="all">Tat ca thao tac</option>
            <option value="publish">Duyet lich</option>
            <option value="approve_from_registration">Approve tu dang ky</option>
            <option value="create">Them nhap</option>
            <option value="update">Sua nhap</option>
            <option value="remove">Xoa nhap</option>
          </select>
          <select
            value={employeeFilter}
            onChange={(event) => setEmployeeFilter(event.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
          >
            <option value="all">Tat ca nhan su</option>
            {employeeOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>
          <select
            value={actorFilter}
            onChange={(event) => setActorFilter(event.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
          >
            <option value="all">Tat ca nguoi sua</option>
            {actorOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            <Calendar size={14} className="text-gray-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="w-full bg-transparent outline-none"
            />
          </label>
        </div>

        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-12 text-center text-sm text-gray-400">
              Chua co lich su thao tac nao cho tuan nay.
            </div>
          ) : null}

          {logs.map((log) => {
            const actionMeta = getActionMeta(log.action)
            const beforeShift = describeShift(log.before_shift_id)
            const afterShift = describeShift(log.after_shift_id)
            const employeePosition = log.employee_id
              ? getPositionById(mockEmployees.find((employee) => employee.id === log.employee_id)?.position_id || '')?.name
              : null

            return (
              <div key={log.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${actionMeta.badgeClassName}`}>
                        {actionMeta.badgeLabel}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">{log.employee_name}</span>
                      {employeePosition ? <span className="text-xs font-bold text-gray-400">{employeePosition}</span> : null}
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-800">{actionMeta.title}</p>
                      <p className="text-xs text-gray-500">{log.summary}</p>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>{log.store_name}</span>
                      <span>Ngay ap dung: {log.date}</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 size={12} />
                        {formatDateTime(log.changed_at)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <UserCog size={12} />
                        {log.actor_name}
                      </span>
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ghi chu</p>
                      <p className="mt-1 text-sm text-gray-700">{log.reason}</p>
                    </div>
                  </div>

                  <div className="grid min-w-[260px] grid-cols-1 gap-2 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
                    <div>
                      <p className="font-semibold text-gray-500">Truoc</p>
                      <p>{beforeShift}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-500">Sau</p>
                      <p>{afterShift}</p>
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
    <Suspense fallback={<div className="py-20 text-center text-gray-500">Dang tai lich su...</div>}>
      <ScheduleHistoryPageContent />
    </Suspense>
  )
}
