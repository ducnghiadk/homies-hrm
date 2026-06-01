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
      return { label: 'Rủi ro cao', className: 'bg-red-50 text-red-700' }
    case 'medium':
      return { label: 'Cần theo dõi', className: 'bg-amber-50 text-amber-700' }
    default:
      return { label: 'Ổn định', className: 'bg-emerald-50 text-emerald-700' }
  }
}

function getResourceStatusMeta(status: OffboardingResourceItem['status'] | OffboardingScheduleItem['status']) {
  switch (status) {
    case 'done':
      return { label: 'Đã xong', className: 'bg-emerald-50 text-emerald-700' }
    case 'in_progress':
      return { label: 'Đang xử lý', className: 'bg-blue-50 text-blue-700' }
    case 'blocked':
      return { label: 'Đang treo', className: 'bg-red-50 text-red-700' }
    default:
      return { label: 'Chưa xong', className: 'bg-amber-50 text-amber-700' }
  }
}

function getAccountStatusMeta(status?: string) {
  switch (status) {
    case 'dang_hoat_dong':
      return { label: 'Đang hoạt động', className: 'bg-emerald-50 text-emerald-700' }
    case 'bi_khoa':
      return { label: 'Đã khóa tài khoản', className: 'bg-red-50 text-red-700' }
    default:
      return { label: 'Chưa kích hoạt', className: 'bg-amber-50 text-amber-700' }
  }
}

function getWorkStatusMeta(status?: string) {
  switch (status) {
    case 'resigned':
      return { label: 'Đã nghỉ việc', className: 'bg-red-50 text-red-700' }
    case 'probation':
      return { label: 'Thử việc', className: 'bg-blue-50 text-blue-700' }
    case 'inactive':
      return { label: 'Sắp nhận việc', className: 'bg-amber-50 text-amber-700' }
    default:
      return { label: 'Đang làm việc', className: 'bg-emerald-50 text-emerald-700' }
  }
}

function getExitTypeLabel(exitType?: OffboardingChecklist['exit_type']) {
  switch (exitType) {
    case 'involuntary':
      return 'Nghỉ theo quyết định công ty'
    case 'end_of_contract':
      return 'Kết thúc hợp đồng'
    default:
      return 'Tự nguyện nghỉ việc'
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
      title: 'Hồ sơ đã nghỉ việc',
      hint: accountStatus === 'bi_khoa'
        ? 'Nhân sự này đã chốt nghỉ và tài khoản đã được khóa.'
        : 'Nhân sự này đã chốt nghỉ nhưng tài khoản vẫn cần kiểm tra lại.',
      className: 'border-red-100 bg-red-50 text-red-700',
    }
  }

  if (accountStatus === 'bi_khoa') {
    return {
      title: 'Đang giữ tài khoản để chốt nghỉ',
      hint: 'Tài khoản đã bị khóa. Cần hoàn tất checklist còn lại trước khi chốt hồ sơ.',
      className: 'border-amber-100 bg-amber-50 text-amber-700',
    }
  }

  if (progress >= 80) {
    return {
      title: 'Hồ sơ sắp chốt nghỉ việc',
      hint: 'Các mục chính gần hoàn tất. HR có thể rà soát bước cuối để khóa tài khoản.',
      className: 'border-orange-100 bg-orange-50 text-orange-700',
    }
  }

  return {
    title: 'Đang xử lý offboarding',
    hint: 'Hồ sơ đang trong giai đoạn bàn giao và thu hồi quyền truy cập.',
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
          <p className="text-xs text-gray-500">{items.length} mục cần theo dõi</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {items.map((item) => {
          const statusMeta = getResourceStatusMeta(item.status)
          return (
            <div key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}>
                  {statusMeta.label}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">Phụ trách: {item.owner_name}</p>
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
          <h3 className="text-sm font-bold text-gray-900">Mốc bàn giao và lịch cần chốt</h3>
          <p className="text-xs text-gray-500">Theo dõi hạn xử lý cuối cùng</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {items.map((item) => {
          const statusMeta = getResourceStatusMeta(item.status)
          return (
            <div key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}>
                  {statusMeta.label}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">Hạn: {item.due_date} ⬢ Phụ trách: {item.owner_name}</p>
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
      setMessage('Vui lòng chọn nhân sự cần nghỉ việc.')
      return
    }

    if (requiredDoneCount < requiredCount) {
      setMessage('Cần hoàn tất toàn bộ mục bắt buộc trước khi chốt nghỉ việc.')
      return
    }

    const confirmed = confirm(`Chốt nghỉ việc cho ${employee.full_name}? Tài khoản sẽ bị khóa và trạng thái sẽ chuyển sang đã nghỉ.`)
    if (!confirmed) return

    const updated = EmployeeService.updateEmployee(
      employee.id,
      { status: 'resigned', account_status: 'bi_khoa' },
      user,
      'Hoàn tất offboarding',
    )

    if (!updated) {
      setMessage('Không thể chốt nghỉ việc. Vui lòng kiểm tra lại hồ sơ.')
      return
    }

    setMessage(`Đã chốt nghỉ việc cho ${employee.full_name}.`)
  }

  if (!employee || !data) {
    return (
      <section className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
        Chọn một nhân sự để mở trung tâm offboarding.
      </section>
    )
  }

  return (
      <section className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-4">
          <SummaryCard label="Tiến độ tổng" value={`${progress}%`} hint={`${doneCount}/${steps.length} mục đã xong`} tone={progress === 100 ? 'success' : 'neutral'} />
          <SummaryCard label="Mục bắt buộc" value={`${requiredDoneCount}/${requiredCount}`} hint="Cần xong hết trước khi chốt nghỉ việc" tone={requiredDoneCount === requiredCount ? 'success' : 'warning'} />
        <SummaryCard label="Rủi ro đang treo" value={`${blockedCount}`} hint="Gồm mục rủi ro cao và quyền truy cập đang treo" tone={blockedCount > 0 ? 'danger' : 'success'} />
        <SummaryCard label="Ngày hiệu lực" value={data.effective_date || data.last_day} hint={`Lý do: ${data.reason || 'Chưa cập nhật'}`} tone="neutral" />
      </div>

      <section className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary-700">Đang xử lý cho</p>
                <p className="mt-1 text-base font-bold text-gray-900">{employee.full_name}</p>
                <p className="mt-1 text-xs text-gray-600">{selectedPosition?.name || employee.position_id} - {selectedStore?.name?.replace('Homies Milk Tea - ', '') || employee.store_id}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Link href={`/employees/${employee.id}`} className="inline-flex h-9 items-center justify-center rounded-xl border border-primary-200 bg-white px-3 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-50">
                  Mở hồ sơ
                </Link>
                <Link href={`/employees/contracts?employeeId=${employee.id}`} className="inline-flex h-9 items-center justify-center rounded-xl border border-primary-200 bg-white px-3 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-50">
                  Về hợp đồng
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
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Nhân sự cần nghỉ việc</label>
            <div className="mt-3 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
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
                <p>Trạng thái tài khoản: {accountStatusMeta?.label || 'Chưa cập nhật'}</p>
                <p>Trạng thái làm việc: {workStatusMeta?.label || 'Chưa cập nhật'}</p>
                <p>Phụ trách offboarding: {data.owner_name || 'HR Admin'}</p>
              </div>
              {data.notes ? <p className="mt-3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">{data.notes}</p> : null}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-primary-600" />
              <div>
                <p className="text-sm font-bold text-gray-900">Nhịp liên quan</p>
                <p className="text-xs text-gray-500">Giữ mạch hồ sơ, hợp đồng và chốt nghỉ việc liền nhau</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Bước hiện tại</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {employee.status === 'resigned' ? 'Đã chốt nghỉ việc' : progress >= 80 ? 'Rà soát bước cuối trước khi khóa tài khoản' : 'Bàn giao và thu hồi quyền truy cập'}
                </p>
                <p className="mt-1 text-xs text-gray-500">Quay về hồ sơ nếu cần kiểm tra lại CCCD, thông tin cá nhân hoặc trạng thái tài khoản trước khi chốt.</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Khi nào quay về hợp đồng</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {data.exit_type === 'end_of_contract' ? 'Kết thúc hợp đồng là lý do nghỉ chính của hồ sơ này.' : 'Kiểm tra hợp đồng nếu còn chốt mốc hiệu lực hoặc tình trạng tái ký.'}
                </p>
                <p className="mt-1 text-xs text-gray-500">Giữ thẳng đường đi giữa hợp đồng đang hiệu lực, hồ sơ nhân sự và trung tâm nghỉ việc.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <UserMinus size={18} className="text-error-500" />
              <div>
                <p className="text-sm font-bold text-gray-900">Trạng thái xử lý</p>
                <p className="text-xs text-gray-500">Loại nghỉ việc: {getExitTypeLabel(data.exit_type)}</p>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-error-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{progress}%</p>
            <p className="mt-1 text-xs text-gray-500">
              {employee.status === 'resigned'
                ? 'Hồ sơ đã chốt nghỉ việc.'
                : progress >= 80
                  ? 'Checklist gần hoàn tất, có thể chuẩn bị khóa tài khoản.'
                  : 'Tiếp tục bàn giao tài sản, quyền truy cập và đối soát cuối.'}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-red-600" />
              <div>
                <p className="text-sm font-bold text-gray-900">Cảnh báo nhanh</p>
                <p className="text-xs text-gray-500">Tác vụ cần ưu tiên trong ngày</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {steps.filter((step) => !step.is_done && (step.risk_level === 'high' || step.required !== false)).slice(0, 4).map((step) => {
                const riskMeta = getRiskMeta(step.risk_level)
                return (
                  <div key={step.id} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
                    <p className="text-sm font-semibold text-gray-900">{step.label}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${riskMeta.className}`}>{riskMeta.label}</span>
                      {step.required !== false ? <span className="inline-flex rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">Bắt buộc</span> : null}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Phụ trách: {step.owner_name || 'Chưa gán'} ⬢ Hạn: {step.due_date || 'Chưa đặt'}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-gray-900">Việc cần chốt trước</p>
                <p className="text-xs text-gray-500">Giữ lại 3 mục đang chặn việc khóa tài khoản hoặc chốt nghỉ.</p>
              </div>
              <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">{pendingCriticalSteps.length}</span>
            </div>
            <div className="mt-4 space-y-2">
              {pendingCriticalSteps.length === 0 ? (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
                  Không còn mục gấp cần chốt trước.
                </div>
              ) : (
                pendingCriticalSteps.map((step) => (
                  <div key={step.id} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
                    <p className="text-sm font-semibold text-gray-900">{step.label}</p>
                    <p className="mt-1 text-xs text-gray-500">Phụ trách: {step.owner_name || 'Chưa gán'} · Hạn: {step.due_date || 'Chưa đặt'}</p>
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
                  <p className="text-sm font-bold text-gray-900">Hợp đồng gần nhất</p>
                  <p className="text-xs text-gray-500">Nhìn nhanh tình trạng hợp đồng trước khi chốt nghỉ</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
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
                  {latestContract.endDate ? ` đến ${latestContract.endDate}` : ' - chưa có ngày kết thúc'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/employees/contracts/${latestContract.id}`} className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                    Mở hợp đồng
                  </Link>
                  <Link href={`/employees/contracts?employeeId=${employee.id}`} className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                    Xem cả chuỗi hợp đồng
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
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Việc đang chặn</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{pendingCriticalSteps.length}</p>
              <p className="mt-1 text-sm text-slate-600">mục cần chốt trước khi có thể khóa tài khoản hoặc hoàn tất nghỉ việc.</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Quyền truy cập đang treo</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{(data.access_items || []).filter((item) => item.status === 'blocked').length}</p>
              <p className="mt-1 text-sm text-slate-600">mục tài khoản hoặc quyền truy cập cần ưu tiên xử lý trong ngày.</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Mốc chốt nghỉ</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{data.effective_date || data.last_day}</p>
              <p className="mt-1 text-sm text-slate-600">ngày đang dùng để khóa tài khoản và hoàn tất hồ sơ nghỉ việc.</p>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Workflow size={18} className="text-primary-600" />
              <div>
                <h2 className="text-sm font-bold text-gray-900">Checklist bàn giao</h2>
                <p className="text-xs text-gray-500">Có người phụ trách, hạn xử lý và mức độ rủi ro cho từng mục</p>
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
                        : 'border-gray-100 bg-gray-50 hover:bg-gray-100'
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
                          {step.required !== false ? <span className="inline-flex rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-primary-700">Bắt buộc</span> : null}
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${riskMeta.className}`}>{riskMeta.label}</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{step.description}</p>
                        <p className="mt-2 text-xs text-gray-500">Phụ trách: {step.owner_name || 'Chưa gán'} ⬢ Hạn: {step.due_date || 'Chưa đặt'} ⬢ Nhóm: {step.category || 'khác'}</p>
                        {step.done_by ? <p className="mt-1 text-xs text-green-700">Hoàn tất bởi {step.done_by} - {step.done_at}</p> : null}
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
              Chốt nghỉ việc
            </button>
          </section>

          <div className="grid gap-4 xl:grid-cols-2">
            <ResourcePanel title="Tài sản và vật dụng" icon={<Briefcase size={18} className="text-primary-600" />} items={data.handover_items || []} />
            <ResourcePanel title="Tài khoản và quyền truy cập" icon={<BadgeCheck size={18} className="text-primary-600" />} items={data.access_items || []} />
            <ResourcePanel title="Lương và đối soát" icon={<CreditCard size={18} className="text-primary-600" />} items={data.finance_items || []} />
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
          Bạn không có quyền thực hiện offboarding.
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
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-error-600">Nhân sự</p>
              <h1 className="mt-1 text-2xl font-bold text-dark-700 font-['Poppins']">Trung tâm nghỉ việc</h1>
              <p className="mt-1 max-w-3xl text-sm text-gray-500">
                Theo người đang xử lý để chốt checklist bắt buộc, tài sản, tài khoản, lương và mốc bàn giao trước khi khóa tài khoản.
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
                <option value="">Chọn nhân sự</option>
                {eligibleEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name} - {employee.employee_code}
                  </option>
                ))}
              </select>
              {selectedEmployee ? (
                <Link href={`/employees/${selectedEmployee.id}`} className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                  Mở hồ sơ nhân sự đang xem
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        {!offboardingData && selectedEmployee ? (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <p>Hồ sơ này chưa có bộ offboarding riêng, hệ thống đang dùng mẫu mặc định để HR bắt đầu xử lý.</p>
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
    <Suspense fallback={<AppShell title="Offboarding"><div className="py-20 text-center text-gray-500">Đang tải hồ sơ offboarding...</div></AppShell>}>
      <OffboardingPageContent />
    </Suspense>
  )
}
