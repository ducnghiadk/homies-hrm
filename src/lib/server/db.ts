import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { calculateDistance } from '@/lib/utils'
import { hashPassword } from '@/lib/security/token-signer'
import type {
  BSCCriteriaInfo,
  BSCBonusTier,
  BSCCriteriaThresholdRule,
  BSCPositionMultiplier,
  BSCDeductionPolicy,
  BSCSafetySettings,
} from '@/lib/bsc-types'
import {
  bscCriteriaCatalog,
  bscBonusTiersCatalog,
  bscCriteriaThresholdsCatalog,
  bscPositionMultipliersCatalog,
  bscDeductionPolicy,
  bscSafetySettings,
} from '@/lib/mock-data-bsc'

export interface ServerBscSettings {
  criteria?: BSCCriteriaInfo[]
  bonus_tiers?: BSCBonusTier[]
  threshold_rules?: BSCCriteriaThresholdRule[]
  position_multipliers?: BSCPositionMultiplier[]
  deduction_policy?: BSCDeductionPolicy
  safety_settings?: BSCSafetySettings
}

export interface ServerStore {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  checkin_radius_meters: number
  pin_code?: string
  phone: string
  is_active: boolean
}

export interface ServerEmployee {
  id: string
  full_name: string
  email: string
  password?: string
  role: 'ceo' | 'hr_admin' | 'store_manager' | 'area_manager' | 'shift_leader' | 'employee'
  store_id: string
  secondary_store_ids?: string[]
  position_id: string
  phone: string
  employee_code: string
  status: 'active' | 'inactive' | 'probation' | 'resigned'
  account_status: 'chua_kich_hoat' | 'dang_hoat_dong' | 'bi_khoa'
  department_name?: string
  base_salary?: number
  hourly_rate?: number
  hire_date?: string
  uniform_size?: 'S' | 'M' | 'L' | 'XL' | 'XXL'
  bank_name?: string
  bank_account_no?: string
  bank_account_holder?: string
  id_card_front_url?: string
  id_card_back_url?: string
  health_cert_expiry?: string
}

export interface ServerShiftTemplate {
  id: string
  name: string
  code?: string
  start: string
  end: string
  hours: number
  color?: string
  store_scope?: 'global' | 'store_specific'
  store_id?: string
  is_active?: boolean
  is_flexible?: boolean
  allowed_position_ids?: string[]
  min_headcount?: number
  max_headcount?: number
}

export interface ServerScheduleRule {
  id: string
  rule_key: string
  label: string
  description: string
  warning_value: number
  block_value: number
  warning_level: 'info' | 'warning' | 'block'
  is_active: boolean
}

export interface ServerScheduleRuleOverride {
  id: string
  rule_key: string
  position_id: string | null
  season_id: string | null
  override_warning: number
  override_block: number
}

export interface ServerDepartment {
  id: string
  code: string
  name: string
  store_id: string
  manager_id?: string
  head_count: number
  description?: string
}

export interface ServerPosition {
  id: string
  code?: string
  name: string
  department_id: string
  level: number
  base_salary: number
  pay_type: 'monthly' | 'hourly'
}

export interface ServerLeaveType {
  id: string
  name: string
  code: string
  default_days: number
  is_paid: boolean
  require_doc: boolean
}

export interface ServerShiftRegistration {
  id: string
  employee_id: string
  employee_name?: string
  store_id: string
  week_start_date: string // YYYY-MM-DD
  date: string            // YYYY-MM-DD
  shift_id: string        // shift-001 (Sáng), shift-002 (Chiều), shift-003 (Tối)
  shift_name?: string
  position_id?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  created_at: string
  approved_by?: string
  approved_at?: string
  notes?: string
}

export interface ServerAttendanceLog {
  id: string
  employee_id: string
  employee_name: string
  store_id: string
  store_name: string
  shift_id?: string
  check_in_time: string
  check_out_time?: string
  check_in_lat: number
  check_in_lng: number
  check_out_lat?: number
  check_out_lng?: number
  check_in_distance_meters: number
  status: 'on_time' | 'late' | 'check_out' | 'checked_out'
  is_late?: boolean
  late_minutes: number
  is_early?: boolean
  early_minutes?: number
  total_hours?: number
  qr_code?: string
  date: string
}

export interface ServerSalarySlip {
  id: string
  employee_id: string
  employee_name: string
  employee_code: string
  position: string
  store_id: string
  period: string // YYYY-MM (e.g. 2026-08)
  work_days: number
  total_hours?: number
  standard_days: number
  base_salary: number
  allowances: number
  bonus: number
  deductions: number
  late_deduction?: number
  net_salary: number
  status: 'draft' | 'locked'
}

export interface ServerViolationIncident {
  id: string
  store_id: string
  employee_id: string
  employee_name?: string
  occurred_at: string
  source: string
  status: 'proposed' | 'confirmed'
  violation_code: string
  reason: string
  description: string
  penalty_amount: number
  evidence_refs: string[]
  created_at: string
}

export interface ServerPayrollSummary {
  period: string
  store_id: string
  store_name: string
  employee_count: number
  total_base: number
  total_allowance: number
  total_bonus: number
  total_deduction: number
  total_net: number
  status: 'draft' | 'locked'
  locked_by?: string
  locked_at?: string
}

export interface ServerRequest {
  id: string
  employee_id: string
  employee_name?: string
  store_id?: string
  type: 'leave' | 'shift_swap' | 'salary_advance' | 'missed_checkin'
  title: string
  reason: string
  amount?: number
  date?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  created_at: string
  approved_by?: string
  approved_at?: string
  notes?: string
}

export interface ServerInvitation {
  id: string
  token: string
  full_name: string
  phone: string
  email: string
  store_id: string
  position_id: string
  role: 'employee' | 'shift_leader'
  status: 'pending' | 'submitted' | 'approved' | 'rejected'
  // --- 5 TRƯỜNG F&B MỚI BỔ SUNG ---
  uniform_size?: 'S' | 'M' | 'L' | 'XL' | 'XXL'
  shirt_size?: string
  id_card_front_url?: string
  id_card_back_url?: string
  health_cert_expiry?: string
  health_cert_date?: string
  bank_name?: string
  bank_account_number?: string
  bank_account_name?: string
  policy_agreed?: boolean
  candidate_notes?: string
  created_at: string
  submitted_at?: string
  approved_at?: string
  approved_by?: string
  // Chi tiết cá nhân ứng viên
  date_of_birth?: string
  gender?: string
  address?: string
  cccd?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  hourly_rate?: number
  official_salary?: number
  department_name?: string
  job_level?: string
  hire_date?: string
  notes?: string
}

export interface ServerContractSignature {
  id: string
  actorId: string
  actorName: string
  role: 'employee' | 'hr'
  signedAt: string
  method: 'app_confirm' | 'otp_mock' | 'e_signature'
  evidence: string
  signatureImageUrl?: string
}

export interface ServerContractAuditLog {
  id: string
  action: string
  actorId: string
  actorName: string
  at: string
  note: string
}

export interface ServerContractSnapshot {
  id: string
  version: string
  createdAt: string
  note: string
  content: string
}

export interface ServerContract {
  id: string
  templateId: string
  employeeId: string
  storeId: string
  positionId: string
  status:
    | 'draft'
    | 'pending_employee_sign'
    | 'signed_by_employee'
    | 'pending_hr_sign'
    | 'active'
    | 'rejected'
    | 'expired'
    | 'void'
    | 'superseded'
  version: string
  startDate: string
  endDate?: string
  sentAt?: string
  activatedAt?: string
  customFields: Record<string, string>
  renderedContent: string
  signatures: ServerContractSignature[]
  auditLogs: ServerContractAuditLog[]
  snapshotHistory: ServerContractSnapshot[]
}

export interface ServerBscTarget {
  id?: string
  store_id: string
  store_name?: string
  period: string
  profit_threshold_daily: number
  avg_3_6_months_daily?: number
  target_mode?: string
  manual_target_daily?: number
  target_daily: number
  target_monthly: number
  days_in_month: number
  actual_revenue_monthly: number
  actual_revenue_daily: number
  is_unlocked?: boolean
  cogs_budget: number
  cogs_actual: number
  waste_percentage?: number
  operation_error_points?: number
  has_critical_op_error?: boolean
  has_no_qr?: boolean
  customer_qr_score?: number
  customer_qr_count?: number
  customer_review_score?: number
  customer_complaint_count?: number
  has_attp_foreign_body?: boolean
  min_hours_threshold?: number
  bsc_coefficient?: number
  store_bonus_pool?: number
  approval_status: 'draft' | 'pending_ceo' | 'approved_published'
  submitted_by?: string
  submitted_at?: string
  approved_by?: string
  approved_at?: string
  source?: string
  updated_at?: string
}

export interface ServerBscLog {
  id: string
  event_id?: string
  store_id: string
  period: string
  log_type: 'operation' | 'personal'
  event_category?: string
  group_key: string
  group_name: string
  sub_error_id?: string
  sub_error_name?: string
  employee_id?: string
  employee_name?: string
  points: number
  occurred_at: string
  shift_name?: string
  order_code?: string
  evidence_type?: string
  evidence_url?: string
  evidence_note?: string
  verifier_name?: string
  scope_reason?: string
  affects_op_score?: boolean
  affects_customer_score?: boolean
  affects_personal_multiplier?: boolean
  locks_personal_bonus?: boolean
  approval_status?: string
  created_at: string
}

export interface ServerIposSyncRecordPreview {
  code: string
  name: string
  role?: string
  store_code?: string
  store_name?: string
  hours?: number
  hourly_rate?: number
  amount?: number
  bonus?: number
  allowance?: number
  deductions?: number
  overtime_hours?: number
  missing_checkout_count?: number
  terminal_id?: string
  bank_name?: string
  bank_account_no?: string
  late_minutes?: number
  status?: string
  note?: string
}

export interface ServerIposSyncLog {
  id: string
  executed_at: string
  module: string
  status: 'success' | 'failed' | 'running'
  record_count: number
  message: string
  trigger_type: 'cron_worker' | 'manual'
  records_preview?: ServerIposSyncRecordPreview[]
}

export interface IposSchemaFieldInfo {
  key: string
  label_vi: string
  sample_value: any
  data_type: 'string' | 'number' | 'boolean' | 'date' | 'object'
  is_mapped: boolean
  mapped_homies_field?: string
  target_module: 'payroll' | 'attendance' | 'employees' | 'shifts'
  is_recommended?: boolean
  description?: string
}

export interface IposSchemaRecommendation {
  id: string
  module: 'payroll' | 'attendance' | 'employees' | 'shifts'
  field_key: string
  field_title: string
  importance: 'high' | 'medium' | 'low'
  reason: string
  suggested_action: string
  status: 'pending' | 'applied' | 'dismissed'
  detected_at: string
}

export interface ServerIposIntegrationConfig {
  is_enabled: boolean
  api_endpoint: string
  username: string
  token_or_password?: string
  store_codes: string[]
  sync_schedule: 'every_1_min' | 'daily_midnight' | 'every_2_hours' | 'manual_only'
  sync_attendance: boolean
  sync_payroll: boolean
  sync_employees: boolean
  sync_shifts: boolean
  sync_pos_revenue: boolean
  sync_inventory: boolean
  last_synced_at?: string
  last_sync_status?: 'success' | 'failed' | 'idle' | 'unauthenticated' | 'disconnected'
  is_authenticated?: boolean
  sync_logs: ServerIposSyncLog[]
  detected_fields?: IposSchemaFieldInfo[]
  schema_recommendations?: IposSchemaRecommendation[]
  custom_mapped_fields?: Record<string, string>
  hrm_jwt_token?: string
  hrm_user?: {
    id?: string
    name?: string
    email?: string
    phone?: string
    role?: string
  }
  hrm_company?: {
    id?: string
    name?: string
    code?: string
  }
  fabi_pos_config?: {
    username?: string
    password?: string
    jwt_token?: string
    token_expires_at?: string
    company_uid?: string
    company_name?: string
    brand_uid?: string
    brand_name?: string
    stores?: Array<{ id: string; name: string; address?: string; code?: string; phone?: string }>
    brand_code?: string
    pos_parent_id?: string
    secret_key?: string
    is_connected: boolean
  }
  ivt_config?: {
    api_endpoint?: string
    token?: string
    is_connected: boolean
  }
}

export interface ServerDatabaseSchema {
  stores: ServerStore[]
  employees: ServerEmployee[]
  departments?: ServerDepartment[]
  positions?: ServerPosition[]
  leave_types?: ServerLeaveType[]
  shift_templates?: ServerShiftTemplate[]
  schedule_rules?: ServerScheduleRule[]
  rule_overrides?: ServerScheduleRuleOverride[]
  shifts: ServerShiftRegistration[]
  attendance: ServerAttendanceLog[]
  requests?: ServerRequest[]
  invitations?: ServerInvitation[]
  payroll_summaries: ServerPayrollSummary[]
  salary_slips: ServerSalarySlip[]
  contracts?: ServerContract[]
  incidents?: ServerViolationIncident[]
  bsc_targets?: ServerBscTarget[]
  bsc_logs?: ServerBscLog[]
  bsc_settings?: ServerBscSettings
  ipos_integration?: ServerIposIntegrationConfig
  sessions: Record<string, { userId: string; role: string; email: string; createdAt: string }>
}

const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'homies-data')
  : path.join(process.cwd(), 'data')
const DB_FILE = path.join(DATA_DIR, 'server-db.json')

const DEFAULT_SEED_PASSWORD = hashPassword('123456')

// Seed data chuẩn của Homies F&B
function getInitialSeedData(): ServerDatabaseSchema {
  const stores: ServerStore[] = [
    {
      id: 'store-001',
      name: 'Homies Milk Tea - Hồ Bá Phấn',
      address: '89 Hồ Bá Phấn, P. Phước Long A, TP. Thủ Đức, TP.HCM',
      latitude: 10.822435,
      longitude: 106.762649,
      checkin_radius_meters: 100,
      phone: '0901 234 567',
      is_active: true,
    },
    {
      id: 'store-002',
      name: 'Homies Milk Tea - Đường 429',
      address: '429 Đường 429, P. Tăng Nhơn Phú A, TP. Thủ Đức, TP.HCM',
      latitude: 10.84478,
      longitude: 106.78652,
      checkin_radius_meters: 100,
      phone: '0901 234 568',
      is_active: true,
    },
    {
      id: 'store-003',
      name: 'Homies Milk Tea - Lê Văn Sỹ',
      address: '350 Lê Văn Sỹ, Phường 14, Quận 3, TP.HCM',
      latitude: 10.7892,
      longitude: 106.6781,
      checkin_radius_meters: 100,
      phone: '0901 234 569',
      is_active: true,
    },
  ]

  const employees: ServerEmployee[] = [
    // CEO điều hành
    {
      id: 'emp-001',
      full_name: 'Nguyễn Đức Nghĩa',
      email: 'nghianguyen.dk@gmail.com',
      password: DEFAULT_SEED_PASSWORD,
      role: 'ceo',
      store_id: 'store-001',
      position_id: 'pos-ceo',
      phone: '0919246273',
      employee_code: 'BH-001',
      status: 'active',
      account_status: 'dang_hoat_dong',
      department_name: 'Ban Giám đốc',
      base_salary: 25000000,
      hourly_rate: 100000,
      hire_date: '2024-01-01',
    },

    // 2 Nhân sự Full-time (Lương cứng 6.600.000đ/tháng, Store chính 429, Store phụ HBP)
    {
      id: 'emp-nv0027',
      full_name: 'Trần Công Huy',
      email: 'jinn.wooo.02@gmail.com',
      password: DEFAULT_SEED_PASSWORD,
      role: 'store_manager',
      store_id: 'store-002',
      secondary_store_ids: ['store-001', 'store-002'],
      position_id: 'pos-sm',
      phone: '0332151527',
      employee_code: 'NV0027',
      status: 'active',
      account_status: 'dang_hoat_dong',
      department_name: 'Quản lý cửa hàng',
      base_salary: 6600000,
      hourly_rate: 31730,
      hire_date: '2024-04-01',
    },
    {
      id: 'emp-nv0028',
      full_name: 'Phạm Nguyễn Đông Duy',
      email: 'phamnguyendongduy2020@gmail.com',
      password: DEFAULT_SEED_PASSWORD,
      role: 'employee',
      store_id: 'store-002',
      secondary_store_ids: ['store-001', 'store-002'],
      position_id: 'pos-barista',
      phone: '0943749525',
      employee_code: 'NV0028',
      status: 'active',
      account_status: 'dang_hoat_dong',
      department_name: 'Pha chế & Barista',
      base_salary: 6600000,
      hourly_rate: 31730,
      hire_date: '2025-01-15',
    },

    // 12 Nhân sự Part-time (Tính theo giờ, KHÔNG có lương cứng -> base_salary = 0)
    {
      id: 'emp-nv0008',
      full_name: 'Nguyễn Thị Phương Thảo',
      email: 'nguyenphuongthao4324@gmail.com',
      password: DEFAULT_SEED_PASSWORD,
      role: 'shift_leader',
      store_id: 'store-001',
      position_id: 'pos-004',
      phone: '0349439071',
      employee_code: 'NV0008',
      status: 'active',
      account_status: 'dang_hoat_dong',
      department_name: 'Trưởng ca',
      base_salary: 0,
      hourly_rate: 28000,
      hire_date: '2025-05-01',
    },
    {
      id: 'emp-bh9852',
      full_name: 'Huỳnh Lê Kiều Linh',
      email: 'huynhlekieulinh6@gmail.com',
      password: DEFAULT_SEED_PASSWORD,
      role: 'store_manager',
      store_id: 'store-001',
      secondary_store_ids: ['store-001', 'store-002'],
      position_id: 'pos-sm',
      phone: '0779554540',
      employee_code: 'BH-9852',
      status: 'active',
      account_status: 'dang_hoat_dong',
      department_name: 'Quản lý cửa hàng',
      base_salary: 0,
      hourly_rate: 25000,
      hire_date: '2024-05-10',
    },
    {
      id: 'emp-nv0024',
      full_name: 'Tấn Hiếu',
      email: 'tan569619@gmail.com',
      password: DEFAULT_SEED_PASSWORD,
      role: 'employee',
      store_id: 'store-001',
      position_id: 'pos-service',
      phone: '0932835952',
      employee_code: 'NV0024',
      status: 'active',
      account_status: 'dang_hoat_dong',
      department_name: 'Phục vụ & Phụ bar',
      base_salary: 0,
      hourly_rate: 16000,
      hire_date: '2025-08-01',
    },
    {
      id: 'emp-nv0016',
      full_name: 'Nguyễn Thị Kiều Ý',
      email: 'kieuy4052007@gmail.com',
      password: DEFAULT_SEED_PASSWORD,
      role: 'store_manager',
      store_id: 'store-002',
      position_id: 'pos-sm',
      phone: '0378410208',
      employee_code: 'NV0016',
      status: 'active',
      account_status: 'dang_hoat_dong',
      department_name: 'Quản lý cửa hàng',
      base_salary: 0,
      hourly_rate: 20000,
      hire_date: '2024-06-15',
    },
    {
      id: 'emp-nv0013',
      full_name: 'Nguyễn Thị Tú Trinh',
      email: 'ngthtutrinh.0504@gmail.com',
      password: DEFAULT_SEED_PASSWORD,
      role: 'employee',
      store_id: 'store-001',
      position_id: 'pos-cashier',
      phone: '0373056852',
      employee_code: 'NV0013',
      status: 'active',
      account_status: 'dang_hoat_dong',
      department_name: 'Thu ngân & Phục vụ',
      base_salary: 0,
      hourly_rate: 20000,
      hire_date: '2025-02-01',
    },
    {
      id: 'emp-nv0017',
      full_name: 'Nguyễn Thanh Thiện',
      email: 'nguyenthanhthien2804@gmail.com',
      password: DEFAULT_SEED_PASSWORD,
      role: 'employee',
      store_id: 'store-002',
      position_id: 'pos-barista',
      phone: '0775943568',
      employee_code: 'NV0017',
      status: 'active',
      account_status: 'dang_hoat_dong',
      department_name: 'Pha chế & Barista',
      base_salary: 0,
      hourly_rate: 20000,
      hire_date: '2025-03-01',
    },
    {
      id: 'emp-nv0020',
      full_name: 'Lê Minh Lộc',
      email: 'lloclm0203@gmail.com',
      password: DEFAULT_SEED_PASSWORD,
      role: 'shift_leader',
      store_id: 'store-002',
      position_id: 'pos-leader',
      phone: '0945576422',
      employee_code: 'NV0020',
      status: 'active',
      account_status: 'dang_hoat_dong',
      department_name: 'Vận hành cửa hàng',
      base_salary: 0,
      hourly_rate: 20000,
      hire_date: '2024-08-20',
      secondary_store_ids: ['store-001', 'store-002'],
    },
    {
      id: 'emp-nv0009',
      full_name: 'Nguyễn Thị Kiều Trang',
      email: 'kieutrang.homies@gmail.com',
      password: DEFAULT_SEED_PASSWORD,
      role: 'employee',
      store_id: 'store-001',
      position_id: 'pos-cashier',
      phone: '0908123009',
      employee_code: 'NV0009',
      status: 'active',
      account_status: 'dang_hoat_dong',
      department_name: 'Thu ngân & Phục vụ',
      base_salary: 0,
      hourly_rate: 20000,
      hire_date: '2025-06-01',
    },
    {
      id: 'emp-nv0030',
      full_name: 'Quách Thị Kim Chi',
      email: 'quachchi0909@gmail.com',
      password: DEFAULT_SEED_PASSWORD,
      role: 'employee',
      store_id: 'store-001',
      position_id: 'pos-barista',
      phone: '0327431568',
      employee_code: 'NV0030',
      status: 'active',
      account_status: 'dang_hoat_dong',
      department_name: 'Thu ngân & Pha chế',
      base_salary: 0,
      hourly_rate: 20000,
      hire_date: '2025-04-10',
    },
    {
      id: 'emp-nv0031',
      full_name: 'Cao Văn Thắng',
      email: 'vanthangdzai008@gmail.com',
      password: DEFAULT_SEED_PASSWORD,
      role: 'employee',
      store_id: 'store-001',
      position_id: 'pos-barista',
      phone: '0336675736',
      employee_code: 'NV0031',
      status: 'active',
      account_status: 'dang_hoat_dong',
      department_name: 'Pha chế & Barista',
      base_salary: 0,
      hourly_rate: 20000,
      hire_date: '2025-05-15',
    },
    {
      id: 'emp-nv0033',
      full_name: 'Nguyễn Hoài Ân',
      email: 'hie.agg21@gmail.com',
      password: DEFAULT_SEED_PASSWORD,
      role: 'employee',
      store_id: 'store-001',
      position_id: 'pos-barista',
      phone: '0364136210',
      employee_code: 'NV0033',
      status: 'active',
      account_status: 'dang_hoat_dong',
      department_name: 'Pha chế & Barista',
      base_salary: 0,
      hourly_rate: 20000,
      hire_date: '2025-04-15',
    },
    {
      id: 'emp-nv0034',
      full_name: 'Nguyễn Thị Thu',
      email: 'ntthu.work1@gmail.com',
      password: DEFAULT_SEED_PASSWORD,
      role: 'employee',
      store_id: 'store-002',
      secondary_store_ids: ['store-001', 'store-002'],
      position_id: 'pos-cashier',
      phone: '0963593319',
      employee_code: 'NV0034',
      status: 'active',
      account_status: 'dang_hoat_dong',
      department_name: 'Thu ngân & Phục vụ',
      base_salary: 0,
      hourly_rate: 20000,
      hire_date: '2025-06-01',
    },
    {
      id: 'emp-nv0035',
      full_name: 'Nguyễn Mạnh Duy',
      email: 'oppoa5301012021@gmail.com',
      password: DEFAULT_SEED_PASSWORD,
      role: 'employee',
      store_id: 'store-001',
      position_id: 'pos-service',
      phone: '0377249775',
      employee_code: 'NV0035',
      status: 'active',
      account_status: 'dang_hoat_dong',
      department_name: 'Phục vụ & Phụ bar',
      base_salary: 0,
      hourly_rate: 20000,
      hire_date: '2025-07-15',
    },
  ]

  const shifts: ServerShiftRegistration[] = [
    {
      id: 'shift-reg-001',
      employee_id: 'emp-005',
      employee_name: 'Võ Thanh Bình',
      store_id: 'store-001',
      week_start_date: '2026-09-14',
      date: '2026-09-15',
      shift_id: 'shift-001',
      shift_name: 'Ca Sáng (08:00 - 12:00)',
      position_id: 'pos-001',
      status: 'APPROVED',
      created_at: '2026-09-13T10:00:00.000Z',
      approved_by: 'emp-003',
      approved_at: '2026-09-13T16:00:00.000Z',
    },
    {
      id: 'shift-reg-002',
      employee_id: 'emp-429-01',
      employee_name: 'Phạm Nguyễn Đông Duy',
      store_id: 'store-002',
      week_start_date: '2026-09-14',
      date: '2026-09-15',
      shift_id: 'shift-002',
      shift_name: 'Ca Chiều (12:00 - 17:00)',
      position_id: 'pos-001',
      status: 'PENDING',
      created_at: '2026-09-14T08:30:00.000Z',
    },
  ]

  const payroll_summaries: ServerPayrollSummary[] = [
    {
      period: '2026-08',
      store_id: 'store-001',
      store_name: 'Homies Milk Tea - Hồ Bá Phấn',
      employee_count: 12,
      total_base: 13200000,
      total_allowance: 200000,
      total_bonus: 650000,
      total_deduction: 3100000,
      total_net: 22847451,
      status: 'locked',
    },
    {
      period: '2026-08',
      store_id: 'store-002',
      store_name: 'Homies Milk Tea - Đường 429',
      employee_count: 7,
      total_base: 13200000,
      total_allowance: 0,
      total_bonus: 700000,
      total_deduction: 0,
      total_net: 22666844,
      status: 'locked',
    },
  ]

  const salary_slips: ServerSalarySlip[] = [
    {
      id: 'slip-bh9852-store001-202608',
      employee_id: 'emp-bh9852',
      employee_name: 'Huỳnh Lê Kiều Linh',
      employee_code: 'BH-9852',
      position: 'Quản lý cửa hàng',
      store_id: 'store-001',
      period: '2026-08',
      work_days: 26,
      standard_days: 26,
      total_hours: 186.65,
      base_salary: 0,
      allowances: 0,
      bonus: 500000,
      deductions: 2500000,
      net_salary: 3599500,
      status: 'locked',
    },
    {
      id: 'slip-nv0008-store001-202608',
      employee_id: 'emp-nv0008',
      employee_name: 'Nguyễn Thị Phương Thảo',
      employee_code: 'NV0008',
      position: 'Thu ngân & Phục vụ',
      store_id: 'store-001',
      period: '2026-08',
      work_days: 26,
      standard_days: 26,
      total_hours: 263.50,
      base_salary: 0,
      allowances: 0,
      bonus: 0,
      deductions: 0,
      net_salary: 7378000,
      status: 'locked',
    },
    {
      id: 'slip-nv0013-store001-202608',
      employee_id: 'emp-nv0013',
      employee_name: 'Nguyễn Thị Tú Trinh',
      employee_code: 'NV0013',
      position: 'Thu ngân & Phục vụ',
      store_id: 'store-001',
      period: '2026-08',
      work_days: 22,
      standard_days: 26,
      total_hours: 142.82,
      base_salary: 0,
      allowances: 0,
      bonus: 0,
      deductions: 0,
      net_salary: 2856400,
      status: 'locked',
    },
    {
      id: 'slip-nv0027-store001-202608',
      employee_id: 'emp-nv0027',
      employee_name: 'Trần Công Huy',
      employee_code: 'NV0027',
      position: 'Quản lý cửa hàng',
      store_id: 'store-001',
      period: '2026-08',
      work_days: 3,
      standard_days: 26,
      total_hours: 22.00,
      base_salary: 6600000,
      allowances: 0,
      bonus: 0,
      deductions: 0,
      net_salary: 683294,
      status: 'locked',
    },
    {
      id: 'slip-nv0028-store001-202608',
      employee_id: 'emp-nv0028',
      employee_name: 'Phạm Nguyễn Đông Duy',
      employee_code: 'NV0028',
      position: 'Pha chế & Barista',
      store_id: 'store-001',
      period: '2026-08',
      work_days: 2,
      standard_days: 26,
      total_hours: 15.92,
      base_salary: 6600000,
      allowances: 0,
      bonus: 0,
      deductions: 0,
      net_salary: 494457,
      status: 'locked',
    },
    {
      id: 'slip-nv0030-store001-202608',
      employee_id: 'emp-nv0030',
      employee_name: 'Quách Thị Kim Chi',
      employee_code: 'NV0030',
      position: 'Thu ngân & Pha chế',
      store_id: 'store-001',
      period: '2026-08',
      work_days: 21,
      standard_days: 26,
      total_hours: 115.00,
      base_salary: 0,
      allowances: 0,
      bonus: 0,
      deductions: 0,
      net_salary: 2300000,
      status: 'locked',
    },
    {
      id: 'slip-nv0031-store001-202608',
      employee_id: 'emp-nv0031',
      employee_name: 'Cao Văn Thắng',
      employee_code: 'NV0031',
      position: 'Pha chế & Barista',
      store_id: 'store-001',
      period: '2026-08',
      work_days: 24,
      standard_days: 26,
      total_hours: 165.52,
      base_salary: 0,
      allowances: 0,
      bonus: 0,
      deductions: 300000,
      net_salary: 2902400,
      status: 'locked',
    },
    {
      id: 'slip-nv0033-store001-202608',
      employee_id: 'emp-nv0033',
      employee_name: 'Nguyễn Hoài Ân',
      employee_code: 'NV0033',
      position: 'Pha chế & Barista',
      store_id: 'store-001',
      period: '2026-08',
      work_days: 18,
      standard_days: 26,
      total_hours: 99.97,
      base_salary: 0,
      allowances: 0,
      bonus: 0,
      deductions: 300000,
      net_salary: 1299520,
      status: 'locked',
    },
    {
      id: 'slip-nv0034-store001-202608',
      employee_id: 'emp-nv0034',
      employee_name: 'Nguyễn Thị Thu',
      employee_code: 'NV0034',
      position: 'Thu ngân & Phục vụ',
      store_id: 'store-001',
      period: '2026-08',
      work_days: 5,
      standard_days: 26,
      total_hours: 30.77,
      base_salary: 0,
      allowances: 0,
      bonus: 150000,
      deductions: 0,
      net_salary: 765400,
      status: 'locked',
    },
    {
      id: 'slip-nv0035-store001-202608',
      employee_id: 'emp-nv0035',
      employee_name: 'Nguyễn Mạnh Duy',
      employee_code: 'NV0035',
      position: 'Phục vụ & Phụ bar',
      store_id: 'store-001',
      period: '2026-08',
      work_days: 4,
      standard_days: 26,
      total_hours: 20.03,
      base_salary: 0,
      allowances: 0,
      bonus: 0,
      deductions: 0,
      net_salary: 320480,
      status: 'locked',
    },
    {
      id: 'slip-nv0024-store001-202608',
      employee_id: 'emp-nv0024',
      employee_name: 'Tấn Hiếu',
      employee_code: 'NV0024',
      position: 'Phục vụ & Phụ bar',
      store_id: 'store-001',
      period: '2026-08',
      work_days: 1,
      standard_days: 26,
      total_hours: 3.00,
      base_salary: 0,
      allowances: 0,
      bonus: 0,
      deductions: 0,
      net_salary: 48000,
      status: 'locked',
    },
    {
      id: 'slip-nv0032-store001-202608',
      employee_id: 'emp-nv0032',
      employee_name: 'Phan Thị Quỳnh Hương',
      employee_code: 'NV0032',
      position: 'Nhân viên',
      store_id: 'store-001',
      period: '2026-08',
      work_days: 0,
      standard_days: 26,
      total_hours: 0,
      base_salary: 0,
      allowances: 200000,
      bonus: 0,
      deductions: 0,
      net_salary: 200000,
      status: 'locked',
    },
    {
      id: 'slip-nv0006-store001-202608',
      employee_id: 'emp-nv0006',
      employee_name: 'Phạm Vy',
      employee_code: 'NV0006',
      position: 'Nhân viên',
      store_id: 'store-001',
      period: '2026-08',
      work_days: 0,
      standard_days: 26,
      total_hours: 0,
      base_salary: 0,
      allowances: 0,
      bonus: 0,
      deductions: 0,
      net_salary: 0,
      status: 'locked',
    },
    // Store 429
    {
      id: 'slip-bh9852-store002-202608',
      employee_id: 'emp-bh9852',
      employee_name: 'Huỳnh Lê Kiều Linh',
      employee_code: 'BH-9852',
      position: 'Quản lý cửa hàng (Hỗ trợ)',
      store_id: 'store-002',
      period: '2026-08',
      work_days: 3,
      standard_days: 26,
      total_hours: 12.98,
      base_salary: 0,
      allowances: 0,
      bonus: 0,
      deductions: 0,
      net_salary: 389400,
      status: 'locked',
    },
    {
      id: 'slip-nv0016-store002-202608',
      employee_id: 'emp-nv0016',
      employee_name: 'Nguyễn Thị Kiều Ý',
      employee_code: 'NV0016',
      position: 'Quản lý cửa hàng',
      store_id: 'store-002',
      period: '2026-08',
      work_days: 25,
      standard_days: 26,
      total_hours: 160.00,
      base_salary: 0,
      allowances: 0,
      bonus: 200000,
      deductions: 0,
      net_salary: 3400000,
      status: 'locked',
    },
    {
      id: 'slip-nv0017-store002-202608',
      employee_id: 'emp-nv0017',
      employee_name: 'Nguyễn Thanh Thiện',
      employee_code: 'NV0017',
      position: 'Pha chế & Barista',
      store_id: 'store-002',
      period: '2026-08',
      work_days: 9,
      standard_days: 26,
      total_hours: 40.73,
      base_salary: 0,
      allowances: 0,
      bonus: 200000,
      deductions: 0,
      net_salary: 1014600,
      status: 'locked',
    },
    {
      id: 'slip-nv0020-store002-202608',
      employee_id: 'emp-nv0020',
      employee_name: 'Lê Minh Lộc',
      employee_code: 'NV0020',
      position: 'Trưởng ca (Shift Leader)',
      store_id: 'store-002',
      period: '2026-08',
      work_days: 26,
      standard_days: 26,
      total_hours: 162.52,
      base_salary: 0,
      allowances: 0,
      bonus: 0,
      deductions: 0,
      net_salary: 3250400,
      status: 'locked',
    },
    {
      id: 'slip-nv0027-store002-202608',
      employee_id: 'emp-nv0027',
      employee_name: 'Trần Công Huy',
      employee_code: 'NV0027',
      position: 'Quản lý cửa hàng',
      store_id: 'store-002',
      period: '2026-08',
      work_days: 27,
      standard_days: 26,
      total_hours: 217.83,
      base_salary: 6600000,
      allowances: 0,
      bonus: 300000,
      deductions: 0,
      net_salary: 7065543,
      status: 'locked',
    },
    {
      id: 'slip-nv0028-store002-202608',
      employee_id: 'emp-nv0028',
      employee_name: 'Phạm Nguyễn Đông Duy',
      employee_code: 'NV0028',
      position: 'Pha chế & Barista',
      store_id: 'store-002',
      period: '2026-08',
      work_days: 28,
      standard_days: 26,
      total_hours: 232.62,
      base_salary: 6600000,
      allowances: 0,
      bonus: 0,
      deductions: 0,
      net_salary: 7224901,
      status: 'locked',
    },
    {
      id: 'slip-nv0034-store002-202608',
      employee_id: 'emp-nv0034',
      employee_name: 'Nguyễn Thị Thu',
      employee_code: 'NV0034',
      position: 'Thu ngân & Phục vụ',
      store_id: 'store-002',
      period: '2026-08',
      work_days: 4,
      standard_days: 26,
      total_hours: 16.10,
      base_salary: 0,
      allowances: 0,
      bonus: 0,
      deductions: 0,
      net_salary: 322000,
      status: 'locked',
    },
    {
      id: 'slip-nv0006-store002-202608',
      employee_id: 'emp-nv0006',
      employee_name: 'Phạm Vy',
      employee_code: 'NV0006',
      position: 'Nhân viên',
      store_id: 'store-002',
      period: '2026-08',
      work_days: 0,
      standard_days: 26,
      total_hours: 0,
      base_salary: 0,
      allowances: 0,
      bonus: 0,
      deductions: 0,
      net_salary: 0,
      status: 'locked',
    },
    {
      id: 'slip-nv0023-store002-202608',
      employee_id: 'emp-nv0023',
      employee_name: 'Võ Thị Bích Phượng',
      employee_code: 'NV0023',
      position: 'Nhân viên',
      store_id: 'store-002',
      period: '2026-08',
      work_days: 0,
      standard_days: 26,
      total_hours: 0,
      base_salary: 0,
      allowances: 0,
      bonus: 0,
      deductions: 0,
      net_salary: 0,
      status: 'locked',
    },
  ]

  return {
    stores,
    employees,
    shifts,
    attendance: [],
    payroll_summaries,
    salary_slips,
    contracts: getInitialContractsSeed(),
    invitations: getInitialInvitationsSeed(),
    bsc_targets: getInitialBscTargetsSeed(),
    bsc_logs: getInitialBscLogsSeed(),
    bsc_settings: getInitialBscSettingsSeed(),
    incidents: getInitialIncidentsSeed(),
    sessions: {},
  }
}

export function getInitialBscSettingsSeed(): ServerBscSettings {
  return {
    criteria: JSON.parse(JSON.stringify(bscCriteriaCatalog)),
    bonus_tiers: JSON.parse(JSON.stringify(bscBonusTiersCatalog)),
    threshold_rules: JSON.parse(JSON.stringify(bscCriteriaThresholdsCatalog)),
    position_multipliers: JSON.parse(JSON.stringify(bscPositionMultipliersCatalog)),
    deduction_policy: JSON.parse(JSON.stringify(bscDeductionPolicy)),
    safety_settings: JSON.parse(JSON.stringify(bscSafetySettings)),
  }
}

export function getInitialBscTargetsSeed(): ServerBscTarget[] {
  return [
    {
      id: 'bsc-target-hbp-2026-08',
      store_id: 'store-001',
      store_name: 'Homies Milk Tea - Hồ Bá Phấn',
      period: '2026-08',
      profit_threshold_daily: 6500000,
      avg_3_6_months_daily: 7483870,
      target_mode: 'auto_3_6_months',
      target_daily: 8000000,
      target_monthly: 248000000,
      days_in_month: 31,
      actual_revenue_monthly: 209361294,
      actual_revenue_daily: 6753590,
      is_unlocked: true,
      cogs_budget: 86000000,
      cogs_actual: 89741000,
      waste_percentage: 4.35,
      operation_error_points: 2,
      customer_qr_score: 100,
      has_attp_foreign_body: false,
      min_hours_threshold: 100,
      bsc_coefficient: 0.5,
      store_bonus_pool: 1046806,
      approval_status: 'approved_published',
      approved_by: 'CEO Nguyễn Đức Nghĩa',
      approved_at: '2026-08-31 22:00',
      source: 'excel_automation_synced',
    },
    {
      id: 'bsc-target-429-2026-08',
      store_id: 'store-002',
      store_name: 'Homies Milk Tea - Đường 429',
      period: '2026-08',
      profit_threshold_daily: 6500000,
      avg_3_6_months_daily: 7000000,
      target_mode: 'auto_3_6_months',
      target_daily: 7500000,
      target_monthly: 232500000,
      days_in_month: 31,
      actual_revenue_monthly: 241800000,
      actual_revenue_daily: 7800000,
      is_unlocked: true,
      cogs_budget: 80000000,
      cogs_actual: 81680000,
      waste_percentage: 2.1,
      has_attp_foreign_body: false,
      min_hours_threshold: 110,
      approval_status: 'draft',
      source: 'ipos_pos_and_ivt_synced',
    },
  ]
}

export function getInitialBscLogsSeed(): ServerBscLog[] {
  return [
    {
      id: 'bsc-log-bot-156348',
      event_id: 'BOT-156348',
      store_id: 'store-001',
      period: '2026-11',
      log_type: 'operation',
      group_key: 'lam_don',
      group_name: 'Làm đơn & Công thức',
      sub_error_id: 'OP-02',
      sub_error_name: 'Pha sai món giao khách',
      employee_id: 'd4a29e33-7645-4852-8062-824215ee3a52',
      employee_name: 'Mai Thảo Uyên',
      points: 1,
      occurred_at: '2026-11-07T14:20:00.000Z',
      shift_name: 'Ca Chiều',
      evidence_note: 'Pha sai món giao khách [Bot Hermes ghi]',
      verifier_name: 'Hermes Bot',
      affects_op_score: true,
      affects_personal_multiplier: true,
      approval_status: 'proposed_manager',
      created_at: '2026-11-07T14:20:00.000Z',
    },
    {
      id: 'bsc-log-bot-156816',
      event_id: 'BOT-156816',
      store_id: 'store-001',
      period: '2026-11',
      log_type: 'operation',
      group_key: 'thuc_hien_checklist_giao',
      group_name: 'Checklist & Quy trình',
      sub_error_id: 'CHK-01',
      sub_error_name: 'Bỏ dở việc vệ sinh ca sáng',
      employee_id: 'emp-nv0031',
      employee_name: 'Cao Văn Thắng',
      points: 1,
      occurred_at: '2026-11-07T11:45:00.000Z',
      shift_name: 'Ca Sáng',
      evidence_note: 'Bỏ dở việc vệ sinh ca sáng [Bot Hermes ghi]',
      verifier_name: 'Hermes Bot',
      affects_op_score: true,
      affects_personal_multiplier: true,
      approval_status: 'proposed_manager',
      created_at: '2026-11-07T11:45:00.000Z',
    },
    {
      id: 'bsc-log-bot-157275',
      event_id: 'BOT-157275',
      store_id: 'store-001',
      period: '2026-11',
      log_type: 'personal',
      group_key: 'gio_lam_cham_cong',
      group_name: 'Giờ làm & Chấm công',
      sub_error_id: 'ATT-03',
      sub_error_name: 'Đi trễ 54 phút ca tối',
      employee_id: 'emp-nv0031',
      employee_name: 'Cao Văn Thắng',
      points: 2,
      occurred_at: '2026-11-06T17:54:00.000Z',
      shift_name: 'Ca Tối',
      evidence_note: 'Đi trễ 54 phút ca tối [Bot Hermes ghi]',
      verifier_name: 'Hermes Bot',
      affects_op_score: false,
      affects_personal_multiplier: true,
      approval_status: 'proposed_manager',
      created_at: '2026-11-06T17:54:00.000Z',
    },
    {
      id: 'bsc-log-bot-157733',
      event_id: 'BOT-157733',
      store_id: 'store-001',
      period: '2026-11',
      log_type: 'personal',
      group_key: 'gio_lam_cham_cong',
      group_name: 'Giờ làm & Chấm công',
      sub_error_id: 'ATT-01',
      sub_error_name: 'Đi trễ 14 phút ca tối',
      employee_id: 'emp-nv0031',
      employee_name: 'Cao Văn Thắng',
      points: 1,
      occurred_at: '2026-11-05T17:14:00.000Z',
      shift_name: 'Ca Tối',
      evidence_note: 'Đi trễ 14 phút ca tối [Bot Hermes ghi]',
      verifier_name: 'Hermes Bot',
      affects_op_score: false,
      affects_personal_multiplier: true,
      approval_status: 'proposed_manager',
      created_at: '2026-11-05T17:14:00.000Z',
    },
    {
      id: 'bsc-log-bot-158200',
      event_id: 'BOT-158200',
      store_id: 'store-001',
      period: '2026-11',
      log_type: 'personal',
      group_key: 'gio_lam_cham_cong',
      group_name: 'Giờ làm & Chấm công',
      sub_error_id: 'ATT-01',
      sub_error_name: 'Quên chấm công ca sáng',
      employee_id: 'emp-nv0031',
      employee_name: 'Cao Văn Thắng',
      points: 1,
      occurred_at: '2026-11-04T08:30:00.000Z',
      shift_name: 'Ca Sáng',
      evidence_note: 'Quên chấm công ca sáng [Bot Hermes ghi]',
      verifier_name: 'Hermes Bot',
      affects_op_score: false,
      affects_personal_multiplier: true,
      approval_status: 'proposed_manager',
      created_at: '2026-11-04T08:30:00.000Z',
    },
    {
      id: 'bsc-log-bot-158656',
      event_id: 'BOT-158656',
      store_id: 'store-002',
      period: '2026-11',
      log_type: 'operation',
      group_key: 'thuc_hien_checklist_giao',
      group_name: 'Checklist & Quy trình',
      sub_error_id: 'CHK-01',
      sub_error_name: 'Bỏ dở vệ sinh trưa không báo',
      employee_id: 'emp-nv0027',
      employee_name: 'Trần Công Huy',
      points: 1,
      occurred_at: '2026-11-07T13:30:00.000Z',
      shift_name: 'Ca Trưa',
      evidence_note: 'Bỏ dở vệ sinh trưa không báo [Bot Hermes ghi]',
      verifier_name: 'Hermes Bot',
      affects_op_score: true,
      affects_personal_multiplier: true,
      approval_status: 'proposed_manager',
      created_at: '2026-11-07T13:30:00.000Z',
    },
    {
      id: 'bsc-log-bot-159266',
      event_id: 'BOT-159266',
      store_id: 'store-001',
      period: '2026-11',
      log_type: 'operation',
      group_key: 'cuoi_ca_ban_giao',
      group_name: 'Cuối ca & Bàn giao',
      sub_error_id: 'HAND-01',
      sub_error_name: 'Bỏ quên báo cáo doanh thu kết ca',
      employee_id: 'emp-nv0034',
      employee_name: 'Nguyễn Thị Thu',
      points: 1,
      occurred_at: '2026-11-06T22:15:00.000Z',
      shift_name: 'Ca Tối',
      evidence_note: 'Bỏ quên báo cáo doanh thu kết ca [Bot Hermes ghi]',
      verifier_name: 'Hermes Bot',
      affects_op_score: true,
      affects_personal_multiplier: true,
      approval_status: 'proposed_manager',
      created_at: '2026-11-06T22:15:00.000Z',
    },
    {
      id: 'bsc-log-bot-1794074866191-ac9v',
      event_id: 'BOT-866191',
      store_id: 'store-001',
      period: '2026-11',
      log_type: 'operation',
      group_key: 'thuc_hien_checklist_giao',
      group_name: 'Checklist & Quy trình',
      sub_error_id: 'CHK-01',
      sub_error_name: 'Quên chụp và gửi báo cáo vệ sinh đầu ca sáng',
      employee_id: 'emp-nv0031',
      employee_name: 'Cao Văn Thắng',
      points: 1,
      occurred_at: '2026-11-07T09:38:32.466Z',
      shift_name: 'Ca Sáng',
      evidence_note: 'Quên chụp và gửi báo cáo vệ sinh đầu ca sáng [Bot Hermes ghi từ: zalo / HBP - GIỮ VỆ SINH CHUNG / Nghia Nguyen]',
      verifier_name: 'Hermes Bot',
      affects_op_score: true,
      affects_personal_multiplier: true,
      approval_status: 'proposed_manager',
      created_at: '2026-11-07T18:07:46.191Z',
    },
    {
      id: 'bsc-op-log-001',
      event_id: 'EVT-202608-01',
      store_id: 'store-001',
      period: '2026-08',
      log_type: 'operation',
      event_category: 'operation_store',
      group_key: 'lam_don',
      group_name: '1. Pha chế & Công thức Trà sữa',
      sub_error_id: 'sub-op-01',
      sub_error_name: 'Pha sai % đường/đá',
      points: 1,
      occurred_at: '2026-08-14T15:30:00.000Z',
      shift_name: 'Ca Chiều (12:00 - 17:00)',
      order_code: 'BILL-8921',
      evidence_note: 'Khách yêu cầu 50% đường nhưng quầy pha 100% đường',
      verifier_name: 'Huỳnh Lê Kiều Linh',
      approval_status: 'confirmed',
      created_at: '2026-08-14T15:35:00.000Z',
    },
  ]
}

export function getInitialIncidentsSeed(): ServerViolationIncident[] {
  return [
    {
      id: 'inc-bot-156348',
      store_id: 'store-001',
      employee_id: 'd4a29e33-7645-4852-8062-824215ee3a52',
      employee_name: 'Mai Thảo Uyên',
      occurred_at: '2026-11-07T14:20:00.000Z',
      source: 'manual',
      status: 'proposed',
      violation_code: 'wrong_topping',
      reason: 'Pha sai món giao khách',
      description: 'Pha sai món giao khách (OP-02) [Bot Hermes ghi]',
      penalty_amount: 50000,
      evidence_refs: [],
      created_at: '2026-11-07T14:20:00.000Z',
    },
    {
      id: 'inc-bot-156816',
      store_id: 'store-001',
      employee_id: 'emp-nv0031',
      employee_name: 'Cao Văn Thắng',
      occurred_at: '2026-11-07T11:45:00.000Z',
      source: 'manual',
      status: 'proposed',
      violation_code: 'hygiene_breach',
      reason: 'Bỏ dở việc vệ sinh ca sáng',
      description: 'Bỏ dở việc vệ sinh ca sáng (CHK-01) [Bot Hermes ghi]',
      penalty_amount: 50000,
      evidence_refs: [],
      created_at: '2026-11-07T11:45:00.000Z',
    },
    {
      id: 'inc-bot-157275',
      store_id: 'store-001',
      employee_id: 'emp-nv0031',
      employee_name: 'Cao Văn Thắng',
      occurred_at: '2026-11-06T17:54:00.000Z',
      source: 'attendance',
      status: 'proposed',
      violation_code: 'attendance_late',
      reason: 'Đi trễ 54 phút ca tối',
      description: 'Đi trễ 54 phút ca tối (ATT-03) [Bot Hermes ghi]',
      penalty_amount: 100000,
      evidence_refs: [],
      created_at: '2026-11-06T17:54:00.000Z',
    },
    {
      id: 'inc-bot-157733',
      store_id: 'store-001',
      employee_id: 'emp-nv0031',
      employee_name: 'Cao Văn Thắng',
      occurred_at: '2026-11-05T17:14:00.000Z',
      source: 'attendance',
      status: 'proposed',
      violation_code: 'attendance_late',
      reason: 'Đi trễ 14 phút ca tối',
      description: 'Đi trễ 14 phút ca tối (ATT-01) [Bot Hermes ghi]',
      penalty_amount: 0,
      evidence_refs: [],
      created_at: '2026-11-05T17:14:00.000Z',
    },
    {
      id: 'inc-bot-158200',
      store_id: 'store-001',
      employee_id: 'emp-nv0031',
      employee_name: 'Cao Văn Thắng',
      occurred_at: '2026-11-04T08:30:00.000Z',
      source: 'attendance',
      status: 'proposed',
      violation_code: 'attendance_late',
      reason: 'Quên chấm công ca sáng',
      description: 'Quên chấm công ca sáng (ATT-01) [Bot Hermes ghi]',
      penalty_amount: 50000,
      evidence_refs: [],
      created_at: '2026-11-04T08:30:00.000Z',
    },
    {
      id: 'inc-bot-158656',
      store_id: 'store-002',
      employee_id: 'emp-nv0027',
      employee_name: 'Trần Công Huy',
      occurred_at: '2026-11-07T13:30:00.000Z',
      source: 'manual',
      status: 'proposed',
      violation_code: 'hygiene_breach',
      reason: 'Bỏ dở vệ sinh trưa không báo',
      description: 'Bỏ dở vệ sinh trưa không báo (CHK-01) [Bot Hermes ghi]',
      penalty_amount: 50000,
      evidence_refs: [],
      created_at: '2026-11-07T13:30:00.000Z',
    },
    {
      id: 'inc-bot-159266',
      store_id: 'store-001',
      employee_id: 'emp-nv0034',
      employee_name: 'Nguyễn Thị Thu',
      occurred_at: '2026-11-06T22:15:00.000Z',
      source: 'manual',
      status: 'proposed',
      violation_code: 'cash_shortage',
      reason: 'Bỏ quên báo cáo doanh thu kết ca',
      description: 'Bỏ quên báo cáo doanh thu kết ca (HAND-01) [Bot Hermes ghi]',
      penalty_amount: 50000,
      evidence_refs: [],
      created_at: '2026-11-06T22:15:00.000Z',
    },
    {
      id: 'inc-bot-866191',
      store_id: 'store-001',
      employee_id: 'emp-nv0031',
      employee_name: 'Cao Văn Thắng',
      occurred_at: '2026-11-07T09:38:32.466Z',
      source: 'manual',
      status: 'proposed',
      violation_code: 'hygiene_breach',
      reason: 'Quên chụp và gửi báo cáo vệ sinh đầu ca sáng',
      description: 'Quên chụp và gửi báo cáo vệ sinh đầu ca sáng [Bot Hermes ghi từ: zalo / HBP - GIỮ VỆ SINH CHUNG / Nghia Nguyen]',
      penalty_amount: 50000,
      evidence_refs: [],
      created_at: '2026-11-07T18:07:46.191Z',
    },
  ]
}

function getInitialInvitationsSeed(): ServerInvitation[] {
  return [
    {
      id: 'inv-001',
      token: 'inv_demo_pha_che_hbp',
      full_name: 'Nguyễn Hoài Nam',
      phone: '0909123456',
      email: 'hoainam.homies@gmail.com',
      store_id: 'store-001',
      position_id: 'pos-pha-che',
      role: 'employee',
      status: 'pending',
      uniform_size: 'L',
      created_at: '2026-09-10T08:00:00.000Z',
    },
    {
      id: 'inv-002',
      token: 'inv_demo_thu_ngan_429',
      full_name: 'Trần Thị Mai Phương',
      phone: '0918765432',
      email: 'maiphuong.tran@gmail.com',
      store_id: 'store-002',
      position_id: 'pos-thu-ngan',
      role: 'employee',
      status: 'submitted',
      date_of_birth: '2003-05-15',
      gender: 'female',
      address: '429 Đường 429, Tăng Nhơn Phú A, TP. Thủ Đức, TP.HCM',
      cccd: '079203001234',
      emergency_contact_name: 'Trần Văn Hùng (Bố)',
      emergency_contact_phone: '0903112233',
      uniform_size: 'M',
      bank_name: 'Vietcombank',
      bank_account_number: '10123456789',
      bank_account_name: 'TRAN THI MAI PHUONG',
      health_cert_expiry: '2027-06-30',
      policy_agreed: true,
      created_at: '2026-09-12T09:00:00.000Z',
      submitted_at: '2026-09-13T14:30:00.000Z',
    },
  ]
}

function getInitialContractsSeed(): ServerContract[] {
  return [
    {
      id: 'ctr-001',
      templateId: 'tpl-part-time-operational',
      employeeId: 'emp-005',
      storeId: 'store-001',
      positionId: 'pos-pha-che',
      status: 'active',
      version: 'v1.0.1',
      startDate: '2026-03-01',
      sentAt: '2026-02-25T09:00:00.000Z',
      activatedAt: '2026-02-26T10:00:00.000Z',
      customFields: {
        'contract.code': 'HD-0001/HOMIES',
        'company.signer_name': 'Hoàng Thị Yến',
        'company.signer_title': 'Trưởng phòng Nhân sự',
        'salary.allowances': 'Phụ cấp gửi xe 300.000 đ/tháng',
        'salary.payday': 'ngày 10 hàng tháng',
        'salary.hourly_or_shift': '28.000 đ/giờ',
        'job.main_duties': 'Pha chế, phục vụ đồ uống, kiểm kê nguyên vật liệu đầu ca và cuối ca.',
        'job.working_schedule': 'Xoay ca theo lịch phân bổ trên hệ thống Homies HRM',
      },
      renderedContent: 'HỢP ĐỒNG LAO ĐỘNG HOMIES MILK TEA\nSố: HD-0001/HOMIES\nNgười lao động: Lê Văn Cường\nVị trí: Nhân viên pha chế...',
      signatures: [
        {
          id: 'sig-001-emp',
          actorId: 'emp-005',
          actorName: 'Lê Văn Cường',
          role: 'employee',
          signedAt: '2026-02-25T14:30:00.000Z',
          method: 'app_confirm',
          evidence: 'Ký xác nhận trên hệ thống Homies HRM',
        },
        {
          id: 'sig-001-hr',
          actorId: 'emp-016',
          actorName: 'Hoàng Thị Yến',
          role: 'hr',
          signedAt: '2026-02-26T10:00:00.000Z',
          method: 'app_confirm',
          evidence: 'HR countersign phê duyệt',
        },
      ],
      auditLogs: [
        {
          id: 'log-001',
          action: 'create',
          actorId: 'emp-016',
          actorName: 'Hoàng Thị Yến',
          at: '2026-02-25T08:30:00.000Z',
          note: 'Khởi tạo hợp đồng lao động',
        },
      ],
      snapshotHistory: [
        {
          id: 'snap-001',
          version: 'v1.0.1',
          createdAt: '2026-02-25T08:30:00.000Z',
          note: 'Bản hợp đồng ban đầu',
          content: 'HỢP ĐỒNG LAO ĐỘNG HOMIES MILK TEA\nSố: HD-0001/HOMIES',
        },
      ],
    },
    {
      id: 'ctr-002',
      templateId: 'tpl-part-time-operational',
      employeeId: 'emp-006',
      storeId: 'store-002',
      positionId: 'pos-thu-ngan',
      status: 'pending_employee_sign',
      version: 'v1.0.1',
      startDate: '2026-04-01',
      sentAt: '2026-03-25T09:00:00.000Z',
      customFields: {
        'contract.code': 'HD-0002/HOMIES',
        'company.signer_name': 'Hoàng Thị Yến',
        'company.signer_title': 'Trưởng phòng Nhân sự',
        'salary.allowances': 'Phụ cấp gửi xe 300.000 đ/tháng',
        'salary.payday': 'ngày 10 hàng tháng',
        'salary.hourly_or_shift': '26.000 đ/giờ',
        'job.main_duties': 'Thu ngân, kiểm đếm tiền mặt, order đồ uống và tiếp đón khách.',
        'job.working_schedule': 'Linh hoạt theo ca đăng ký',
      },
      renderedContent: 'HỢP ĐỒNG LAO ĐỘNG HOMIES MILK TEA\nSố: HD-0002/HOMIES\nNgười lao động: Phạm Thị Dung\nVị trí: Nhân viên thu ngân...',
      signatures: [],
      auditLogs: [
        {
          id: 'log-002',
          action: 'send',
          actorId: 'emp-016',
          actorName: 'Hoàng Thị Yến',
          at: '2026-03-25T09:00:00.000Z',
          note: 'Gửi hợp đồng chờ nhân sự ký trên điện thoại',
        },
      ],
      snapshotHistory: [
        {
          id: 'snap-002',
          version: 'v1.0.1',
          createdAt: '2026-03-25T09:00:00.000Z',
          note: 'Bản gửi nhân sự ký',
          content: 'HỢP ĐỒNG LAO ĐỘNG HOMIES MILK TEA\nSố: HD-0002/HOMIES',
        },
      ],
    },
  ]
}

let inMemoryCache: ServerDatabaseSchema | null = null
let lastMtime: number = 0

export async function getServerDb(): Promise<ServerDatabaseSchema> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    const stat = await fs.stat(DB_FILE).catch(() => null)
    if (inMemoryCache && stat && stat.mtimeMs === lastMtime) {
      if (!inMemoryCache.contracts) {
        inMemoryCache.contracts = getInitialContractsSeed()
      }
      if (!inMemoryCache.invitations || inMemoryCache.invitations.length === 0) {
        inMemoryCache.invitations = getInitialInvitationsSeed()
      }
      if (!inMemoryCache.bsc_targets || inMemoryCache.bsc_targets.length === 0) {
        inMemoryCache.bsc_targets = getInitialBscTargetsSeed()
      }
      if (!inMemoryCache.bsc_logs || inMemoryCache.bsc_logs.length === 0) {
        inMemoryCache.bsc_logs = getInitialBscLogsSeed()
      }
      if (!inMemoryCache.bsc_settings) {
        inMemoryCache.bsc_settings = getInitialBscSettingsSeed()
      }
      if (!inMemoryCache.incidents || inMemoryCache.incidents.length === 0) {
        inMemoryCache.incidents = getInitialIncidentsSeed()
      }
      inMemoryCache.incidents.forEach((inc) => {
        if ((inc.status as string) === 'pending') {
          inc.status = 'proposed'
        }
      })
      return inMemoryCache
    }

    const data = await fs.readFile(DB_FILE, 'utf-8')
    inMemoryCache = JSON.parse(data)
    if (!inMemoryCache!.contracts) {
      inMemoryCache!.contracts = getInitialContractsSeed()
    }
    if (!inMemoryCache!.invitations || inMemoryCache!.invitations.length === 0) {
      inMemoryCache!.invitations = getInitialInvitationsSeed()
    }
    if (!inMemoryCache!.bsc_targets || inMemoryCache!.bsc_targets.length === 0) {
      inMemoryCache!.bsc_targets = getInitialBscTargetsSeed()
    }
    if (!inMemoryCache!.bsc_logs || inMemoryCache!.bsc_logs.length === 0) {
      inMemoryCache!.bsc_logs = getInitialBscLogsSeed()
    }
    if (!inMemoryCache!.bsc_settings) {
      inMemoryCache!.bsc_settings = getInitialBscSettingsSeed()
    }
    if (!inMemoryCache!.incidents || inMemoryCache!.incidents.length === 0) {
      inMemoryCache!.incidents = getInitialIncidentsSeed()
    }

    // Chuẩn hóa trạng thái chờ duyệt của sự cố (pending -> proposed)
    if (inMemoryCache?.incidents) {
      inMemoryCache.incidents.forEach((inc) => {
        if ((inc.status as string) === 'pending') {
          inc.status = 'proposed'
        }
      })
    }

    // Tự động nâng cấp mật khẩu còn ở dạng thường sang chuẩn mã hóa an toàn PBKDF2
    let needMigrate = false
    if (inMemoryCache?.employees) {
      inMemoryCache.employees.forEach((emp) => {
        if (emp.password && !emp.password.startsWith('pbkdf2:')) {
          emp.password = hashPassword(emp.password)
          needMigrate = true
        }
      })
    }
    if (needMigrate && inMemoryCache) {
      await saveServerDb(inMemoryCache)
    }

    if (stat) lastMtime = stat.mtimeMs
    return inMemoryCache!
  } catch {
    let initial: ServerDatabaseSchema
    try {
      const bundledPath = path.join(process.cwd(), 'data', 'server-db.json')
      const bundledData = await fs.readFile(bundledPath, 'utf-8')
      initial = JSON.parse(bundledData) as ServerDatabaseSchema
      if (!initial.bsc_logs || initial.bsc_logs.length === 0) {
        initial.bsc_logs = getInitialBscLogsSeed()
      }
      if (!initial.incidents || initial.incidents.length === 0) {
        initial.incidents = getInitialIncidentsSeed()
      }
    } catch {
      initial = getInitialSeedData()
    }
    try {
      await fs.mkdir(DATA_DIR, { recursive: true })
      await fs.writeFile(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8')
    } catch {
      // Bỏ qua lỗi ghi đĩa trên môi trường serverless
    }
    inMemoryCache = initial
    return inMemoryCache
  }
}

export async function saveServerDb(db: ServerDatabaseSchema): Promise<void> {
  inMemoryCache = db
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf-8')
    const stat = await fs.stat(DB_FILE).catch(() => null)
    if (stat) lastMtime = stat.mtimeMs
  } catch {
    // Bỏ qua lỗi ghi đĩa trên môi trường serverless, inMemoryCache vẫn giữ dữ liệu
  }
}

export function clearServerDbCache(): void {
  inMemoryCache = null
  lastMtime = 0
}

// ============================================================
// CÁC HÀM PHỤ TRỢ NGHIỆP VỤ CA LÀM VIỆC & CHẤM CÔNG HOMIES F&B
// ============================================================

export const STANDARD_FNB_SHIFTS: Record<
  string,
  { id: string; name: string; start: string; end: string; hours: number }
> = {
  'shift-001': { id: 'shift-001', name: 'Ca Sáng (08:30 - 12:00)', start: '08:30', end: '12:00', hours: 3.5 },
  'shift-001b': { id: 'shift-001b', name: 'Ca Sáng Chuẩn (08:30 - 12:00)', start: '08:30', end: '12:00', hours: 3.5 },
  'shift-002': { id: 'shift-002', name: 'Ca Trưa (12:00 - 17:00)', start: '12:00', end: '17:00', hours: 5.0 },
  'shift-002b': { id: 'shift-002b', name: 'Ca Chiều Mở Rộng (12:00 - 17:30)', start: '12:00', end: '17:30', hours: 5.5 },
  'shift-003': { id: 'shift-003', name: 'Ca Tối (17:00 - 22:00)', start: '17:00', end: '22:00', hours: 5.0 },
  'shift-004-tle': { id: 'shift-004-tle', name: 'Ca Trưa Lẻ (12:00 - 15:00)', start: '12:00', end: '15:00', hours: 3.0 },
  'shift-006': { id: 'shift-006', name: 'Ca Sáng Thu Ngân (08:30 - 12:00)', start: '08:30', end: '12:00', hours: 3.5 },
  'shift-007': { id: 'shift-007', name: 'Ca Chiều Lẻ (14:00 - 18:00)', start: '14:00', end: '18:00', hours: 4.0 },
  'shift-008': { id: 'shift-008', name: 'Ca Bếp (13:00 - 20:00)', start: '13:00', end: '20:00', hours: 7.0 },
  'shift-009': { id: 'shift-009', name: 'KIỂM KHO (17:00 - 22:00)', start: '17:00', end: '22:00', hours: 5.0 },
  // Khung ca tham chiếu kiểm thử
  'shift-004': { id: 'shift-004', name: 'Ca Cao Điểm Trưa (11:30 - 14:30)', start: '11:30', end: '14:30', hours: 3.0 },
  'shift-005': { id: 'shift-005', name: 'Ca Dọn Quầy (22:00 - 01:30)', start: '22:00', end: '01:30', hours: 3.5 },
}

/** Chuyển đổi chuỗi giờ "HH:MM" hoặc ISO string thành số phút trong ngày */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0
  let cleanTime = timeStr.trim()
  if (cleanTime.includes('T')) {
    cleanTime = cleanTime.split('T')[1].slice(0, 5)
  } else if (cleanTime.includes(' ')) {
    cleanTime = cleanTime.split(' ')[1].slice(0, 5)
  }
  const parts = cleanTime.split(':').map(Number)
  const hours = isNaN(parts[0]) ? 0 : parts[0]
  const minutes = isNaN(parts[1]) ? 0 : parts[1]
  return hours * 60 + minutes
}

/** Lấy khoảng thời gian (phút bắt đầu - phút kết thúc) của một ca làm việc */
export function getShiftTimeRange(
  shiftInput: string | { id?: string; shift_id?: string; start?: string; end?: string; hours?: number },
  customTemplates?: ServerShiftTemplate[]
): { startMin: number; endMin: number; startStr: string; endStr: string; hours: number } {
  let shiftId = ''
  let customStart = ''
  let customEnd = ''
  let customHours = 0

  if (typeof shiftInput === 'string') {
    shiftId = shiftInput
  } else if (shiftInput && typeof shiftInput === 'object') {
    shiftId = shiftInput.shift_id || shiftInput.id || ''
    customStart = shiftInput.start || ''
    customEnd = shiftInput.end || ''
    customHours = Number(shiftInput.hours || 0)
  }

  // 1. Kiểm tra trong danh mục template tuỳ biến trên database nếu có
  if (customTemplates && shiftId) {
    const matched = customTemplates.find((t) => t.id === shiftId || t.name === shiftId)
    if (matched) {
      customStart = matched.start
      customEnd = matched.end
      customHours = matched.hours
    }
  }

  // 2. Kiểm tra trong 5 khung ca chuẩn Homies F&B
  if ((!customStart || !customEnd) && STANDARD_FNB_SHIFTS[shiftId]) {
    const std = STANDARD_FNB_SHIFTS[shiftId]
    customStart = std.start
    customEnd = std.end
    customHours = std.hours
  }

  // Fallback mặc định ca sáng nếu không tìm thấy
  if (!customStart) customStart = '08:30'
  if (!customEnd) customEnd = '12:00'

  const startMin = parseTimeToMinutes(customStart)
  let endMin = parseTimeToMinutes(customEnd)

  // Nếu ca kết thúc nhỏ hơn hoặc bằng giờ bắt đầu (ca xuyên đêm qua ngày hôm sau)
  if (endMin <= startMin) {
    endMin += 1440 // cộng thêm 24 tiếng = 1440 phút
  }

  const hours = customHours > 0 ? customHours : Math.round(((endMin - startMin) / 60) * 10) / 10

  return {
    startMin,
    endMin,
    startStr: customStart,
    endStr: customEnd,
    hours,
  }
}

/**
 * Kiểm tra 2 ca làm việc có bị trùng hoặc giao thoa khung giờ hay không.
 * Hai ca giao nhau khi: startA < endB && endA > startB
 */
export function checkShiftOverlap(
  shiftA: string | { id?: string; shift_id?: string; start?: string; end?: string },
  shiftB: string | { id?: string; shift_id?: string; start?: string; end?: string },
  customTemplates?: ServerShiftTemplate[]
): boolean {
  const rangeA = getShiftTimeRange(shiftA, customTemplates)
  const rangeB = getShiftTimeRange(shiftB, customTemplates)

  return rangeA.startMin < rangeB.endMin && rangeA.endMin > rangeB.startMin
}

/**
 * Tính số tiền phạt vi phạm đi trễ theo chính sách chuỗi Homies F&B:
 * - Trễ <= 15 phút: Miễn phạt (0đ)
 * - Trễ 16 - 30 phút: Phạt 50.000đ (Bậc 2)
 * - Trễ > 30 phút: Phạt 100.000đ (Bậc 3)
 */
export function calculateLatePenaltyAmount(lateMinutes: number): number {
  if (!lateMinutes || lateMinutes <= 15) return 0
  if (lateMinutes <= 30) return 50000
  return 100000
}

export { calculateDistance }

