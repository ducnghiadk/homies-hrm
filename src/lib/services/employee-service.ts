import type { AuthUser } from '@/store/auth-store'
import {
  EmployeeInvitation,
  INITIAL_INVITATIONS,
  InvitationFormData,
  InvitationSendLog,
  InvitationStatus,
  mockOffboardingChecklists,
  type OffboardingChecklist,
  type EmployeeActivityLog,
  type EmploymentType,
  type ProbationSalaryMode,
} from '@/lib/mock-data-employee-ext'
import { mockPositions, mockStores } from '@/lib/mock-data'
import { settingsSystem } from '@/lib/mock-data-settings'
import { createNotificationDeduped } from '@/lib/notifications/notification-center'
import { OnboardingPolicyService } from '@/lib/services/onboarding-policy-service'

const STORAGE_KEY = 'hrm_employees_db'
const INVITATIONS_KEY = 'hrm_invitations_db'
const EMPLOYEE_ACTIVITY_LOGS_KEY = 'hrm_employee_activity_logs'
const DEFAULT_PROBATION_DAYS = 60
const COMPANY_EMPLOYEE_VIEW_ROLES: AuthUser['role'][] = ['ceo', 'hr_admin', 'area_manager']
const STORE_EMPLOYEE_VIEW_ROLES: AuthUser['role'][] = ['store_manager', 'shift_leader']
const DEFAULT_APP_BASE_URL = 'http://localhost:3333'
const DEMO_ONBOARDING_PREP_HIRE_DATE = addDays(new Date().toISOString().split('T')[0], 3)
const DEMO_ONBOARDING_DAY_FIVE_HIRE_DATE = addDays(new Date().toISOString().split('T')[0], 5)

function addDays(dateValue: string, days: number) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return new Date().toISOString().split('T')[0]
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

function parseIsoDate(value?: string): Date | null {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const parsed = new Date(year, month, day, 12, 0, 0, 0)

  if (
    Number.isNaN(parsed.getTime())
    || parsed.getFullYear() !== year
    || parsed.getMonth() !== month
    || parsed.getDate() !== day
  ) {
    return null
  }

  return parsed
}

function formatIsoDate(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getStartOfDay(value = new Date()): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0)
}

function getNextBirthdayInfo(dateOfBirth?: string, now = new Date()) {
  const birthday = parseIsoDate(dateOfBirth)
  if (!birthday) return null

  const today = getStartOfDay(now)
  let nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate(), 12, 0, 0, 0)

  if (nextBirthday < today) {
    nextBirthday = new Date(today.getFullYear() + 1, birthday.getMonth(), birthday.getDate(), 12, 0, 0, 0)
  }

  const daysUntil = Math.round((getStartOfDay(nextBirthday).getTime() - today.getTime()) / (24 * 60 * 60 * 1000))

  return {
    nextBirthday,
    nextBirthdayDate: formatIsoDate(nextBirthday),
    daysUntil,
    isToday: daysUntil === 0,
  }
}

function getDepartmentName(positionId: string, role: AuthUser['role']) {
  if (['ceo', 'hr_admin'].includes(role)) return 'Nhân sự - Điều hành'
  const positionName = mockPositions.find(position => position.id === positionId)?.name || ''
  if (positionName.includes('Quản lý') || positionName.includes('Trưởng ca')) return 'Quản lý cửa hàng'
  return 'Vận hành cửa hàng'
}

function getEmploymentType(role: AuthUser['role']): EmploymentType {
  if (['ceo', 'hr_admin', 'store_manager', 'area_manager'].includes(role)) return 'full_time'
  return 'part_time'
}

function getJobLevel(positionId: string, role: AuthUser['role']) {
  const position = mockPositions.find(item => item.id === positionId)
  if (!position) return role === 'employee' ? 'L1' : 'L4'
  if (position.level >= 4) return 'L4'
  if (position.level === 3) return 'L3'
  if (position.level === 2) return 'L2'
  return 'L1'
}

function getOfficialSalary(positionId: string) {
  return mockPositions.find(position => position.id === positionId)?.base_salary || 0
}

function getProbationSalaryValue(officialSalary: number, mode: ProbationSalaryMode) {
  return mode === 'percent_of_official'
    ? Math.round(officialSalary * 0.85)
    : Math.round(officialSalary * 0.85)
}

const VALID_ROLES: AuthUser['role'][] = ['ceo', 'hr_admin', 'store_manager', 'area_manager', 'shift_leader', 'employee']
const VALID_STATUSES: AuthUser['status'][] = ['active', 'inactive', 'probation', 'resigned']
const VALID_ACCOUNT_STATUSES: AuthUser['account_status'][] = ['chua_kich_hoat', 'dang_hoat_dong', 'bi_khoa']

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function sanitizeEmployeeRecord(value: unknown, index: number): AuthUser | null {
  if (!isRecord(value)) return null

  const seedById = typeof value.id === 'string'
    ? INITIAL_EMPLOYEES.find(employee => employee.id === value.id)
    : undefined
  const emailValue = typeof value.email === 'string' ? value.email : undefined
  const seedByEmail = emailValue
    ? INITIAL_EMPLOYEES.find(employee => employee.email.toLowerCase() === emailValue.toLowerCase())
    : undefined
  const seed = seedById || seedByEmail

  const role = typeof value.role === 'string' && VALID_ROLES.includes(value.role as AuthUser['role'])
    ? value.role as AuthUser['role']
    : seed?.role || 'employee'
  const status = typeof value.status === 'string' && VALID_STATUSES.includes(value.status as AuthUser['status'])
    ? value.status as AuthUser['status']
    : seed?.status || 'active'
  const accountStatus = typeof value.account_status === 'string' && VALID_ACCOUNT_STATUSES.includes(value.account_status as AuthUser['account_status'])
    ? value.account_status as AuthUser['account_status']
    : seed?.account_status || 'chua_kich_hoat'

  const employee: AuthUser = {
    id: typeof value.id === 'string' && value.id.trim() ? value.id : seed?.id || `emp-recovered-${index + 1}`,
    full_name: typeof value.full_name === 'string' && value.full_name.trim() ? value.full_name.trim() : seed?.full_name || 'Nhan su chua cap nhat',
    email: typeof value.email === 'string' && value.email.trim() ? value.email.trim() : seed?.email || `recovered-${index + 1}@local.invalid`,
    role,
    store_id: typeof value.store_id === 'string' && value.store_id.trim() ? value.store_id : seed?.store_id || 'store-001',
    position_id: typeof value.position_id === 'string' && value.position_id.trim() ? value.position_id : seed?.position_id || 'pos-001',
    phone: typeof value.phone === 'string' ? value.phone : seed?.phone || '',
    employee_code: typeof value.employee_code === 'string' && value.employee_code.trim() ? value.employee_code : seed?.employee_code || `REC-${String(index + 1).padStart(3, '0')}`,
    avatar_url: typeof value.avatar_url === 'string' && value.avatar_url.trim() ? value.avatar_url : seed?.avatar_url,
    status,
    account_status: accountStatus,
    total_points: typeof value.total_points === 'number' ? value.total_points : seed?.total_points || 0,
    gamification_level: typeof value.gamification_level === 'string' && value.gamification_level.trim() ? value.gamification_level : seed?.gamification_level || 'bronze',
    hire_date: typeof value.hire_date === 'string' && value.hire_date.trim() ? value.hire_date : seed?.hire_date || new Date().toISOString().split('T')[0],
    kpi_level: typeof value.kpi_level === 'string' ? value.kpi_level : seed?.kpi_level,
    date_of_birth: typeof value.date_of_birth === 'string' ? value.date_of_birth : seed?.date_of_birth,
    gender: value.gender === 'male' || value.gender === 'female' || value.gender === 'other' ? value.gender : seed?.gender,
    address: typeof value.address === 'string' ? value.address : seed?.address,
    cccd: typeof value.cccd === 'string' ? value.cccd : seed?.cccd,
    emergency_contact: typeof value.emergency_contact === 'string' ? value.emergency_contact : seed?.emergency_contact,
    candidate_notes: typeof value.candidate_notes === 'string' ? value.candidate_notes : seed?.candidate_notes,
    department_name: typeof value.department_name === 'string' ? value.department_name : seed?.department_name,
    employee_type: value.employee_type === 'full_time' || value.employee_type === 'part_time' || value.employee_type === 'intern' || value.employee_type === 'seasonal'
      ? value.employee_type
      : seed?.employee_type,
    job_level: typeof value.job_level === 'string' ? value.job_level : seed?.job_level,
    official_salary: typeof value.official_salary === 'number' ? value.official_salary : seed?.official_salary,
    kpi_salary: typeof value.kpi_salary === 'number' ? value.kpi_salary : seed?.kpi_salary,
    is_probationary: typeof value.is_probationary === 'boolean' ? value.is_probationary : seed?.is_probationary,
    probation_policy: value.probation_policy === 'time_based' || value.probation_policy === 'milestone_based'
      ? value.probation_policy
      : seed?.probation_policy,
    probation_end_date: typeof value.probation_end_date === 'string' ? value.probation_end_date : seed?.probation_end_date,
    probation_salary_mode: value.probation_salary_mode === 'percent_of_official' || value.probation_salary_mode === 'fixed_amount'
      ? value.probation_salary_mode
      : seed?.probation_salary_mode,
    probation_salary_value: typeof value.probation_salary_value === 'number' ? value.probation_salary_value : seed?.probation_salary_value,
    auto_complete_probation: typeof value.auto_complete_probation === 'boolean' ? value.auto_complete_probation : seed?.auto_complete_probation,
  }

  return normalizeEmployeeProfile(employee)
}

function normalizeEmployeeProfile(user: AuthUser): AuthUser {
  const official_salary = user.official_salary ?? getOfficialSalary(user.position_id)
  const probation_salary_mode = user.probation_salary_mode ?? 'percent_of_official'
  const probation_salary_value = user.probation_salary_value ?? getProbationSalaryValue(official_salary, probation_salary_mode)
  const department_name = user.department_name ?? getDepartmentName(user.position_id, user.role)
  const employee_type = user.employee_type ?? getEmploymentType(user.role)
  const job_level = user.job_level ?? user.kpi_level ?? getJobLevel(user.position_id, user.role)

  return {
    ...user,
    department_name,
    employee_type,
    job_level,
    official_salary,
    kpi_salary: user.kpi_salary ?? 0,
    is_probationary: user.is_probationary ?? user.status === 'probation',
    probation_policy: user.probation_policy ?? 'time_based',
    probation_end_date: user.probation_end_date ?? (user.status === 'probation' ? addDays(user.hire_date, DEFAULT_PROBATION_DAYS) : undefined),
    probation_salary_mode,
    probation_salary_value,
    auto_complete_probation: user.auto_complete_probation ?? false,
  }
}

function syncSeedAccessFields(storedUser: AuthUser, seedUser: AuthUser): AuthUser {
  // Demo accounts drive auth and role visibility, so old localStorage data
  // must not keep stale role/store values for seeded employees.
  return normalizeEmployeeProfile({
    ...seedUser,
    ...storedUser,
    id: seedUser.id,
    email: seedUser.email,
    role: seedUser.role,
    store_id: seedUser.store_id,
    position_id: seedUser.position_id,
    employee_code: seedUser.employee_code,
  })
}

// Du lieu moi (Seed Data)
const INITIAL_EMPLOYEES: AuthUser[] = [
  {
    id: 'emp-001',
    full_name: 'Nguyễn Minh Tuấn',
    email: 'tuan@bobahouse.vn',
    role: 'ceo',
    store_id: 'store-001',
    position_id: 'pos-005',
    phone: '0901234567',
    employee_code: 'BH-001',
    status: 'active',
    account_status: 'dang_hoat_dong',
    total_points: 5200,
    gamification_level: 'platinum',
    hire_date: '2023-01-01',
    kpi_level: 'L5',
  },
  {
    id: 'emp-016',
    full_name: 'Hoàng Thị Yến',
    email: 'yen@bobahouse.vn',
    role: 'hr_admin',
    store_id: 'store-001',
    position_id: 'pos-005',
    phone: '0956677889',
    employee_code: 'BH-016',
    status: 'active',
    account_status: 'dang_hoat_dong',
    total_points: 4100,
    gamification_level: 'platinum',
    hire_date: '2023-02-01',
    kpi_level: 'L4',
  },
  {
    id: 'emp-002',
    full_name: 'Trần Thị Lan',
    email: 'lan@bobahouse.vn',
    role: 'store_manager',
    store_id: 'store-001',
    position_id: 'pos-005',
    phone: '0912345678',
    employee_code: 'BH-002',
    status: 'active',
    account_status: 'dang_hoat_dong',
    total_points: 3800,
    gamification_level: 'gold',
    hire_date: '2023-03-15',
    kpi_level: 'L4',
  },
  {
    id: 'emp-003',
    full_name: 'Lê Hoàng Nam',
    email: 'nam@bobahouse.vn',
    role: 'store_manager',
    store_id: 'store-002',
    position_id: 'pos-005',
    phone: '0923456789',
    employee_code: 'BH-003',
    status: 'active',
    account_status: 'dang_hoat_dong',
    total_points: 2900,
    gamification_level: 'gold',
    hire_date: '2023-06-01',
    kpi_level: 'L4',
  },
  {
    id: 'emp-004',
    full_name: 'Phạm Thị Hương',
    email: 'huong@bobahouse.vn',
    role: 'shift_leader',
    store_id: 'store-003',
    position_id: 'pos-004',
    phone: '0934567890',
    employee_code: 'BH-004',
    status: 'active',
    account_status: 'dang_hoat_dong',
    total_points: 2100,
    gamification_level: 'silver',
    hire_date: '2024-01-10',
    kpi_level: 'L3',
  },
  {
    id: 'emp-005',
    full_name: 'Võ Thanh Bình',
    email: 'binh@bobahouse.vn',
    role: 'employee',
    store_id: 'store-001',
    position_id: 'pos-001',
    phone: '0945678901',
    employee_code: 'BH-005',
    status: 'active',
    account_status: 'dang_hoat_dong',
    total_points: 1500,
    gamification_level: 'silver',
    hire_date: '2024-06-01',
    kpi_level: 'L1',
  },
  {
    id: 'emp-006',
    full_name: 'Nguyễn Thị Mai',
    email: 'mai@bobahouse.vn',
    role: 'employee',
    store_id: 'store-001',
    position_id: 'pos-002',
    phone: '0956789012',
    employee_code: 'BH-006',
    status: 'active',
    account_status: 'dang_hoat_dong',
    total_points: 980,
    gamification_level: 'bronze',
    hire_date: '2024-07-15',
    kpi_level: 'L0',
  },
  {
    id: 'emp-007',
    full_name: 'Đặng Minh Khoa',
    email: 'khoa@bobahouse.vn',
    role: 'employee',
    store_id: 'store-001',
    position_id: 'pos-003',
    phone: '0967890123',
    employee_code: 'BH-007',
    status: 'probation',
    account_status: 'dang_hoat_dong',
    total_points: 320,
    gamification_level: 'bronze',
    hire_date: '2025-12-01',
    kpi_level: 'L0',
  },
  {
    id: 'emp-008',
    full_name: 'Huỳnh Thị Ngọc',
    email: 'ngoc@bobahouse.vn',
    role: 'employee',
    store_id: 'store-002',
    position_id: 'pos-001',
    phone: '0978901234',
    employee_code: 'BH-008',
    status: 'active',
    account_status: 'dang_hoat_dong',
    total_points: 2200,
    gamification_level: 'silver',
    hire_date: '2024-04-01',
    kpi_level: 'L2',
  },
  {
    id: 'emp-009',
    full_name: 'Trần Văn Đức',
    email: 'duc@bobahouse.vn',
    role: 'employee',
    store_id: 'store-002',
    position_id: 'pos-001',
    phone: '0989012345',
    employee_code: 'BH-009',
    status: 'active',
    account_status: 'dang_hoat_dong',
    total_points: 870,
    gamification_level: 'bronze',
    hire_date: '2024-08-01',
    kpi_level: 'L2',
  },
  {
    id: 'emp-010',
    full_name: 'Lý Thị Thanh',
    email: 'thanh@bobahouse.vn',
    role: 'employee',
    store_id: 'store-002',
    position_id: 'pos-002',
    phone: '0990123456',
    employee_code: 'BH-010',
    status: 'active',
    account_status: 'dang_hoat_dong',
    total_points: 650,
    gamification_level: 'bronze',
    hire_date: '2024-09-15',
    kpi_level: 'L1',
  },
  {
    id: 'emp-011',
    full_name: 'Ngô Quang Hải',
    email: 'hai@bobahouse.vn',
    role: 'employee',
    store_id: 'store-002',
    position_id: 'pos-003',
    phone: '0901122334',
    employee_code: 'BH-011',
    status: 'active',
    account_status: 'dang_hoat_dong',
    total_points: 410,
    gamification_level: 'bronze',
    hire_date: '2025-01-10',
    kpi_level: 'L1',
  },
  {
    id: 'emp-012',
    full_name: 'Mai Thị Hồng',
    email: 'hong@bobahouse.vn',
    role: 'employee',
    store_id: 'store-003',
    position_id: 'pos-001',
    phone: '0912233445',
    employee_code: 'BH-012',
    status: 'active',
    account_status: 'dang_hoat_dong',
    total_points: 1800,
    gamification_level: 'silver',
    hire_date: '2024-05-20',
    kpi_level: 'L1',
  },
  {
    id: 'emp-013',
    full_name: 'Bùi Văn Phong',
    email: 'phong@bobahouse.vn',
    role: 'employee',
    store_id: 'store-003',
    position_id: 'pos-002',
    phone: '0923344556',
    employee_code: 'BH-013',
    status: 'active',
    account_status: 'dang_hoat_dong',
    total_points: 520,
    gamification_level: 'bronze',
    hire_date: '2024-10-01',
    kpi_level: 'L1',
  },
  {
    id: 'emp-014',
    full_name: 'Dương Thị Linh',
    email: 'linh@bobahouse.vn',
    role: 'employee',
    store_id: 'store-003',
    position_id: 'pos-003',
    phone: '0934455667',
    employee_code: 'BH-014',
    status: 'active',
    account_status: 'dang_hoat_dong',
    total_points: 180,
    gamification_level: 'bronze',
    hire_date: '2025-02-01',
    kpi_level: 'L1',
  },
  {
    id: 'emp-015',
    full_name: 'Phan Quốc Anh',
    email: 'anh@bobahouse.vn',
    role: 'employee',
    store_id: 'store-003',
    position_id: 'pos-001',
    phone: '0945566778',
    employee_code: 'BH-015',
    status: 'active',
    account_status: 'dang_hoat_dong',
    total_points: 2600,
    gamification_level: 'gold',
    hire_date: '2024-03-10',
    kpi_level: 'L1',
  },
  {
    id: 'emp-017',
    full_name: 'Tran Minh Thuy',
    email: 'thuy@bobahouse.vn',
    role: 'employee',
    store_id: 'store-001',
    position_id: 'pos-002',
    phone: '0905566778',
    employee_code: 'BH-017',
    status: 'probation',
    account_status: 'dang_hoat_dong',
    total_points: 120,
    gamification_level: 'bronze',
    hire_date: DEMO_ONBOARDING_PREP_HIRE_DATE,
    kpi_level: 'L0',
  },
  {
    id: 'emp-018',
    full_name: 'Le Phuong Nam',
    email: 'nam.p@bobahouse.vn',
    role: 'employee',
    store_id: 'store-001',
    position_id: 'pos-001',
    phone: '0906677889',
    employee_code: 'BH-018',
    status: 'probation',
    account_status: 'dang_hoat_dong',
    total_points: 260,
    gamification_level: 'bronze',
    hire_date: DEMO_ONBOARDING_DAY_FIVE_HIRE_DATE,
    kpi_level: 'L0',
  },]

export class EmployeeService {
  private static readonly INVITATION_EMAIL_TEMPLATE_VERSION = 'v1'
  private static readonly SENDABLE_INVITATION_STATUSES: InvitationStatus[] = ['draft']
  private static readonly RESENDABLE_INVITATION_STATUSES: InvitationStatus[] = ['sent', 'needs_revision']
  private static readonly PUBLIC_CANDIDATE_STATUSES: InvitationStatus[] = ['sent', 'needs_revision']

  private static generatePublicAccessToken() {
    const cryptoToken = globalThis.crypto?.randomUUID?.()
    const fallbackToken = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
    return `inv_${(cryptoToken || fallbackToken).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)}`
  }

  private static normalizeInvitation(invitation: EmployeeInvitation): EmployeeInvitation {
    const hr_notes = invitation.hr_notes ?? (invitation.status === 'needs_revision' ? undefined : invitation.notes)
    const revision_request_note = invitation.revision_request_note ?? (invitation.status === 'needs_revision' ? invitation.notes : undefined)
    const public_access_token = invitation.public_access_token || this.generatePublicAccessToken()
    const email_preview_snapshot = invitation.email_preview_snapshot && invitation.public_access_token
      ? invitation.email_preview_snapshot
      : this.buildInvitationEmailPreview({ ...invitation, public_access_token })
    const official_salary = invitation.official_salary ?? getOfficialSalary(invitation.position_id)
    const probation_salary_mode = invitation.probation_salary_mode ?? 'percent_of_official'
    const send_logs = invitation.send_logs ?? (
      invitation.last_sent_at
        ? [{
            id: `send-log-${invitation.id}-1`,
            status: (invitation.send_status === 'sent_failed' ? 'sent_failed' : 'sent_success') as InvitationSendLog['status'],
            attempted_at: invitation.last_sent_at,
            attempted_by: invitation.last_sent_by,
            error: invitation.last_send_error,
            snapshot: email_preview_snapshot,
          }]
        : []
    )

    return {
      ...invitation,
      hr_notes,
      revision_request_note,
      hire_date: invitation.hire_date ?? new Date().toISOString().split('T')[0],
      department_name: invitation.department_name ?? getDepartmentName(invitation.position_id, invitation.role as AuthUser['role']),
      employee_type: invitation.employee_type ?? getEmploymentType(invitation.role as AuthUser['role']),
      job_level: invitation.job_level ?? getJobLevel(invitation.position_id, invitation.role as AuthUser['role']),
      official_salary,
      kpi_salary: invitation.kpi_salary ?? 0,
      is_probationary: invitation.is_probationary ?? false,
      probation_policy: invitation.probation_policy ?? 'time_based',
      probation_end_date: invitation.probation_end_date,
      probation_salary_mode,
      probation_salary_value: invitation.probation_salary_value ?? getProbationSalaryValue(official_salary, probation_salary_mode),
      auto_complete_probation: invitation.auto_complete_probation ?? false,
      public_access_token,
      send_status: invitation.send_status ?? 'not_sent',
      send_attempt_count: invitation.send_attempt_count ?? (invitation.last_sent_at ? 1 : 0),
      email_preview_snapshot,
      send_logs,
    }
  }

  private static buildSendLog(input: {
    invitationId: string
    status: InvitationSendLog['status']
    attemptedAt: string
    attemptedBy?: string
    error?: string
    snapshot: string
  }): InvitationSendLog {
    return {
      id: `send-log-${input.invitationId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: input.status,
      attempted_at: input.attemptedAt,
      attempted_by: input.attemptedBy,
      error: input.error,
      snapshot: input.snapshot,
    }
  }

  private static appendSendLog(invitation: EmployeeInvitation, log: InvitationSendLog): InvitationSendLog[] {
    return [log, ...(invitation.send_logs || [])]
  }

  private static getEmployeeActivityLogsDb(): EmployeeActivityLog[] {
    if (typeof window === 'undefined') return []

    const stored = localStorage.getItem(EMPLOYEE_ACTIVITY_LOGS_KEY)
    if (!stored) return []

    try {
      const parsed = JSON.parse(stored) as EmployeeActivityLog[]
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.warn(`[EmployeeService] Failed to parse ${EMPLOYEE_ACTIVITY_LOGS_KEY}. Falling back to empty activity logs.`, error)
      return []
    }
  }

  private static saveEmployeeActivityLogsDb(data: EmployeeActivityLog[]) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(EMPLOYEE_ACTIVITY_LOGS_KEY, JSON.stringify(data))
    }
  }

  private static appendEmployeeActivityLog(input: Omit<EmployeeActivityLog, 'id' | 'created_at'>) {
    if (typeof window === 'undefined') return

    const db = this.getEmployeeActivityLogsDb()
    db.unshift({
      id: `emp-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
      ...input,
    })
    this.saveEmployeeActivityLogsDb(db.slice(0, 200))
  }

  static getEmployeeActivityLogs(employeeId: string): EmployeeActivityLog[] {
    return this.getEmployeeActivityLogsDb()
      .filter(log => log.employee_id === employeeId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }

  private static resolveEmployeeName(employeeId?: string, fallback?: string): string | undefined {
    if (!employeeId) return fallback
    const employee = this.getDb().find(item => item.id === employeeId)
    return employee?.full_name || fallback
  }

  private static buildDefaultOffboardingChecklist(employee: AuthUser): OffboardingChecklist {
    return {
      id: `off-${employee.id}`,
      employee_id: employee.id,
      employee_name: employee.full_name,
      employee_code: employee.employee_code,
      store_id: employee.store_id,
      position_id: employee.position_id,
      position: mockPositions.find(position => position.id === employee.position_id)?.name || employee.position_id,
      last_day: new Date().toISOString().split('T')[0],
      initiated_by: employee.id,
      initiated_at: new Date().toISOString().split('T')[0],
      status: employee.status === 'resigned' ? 'completed' : 'in_progress',
      owner_name: 'HR',
      owner_team: 'HR',
      risk_level: 'low',
      handover_summary: {
        coverage_percent: 0,
        pending_count: 0,
        blocked_count: 0,
        notes: 'Chua co du lieu ban giao chi tiet.',
        items: [],
      },
      handover_items: [],
      access_items: [],
      finance_items: [],
      schedule_items: [],
      steps: [],
    }
  }

  static getOffboardingByEmployeeId(employeeId: string, currentUser?: AuthUser) {
    const employee = this.getEmployeeById(employeeId, currentUser)
    if (!employee) return undefined

    const source = mockOffboardingChecklists.find(item => item.employee_id === employeeId)
      || this.buildDefaultOffboardingChecklist(employee)

    const steps = source.steps.map(step => ({
      ...step,
      owner_name: this.resolveEmployeeName(step.owner_id, step.owner_name),
      done_by: step.done_by,
    }))

    const totalSteps = steps.length
    const completedSteps = steps.filter(step => step.is_done).length
    const pendingSteps = totalSteps - completedSteps
    const requiredOpenSteps = steps.filter(step => (step.required ?? step.priority === 'required') && !step.is_done).length
    const overdueSteps = steps.filter(step => !step.is_done && Boolean(step.due_date) && step.due_date! < new Date().toISOString().split('T')[0]).length
    const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

    const handoverPending = source.handover_items?.filter(item => item.status !== 'done').length || 0
    const accessPending = source.access_items?.filter(item => item.status !== 'done').length || 0
    const financePending = source.finance_items?.filter(item => item.status !== 'done').length || 0
    const schedulePending = source.schedule_items?.filter(item => item.status !== 'done').length || 0
    const riskFlags = source.risk_flags || []
    const nextDueDate = steps
      .filter(step => !step.is_done && step.due_date)
      .map(step => step.due_date as string)
      .sort()[0]

    return {
      ...source,
      employee_id: employee.id,
      employee_name: employee.full_name,
      employee_code: employee.employee_code,
      store_id: employee.store_id,
      position_id: employee.position_id,
      position: mockPositions.find(position => position.id === employee.position_id)?.name || source.position,
      owner_name: this.resolveEmployeeName(source.initiated_by, source.owner_name),
      steps,
      handover_summary: source.handover_summary ?? {
        coverage_percent: progressPercent,
        pending_count: handoverPending,
        blocked_count: 0,
        notes: undefined,
        items: [],
      },
      progress_percent: progressPercent,
      completed_steps: completedSteps,
      total_steps: totalSteps,
      pending_steps: pendingSteps,
      required_open_steps: requiredOpenSteps,
      overdue_steps: overdueSteps,
      summary: {
        handover_pending: handoverPending,
        access_pending: accessPending,
        finance_pending: financePending,
        schedule_pending: schedulePending,
        risk_flag_count: riskFlags.length,
        open_risk_levels: Array.from(new Set(steps.filter(step => !step.is_done && step.risk_level).map(step => step.risk_level))),
        next_due_date: nextDueDate,
      },
    }
  }

  private static mergeSeedEmployees(data: AuthUser[]): AuthUser[] {
    const merged = data
      .map((user, index) => sanitizeEmployeeRecord(user, index))
      .filter((user): user is AuthUser => Boolean(user))

    INITIAL_EMPLOYEES.forEach(seedUser => {
      const existingIndex = merged.findIndex(
        user => user.id === seedUser.id || user.email.toLowerCase() === seedUser.email.toLowerCase()
      )

      if (existingIndex === -1) {
        merged.push(seedUser)
        return
      }

      merged[existingIndex] = {
        ...seedUser,
        ...merged[existingIndex],
      }

      merged[existingIndex] = syncSeedAccessFields(merged[existingIndex], seedUser)
    })

    return merged.map(user => normalizeEmployeeProfile(user))
  }

  private static getDb(): AuthUser[] {
    if (typeof window === 'undefined') return INITIAL_EMPLOYEES
    
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      const seeded = INITIAL_EMPLOYEES.map(user => normalizeEmployeeProfile(user))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
      return seeded
    }
    
    try {
      const parsed = JSON.parse(stored) as unknown
      if (!Array.isArray(parsed)) {
        throw new Error('Invalid employees payload')
      }
      const normalized = this.mergeSeedEmployees(parsed)
      if (JSON.stringify(normalized) !== stored) {
        this.saveDb(normalized)
      }
      return normalized
    } catch (error) {
      console.warn(`[EmployeeService] Failed to parse ${STORAGE_KEY}. Re-seeding employee data from defaults.`, error)
      const seeded = INITIAL_EMPLOYEES.map(user => normalizeEmployeeProfile(user))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
      return seeded
    }
  }

  private static saveDb(data: AuthUser[]) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  }

  // Lấy User dùng cho đăng nhập
  static getUserByEmail(email: string): AuthUser | undefined {
    const db = this.getDb()
    return db.find(e => e.email.toLowerCase() === email.toLowerCase())
  }

  static resolveSessionUser(user?: Pick<AuthUser, 'id' | 'email'> | null): AuthUser | undefined {
    if (!user) return undefined

    const byId = typeof user.id === 'string' && user.id.trim()
      ? this.getEmployeeById(user.id)
      : undefined

    if (byId) return byId

    return typeof user.email === 'string' && user.email.trim()
      ? this.getUserByEmail(user.email)
      : undefined
  }

  // Danh sách theo Policy Role
  static getEmployees(currentUser: AuthUser): AuthUser[] {
    const db = this.getDb()
    const viewer = db.find(employee => employee.id === currentUser.id)
      || db.find(employee => employee.email.toLowerCase() === currentUser.email.toLowerCase())
      || currentUser
    
    // CEO, HR Admin: Thấy toàn công ty
    if (COMPANY_EMPLOYEE_VIEW_ROLES.includes(viewer.role)) {
      return db
    }
    
    // Store Manager, Shift Leader: Chỉ thấy nhân viên store mình
    if (STORE_EMPLOYEE_VIEW_ROLES.includes(viewer.role)) {
      const storeEmployees = db.filter(e => e.store_id === viewer.store_id)
      if (storeEmployees.length > 0) return storeEmployees

      const seedViewer = INITIAL_EMPLOYEES.find(employee =>
        employee.id === viewer.id || employee.email.toLowerCase() === viewer.email.toLowerCase()
      )
      return seedViewer ? db.filter(e => e.store_id === seedViewer.store_id) : []
    }
    
    // Employee: Không xem danh sách công ty (hoặc chỉ mình mình)
    return db.filter(e => e.id === viewer.id || e.email.toLowerCase() === viewer.email.toLowerCase())
  }

  static getEmployeeById(id: string, currentUser?: AuthUser): AuthUser | undefined {
    const db = this.getDb()
    const employee = db.find(e => e.id === id)

    if (!employee) return undefined
    if (!currentUser) return employee
    const viewer = db.find(user => user.id === currentUser.id)
      || db.find(user => user.email.toLowerCase() === currentUser.email.toLowerCase())
      || currentUser

    if (COMPANY_EMPLOYEE_VIEW_ROLES.includes(viewer.role)) {
      return employee
    }

    if (STORE_EMPLOYEE_VIEW_ROLES.includes(viewer.role)) {
      return employee.store_id === viewer.store_id ? employee : undefined
    }

    if (viewer.role === 'employee') {
      return employee.id === viewer.id || employee.email.toLowerCase() === viewer.email.toLowerCase()
        ? employee
        : undefined
    }

    return undefined
  }

  static createEmployee(data: Partial<AuthUser>, currentUser?: AuthUser, source: 'manual' | 'import' | 'invitation' = 'manual'): AuthUser {
    const db = this.getDb()
    
    // Generate new ID & Employee Code
    const nextNum = db.length + 1
    const newId = `emp-${nextNum.toString().padStart(3, '0')}`
    const newCode = `BH-${nextNum.toString().padStart(3, '0')}`

    const newEmp: AuthUser = {
      id: newId,
      employee_code: newCode,
      full_name: data.full_name || '',
      email: data.email || '',
      role: data.role || 'employee',
      store_id: data.store_id || 'store-001',
      position_id: data.position_id || 'pos-001',
      phone: data.phone || '',
      // status = work_status (tinh trang lam viec)
      status: data.status || 'active',
      // account_status = trang thai tai khoan (mac dinh chua kich hoat)
      account_status: data.account_status || 'chua_kich_hoat',
      total_points: 0,
      gamification_level: 'bronze',
      hire_date: data.hire_date || new Date().toISOString().split('T')[0],
      ...data
    } as AuthUser

    const normalizedEmployee = normalizeEmployeeProfile(newEmp)

    db.push(normalizedEmployee)
    this.saveDb(db)

    const sourceLabel = source === 'invitation'
      ? 'Duyet tu loi moi'
      : source === 'import'
        ? 'Import tu file'
        : 'Tao truc tiep'

    this.appendEmployeeActivityLog({
      employee_id: normalizedEmployee.id,
      action: source === 'import' ? 'imported' : source === 'invitation' ? 'approved_from_invitation' : 'created',
      title: 'Tao ho so nhan su',
      detail: `${sourceLabel} - ${normalizedEmployee.employee_code || normalizedEmployee.id}`,
      actor_id: currentUser?.id,
      actor_name: currentUser?.full_name,
    })
    
    return normalizedEmployee
  }

  static getNextEmployeeDraft() {
    const db = this.getDb()
    const nextNum = db.length + 1

    return {
      id: `emp-${nextNum.toString().padStart(3, '0')}`,
      employee_code: `BH-${nextNum.toString().padStart(3, '0')}`,
    }
  }

  static updateEmployee(id: string, updates: Partial<AuthUser>, currentUser?: AuthUser, reason?: string): AuthUser | null {
    const db = this.getDb()
    const index = db.findIndex(e => e.id === id)
    
    if (index === -1) return null

    const before = db[index]
    const updated = normalizeEmployeeProfile({ ...before, ...updates })
    const changedKeys = Object.keys(updates).filter(key => {
      const typedKey = key as keyof AuthUser
      return before[typedKey] !== updated[typedKey]
    })

    db[index] = updated
    this.saveDb(db)

    if (changedKeys.length > 0) {
      const isOffboardingCompletion = updated.status === 'resigned'
        && updated.account_status === 'bi_khoa'
        && (
          reason?.toLowerCase().includes('offboarding')
          || (Boolean(updates.status) && Boolean(updates.account_status))
        )
      const action = isOffboardingCompletion
        ? 'offboarding_completed'
        : updates.account_status
          ? 'account_changed'
          : updates.status
            ? 'status_changed'
            : 'updated'
      const title = reason || (action === 'offboarding_completed'
        ? 'Hoan tat offboarding'
        : action === 'account_changed'
        ? 'Cap nhat tai khoan'
        : action === 'status_changed'
          ? 'Cap nhat trang thai lam viec'
          : 'Cap nhat ho so')
      const detail = changedKeys
        .map(key => {
          const typedKey = key as keyof AuthUser
          return `${key}: ${String(before[typedKey] ?? '-')} -> ${String(updated[typedKey] ?? '-')}`
        })
        .join(' | ')

      this.appendEmployeeActivityLog({
        employee_id: id,
        action,
        title,
        detail,
        actor_id: currentUser?.id,
        actor_name: currentUser?.full_name,
      })
    }
    
    return updated
  }

  static ensureBirthdayNotifications(employeeId: string, currentUser?: AuthUser) {
    if (!settingsSystem.employee_settings.auto_birthday_wish) return

    const employee = this.getEmployeeById(employeeId, currentUser)
    if (!employee?.date_of_birth) return

    const birthdayInfo = getNextBirthdayInfo(employee.date_of_birth)
    if (!birthdayInfo) return

    const milestone = birthdayInfo.daysUntil === 0
      ? 0
      : birthdayInfo.daysUntil === 1
        ? 1
        : birthdayInfo.daysUntil === 7
          ? 7
          : null

    if (milestone === null) return

    const recipients = this.getDb().filter(candidate => {
      if (['ceo', 'hr_admin'].includes(candidate.role)) return true
      return candidate.role === 'store_manager' && candidate.store_id === employee.store_id
    })

    if (recipients.length === 0) return

    const title = milestone === 0
      ? `Hôm nay là sinh nhật ${employee.full_name}`
      : milestone === 1
        ? `Mai là sinh nhật ${employee.full_name}`
        : `Sắp đến sinh nhật ${employee.full_name}`
    const message = milestone === 0
      ? `${employee.full_name} có sinh nhật hôm nay. Có thể gửi lời chúc nội bộ ngay trong ca làm việc.`
      : milestone === 1
        ? `${employee.full_name} sẽ sinh nhật vào ngày mai. HR có thể chuẩn bị lời chúc hoặc nhắc cửa hàng.`
        : `${employee.full_name} còn 7 ngày nữa sẽ đến sinh nhật. Đây là lúc phù hợp để chuẩn bị thông báo nội bộ.`

    recipients.forEach((recipient) => {
      createNotificationDeduped(
        recipient.id,
        'system',
        title,
        message,
        {
          action_url: `/employees/${employee.id}`,
          birthday_employee_id: employee.id,
          birthday_milestone: String(milestone),
          birthday_date: birthdayInfo.nextBirthdayDate,
        },
        370 * 24 * 60 * 60 * 1000,
      )
    })
  }

  static getAllowedRoleOptions(currentUser?: AuthUser): AuthUser['role'][] {
    if (!currentUser) return ['employee']
    if (currentUser.role === 'ceo') {
      return ['employee', 'shift_leader', 'store_manager', 'hr_admin', 'ceo']
    }
    if (currentUser.role === 'hr_admin') {
      return ['employee', 'shift_leader', 'store_manager']
    }
    return ['employee']
  }

  // Kiểm tra SĐT đã tồn tại (loại trừ employee hiện tại khi update)
  static isPhoneDuplicate(phone: string, excludeId?: string): boolean {
    const db = this.getDb()
    return db.some(e => 
      e.phone === phone && 
      (!excludeId || e.id !== excludeId)
    )
  }

  // Kiểm tra email đã tồn tại (loại trừ employee hiện tại khi update)
  static isEmailDuplicate(email: string, excludeId?: string): boolean {
    if (!email) return false
    const db = this.getDb()
    return db.some(e => 
      e.email.toLowerCase() === email.toLowerCase() && 
      (!excludeId || e.id !== excludeId)
    )
  }

  // ============ INVITATION METHODS ============
  
  private static getInvitationsDb(): EmployeeInvitation[] {
    if (typeof window === 'undefined') return []
    
    const existingStored = localStorage.getItem(INVITATIONS_KEY)
    const stored = existingStored ?? JSON.stringify(INITIAL_INVITATIONS.map(invitation => this.normalizeInvitation(invitation)))
    if (!existingStored) {
      localStorage.setItem(INVITATIONS_KEY, stored)
    }
    if (!stored) {
      // Use mock seed data
      const seed = [
        {
          id: 'inv-001',
          full_name: 'Lê Thị Hoa',
          email: 'hoa.le@email.com',
          phone: '0909888777',
          store_id: 'store-001',
          position_id: 'pos-001',
          role: 'employee',
          invited_by: 'emp-016',
          invited_at: '2026-02-20T10:00:00Z',
          status: 'sent' as const,
          send_status: 'sent_success' as const,
          send_attempt_count: 1,
          last_sent_at: '2026-02-20T10:00:00Z',
          last_sent_by: 'emp-016',
          notes: 'Ung vien gioi, co kinh nghiem pha che',
        },
        {
          id: 'inv-002',
          full_name: 'Nguyễn Văn An',
          email: 'an.nguyen@email.com',
          phone: '0911222333',
          store_id: 'store-002',
          position_id: 'pos-002',
          role: 'employee',
          invited_by: 'emp-016',
          invited_at: '2026-02-18T14:30:00Z',
          status: 'pending_approval' as const,
          send_status: 'sent_success' as const,
          send_attempt_count: 1,
          last_sent_at: '2026-02-18T14:30:00Z',
          last_sent_by: 'emp-016',
          notes: 'Da dien thong tin, cho HR xac nhan',
        },
        {
          id: 'inv-003',
          full_name: 'Trần Minh Đức',
          email: 'duc.tran@email.com',
          phone: '0922333444',
          store_id: 'store-001',
          position_id: 'pos-003',
          role: 'shift_leader',
          invited_by: 'emp-002',
          invited_at: '2026-02-10T09:00:00Z',
          status: 'approved' as const,
          send_status: 'sent_success' as const,
          send_attempt_count: 1,
          last_sent_at: '2026-02-10T09:00:00Z',
          last_sent_by: 'emp-002',
          confirmed_employee_id: 'emp-007',
        },
      ]
      localStorage.setItem(INVITATIONS_KEY, JSON.stringify(seed))
      return seed
    }
    
    try {
      const parsed = JSON.parse(stored) as EmployeeInvitation[]
      const normalized = parsed.map(invitation => this.normalizeInvitation(invitation))

      if (JSON.stringify(normalized) !== stored) {
        this.saveInvitationsDb(normalized)
      }

      return normalized
    } catch (error) {
      console.warn(`[EmployeeService] Failed to parse ${INVITATIONS_KEY}. Falling back to empty invitations.`, error)
      return []
    }
  }
 
  private static saveInvitationsDb(data: EmployeeInvitation[]) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(INVITATIONS_KEY, JSON.stringify(data))
    }
  }
 
  // Lấy danh sách invitations (theo role - HR/Admin thay tat ca, manager chi store minh)
  static getInvitations(currentUser?: AuthUser): EmployeeInvitation[] {
    const db = this.getInvitationsDb()
    
    if (!currentUser || ['ceo', 'hr_admin'].includes(currentUser.role)) {
      return db
    }
    
    // Manager/Shift leader: chi thay invitation cua store mình
    if (['store_manager', 'shift_leader'].includes(currentUser.role)) {
      return db.filter(inv => inv.store_id === currentUser.store_id)
    }
    
    // Employee: không thấy invitations
    return []
  }
 
  // Lấy 1 invitation theo ID
  static getInvitationById(id: string, currentUser?: AuthUser): EmployeeInvitation | undefined {
    const invitation = this.getInvitationsDb().find(inv => inv.id === id)

    if (!invitation) return undefined
    if (!currentUser) return invitation

    if (['ceo', 'hr_admin'].includes(currentUser.role)) {
      return invitation
    }

    if (['store_manager', 'shift_leader'].includes(currentUser.role)) {
      return invitation.store_id === currentUser.store_id ? invitation : undefined
    }

    return undefined
  }

  // Route candidate form la public/mock, chi expose cac invitation con hieu luc cho candidate tu dien
  static getPublicInvitationsForCandidate(): EmployeeInvitation[] {
    const db = this.getInvitationsDb()
    return db.filter(inv => this.canCandidateSubmitInvitation(inv).ok)
  }

  static getPublicInvitationById(id: string): EmployeeInvitation | undefined {
    return this.getPublicInvitationsForCandidate().find(inv => inv.id === id)
  }

  static getPublicInvitationByToken(tokenOrId: string): EmployeeInvitation | undefined {
    const ref = tokenOrId.trim()
    if (!ref) return undefined

    return this.getPublicInvitationsForCandidate().find(inv =>
      inv.public_access_token === ref || inv.id === ref
    )
  }
 
  // Tạo invitation mới
  static getInvitationPublicFormUrl(tokenOrId?: string) {
    const baseUrl = this.getPublicAppBaseUrl()
    const ref = tokenOrId?.trim()

    if (!ref) {
      return `${baseUrl}/employees/invitations/form`
    }

    return `${baseUrl}/employees/invitations/form?token=${encodeURIComponent(ref)}`
  }

  static createInvitation(data: InvitationFormData, invitedBy: string): EmployeeInvitation {
    const db = this.getInvitationsDb()
    
    const nextNum = db.length + 1
    const newId = `inv-${nextNum.toString().padStart(3, '0')}`
    
    const newInvitation: EmployeeInvitation = {
      id: newId,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      hire_date: data.hire_date || new Date().toISOString().split('T')[0],
      store_id: data.store_id,
      position_id: data.position_id,
      department_name: data.department_name,
      employee_type: data.employee_type,
      job_level: data.job_level,
      official_salary: data.official_salary,
      kpi_salary: data.kpi_salary,
      is_probationary: data.is_probationary,
      probation_policy: data.probation_policy,
      probation_end_date: data.probation_end_date,
      probation_salary_mode: data.probation_salary_mode,
      probation_salary_value: data.probation_salary_value,
      auto_complete_probation: data.auto_complete_probation,
      role: data.role,
      invited_by: invitedBy,
      invited_at: new Date().toISOString(),
      status: 'draft',
      hr_notes: data.notes,
      email_subject: data.email_subject,
      email_personal_note: data.email_personal_note,
      email_deadline: data.email_deadline,
      email_support_name: data.email_support_name,
      email_support_info: data.email_support_info,
      send_status: 'not_sent',
      send_attempt_count: 0,
      email_template_version: this.INVITATION_EMAIL_TEMPLATE_VERSION,
      email_preview_snapshot: '',
      public_access_token: this.generatePublicAccessToken(),
      send_logs: [],
    }
    const normalizedInvitation = this.normalizeInvitation(newInvitation)
    normalizedInvitation.email_preview_snapshot = this.buildInvitationEmailPreview(normalizedInvitation)
    db.push(normalizedInvitation)
    this.saveInvitationsDb(db)
    
    return normalizedInvitation
  }

  static buildInvitationEmailPreview(invitation: Pick<
    EmployeeInvitation,
    'id' | 'full_name' | 'email' | 'store_id' | 'position_id' | 'email_subject' | 'email_personal_note' | 'email_deadline' | 'email_support_name' | 'email_support_info' | 'hire_date' | 'department_name' | 'employee_type' | 'job_level' | 'official_salary' | 'kpi_salary' | 'is_probationary' | 'probation_end_date' | 'probation_salary_mode' | 'probation_salary_value' | 'public_access_token'
  >): string {
    const storeLabel = mockStores.find(store => store.id === invitation.store_id)?.name.replace('Homies Milk Tea - ', '') || invitation.store_id || '[Chưa chọn chi nhánh]'
    const positionLabel = mockPositions.find(position => position.id === invitation.position_id)?.name || invitation.position_id || '[Chưa chọn vị trí]'
    const formLink = this.getInvitationPublicFormUrl(invitation.public_access_token)

    return [
      `Tiêu đề: ${invitation.email_subject || '[Chưa nhập tiêu đề]'}`,
      '',
      `Kính gửi ${invitation.full_name || '[Tên ứng viên]'},`,
      '',
      invitation.email_personal_note || '[Chưa có lời nhắn cá nhân]',
      '',
      `Vị trí dự kiến: ${positionLabel}`,
      `Chi nhánh dự kiến: ${storeLabel}`,
      `Bộ phận: ${invitation.department_name || '[Chưa chọn bộ phận]'}`,
      `Ngày gia nhập dự kiến: ${invitation.hire_date || '[Chưa chọn ngày vào làm]'}`,
      `Loại nhân viên: ${invitation.employee_type || '[Chưa chọn]'} · ${invitation.job_level || '[Chưa chọn level]'}`,
      `Lương chính thức: ${(invitation.official_salary || 0).toLocaleString('vi-VN')} đ`,
      `Lương KPI: ${(invitation.kpi_salary || 0).toLocaleString('vi-VN')} đ`,
      `Thử việc: ${invitation.is_probationary ? `Có, đến ${invitation.probation_end_date || '[Chưa chọn]'} · ${(invitation.probation_salary_value || 0).toLocaleString('vi-VN')} đ (${invitation.probation_salary_mode === 'fixed_amount' ? 'mức cố định' : 'theo % lương chính thức'})` : 'Không áp dụng'}`,
      `Hạn hoàn tất hồ sơ: ${invitation.email_deadline || '[Chưa chọn hạn]'}`,
      `Link hoàn tất hồ sơ: ${formLink}`,
      '',
      'Sau khi hoàn tất thông tin, bộ phận nhân sự sẽ kiểm tra và xác nhận hồ sơ của bạn.',
      `Liên hệ hỗ trợ: ${invitation.email_support_name || '[Chưa nhập]'} - ${invitation.email_support_info || '[Chưa nhập]'}`,
      '',
      `Mã lời mời: ${invitation.id}`,
    ].join('\n')
  }

  private static getPublicAppBaseUrl() {
    const browserOrigin = typeof window !== 'undefined' ? window.location.origin : ''
    const envBaseUrl =
      typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL
        ? process.env.NEXT_PUBLIC_APP_URL
        : ''

    return (browserOrigin || envBaseUrl || DEFAULT_APP_BASE_URL).replace(/\/$/, '')
  }

  static validateInvitationDelivery(invitation: EmployeeInvitation, mode: 'send' | 'resend'): {
    ok: boolean
    reason?: string
  } {
    if (!invitation.full_name.trim()) {
      return { ok: false, reason: 'Thiếu họ và tên ứng viên' }
    }

    if (!invitation.email.trim()) {
      return { ok: false, reason: 'Thiếu email để gửi lời mời' }
    }

    if (!invitation.store_id) {
      return { ok: false, reason: 'Thiếu chi nhánh dự kiến' }
    }

    if (!invitation.position_id) {
      return { ok: false, reason: 'Thiếu vị trí dự kiến' }
    }

    if (!invitation.role) {
      return { ok: false, reason: 'Thiếu quyền hệ thống dự kiến' }
    }

    if (['approved', 'cancelled', 'rejected', 'expired'].includes(invitation.status)) {
      return { ok: false, reason: 'Lời mời này không còn được phép gửi email' }
    }

    if (mode === 'send' && !this.SENDABLE_INVITATION_STATUSES.includes(invitation.status)) {
      return { ok: false, reason: 'Chỉ lời mời ở trạng thái nháp mới được gửi lần đầu' }
    }

    if (mode === 'resend') {
      if (!['sent_success', 'sent_failed'].includes(invitation.send_status || '')) {
        return { ok: false, reason: 'Lời mời này chưa có lần gửi nào để gửi lại' }
      }

      if (!this.RESENDABLE_INVITATION_STATUSES.includes(invitation.status)) {
        return { ok: false, reason: 'Chỉ được gửi lại khi ứng viên chưa nộp xong hoặc đang cần bổ sung' }
      }
    }

    return { ok: true }
  }

  static canCandidateSubmitInvitation(invitation: EmployeeInvitation): {
    ok: boolean
    reason?: string
  } {
    if (!this.PUBLIC_CANDIDATE_STATUSES.includes(invitation.status)) {
      return { ok: false, reason: 'Lời mời này không còn cho phép ứng viên tự điền hồ sơ' }
    }

    if (invitation.send_status !== 'sent_success') {
      return { ok: false, reason: 'Lời mời chưa được gửi thành công nên chưa thể nộp hồ sơ' }
    }

    if (invitation.email_deadline) {
      const deadline = new Date(`${invitation.email_deadline}T23:59:59`)
      if (Number.isFinite(deadline.getTime()) && deadline.getTime() < Date.now()) {
        return { ok: false, reason: 'Lời mời này đã quá hạn hoàn tất hồ sơ' }
      }
    }

    return { ok: true }
  }

  static canSendInvitation(invitation: EmployeeInvitation): {
    ok: boolean
    reason?: string
  } {
    if (!invitation.full_name.trim()) {
      return { ok: false, reason: 'Thiếu họ và tên ứng viên' }
    }

    if (!invitation.email.trim()) {
      return { ok: false, reason: 'Thiếu email để gửi lời mời' }
    }

    if (!invitation.store_id) {
      return { ok: false, reason: 'Thiếu chi nhánh dự kiến' }
    }

    if (!invitation.position_id) {
      return { ok: false, reason: 'Thiếu vị trí dự kiến' }
    }

    if (!invitation.role) {
      return { ok: false, reason: 'Thiếu quyền hệ thống dự kiến' }
    }

    if (['approved', 'cancelled', 'rejected', 'expired'].includes(invitation.status)) {
      return { ok: false, reason: 'Lời mời này không còn được phép gửi email' }
    }

    return { ok: true }
  }

  static sendInvitation(invitationId: string, currentUser?: AuthUser): EmployeeInvitation | null {
    const db = this.getInvitationsDb()
    const index = db.findIndex(inv => inv.id === invitationId)

    if (index === -1) return null

    const invitation = db[index]
    const validation = this.validateInvitationDelivery(invitation, 'send')

    const attemptedAt = new Date().toISOString()
    const sendingInvitation: EmployeeInvitation = {
      ...invitation,
      send_status: 'sending',
      last_send_error: undefined,
    }
    db[index] = sendingInvitation
    this.saveInvitationsDb(db)

    if (!validation.ok) {
      const failedSnapshot = this.buildInvitationEmailPreview(sendingInvitation)
      const failedLog = this.buildSendLog({
        invitationId,
        status: 'sent_failed',
        attemptedAt,
        attemptedBy: currentUser?.id || invitation.invited_by,
        error: validation.reason,
        snapshot: failedSnapshot,
      })
      db[index] = {
        ...sendingInvitation,
        send_status: 'sent_failed',
        last_send_error: validation.reason,
        last_sent_at: attemptedAt,
        last_sent_by: currentUser?.id || invitation.invited_by,
        send_attempt_count: (invitation.send_attempt_count || 0) + 1,
        email_preview_snapshot: failedSnapshot,
        send_logs: this.appendSendLog(invitation, failedLog),
      }
      this.saveInvitationsDb(db)
      return null
    }

    const nextAttemptCount = (invitation.send_attempt_count || 0) + 1
    const email_preview_snapshot = this.buildInvitationEmailPreview(invitation)
    const successLog = this.buildSendLog({
      invitationId,
      status: 'sent_success',
      attemptedAt,
      attemptedBy: currentUser?.id || invitation.invited_by,
      snapshot: email_preview_snapshot,
    })

    const sentInvitation: EmployeeInvitation = {
      ...invitation,
      status: invitation.status === 'draft' ? 'sent' : invitation.status,
      send_status: 'sent_success',
      send_attempt_count: nextAttemptCount,
      last_sent_at: attemptedAt,
      last_sent_by: currentUser?.id || invitation.invited_by,
      last_send_error: undefined,
      email_template_version: this.INVITATION_EMAIL_TEMPLATE_VERSION,
      email_preview_snapshot,
      send_logs: this.appendSendLog(invitation, successLog),
    }

    db[index] = sentInvitation
    this.saveInvitationsDb(db)
    return sentInvitation
  }

  static resendInvitation(invitationId: string, currentUser?: AuthUser): EmployeeInvitation | null {
    const db = this.getInvitationsDb()
    const index = db.findIndex(inv => inv.id === invitationId)

    if (index === -1) return null

    const invitation = db[index]
    const validation = this.validateInvitationDelivery(invitation, 'resend')

    const attemptedAt = new Date().toISOString()
    const sendingInvitation: EmployeeInvitation = {
      ...invitation,
      send_status: 'sending',
      last_send_error: undefined,
    }
    db[index] = sendingInvitation
    this.saveInvitationsDb(db)

    if (!validation.ok) {
      const failedSnapshot = this.buildInvitationEmailPreview(sendingInvitation)
      const failedLog = this.buildSendLog({
        invitationId,
        status: 'sent_failed',
        attemptedAt,
        attemptedBy: currentUser?.id || invitation.invited_by,
        error: validation.reason,
        snapshot: failedSnapshot,
      })
      db[index] = {
        ...sendingInvitation,
        send_status: 'sent_failed',
        last_send_error: validation.reason,
        last_sent_at: attemptedAt,
        last_sent_by: currentUser?.id || invitation.invited_by,
        send_attempt_count: (invitation.send_attempt_count || 0) + 1,
        email_preview_snapshot: failedSnapshot,
        send_logs: this.appendSendLog(invitation, failedLog),
      }
      this.saveInvitationsDb(db)
      return null
    }

    const nextAttemptCount = (invitation.send_attempt_count || 0) + 1
    const previewSnapshot = this.buildInvitationEmailPreview(invitation)
    const successLog = this.buildSendLog({
      invitationId,
      status: 'sent_success',
      attemptedAt,
      attemptedBy: currentUser?.id || invitation.invited_by,
      snapshot: previewSnapshot,
    })
    const resentInvitation: EmployeeInvitation = {
      ...invitation,
      send_status: 'sent_success',
      send_attempt_count: nextAttemptCount,
      last_sent_at: attemptedAt,
      last_sent_by: currentUser?.id || invitation.invited_by,
      last_send_error: undefined,
      email_template_version: this.INVITATION_EMAIL_TEMPLATE_VERSION,
      email_preview_snapshot: previewSnapshot,
      send_logs: this.appendSendLog(invitation, successLog),
    }

    db[index] = resentInvitation
    this.saveInvitationsDb(db)
    return resentInvitation
  }

  static markInvitationSendFailed(invitationId: string, error: string, currentUser?: AuthUser): EmployeeInvitation | null {
    const db = this.getInvitationsDb()
    const index = db.findIndex(inv => inv.id === invitationId)

    if (index === -1) return null

    const invitation = db[index]
    const attemptedAt = new Date().toISOString()
    const snapshot = this.buildInvitationEmailPreview(invitation)
    const failedLog = this.buildSendLog({
      invitationId,
      status: 'sent_failed',
      attemptedAt,
      attemptedBy: currentUser?.id || invitation.invited_by,
      error,
      snapshot,
    })

    const failedInvitation: EmployeeInvitation = {
      ...invitation,
      send_status: 'sent_failed',
      last_send_error: error,
      last_sent_at: attemptedAt,
      last_sent_by: currentUser?.id || invitation.invited_by,
      send_attempt_count: (invitation.send_attempt_count || 0) + 1,
      email_preview_snapshot: snapshot,
      send_logs: this.appendSendLog(invitation, failedLog),
    }

    db[index] = failedInvitation
    this.saveInvitationsDb(db)
    return failedInvitation
  }
 
  // Kiểm tra email invitation đã tồn tại (trong invitations đang active)
  static isInvitationEmailDuplicate(email: string): boolean {
    const db = this.getInvitationsDb()
    return db.some(inv => 
      inv.email.toLowerCase() === email.toLowerCase() &&
      ['draft', 'sent', 'submitted', 'pending_approval', 'needs_revision'].includes(inv.status)
    )
  }
 
  // Kiểm tra phone invitation đã tồn tại
  static isInvitationPhoneDuplicate(phone: string): boolean {
    const db = this.getInvitationsDb()
    return db.some(inv => 
      inv.phone === phone &&
      ['draft', 'sent', 'submitted', 'pending_approval', 'needs_revision'].includes(inv.status)
    )
  }
 
  // Cập nhật trạng thái invitation
  static updateInvitationStatus(invitationId: string, status: EmployeeInvitation['status']): boolean {
    const db = this.getInvitationsDb()
    const index = db.findIndex(inv => inv.id === invitationId)
    if (index === -1) return false
    db[index] = { ...db[index], status }
    this.saveInvitationsDb(db)
    return true
  }

  // Yêu cầu bổ sung thông tin với lý do
  static requestRevision(invitationId: string, notes: string): boolean {
    const db = this.getInvitationsDb()
    const index = db.findIndex(inv => inv.id === invitationId)
    if (index === -1) return false
    db[index] = { 
      ...db[index], 
      status: 'needs_revision',
      revision_request_note: notes
    }
    this.saveInvitationsDb(db)
    return true
  }

 
  // Kiểm tra invitation đã đủ điều kiện duyệt hay chưa
  static isInvitationReadyForApproval(invitation: EmployeeInvitation): {
    ready: boolean
    missingFields: { key: keyof EmployeeInvitation; label: string }[]
    completenessPercent: number
  } {
    const requiredFields: { key: keyof EmployeeInvitation; label: string }[] = [
      { key: 'full_name', label: 'Họ và tên' },
      { key: 'phone', label: 'Số điện thoại' },
      { key: 'email', label: 'Email' },
      { key: 'date_of_birth', label: 'Ngày sinh' },
      { key: 'gender', label: 'Giới tính' },
      { key: 'cccd', label: 'Số CCCD / Hộ chiếu' },
      { key: 'address', label: 'Địa chỉ thường trú' },
      { key: 'emergency_contact', label: 'Thông tin liên hệ khẩn cấp' },
    ]

    const missingFields = requiredFields.filter(field => {
      const val = invitation[field.key]
      return !(val && typeof val === 'string' && val.trim() !== '')
    })
    const filledCount = requiredFields.length - missingFields.length

    return {
      ready: missingFields.length === 0,
      missingFields,
      completenessPercent: Math.round((filledCount / requiredFields.length) * 100),
    }
  }

  // Xác nhận invitation thành employee
  static confirmInvitation(invitationId: string, currentUser?: AuthUser): AuthUser | null {
    const db = this.getInvitationsDb()
    const invIndex = db.findIndex(inv => inv.id === invitationId)
    
    if (invIndex === -1) return null
    
    const invitation = db[invIndex]
    
    // Chi cho phep confirm invitation o trang thai cho duyet (pending_approval)
    if (invitation.status !== 'pending_approval') {
      return null
    }

    // Khoa va kiem tra dieu kien thong tin bat buoc
    if (!this.isInvitationReadyForApproval(invitation).ready) {
      return null
    }
    
    // Tạo employee từ invitation
    const newEmployee = this.createEmployee({
      full_name: invitation.full_name,
      email: invitation.email,
      phone: invitation.phone,
      store_id: invitation.store_id,
      position_id: invitation.position_id,
      role: invitation.role as AuthUser['role'],
      hire_date: invitation.hire_date || new Date().toISOString().split('T')[0],
      status: invitation.is_probationary ? 'probation' : 'active',
      account_status: 'dang_hoat_dong',
      department_name: invitation.department_name,
      employee_type: invitation.employee_type,
      job_level: invitation.job_level,
      official_salary: invitation.official_salary,
      kpi_salary: invitation.kpi_salary,
      is_probationary: invitation.is_probationary,
      probation_policy: invitation.probation_policy,
      probation_end_date: invitation.probation_end_date,
      probation_salary_mode: invitation.probation_salary_mode,
      probation_salary_value: invitation.probation_salary_value,
      auto_complete_probation: invitation.auto_complete_probation,
      // Thong tin tu candidate tu dien
      date_of_birth: invitation.date_of_birth,
      gender: invitation.gender,
      address: invitation.address,
      cccd: invitation.cccd,
      emergency_contact: invitation.emergency_contact,
      candidate_notes: invitation.candidate_notes,
    }, currentUser, 'invitation')
    
    // Cap nhat invitation thanh approved
    db[invIndex] = {
      ...invitation,
      status: 'approved',
      confirmed_employee_id: newEmployee.id,
    }
    this.saveInvitationsDb(db)

    OnboardingPolicyService.handleInvitationApproved({
      employee: newEmployee,
      invitation: db[invIndex],
      actor: currentUser,
    })
    
    return newEmployee
  }
 
  // Hủy invitation
  static cancelInvitation(invitationId: string): boolean {
    const db = this.getInvitationsDb()
    const index = db.findIndex(inv => inv.id === invitationId)
    
    if (index === -1) return false
    
    db[index] = { ...db[index], status: 'cancelled' }
    this.saveInvitationsDb(db)
    
    return true
  }



  // Candidate tự điền thông tin và submit
  static submitCandidateData(
    invitationId: string, 
    data: {
      full_name: string
      phone: string
      email: string
      date_of_birth: string
      gender: 'male' | 'female' | 'other'
      address: string
      cccd: string
      emergency_contact: string
      candidate_notes?: string
    }
  ): boolean {
    const db = this.getInvitationsDb()
    const index = db.findIndex(inv => inv.id === invitationId)
    if (index === -1) return false
    
    const validation = this.canCandidateSubmitInvitation(db[index])
    if (!validation.ok) return false
    
    db[index] = {
      ...db[index],
      ...data,
      status: 'pending_approval'
    }

    const updatedInvitation = db[index]
    
    this.saveInvitationsDb(db)
    const recipients = this.getDb()
      .filter(employee => ['ceo', 'hr_admin'].includes(employee.role))
      .map(employee => employee.id)

    recipients.forEach((userId) => {
      createNotificationDeduped(
        userId,
        'system',
        'Ứng viên đã gửi hồ sơ',
        `${updatedInvitation.full_name} đã hoàn tất hồ sơ và đang chờ duyệt.`,
        {
          invitation_id: updatedInvitation.id,
          invitation_status: updatedInvitation.status,
          action_url: '/employees/invitations',
        },
        5 * 60 * 1000,
      )
    })

    return true
  }

  static getOffboardingByEmployee(employeeId: string): OffboardingChecklist | null {
    const directMatch = mockOffboardingChecklists.find(item => item.employee_id === employeeId)
    if (directMatch) return directMatch

    const employee = this.getDb().find(item => item.id === employeeId)
    if (!employee) return null

    const baseTemplate = mockOffboardingChecklists[0]
    if (!baseTemplate) return null

    return {
      ...baseTemplate,
      id: `off-${employee.id}`,
      employee_id: employee.id,
      employee_name: employee.full_name,
      position: employee.position_id,
      last_day: employee.probation_end_date || employee.hire_date,
      effective_date: employee.probation_end_date || employee.hire_date,
      reason: 'Chua cap nhat ly do nghi viec',
      owner_name: 'HR Admin',
      steps: baseTemplate.steps.map((step, index) => ({
        ...step,
        id: `${employee.id}-${step.id}`,
        is_done: index === 0 ? step.is_done : false,
        done_by: index === 0 ? step.done_by : undefined,
        done_at: index === 0 ? step.done_at : undefined,
      })),
      handover_items: (baseTemplate.handover_items || []).map(item => ({
        ...item,
        id: `${employee.id}-${item.id}`,
        status: item.status === 'done' ? 'pending' : item.status,
      })),
      access_items: (baseTemplate.access_items || []).map(item => ({
        ...item,
        id: `${employee.id}-${item.id}`,
        status: item.status === 'done' ? 'pending' : item.status,
      })),
      finance_items: (baseTemplate.finance_items || []).map(item => ({
        ...item,
        id: `${employee.id}-${item.id}`,
      })),
      schedule_items: (baseTemplate.schedule_items || []).map(item => ({
        ...item,
        id: `${employee.id}-${item.id}`,
        due_date: employee.probation_end_date || item.due_date,
        status: 'pending',
      })),
    }
  }
}

