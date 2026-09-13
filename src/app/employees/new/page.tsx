'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { mockPositions, mockStores } from '@/lib/mock-data'
import { EmployeeService } from '@/lib/services/employee-service'
import { useAuthStore } from '@/store/auth-store'
import type { AuthUser } from '@/store/auth-store'
import { ArrowLeft, Briefcase, CheckCircle2, ChevronRight, FileText, Save, ShieldCheck, User, UserPlus, Users } from 'lucide-react'

type WorkStatus = 'sap_nhan_viec' | 'thu_viec' | 'dang_lam' | 'da_nghi'
type AccountStatus = 'chua_kich_hoat' | 'dang_hoat_dong' | 'bi_khoa'

type FormData = {
  full_name: string
  phone: string
  email: string
  hire_date: string
  store_id: string
  position_id: string
  role: string
  work_status: WorkStatus
  account_status: AccountStatus
}

type FormErrors = Partial<Record<keyof FormData, string>>

const WORK_STATUS_OPTIONS: { value: WorkStatus; label: string }[] = [
  { value: 'dang_lam', label: 'Đang làm việc' },
  { value: 'thu_viec', label: 'Thử việc' },
  { value: 'sap_nhan_viec', label: 'Sắp nhận việc' },
  { value: 'da_nghi', label: 'Đã nghỉ việc' },
]

const ACCOUNT_STATUS_OPTIONS: { value: AccountStatus; label: string }[] = [
  { value: 'chua_kich_hoat', label: 'Chưa kích hoạt' },
  { value: 'dang_hoat_dong', label: 'Đang hoạt động' },
  { value: 'bi_khoa', label: 'Bị khóa' },
]

const ROLE_OPTIONS = [
  { value: 'employee', label: 'Nhân viên' },
  { value: 'shift_leader', label: 'Trưởng ca' },
  { value: 'store_manager', label: 'Quản lý cửa hàng' },
]

const mapWorkStatusToAuthStatus = (workStatus: WorkStatus): AuthUser['status'] => {
  switch (workStatus) {
    case 'sap_nhan_viec':
      return 'inactive'
    case 'thu_viec':
      return 'probation'
    case 'da_nghi':
      return 'resigned'
    default:
      return 'active'
  }
}

const getInputClassName = (hasError: boolean) =>
  `w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 outline-none transition-all ${
    hasError ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-gray-200 bg-white focus:border-primary-400'
  }`

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {hint ? <span className="text-xs text-gray-400">{hint}</span> : null}
      </div>
      {children}
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </label>
  )
}

function StepBadge({ active, done, index, label }: { active: boolean; done: boolean; index: number; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
        done ? 'bg-emerald-100 text-emerald-700' : active ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'
      }`}>
        {done ? '✓' : index}
      </span>
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{done ? 'Đã sẵn sàng' : active ? 'Đang nhập' : 'Chờ bước này'}</p>
      </div>
    </div>
  )
}

export default function NewEmployeePage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [form, setForm] = useState<FormData>({
    full_name: '',
    phone: '',
    email: '',
    hire_date: new Date().toISOString().slice(0, 10),
    store_id: '',
    position_id: '',
    role: 'employee',
    work_status: 'dang_lam',
    account_status: 'chua_kich_hoat',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const [createdEmployee, setCreatedEmployee] = useState<{ id: string; employee_code: string; full_name: string } | null>(null)

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login?redirect=/employees/new')
    }
  }, [hasHydrated, isAuthenticated, router])

  const nextDraft = useMemo(() => EmployeeService.getNextEmployeeDraft(), [])
  const selectedStore = mockStores.find((store) => store.id === form.store_id)
  const selectedPosition = mockPositions.find((position) => position.id === form.position_id)
  const readinessCount = [
    form.full_name.trim(),
    form.phone.trim(),
    form.hire_date,
    form.store_id,
    form.position_id,
    form.role,
  ].filter(Boolean).length

  if (!user) return null

  const hasPermission = ['hr_admin', 'ceo'].includes(user.role)
  if (!hasPermission) {
    return (
      <AppShell title="Thêm nhân sự">
        <div className="py-20 text-center text-gray-500">Bạn không có quyền truy cập trang này.</div>
      </AppShell>
    )
  }

  const update = (key: keyof FormData, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
    if (errors[key]) {
      setErrors((current) => ({ ...current, [key]: undefined }))
    }
  }

  const validate = (targetStep?: number) => {
    const nextErrors: FormErrors = {}

    if (!form.full_name.trim()) nextErrors.full_name = 'Vui lòng nhập họ và tên'
    if (!form.phone.trim()) {
      nextErrors.phone = 'Vui lòng nhập số điện thoại'
    } else if (!/^[0-9]{9,11}$/.test(form.phone.replace(/\s/g, ''))) {
      nextErrors.phone = 'Số điện thoại không hợp lệ'
    } else if (EmployeeService.isPhoneDuplicate(form.phone)) {
      nextErrors.phone = 'Số điện thoại đã tồn tại trong hệ thống'
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Email không hợp lệ'
    } else if (form.email && EmployeeService.isEmailDuplicate(form.email)) {
      nextErrors.email = 'Email đã tồn tại trong hệ thống'
    }

    if (!form.hire_date) nextErrors.hire_date = 'Vui lòng chọn ngày vào làm'
    if (!form.store_id) nextErrors.store_id = 'Vui lòng chọn chi nhánh'
    if (!form.position_id) nextErrors.position_id = 'Vui lòng chọn chức danh'
    if (!form.role) nextErrors.role = 'Vui lòng chọn vai trò'
    if (!form.work_status) nextErrors.work_status = 'Vui lòng chọn tình trạng làm việc'

    if (targetStep === 1) {
      const stepOneErrors = Object.fromEntries(
        Object.entries(nextErrors).filter(([key]) => ['full_name', 'phone', 'email', 'hire_date'].includes(key)),
      ) as FormErrors
      setErrors((current) => ({ ...current, ...stepOneErrors }))
      return Object.keys(stepOneErrors).length === 0
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)

    const result = EmployeeService.createEmployee({
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      hire_date: form.hire_date,
      store_id: form.store_id,
      position_id: form.position_id,
      role: form.role as AuthUser['role'],
      status: mapWorkStatusToAuthStatus(form.work_status),
      account_status: form.account_status,
    }, user, 'manual')

    await new Promise((resolve) => setTimeout(resolve, 300))
    setSaving(false)
    setCreatedEmployee({
      id: result.id,
      employee_code: result.employee_code,
      full_name: result.full_name,
    })
  }

  if (createdEmployee) {
    return (
      <AppShell title="Thêm nhân sự">
        <div className="space-y-4">
          <button onClick={() => router.push('/employees')} className="flex items-center gap-1 text-sm font-medium text-primary-500 hover:text-primary-600">
            <ArrowLeft size={16} /> Quay lại danh sách
          </button>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 size={40} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Đã tạo nhân sự thành công</h2>
            <p className="mt-2 text-sm text-gray-500">{createdEmployee.full_name} • {createdEmployee.employee_code}</p>

            <div className="mt-6 grid gap-3">
              <button onClick={() => router.push(`/employees/${createdEmployee.id}`)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 text-sm font-semibold text-white hover:bg-primary-600">
                <User size={18} /> Xem hồ sơ
              </button>
              <button onClick={() => router.push(`/employees/contracts?employeeId=${createdEmployee.id}`)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 text-sm font-semibold text-primary-700 hover:bg-primary-100">
                <FileText size={18} /> Tạo hợp đồng
              </button>
              <button onClick={() => window.location.reload()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <UserPlus size={18} /> Thêm nhân sự khác
              </button>
              <button onClick={() => router.push('/employees')} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-200">
                <Users size={18} /> Về danh sách nhân sự
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  if (!hasHydrated || !user) {
    return (
      <AppShell title="Thêm nhân sự">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Thêm nhân sự">
      <div className="space-y-4">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm font-medium text-primary-500 hover:text-primary-600">
          <ArrowLeft size={16} /> Quay lại
        </button>

        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.95fr)]">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-600">Nhân sự</p>
                <h1 className="mt-1 text-2xl font-bold text-dark-700 font-['Poppins']">Thêm nhân sự trực tiếp</h1>
                <p className="mt-1 text-sm text-gray-500">Tạo hồ sơ nhân sự mới, kiểm tra dữ liệu đầu vào và sẵn sàng đi tiếp sang hợp đồng hoặc phân quyền.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-primary-100 bg-primary-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Mã dự kiến</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{nextDraft.employee_code}</p>
                  <p className="mt-1 text-sm text-slate-600">Tự sinh theo quy tắc hiện tại của hệ thống.</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Độ sẵn sàng</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{Math.round((readinessCount / 6) * 100)}%</p>
                  <p className="mt-1 text-sm text-slate-600">Tính theo các trường chính để tạo hồ sơ.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Bước đang làm</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{currentStep}/2</p>
                  <p className="mt-1 text-sm text-slate-600">{currentStep === 1 ? 'Thông tin cá nhân' : 'Thông tin công việc'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary-500" />
                <h2 className="text-base font-bold text-gray-900">Xem trước hồ sơ</h2>
              </div>

              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <div className="rounded-2xl bg-white p-4">
                  <p className="font-semibold text-gray-900">{form.full_name || 'Chưa nhập tên'}</p>
                  <p className="mt-1">{form.phone || 'Chưa nhập số điện thoại'}</p>
                  <p className="mt-1">{form.email || 'Chưa nhập email'}</p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-4">
                  <p><span className="font-medium text-gray-900">Mã dự kiến:</span> {nextDraft.employee_code}</p>
                  <p className="mt-2"><span className="font-medium text-gray-900">Chi nhánh:</span> {selectedStore ? selectedStore.name.replace('Homies Milk Tea - ', '') : 'Chưa chọn'}</p>
                  <p className="mt-2"><span className="font-medium text-gray-900">Chức danh:</span> {selectedPosition?.name || 'Chưa chọn'}</p>
                  <p className="mt-2"><span className="font-medium text-gray-900">Vai trò:</span> {ROLE_OPTIONS.find((option) => option.value === form.role)?.label || 'Nhân viên'}</p>
                  <p className="mt-2"><span className="font-medium text-gray-900">Ngày vào làm:</span> {form.hire_date || 'Chưa chọn'}</p>
                </div>

                <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4 text-primary-700">
                  <p className="font-semibold">Sẵn sàng tạo hồ sơ</p>
                  <p className="mt-1 text-2xl font-bold">{Math.round((readinessCount / 6) * 100)}%</p>
                  <p className="mt-2 text-xs">Sau khi tạo xong, bạn có thể đi tiếp sang hồ sơ nhân sự hoặc tạo hợp đồng ngay.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void handleSave()
            }}
            className="space-y-4"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <StepBadge active={currentStep === 1} done={readinessCount >= 4} index={1} label="Thông tin cá nhân" />
              <StepBadge active={currentStep === 2} done={Boolean(form.store_id && form.position_id && form.role)} index={2} label="Thông tin công việc" />
            </div>

            {currentStep === 1 ? (
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <User size={18} className="text-primary-500" />
                  <h2 className="text-lg font-bold text-gray-900">Thông tin cá nhân</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Họ và tên" error={errors.full_name}>
                    <input value={form.full_name} onChange={(event) => update('full_name', event.target.value)} className={getInputClassName(Boolean(errors.full_name))} />
                  </Field>
                  <Field label="Số điện thoại" error={errors.phone}>
                    <input value={form.phone} onChange={(event) => update('phone', event.target.value)} className={getInputClassName(Boolean(errors.phone))} />
                  </Field>
                  <Field label="Email" error={errors.email} hint="Có thể bỏ trống nếu chưa cấp">
                    <input value={form.email} onChange={(event) => update('email', event.target.value)} className={getInputClassName(Boolean(errors.email))} />
                  </Field>
                  <Field label="Ngày vào làm" error={errors.hire_date}>
                    <input type="date" value={form.hire_date} onChange={(event) => update('hire_date', event.target.value)} className={getInputClassName(Boolean(errors.hire_date))} />
                  </Field>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (validate(1)) setCurrentStep(2)
                    }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-semibold text-white hover:bg-primary-600"
                  >
                    Sang bước 2
                    <ChevronRight size={18} />
                  </button>
                </div>
              </section>
            ) : (
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Briefcase size={18} className="text-primary-500" />
                  <h2 className="text-lg font-bold text-gray-900">Thông tin công việc</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Chi nhánh" error={errors.store_id}>
                    <select value={form.store_id} onChange={(event) => update('store_id', event.target.value)} className={getInputClassName(Boolean(errors.store_id))}>
                      <option value="">Chọn chi nhánh</option>
                      {mockStores.map((store) => (
                        <option key={store.id} value={store.id}>{store.name.replace('Homies Milk Tea - ', '')}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Chức danh" error={errors.position_id}>
                    <select value={form.position_id} onChange={(event) => update('position_id', event.target.value)} className={getInputClassName(Boolean(errors.position_id))}>
                      <option value="">Chọn chức danh</option>
                      {mockPositions.map((position) => (
                        <option key={position.id} value={position.id}>{position.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Vai trò hệ thống" error={errors.role}>
                    <select value={form.role} onChange={(event) => update('role', event.target.value)} className={getInputClassName(Boolean(errors.role))}>
                      {ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Tình trạng làm việc" error={errors.work_status}>
                    <select value={form.work_status} onChange={(event) => update('work_status', event.target.value)} className={getInputClassName(Boolean(errors.work_status))}>
                      {WORK_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Trạng thái tài khoản">
                    <select value={form.account_status} onChange={(event) => update('account_status', event.target.value)} className={getInputClassName(false)}>
                      {ACCOUNT_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="mt-5 flex flex-wrap justify-between gap-3">
                  <button type="button" onClick={() => setCurrentStep(1)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                    <ArrowLeft size={18} />
                    Về bước 1
                  </button>

                  <button type="submit" disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-semibold text-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60">
                    <Save size={18} />
                    {saving ? 'Đang lưu...' : 'Tạo nhân sự'}
                  </button>
                </div>
              </section>
            )}
          </form>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary-500" />
                <h2 className="text-lg font-bold text-gray-900">Lưu ý nhanh</h2>
              </div>

              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="font-semibold text-gray-900">Bước 1</p>
                  <p className="mt-1">Hoàn thiện họ tên, số điện thoại, email và ngày vào làm trước khi sang bước 2.</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="font-semibold text-gray-900">Bước 2</p>
                  <p className="mt-1">Chốt chi nhánh, chức danh, vai trò và trạng thái để hồ sơ mới khớp với vận hành thực tế.</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  )
}
