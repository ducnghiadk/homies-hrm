'use client'

import type { ChangeEvent, ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { getPositionById, getStoreById, mockAttendances, mockPositions, mockStores } from '@/lib/mock-data'
import { ContractService, CONTRACT_STATUS_META, type EmployeeContract } from '@/lib/services/contract-service'
import { EmployeeService } from '@/lib/services/employee-service'
import { OnboardingPolicyService, type OnboardingPolicyHistoryItem, type OnboardingPolicyStatus } from '@/lib/services/onboarding-policy-service'
import { formatDate, formatTime, getInitials, getStatusColor, getStatusLabel } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'
import type { AuthUser } from '@/store/auth-store'
import { ArrowLeft, Briefcase, Building2, Calendar, Camera, FileText, History, ImageOff, Lock, Mail, Pencil, Phone, RefreshCcw, Save, ShieldCheck, ShieldQuestion, Unlock, User, UserCheck, UserX, X } from 'lucide-react'

type EmployeeProfileExtras = {
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other'
  cccd?: string
  address?: string
  emergency_contact?: string
  candidate_notes?: string
}

type WorkStatus = 'sap_nhan_viec' | 'thu_viec' | 'dang_lam' | 'da_nghi'
type AccountStatus = 'chua_kich_hoat' | 'dang_hoat_dong' | 'bi_khoa'

type EditFormData = {
  full_name: string
  phone: string
  email: string
  hire_date: string
  store_id: string
  position_id: string
  role: string
  work_status: WorkStatus
  account_status: AccountStatus
  date_of_birth: string
  gender: '' | 'male' | 'female' | 'other'
  cccd: string
  address: string
  emergency_contact: string
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

const PROFILE_FIELD_LABELS: Record<string, string> = {
  avatar_url: 'Ảnh đại diện',
  full_name: 'Họ và tên',
  phone: 'Số điện thoại',
  email: 'Email',
  hire_date: 'Ngày vào làm',
  store_id: 'Chi nhánh',
  position_id: 'Chức danh',
  role: 'Vai trò hệ thống',
  status: 'Trạng thái làm việc',
  account_status: 'Trạng thái tài khoản',
  date_of_birth: 'Ngày sinh',
  gender: 'Giới tính',
  cccd: 'CCCD / Hộ chiếu',
  address: 'Địa chỉ',
  emergency_contact: 'Liên hệ khẩn cấp',
  candidate_notes: 'Ghi chú nội bộ HR',
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
    case 'ceo':
      return 'CEO / Giám đốc điều hành'
    case 'hr_admin':
      return 'HR Admin / Quản trị nhân sự'
    case 'store_manager':
      return 'Store Manager / Quản lý cửa hàng'
    case 'shift_leader':
      return 'Shift Leader / Trưởng ca'
    default:
      return 'Employee / Nhân viên'
  }
}

const getStoreDisplayName = (storeName?: string) => {
  if (!storeName) return 'Chưa phân bổ'
  const normalizedName = storeName.replace('Homies Milk Tea - ', '').trim()
  return normalizedName || 'Chưa phân bổ'
}

const getActivityActionLabel = (action?: string) => {
  switch (action) {
    case 'created':
      return 'Tạo hồ sơ'
    case 'approved_from_invitation':
      return 'Duyệt từ lời mời'
    case 'imported':
      return 'Nhập từ file'
    case 'status_changed':
      return 'Đổi trạng thái làm việc'
    case 'account_changed':
      return 'Đổi trạng thái tài khoản'
    case 'offboarding_completed':
      return 'Hoàn tất offboarding'
    case 'updated':
      return 'Cập nhật hồ sơ'
    default:
      return action || 'Cập nhật'
  }
}

const getWorkStatusMeta = (status?: AuthUser['status']) => {
  switch (status) {
    case 'inactive':
      return { label: 'Sắp nhận việc', className: 'bg-blue-50 text-blue-700 border-blue-100' }
    case 'probation':
      return { label: 'Thử việc', className: 'bg-amber-50 text-amber-700 border-amber-100' }
    case 'resigned':
      return { label: 'Đã nghỉ việc', className: 'bg-gray-100 text-gray-700 border-gray-200' }
    default:
      return { label: 'Đang làm việc', className: 'bg-green-50 text-green-700 border-green-100' }
  }
}

const getGenderLabel = (gender?: EmployeeProfileExtras['gender'] | '') => {
  switch (gender) {
    case 'male':
      return 'Nam'
    case 'female':
      return 'Nữ'
    case 'other':
      return 'Khác'
    default:
      return ''
  }
}

const formatHistoryDetail = (detail?: string) => {
  if (!detail) return 'Không có ghi chú chi tiết.'

  return detail
    .split(' | ')
    .map((part) => {
      const [rawKey, rawValue] = part.split(': ')
      if (!rawValue) return part
      const label = PROFILE_FIELD_LABELS[rawKey] || rawKey
      return `${label}: ${rawValue}`
    })
    .join(' • ')
}

const getOnboardingPolicyStatusMeta = (status?: OnboardingPolicyStatus) => {
  switch (status) {
    case 'da_xac_nhan':
      return { label: 'Đã xác nhận', tone: 'bg-green-50 text-green-700 border-green-100' }
    case 'can_giai_thich':
      return { label: 'Cần giải thích', tone: 'bg-red-50 text-red-700 border-red-100' }
    case 'can_nhac':
      return { label: 'Cần nhắc lại', tone: 'bg-amber-50 text-amber-700 border-amber-100' }
    case 'da_doc':
      return { label: 'Đã đọc', tone: 'bg-blue-50 text-blue-700 border-blue-100' }
    case 'da_gui_day_du':
      return { label: 'Đã gửi đầy đủ', tone: 'bg-slate-100 text-slate-700 border-slate-200' }
    case 'da_gui_tom_tat':
      return { label: 'Đã gửi tóm tắt', tone: 'bg-slate-100 text-slate-700 border-slate-200' }
    default:
      return { label: 'Chưa gửi', tone: 'bg-gray-100 text-gray-700 border-gray-200' }
  }
}

const getOnboardingPolicyActionLabel = (action: OnboardingPolicyHistoryItem['action']) => {
  switch (action) {
    case 'summary_sent':
      return 'Gửi bản tóm tắt'
    case 'full_sent':
      return 'Gửi nội quy đầy đủ'
    case 'employee_read':
      return 'Nhân viên đã đọc'
    case 'employee_acknowledged':
      return 'Nhân viên xác nhận'
    case 'clarification_requested':
      return 'Cần HR giải thích'
    case 'reminder_sent':
      return 'Đã nhắc lại'
    case 'store_confirmed':
      return 'Chốt tại cửa hàng'
    default:
      return 'Cập nhật nội quy'
  }
}

const normalizeOnboardingDisplayText = (value?: string) => {
  if (!value) return ''

  const replacements: Array<[string, string]> = [
    ['Gui ban tom tat', 'Gửi bản tóm tắt'],
    ['Gui noi quy day du', 'Gửi nội quy đầy đủ'],
    ['Gui lai ban tom tat noi quy', 'Gửi lại bản tóm tắt nội quy'],
    ['Gui lai noi quy day du', 'Gửi lại nội quy đầy đủ'],
    ['Gui noi quy day du sau khi HR countersign', 'Gửi nội quy đầy đủ sau khi HR countersign'],
    ['Gui noi quy day du theo moc truoc ngay vao lam', 'Gửi nội quy đầy đủ theo mốc trước ngày vào làm'],
    ['Gui ban tom tat sau khi HR duyet ho so', 'Gửi bản tóm tắt sau khi HR duyệt hồ sơ'],
    ['Gui ban tom tat luc gui hop dong', 'Gửi bản tóm tắt lúc gửi hợp đồng'],
    ['Nhan vien da mo va doc noi quy', 'Nhân viên đã mở và đọc nội quy'],
    ['Nhan vien da doc noi quy', 'Nhân viên đã đọc nội quy'],
    ['Nhan vien da xac nhan noi quy', 'Nhân viên đã xác nhận nội quy'],
    ['Nhan vien can HR giai thich them', 'Nhân viên cần HR giải thích thêm'],
    ['Quan ly/HR da chot noi quy tai cua hang', 'Quản lý/HR đã chốt nội quy tại cửa hàng'],
    ['Nhac lai nhan vien doc/xac nhan noi quy', 'Nhắc lại nhân viên đọc/xác nhận nội quy'],
    ['He thong', 'Hệ thống'],
  ]

  return replacements.reduce((current, [from, to]) => current.replaceAll(from, to), value)
}

const mapStatusToWorkStatus = (status?: string): WorkStatus => {
  switch (status) {
    case 'inactive':
      return 'sap_nhan_viec'
    case 'probation':
      return 'thu_viec'
    case 'resigned':
      return 'da_nghi'
    default:
      return 'dang_lam'
  }
}

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

const InfoItem = ({ label, value, placeholder = 'Chưa cập nhật' }: { label: string; value?: string; placeholder?: string }) => (
  <div className="space-y-1.5">
    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
    {value ? (
      <p className="text-sm font-medium text-gray-900">{value}</p>
    ) : (
      <span className="inline-flex rounded-lg border border-dashed border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-400">
        {placeholder}
      </span>
    )}
  </div>
)

function FormField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </label>
  )
}

const getInputClassName = (hasError: boolean) =>
  `w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 outline-none transition-all ${
    hasError ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-gray-200 bg-white focus:border-primary-400'
  }`

const MAX_AVATAR_FILE_SIZE = 2 * 1024 * 1024

function parseIsoDate(value?: string) {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null

  const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0, 0)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function getBirthdaySummary(dateOfBirth?: string) {
  const birthDate = parseIsoDate(dateOfBirth)
  if (!birthDate) return null

  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0)
  let nextBirthday = new Date(todayStart.getFullYear(), birthDate.getMonth(), birthDate.getDate(), 12, 0, 0, 0)

  if (nextBirthday < todayStart) {
    nextBirthday = new Date(todayStart.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate(), 12, 0, 0, 0)
  }

  const daysUntil = Math.round((new Date(nextBirthday.getFullYear(), nextBirthday.getMonth(), nextBirthday.getDate()).getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000))
  const label = daysUntil === 0 ? 'Hôm nay là sinh nhật' : daysUntil === 1 ? 'Còn 1 ngày nữa đến sinh nhật' : `Còn ${daysUntil} ngày nữa đến sinh nhật`
  const detail = daysUntil === 0
    ? 'Đây là lúc phù hợp để gửi lời chúc nội bộ cho nhân sự này.'
    : `Sinh nhật kế tiếp rơi vào ${formatDate(nextBirthday.toISOString())}.`

  return {
    daysUntil,
    label,
    detail,
    nextBirthdayLabel: formatDate(nextBirthday.toISOString()),
    tone: daysUntil === 0
      ? 'border-pink-200 bg-pink-50 text-pink-700'
      : daysUntil <= 7
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-sky-200 bg-sky-50 text-sky-700',
  }
}

const buildEditForm = (employee: AuthUser, profile?: EmployeeProfileExtras): EditFormData => ({
  full_name: employee.full_name || '',
  phone: employee.phone || '',
  email: employee.email || '',
  hire_date: employee.hire_date || '',
  store_id: employee.store_id || '',
  position_id: employee.position_id || '',
  role: employee.role || 'employee',
  work_status: mapStatusToWorkStatus(employee.status),
  account_status: (employee.account_status || 'chua_kich_hoat') as AccountStatus,
  date_of_birth: profile?.date_of_birth || '',
  gender: profile?.gender || '',
  cccd: profile?.cccd || '',
  address: profile?.address || '',
  emergency_contact: profile?.emergency_contact || '',
})

export default function EmployeeDetailPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'overview' | 'onboarding' | 'contracts' | 'personal' | 'job' | 'history'>('overview')
  const [, setRefreshKey] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [employeeContracts, setEmployeeContracts] = useState<EmployeeContract[]>([])
  const [isLoadingContracts, setIsLoadingContracts] = useState(false)
  const [editErrors, setEditErrors] = useState<EditFormErrors>({})
  const [hrNoteDraft, setHrNoteDraft] = useState('')
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const [editForm, setEditForm] = useState<EditFormData>({
    full_name: '',
    phone: '',
    email: '',
    hire_date: '',
    store_id: '',
    position_id: '',
    role: 'employee',
    work_status: 'dang_lam',
    account_status: 'chua_kich_hoat',
    date_of_birth: '',
    gender: '',
    cccd: '',
    address: '',
    emergency_contact: '',
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const employeeId = params.id as string
  const employee = user ? EmployeeService.getEmployeeById(employeeId, user) : undefined
  const profile = employee as (typeof employee & EmployeeProfileExtras) | undefined
  const onboardingPolicyRecord = employee ? OnboardingPolicyService.getRecord(employee.id) : null
  const onboardingDayOneSnapshot = OnboardingPolicyService.getDayOneChecklistSnapshot(onboardingPolicyRecord)
  const onboardingPolicyStatus = getOnboardingPolicyStatusMeta(onboardingPolicyRecord?.status)
  const onboardingPolicyHistory = onboardingPolicyRecord?.history.slice(0, 4) || []
  const canManageEmployeePreview = ['ceo', 'hr_admin'].includes(user?.role || '')
  const shouldShowEditPanelPreview = canManageEmployeePreview && (isEditing || searchParams.get('mode') === 'edit')

  useEffect(() => {
    if (!employee || !shouldShowEditPanelPreview) return
    const timer = window.setTimeout(() => {
      setEditForm(current => (
        current.full_name || current.phone || current.email || current.store_id || current.position_id
          ? current
          : buildEditForm(employee, profile)
      ))
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

  useEffect(() => {
    if (!employee?.id || !profile?.date_of_birth) return
    EmployeeService.ensureBirthdayNotifications(employee.id, user || undefined)
  }, [employee?.id, profile?.date_of_birth, user])

  if (!user) return null

  if (!employee) {
    return (
      <AppShell title="Nhân viên">
        <div className="py-20 text-center text-gray-500">Không tìm thấy hồ sơ nhân viên hoặc bạn không có quyền xem.</div>
      </AppShell>
    )
  }

  const store = getStoreById(employee.store_id)
  const position = getPositionById(employee.position_id)
  const empAttendances = mockAttendances.filter(attendance => attendance.employee_id === employee.id).slice(0, 8)
  const accountStatus = getAccountStatusMeta(employee.account_status)
  const workStatus = getWorkStatusMeta(employee.status)
  const canManageEmployee = ['ceo', 'hr_admin'].includes(user.role)
  const canOpenOffboarding = ['ceo', 'hr_admin', 'store_manager'].includes(user.role)
  const canManageOnboardingPolicy = ['ceo', 'hr_admin', 'store_manager'].includes(user.role)
  const roleOptions = EmployeeService.getAllowedRoleOptions(user)
  const shouldShowEditPanel = canManageEmployee && (isEditing || searchParams.get('mode') === 'edit')
  const offboardingData = EmployeeService.getOffboardingByEmployee(employee.id)
  const completenessFields = [
    employee.full_name,
    employee.phone,
    employee.email,
    profile?.date_of_birth,
    profile?.gender,
    profile?.cccd,
    profile?.address,
    profile?.emergency_contact,
    employee.employee_code,
    employee.store_id,
    employee.position_id,
  ]
  const completeness = Math.round((completenessFields.filter(Boolean).length / completenessFields.length) * 100)
  const activityLogs = EmployeeService.getEmployeeActivityLogs(employee.id)
  const currentContract = employeeContracts.find((contract) => contract.status === 'active') || employeeContracts[0]
  const birthdaySummary = getBirthdaySummary(profile?.date_of_birth)
  const contractStatusMeta = currentContract ? CONTRACT_STATUS_META[currentContract.status] : null
  const activeOrDraftContractCount = employeeContracts.filter((contract) => ['draft', 'pending_employee_sign', 'signed_by_employee', 'pending_hr_sign', 'active'].includes(contract.status)).length
  const expiringContract = employeeContracts.find((contract) => contract.status === 'active' && contract.endDate)
  const pendingContract = employeeContracts.find((contract) => ['pending_employee_sign', 'signed_by_employee', 'pending_hr_sign'].includes(contract.status))
  const contractTimelineItems: TimelineItem[] = employeeContracts.slice(0, 3).flatMap(contract => (
    contract.auditLogs.slice(0, 2).map<TimelineItem>(log => ({
      id: `${contract.id}-${log.id}`,
      kind: 'contract',
      created_at: log.at,
      badge: 'Hợp đồng',
      title: log.note,
      detail: `${contract.customFields['contract.code'] || contract.id} · ${log.actorName}`,
      actor: log.actorName || 'Hệ thống',
    }))
  ))
  const offboardingOpenCount = (offboardingData?.steps || []).filter((step) => !step.is_done && step.required !== false).length
  const offboardingBlockedCount = (offboardingData?.access_items || []).filter((item) => item.status === 'blocked').length
  const combinedTimeline: TimelineItem[] = [
    ...activityLogs.map<TimelineItem>(log => ({
      id: log.id,
      kind: 'profile',
      created_at: log.created_at,
      badge: getActivityActionLabel(log.action),
      title: log.title,
      detail: formatHistoryDetail(log.detail),
      actor: log.actor_name || log.actor_id || 'Hệ thống',
    })),
    ...contractTimelineItems,
  ].sort((a, b) => b.created_at.localeCompare(a.created_at))
  const recentUpdateCount = combinedTimeline.length
  const profileChecklist: ProfileChecklistItem[] = [
    {
      id: 'phone',
      label: 'Số điện thoại liên hệ',
      done: Boolean(employee.phone),
      hint: 'Cần để liên hệ nhanh khi đổi ca hoặc xử lý gấp.',
    },
    {
      id: 'email',
      label: 'Email nhân sự',
      done: Boolean(employee.email),
      hint: 'Dùng cho thông báo nội bộ, mời kích hoạt tài khoản và ký hồ sơ.',
    },
    {
      id: 'identity',
      label: 'CCCD hoặc hộ chiếu',
      done: Boolean(profile?.cccd),
      hint: 'Cần cho hợp đồng, lương và đối soát hồ sơ.',
    },
    {
      id: 'address',
      label: 'Địa chỉ thường trú',
      done: Boolean(profile?.address),
      hint: 'Cần cho hồ sơ lao động và liên hệ khẩn cấp.',
    },
    {
      id: 'emergency',
      label: 'Liên hệ khẩn cấp',
      done: Boolean(profile?.emergency_contact),
      hint: 'Nên có ít nhất 1 đầu mối để xử lý khi cần.',
    },
    {
      id: 'job',
      label: 'Chi nhánh và chức danh',
      done: Boolean(employee.store_id && employee.position_id),
      hint: 'Ảnh hưởng trực tiếp đến xếp ca, KPI và lương.',
    },
    {
      id: 'contract',
      label: 'Hợp đồng đang theo dõi',
      done: Boolean(currentContract),
      hint: 'Nên có hợp đồng hoặc bản nháp đang được HR theo dõi.',
    },
    {
      id: 'account',
      label: 'Tài khoản đang hoạt động',
      done: employee.account_status === 'dang_hoat_dong',
      hint: 'Giúp nhân sự vào app, ký hợp đồng và xem lịch.',
    },
  ]
  const completedChecklistCount = profileChecklist.filter((item) => item.done).length
  const checklistPercent = Math.round((completedChecklistCount / profileChecklist.length) * 100)
  const overallStatusTone = employee.status === 'resigned'
    ? 'bg-gray-100 text-gray-700 border-gray-200'
    : checklistPercent >= 85 && currentContract && employee.account_status === 'dang_hoat_dong'
      ? 'bg-green-50 text-green-700 border-green-100'
      : checklistPercent >= 60
        ? 'bg-amber-50 text-amber-700 border-amber-100'
        : 'bg-red-50 text-red-700 border-red-100'
  const overallStatusLabel = employee.status === 'resigned'
    ? 'Đã đóng hồ sơ'
    : checklistPercent >= 85 && currentContract && employee.account_status === 'dang_hoat_dong'
      ? 'Sẵn sàng vận hành'
      : checklistPercent >= 60
        ? 'Cần bổ sung'
        : 'Thiếu hồ sơ'
  const nextPriorityItems = profileChecklist.filter((item) => !item.done).slice(0, 3)
  const remainingChecklistCount = profileChecklist.length - completedChecklistCount
  const contractHealthLabel = pendingContract
    ? 'Đang chờ ký'
    : expiringContract?.endDate
      ? `Hiệu lực đến ${formatDate(expiringContract.endDate)}`
      : currentContract
        ? 'Đang theo dõi'
        : 'Chưa có hợp đồng'
  const offboardingSummaryLabel = employee.status === 'resigned'
    ? 'Đã chốt nghỉ việc'
    : offboardingOpenCount > 0
      ? `${offboardingOpenCount} mục bắt buộc còn mở`
      : offboardingData
        ? 'Đã có checklist nghỉ việc'
        : 'Chưa khởi tạo offboarding'
  const offboardingActionLabel = offboardingData ? 'Mở trung tâm nghỉ việc' : 'Bắt đầu nghỉ việc'
  const shouldHighlightOffboarding = employee.status === 'resigned' || Boolean(offboardingData) || offboardingBlockedCount > 0
  const shouldShowOffboardingHeroCta = canOpenOffboarding && (employee.status === 'resigned' || Boolean(offboardingData))
  const onboardingTimelineItems = onboardingDayOneSnapshot.items.filter((item) => item.id !== 'clarification')
  const recentOnboardingPolicyHistory = onboardingPolicyHistory.slice(0, 3)
  const remainingOnboardingPolicyHistoryCount = Math.max(onboardingPolicyHistory.length - recentOnboardingPolicyHistory.length, 0)
  const onboardingDoneCount = onboardingTimelineItems.filter((item) => item.statusLabel === 'Đã xong').length
  const onboardingLateCount = onboardingTimelineItems.filter((item) => item.statusLabel === 'Trễ mốc').length
  const onboardingWaitingCount = onboardingTimelineItems.filter((item) => item.statusLabel === 'Đang chờ').length

  const refreshProfile = () => setRefreshKey(current => current + 1)

  const syncSessionUserIfNeeded = (updatedEmployee: AuthUser) => {
    if (user.id !== updatedEmployee.id) return
    useAuthStore.setState((current) => ({
      ...current,
      user: updatedEmployee,
      isAuthenticated: true,
    }))
  }

  const persistUpdatedEmployee = (updatedEmployee: AuthUser) => {
    syncSessionUserIfNeeded(updatedEmployee)
    refreshProfile()
  }

  const handleConfirmPolicyAtStore = () => {
    if (!canManageOnboardingPolicy) return
    if (onboardingDayOneSnapshot.clarificationRequested) {
      setMessage('Nhân viên đang chờ HR giải thích thêm trước khi chốt tại cửa hàng.')
      return
    }
    if (!onboardingDayOneSnapshot.canConfirmAtStore) {
      setMessage('Chưa đủ điều kiện chốt nội quy tại cửa hàng.')
      return
    }

    const confirmed = confirm(`Xác nhận đã chốt nội quy ngày đầu cho ${employee.full_name}?`)
    if (!confirmed) return

    const updatedRecord = OnboardingPolicyService.confirmAtStore(employee.id, user)
    if (!updatedRecord) {
      setMessage('Không thể chốt nội quy tại cửa hàng. Vui lòng kiểm tra lại trạng thái hiện tại.')
      return
    }

    setMessage('Đã chốt nội quy onboarding tại cửa hàng.')
    refreshProfile()
  }

  const updateEditField = (key: keyof EditFormData, value: string) => {
    setEditForm(current => ({ ...current, [key]: value }))
    if (editErrors[key]) {
      setEditErrors(current => ({ ...current, [key]: undefined }))
    }
    if (message) {
      setMessage('')
    }
  }

  const closeEditMode = () => {
    setIsEditing(false)
    setEditErrors({})
    setMessage('')
    router.replace(`/employees/${employee.id}`)
  }

  const validateEditForm = () => {
    const nextErrors: EditFormErrors = {}

    if (!editForm.full_name.trim()) nextErrors.full_name = 'Vui lòng nhập họ và tên'

    if (!editForm.phone.trim()) {
      nextErrors.phone = 'Vui lòng nhập số điện thoại'
    } else if (!/^[0-9]{9,11}$/.test(editForm.phone.replace(/\s/g, ''))) {
      nextErrors.phone = 'Số điện thoại không hợp lệ'
    } else if (EmployeeService.isPhoneDuplicate(editForm.phone, employee.id)) {
      nextErrors.phone = 'Số điện thoại đã tồn tại'
    }

    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      nextErrors.email = 'Email không hợp lệ'
    } else if (editForm.email && EmployeeService.isEmailDuplicate(editForm.email, employee.id)) {
      nextErrors.email = 'Email đã tồn tại'
    }

    if (!editForm.hire_date) nextErrors.hire_date = 'Vui lòng chọn ngày vào làm'
    if (!editForm.store_id) nextErrors.store_id = 'Vui lòng chọn chi nhánh'
    if (!editForm.position_id) nextErrors.position_id = 'Vui lòng chọn chức danh'
    if (!editForm.role) nextErrors.role = 'Vui lòng chọn vai trò'

    setEditErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSaveProfile = async () => {
    if (!canManageEmployee) return
    if (!validateEditForm()) return

    setIsSaving(true)
    const updated = EmployeeService.updateEmployee(
      employee.id,
      {
        full_name: editForm.full_name.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim(),
        hire_date: editForm.hire_date,
        store_id: editForm.store_id,
        position_id: editForm.position_id,
        role: editForm.role as AuthUser['role'],
        status: mapWorkStatusToAuthStatus(editForm.work_status),
        account_status: editForm.account_status,
        date_of_birth: editForm.date_of_birth || undefined,
        gender: (editForm.gender || undefined) as EmployeeProfileExtras['gender'],
        cccd: editForm.cccd.trim() || undefined,
        address: editForm.address.trim() || undefined,
        emergency_contact: editForm.emergency_contact.trim() || undefined,
      },
      user,
      'Cập nhật hồ sơ nhân sự',
    )

    await new Promise(resolve => setTimeout(resolve, 300))
    setIsSaving(false)

    if (!updated) {
      setMessage('Không thể lưu thay đổi. Vui lòng thử lại.')
      return
    }

    setMessage('Đã lưu cập nhật hồ sơ.')
    setIsEditing(false)
    router.replace(`/employees/${employee.id}`)
    persistUpdatedEmployee(updated)
  }

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!canManageEmployee) return

    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage('Vui lòng chọn file ảnh hợp lệ.')
      return
    }

    if (file.size > MAX_AVATAR_FILE_SIZE) {
      setMessage('Ảnh đại diện cần nhỏ hơn 2MB để lưu ổn định trong app demo.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string' || !reader.result) {
        setMessage('Không thể đọc file ảnh. Vui lòng thử lại.')
        return
      }

      const updated = EmployeeService.updateEmployee(
        employee.id,
        { avatar_url: reader.result },
        user,
        'Cập nhật ảnh đại diện',
      )

      if (!updated) {
        setMessage('Không thể cập nhật ảnh đại diện. Vui lòng thử lại.')
        return
      }

      setMessage('Đã cập nhật ảnh đại diện.')
      persistUpdatedEmployee(updated)
    }
    reader.onerror = () => {
      setMessage('Không thể đọc file ảnh. Vui lòng thử lại.')
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = () => {
    if (!canManageEmployee) return
    const confirmed = confirm('Xóa ảnh đại diện hiện tại và quay về chữ cái mặc định?')
    if (!confirmed) return

    const updated = EmployeeService.updateEmployee(
      employee.id,
      { avatar_url: undefined },
      user,
      'Xóa ảnh đại diện',
    )

    if (!updated) {
      setMessage('Không thể xóa ảnh đại diện. Vui lòng thử lại.')
      return
    }

    setMessage('Đã xóa ảnh đại diện.')
    persistUpdatedEmployee(updated)
  }

  const handleToggleAccountStatus = () => {
    if (!canManageEmployee) return
    const nextStatus = employee.account_status === 'bi_khoa' ? 'dang_hoat_dong' : 'bi_khoa'
    const confirmed = confirm(nextStatus === 'bi_khoa' ? 'Khóa tài khoản nhân sự này?' : 'Mở khóa tài khoản nhân sự này?')
    if (!confirmed) return

    const updated = EmployeeService.updateEmployee(
      employee.id,
      { account_status: nextStatus },
      user,
        nextStatus === 'bi_khoa' ? 'Khóa tài khoản' : 'Mở khóa tài khoản',
    )

    if (updated) {
      setMessage(nextStatus === 'bi_khoa' ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.')
      persistUpdatedEmployee(updated)
    }
  }

  const handleToggleWorkStatus = () => {
    if (!canManageEmployee) return
    const nextStatus = employee.status === 'resigned' ? 'active' : 'resigned'
    const confirmed = confirm(nextStatus === 'resigned' ? 'Đánh dấu nhân sự này đã nghỉ việc?' : 'Khôi phục trạng thái làm việc cho nhân sự này?')
    if (!confirmed) return

    const updated = EmployeeService.updateEmployee(
      employee.id,
      {
        status: nextStatus,
        account_status: nextStatus === 'resigned' ? 'bi_khoa' : 'dang_hoat_dong',
      },
      user,
      nextStatus === 'resigned' ? 'Đánh dấu nghỉ việc' : 'Khôi phục làm việc',
    )

    if (updated) {
      setMessage(nextStatus === 'resigned' ? 'Đã đánh dấu nghỉ việc.' : 'Đã khôi phục làm việc.')
      persistUpdatedEmployee(updated)
    }
  }

  return (
    <AppShell>
      <div className="space-y-5 pb-16">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm font-medium text-primary-500 hover:text-primary-600"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex flex-col items-center gap-3">
                  {employee.avatar_url ? (
                    <Image
                      src={employee.avatar_url}
                      alt={`Ảnh đại diện của ${employee.full_name}`}
                      width={96}
                      height={96}
                      className="h-24 w-24 rounded-full object-cover shadow-lg"
                    />
                  ) : (
                    <div
                      className="flex h-24 w-24 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg"
                      style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}
                    >
                      {getInitials(employee.full_name)}
                    </div>
                  )}
                  {canManageEmployee ? (
                    <div className="flex flex-wrap justify-center gap-2">
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-3 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-100"
                      >
                        <Camera size={14} />
                        {employee.avatar_url ? 'Thay ảnh' : 'Tải ảnh'}
                      </button>
                      {employee.avatar_url ? (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <ImageOff size={14} />
                          Xóa ảnh
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <h1 className="text-xl font-bold text-gray-900">{employee.full_name}</h1>
                <p className="mt-1 text-sm text-gray-500">{position?.name || 'Chưa phân bổ vị trí'}</p>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${workStatus.className}`}>
                    {workStatus.label}
                  </span>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${accountStatus.className}`}>
                    {accountStatus.label}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-3 border-t border-gray-100 pt-5 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <Phone size={15} className="text-gray-400" />
                  <span>{employee.phone || 'Chưa cập nhật'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={15} className="text-gray-400" />
                  <span className="truncate">{employee.email || 'Chưa cập nhật'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Building2 size={15} className="text-gray-400" />
                  <span>{getStoreDisplayName(store?.name)}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Calendar size={15} className="text-gray-400" />
                  <span>Ngày vào làm: {formatDate(employee.hire_date)}</span>
                </p>
              </div>
              <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Sinh nhật</p>
                {birthdaySummary ? (
                  <>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{birthdaySummary.label}</p>
                    <p className="mt-1 text-xs text-gray-500">{birthdaySummary.detail}</p>
                  </>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">Chưa có ngày sinh để bật countdown và thông báo sinh nhật.</p>
                )}
              </div>
            </div>

            {message ? (
              <div className="rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-700">
                {message}
              </div>
            ) : null}

            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Thao tác với nhân sự này</p>
                  <p className="mt-1 text-xs text-gray-500">Gom thao tác quản lý và lối tắt thường dùng để quét nhanh hơn.</p>
                </div>
                <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${overallStatusTone}`}>
                  {overallStatusLabel}
                </span>
              </div>

              {canManageEmployee ? (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Quản lý nhanh</p>
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditForm(buildEditForm(employee, profile))
                        setEditErrors({})
                        setIsEditing(true)
                        setActiveTab('personal')
                        setMessage('')
                        router.replace(`/employees/${employee.id}?mode=edit`)
                      }}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-3 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-100"
                    >
                      <Pencil size={16} />
                      Sửa hồ sơ
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleAccountStatus}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      {employee.account_status === 'bi_khoa' ? <Unlock size={16} /> : <Lock size={16} />}
                      {employee.account_status === 'bi_khoa' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleWorkStatus}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      {employee.status === 'resigned' ? <RefreshCcw size={16} /> : <UserX size={16} />}
                      {employee.status === 'resigned' ? 'Khôi phục làm việc' : 'Đánh dấu nghỉ việc'}
                    </button>
                  </div>
                </div>
              ) : null}

              <div className={`${canManageEmployee ? 'mt-4 border-t border-gray-100 pt-4' : 'mt-4'}`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Đi nhanh tới trung tâm liên quan</p>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <Link href={`/employees/contracts?employeeId=${employee.id}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                    <FileText size={16} />
                    Mở hồ sơ hợp đồng
                  </Link>
                  {canManageEmployee ? (
                    <Link href={`/employees/contracts?employeeId=${employee.id}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                      <Pencil size={16} />
                      Tạo hoặc sửa hợp đồng
                    </Link>
                  ) : null}
                  <Link href="/attendance/today" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                    <ShieldCheck size={16} />
                    Xem chấm công gần đây
                  </Link>
                  {canOpenOffboarding ? (
                    <Link
                      href={`/employees/offboarding?employeeId=${employee.id}`}
                      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors ${
                        shouldHighlightOffboarding
                          ? 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                          : 'border border-dashed border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <UserX size={16} />
                      {offboardingActionLabel}
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
            {canManageEmployee ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Ghi chú nội bộ HR</p>
                    <p className="mt-1 text-xs text-gray-500">Dùng để lưu nhắc việc, đánh giá mềm và các mục cần theo dõi riêng.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = EmployeeService.updateEmployee(
                        employee.id,
                        { candidate_notes: hrNoteDraft.trim() || undefined },
                        user,
                        'Cập nhật ghi chú nội bộ HR',
                      )

                      if (!updated) {
                        setMessage('Không thể lưu ghi chú nội bộ. Vui lòng thử lại.')
                        return
                      }

                      setMessage('Đã lưu ghi chú nội bộ HR.')
                      refreshProfile()
                    }}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-primary-500 px-3 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
                  >
                    <Save size={14} />
                    Lưu ghi chú
                  </button>
                </div>

                <textarea
                  value={hrNoteDraft}
                  onChange={(event) => setHrNoteDraft(event.target.value)}
                  rows={6}
                  placeholder="Ví dụ: cần bổ sung CCCD scan, cần theo dõi ký hợp đồng trong tuần này..."
                  className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-primary-400"
                />
              </div>
            ) : null}
          </aside>

          <section className="space-y-4">
            {shouldShowEditPanel ? (
              <div className="rounded-3xl border border-primary-100 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Sửa hồ sơ nhân sự</p>
                    <p className="text-sm text-gray-500">Cập nhật thông tin cá nhân, công việc và tài khoản ngay tại trang này.</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={closeEditMode} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                      <X size={16} />
                      Đóng
                    </button>
                    <button type="button" onClick={() => void handleSaveProfile()} disabled={isSaving} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70">
                      <Save size={16} />
                      {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-gray-900">Thông tin cá nhân</p>
                    <FormField label="Họ và tên" error={editErrors.full_name}>
                      <input value={editForm.full_name} onChange={(event) => updateEditField('full_name', event.target.value)} className={getInputClassName(Boolean(editErrors.full_name))} />
                    </FormField>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField label="Số điện thoại" error={editErrors.phone}>
                        <input value={editForm.phone} onChange={(event) => updateEditField('phone', event.target.value)} className={getInputClassName(Boolean(editErrors.phone))} />
                      </FormField>
                      <FormField label="Email" error={editErrors.email}>
                        <input value={editForm.email} onChange={(event) => updateEditField('email', event.target.value)} className={getInputClassName(Boolean(editErrors.email))} />
                      </FormField>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField label="Ngày vào làm" error={editErrors.hire_date}>
                        <input type="date" value={editForm.hire_date} onChange={(event) => updateEditField('hire_date', event.target.value)} className={getInputClassName(Boolean(editErrors.hire_date))} />
                      </FormField>
                      <FormField label="Ngày sinh">
                        <input type="date" value={editForm.date_of_birth} onChange={(event) => updateEditField('date_of_birth', event.target.value)} className={getInputClassName(false)} />
                      </FormField>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField label="Giới tính">
                        <select value={editForm.gender} onChange={(event) => updateEditField('gender', event.target.value)} className={getInputClassName(false)}>
                          <option value="">Chưa chọn</option>
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                          <option value="other">Khác</option>
                        </select>
                      </FormField>
                      <FormField label="CCCD / Hộ chiếu">
                        <input value={editForm.cccd} onChange={(event) => updateEditField('cccd', event.target.value)} className={getInputClassName(false)} />
                      </FormField>
                    </div>
                    <FormField label="Địa chỉ">
                      <input value={editForm.address} onChange={(event) => updateEditField('address', event.target.value)} className={getInputClassName(false)} />
                    </FormField>
                    <FormField label="Liên hệ khẩn cấp">
                      <input value={editForm.emergency_contact} onChange={(event) => updateEditField('emergency_contact', event.target.value)} className={getInputClassName(false)} />
                    </FormField>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-gray-900">Thông tin công việc</p>
                    <FormField label="Chi nhánh" error={editErrors.store_id}>
                      <select value={editForm.store_id} onChange={(event) => updateEditField('store_id', event.target.value)} className={getInputClassName(Boolean(editErrors.store_id))}>
                          <option value="">Chọn chi nhánh</option>
                        {mockStores.map(storeOption => (
                          <option key={storeOption.id} value={storeOption.id}>
                            {getStoreDisplayName(storeOption.name)}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Chức danh" error={editErrors.position_id}>
                      <select value={editForm.position_id} onChange={(event) => updateEditField('position_id', event.target.value)} className={getInputClassName(Boolean(editErrors.position_id))}>
                          <option value="">Chọn chức danh</option>
                        {mockPositions.map(positionOption => (
                          <option key={positionOption.id} value={positionOption.id}>
                            {positionOption.name}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField label="Vai trò hệ thống" error={editErrors.role}>
                        <select value={editForm.role} onChange={(event) => updateEditField('role', event.target.value)} className={getInputClassName(Boolean(editErrors.role))}>
                          {roleOptions.map(roleOption => (
                            <option key={roleOption} value={roleOption}>
                              {ROLE_LABELS[roleOption] || roleOption}
                            </option>
                          ))}
                        </select>
                      </FormField>
                      <FormField label="Trạng thái làm việc">
                        <select value={editForm.work_status} onChange={(event) => updateEditField('work_status', event.target.value)} className={getInputClassName(false)}>
                          {WORK_STATUS_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </FormField>
                    </div>
                    <FormField label="Trạng thái tài khoản">
                      <select value={editForm.account_status} onChange={(event) => updateEditField('account_status', event.target.value)} className={getInputClassName(false)}>
                        {ACCOUNT_STATUS_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                      Sau khi lưu, thay đổi sẽ tự động vào tab lịch sử hoạt động của hồ sơ này.
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-gray-100 bg-white p-1 shadow-sm">
              <div className="flex flex-wrap gap-1">
                {[
                  { key: 'overview', label: 'Tổng quan' },
                  { key: 'onboarding', label: 'Nội quy & onboarding' },
                  { key: 'contracts', label: 'Hợp đồng' },
                  { key: 'personal', label: 'Cá nhân' },
                  { key: 'job', label: 'Công việc' },
                  { key: 'history', label: 'Lịch sử hoạt động' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as 'overview' | 'onboarding' | 'contracts' | 'personal' | 'job' | 'history')}
                    className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                      activeTab === tab.key ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'overview' ? (
              <div className="space-y-4">
                <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-600">Tổng quan hồ sơ</p>
                      <h2 className="mt-2 text-2xl font-bold text-gray-900">{employee.full_name}</h2>
                      <p className="mt-2 max-w-2xl text-sm text-gray-500">Chỉ giữ phần tóm tắt nhanh để biết hồ sơ đang ổn hay còn vướng gì.</p>
                    </div>
                    <div className="flex flex-col gap-2 lg:items-end">
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${overallStatusTone}`}>
                          {overallStatusLabel}
                        </span>
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${workStatus.className}`}>
                          {workStatus.label}
                        </span>
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${accountStatus.className}`}>
                          {accountStatus.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-gray-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-gray-400">Hồ sơ sẵn sàng</p>
                      <p className="mt-1 text-2xl font-bold text-gray-900">{completeness}%</p>
                      <p className="mt-1 text-xs text-gray-500">{completedChecklistCount}/{profileChecklist.length} mục đã sẵn sàng</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-gray-400">Nội quy</p>
                      <p className="mt-1 text-lg font-bold text-gray-900">{onboardingPolicyStatus.label}</p>
                      <p className="mt-1 text-xs text-gray-500">{onboardingDayOneSnapshot.nextActionLabel}</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-gray-400">Hợp đồng</p>
                      <p className="mt-1 text-lg font-bold text-gray-900">{currentContract ? (contractStatusMeta?.label || 'Đang theo dõi') : 'Chưa có hợp đồng'}</p>
                      <p className="mt-1 text-xs text-gray-500">{contractHealthLabel}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
                  <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Việc cần chốt</p>
                        <p className="mt-1 text-xs text-gray-500">Chỉ giữ các việc nên xử lý trước để tránh màn hình quá dày.</p>
                      </div>
                      <span className="text-sm font-bold text-primary-600">{checklistPercent}%</span>
                    </div>
                    <div className="mt-4 space-y-2">
                      {nextPriorityItems.length === 0 ? (
                        <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                          Hồ sơ đã đủ các mục chính để vận hành.
                        </div>
                      ) : (
                        nextPriorityItems.slice(0, 2).map((item, index) => (
                          <div key={item.id} className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                            <div className="flex items-start gap-3">
                              <span className="mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-amber-700">
                                {index + 1}
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                                <p className="mt-1 text-xs text-gray-600">{item.hint}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Đi nhanh tới chi tiết</p>
                          <p className="mt-1 text-xs text-gray-500">Mở đúng tab cần xử lý thay vì để hết trong Tổng quan.</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab('onboarding')}
                          className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Mở nội quy
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('contracts')}
                          className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Mở hợp đồng
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('history')}
                          className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Mở lịch sử
                        </button>
                        {shouldShowOffboardingHeroCta ? (
                          <Link href={`/employees/offboarding?employeeId=${employee.id}`} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                            <UserX size={14} />
                            {offboardingData ? 'Mở offboarding' : 'Mở nghỉ việc'}
                          </Link>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Việc cần chốt</p>
                          <p className="mt-1 text-xs text-gray-500">{remainingChecklistCount === 0 ? 'Không còn mục mở.' : `${remainingChecklistCount} mục còn mở trên hồ sơ.`}</p>
                        </div>
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${overallStatusTone}`}>
                          {overallStatusLabel}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-gray-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Mức sẵn sàng</p>
                          <p className="mt-1 text-2xl font-bold text-gray-900">{completedChecklistCount}/{profileChecklist.length}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Cập nhật gần đây</p>
                          <p className="mt-1 text-2xl font-bold text-gray-900">{recentUpdateCount}</p>
                          <p className="mt-1 text-xs text-gray-500">mốc mới trên hồ sơ và hợp đồng</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === 'onboarding' ? (
              <div className="space-y-4">
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-primary-50 p-2 text-primary-600">
                          <ShieldQuestion size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">Nội quy nhận việc</p>
                          <p className="mt-2 text-2xl font-bold text-gray-900">{onboardingDayOneSnapshot.waitingLabel}</p>
                          <p className="mt-2 max-w-2xl text-sm text-gray-500">{onboardingDayOneSnapshot.nextActionLabel}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 lg:items-end">
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${onboardingPolicyStatus.tone}`}>
                          {onboardingPolicyStatus.label}
                        </span>
                        {onboardingPolicyRecord?.confirmed_at_store_at ? (
                          <span className="inline-flex rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                            Đã chốt tại cửa hàng
                          </span>
                        ) : null}
                      </div>
                      {canManageOnboardingPolicy ? (
                        <button
                          type="button"
                          onClick={handleConfirmPolicyAtStore}
                          disabled={!onboardingDayOneSnapshot.canConfirmAtStore || onboardingDayOneSnapshot.clarificationRequested}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <UserCheck size={16} />
                          Xác nhận tại cửa hàng ngày đầu
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                      {onboardingDoneCount} mốc đã xong
                    </span>
                    <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">
                      {onboardingLateCount} mốc trễ
                    </span>
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                      {onboardingWaitingCount} mốc đang chờ
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Trạng thái</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{onboardingPolicyStatus.label}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {onboardingPolicyRecord?.full_sent_at ? 'Đã gửi bản đầy đủ' : onboardingPolicyRecord?.summary_sent_at ? 'Đã gửi bản tóm tắt' : 'Chưa gửi nội quy'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Nhân viên phản hồi</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {onboardingPolicyRecord?.acknowledged_at ? formatDate(onboardingPolicyRecord.acknowledged_at) : onboardingDayOneSnapshot.clarificationRequested ? 'Cần giải thích thêm' : 'Chưa phản hồi'}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {onboardingPolicyRecord?.acknowledged_at ? 'Đã xác nhận nội quy' : onboardingDayOneSnapshot.clarificationRequested ? 'Đang chờ HR/quản lý xử lý' : 'Đang chờ nhân viên đọc và phản hồi'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Chốt ngày đầu</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {onboardingPolicyRecord?.confirmed_at_store_at ? formatDate(onboardingPolicyRecord.confirmed_at_store_at) : 'Chưa chốt tại cửa hàng'}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {onboardingPolicyRecord?.confirmed_at_store_at ? 'Quản lý/HR đã chốt tại cửa hàng' : 'Sẽ chốt khi đến ngày đầu làm việc'}
                      </p>
                    </div>
                  </div>

                  {onboardingDayOneSnapshot.clarificationRequested ? (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      <p className="font-semibold">Cần HR giải thích thêm</p>
                      <p className="mt-1 text-xs text-amber-700">Nhân viên đang chờ HR hoặc quản lý giải thích trước khi chốt onboarding ngày đầu.</p>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Bảng tiến độ onboarding</p>
                      <p className="mt-1 text-xs text-gray-500">Dùng bảng ngang để rà từng mốc nhanh hơn.</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                      {onboardingTimelineItems.filter((item) => item.done).length}/{onboardingTimelineItems.length} xong
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                          <th className="px-3 py-3">Mốc</th>
                          <th className="px-3 py-3">Trạng thái</th>
                          <th className="px-3 py-3">Ngày dự kiến</th>
                          <th className="px-3 py-3">Ngày đã gửi / phản hồi</th>
                          <th className="px-3 py-3">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {onboardingTimelineItems.map((item, index) => (
                          <tr key={item.id} className="border-b border-gray-50 align-top">
                            <td className="px-3 py-3 font-semibold text-gray-900">{index + 1}. {item.label}</td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                item.tone === 'done'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : item.tone === 'warning'
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-gray-100 text-gray-600'
                              }`}>
                                {item.statusLabel}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-gray-600">
                              {item.dueAt ? formatDate(item.dueAt) : item.scheduleLabel?.includes('không bắt xác nhận') ? 'Không áp dụng' : 'Chưa có mốc'}
                            </td>
                            <td className="px-3 py-3 text-gray-600">
                              {item.actualAt
                                ? formatDate(item.actualAt)
                                : item.scheduleLabel?.includes('không bắt xác nhận')
                                  ? 'Không bắt buộc'
                                  : item.statusLabel === 'Chưa tới lịch'
                                    ? 'Chưa tới lịch'
                                    : 'Chưa có'}
                            </td>
                            <td className="px-3 py-3 text-gray-600">
                              <div className="font-medium text-gray-700">{item.hint}</div>
                              {item.scheduleLabel ? (
                                <div className="mt-1 text-xs text-gray-400">{item.scheduleLabel}</div>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Lịch sử gần đây</p>
                      <p className="mt-1 text-xs text-gray-500">Giữ vài mốc mới nhất cho phần nội quy.</p>
                    </div>
                    {remainingOnboardingPolicyHistoryCount > 0 ? (
                      <span className="text-xs font-medium text-gray-400">+{remainingOnboardingPolicyHistoryCount} mốc cũ hơn</span>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    {recentOnboardingPolicyHistory.length > 0 ? (
                      recentOnboardingPolicyHistory.map((item) => (
                        <div key={item.id} className="rounded-2xl bg-gray-50 px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-primary-700">
                              {getOnboardingPolicyActionLabel(item.action)}
                            </span>
                            <span className="text-[11px] text-gray-500">{formatDate(item.at)}</span>
                          </div>
                          <p className="mt-2 text-sm font-semibold text-gray-900">{normalizeOnboardingDisplayText(item.note)}</p>
                          <p className="mt-1 text-xs text-gray-500">{normalizeOnboardingDisplayText(item.actor_name)}</p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-400">
                        Chưa có lịch sử nội quy gần đây.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === 'contracts' ? (
              <div className="space-y-4">
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Hợp đồng đang theo dõi</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900">{currentContract ? (contractStatusMeta?.label || 'Đang theo dõi') : 'Chưa có hợp đồng'}</p>
                      <p className="mt-2 text-sm text-gray-500">{contractHealthLabel}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/employees/contracts?employeeId=${employee.id}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                        <FileText size={16} />
                        Mở hồ sơ hợp đồng
                      </Link>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Mã đang theo dõi</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{currentContract?.customFields['contract.code'] || 'Chưa có'}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Số bản đang theo dõi</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{activeOrDraftContractCount} bản</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Bước tiếp theo</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{contractHealthLabel}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-900">Bảng hợp đồng</p>
                    <p className="mt-1 text-xs text-gray-500">Rà nhanh theo từng bản hợp đồng thay vì xem trong card dọc.</p>
                  </div>
                  {isLoadingContracts ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-400">Đang tải hợp đồng...</div>
                  ) : employeeContracts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                            <th className="px-3 py-3">Mã HĐ</th>
                            <th className="px-3 py-3">Loại</th>
                            <th className="px-3 py-3">Trạng thái</th>
                            <th className="px-3 py-3">Hiệu lực</th>
                            <th className="px-3 py-3">Phiên bản</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employeeContracts.map((contract) => {
                            const statusMeta = CONTRACT_STATUS_META[contract.status]
                            return (
                              <tr key={contract.id} className="border-b border-gray-50 align-top">
                                <td className="px-3 py-3 font-semibold text-gray-900">{contract.customFields['contract.code'] || contract.id}</td>
                                <td className="px-3 py-3 text-gray-600">{contract.customFields['contract.type'] || 'xac_dinh_thoi_han'}</td>
                                <td className="px-3 py-3">
                                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusMeta?.tone || 'bg-gray-100 text-gray-600'}`}>
                                    {statusMeta?.label || contract.status}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-gray-600">{contract.startDate} {contract.endDate ? `→ ${contract.endDate}` : '→ Không xác định'}</td>
                                <td className="px-3 py-3 text-gray-600">{contract.version}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-400">Chưa có hợp đồng nào gắn với hồ sơ này.</div>
                  )}
                </div>
              </div>
            ) : null}

            {activeTab === 'personal' ? (
              <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <User size={18} className="text-primary-500" />
                  <h2 className="text-lg font-bold text-gray-900">Thông tin cá nhân</h2>
                </div>
                <div className={`mb-5 rounded-2xl border px-4 py-4 ${birthdaySummary?.tone || 'border-dashed border-gray-200 bg-gray-50 text-gray-600'}`}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide">Countdown sinh nhật</p>
                      <p className="mt-1 text-base font-semibold">
                        {birthdaySummary ? birthdaySummary.label : 'Chưa có ngày sinh để đếm ngược'}
                      </p>
                      <p className="mt-1 text-sm">
                        {birthdaySummary ? birthdaySummary.detail : 'Hãy cập nhật ngày sinh để hệ thống tự nhắc 7 ngày trước, 1 ngày trước và đúng ngày.'}
                      </p>
                    </div>
                    <div className="inline-flex h-fit rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-gray-700">
                      {birthdaySummary ? birthdaySummary.nextBirthdayLabel : 'Chưa có dữ liệu'}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
                  <InfoItem label="Họ và tên" value={employee.full_name} />
                  <InfoItem label="Số điện thoại" value={employee.phone} />
                  <InfoItem label="Email" value={employee.email} />
                  <InfoItem label="Ngày vào làm" value={formatDate(employee.hire_date)} />
                  <InfoItem label="Ngày sinh" value={profile?.date_of_birth ? formatDate(profile.date_of_birth) : ''} />
                  <InfoItem label="Giới tính" value={getGenderLabel(profile?.gender)} />
                  <InfoItem label="Số CCCD / Hộ chiếu" value={profile?.cccd} />
                  <InfoItem label="Địa chỉ thường trú" value={profile?.address} />
                  <InfoItem label="Liên hệ khẩn cấp" value={profile?.emergency_contact} />
                </div>
              </div>
            ) : null}

            {activeTab === 'job' ? (
              <div className="space-y-4">
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-2">
                    <Briefcase size={18} className="text-primary-500" />
                    <h2 className="text-lg font-bold text-gray-900">Thông tin công việc</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
                    <InfoItem label="Chi nhánh" value={store?.name || 'Chưa phân bổ'} placeholder="Chưa phân bổ" />
                    <InfoItem label="Chức danh" value={position?.name || 'Chưa phân bổ'} placeholder="Chưa phân bổ" />
                    <InfoItem label="Vai trò hệ thống" value={getRoleLabel(employee.role)} />
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Trạng thái làm việc</p>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${workStatus.className}`}>
                        {workStatus.label}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Trạng thái tài khoản</p>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${accountStatus.className}`}>
                        {accountStatus.label}
                      </span>
                    </div>
                    <InfoItem label="Mã nhân viên" value={employee.employee_code} placeholder="Chưa cấp mã" />
                    <InfoItem label="Cấp độ KPI" value={employee.kpi_level || 'L0'} />
                    <InfoItem label="Xếp hạng thi đua" value={employee.gamification_level?.toUpperCase() || 'BRONZE'} />
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-primary-500" />
                    <h2 className="text-lg font-bold text-gray-900">Chấm công gần đây</h2>
                  </div>

                  {empAttendances.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-400">Chưa có dữ liệu chấm công.</div>
                  ) : (
                    <div className="space-y-3">
                      {empAttendances.map(attendance => (
                        <div key={attendance.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{formatDate(attendance.date)}</p>
                            <p className="text-xs text-gray-500">
                              {attendance.check_in_time ? formatTime(attendance.check_in_time) : '--:--'}
                              {attendance.check_out_time ? ` -> ${formatTime(attendance.check_out_time)}` : ''}
                            </p>
                          </div>
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(attendance.status)}`}>
                            {getStatusLabel(attendance.status)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-2">
                    <UserX size={18} className="text-primary-500" />
                    <h2 className="text-lg font-bold text-gray-900">Tình trạng nghỉ việc</h2>
                  </div>

                  {employee.status === 'resigned' ? (
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                        Nhân sự này đã được đánh dấu nghỉ việc và tài khoản đang ở trạng thái kiểm soát.
                      </div>
                      <InfoItem label="Trạng thái hiện tại" value="Đã nghỉ việc" />
                      <InfoItem label="Tài khoản" value={accountStatus.label} />
                      <InfoItem label="Checklist offboarding" value={offboardingSummaryLabel} />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className={`rounded-2xl border p-4 text-sm ${
                        offboardingData
                          ? 'border-amber-100 bg-amber-50 text-amber-700'
                          : 'border-dashed border-gray-200 text-gray-500'
                      }`}>
                        {offboardingData
                          ? `${offboardingSummaryLabel}. ${offboardingBlockedCount > 0 ? `Còn ${offboardingBlockedCount} quyền truy cập đang treo.` : 'Checklist đã sẵn sàng để HR tiếp tục xử lý.'}`
                          : 'Chưa khởi tạo hồ sơ nghỉ việc cho nhân sự này.'}
                      </div>
                      {canOpenOffboarding ? (
                        <Link href={`/employees/offboarding?employeeId=${employee.id}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                          <UserX size={16} />
                          {offboardingData ? 'Mở trung tâm nghỉ việc' : 'Bắt đầu nghỉ việc'}
                        </Link>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {activeTab === 'history' ? (
              <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <History size={18} className="text-primary-500" />
                  <h2 className="text-lg font-bold text-gray-900">Nhật ký hồ sơ</h2>
                </div>

                {combinedTimeline.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-400">Chưa có nhật ký thay đổi cho hồ sơ này.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                          <th className="px-3 py-3">Thời gian</th>
                          <th className="px-3 py-3">Nhóm</th>
                          <th className="px-3 py-3">Nội dung</th>
                          <th className="px-3 py-3">Nguồn</th>
                          <th className="px-3 py-3">Người cập nhật</th>
                        </tr>
                      </thead>
                      <tbody>
                        {combinedTimeline.map(item => (
                          <tr key={item.id} className="border-b border-gray-50 align-top">
                            <td className="px-3 py-3 text-gray-600">
                              <div>{formatDate(item.created_at)}</div>
                              <div className="text-xs text-gray-400">{formatTime(item.created_at)}</div>
                            </td>
                            <td className="px-3 py-3">
                              <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                {item.badge}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <div className="font-medium text-gray-900">{item.title}</div>
                              <div className="mt-1 text-gray-600">{item.detail}</div>
                            </td>
                            <td className="px-3 py-3 text-gray-600">{item.kind === 'contract' ? 'Hợp đồng' : 'Hồ sơ nhân sự'}</td>
                            <td className="px-3 py-3 text-gray-600">{item.actor || 'Hệ thống'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </AppShell>
  )
}
