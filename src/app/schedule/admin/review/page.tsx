'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, Calendar, CheckCircle2, ClipboardCheck, UserCheck, Users } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth-store'
import {
  RegistrationWeek,
  ShiftQuota,
  formatDateString,
  getRegistrationWeeks,
  getShiftQuotas,
} from '@/lib/mock-data-registration-weeks'
import { getSubmittedShiftRegistrationsForWeek } from '@/lib/mock-data-shift-registrations'
import {
  bulkApproveRegistrationsToDraft,
  ensureDraftScheduleWeek,
  getDraftAssignmentsForWeek,
  getScheduleApprovalLogsForWeek,
  getScheduleEditLogsForWeek,
  getReviewSummary,
  publishScheduleWeek,
  removeDraftAssignment,
  upsertDraftAssignment,
} from '@/lib/mock-data-schedule-weeks'
import { getPositionById, getShiftById, getStoreById, mockEmployees, mockShifts, type Schedule } from '@/lib/mock-data'
import { ShiftTemplateService } from '@/lib/services/shift-template-service'
import { getInitials } from '@/lib/utils'
import { checkScheduleWarnings, scanWeekWarnings } from '@/lib/mock-data-schedule-rules'
import { notifySchedulePublished } from '@/lib/notifications/schedule-notifications'
import { toast } from 'sonner'

const DAY_LABELS = ['Thu 2', 'Thu 3', 'Thu 4', 'Thu 5', 'Thu 6', 'Thu 7', 'Chu nhat']

function AdminReviewContent() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedWeekId, setSelectedWeekId] = useState('')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [editingCell, setEditingCell] = useState<{ empId: string; date: string } | null>(null)
  const [showLogDrawer, setShowLogDrawer] = useState(false)
  const [logFilter, setLogFilter] = useState<'all' | 'approve_from_registration' | 'create' | 'update' | 'remove'>('all')

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated || !user || user.role === 'employee') return
    const nextSearch = searchParams.toString()
    router.replace(nextSearch ? `/schedules?${nextSearch}` : '/schedules')
  }, [isAuthenticated, router, searchParams, user])

  const storeId = user?.store_id || 'store-001'
  const weeks = useMemo<RegistrationWeek[]>(() => {
    void refreshTrigger
    return user ? getRegistrationWeeks(storeId) : []
  }, [refreshTrigger, storeId, user])
  const requestedWeekStart = searchParams.get('weekStart')
  const defaultSelectedWeekId = useMemo(() => {
    if (requestedWeekStart) {
      const exactWeek = weeks.find((week) => week.week_start_date === requestedWeekStart)
      if (exactWeek) return exactWeek.id
    }
    const reviewing = weeks.find((week) => week.status === 'reviewing' || week.status === 'open')
    return reviewing?.id || weeks[0]?.id || ''
  }, [requestedWeekStart, weeks])
  const effectiveWeekId = selectedWeekId || defaultSelectedWeekId
  const activeWeek = useMemo(
    () => weeks.find((week) => week.id === effectiveWeekId),
    [effectiveWeekId, weeks]
  )
  const weekDates = useMemo(() => {
    if (!activeWeek) return []
    const monday = new Date(`${activeWeek.week_start_date}T00:00:00`)
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + index)
      return formatDateString(date)
    })
  }, [activeWeek])

  const quotas = useMemo<ShiftQuota[]>(
    () => (activeWeek ? getShiftQuotas(activeWeek.id) : []),
    [activeWeek]
  )
  const shiftTemplates = useMemo(
    () => (activeWeek ? ShiftTemplateService.getActiveForStore(activeWeek.store_id) : []),
    [activeWeek]
  )
  const registrations = useMemo(
    () => (activeWeek ? getSubmittedShiftRegistrationsForWeek(activeWeek.store_id, activeWeek.week_start_date) : []),
    [activeWeek, refreshTrigger]
  )
  const draftAssignments = useMemo(
    () => (activeWeek ? getDraftAssignmentsForWeek(activeWeek.store_id, activeWeek.week_start_date) : []),
    [activeWeek, refreshTrigger]
  )
  const reviewSummary = useMemo(
    () => (activeWeek ? getReviewSummary(activeWeek.store_id, activeWeek.week_start_date) : null),
    [activeWeek, refreshTrigger]
  )
  const editLogs = useMemo(
    () => (activeWeek ? getScheduleEditLogsForWeek(activeWeek.store_id, activeWeek.week_start_date) : []),
    [activeWeek, refreshTrigger]
  )
  const approvalLogs = useMemo(
    () => (activeWeek ? getScheduleApprovalLogsForWeek(activeWeek.store_id, activeWeek.week_start_date) : []),
    [activeWeek, refreshTrigger]
  )
  const filteredEditLogs = useMemo(
    () => (logFilter === 'all' ? editLogs : editLogs.filter((row) => row.action === logFilter)),
    [editLogs, logFilter]
  )
  const scheduleLikeAssignments = useMemo<Schedule[]>(() => {
    if (!activeWeek) return []
    return draftAssignments.map((assignment) => ({
      id: assignment.id,
      org_id: activeWeek.org_id,
      store_id: assignment.store_id,
      employee_id: assignment.employee_id,
      shift_id: assignment.shift_id,
      date: assignment.date,
      notes: 'Lich nhap tu man duyet dang ky',
    }))
  }, [activeWeek, draftAssignments])
  const storeEmployees = useMemo(
    () => mockEmployees.filter((employee) => employee.store_id === storeId && employee.role === 'employee'),
    [storeId]
  )

  if (!user || user.role === 'employee') {
    return (
      <AppShell title="Duyet dang ky ca" contentWidth="full" contentInset="flush">
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <AlertCircle size={48} className="mb-4 text-error-500" />
          <p className="text-lg font-bold">Khong co quyen truy cap</p>
          <p className="text-sm">Trang nay danh rieng cho Admin va Cua hang truong.</p>
        </div>
      </AppShell>
    )
  }

  const handleApproveAll = () => {
    if (!activeWeek) return
    const result = bulkApproveRegistrationsToDraft(activeWeek.store_id, activeWeek.week_start_date, user.id)
    setRefreshTrigger((value) => value + 1)
    toast.success('Da tao lich nhap tu dang ky nhan vien', {
      description: `Da dua ${result.created} dang ky vao lop lich nhap de tiep tuc duyet.`,
    })
  }

  const handleManualAssign = (empId: string, date: string, shiftId: string | null) => {
    if (!activeWeek) return

    const updatedSchedules = scheduleLikeAssignments.filter(
      (item) => !(item.employee_id === empId && item.date === date)
    )

    if (shiftId) {
      const warnings = checkScheduleWarnings(empId, shiftId, date, activeWeek.store_id, updatedSchedules)
      const blockingWarnings = warnings.filter((warning) => warning.warning_level === 'block')

      if (blockingWarnings.length > 0) {
        toast.error(`Khong the xep ca vi co ${blockingWarnings.length} vi pham chan`, {
          description: blockingWarnings.slice(0, 3).map((warning) => `- ${warning.message}`).join('\n'),
        })
        return
      }

      const scheduleWeek = ensureDraftScheduleWeek(activeWeek.store_id, activeWeek.week_start_date, user.id)
      upsertDraftAssignment({
        schedule_week_id: scheduleWeek.id,
        employee_id: empId,
        store_id: activeWeek.store_id,
        date,
        shift_id: shiftId,
        source_registration_id: registrations.find((row) => row.employee_id === empId && row.date === date)?.id,
        actor_id: user.id,
      })
    } else {
      removeDraftAssignment(activeWeek.store_id, activeWeek.week_start_date, empId, date, user.id)
    }

    setRefreshTrigger((value) => value + 1)
    setEditingCell(null)
  }

  const handlePublish = () => {
    if (!activeWeek) return

    const weekWarnings = scanWeekWarnings(activeWeek.store_id, weekDates, scheduleLikeAssignments)
    const blockingWarnings = weekWarnings.filter((warning) => warning.warning_level === 'block')
    if (blockingWarnings.length > 0) {
      toast.error(`Chua the xuat ban vi con ${blockingWarnings.length} vi pham chan`, {
        description: blockingWarnings.slice(0, 5).map((warning) => `- ${warning.message}`).join('\n'),
      })
      return
    }

    const published = publishScheduleWeek(activeWeek.store_id, activeWeek.week_start_date, user.id)
    notifySchedulePublished({
      userIds: storeEmployees.map((employee) => employee.id),
      weekStart: published.week_start,
      weekEnd: published.week_end,
      storeId: activeWeek.store_id,
      storeName: getStoreById(activeWeek.store_id)?.name || 'cua hang cua ban',
      publishedByName: user.full_name,
    })
    setRefreshTrigger((value) => value + 1)
    toast.success('Da publish lich lam viec tuan', {
      description: 'Nhan vien nay da co the xem lich chinh thuc trong man Lich cua toi.',
    })
  }

  const getCellData = (empId: string, date: string) => ({
    registration: registrations.find((row) => row.employee_id === empId && row.date === date),
    draftAssignment: draftAssignments.find((row) => row.employee_id === empId && row.date === date),
  })

  const getStaffingStats = (date: string, shiftId: string) => {
    const assignedCount = draftAssignments.filter((assignment) => assignment.date === date && assignment.shift_id === shiftId).length
    const quota = quotas.find((item) => item.date === date && item.shift_id === shiftId) || { min_staff: 1, max_staff: 2 }

    let statusColor = 'text-error-500'
    let progressBg = 'bg-error-500'
    if (assignedCount >= quota.min_staff && assignedCount <= quota.max_staff) {
      statusColor = 'text-emerald-600'
      progressBg = 'bg-emerald-500'
    } else if (assignedCount > 0 && assignedCount < quota.min_staff) {
      statusColor = 'text-warning-500'
      progressBg = 'bg-warning-500'
    } else if (assignedCount > quota.max_staff) {
      statusColor = 'text-primary-600'
      progressBg = 'bg-primary-500'
    }

    return {
      assignedCount,
      max: quota.max_staff,
      statusColor,
      progressBg,
    }
  }

  return (
    <AppShell showNav contentWidth="full" contentInset="flush">
      <div className="space-y-5 animate-fade-in pb-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-800">Duyet dang ky va xep lich nhap</h1>
            <p className="mt-0.5 text-xs text-gray-400">Lop 1 la dang ky nhan vien. Lop 2 la lich nhap quan ly sap publish.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">Dot xep:</span>
            <select
              value={effectiveWeekId}
              onChange={(event) => setSelectedWeekId(event.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="" disabled>-- Chon tuan --</option>
              {weeks.map((week) => (
                <option key={week.id} value={week.id}>Tuan {week.week_start_date} ({week.status.toUpperCase()})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex rounded-2xl border border-gray-200/50 bg-gray-100 p-1">
          <button
            onClick={() => router.push('/schedule/manage')}
            className="flex-1 rounded-xl px-3 py-2 text-xs font-bold text-gray-500 transition-all hover:text-gray-700"
          >
            Quan ly phan ca
          </button>
          <button
            onClick={() => router.push('/schedule/admin/registration')}
            className="flex-1 rounded-xl px-3 py-2 text-xs font-bold text-gray-500 transition-all hover:text-gray-700"
          >
            Cau hinh mo ca
          </button>
          <button className="flex-1 rounded-xl bg-white px-3 py-2 text-xs font-bold text-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            Duyet ca va xep lich
          </button>
        </div>

        {activeWeek ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-extrabold text-gray-800">Trang thai dot:</span>
                  <span className="rounded-full border border-primary-200 bg-primary-50 px-2.5 py-0.5 text-[10px] font-extrabold capitalize text-primary-600">
                    {activeWeek.status}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">Approve all de lay dang ky lam base, sau do sua nhanh o tung o neu can.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleApproveAll}
                  className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_12px_rgba(59,130,246,0.2)] transition-all hover:bg-primary-700"
                >
                  <ClipboardCheck size={14} /> Duyet tat ca theo dang ky
                </button>
                <button
                  onClick={() => setShowLogDrawer(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 transition-all hover:border-gray-300 hover:text-gray-900"
                >
                  Xem log
                </button>
                <button
                  onClick={handlePublish}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_12px_rgba(16,185,129,0.2)] transition-all hover:bg-emerald-700"
                >
                  <CheckCircle2 size={14} /> Publish lich
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-[var(--shadow-card)]">
            <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-bold text-gray-700">Chua tim thay tuan can duyet</p>
          </div>
        )}

        {reviewSummary ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[var(--shadow-card)]">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Dang ky</p>
              <p className="mt-1 text-2xl font-extrabold text-gray-800">{reviewSummary.totalRegistrations}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[var(--shadow-card)]">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Lich nhap</p>
              <p className="mt-1 text-2xl font-extrabold text-primary-600">{reviewSummary.draftAssignments}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[var(--shadow-card)]">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Bo qua</p>
              <p className="mt-1 text-2xl font-extrabold text-warning-600">{reviewSummary.skippedRegistrations}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[var(--shadow-card)]">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Can xep them</p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-600">{reviewSummary.unassignedEmployees}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[var(--shadow-card)]">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Log nhap</p>
              <p className="mt-1 text-2xl font-extrabold text-gray-800">{editLogs.length}</p>
              <p className="mt-1 text-[10px] font-bold text-gray-400">Lan duyet: {approvalLogs.length}</p>
            </div>
          </div>
        ) : null}

        {activeWeek && weekDates.length > 0 ? (
          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-4">
              <span className="flex items-center gap-1.5 text-xs font-extrabold text-gray-700">
                <Users size={15} className="text-primary-500" /> Bang duyet 2 lop: Dang ky va lich nhap
              </span>
              <span className="text-[10px] font-bold text-gray-400">Chip xam = Dang ky. Chip dam = Lich nhap.</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/20">
                    <th className="w-[180px] p-3 text-[10px] font-extrabold tracking-wider text-gray-500">NHAN VIEN</th>
                    {DAY_LABELS.map((day, index) => (
                      <th key={day} className="p-3 text-center text-[10px] font-extrabold tracking-wider text-gray-500">
                        <span className="block">{day}</span>
                        <span className="mt-0.5 block text-[8px] font-semibold text-gray-400">{weekDates[index].split('-').slice(1).reverse().join('/')}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {storeEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50/30">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-extrabold text-primary-700">
                            {getInitials(employee.full_name)}
                          </div>
                          <div>
                            <p className="line-clamp-1 text-xs font-bold text-gray-800">{employee.full_name}</p>
                            <p className="mt-0.5 text-[9px] font-bold text-gray-400">{getPositionById(employee.position_id)?.name || employee.position_id || 'Nhan vien'}</p>
                          </div>
                        </div>
                      </td>

                      {weekDates.map((date) => {
                        const { registration, draftAssignment } = getCellData(employee.id, date)
                        const isEditing = editingCell?.empId === employee.id && editingCell?.date === date
                        const isEdited = Boolean(
                          registration && draftAssignment && registration.shift_id !== draftAssignment.shift_id
                        )

                        return (
                          <td key={date} className="relative p-2 text-center">
                            {isEditing ? (
                              <div className="absolute left-1/2 top-2 z-30 flex w-28 -translate-x-1/2 flex-col gap-1 rounded-xl border border-gray-200 bg-white p-1.5 text-left shadow-xl">
                                {shiftTemplates.map((template) => (
                                  <button
                                    key={template.id}
                                    onClick={() => handleManualAssign(employee.id, date, template.id)}
                                    className="rounded p-1 text-[10px] font-bold hover:bg-gray-50"
                                    style={{ color: template.color }}
                                  >
                                    {template.name}
                                  </button>
                                ))}
                                <hr className="my-0.5 border-gray-100" />
                                <button
                                  onClick={() => handleManualAssign(employee.id, date, null)}
                                  className="rounded p-1 text-[10px] font-bold text-error-500 hover:bg-error-50"
                                >
                                  Bo lich nhap
                                </button>
                                <button
                                  onClick={() => setEditingCell(null)}
                                  className="mt-0.5 p-0.5 text-center text-[9px] text-gray-400 hover:text-gray-600"
                                >
                                  Huy
                                </button>
                              </div>
                            ) : null}

                            <div
                              onClick={() => activeWeek.status !== 'published' && setEditingCell({ empId: employee.id, date })}
                              className={`min-h-[66px] rounded-2xl border p-2 transition-all ${draftAssignment ? 'border-primary-100 bg-primary-50/10' : 'border-dashed border-gray-100 hover:border-gray-300'} ${activeWeek.status !== 'published' ? 'cursor-pointer hover:shadow-sm' : 'cursor-default'}`}
                            >
                              {registration ? (
                                <span className="mb-1 inline-flex rounded-full border border-gray-300 bg-gray-50 px-2 py-0.5 text-[9px] font-bold text-gray-600">
                                  DK: {getShiftById(registration.shift_id)?.name.replace('Ca ', '') || registration.shift_id}
                                </span>
                              ) : (
                                <span className="mb-1 inline-flex text-[8px] font-bold text-gray-300">Khong dang ky</span>
                              )}

                              {draftAssignment ? (
                                <>
                                  <span className="block rounded-lg px-2 py-0.5 text-[9px] font-extrabold text-white shadow-sm" style={{ backgroundColor: getShiftById(draftAssignment.shift_id)?.color }}>
                                    Lich: {getShiftById(draftAssignment.shift_id)?.name.replace('Ca ', '') || draftAssignment.shift_id}
                                  </span>
                                  {isEdited ? (
                                    <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[8px] font-extrabold text-amber-700">Da sua</span>
                                  ) : null}
                                </>
                              ) : (
                                <span className="block text-[9px] font-semibold text-gray-300">Chua xep</span>
                              )}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-100 bg-gray-50/50">
                    <td className="p-3 align-middle text-[10px] font-extrabold text-gray-600">
                      <span>BIEU DO DINH MUC</span>
                      <span className="mt-0.5 block text-[8px] font-bold text-gray-400">Thuc te lich nhap / chi tieu</span>
                    </td>
                    {weekDates.map((date) => (
                      <td key={date} className="p-2.5">
                        <div className="space-y-1.5 rounded-xl border border-gray-100 bg-white p-2 text-left shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                          {mockShifts.map((shift) => {
                            const { assignedCount, max, progressBg, statusColor } = getStaffingStats(date, shift.id)
                            const fillPercent = Math.min(100, max > 0 ? (assignedCount / max) * 100 : 0)
                            return (
                              <div key={shift.id} className="text-[9px] font-semibold">
                                <div className="mb-0.5 flex items-center justify-between text-gray-500">
                                  <span className="font-bold">{shift.name.replace('Ca ', '')}</span>
                                  <span className={`font-extrabold ${statusColor}`}>{assignedCount}/{max}</span>
                                </div>
                                <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100">
                                  <div className={`${progressBg} h-full transition-all`} style={{ width: `${fillPercent}%` }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : null}

        {activeWeek?.status === 'published' ? (
          <div className="flex items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
            <UserCheck size={14} /> Dot lich da o trang thai published.
          </div>
        ) : null}

        {showLogDrawer ? (
          <div className="fixed inset-0 z-40 flex justify-end bg-black/20">
            <button className="flex-1" aria-label="Dong log drawer" onClick={() => setShowLogDrawer(false)} />
            <div className="h-full w-full max-w-md overflow-y-auto border-l border-gray-200 bg-white p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-sm font-extrabold text-gray-800">Lich su thao tac</h2>
                  <p className="mt-1 text-[11px] text-gray-400">{editLogs.length} thay doi nhap. {approvalLogs.length} lan duyet.</p>
                </div>
                <button onClick={() => setShowLogDrawer(false)} className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50">Dong</button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(['all', 'approve_from_registration', 'create', 'update', 'remove'] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setLogFilter(option)}
                    className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${logFilter === option ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {option === 'all' ? 'Tat ca' : option}
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-3">
                {filteredEditLogs.length > 0 ? filteredEditLogs.map((log) => (
                  <div key={log.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-white px-2 py-1 text-[10px] font-extrabold uppercase text-gray-600">{log.action}</span>
                      <span className="text-[10px] font-bold text-gray-400">{new Date(log.changed_at).toLocaleString('vi-VN')}</span>
                    </div>
                    <p className="mt-2 text-xs font-bold text-gray-800">{log.employee_id} · {log.date}</p>
                    <p className="mt-1 text-[11px] text-gray-500">Truoc: {log.before_state?.shift_id || 'trong'} {'->'} Sau: {log.after_state?.shift_id || 'trong'}</p>
                  </div>
                )) : <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-xs font-bold text-gray-400">Chua co log phu hop bo loc.</div>}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}

export default function AdminReviewPage() {
  return (
    <Suspense fallback={null}>
      <AdminReviewContent />
    </Suspense>
  )
}



