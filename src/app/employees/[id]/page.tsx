'use client'

import type { ChangeEvent, ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import ProfileOverviewTab from '@/components/employee-profile/ProfileOverviewTab'
import { getPositionById, getStoreById, mockAttendances, mockPositions, mockStores } from '@/lib/mock-data'
import { ContractService, CONTRACT_STATUS_META, type EmployeeContract } from '@/lib/services/contract-service'
import { EmployeeService, getDepartmentName } from '@/lib/services/employee-service'
import { employeeAdapter } from '@/lib/adapters'
import { OnboardingPolicyService, type OnboardingPolicyHistoryItem, type OnboardingPolicyStatus } from '@/lib/services/onboarding-policy-service'
import { formatDate, formatTime, getInitials, getStatusColor, getStatusLabel } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'
import type { AuthUser } from '@/store/auth-store'


type EmployeeProfileExtras = {
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other'
  cccd?: string
  address?: string
  current_address?: string
  emergency_contact?: string
  candidate_notes?: string
  bank_name?: string
  bank_account_no?: string
  bank_account_holder?: string
  cccd_issue_date?: string
  tax_code?: string
  official_salary?: number
  base_salary?: number
  kpi_salary?: number
  has_insurance?: boolean
  dependents_count?: number
  marital_status?: string
}

type WorkStatus = 'sap_nhan_viec' | 'thu_viec' | 'dang_lam' | 'da_nghi'
type AccountStatus = 'chua_kich_hoat' | 'dang_hoat_dong' | 'bi_khoa'

type EditFormData = {
  full_name: string
  phone: string
  email: string
  hire_date: string
  store_id: string
  secondary_store_ids: string[]
  position_id: string
  secondary_position_ids: string[]
  department_name: string
  role: string
  work_status: WorkStatus
  account_status: AccountStatus
  date_of_birth: string
  gender: '' | 'male' | 'female' | 'other'
  cccd: string
  cccd_issue_date: string
  address: string
  current_address: string
  emergency_contact: string
  marital_status: string
  bank_name: string
  bank_account_no: string
  bank_account_holder: string
  tax_code: string
  base_salary: string
  kpi_salary: string
  has_insurance: boolean
  dependents_count: string
}

type EditFormErrors = Partial<Record<keyof EditFormData, string>>

type TimelineItem = {
  id: string
  kind: 'profile' | 'contract'
  created_at: string
  badge: string
  title: string
  detail: string
  actor?: string
}

type ProfileChecklistItem = {
  id: string
  label: string
  done: boolean
  hint: string
}

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

const ROLE_LABELS: Record<string, string> = {
  employee: 'Nhân viên',
  shift_leader: 'Trưởng ca',
  store_manager: 'Quản lý cửa hàng',
  hr_admin: 'HR Admin',
  ceo: 'CEO',
}

const getAccountStatusMeta = (status?: string) => {
  switch (status) {
    case 'dang_hoat_dong':
      return { label: 'Đang hoạt động', className: 'bg-green-50 text-green-700 border-green-100' }
    case 'bi_khoa':
      return { label: 'Bị khóa', className: 'bg-red-50 text-red-700 border-red-100' }
    default:
      return { label: 'Chưa kích hoạt', className: 'bg-yellow-50 text-yellow-700 border-yellow-100' }
  }
}

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'ceo': return 'CEO / Giám đốc điều hành'
    case 'hr_admin': return 'HR Admin / Quản trị nhân sự'
    case 'store_manager': return 'Store Manager / Quản lý cửa hàng'
    case 'shift_leader': return 'Shift Leader / Trưởng ca'
    default: return 'Employee / Nhân viên'
  }
}

const getStoreDisplayName = (storeName?: string) => {
  if (!storeName) return 'Chưa phân bổ'
  const normalizedName = storeName.replace('Homies Milk Tea - ', '').trim()
  return normalizedName || 'Chưa phân bổ'
}

const getActivityActionLabel = (action?: string) => {
  switch (action) {
    case 'created': return 'Tạo hồ sơ'
    case 'approved_from_invitation': return 'Duyệt từ lời mời'
    case 'imported': return 'Nhập từ file'
    case 'status_changed': return 'Đổi trạng thái làm việc'
    case 'account_changed': return 'Đổi trạng thái tài khoản'
    case 'offboarding_completed': return 'Hoàn tất offboarding'
    case 'updated': return 'Cập nhật hồ sơ'
    default: return action || 'Cập nhật'
  }
}

const getWorkStatusMeta = (status?: AuthUser['status']) => {
  switch (status) {
    case 'inactive': return { label: 'Sắp nhận việc', className: 'bg-blue-50 text-blue-700 border-blue-100' }
    case 'probation': return { label: 'Thử việc', className: 'bg-amber-50 text-amber-700 border-amber-100' }
    case 'resigned': return { label: 'Đã nghỉ việc', className: 'bg-primary-50 text-gray-700 border-gray-200' }
    default: return { label: 'Đang làm việc', className: 'bg-green-50 text-green-700 border-green-100' }
  }
}

const getGenderLabel = (gender?: EmployeeProfileExtras['gender'] | '') => {
  switch (gender) {
    case 'male': return 'Nam'
    case 'female': return 'Nữ'
    case 'other': return 'Khác'
    default: return ''
  }
}

const getOnboardingPolicyStatusMeta = (status?: OnboardingPolicyStatus) => {
  switch (status) {
    case 'da_xac_nhan': return { label: 'Đã xác nhận', tone: 'bg-green-50 text-green-700 border-green-100' }
    case 'can_giai_thich': return { label: 'Cần giải thích', tone: 'bg-red-50 text-red-700 border-red-100' }
    case 'can_nhac': return { label: 'Cần nhắc lại', tone: 'bg-amber-50 text-amber-700 border-amber-100' }
    case 'da_doc': return { label: 'Đã đọc', tone: 'bg-blue-50 text-blue-700 border-blue-100' }
    default: return { label: 'Chưa gửi', tone: 'bg-primary-50 text-gray-700 border-gray-200' }
  }
}

const mapStatusToWorkStatus = (status?: string): WorkStatus => {
  switch (status) {
    case 'inactive': return 'sap_nhan_viec'
    case 'probation': return 'thu_viec'
    case 'resigned': return 'da_nghi'
    default: return 'dang_lam'
  }
}

const mapWorkStatusToAuthStatus = (workStatus: WorkStatus): AuthUser['status'] => {
  switch (workStatus) {
    case 'sap_nhan_viec': return 'inactive'
    case 'thu_viec': return 'probation'
    case 'da_nghi': return 'resigned'
    default: return 'active'
  }
}

const InfoItem = ({ label, value, placeholder = 'Chưa cập nhật' }: { label: string; value?: string; placeholder?: string }) => (
  <div className="space-y-1.5">
    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
    {value ? (
      <p className="text-sm font-medium text-gray-900">{value}</p>
    ) : (
      <span className="inline-flex rounded-lg border border-dashed border-gray-200 bg-vanilla-50 px-2.5 py-1 text-xs text-gray-400">
        {placeholder}
      </span>
    )}
  </div>
)

function FormField({ label, error, children }: { label: ReactNode; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <div className="text-sm font-semibold text-gray-800">{label}</div>
      {children}
      {error ? <span className="text-xs font-semibold text-red-500">{error}</span> : null}
    </label>
  )
}

const getInputClassName = (hasError: boolean) =>
  `w-full rounded-2xl border px-4 py-3 text-sm text-gray-900 outline-none transition-all shadow-sm ${
    hasError ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100' : 'border-gray-200 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 hover:border-gray-300'
  }`

const MAX_AVATAR_FILE_SIZE = 2 * 1024 * 1024

const buildEditForm = (employee: AuthUser, profile?: EmployeeProfileExtras): EditFormData => ({
  full_name: employee.full_name || '',
  phone: employee.phone || '',
  email: employee.email || '',
  hire_date: employee.hire_date || '',
  store_id: employee.store_id || '',
  secondary_store_ids: employee.secondary_store_ids || [],
  position_id: employee.position_id || '',
  secondary_position_ids: employee.secondary_position_ids || [],
  department_name: employee.department_name || getDepartmentName(employee.position_id, employee.role),
  role: employee.role || 'employee',
  work_status: mapStatusToWorkStatus(employee.status),
  account_status: (employee.account_status || 'chua_kich_hoat') as AccountStatus,
  date_of_birth: profile?.date_of_birth || '',
  gender: profile?.gender || '',
  cccd: profile?.cccd || '',
  cccd_issue_date: profile?.cccd_issue_date || '',
  address: profile?.address || '',
  current_address: profile?.current_address || '',
  emergency_contact: profile?.emergency_contact || '',
  marital_status: profile?.marital_status || '',
  bank_name: profile?.bank_name || '',
  bank_account_no: profile?.bank_account_no || '',
  bank_account_holder: profile?.bank_account_holder || '',
  tax_code: profile?.tax_code || '',
  base_salary: (profile?.official_salary ?? profile?.base_salary ?? 0) > 0 ? String(profile?.official_salary ?? profile?.base_salary) : '',
  kpi_salary: profile?.kpi_salary ? String(profile.kpi_salary) : '',
  has_insurance: Boolean(profile?.has_insurance),
  dependents_count: profile?.dependents_count !== undefined ? String(profile.dependents_count) : '0',
})

export default function EmployeeDetailPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'personal' | 'job' | 'history'>('personal')
  const [refreshKey, setRefreshKey] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [employeeContracts, setEmployeeContracts] = useState<EmployeeContract[]>([])
  const [isLoadingContracts, setIsLoadingContracts] = useState(false)
  const [editErrors, setEditErrors] = useState<EditFormErrors>({})
  const [hrNoteDraft, setHrNoteDraft] = useState('')
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [customNewPassword, setCustomNewPassword] = useState('')
  const [resetResult, setResetResult] = useState<{ password?: string; message?: string } | null>(null)
  const [copiedPassword, setCopiedPassword] = useState(false)
  const [editSection, setEditSection] = useState<string>('all')
  const [isAdminConfigMode, setIsAdminConfigMode] = useState(false)
  const [requiredFields, setRequiredFields] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('HOMIES_EMPLOYEE_REQUIRED_FIELDS')
      if (saved) {
        try { return JSON.parse(saved) } catch {}
      }
    }
    return {
      full_name: true,
      phone: true,
      email: true,
      store_id: true,
      position_id: true,
      cccd: true,
      bank_account_no: true,
    }
  })

  const toggleFieldRequirement = (fieldKey: string) => {
    setRequiredFields(prev => {
      const next = { ...prev, [fieldKey]: !prev[fieldKey] }
      if (typeof window !== 'undefined') {
        localStorage.setItem('HOMIES_EMPLOYEE_REQUIRED_FIELDS', JSON.stringify(next))
      }
      return next
    })
  }

  const handleResetPasswordSubmit = () => {
    if (!employee || !canManageEmployee || !user) return
    const result = EmployeeService.resetEmployeePassword(employee.id, customNewPassword, user)
    if (result.success) {
      setResetResult(result)
      refreshProfile()
    }
  }

  const handleCopyResetInfo = () => {
    if (!employee || !resetResult?.password) return
    const text = `Thông tin tài khoản Homies HRM:\nEmail: ${employee.email}\nMật khẩu mới: ${resetResult.password}`
    navigator.clipboard.writeText(text)
    setCopiedPassword(true)
    setTimeout(() => setCopiedPassword(false), 2500)
  }

  const [editForm, setEditForm] = useState<EditFormData>({
    full_name: '',
    phone: '',
    email: '',
    hire_date: '',
    store_id: '',
    secondary_store_ids: [],
    position_id: '',
    secondary_position_ids: [],
    department_name: '',
    role: 'employee',
    work_status: 'dang_lam',
    account_status: 'chua_kich_hoat',
    date_of_birth: '',
    gender: '',
    cccd: '',
    cccd_issue_date: '',
    address: '',
    current_address: '',
    emergency_contact: '',
    marital_status: '',
    bank_name: '',
    bank_account_no: '',
    bank_account_holder: '',
    tax_code: '',
    base_salary: '',
    kpi_salary: '',
    has_insurance: false,
    dependents_count: '0',
  })

  const employeeId = params.id as string

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push(`/login?redirect=/employees/${employeeId}`)
    }
  }, [hasHydrated, isAuthenticated, employeeId, router])
  const [employee, setEmployee] = useState<AuthUser | undefined>(() => {
    return user ? EmployeeService.getEmployeeById(employeeId, user) : undefined
  })

  useEffect(() => {
    if (!user || !employeeId) return
    let isMounted = true
    employeeAdapter.getEmployeeById(employeeId, user).then((res) => {
      if (isMounted && res) {
        setEmployee(res)
      }
    })
    return () => {
      isMounted = false
    }
  }, [employeeId, user, refreshKey])
  const profile = employee as (typeof employee & EmployeeProfileExtras) | undefined
  const onboardingPolicyRecord = employee ? OnboardingPolicyService.getRecord(employee.id) : null
  const onboardingDayOneSnapshot = OnboardingPolicyService.getDayOneChecklistSnapshot(onboardingPolicyRecord)
  const onboardingPolicyStatus = getOnboardingPolicyStatusMeta(onboardingPolicyRecord?.status)
  const canManageEmployeePreview = ['ceo', 'hr_admin', 'store_manager', 'shift_leader'].includes(user?.role || '')
  const shouldShowEditPanelPreview = canManageEmployeePreview && (isEditing || searchParams.get('mode') === 'edit')
  const employeeTypeForSalaryHint = String(employee?.employee_type || '')
  const salaryInputHint = employeeTypeForSalaryHint === 'ban_thoi_gian' || employeeTypeForSalaryHint === 'part_time'
    ? 'Nhân viên bán thời gian: nhập đơn giá theo giờ, ví dụ 20000'
    : employeeTypeForSalaryHint === 'toan_thoi_gian' || employeeTypeForSalaryHint === 'full_time'
      ? 'Nhân viên toàn thời gian: nhập lương tháng, ví dụ 6600000'
      : ''

  useEffect(() => {
    if (!employee || !shouldShowEditPanelPreview) return
    const timer = window.setTimeout(() => {
      setEditForm(buildEditForm(employee, profile))
    }, 0)

    return () => window.clearTimeout(timer)
  }, [employee, profile, shouldShowEditPanelPreview])

  useEffect(() => {
    if (!employee) return
    const timer = window.setTimeout(() => {
      setHrNoteDraft(profile?.candidate_notes || '')
    }, 0)

    return () => window.clearTimeout(timer)
  }, [employee, profile?.candidate_notes])

  useEffect(() => {
    let cancelled = false
    if (!user || !employee) return

    void (async () => {
      setIsLoadingContracts(true)
      const nextContracts = await ContractService.getContractsForEmployee(employee.id, user)
      if (cancelled) return
      setEmployeeContracts(nextContracts)
      setIsLoadingContracts(false)
    })()

    return () => {
      cancelled = true
    }
  }, [employee, user])

  if (!user || !employee) return null

  const store = getStoreById(employee.store_id)
  const position = getPositionById(employee.position_id)
  const empAttendances = mockAttendances.filter(attendance => attendance.employee_id === employee.id).slice(0, 8)
  const accountStatus = getAccountStatusMeta(employee.account_status)
  const workStatus = getWorkStatusMeta(employee.status)
  const canManageEmployee = ['ceo', 'hr_admin', 'store_manager', 'shift_leader'].includes(user.role)
  const canOpenOffboarding = ['ceo', 'hr_admin', 'store_manager'].includes(user.role)
  const roleOptions = EmployeeService.getAllowedRoleOptions(user)
  const shouldShowEditPanel = canManageEmployee && (isEditing || searchParams.get('mode') === 'edit')
  const offboardingData = EmployeeService.getOffboardingByEmployee(employee.id)
  
  const completenessFields = [
    employee.full_name, employee.phone, employee.email, profile?.date_of_birth,
    profile?.gender, profile?.cccd, profile?.address, profile?.emergency_contact,
    employee.employee_code, employee.store_id, employee.position_id,
  ]
  const completeness = Math.round((completenessFields.filter(Boolean).length / completenessFields.length) * 100)
  const activityLogs = EmployeeService.getEmployeeActivityLogs(employee.id)
  const currentContract = employeeContracts.find((contract) => contract.status === 'active') || employeeContracts[0]
  const contractStatusMeta = currentContract ? CONTRACT_STATUS_META[currentContract.status] : null
  const expiringContract = employeeContracts.find((contract) => contract.status === 'active' && contract.endDate)
  const pendingContract = employeeContracts.find((contract) => ['pending_employee_sign', 'signed_by_employee', 'pending_hr_sign'].includes(contract.status))

  const profileChecklist: ProfileChecklistItem[] = [
    { id: 'phone', label: 'Số điện thoại liên hệ', done: Boolean(employee.phone), hint: 'Cần để liên hệ nhanh khi đổi ca.' },
    { id: 'email', label: 'Email nhân sự', done: Boolean(employee.email), hint: 'Dùng cho thông báo nội bộ.' },
    { id: 'identity', label: 'CCCD hoặc hộ chiếu', done: Boolean(profile?.cccd), hint: 'Cần cho hợp đồng, lương.' },
    { id: 'address', label: 'Địa chỉ thường trú', done: Boolean(profile?.address), hint: 'Cần cho hồ sơ lao động.' },
    { id: 'emergency', label: 'Liên hệ khẩn cấp', done: Boolean(profile?.emergency_contact), hint: 'Đầu mối khi cần khẩn cấp.' },
    { id: 'job', label: 'Chi nhánh và chức danh', done: Boolean(employee.store_id && employee.position_id), hint: 'Ảnh hưởng xếp ca, KPI.' },
  ]

  const completedChecklistCount = profileChecklist.filter(item => item.done).length
  const checklistPercent = Math.round((completedChecklistCount / profileChecklist.length) * 100)
  const overallStatusTone = employee.status === 'resigned'
    ? 'bg-primary-50 text-gray-700 border-gray-200'
    : checklistPercent >= 85 && currentContract && employee.account_status === 'dang_hoat_dong'
      ? 'bg-green-50 text-green-700 border-green-100'
      : 'bg-amber-50 text-amber-700 border-amber-100'

  const overallStatusLabel = employee.status === 'resigned'
    ? 'Đã đóng hồ sơ'
    : checklistPercent >= 85 && currentContract && employee.account_status === 'dang_hoat_dong'
      ? 'Sẵn sàng vận hành'
      : 'Cần bổ sung'

  const contractHealthLabel = pendingContract ? 'Đang chờ ký' : expiringContract?.endDate ? `Hiệu lực đến ${formatDate(expiringContract.endDate)}` : currentContract ? 'Đang theo dõi' : 'Chưa có hợp đồng'

  const refreshProfile = () => setRefreshKey(current => current + 1)

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!canManageEmployee) return
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || file.size > MAX_AVATAR_FILE_SIZE) return

    const reader = new FileReader()
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const updated = await employeeAdapter.updateEmployee(employee.id, { avatar_url: reader.result }, user, 'Cập nhật ảnh đại diện')
        if (updated && user.id === updated.id) {
          useAuthStore.setState({ user: updated })
        }
        refreshProfile()
      }
    }
    reader.readAsDataURL(file)
  }

  const closeEditModal = () => {
    setIsEditing(false)
    if (searchParams.get('mode') === 'edit') {
      router.replace(`/employees/${employee.id}`)
    }
  }

  const handleSaveProfile = async () => {
    if (!canManageEmployee) {
      setMessage('Bạn không có quyền cập nhật hồ sơ nhân sự này!')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    const errors: EditFormErrors = {}
    
    // Chỉ kiểm tra các trường bắt buộc thuộc nhóm đang sửa
    if (editSection === 'all' || editSection === 'basic') {
      if (requiredFields.full_name && !editForm.full_name.trim()) errors.full_name = 'Vui lòng nhập họ và tên (Bắt buộc)'
      if (requiredFields.phone && !editForm.phone.trim()) errors.phone = 'Vui lòng nhập số điện thoại (Bắt buộc)'
      if (requiredFields.email && !editForm.email.trim()) errors.email = 'Vui lòng nhập email (Bắt buộc)'
      if (requiredFields.bank_account_no && !editForm.bank_account_no.trim()) errors.bank_account_no = 'Vui lòng nhập STK ngân hàng (Bắt buộc)'
    }

    if (editSection === 'all' || editSection === 'cccd') {
      if (requiredFields.cccd && !editForm.cccd.trim()) errors.cccd = 'Vui lòng nhập số CCCD (Bắt buộc)'
    }

    if (editSection === 'all' || editSection === 'job' || editSection === 'attendance' || editSection === 'salary') {
      if (requiredFields.store_id && !editForm.store_id) errors.store_id = 'Vui lòng chọn chi nhánh công tác'
      if (requiredFields.position_id && !editForm.position_id) errors.position_id = 'Vui lòng chọn chức danh chính'
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors)
      const firstErrorMsg = Object.values(errors)[0]
      setMessage(`Không thể lưu: ${firstErrorMsg}`)
      setTimeout(() => setMessage(''), 4000)
      return
    }

    const salaryInput = editForm.base_salary.trim()
    const salaryValue = Number(salaryInput)
    const salaryToSave = salaryInput && Number.isFinite(salaryValue) && salaryValue > 0 ? salaryValue : undefined
    const employeeType = String(employee.employee_type || '')
    if (salaryToSave !== undefined) {
      const isPartTime = employeeType === 'ban_thoi_gian' || employeeType === 'part_time'
      const isFullTime = employeeType === 'toan_thoi_gian' || employeeType === 'full_time'
      if (isPartTime && salaryToSave >= 1000000) {
        const confirmed = window.confirm('Bạn đang nhập cho nhân viên bán thời gian. Số này trông giống lương tháng. Nếu là đơn giá giờ, hãy nhập ví dụ 20000.')
        if (!confirmed) return
      }
      if (isFullTime && salaryToSave < 100000) {
        const confirmed = window.confirm('Bạn đang nhập cho nhân viên toàn thời gian. Số này trông giống đơn giá giờ, không phải lương tháng.')
        if (!confirmed) return
      }
    }

    setEditErrors({})
    setIsSaving(true)

    try {
      const profileUpdates: Partial<AuthUser> = {
        full_name: editForm.full_name.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim(),
        hire_date: editForm.hire_date,
        store_id: editForm.store_id,
        secondary_store_ids: editForm.secondary_store_ids,
        position_id: editForm.position_id,
        secondary_position_ids: editForm.secondary_position_ids,
        department_name: editForm.department_name,
        role: editForm.role as AuthUser['role'],
        status: mapWorkStatusToAuthStatus(editForm.work_status),
        account_status: editForm.account_status,
        date_of_birth: editForm.date_of_birth,
        gender: editForm.gender || undefined,
        cccd: editForm.cccd.trim(),
        cccd_issue_date: editForm.cccd_issue_date,
        address: editForm.address.trim(),
        current_address: editForm.current_address.trim(),
        emergency_contact: editForm.emergency_contact.trim(),
        marital_status: editForm.marital_status.trim(),
        bank_name: editForm.bank_name.trim(),
        bank_account_no: editForm.bank_account_no.trim(),
        bank_account_holder: editForm.bank_account_holder.trim(),
        tax_code: editForm.tax_code.trim(),
        kpi_salary: editForm.kpi_salary ? Number(editForm.kpi_salary) : undefined,
        has_insurance: editForm.has_insurance,
        dependents_count: editForm.dependents_count ? Number(editForm.dependents_count) : 0,
      }
      if (salaryToSave !== undefined) {
        profileUpdates.official_salary = salaryToSave
      }

      const updated = await employeeAdapter.updateEmployee(employee.id, profileUpdates, user, 'Cập nhật hồ sơ nhân sự')

      if (updated) {
        setEmployee(updated)
        if (user.id === updated.id) {
          useAuthStore.setState({ user: updated })
        }
      }

      await new Promise(resolve => setTimeout(resolve, 300))
      setIsSaving(false)
      closeEditModal()
      if (updated?._dbSyncError) {
        setMessage(`Cảnh báo: Đã lưu tạm trên máy nhưng đồng bộ máy chủ thất bại (${updated._dbSyncError})`)
        setTimeout(() => setMessage(''), 6000)
      } else {
        setMessage(salaryToSave !== undefined ? `Đã cập nhật thông tin nhân sự thành công! Đã lưu mức lương: ${salaryToSave.toLocaleString('vi-VN')}đ` : 'Đã cập nhật thông tin nhân sự thành công!')
        setTimeout(() => setMessage(''), 3000)
      }
      refreshProfile()
    } catch (err) {
      console.error('Error saving employee profile:', err)
      setIsSaving(false)
      setMessage('Có lỗi xảy ra khi lưu thông tin nhân sự!')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  if (!hasHydrated || !employee) {
    return (
      <AppShell backHref="/employees">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-5 pb-16">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-sm font-medium text-primary-500 hover:text-primary-600">
            Quay lại
          </button>
          {message ? (
            <div className={`rounded-xl border px-4 py-2 text-xs font-semibold shadow-sm animate-fade-in ${
              message.includes('Cảnh báo') || message.includes('lỗi') || message.includes('Lỗi') || message.includes('Không thể') || message.includes('không có quyền')
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-green-200 bg-green-50 text-green-700'
            }`}>
              {message}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs">
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 flex flex-col items-center gap-2">
                  {employee.avatar_url ? (
                    <Image src={employee.avatar_url} alt={employee.full_name} width={80} height={80} className="h-20 w-20 rounded-full object-cover shadow-sm" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full text-xl font-bold text-white shadow-sm bg-primary">
                      {getInitials(employee.full_name)}
                    </div>
                  )}
                </div>

                <h1 className="text-lg font-bold text-gray-900">{employee.full_name}</h1>
                <p className="mt-0.5 text-xs font-semibold text-primary-600">{position?.name || 'Chưa phân bổ vị trí'}</p>
                {employee.secondary_position_ids && employee.secondary_position_ids.length > 0 && (
                  <div className="mt-1 flex flex-wrap justify-center gap-1">
                    {employee.secondary_position_ids.map(secId => {
                      const secPos = getPositionById(secId)
                      if (!secPos) return null
                      return (
                        <span key={secId} className="inline-flex rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-[#2F6FA8]">
                          Kiêm {secPos.name}
                        </span>
                      )
                    })}
                  </div>
                )}
                <p className="mt-2 max-w-[240px] text-[10px] leading-relaxed text-gray-400">
                  Vị trí hiển thị là vị trí mặc định; vị trí thực tế có thể thay đổi theo ca làm và phân công tại lịch.
                </p>

                <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${workStatus.className}`}>
                    {workStatus.label}
                  </span>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${accountStatus.className}`}>
                    {accountStatus.label}
                  </span>
                </div>

                {canManageEmployee && (
                  <div className="mt-4 flex w-full flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditForm(buildEditForm(employee, profile))
                        setIsEditing(true)
                      }}
                      className="inline-flex h-9 w-full items-center justify-center rounded-xl bg-primary-500 px-3 text-xs font-semibold text-white shadow-xs hover:bg-primary-600 transition-colors"
                    >
                      Sửa hồ sơ nhân sự
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarFileChange} className="hidden" />
                      <button type="button" onClick={() => avatarInputRef.current?.click()} className="inline-flex h-8 items-center justify-center rounded-xl border border-primary-200 bg-primary-50 px-2 text-xs font-semibold text-primary-700 hover:bg-primary-100">
                        Thay ảnh
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomNewPassword(`Homies@${Math.floor(1000 + Math.random() * 9000)}`)
                          setResetResult(null)
                          setIsResettingPassword(true)
                        }}
                        className="inline-flex h-8 items-center justify-center rounded-xl border border-gray-200 bg-white px-2 text-xs font-semibold text-gray-700 hover:bg-vanilla-50 transition-colors"
                      >
                        Đặt lại mật khẩu
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2 border-t border-gray-100 pt-3.5 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Mã NV:</span>
                  <span className="font-mono font-bold text-gray-800">{employee.employee_code || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Số điện thoại:</span>
                  <span className="font-medium text-gray-800">{employee.phone || 'Chưa SĐT'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span className="truncate font-medium text-gray-800 max-w-[150px]" title={employee.email}>{employee.email || 'Chưa email'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Chi nhánh:</span>
                  <span className="font-semibold text-gray-800">{getStoreDisplayName(store?.name)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Ngày vào làm:</span>
                  <span className="text-gray-700">{formatDate(employee.hire_date)}</span>
                </div>
              </div>
            </div>
          </aside>

          <section className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-1 shadow-xs">
              <div className="flex flex-wrap gap-1">
                {[
                  { key: 'personal', label: 'Cá nhân' },
                  { key: 'job', label: 'Công việc' },
                  { key: 'history', label: 'Lịch sử hoạt động' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`rounded-xl px-4.5 py-2.5 text-xs font-bold transition-all ${
                      activeTab === tab.key ? 'bg-primary-500 text-white shadow-xs' : 'text-gray-600 hover:bg-vanilla-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <ProfileOverviewTab
              employee={employee}
              profile={profile}
              storeName={store?.name}
              positionName={position?.name}
              departmentName={employee.department_name || getDepartmentName(employee.position_id, employee.role)}
              activityLogs={activityLogs}
              activeTab={activeTab}
              overallStatusTone={overallStatusTone}
              overallStatusLabel={overallStatusLabel}
              workStatus={workStatus}
              accountStatus={accountStatus}
              completeness={completeness}
              completedChecklistCount={completedChecklistCount}
              profileChecklist={profileChecklist}
              currentContract={currentContract}
              contractStatusMeta={contractStatusMeta}
              contractHealthLabel={contractHealthLabel}
              onOpenEditModal={canManageEmployee ? (sectionKey) => {
                setEditSection(sectionKey || 'all')
                setEditForm(buildEditForm(employee, profile))
                setIsEditing(true)
              } : undefined}
              onUploadCccd={(side, file) => {
                const reader = new FileReader()
                reader.onload = async () => {
                  if (typeof reader.result === 'string') {
                    const updateObj = side === 'front' ? { cccd_front_url: reader.result } : { cccd_back_url: reader.result }
                    const updated = await employeeAdapter.updateEmployee(employee.id, updateObj, user, `Tải ảnh CCCD (${side})`)
                    if (updated && user.id === updated.id) {
                      useAuthStore.setState({ user: updated })
                    }
                    refreshProfile()
                  }
                }
                reader.readAsDataURL(file)
              }}
            />
          </section>
        </div>

        {/* MODAL CHỈNH SỬA HỒ SƠ NHÂN SỰ THEO TỪNG THẺ */}
        {(shouldShowEditPanel || isEditing) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm animate-fade-in">
            <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex flex-col gap-2 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editSection === 'basic' ? 'Cập nhật Thông tin cơ bản & Ngân hàng' :
                     editSection === 'cccd' ? 'Cập nhật Thông tin căn cước công dân' :
                     editSection === 'extra' ? 'Cập nhật Thông tin bổ sung' :
                     editSection === 'job' ? 'Cập nhật Thông tin công việc & Phân quyền' :
                     editSection === 'salary' ? 'Cập nhật Cấu hình lương' :
                     editSection === 'attendance' ? 'Cập nhật Cấu hình chấm công' :
                     editSection === 'tax_insurance' ? 'Cập nhật Thuế & Bảo hiểm' :
                     'Chỉnh sửa thông tin hồ sơ nhân sự'}
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">Chỉnh sửa chi tiết thông tin cho {employee.full_name}</p>
                </div>

                <div className="flex items-center gap-2">
                  {canManageEmployee && (
                    <button
                      type="button"
                      onClick={() => setIsAdminConfigMode(!isAdminConfigMode)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                        isAdminConfigMode ? 'border-amber-300 bg-amber-50 text-amber-800 shadow-xs' : 'border-gray-200 bg-white text-gray-700 hover:bg-vanilla-50'
                      }`}
                    >
                      {isAdminConfigMode ? 'Tắt cài đặt Bắt buộc' : 'Admin: Cấu hình bắt buộc'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="rounded-full px-3 py-1 text-xs font-semibold text-gray-500 hover:bg-vanilla-100 hover:text-gray-700 transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>

              {isAdminConfigMode && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 text-xs text-amber-800 space-y-1">
                  <p className="font-bold">Chế độ Admin: Tùy chỉnh quy định điền thông tin</p>
                  <p>Bấm vào nút <span className="font-semibold text-red-700">[Bắt buộc]</span> hoặc <span className="font-semibold text-gray-600">[Tùy chọn]</span> cạnh mỗi trường để bật/tắt yêu cầu nhập liệu bắt buộc đối với nhân sự.</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* 1. KHỐI THÔNG TIN CƠ BẢN & NGÂN HÀNG */}
                {(editSection === 'all' || editSection === 'basic') && (
                  <>
                    <div className="space-y-1 md:col-span-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-primary-600">Thông tin cơ bản & Ngân hàng</h3>
                    </div>

                    <FormField
                      label={
                        <div className="flex items-center justify-between">
                          <span>Họ và tên {requiredFields.full_name ? <span className="text-red-500 font-bold">*</span> : null}</span>
                          {isAdminConfigMode && (
                            <button type="button" onClick={() => toggleFieldRequirement('full_name')} className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${requiredFields.full_name ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-500'}`}>
                              {requiredFields.full_name ? 'Bắt buộc' : 'Tùy chọn'}
                            </button>
                          )}
                        </div>
                      }
                      error={editErrors.full_name}
                    >
                      <input
                        type="text"
                        value={editForm.full_name}
                        onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                        className={getInputClassName(Boolean(editErrors.full_name))}
                        placeholder="Nguyễn Văn A"
                      />
                    </FormField>

                    <FormField
                      label={
                        <div className="flex items-center justify-between">
                          <span>Số điện thoại {requiredFields.phone ? <span className="text-red-500 font-bold">*</span> : null}</span>
                          {isAdminConfigMode && (
                            <button type="button" onClick={() => toggleFieldRequirement('phone')} className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${requiredFields.phone ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                              {requiredFields.phone ? 'Bắt buộc' : 'Tùy chọn'}
                            </button>
                          )}
                        </div>
                      }
                      error={editErrors.phone}
                    >
                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                        className={getInputClassName(Boolean(editErrors.phone))}
                        placeholder="0901234567"
                      />
                    </FormField>

                    <FormField
                      label={
                        <div className="flex items-center justify-between">
                          <span>Email {requiredFields.email ? <span className="text-red-500 font-bold">*</span> : null}</span>
                          {isAdminConfigMode && (
                            <button type="button" onClick={() => toggleFieldRequirement('email')} className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${requiredFields.email ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                              {requiredFields.email ? 'Bắt buộc' : 'Tùy chọn'}
                            </button>
                          )}
                        </div>
                      }
                      error={editErrors.email}
                    >
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                        className={getInputClassName(Boolean(editErrors.email))}
                        placeholder="email@example.com"
                      />
                    </FormField>

                    <FormField label="Ngày sinh">
                      <input
                        type="date"
                        value={editForm.date_of_birth}
                        onChange={e => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                        className={getInputClassName(false)}
                      />
                    </FormField>

                    <FormField label="Giới tính">
                      <select
                        value={editForm.gender}
                        onChange={e => setEditForm({ ...editForm, gender: e.target.value as EditFormData['gender'] })}
                        className={getInputClassName(false)}
                      >
                        <option value="">Chưa chọn</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </select>
                    </FormField>

                    <FormField label="Tên ngân hàng">
                      <input
                        type="text"
                        value={editForm.bank_name}
                        onChange={e => setEditForm({ ...editForm, bank_name: e.target.value })}
                        className={getInputClassName(false)}
                        placeholder="Vietcombank, MB Bank..."
                      />
                    </FormField>

                    <FormField
                      label={
                        <div className="flex items-center justify-between">
                          <span>Số tài khoản {requiredFields.bank_account_no ? <span className="text-red-500 font-bold">*</span> : null}</span>
                          {isAdminConfigMode && (
                            <button type="button" onClick={() => toggleFieldRequirement('bank_account_no')} className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${requiredFields.bank_account_no ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                              {requiredFields.bank_account_no ? 'Bắt buộc' : 'Tùy chọn'}
                            </button>
                          )}
                        </div>
                      }
                      error={editErrors.bank_account_no}
                    >
                      <input
                        type="text"
                        value={editForm.bank_account_no}
                        onChange={e => setEditForm({ ...editForm, bank_account_no: e.target.value })}
                        className={getInputClassName(Boolean(editErrors.bank_account_no))}
                        placeholder="Số tài khoản nhận lương"
                      />
                    </FormField>

                    <FormField label="Tên chủ tài khoản">
                      <input
                        type="text"
                        value={editForm.bank_account_holder}
                        onChange={e => setEditForm({ ...editForm, bank_account_holder: e.target.value })}
                        className={getInputClassName(false)}
                        placeholder="Chủ tài khoản viết hoa không dấu"
                      />
                    </FormField>

                    <div className="md:col-span-2">
                      <FormField label="Nơi thường trú">
                        <input
                          type="text"
                          value={editForm.address}
                          onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                          className={getInputClassName(false)}
                          placeholder="Địa chỉ sổ hộ khẩu..."
                        />
                      </FormField>
                    </div>

                    <div className="md:col-span-2">
                      <FormField label="Nơi ở hiện tại (Tạm trú)">
                        <input
                          type="text"
                          value={editForm.current_address}
                          onChange={e => setEditForm({ ...editForm, current_address: e.target.value })}
                          className={getInputClassName(false)}
                          placeholder="Địa chỉ sinh sống hiện tại..."
                        />
                      </FormField>
                    </div>
                  </>
                )}

                {/* 2. KHỐI CĂN CƯỚC CÔNG DÂN */}
                {(editSection === 'all' || editSection === 'cccd') && (
                  <>
                    <div className="space-y-1 md:col-span-2 pt-2 border-t border-gray-100">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-primary-600">Thông tin Căn cước công dân</h3>
                    </div>

                    <FormField
                      label={
                        <div className="flex items-center justify-between">
                          <span>Số CCCD / Hộ chiếu {requiredFields.cccd ? <span className="text-red-500 font-bold">*</span> : null}</span>
                          {isAdminConfigMode && (
                            <button type="button" onClick={() => toggleFieldRequirement('cccd')} className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${requiredFields.cccd ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                              {requiredFields.cccd ? 'Bắt buộc' : 'Tùy chọn'}
                            </button>
                          )}
                        </div>
                      }
                      error={editErrors.cccd}
                    >
                      <input
                        type="text"
                        value={editForm.cccd}
                        onChange={e => setEditForm({ ...editForm, cccd: e.target.value })}
                        className={getInputClassName(Boolean(editErrors.cccd))}
                        placeholder="Số căn cước công dân"
                      />
                    </FormField>

                    <FormField label="Ngày cấp CCCD">
                      <input
                        type="date"
                        value={editForm.cccd_issue_date}
                        onChange={e => setEditForm({ ...editForm, cccd_issue_date: e.target.value })}
                        className={getInputClassName(false)}
                      />
                    </FormField>
                  </>
                )}

                {/* 3. KHỐI THÔNG TIN BỔ SUNG */}
                {(editSection === 'all' || editSection === 'extra') && (
                  <>
                    <div className="space-y-1 md:col-span-2 pt-2 border-t border-gray-100">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-primary-600">Thông tin bổ sung</h3>
                    </div>

                    <FormField label="SĐT Khẩn cấp">
                      <input
                        type="text"
                        value={editForm.emergency_contact}
                        onChange={e => setEditForm({ ...editForm, emergency_contact: e.target.value })}
                        className={getInputClassName(false)}
                        placeholder="SĐT người thân"
                      />
                    </FormField>

                    <FormField label="Tình trạng hôn nhân">
                      <input
                        type="text"
                        value={editForm.marital_status}
                        onChange={e => setEditForm({ ...editForm, marital_status: e.target.value })}
                        className={getInputClassName(false)}
                        placeholder="Độc thân / Đã kết hôn..."
                      />
                    </FormField>
                  </>
                )}

                {/* 4. KHỐI CÔNG VIỆC, LƯƠNG & PHÂN QUYỀN */}
                {(editSection === 'all' || editSection === 'job' || editSection === 'salary' || editSection === 'attendance') && (
                  <>
                    <div className="space-y-1 md:col-span-2 pt-2 border-t border-gray-100">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-primary-600">Thông tin Công việc, Phân quyền & Lương</h3>
                    </div>

                    <FormField label="Chi nhánh công tác">
                      <select
                        value={editForm.store_id}
                        onChange={e => setEditForm({ ...editForm, store_id: e.target.value })}
                        className={getInputClassName(false)}
                      >
                        {mockStores.map(s => (
                          <option key={s.id} value={s.id}>{s.name.replace('Homies Milk Tea - ', '')}</option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Chức danh mặc định khi chưa phân ca">
                      <select
                        value={editForm.position_id}
                        onChange={e => {
                          const newPosId = e.target.value
                          setEditForm({
                            ...editForm,
                            position_id: newPosId,
                            department_name: getDepartmentName(newPosId, editForm.role as AuthUser['role']),
                          })
                        }}
                        className={getInputClassName(false)}
                      >
                        {mockPositions.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Bộ phận công tác">
                      <select
                        value={editForm.department_name || getDepartmentName(editForm.position_id, editForm.role as AuthUser['role'])}
                        onChange={e => setEditForm({ ...editForm, department_name: e.target.value })}
                        className={getInputClassName(false)}
                      >
                        <option value="Pha chế & Barista">Pha chế & Barista</option>
                        <option value="Thu ngân & Sales">Thu ngân & Sales</option>
                        <option value="Phục vụ & Sảnh">Phục vụ & Sảnh quán</option>
                        <option value="Quản lý cửa hàng">Quản lý cửa hàng</option>
                        <option value="Ban Giám đốc & Điều hành">Ban Giám đốc & Điều hành</option>
                        <option value="Vận hành cửa hàng">Vận hành cửa hàng</option>
                      </select>
                    </FormField>

                    <div className="md:col-span-2 space-y-2 rounded-2xl border border-gray-100 bg-[#FFF8E8]/50 p-3.5">
                      <div>
                        <label className="block text-xs font-bold text-[#001D3D]">
                          Vị trí có thể đảm nhiệm (Đa nhiệm / Có thể nhận ca)
                        </label>
                        <p className="text-[11px] text-gray-500">
                          Chọn các vị trí khác mà nhân sự này có thể đảm nhận khi phân ca (VD: Thu ngân kiêm Pha chế)
                        </p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                        {mockPositions
                          .filter(p => ['pos-001', 'pos-002', 'pos-003', 'pos-004', 'pos-007'].includes(p.id))
                          .filter(p => p.id !== editForm.position_id)
                          .map(pos => {
                            const isChecked = editForm.secondary_position_ids.includes(pos.id)
                            return (
                              <label
                                key={pos.id}
                                className={`flex items-center gap-2 rounded-xl border p-2 text-xs font-medium cursor-pointer transition ${
                                  isChecked
                                    ? 'border-[#2F6FA8] bg-blue-50/70 text-[#001D3D] font-bold shadow-2xs'
                                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      setEditForm({
                                        ...editForm,
                                        secondary_position_ids: [...editForm.secondary_position_ids, pos.id],
                                      })
                                    } else {
                                      setEditForm({
                                        ...editForm,
                                        secondary_position_ids: editForm.secondary_position_ids.filter(id => id !== pos.id),
                                      })
                                    }
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                />
                                <span>{pos.name}</span>
                              </label>
                            )
                          })}
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-2 rounded-2xl border border-gray-100 bg-[#F0F7FF]/60 p-3.5">
                      <div>
                        <label className="block text-xs font-bold text-[#001D3D]">
                          Chi nhánh phụ (Cho phép hỗ trợ tăng ca / Biệt phái)
                        </label>
                        <p className="text-[11px] text-gray-500">
                          Chọn các chi nhánh khác mà nhân sự này được phép sang hỗ trợ tăng ca hoặc nhận ca thế
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {mockStores
                          .filter(s => s.id !== editForm.store_id)
                          .map(s => {
                            const isChecked = editForm.secondary_store_ids.includes(s.id)
                            const cleanName = s.name.replace('Homies Milk Tea - ', '').trim()
                            return (
                              <label
                                key={s.id}
                                className={`flex items-center gap-2 rounded-xl border p-2 text-xs font-medium cursor-pointer transition ${
                                  isChecked
                                    ? 'border-[#2F6FA8] bg-blue-50/70 text-[#001D3D] font-bold shadow-2xs'
                                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      setEditForm({
                                        ...editForm,
                                        secondary_store_ids: [...editForm.secondary_store_ids, s.id],
                                      })
                                    } else {
                                      setEditForm({
                                        ...editForm,
                                        secondary_store_ids: editForm.secondary_store_ids.filter(id => id !== s.id),
                                      })
                                    }
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                />
                                <span>📍 {cleanName}</span>
                              </label>
                            )
                          })}
                      </div>
                    </div>

                    <FormField label="Vai trò hệ thống">
                      <select
                        value={editForm.role}
                        onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                        className={getInputClassName(false)}
                      >
                        {roleOptions.map(r => (
                          <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Ngày vào làm">
                      <input
                        type="date"
                        value={editForm.hire_date}
                        onChange={e => setEditForm({ ...editForm, hire_date: e.target.value })}
                        className={getInputClassName(false)}
                      />
                    </FormField>

                    <FormField label="Mức lương cơ bản (VNĐ)">
                      <input
                        type="number"
                        value={editForm.base_salary}
                        onChange={e => setEditForm({ ...editForm, base_salary: e.target.value })}
                        className={getInputClassName(false)}
                        placeholder="Chưa thiết lập"
                      />
                      {salaryInputHint ? <p className="mt-1 text-xs text-gray-500">{salaryInputHint}</p> : null}
                    </FormField>

                    <FormField label="Mức lương KPI (VNĐ)">
                      <input
                        type="number"
                        value={editForm.kpi_salary}
                        onChange={e => setEditForm({ ...editForm, kpi_salary: e.target.value })}
                        className={getInputClassName(false)}
                        placeholder="Lương KPI"
                      />
                    </FormField>
                  </>
                )}

                {/* 5. KHỐI THUẾ & BẢO HIỂM */}
                {(editSection === 'all' || editSection === 'tax_insurance') && (
                  <>
                    <div className="space-y-1 md:col-span-2 pt-2 border-t border-gray-100">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-primary-600">Thuế & Bảo hiểm xã hội</h3>
                    </div>

                    <FormField label="Mã số thuế (MST)">
                      <input
                        type="text"
                        value={editForm.tax_code}
                        onChange={e => setEditForm({ ...editForm, tax_code: e.target.value })}
                        className={getInputClassName(false)}
                        placeholder="Mã số thuế cá nhân"
                      />
                    </FormField>

                    <FormField label="Số người phụ thuộc">
                      <input
                        type="number"
                        value={editForm.dependents_count}
                        onChange={e => setEditForm({ ...editForm, dependents_count: e.target.value })}
                        className={getInputClassName(false)}
                        placeholder="0"
                      />
                    </FormField>
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-vanilla-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveProfile}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-600 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? 'Đang lưu...' : 'Cập nhật hồ sơ'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* MODAL ĐẶT LẠI MẬT KHẨU NHÂN SỰ */}
        {isResettingPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Đặt lại mật khẩu nhân sự</h3>
                  <p className="mt-1 text-xs text-gray-500">Cấp mật khẩu mới cho {employee.full_name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsResettingPassword(false); setResetResult(null); }}
                  className="rounded-full px-3 py-1 text-xs font-semibold text-gray-500 hover:bg-vanilla-100 hover:text-gray-700"
                >
                  Đóng
                </button>
              </div>

              {!resetResult ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-gray-100 bg-vanilla-50 p-4 space-y-1 text-xs text-gray-600">
                    <p className="font-semibold text-gray-900">{employee.full_name} ({employee.employee_code || 'Mã chưa cập nhật'})</p>
                    <p>Email: <span className="font-medium text-gray-800">{employee.email}</span></p>
                  </div>

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-gray-800">Mật khẩu mới</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customNewPassword}
                        onChange={e => setCustomNewPassword(e.target.value)}
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-mono font-bold text-primary-700 outline-none focus:border-primary-500"
                        placeholder="Nhập mật khẩu mới..."
                      />
                      <button
                        type="button"
                        onClick={() => setCustomNewPassword(`Homies@${Math.floor(1000 + Math.random() * 9000)}`)}
                        className="shrink-0 rounded-2xl border border-primary-200 bg-primary-50 px-3 py-2.5 text-xs font-semibold text-primary-700 hover:bg-primary-100"
                      >
                        Sinh tự động
                      </button>
                    </div>
                  </label>

                  <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsResettingPassword(false)}
                      className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-vanilla-50"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      onClick={handleResetPasswordSubmit}
                      className="rounded-xl bg-primary-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-600"
                    >
                      Xác nhận đặt lại
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-4 space-y-2 text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-green-700">Đã đặt lại mật khẩu thành công!</p>
                    <div className="rounded-xl bg-white border border-green-200 p-3">
                      <p className="text-xs text-gray-500">Mật khẩu mới của {employee.full_name}:</p>
                      <p className="text-lg font-mono font-bold text-gray-900 mt-1 select-all">{resetResult.password}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleCopyResetInfo}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary-500 text-xs font-semibold text-white shadow-sm hover:bg-primary-600 transition-colors"
                    >
                      {copiedPassword ? '✓ Đã sao chép vào bộ nhớ tạm' : '📋 Sao chép thông tin tài khoản gửi nhân viên'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsResettingPassword(false); setResetResult(null); }}
                      className="h-9 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-vanilla-50"
                    >
                      Đóng lại
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
