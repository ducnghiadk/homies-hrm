'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Eye, FileText, Save, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { EmployeeService } from '@/lib/services/employee-service'
import { useAuthStore } from '@/store/auth-store'
import { mockPositions, mockStores } from '@/lib/mock-data'
import { INVITATION_COPY } from './_components/invitation-copy'
import { InvitationEmailPreview } from './_components/InvitationEmailPreview'
import { InvitationFormPanels } from './_components/InvitationFormPanels'
import { InvitationSuccessView } from './_components/InvitationSuccessView'
import { createInitialEmailConfig, INITIAL_FORM } from './_components/invitation-state'
import type {
  CreatedInvitationState,
  InvitationEmailConfig,
  InvitationFormData,
  InvitationFormErrors,
} from './_components/invitation-types'
import { validateInvitationForm } from './_components/invitation-validation'

const INVITATION_PRESETS = [
  {
    id: 'barista_fulltime',
    label: 'Barista full-time',
    store_id: 'store-001',
    position_id: 'pos-001',
    employee_type: 'full_time',
    role: 'employee',
    is_probationary: true,
  },
  {
    id: 'cashier_parttime',
    label: 'Thu ngân part-time',
    store_id: 'store-002',
    position_id: 'pos-003',
    employee_type: 'part_time',
    role: 'employee',
    is_probationary: true,
  },
  {
    id: 'shift_leader',
    label: 'Trưởng ca',
    store_id: 'store-003',
    position_id: 'pos-004',
    employee_type: 'full_time',
    role: 'shift_leader',
    is_probationary: false,
  },
] as const

const STEP_ITEMS = [
  { step: 1, title: 'Chọn preset', hint: 'Vị trí và cửa hàng' },
  { step: 2, title: 'Nhập offer', hint: 'Thông tin và email' },
  { step: 3, title: 'Kiểm tra gửi', hint: 'Checklist sẵn sàng' },
] as const

async function sendInvitationEmailRequest(input: {
  id: string
  full_name: string
  email: string
  store_id: string
  position_id: string
  email_subject?: string
  email_personal_note?: string
  email_deadline?: string
  email_support_name?: string
  email_support_info?: string
  hire_date?: string
  department_name?: string
  employee_type?: string
  job_level?: string
  official_salary?: number
  kpi_salary?: number
  is_probationary?: boolean
  probation_policy?: string
  probation_end_date?: string
  probation_salary_mode?: string
  probation_salary_value?: number
  auto_complete_probation?: boolean
}) {
  const response = await fetch('/api/invitations/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      invitation: input,
    }),
  })

  const result = await response.json() as { ok: boolean; error?: string }
  return result
}

export default function NewInvitationPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [form, setForm] = useState<InvitationFormData>(INITIAL_FORM)
  const [emailConfig, setEmailConfig] = useState<InvitationEmailConfig>(() => createInitialEmailConfig())
  const [errors, setErrors] = useState<InvitationFormErrors>({})
  const [saving, setSaving] = useState(false)
  const [createdInvitation, setCreatedInvitation] = useState<CreatedInvitationState | null>(null)
  const [previewPulse, setPreviewPulse] = useState(0)

  const getDefaultDepartment = (positionId: string) => {
    const position = mockPositions.find((item) => item.id === positionId)
    if (!position) return ''
    if (position.level >= 4) return 'Quản lý cửa hàng'
    if (position.level === 3) return 'Quản lý cửa hàng'
    return 'Vận hành cửa hàng'
  }

  const getDefaultSalary = (positionId: string) => {
    const position = mockPositions.find((item) => item.id === positionId)
    return position?.base_salary?.toString() || ''
  }

  const getDefaultProbationEndDate = (hireDate: string) => {
    if (!hireDate) return ''
    const date = new Date(`${hireDate}T00:00:00`)
    if (Number.isNaN(date.getTime())) return ''
    date.setDate(date.getDate() + 60)
    return date.toISOString().split('T')[0]
  }

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const readinessChecks = useMemo(() => {
    return [
      { label: 'Có tên ứng viên', done: Boolean(form.full_name.trim()) },
      { label: 'Có email liên hệ', done: Boolean(form.email.trim()) },
      { label: 'Có chi nhánh và vị trí', done: Boolean(form.store_id && form.position_id) },
      { label: 'Có mức lương chính thức', done: Number(form.official_salary || 0) > 0 },
      { label: 'Đã đặt ngày vào làm', done: Boolean(form.hire_date) },
      { label: 'Nội dung email hoàn chỉnh', done: Boolean(emailConfig.subject.trim() && emailConfig.deadline.trim()) },
    ]
  }, [emailConfig.deadline, emailConfig.subject, form.email, form.full_name, form.hire_date, form.official_salary, form.position_id, form.store_id])

  const readinessPercent = Math.round((readinessChecks.filter((item) => item.done).length / readinessChecks.length) * 100)
  const completedChecks = readinessChecks.filter((item) => item.done).length
  const currentStepMeta = STEP_ITEMS.find((item) => item.step === currentStep)

  if (!isAuthenticated || !user) {
    return null
  }

  const canAccess = ['ceo', 'hr_admin'].includes(user.role)

  if (!canAccess) {
    return (
      <AppShell title={INVITATION_COPY.accessDeniedTitle}>
        <div className="py-20 text-center text-gray-500">
          {INVITATION_COPY.accessDeniedMessage}
        </div>
      </AppShell>
    )
  }

  const updateForm = (key: keyof InvitationFormData, value: string | boolean) => {
    setForm((current) => {
      const next = { ...current, [key]: value }

      if (key === 'position_id') {
        const positionId = String(value)
        next.department_name = current.department_name || getDefaultDepartment(positionId)
        next.official_salary = current.official_salary || getDefaultSalary(positionId)
        next.probation_salary_value = current.probation_salary_value || getDefaultSalary(positionId)
      }

      if (key === 'hire_date') {
        const hireDate = String(value)
        next.probation_end_date = current.probation_end_date || getDefaultProbationEndDate(hireDate)
      }

      return next
    })

    if (errors[key as keyof InvitationFormErrors]) {
      setErrors((current) => ({ ...current, [key]: undefined }))
    }
  }

  const updateEmailConfig = (key: keyof InvitationEmailConfig, value: string) => {
    setEmailConfig((current) => ({ ...current, [key]: value }))
  }

  const applyPreset = (presetId: string) => {
    const preset = INVITATION_PRESETS.find((item) => item.id === presetId)
    if (!preset) return

    setSelectedPreset(presetId)
    setForm((current) => {
      const next = {
        ...current,
        store_id: preset.store_id,
        position_id: preset.position_id,
        employee_type: preset.employee_type,
        role: preset.role,
        is_probationary: preset.is_probationary,
      }

      next.department_name = getDefaultDepartment(preset.position_id)
      next.official_salary = getDefaultSalary(preset.position_id)
      next.probation_salary_value = getDefaultSalary(preset.position_id)
      if (current.hire_date) {
        next.probation_end_date = getDefaultProbationEndDate(current.hire_date)
      }

      return next
    })
  }

  const buildInvitationPayload = () => ({
    full_name: form.full_name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    hire_date: form.hire_date,
    store_id: form.store_id,
    position_id: form.position_id,
    department_name: form.department_name.trim(),
    employee_type: form.employee_type,
    job_level: form.job_level,
    official_salary: Number(form.official_salary),
    kpi_salary: Number(form.kpi_salary || 0),
    is_probationary: form.is_probationary,
    probation_policy: form.probation_policy,
    probation_end_date: form.probation_end_date,
    probation_salary_mode: form.probation_salary_mode,
    probation_salary_value: Number(form.probation_salary_value || 0),
    auto_complete_probation: form.auto_complete_probation,
    role: form.role,
    notes: form.notes.trim() || undefined,
    email_subject: emailConfig.subject,
    email_personal_note: emailConfig.personalNote,
    email_deadline: emailConfig.deadline,
    email_support_name: emailConfig.supportName,
    email_support_info: emailConfig.supportInfo,
  })

  const validateCurrentForm = () => {
    const nextErrors = validateInvitationForm(form)
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSaveDraft = async () => {
    if (!validateCurrentForm()) return

    setSaving(true)
    const created = EmployeeService.createInvitation(buildInvitationPayload(), user.id)

    await new Promise((resolve) => setTimeout(resolve, 400))

    setSaving(false)
    setCreatedInvitation({
      id: created.id,
      full_name: created.full_name,
      email: created.email,
      status: 'draft',
      send_status: 'sent_failed',
      last_send_error: 'Lời mời đang được lưu ở trạng thái nháp, chưa gửi email.',
    })
  }

  const handleSaveAndSend = async () => {
    if (!validateCurrentForm()) return

    setSaving(true)
    const created = EmployeeService.createInvitation(buildInvitationPayload(), user.id)

    const sendResult = await sendInvitationEmailRequest({
      id: created.id,
      full_name: created.full_name,
      email: created.email,
      store_id: created.store_id,
      position_id: created.position_id,
      email_subject: created.email_subject,
      email_personal_note: created.email_personal_note,
      email_deadline: created.email_deadline,
      email_support_name: created.email_support_name,
      email_support_info: created.email_support_info,
      hire_date: created.hire_date,
      department_name: created.department_name,
      employee_type: created.employee_type,
      job_level: created.job_level,
      official_salary: created.official_salary,
      kpi_salary: created.kpi_salary,
      is_probationary: created.is_probationary,
      probation_policy: created.probation_policy,
      probation_end_date: created.probation_end_date,
      probation_salary_mode: created.probation_salary_mode,
      probation_salary_value: created.probation_salary_value,
      auto_complete_probation: created.auto_complete_probation,
    })

    const sent = sendResult.ok
      ? EmployeeService.sendInvitation(created.id, user)
      : EmployeeService.markInvitationSendFailed(
          created.id,
          sendResult.error || INVITATION_COPY.sendFailedMessage,
          user,
        )

    await new Promise((resolve) => setTimeout(resolve, 600))

    setSaving(false)
    setCreatedInvitation({
      id: created.id,
      full_name: created.full_name,
      email: created.email,
      status: sent ? 'sent' : 'draft',
      send_status: sent ? 'sent_success' : 'sent_failed',
      last_send_error: sent?.last_send_error,
    })
  }

  const handlePreviewOnly = () => {
    validateCurrentForm()
    setPreviewPulse((current) => current + 1)
    setCurrentStep(3)
  }

  const handleCreateAnother = () => {
    setForm(INITIAL_FORM)
    setEmailConfig(createInitialEmailConfig())
    setErrors({})
    setCreatedInvitation(null)
    setCurrentStep(1)
    setSelectedPreset('')
  }

  if (createdInvitation) {
    return (
      <InvitationSuccessView
        createdInvitation={createdInvitation}
        form={form}
        onBack={() => router.back()}
        onOpenList={() => router.push('/employees/invitations')}
        onCreateAnother={handleCreateAnother}
      />
    )
  }

  return (
    <AppShell>
      <div className="animate-fade-in space-y-4 pb-20">
        <button
          type="button"
          onClick={() => router.push('/employees/invitations')}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700"
        >
          <ArrowLeft size={16} />
          Danh sách lời mời
        </button>

        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)]">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-600">Mời nhân sự</p>
                <h1 className="mt-1 text-2xl font-bold text-dark-700 font-['Poppins']">Tạo lời mời nhân sự</h1>
                <p className="mt-1 max-w-3xl text-sm text-gray-500">
                  Đi theo đúng 3 bước để chốt preset, hoàn thiện offer và kiểm tra độ sẵn sàng trước khi gửi email cho ứng viên.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-primary-100 bg-primary-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Độ sẵn sàng</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{readinessPercent}%</p>
                  <p className="mt-1 text-sm text-slate-600">Tỷ lệ hoàn thiện theo checklist trước khi gửi.</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Đã đủ mục</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{completedChecks}/{readinessChecks.length}</p>
                  <p className="mt-1 text-sm text-slate-600">Số điểm đã hoàn tất trong toàn bộ checklist.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Bước đang làm</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{currentStep}/3</p>
                  <p className="mt-1 text-sm text-slate-600">{currentStepMeta?.title}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
              <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-primary-100 bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-700">
                <FileText size={16} />
                Form online có kiểm soát
              </div>

              <div className="mt-4 space-y-2">
                <button
                  type="submit"
                  form="new-invitation-form"
                  disabled={saving}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {INVITATION_COPY.savingLabel}
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      {INVITATION_COPY.submitLabel}
                    </>
                  )}
                </button>

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => void handleSaveDraft()}
                    disabled={saving}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save size={18} />
                    Lưu nháp
                  </button>

                  <button
                    type="button"
                    onClick={handlePreviewOnly}
                    disabled={saving}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-warning-200 bg-warning-50 px-4 text-sm font-semibold text-warning-700 transition-colors hover:bg-warning-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Eye size={18} />
                    Xem trước
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => router.push('/employees/invitations')}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100"
                >
                  {INVITATION_COPY.cancelLabel}
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-3">
          {STEP_ITEMS.map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => setCurrentStep(item.step)}
              className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                currentStep === item.step
                  ? 'border-primary-200 bg-primary-50'
                  : 'border-gray-100 bg-white'
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Bước {item.step}</p>
              <p className="mt-1 font-semibold text-gray-900">{item.title}</p>
              <p className="mt-1 text-sm text-gray-500">{item.hint}</p>
            </button>
          ))}
        </div>

        <form
          id="new-invitation-form"
          onSubmit={(event) => {
            event.preventDefault()
            void handleSaveAndSend()
          }}
        >
          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="min-w-0 space-y-4">
              <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Preset nhanh theo vị trí</p>
                    <p className="text-xs text-gray-500">Dùng preset để đổ nhanh cửa hàng, vị trí, loại nhân viên và thử việc.</p>
                  </div>
                  <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                    Sẵn sàng {readinessPercent}%
                  </span>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  {INVITATION_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset.id)}
                      className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                        selectedPreset === preset.id
                          ? 'border-primary-200 bg-primary-50'
                          : 'border-gray-100 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <p className="font-semibold text-gray-900">{preset.label}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {mockStores.find((store) => store.id === preset.store_id)?.name.replace('Homies Milk Tea - ', '') || preset.store_id}
                        {' • '}
                        {mockPositions.find((position) => position.id === preset.position_id)?.name || preset.position_id}
                      </p>
                    </button>
                  ))}
                </div>
              </section>

              <InvitationFormPanels
                form={form}
                errors={errors}
                emailConfig={emailConfig}
                onUpdate={updateForm}
                onEmailConfigChange={updateEmailConfig}
              />

              <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Checklist trước khi gửi</p>
                    <p className="text-xs text-gray-500">Giảm trường hợp gửi lời mời khi offer chưa đủ thông tin.</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {completedChecks}/{readinessChecks.length}
                  </span>
                </div>

                <div className="mt-4 grid gap-2">
                  {readinessChecks.map((item) => (
                    <div key={item.label} className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-3 text-sm">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
                        item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {item.done ? '✓' : '!'}
                      </span>
                      <span className={item.done ? 'text-gray-900' : 'text-gray-600'}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div key={previewPulse} className="min-w-0 space-y-4 xl:sticky xl:top-4 xl:min-w-[380px] xl:self-start">
              <InvitationEmailPreview form={form} emailConfig={emailConfig} />
              <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Tóm tắt offer</p>
                    <p className="text-xs text-gray-500">Khối rà nhanh trước khi lưu nháp hoặc gửi email.</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    Bước {currentStep}
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-sm text-gray-600">
                  <p>Ứng viên: <span className="font-semibold text-gray-900">{form.full_name || 'Chưa nhập'}</span></p>
                  <p>Chi nhánh: <span className="font-semibold text-gray-900">{mockStores.find((store) => store.id === form.store_id)?.name.replace('Homies Milk Tea - ', '') || 'Chưa chọn'}</span></p>
                  <p>Vị trí: <span className="font-semibold text-gray-900">{mockPositions.find((position) => position.id === form.position_id)?.name || 'Chưa chọn'}</span></p>
                  <p>Lương chính: <span className="font-semibold text-gray-900">{form.official_salary || '0'}</span></p>
                  <p>Deadline phản hồi: <span className="font-semibold text-gray-900">{emailConfig.deadline || 'Chưa đặt'}</span></p>
                </div>
              </section>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
