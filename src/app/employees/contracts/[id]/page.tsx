'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import writeExcelFile from 'write-excel-file/browser'
import { ArrowLeft, Clock3, Download, FileText, PenLine, RefreshCcw, Send, ShieldCheck, UserRound } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { Avatar } from '@/components/ui/Avatar'
import { getPositionById, getStoreById } from '@/lib/mock-data'
import { ContractService, CONTRACT_STATUS_META, type EmployeeContract } from '@/lib/services/contract-service'
import { EmployeeService } from '@/lib/services/employee-service'
import { OnboardingPolicyService, type EmployeeOnboardingPolicyRecord, type OnboardingPolicyStatus } from '@/lib/services/onboarding-policy-service'
import type { AuthUser } from '@/store/auth-store'
import { useAuthStore } from '@/store/auth-store'
import { Field, FieldHighlight, SectionCard, Tag } from '../_components'

async function downloadContract(contract: EmployeeContract) {
  await writeExcelFile([
    ['Mã hợp đồng', contract.customFields['contract.code'] || contract.id],
    ['Phiên bản', contract.version],
    ['Trạng thái', contract.status],
    ['Ngày hiệu lực', contract.startDate],
    ['Ngày kết thúc', contract.endDate || ''],
    [],
    ['Nội dung đã render'],
    [contract.renderedContent],
  ], { sheet: 'Contract' }).toFile(`${contract.customFields['contract.code'] || contract.id}.xlsx`)
}

function addOneDay(dateText?: string) {
  if (!dateText) return ''
  const date = new Date(`${dateText}T00:00:00`)
  date.setDate(date.getDate() + 1)
  return date.toISOString().slice(0, 10)
}

function formatDateTime(dateText?: string) {
  if (!dateText) return 'Chưa có'
  const date = new Date(dateText)
  if (Number.isNaN(date.getTime())) return dateText
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

const ONBOARDING_STATUS_META: Record<OnboardingPolicyStatus, { label: string; tone: string; detail: string }> = {
  chua_gui: {
    label: 'Chưa gửi',
    tone: 'bg-slate-100 text-slate-700',
    detail: 'Nhân sự chưa nhận tóm tắt hoặc bản đầy đủ của nội quy nhận việc.',
  },
  da_gui_tom_tat: {
    label: 'Đã gửi tóm tắt',
    tone: 'bg-amber-100 text-amber-700',
    detail: 'Đã gửi bản tóm tắt, có thể theo dõi tiếp để gửi bản đầy đủ khi cần.',
  },
  da_gui_day_du: {
    label: 'Đã gửi đầy đủ',
    tone: 'bg-sky-100 text-sky-700',
    detail: 'Bản đầy đủ đã được gửi cho nhân sự, chờ đọc hoặc xác nhận.',
  },
  da_doc: {
    label: 'Đã đọc',
    tone: 'bg-indigo-100 text-indigo-700',
    detail: 'Nhân sự đã mở đọc nội quy, có thể tiếp tục nhắc xác nhận nếu cần.',
  },
  da_xac_nhan: {
    label: 'Đã xác nhận',
    tone: 'bg-emerald-100 text-emerald-700',
    detail: 'Nhân sự đã xác nhận đã đọc và hiểu nội quy nhận việc.',
  },
  can_nhac: {
    label: 'Cần nhắc',
    tone: 'bg-rose-100 text-rose-700',
    detail: 'Hồ sơ đang cần nhắc lại để nhân sự quay lại đọc hoặc xác nhận.',
  },
  can_giai_thich: {
    label: 'Cần giải thích',
    tone: 'bg-orange-100 text-orange-700',
    detail: 'Nhân sự đã phản hồi cần được giải thích thêm về nội quy.',
  },
}

type OnboardingPolicyServiceWithResend = typeof OnboardingPolicyService & {
  resendSummary?: (employeeId: string, user: AuthUser) => EmployeeOnboardingPolicyRecord | null | Promise<EmployeeOnboardingPolicyRecord | null>
  resendFull?: (employeeId: string, user: AuthUser) => EmployeeOnboardingPolicyRecord | null | Promise<EmployeeOnboardingPolicyRecord | null>
}

export default function ContractDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const [refreshKey, setRefreshKey] = useState(0)
  const [contract, setContract] = useState<EmployeeContract | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editNote, setEditNote] = useState('')
  const [renewStartDate, setRenewStartDate] = useState('')
  const [renewEndDate, setRenewEndDate] = useState('')
  const [renewNote, setRenewNote] = useState('Tái ký từ hợp đồng đang xem')
  const [renewalTracking, setRenewalTracking] = useState<Awaited<ReturnType<typeof ContractService.getRenewalTracking>>>(null)
  const [onboardingPolicy, setOnboardingPolicy] = useState<EmployeeOnboardingPolicyRecord | null>(null)

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) {
      const redirectPath = typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}`
        : `/employees/contracts/${String(params.id)}`
      router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`)
    }
  }, [hasHydrated, isAuthenticated, params.id, router])

  useEffect(() => {
    let cancelled = false
    if (!user) return

    void (async () => {
      setIsLoading(true)
      const [nextContract, nextTracking] = await Promise.all([
        ContractService.getContractById(String(params.id), user),
        ContractService.getRenewalTracking(String(params.id), user),
      ])
      if (cancelled) return
      setContract(nextContract)
      setRenewalTracking(nextTracking)
      setOnboardingPolicy(nextContract ? OnboardingPolicyService.getRecord(nextContract.employeeId) : null)
      setIsLoading(false)
      setEditStartDate(nextContract?.startDate || '')
      setEditEndDate(nextContract?.endDate || '')
      setEditNote(nextContract?.customFields['policy.contract_note'] || '')
      setRenewStartDate(addOneDay(nextContract?.endDate) || nextContract?.endDate || nextContract?.startDate || '')
      setRenewEndDate(nextContract?.endDate || '')
    })()

    return () => {
      cancelled = true
    }
  }, [params.id, refreshKey, user])

  const template = contract ? ContractService.getTemplates().find((item) => item.id === contract.templateId) : undefined
  const employee = contract ? EmployeeService.getEmployeeById(contract.employeeId, user ?? undefined) || EmployeeService.getEmployeeById(contract.employeeId) : undefined
  const store = contract ? getStoreById(contract.storeId) : undefined
  const position = contract ? getPositionById(contract.positionId) : undefined
  const canManage = user ? ['ceo', 'hr_admin'].includes(user.role) : false
  const canManageOnboarding = user ? ['ceo', 'hr_admin', 'store_manager'].includes(user.role) : false
  const canOpenOffboarding = Boolean(canManage && employee)
  const canEmployeeSign = Boolean(user && contract && user.id === contract.employeeId && contract.status === 'pending_employee_sign')
  const statusMeta = contract ? CONTRACT_STATUS_META[contract.status] : undefined
  const onboardingStatusMeta = onboardingPolicy ? ONBOARDING_STATUS_META[onboardingPolicy.status] : ONBOARDING_STATUS_META.chua_gui
  const canEditDraft = Boolean(canManage && contract && ['draft', 'pending_employee_sign'].includes(contract.status))
  const canRenew = Boolean(canManage && contract && ['active', 'expired', 'superseded'].includes(contract.status))
  const linkedStatuses = renewalTracking?.linkedContracts.slice(0, 4) || []
  const pendingSignatureCount = renewalTracking
    ? renewalTracking.summary.waitingEmployeeSign + renewalTracking.summary.waitingHrSign
    : contract?.signatures.length || 0
  const contractAttentionLabel = contract?.status === 'draft'
    ? 'Cần gửi cho nhân sự ký'
    : contract?.status === 'pending_employee_sign'
      ? 'Đang chờ nhân sự ký'
      : contract?.status === 'pending_hr_sign'
        ? 'Đang chờ HR countersign'
        : canRenew
          ? 'Theo dõi tái ký và hết hạn'
          : 'Đang lưu theo dõi'

  const contractTypeLabel = useMemo(() => {
    const type = contract?.customFields['contract.type'] || 'xac_dinh_thoi_han'
    switch (type) {
      case 'khong_xac_dinh_thoi_han':
        return 'Không xác định thời hạn'
      case 'part_time':
        return 'Part-time'
      case 'phu_luc':
        return 'Phụ lục hợp đồng'
      default:
        return 'Xác định thời hạn'
    }
  }, [contract])

  const previewState = contract && user
    ? ContractService.previewDraft({
        employeeId: contract.employeeId,
        templateId: contract.templateId,
        startDate: contract.startDate,
        endDate: contract.endDate,
        customFields: contract.customFields,
      }, user ?? undefined, {
        detailed: true,
      })
    : null

  const runAction = async (action: 'send' | 'sign' | 'counter') => {
    if (!user || !contract) return

    const result =
      action === 'send'
        ? await ContractService.sendContract(contract.id, user)
        : action === 'sign'
          ? await ContractService.signAsEmployee(contract.id, user)
          : await ContractService.countersign(contract.id, user)

    if (!result) {
      setMessage('Không thực hiện được thao tác này. Hãy kiểm tra trạng thái và quyền ký.')
      return
    }

    setMessage(
      action === 'send'
        ? 'Đã gửi hợp đồng cho nhân sự ký.'
        : action === 'sign'
          ? 'Bạn đã ký hợp đồng trên app.'
          : 'HR đã countersign và kích hoạt hợp đồng.'
    )
    setRefreshKey((current) => current + 1)
  }

  const handleSaveDraft = async () => {
    if (!user || !contract) return
    const result = await ContractService.updateDraftContract(contract.id, {
      startDate: editStartDate,
      endDate: editEndDate || undefined,
      customFields: {
        ...contract.customFields,
        'policy.contract_note': editNote,
      },
    }, user)
    if (!result) {
      setMessage('Chưa thể cập nhật hợp đồng này.')
      return
    }
    setMessage('Đã cập nhật hợp đồng và tạo snapshot mới.')
    setRefreshKey((current) => current + 1)
  }

  const handleRenew = async (sendNow: boolean) => {
    if (!user || !contract) return
    const result = await ContractService.renewContract(contract.id, {
      startDate: renewStartDate,
      endDate: renewEndDate || undefined,
      note: renewNote,
      sendNow,
    }, user)
    if (!result) {
      setMessage('Chưa thể tạo hợp đồng tái ký.')
      return
    }
    setMessage(sendNow ? 'Đã tạo và gửi hợp đồng tái ký.' : 'Đã tạo hợp đồng tái ký mới.')
    router.push(`/employees/contracts/${result.id}`)
  }

  const handleResendPolicy = async (mode: 'summary' | 'full') => {
    if (!user || !contract) return

    const service = OnboardingPolicyService as OnboardingPolicyServiceWithResend
    const action = mode === 'summary' ? service.resendSummary : service.resendFull

    if (!action) {
      setMessage(
        mode === 'summary'
          ? 'Nút gửi lại bản tóm tắt đã được nối sẵn, đang chờ service resendSummary được tích hợp.'
          : 'Nút gửi lại bản đầy đủ đã được nối sẵn, đang chờ service resendFull được tích hợp.'
      )
      return
    }

    const result = await action(contract.employeeId, user)
    if (!result) {
      setMessage(mode === 'summary' ? 'Chưa gửi lại được bản tóm tắt nội quy.' : 'Chưa gửi lại được bản đầy đủ nội quy.')
      return
    }

    setOnboardingPolicy(result)
    setMessage(mode === 'summary' ? 'Đã gửi lại bản tóm tắt nội quy.' : 'Đã gửi lại bản đầy đủ nội quy.')
  }

  if (!hasHydrated || !user) return null

  if (isLoading) {
    return (
      <AppShell title="Hợp đồng">
        <div className="space-y-4 py-16 text-center">
          <p className="text-sm text-slate-500">Đang tải hợp đồng...</p>
        </div>
      </AppShell>
    )
  }

  if (!contract) {
    return (
      <AppShell title="Hợp đồng">
        <div className="space-y-4 py-16 text-center">
          <p className="text-sm text-slate-500">Không tìm thấy hợp đồng hoặc bạn không có quyền xem.</p>
          <Link href="/employees/contracts" className="inline-flex rounded-full bg-primary-600 px-4 py-2 text-sm font-bold text-white">Về danh sách</Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Chi tiết hợp đồng">
      <div className="space-y-5 pb-20">
        <button type="button" onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-bold text-primary-600">
          <ArrowLeft size={16} />
          Quay lại
        </button>

        {message ? (
          <div className="rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-700">
            {message}
          </div>
        ) : null}

        <SectionCard
          title={template?.name || contract.templateId}
          description={`Mã hợp đồng ${contract.customFields['contract.code'] || contract.id} - hiệu lực từ ${contract.startDate}${contract.endDate ? `đến ${contract.endDate}` : 'Chưa có ngày kết thúc'}`}
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex min-w-0 gap-4">
              <div className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                <FileText size={24} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{contract.version}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {statusMeta ? <span className={`rounded-full px-3 py-2 text-xs font-bold ${statusMeta.tone}`}>{statusMeta.label}</span> : null}
                  <Tag tone="primary">{contractTypeLabel}</Tag>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {canManage && contract.status === 'draft' ? (
                <button type="button" onClick={() => void runAction('send')} className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-bold text-white">
                  <Send size={15} />
                  Gửi ký
                </button>
              ) : null}
              {canEmployeeSign ? (
                <button type="button" onClick={() => void runAction('sign')} className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-bold text-white">
                  <PenLine size={15} />
                  Tôi đồng ý và ký
                </button>
              ) : null}
              {canManage && contract.status === 'pending_hr_sign' ? (
                <button type="button" onClick={() => void runAction('counter')} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white">
                  <ShieldCheck size={15} />
                  HR countersign
                </button>
              ) : null}
              <button type="button" onClick={() => { void downloadContract(contract) }} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
                <Download size={15} />
                Xuất file
              </button>
              <Link href={`/employees/${contract.employeeId}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
                <UserRound size={15} />
                Mở hồ sơ
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Nhân sự liên quan</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{employee?.full_name || contract.employeeId}</p>
              <p className="mt-1 text-xs text-slate-500">{position?.name || contract.positionId} - {store?.name?.replace('Homies Milk Tea - ', '') || contract.storeId}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/employees/${contract.employeeId}`} className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700">
                    Về hồ sơ nhân sự
                </Link>
                {canOpenOffboarding ? (
                  <Link href={`/employees/offboarding?employeeId=${contract.employeeId}`} className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700">
                    Mở offboarding
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Đang chờ xác nhận</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{pendingSignatureCount}</p>
              <p className="mt-1 text-xs text-slate-500">Tổng người hoặc bước ký còn đang mở trên hợp đồng này.</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Hiệu lực</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{contract.startDate}</p>
              <p className="mt-1 text-xs text-slate-500">{contract.endDate ? `Đến ${contract.endDate}` : 'Chưa có ngày kết thúc'}</p>
            </div>
          </div>
        </SectionCard>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            {canEditDraft ? (
              <SectionCard title="Sửa bản nháp" description="Cho phép chỉnh ngày hiệu lực và ghi chú trước khi chốt gửi ký.">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Ngày hiệu lực">
                    <input type="date" value={editStartDate} onChange={(event) => setEditStartDate(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
                  </Field>
                  <Field label="Ngày kết thúc">
                    <input type="date" value={editEndDate} onChange={(event) => setEditEndDate(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Ghi chú / phụ lục">
                      <textarea value={editNote} onChange={(event) => setEditNote(event.target.value)} rows={4} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
                    </Field>
                  </div>
                </div>
                <button type="button" onClick={() => void handleSaveDraft()} className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white">
                  Lưu cập nhật
                </button>
              </SectionCard>
            ) : null}

            {canRenew ? (
              <SectionCard title="Tái ký hợp đồng" description="Tạo hợp đồng mới dựa trên hợp đồng hiện tại để theo dõi vòng đời rõ ràng hơn.">
                {renewalTracking ? (
                  <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${renewalTracking.nextAction.tone}`}>
                    <p className="font-bold">{renewalTracking.nextAction.label}</p>
                    <p className="mt-1">{renewalTracking.nextAction.detail}</p>
                  </div>
                ) : null}

                {renewalTracking ? (
                  <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Còn lại</p>
                      <p className="mt-2 text-2xl font-black text-slate-900">{renewalTracking.daysToEnd ?? '-'}</p>
                      <p className="mt-1 text-xs text-slate-500">Số ngày đến khi hợp đồng đang xem hết hạn</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Cần tạo bản mới</p>
                      <p className="mt-2 text-2xl font-black text-slate-900">{renewalTracking.summary.needsRenewalDraft ? 'Có' : 'Không'}</p>
                      <p className="mt-1 text-xs text-slate-500">Bật khi hợp đồng sắp hết hạn mà chưa có bản tái ký mới</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Đang chờ ký</p>
                      <p className="mt-2 text-2xl font-black text-slate-900">{renewalTracking.summary.waitingEmployeeSign + renewalTracking.summary.waitingHrSign}</p>
                      <p className="mt-1 text-xs text-slate-500">{renewalTracking.summary.waitingEmployeeSign} chờ nhân sự, {renewalTracking.summary.waitingHrSign} chờ HR</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Trễ xử lý</p>
                      <p className="mt-2 text-2xl font-black text-slate-900">{renewalTracking.summary.overdueProcessing}</p>
                      <p className="mt-1 text-xs text-slate-500">Các bản gửi quá 3 ngày mà vẫn chưa hoàn tất</p>
                    </div>
                  </div>
                ) : null}

                {linkedStatuses.length > 0 ? (
                  <div className="mb-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-sm font-bold text-slate-900">Chuỗi hợp đồng liên quan</p>
                    <div className="mt-3 space-y-2">
                      {linkedStatuses.map((item) => {
                        const meta = CONTRACT_STATUS_META[item.status]
                        return (
                          <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white px-3 py-3">
                            <div>
                              <p className="text-sm font-bold text-slate-900">{item.code}</p>
                              <p className="text-xs text-slate-500">{item.startDate}{item.endDate ? ` đến ${item.endDate}` : ''}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full px-3 py-1 text-xs font-bold ${meta.tone}`}>{meta.label}</span>
                              <Link href={`/employees/contracts/${item.id}`} className="text-xs font-bold text-primary-600">Mở</Link>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Ngày hiệu lực mới">
                    <input type="date" value={renewStartDate} onChange={(event) => setRenewStartDate(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
                  </Field>
                  <Field label="Ngày kết thúc mới">
                    <input type="date" value={renewEndDate} onChange={(event) => setRenewEndDate(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Ghi chú tái ký">
                      <textarea value={renewNote} onChange={(event) => setRenewNote(event.target.value)} rows={3} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
                    </Field>
                    <p className="mt-2 text-xs text-slate-500">Mẹo: ngày hiệu lực mới đã tự nhảy sang ngày kế sau khi hợp đồng hiện tại kết thúc để HR thao tác nhanh hơn.</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => void handleRenew(false)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
                    <RefreshCcw size={16} />
                    Tạo bản tái ký
                  </button>
                  <button type="button" onClick={() => void handleRenew(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white">
                    <Send size={16} />
                    Tạo và gửi ký
                  </button>
                </div>
              </SectionCard>
            ) : null}

            <SectionCard
              title="Snapshot hợp đồng đã render"
              description="Đây là nội dung mà nhân sự đã hoặc sẽ nhìn thấy khi ký. Phần này để đọc sâu sau khi đã nắm trạng thái và hành động chính."
            >
              <div className="mb-4 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {previewState?.segments.map((segment, index) => (
                    segment.type === 'text' ? (
                      <span key={index}>{segment.value}</span>
                    ) : (
                      <FieldHighlight key={`${segment.key}-${index}`} status={segment.status}>
                        {segment.value || `{{${segment.key}}}`}
                      </FieldHighlight>
                    )
                  )) || contract.renderedContent}
                </div>
              </div>
              {previewState?.checklist.blockingReasons.length ? (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {previewState.checklist.blockingReasons.join('. ')}
                </div>
              ) : (
                <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  Hợp đồng này đã đạt điều kiện để gửi ký.
                </div>
              )}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <pre className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{contract.renderedContent}</pre>
              </div>
            </SectionCard>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
            <SectionCard title="Thông tin nhân sự">
              <div className="flex items-start gap-3">
                <Avatar name={employee?.full_name || contract.employeeId} size="md" />
                <div className="min-w-0">
                  <p className="font-black text-slate-900">{employee?.full_name || contract.employeeId}</p>
                  <p className="mt-1 text-xs text-slate-500">{position?.name || contract.positionId} - {store?.name?.replace('Homies Milk Tea - ', '') || contract.storeId}</p>
                  <p className="mt-1 text-xs text-slate-500">CCCD: {employee?.cccd || contract.customFields['employee.cccd'] || 'Chưa cập nhật'}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/employees/${contract.employeeId}`} className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                      Mở hồ sơ
                    </Link>
                    {canOpenOffboarding ? (
                      <Link href={`/employees/offboarding?employeeId=${contract.employeeId}`} className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700">
                        Mở offboarding
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Nhịp xử lý liên quan">
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Bước hiện tại</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">{contractAttentionLabel}</p>
                  <p className="mt-1 text-xs text-slate-500">Quay về hồ sơ nhân sự nếu cần bổ sung CCCD, thông tin cá nhân hoặc trạng thái tài khoản.</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Khi nào sang offboarding</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">Khi hợp đồng đã hết hiệu lực hoặc cần chốt nghỉ việc.</p>
                  <p className="mt-1 text-xs text-slate-500">Giữ mạch làm việc liền nhau giữa hợp đồng, hồ sơ và trung tâm nghỉ việc.</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Tình trạng nội quy nhận việc" description="Theo dõi việc đã gửi bản tóm tắt hay bản đầy đủ cho nhân sự của hợp đồng này.">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Trạng thái hiện tại</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${onboardingStatusMeta.tone}`}>{onboardingStatusMeta.label}</span>
                      <Tag>{onboardingPolicy?.template_id || 'default-policy-v1'}</Tag>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{onboardingStatusMeta.detail}</p>
                  </div>

                  {canManageOnboarding ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleResendPolicy('summary')}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
                      >
                        <RefreshCcw size={14} />
                        Gửi lại tóm tắt
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleResendPolicy('full')}
                        className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-3 py-1.5 text-xs font-bold text-white"
                      >
                        <Send size={14} />
                        Gửi lại bản đầy đủ
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3">
                  <div className="rounded-2xl border border-slate-100 bg-white px-3 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Đã gửi tóm tắt lúc</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">{formatDateTime(onboardingPolicy?.summary_sent_at)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white px-3 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Đã gửi bản đầy đủ lúc</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">{formatDateTime(onboardingPolicy?.full_sent_at)}</p>
                  </div>
                </div>
              </div>
            </SectionCard>

            {renewalTracking ? (
              <SectionCard title="Tóm tắt tái ký">
                <div className={`rounded-2xl border px-4 py-3 text-sm ${renewalTracking.nextAction.tone}`}>
                  <p className="font-bold">{renewalTracking.nextAction.label}</p>
                  <p className="mt-1">{renewalTracking.nextAction.detail}</p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Còn lại</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{renewalTracking.daysToEnd ?? '-'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Trễ xử lý</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{renewalTracking.summary.overdueProcessing}</p>
                  </div>
                </div>
              </SectionCard>
            ) : null}

            <SectionCard title="Chữ ký và xác nhận">
              <div className="space-y-3">
                {contract.signatures.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-400">Chưa có chữ ký nào.</p>
                ) : (
                  contract.signatures.map((signature) => (
                    <div key={signature.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center gap-2">
                        <UserRound size={16} className="text-primary-500" />
                        <p className="font-bold text-slate-900">{signature.actorName}</p>
                      </div>
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{signature.role} · {signature.method}</p>
                      <p className="mt-2 text-xs text-slate-500">{signature.signedAt}</p>
                      <p className="mt-1 text-xs text-slate-500">{signature.evidence}</p>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>

            <SectionCard title="Version và audit log">
              <div className="space-y-3">
                {contract.snapshotHistory.map((snapshot) => (
                  <div key={snapshot.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-slate-900">{snapshot.version}</p>
                      <Tag>{snapshot.createdAt.slice(0, 10)}</Tag>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{snapshot.note}</p>
                  </div>
                ))}

                {contract.auditLogs.map((log) => (
                  <div key={log.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <Clock3 size={15} className="text-amber-500" />
                      <p className="text-sm font-bold text-slate-900">{log.note}</p>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{log.actorName} · {log.at}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </aside>
        </section>
      </div>
    </AppShell>
  )
}
