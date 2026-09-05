'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import type { OffboardingChecklist, OffboardingResourceItem, OffboardingScheduleItem, OffboardingStep } from '@/lib/mock-data-employee-ext'
import { EmployeeService } from '@/lib/services/employee-service'
import { ContractService, CONTRACT_STATUS_META, type EmployeeContract } from '@/lib/services/contract-service'
import { getPositionById, getStoreById } from '@/lib/mock-data'
import { useAuthStore } from '@/store/auth-store'
import { AlertTriangle, BadgeCheck, Briefcase, CalendarClock, CheckCircle2, Circle, CreditCard, FileText, Lock, ShieldAlert, UserMinus, Workflow } from 'lucide-react'

function cloneSteps(steps: OffboardingStep[]) {
  return steps.map((step) => ({ ...step }))
}

function getRiskMeta(level?: OffboardingStep['risk_level']) {
  switch (level) {
    case 'high':
      return { label: 'R?i ro cao', className: 'bg-red-50 text-red-700' }
    case 'medium':
      return { label: 'C?n theo d�i', className: 'bg-amber-50 text-amber-700' }
    default:
      return { label: '?n d?nh', className: 'bg-emerald-50 text-emerald-700' }
  }
}

function getResourceStatusMeta(status: OffboardingResourceItem['status'] | OffboardingScheduleItem['status']) {
  switch (status) {
    case 'done':
      return { label: '�� xong', className: 'bg-emerald-50 text-emerald-700' }
    case 'in_progress':
      return { label: '�ang x? l�', className: 'bg-blue-50 text-blue-700' }
    case 'blocked':
      return { label: '�ang treo', className: 'bg-red-50 text-red-700' }
    default:
      return { label: 'Chua xong', className: 'bg-amber-50 text-amber-700' }
  }
}

function getAccountStatusMeta(status?: string) {
  switch (status) {
    case 'dang_hoat_dong':
      return { label: '�ang ho?t d?ng', className: 'bg-emerald-50 text-emerald-700' }
    case 'bi_khoa':
      return { label: '�� kh�a t�i kho?n', className: 'bg-red-50 text-red-700' }
    default:
      return { label: 'Chua k�ch ho?t', className: 'bg-amber-50 text-amber-700' }
  }
}

function getWorkStatusMeta(status?: string) {
  switch (status) {
    case 'resigned':
      return { label: '�� ngh? vi?c', className: 'bg-red-50 text-red-700' }
    case 'probation':
      return { label: 'Th? vi?c', className: 'bg-blue-50 text-blue-700' }
    case 'inactive':
      return { label: 'S?p nh?n vi?c', className: 'bg-amber-50 text-amber-700' }
    default:
      return { label: '�ang l�m vi?c', className: 'bg-emerald-50 text-emerald-700' }
  }
}

function getExitTypeLabel(exitType?: OffboardingChecklist['exit_type']) {
  switch (exitType) {
    case 'involuntary':
      return 'Ngh? theo quy?t d?nh c�ng ty'
    case 'end_of_contract':
      return 'K?t th�c h?p d?ng'
    default:
      return 'T? nguy?n ngh? vi?c'
  }
}

function getOffboardingSignalMeta({
  employeeStatus,
  accountStatus,
  progress,
}: {
  employeeStatus?: string
  accountStatus?: string
  progress: number
}) {
  if (employeeStatus === 'resigned') {
    return {
      title: 'H? so d� ngh? vi?c',
      hint: accountStatus === 'bi_khoa'
        ? 'Nh�n s? n�y d� ch?t ngh? v� t�i kho?n d� du?c kh�a.'
        : 'Nh�n s? n�y d� ch?t ngh? nhung t�i kho?n v?n c?n ki?m tra l?i.',
      className: 'border-red-100 bg-red-50 text-red-700',
    }
  }

  if (accountStatus === 'bi_khoa') {
    return {
      title: '�ang gi? t�i kho?n d? ch?t ngh?',
      hint: 'T�i kho?n d� b? kh�a. C?n ho�n t?t checklist c�n l?i tru?c khi ch?t h? so.',
      className: 'border-amber-100 bg-amber-50 text-amber-700',
    }
  }

  if (progress >= 80) {
    return {
      title: 'H? so s?p ch?t ngh? vi?c',
      hint: 'C�c m?c ch�nh g?n ho�n t?t. HR c� th? r� so�t bu?c cu?i d? kh�a t�i kho?n.',
      className: 'border-orange-100 bg-orange-50 text-orange-700',
    }
  }

  return {
    title: '�ang x? l� offboarding',
    hint: 'H? so dang trong giai do?n b�n giao v� thu h?i quy?n truy c?p.',
    className: 'border-blue-100 bg-blue-50 text-blue-700',
  }
}

function SummaryCard({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string
  value: string
  hint: string
  tone?: 'neutral' | 'danger' | 'warning' | 'success'
}) {
  const toneClass = tone === 'danger'
    ? 'border-red-100 bg-red-50'
    : tone === 'warning'
      ? 'border-amber-100 bg-amber-50'
      : tone === 'success'
        ? 'border-emerald-100 bg-emerald-50'
        : 'border-gray-100 bg-white'

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClass}`}>
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-600">{hint}</p>
    </div>
  )
}

function ResourcePanel({
  title,
  icon,
  items,
}: {
  title: string
  icon: ReactNode
  items: OffboardingResourceItem[]
}) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">{items.length} m?c c?n theo d�i</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {items.map((item) => {
          const statusMeta = getResourceStatusMeta(item.status)
          return (
            <div key={item.id} className="rounded-2xl border border-gray-100 bg-vanilla-50 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}>
                  {statusMeta.label}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">Ph? tr�ch: {item.owner_name}</p>
              {item.note ? <p className="mt-2 text-sm text-gray-600">{item.note}</p> : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function SchedulePanel({ items }: { items: OffboardingScheduleItem[] }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <CalendarClock size={18} className="text-primary-600" />
        <div>
          <h3 className="text-sm font-bold text-gray-900">M?c b�n giao v� l?ch c?n ch?t</h3>
          <p className="text-xs text-gray-500">Theo d�i h?n x? l� cu?i c�ng</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {items.map((item) => {
          const statusMeta = getResourceStatusMeta(item.status)
          return (
            <div key={item.id} className="rounded-2xl border border-gray-100 bg-vanilla-50 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}>
                  {statusMeta.label}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">H?n: {item.due_date} ? Ph? tr�ch: {item.owner_name}</p>
              {item.note ? <p className="mt-2 text-sm text-gray-600">{item.note}</p> : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function OffboardingChecklistPanel({
  employee,
  user,
  data,
  latestContract,
}: {
  employee?: ReturnType<typeof EmployeeService.getEmployees>[number]
  user: NonNullable<ReturnType<typeof useAuthStore.getState>['user']>
  data: OffboardingChecklist | null
  latestContract?: EmployeeContract
}) {
  const [steps, setSteps] = useState<OffboardingStep[]>(() => cloneSteps(data?.steps || []))
  const [message, setMessage] = useState<string | null>(null)

  const doneCount = useMemo(() => steps.filter((step) => step.is_done).length, [steps])
  const requiredCount = useMemo(() => steps.filter((step) => step.required !== false).length, [steps])
  const requiredDoneCount = useMemo(
    () => steps.filter((step) => step.required !== false && step.is_done).length,
    [steps],
  )
  const blockedCount = useMemo(() => {
    const blockedResources = (data?.access_items || []).filter((item) => item.status === 'blocked').length
    const highRiskOpen = steps.filter((step) => !step.is_done && step.risk_level === 'high').length
    return blockedResources + highRiskOpen
  }, [data, steps])
  const progress = steps.length > 0 ? Math.round((doneCount / steps.length) * 100) : 0
  const selectedStore = employee ? getStoreById(employee.store_id) : undefined
  const selectedPosition = employee ? getPositionById(employee.position_id) : undefined
  const accountStatusMeta = employee ? getAccountStatusMeta(employee.account_status) : null
  const workStatusMeta = employee ? getWorkStatusMeta(employee.status) : null
  const pendingCriticalSteps = steps.filter((step) => !step.is_done && (step.required !== false || step.risk_level === 'high')).slice(0, 3)
  const latestContractMeta = latestContract ? CONTRACT_STATUS_META[latestContract.status] : null
  const offboardingSignal = employee
    ? getOffboardingSignalMeta({
        employeeStatus: employee.status,
        accountStatus: employee.account_status,
        progress,
      })
    : null

  const toggle = (stepId: string) => {
    setSteps((prev) => prev.map((step) => step.id === stepId
      ? {
          ...step,
          is_done: !step.is_done,
          done_at: !step.is_done ? new Date().toISOString().slice(0, 10) : undefined,
          done_by: !step.is_done ? user.full_name || user.id : undefined,
        }
      : step))
  }

  const completeOffboarding = () => {
    if (!employee || !data) {
      setMessage('Vui l�ng ch?n nh�n s? c?n ngh? vi?c.')
      return
    }

    if (requiredDoneCount < requiredCount) {
      setMessage('C?n ho�n t?t to�n b? m?c b?t bu?c tru?c khi ch?t ngh? vi?c.')
      return
    }

    const confirmed = confirm(`Ch?t ngh? vi?c cho ${employee.full_name}? T�i kho?n s? b? kh�a v� tr?ng th�i s? chuy?n sang d� ngh?.`)
    if (!confirmed) return

    const updated = EmployeeService.updateEmployee(
      employee.id,
      { status: 'resigned', account_status: 'bi_khoa' },
      user,
      'Ho�n t?t offboarding',
    )

    if (!updated) {
      setMessage('Kh�ng th? ch?t ngh? vi?c. Vui l�ng ki?m tra l?i h? so.')
      return
    }

    setMessage(`�� ch?t ngh? vi?c cho ${employee.full_name}.`)
  }

  if (!employee || !data) {
    return (
      <section className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
        Ch?n m?t nh�n s? d? m? trung t�m offboarding.
      </section>
    )
  }

  return (
      <section className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-4">
          <SummaryCard label="Ti?n d? t?ng" value={`${progress}%`} hint={`${doneCount}/${steps.length} m?c d� xong`} tone={progress === 100 ? 'success' : 'neutral'} />
          <SummaryCard label="M?c b?t bu?c" value={`${requiredDoneCount}/${requiredCount}`} hint="C?n xong h?t tru?c khi ch?t ngh? vi?c" tone={requiredDoneCount === requiredCount ? 'success' : 'warning'} />
        <SummaryCard label="R?i ro dang treo" value={`${blockedCount}`} hint="G?m m?c r?i ro cao v� quy?n truy c?p dang treo" tone={blockedCount > 0 ? 'danger' : 'success'} />
        <SummaryCard label="Ng�y hi?u l?c" value={data.effective_date || data.last_day} hint={`L� do: ${data.reason || 'Chua c?p nh?t'}`} tone="neutral" />
      </div>

      <section className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary-700">�ang x? l� cho</p>
                <p className="mt-1 text-base font-bold text-gray-900">{employee.full_name}</p>
                <p className="mt-1 text-xs text-gray-600">{selectedPosition?.name || employee.position_id} - {selectedStore?.name?.replace('Homies Milk Tea - ', '') || employee.store_id}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Link href={`/employees/${employee.id}`} className="inline-flex h-9 items-center justify-center rounded-xl border border-primary-200 bg-white px-3 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-50">
                  M? h? so
                </Link>
                <Link href={`/employees/contracts?employeeId=${employee.id}`} className="inline-flex h-9 items-center justify-center rounded-xl border border-primary-200 bg-white px-3 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-50">
                  V? h?p d?ng
                </Link>
              </div>
            </div>
          </div>

          {offboardingSignal ? (
            <div className={`rounded-2xl border px-4 py-3 shadow-sm ${offboardingSignal.className}`}>
              <p className="text-sm font-bold">{offboardingSignal.title}</p>
              <p className="mt-1 text-xs">{offboardingSignal.hint}</p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Nh�n s? c?n ngh? vi?c</label>
            <div className="mt-3 rounded-2xl bg-vanilla-50 p-4 text-sm text-gray-600">
              <p className="text-base font-bold text-gray-900">{employee.full_name}</p>
              <p className="mt-1">{selectedPosition?.name || employee.position_id}</p>
              <p>{selectedStore?.name || employee.store_id}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">{employee.employee_code}</span>
                {accountStatusMeta ? (
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${accountStatusMeta.className}`}>
                    {accountStatusMeta.label}
                  </span>
                ) : null}
                {workStatusMeta ? (
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${workStatusMeta.className}`}>
                    {workStatusMeta.label}
                  </span>
                ) : null}
              </div>
              <div className="mt-3 space-y-1 text-xs">
                <p>Tr?ng th�i t�i kho?n: {accountStatusMeta?.label || 'Chua c?p nh?t'}</p>
                <p>Tr?ng th�i l�m vi?c: {workStatusMeta?.label || 'Chua c?p nh?t'}</p>
                <p>Ph? tr�ch offboarding: {data.owner_name || 'HR Admin'}</p>
              </div>
              {data.notes ? <p className="mt-3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">{data.notes}</p> : null}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-primary-600" />
              <div>
                <p className="text-sm font-bold text-gray-900">Nh?p li�n quan</p>
                <p className="text-xs text-gray-500">Gi? m?ch h? so, h?p d?ng v� ch?t ngh? vi?c li?n nhau</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="rounded-xl border border-gray-100 bg-vanilla-50 px-3 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Bu?c hi?n t?i</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {employee.status === 'resigned' ? '�� ch?t ngh? vi?c' : progress >= 80 ? 'R� so�t bu?c cu?i tru?c khi kh�a t�i kho?n' : 'B�n giao v� thu h?i quy?n truy c?p'}
                </p>
                <p className="mt-1 text-xs text-gray-500">Quay v? h? so n?u c?n ki?m tra l?i CCCD, th�ng tin c� nh�n ho?c tr?ng th�i t�i kho?n tru?c khi ch?t.</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-vanilla-50 px-3 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Khi n�o quay v? h?p d?ng</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {data.exit_type === 'end_of_contract' ? 'K?t th�c h?p d?ng l� l� do ngh? ch�nh c?a h? so n�y.' : 'Ki?m tra h?p d?ng n?u c�n ch?t m?c hi?u l?c ho?c t�nh tr?ng t�i k�.'}
                </p>
                <p className="mt-1 text-xs text-gray-500">Gi? th?ng du?ng di gi?a h?p d?ng dang hi?u l?c, h? so nh�n s? v� trung t�m ngh? vi?c.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <UserMinus size={18} className="text-error-500" />
              <div>
                <p className="text-sm font-bold text-gray-900">Tr?ng th�i x? l�</p>
                <p className="text-xs text-gray-500">Lo?i ngh? vi?c: {getExitTypeLabel(data.exit_type)}</p>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-primary-50">
              <div className="h-full rounded-full bg-error-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{progress}%</p>
            <p className="mt-1 text-xs text-gray-500">
              {employee.status === 'resigned'
                ? 'H? so d� ch?t ngh? vi?c.'
                : progress >= 80
                  ? 'Checklist g?n ho�n t?t, c� th? chu?n b? kh�a t�i kho?n.'
                  : 'Ti?p t?c b�n giao t�i s?n, quy?n truy c?p v� d?i so�t cu?i.'}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-red-600" />
              <div>
                <p className="text-sm font-bold text-gray-900">C?nh b�o nhanh</p>
                <p className="text-xs text-gray-500">T�c v? c?n uu ti�n trong ng�y</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {steps.filter((step) => !step.is_done && (step.risk_level === 'high' || step.required !== false)).slice(0, 4).map((step) => {
                const riskMeta = getRiskMeta(step.risk_level)
                return (
                  <div key={step.id} className="rounded-xl border border-gray-100 bg-vanilla-50 px-3 py-3">
                    <p className="text-sm font-semibold text-gray-900">{step.label}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${riskMeta.className}`}>{riskMeta.label}</span>
                      {step.required !== false ? <span className="inline-flex rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">B?t bu?c</span> : null}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Ph? tr�ch: {step.owner_name || 'Chua g�n'} ? H?n: {step.due_date || 'Chua d?t'}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-gray-900">Vi?c c?n ch?t tru?c</p>
                <p className="text-xs text-gray-500">Gi? l?i 3 m?c dang ch?n vi?c kh�a t�i kho?n ho?c ch?t ngh?.</p>
              </div>
              <span className="inline-flex rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-gray-700">{pendingCriticalSteps.length}</span>
            </div>
            <div className="mt-4 space-y-2">
              {pendingCriticalSteps.length === 0 ? (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
                  Kh�ng c�n m?c g?p c?n ch?t tru?c.
                </div>
              ) : (
                pendingCriticalSteps.map((step) => (
                  <div key={step.id} className="rounded-xl border border-gray-100 bg-vanilla-50 px-3 py-3">
                    <p className="text-sm font-semibold text-gray-900">{step.label}</p>
                    <p className="mt-1 text-xs text-gray-500">Ph? tr�ch: {step.owner_name || 'Chua g�n'} � H?n: {step.due_date || 'Chua d?t'}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {latestContract ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-primary-600" />
                <div>
                  <p className="text-sm font-bold text-gray-900">H?p d?ng g?n nh?t</p>
                  <p className="text-xs text-gray-500">Nh�n nhanh t�nh tr?ng h?p d?ng tru?c khi ch?t ngh?</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-gray-100 bg-vanilla-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900">{latestContract.customFields['contract.code'] || latestContract.id}</p>
                  {latestContractMeta ? (
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${latestContractMeta.tone}`}>
                      {latestContractMeta.label}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {latestContract.startDate}
                  {latestContract.endDate ? ` d?n ${latestContract.endDate}` : ' - chua c� ng�y k?t th�c'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/employees/contracts/${latestContract.id}`} className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                    M? h?p d?ng
                  </Link>
                  <Link href={`/employees/contracts?employeeId=${employee.id}`} className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                    Xem c? chu?i h?p d?ng
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </aside>

        <div className="space-y-4">
          {message ? (
            <div className="rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-700">
              {message}
            </div>
          ) : null}

          <section className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Vi?c dang ch?n</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{pendingCriticalSteps.length}</p>
              <p className="mt-1 text-sm text-slate-600">m?c c?n ch?t tru?c khi c� th? kh�a t�i kho?n ho?c ho�n t?t ngh? vi?c.</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Quy?n truy c?p dang treo</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{(data.access_items || []).filter((item) => item.status === 'blocked').length}</p>
              <p className="mt-1 text-sm text-slate-600">m?c t�i kho?n ho?c quy?n truy c?p c?n uu ti�n x? l� trong ng�y.</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">M?c ch?t ngh?</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{data.effective_date || data.last_day}</p>
              <p className="mt-1 text-sm text-slate-600">ng�y dang d�ng d? kh�a t�i kho?n v� ho�n t?t h? so ngh? vi?c.</p>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Workflow size={18} className="text-primary-600" />
              <div>
                <h2 className="text-sm font-bold text-gray-900">Checklist b�n giao</h2>
                <p className="text-xs text-gray-500">C� ngu?i ph? tr�ch, h?n x? l� v� m?c d? r?i ro cho t?ng m?c</p>
              </div>
            </div>

            <div className="space-y-2">
              {steps.map((step) => {
                const riskMeta = getRiskMeta(step.risk_level)
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => toggle(step.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                      step.is_done
                        ? 'border-green-100 bg-green-50'
                        : 'border-gray-100 bg-vanilla-50 hover:bg-primary-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {step.is_done ? (
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-600" />
                      ) : (
                        <Circle size={18} className="mt-0.5 shrink-0 text-gray-300" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={`text-sm font-semibold ${step.is_done ? 'text-green-800 line-through' : 'text-gray-900'}`}>{step.label}</p>
                          {step.required !== false ? <span className="inline-flex rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-primary-700">B?t bu?c</span> : null}
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${riskMeta.className}`}>{riskMeta.label}</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{step.description}</p>
                        <p className="mt-2 text-xs text-gray-500">Ph? tr�ch: {step.owner_name || 'Chua g�n'} ? H?n: {step.due_date || 'Chua d?t'} ? Nh�m: {step.category || 'kh�c'}</p>
                        {step.done_by ? <p className="mt-1 text-xs text-green-700">Ho�n t?t b?i {step.done_by} - {step.done_at}</p> : null}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={completeOffboarding}
              className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-error-500 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-error-600"
            >
              <Lock size={16} />
              Ch?t ngh? vi?c
            </button>
          </section>

          <div className="grid gap-4 xl:grid-cols-2">
            <ResourcePanel title="T�i s?n v� v?t d?ng" icon={<Briefcase size={18} className="text-primary-600" />} items={data.handover_items || []} />
            <ResourcePanel title="T�i kho?n v� quy?n truy c?p" icon={<BadgeCheck size={18} className="text-primary-600" />} items={data.access_items || []} />
            <ResourcePanel title="Luong v� d?i so�t" icon={<CreditCard size={18} className="text-primary-600" />} items={data.finance_items || []} />
            <SchedulePanel items={data.schedule_items || []} />
          </div>
        </div>
      </section>
    </section>
  )
}

function OffboardingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [latestContract, setLatestContract] = useState<EmployeeContract | undefined>(undefined)

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) {
      const redirectPath = typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}`
        : '/employees/offboarding'
      router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`)
    }
  }, [hasHydrated, isAuthenticated, router])

  const allEmployees = user ? EmployeeService.getEmployees(user) : []
  const eligibleEmployees = allEmployees.filter((employee) => employee.status !== 'resigned')
  const preselectedEmployeeId = searchParams.get('employeeId') || ''
  const activeEmployeeId = selectedEmployeeId || preselectedEmployeeId || eligibleEmployees[0]?.id || ''
  const selectedEmployee = allEmployees.find((employee) => employee.id === activeEmployeeId)
  const offboardingData = activeEmployeeId ? EmployeeService.getOffboardingByEmployee(activeEmployeeId) : null

  useEffect(() => {
    let cancelled = false

    void (async () => {
      if (!activeEmployeeId || !user) {
        if (!cancelled) setLatestContract(undefined)
        return
      }

      const contracts = await ContractService.getContractsForEmployee(activeEmployeeId, user)
      if (cancelled) return

      const nextLatest = contracts
        .slice()
        .sort((a, b) => {
          const left = b.endDate || b.startDate || ''
          const right = a.endDate || a.startDate || ''
          return left.localeCompare(right)
        })[0]

      setLatestContract(nextLatest)
    })()

    return () => {
      cancelled = true
    }
  }, [activeEmployeeId, user])

  if (!hasHydrated || !user) return null

  const canManage = ['ceo', 'hr_admin'].includes(user.role)

  if (!canManage) {
    return (
      <AppShell title="Offboarding">
        <div className="py-20 text-center text-gray-500">
          B?n kh�ng c� quy?n th?c hi?n offboarding.
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Offboarding">
      <div className="space-y-4 pb-20">
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-error-600">Nh�n s?</p>
              <h1 className="mt-1 text-2xl font-bold text-dark-700 font-['Poppins']">Trung t�m ngh? vi?c</h1>
              <p className="mt-1 max-w-3xl text-sm text-gray-500">
                Theo ngu?i dang x? l� d? ch?t checklist b?t bu?c, t�i s?n, t�i kho?n, luong v� m?c b�n giao tru?c khi kh�a t�i kho?n.
              </p>
              {selectedEmployee ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">{selectedEmployee.employee_code}</span>
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{getPositionById(selectedEmployee.position_id)?.name || selectedEmployee.position_id}</span>
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{getStoreById(selectedEmployee.store_id)?.name?.replace('Homies Milk Tea - ', '') || selectedEmployee.store_id}</span>
                </div>
              ) : null}
            </div>
            <div className="flex w-full flex-col gap-2 lg:w-[360px]">
              <select
                value={activeEmployeeId}
                onChange={(event) => setSelectedEmployeeId(event.target.value)}
                className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              >
                <option value="">Ch?n nh�n s?</option>
                {eligibleEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name} - {employee.employee_code}
                  </option>
                ))}
              </select>
              {selectedEmployee ? (
                <Link href={`/employees/${selectedEmployee.id}`} className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-vanilla-50">
                  M? h? so nh�n s? dang xem
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        {!offboardingData && selectedEmployee ? (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <p>H? so n�y chua c� b? offboarding ri�ng, h? th?ng dang d�ng m?u m?c d?nh d? HR b?t d?u x? l�.</p>
            </div>
          </div>
        ) : null}

        <OffboardingChecklistPanel
          key={activeEmployeeId || 'empty'}
          employee={selectedEmployee}
          user={user}
          data={offboardingData}
          latestContract={latestContract}
        />
      </div>
    </AppShell>
  )
}

export default function OffboardingPage() {
  return (
    <Suspense fallback={<AppShell title="Offboarding"><div className="py-20 text-center text-gray-500">�ang t?i h? so offboarding...</div></AppShell>}>
      <OffboardingPageContent />
    </Suspense>
  )
}
