import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { calculateDistance } from '@/lib/utils'
import { hashPassword } from '@/lib/security/token-signer'
import {
  getStorageStatus,
  loadCollectionsFromSupabase,
  saveCollectionsToSupabase,
} from '@/lib/server/supabase-store'
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

export interface ServerOfficialSchedule {
  id: string
  store_id: string
  week_start_date: string // YYYY-MM-DD (Thứ 2 theo lịch dương thuần)
  date: string            // YYYY-MM-DD
  employee_id: string
  employee_name?: string
  shift_id: string
  shift_name?: string
  assigned_position_id?: string
  status: 'draft' | 'published'
  notes?: string
  modified_after_publish?: boolean
  change_reason?: string
  updated_by?: string
  updated_at: string
  created_at: string
}

export interface ServerScheduleWeekMeta {
  store_id: string
  week_start: string // YYYY-MM-DD (Thứ 2)
  week_end: string   // YYYY-MM-DD (Chủ Nhật)
  status: 'draft' | 'published'
  published_at?: string
  published_by?: string
  published_by_name?: string
  updated_at: string
  updated_by?: string
  last_modified_after_publish_at?: string
  source?: 'manual' | 'seeded_from_availability' | 'imported_excel' | 'copied_week'
}

export interface ServerScheduleChangeLog {
  id: string
  store_id: string
  week_start: string
  assignment_id: string
  employee_id: string
  employee_name?: string
  date: string
  shift_id?: string
  action: 'create' | 'update' | 'delete' | 'publish' | 'unpublish' | 'cancel' | 'seed_draft'
  reason?: string
  changed_by: string
  changed_by_name?: string
  changed_at: string
  before_state?: Partial<ServerOfficialSchedule> | null
  after_state?: Partial<ServerOfficialSchedule> | null
}

export interface ServerAttendanceLog {
  id: string
  employee_id: string
  employee_code?: string
  employee_name: string
  store_id: string
  store_name: string
  shift_id?: string
  shift_name?: string
  check_in_time: string
  check_out_time?: string
  check_in_lat: number
  check_in_lng: number
  check_out_lat?: number
  check_out_lng?: number
  check_in_distance_meters: number
  status: 'on_time' | 'late' | 'check_out' | 'checked_out' | 'missing_checkout' | 'working'
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

export interface ServerNotification {
  id: string
  title: string
  message: string
  type: string
  created_at: string
  is_read: boolean
  target_role?: string
  target_user_id?: string
  metadata?: Record<string, unknown>
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
  sample_value: unknown
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
  notification_config?: {
    enable_in_app: boolean
    enable_telegram: boolean
    telegram_bot_token?: string
    telegram_chat_id?: string
    enable_zalo_webhook?: boolean
    zalo_webhook_url?: string
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
  official_schedules?: ServerOfficialSchedule[]
  schedule_weeks?: ServerScheduleWeekMeta[]
  schedule_change_logs?: ServerScheduleChangeLog[]
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
  notifications?: ServerNotification[]
  sessions: Record<string, { userId: string; role: string; email: string; createdAt: string }>
}

const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'homies-data')
  : path.join(process.cwd(), 'data')
const DB_FILE = path.join(DATA_DIR, 'server-db.json')

const DEFAULT_SEED_PASSWORD = hashPassword('123456')

export function getInitialShiftsSeed(): ServerShiftRegistration[] {
  return []
}

export function getInitialAttendanceSeed(): ServerAttendanceLog[] {
  return []
}

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
      store_id: 'store-001',
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
      status: 'resigned',
      account_status: 'bi_khoa',
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
      status: 'resigned',
      account_status: 'bi_khoa',
      department_name: 'Vận hành cửa hàng',
      base_salary: 0,
      hourly_rate: 20000,
      hire_date: '2024-08-20',
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
      status: 'resigned',
      account_status: 'bi_khoa',
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
      store_id: 'store-001',
      position_id: 'pos-cashier',
      phone: '0963593319',
      employee_code: 'NV0034',
      status: 'resigned',
      account_status: 'bi_khoa',
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
      status: 'resigned',
      account_status: 'bi_khoa',
      department_name: 'Phục vụ & Phụ bar',
      base_salary: 0,
      hourly_rate: 20000,
      hire_date: '2025-07-15',
    },
    {
      id: 'emp-nv0040',
      full_name: 'Mai Thảo Uyên',
      email: 'maithaouyen@gmail.com',
      password: DEFAULT_SEED_PASSWORD,
      role: 'employee',
      store_id: 'store-001',
      position_id: 'pos-barista',
      phone: '0974410259',
      employee_code: 'NV0040',
      status: 'active',
      account_status: 'dang_hoat_dong',
      department_name: 'Pha chế & Barista',
      base_salary: 0,
      hourly_rate: 20000,
      hire_date: '2026-10-01',
    },
    {
      id: 'emp-nv0041',
      full_name: 'Nguyễn Huỳnh Thiên Ân',
      email: 'nhta.16508@gmail.com',
      password: DEFAULT_SEED_PASSWORD,
      role: 'employee',
      store_id: 'store-001',
      position_id: 'pos-barista',
      phone: '0931880253',
      employee_code: 'NV0041',
      status: 'active',
      account_status: 'dang_hoat_dong',
      department_name: 'Pha chế & Barista',
      base_salary: 0,
      hourly_rate: 20000,
      hire_date: '2026-10-01',
    },
    {
      id: 'emp-nv0036',
      full_name: 'Lê Văn Quý Phi',
      email: 'quyphi@gmail.com',
      password: DEFAULT_SEED_PASSWORD,
      role: 'employee',
      store_id: 'store-002',
      position_id: 'pos-barista',
      phone: '0777302197',
      employee_code: 'NV0036',
      status: 'active',
      account_status: 'dang_hoat_dong',
      department_name: 'Pha chế & Barista',
      base_salary: 0,
      hourly_rate: 20000,
      hire_date: '2026-10-01',
    },
    {
      id: 'emp-nv0039',
      full_name: 'Lê Trần Thảo Vy',
      email: 'thaovy@gmail.com',
      password: DEFAULT_SEED_PASSWORD,
      role: 'employee',
      store_id: 'store-002',
      position_id: 'pos-barista',
      phone: '0706637699',
      employee_code: 'NV0039',
      status: 'active',
      account_status: 'dang_hoat_dong',
      department_name: 'Pha chế & Barista',
      base_salary: 0,
      hourly_rate: 20000,
      hire_date: '2026-10-01',
    },
  ]

  const shifts: ServerShiftRegistration[] = getInitialShiftsSeed()

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
    official_schedules: [],
    schedule_weeks: [],
    schedule_change_logs: [],
    attendance: getInitialAttendanceSeed(),
    payroll_summaries,
    salary_slips,
    contracts: getInitialContractsSeed(),
    invitations: getInitialInvitationsSeed(),
    bsc_targets: getInitialBscTargetsSeed(),
    bsc_logs: getInitialBscLogsSeed(),
    bsc_settings: getInitialBscSettingsSeed(),
    incidents: getInitialIncidentsSeed(),
    sessions: {},
    ipos_integration: {
      is_enabled: true,
      api_endpoint: 'https://hrm.ipos.vn',
      username: 'nghianguyen.dk@gmail.com',
      token_or_password: 'Ducnghia1',
      store_codes: ['HBP', '429'],
      sync_schedule: 'every_2_hours',
      sync_attendance: true,
      sync_payroll: true,
      sync_employees: true,
      sync_shifts: true,
      sync_pos_revenue: false,
      sync_inventory: false,
      is_authenticated: true,
      last_sync_status: 'success',
      sync_logs: [],
      hrm_jwt_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im5naGlhbmd1eWVuLmRrQGdtYWlsLmNvbSIsImFjY291bnRfaWQiOiI5ZjExY2MzZC1lODRiLTQyZjktOTZiNS0xMDE1YTM5MDk1MWYiLCJlbXBsb3llZV9pZCI6Ijk5Yjg5YTQ0LWYwMzEtNGRjYS1iY2M1LWU5N2Q5OWQwOGEwZCIsImNvbXBhbnlfaWQiOiI3Y2VkMzYxYS1iODQ0LTQ0NzAtOGU5Ny01MjJhNzM2Njc2OWIiLCJsb2dpbl9ieSI6IklBTSIsImV4cCI6MTc5NjM0MjQ5OX0.kHGu53KlgCRJVsHAQe1TcoHrYz8ZuP8NEykyEjyDzJ4',
      hrm_user: {
        id: '9f11cc3d-e84b-42f9-96b5-1015a390951f',
        name: 'Nguyễn Đức Nghĩa',
        email: 'nghianguyen.dk@gmail.com',
        phone: '0981998122',
        role: 'Chủ thương hiệu',
      },
      hrm_company: {
        id: '7ced361a-b844-4470-8e97-522a7366769b',
        name: 'Trà Sữa Phô Mai Tươi Đài Loan Homies',
        code: 'GLRZ7YR81ZBE',
      },
    },
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
let lastCloudSyncAt: number = 0
const CLOUD_CACHE_TTL_MS = 15_000

const RESIGNED_CODES = new Set(['NV0024', 'NV0035', 'NV0009', 'NV0020', 'NV0034'])
const RESIGNED_IDS = new Set(['emp-nv0024', 'emp-nv0035', 'emp-nv0009', 'emp-nv0020', 'emp-nv0034'])
const RESIGNED_NAMES = new Set([
  'Tấn Hiếu',
  'Nguyễn Mạnh Duy',
  'Nguyễn Quỳnh',
  'Lê Minh Lộc',
  'Nguyễn Thị Kiều Trang',
  'Nguyễn Thị Thu',
])

function getDefaultIposIntegrationConfig(): ServerIposIntegrationConfig {
  return {
    is_enabled: true,
    api_endpoint: 'https://hrm.ipos.vn',
    username: 'nghianguyen.dk@gmail.com',
    token_or_password: 'Ducnghia1',
    store_codes: ['HBP', '429'],
    sync_schedule: 'every_2_hours',
    sync_attendance: true,
    sync_payroll: true,
    sync_employees: true,
    sync_shifts: true,
    sync_pos_revenue: false,
    sync_inventory: false,
    is_authenticated: true,
    last_sync_status: 'success',
    sync_logs: [],
    hrm_jwt_token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im5naGlhbmd1eWVuLmRrQGdtYWlsLmNvbSIsImFjY291bnRfaWQiOiI5ZjExY2MzZC1lODRiLTQyZjktOTZiNS0xMDE1YTM5MDk1MWYiLCJlbXBsb3llZV9pZCI6Ijk5Yjg5YTQ0LWYwMzEtNGRjYS1iY2M1LWU5N2Q5OWQwOGEwZCIsImNvbXBhbnlfaWQiOiI3Y2VkMzYxYS1iODQ0LTQ0NzAtOGU5Ny01MjJhNzM2Njc2OWIiLCJsb2dpbl9ieSI6IklBTSIsImV4cCI6MTc5NjM0MjQ5OX0.kHGu53KlgCRJVsHAQe1TcoHrYz8ZuP8NEykyEjyDzJ4',
    hrm_user: {
      id: '9f11cc3d-e84b-42f9-96b5-1015a390951f',
      name: 'Nguyễn Đức Nghĩa',
      email: 'nghianguyen.dk@gmail.com',
      phone: '0981998122',
      role: 'Chủ thương hiệu',
    },
    hrm_company: {
      id: '7ced361a-b844-4470-8e97-522a7366769b',
      name: 'Trà Sữa Phô Mai Tươi Đài Loan Homies',
      code: 'GLRZ7YR81ZBE',
    },
  }
}

const GENERIC_SHIFT_EMP_NAMES = new Set(['', 'nhân viên', 'nhân viên ipos', 'unknown'])
const STANDARD_SHIFT_IDS = new Set(['shift-001', 'shift-002', 'shift-003', 'shift-004', 'shift-005'])
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function normalizeShiftBucket(shiftId?: string, shiftName?: string, notes?: string): string {
  const cleanId = (shiftId || '').trim().toLowerCase()
  if (STANDARD_SHIFT_IDS.has(cleanId)) return cleanId
  const text = `${shiftName || ''} ${notes || ''}`.toLowerCase()
  if (text.includes('sáng') || text.includes('morning')) return 'shift-001'
  if (text.includes('trưa') || text.includes('chiều') || text.includes('afternoon')) return 'shift-002'
  if (text.includes('tối') || text.includes('đêm') || text.includes('evening') || text.includes('bếp')) return 'shift-003'
  return cleanId
}

function getShiftEmployeeIdentityKey(
  shift: Pick<ServerShiftRegistration, 'employee_id' | 'employee_name'>
): string {
  const cleanName = (shift.employee_name || '').trim().toLowerCase()
  if (!GENERIC_SHIFT_EMP_NAMES.has(cleanName)) {
    return `name:${cleanName}`
  }
  return `id:${(shift.employee_id || '').trim().toLowerCase()}`
}

export function normalizeStoreId(raw?: string): string {
  const clean = (raw || '').trim()
  const lower = clean.toLowerCase()
  if (lower === 'store-002' || lower.includes('429')) return 'store-002'
  if (lower === 'store-001' || lower.includes('hbp') || lower.includes('ba phan') || lower.includes('hồ bá phấn')) return 'store-001'
  return clean || 'store-001'
}

export function getCalendarWeekStart(ymd: string): string {
  const clean = (ymd || '').trim().slice(0, 10)
  const parts = clean.split('-').map(Number)
  if (parts.length !== 3 || parts.some(n => !Number.isFinite(n))) {
    return clean
  }
  const [year, month, day] = parts
  const dt = new Date(Date.UTC(year, month - 1, day))
  if (Number.isNaN(dt.getTime())) return clean
  const dow = dt.getUTCDay()
  dt.setUTCDate(dt.getUTCDate() - dow + (dow === 0 ? -6 : 1))
  return dt.toISOString().slice(0, 10)
}

export function getCalendarWeekEnd(weekStartYmd: string): string {
  const monday = getCalendarWeekStart(weekStartYmd)
  const parts = monday.split('-').map(Number)
  if (parts.length !== 3 || parts.some(n => !Number.isFinite(n))) {
    return monday
  }
  const [year, month, day] = parts
  const dt = new Date(Date.UTC(year, month - 1, day + 6))
  if (Number.isNaN(dt.getTime())) return monday
  return dt.toISOString().slice(0, 10)
}

export function isResignedEmployeeRecord(employeeId?: string, employeeName?: string): boolean {
  const cleanId = (employeeId || '').trim()
  const cleanName = (employeeName || '').trim()
  return Boolean(
    (cleanId && RESIGNED_IDS.has(cleanId)) ||
    (cleanName && RESIGNED_NAMES.has(cleanName))
  )
}

export function getShiftSlotDedupeKey(
  shift: Pick<
    ServerShiftRegistration,
    'store_id' | 'date' | 'shift_id' | 'shift_name' | 'notes' | 'employee_id' | 'employee_name'
  >
): string {
  const normStore = normalizeStoreId(shift.store_id)
  const normDate = (shift.date || '').slice(0, 10)
  const normShift = normalizeShiftBucket(shift.shift_id, shift.shift_name, shift.notes)
  const empKey = getShiftEmployeeIdentityKey(shift)
  return `${normStore}|${normDate}|${normShift}|${empKey}`
}

export function getOfficialScheduleSlotKey(
  item: Pick<ServerOfficialSchedule, 'store_id' | 'date' | 'employee_id' | 'shift_id' | 'shift_name' | 'notes'>
): string {
  const normStore = normalizeStoreId(item.store_id)
  const normDate = (item.date || '').slice(0, 10)
  const normEmp = (item.employee_id || '').trim().toLowerCase()
  const cleanShiftId = (item.shift_id || '').trim().toLowerCase()
  const notesText = (item.notes || '').trim()
  const timeMatch =
    notesText.match(/\[(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})\]/) ||
    notesText.match(/\((\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})\)/)
  const isFlex =
    cleanShiftId === 'shift-004' ||
    cleanShiftId.startsWith('shift-flex') ||
    notesText.toLowerCase().includes('linh hoạt') ||
    notesText.toLowerCase().includes('phát sinh') ||
    Boolean(timeMatch)

  const shiftKey = isFlex
    ? `${cleanShiftId}:${timeMatch ? timeMatch[1].replace(/\s+/g, '') : notesText.toLowerCase()}`
    : normalizeShiftBucket(item.shift_id, item.shift_name, item.notes)

  return `${normStore}|${normDate}|${normEmp}|${shiftKey}`
}

export function getWeekMetaInDb(
  db: ServerDatabaseSchema,
  storeId: string,
  weekStart: string
): ServerScheduleWeekMeta | undefined {
  const normStore = normalizeStoreId(storeId)
  const normWeekStart = getCalendarWeekStart(weekStart)
  return (db.schedule_weeks || []).find(
    (w) => normalizeStoreId(w.store_id) === normStore && getCalendarWeekStart(w.week_start) === normWeekStart
  )
}

export function isWeekPublishedInDb(
  db: ServerDatabaseSchema,
  storeId: string,
  weekStart: string
): boolean {
  return getWeekMetaInDb(db, storeId, weekStart)?.status === 'published'
}

function getShiftStatusRank(status?: string): number {
  const upper = (status || '').trim().toUpperCase()
  if (upper === 'APPROVED') return 3
  if (upper === 'PENDING') return 2
  if (upper === 'DRAFT') return 1
  if (upper === 'REJECTED') return 0
  return 1
}

function pickRealEmployeeName(primary?: string, secondary?: string): string | undefined {
  const pClean = (primary || '').trim().toLowerCase()
  if (primary && !GENERIC_SHIFT_EMP_NAMES.has(pClean)) return primary
  const sClean = (secondary || '').trim().toLowerCase()
  if (secondary && !GENERIC_SHIFT_EMP_NAMES.has(sClean)) return secondary
  return primary || secondary
}

function pickBetterShiftName(primary?: string, secondary?: string): string | undefined {
  const p = (primary || '').trim()
  const s = (secondary || '').trim()
  const pValid = Boolean(p) && !UUID_PATTERN.test(p)
  const sValid = Boolean(s) && !UUID_PATTERN.test(s)
  if (pValid && !sValid) return p
  if (sValid && !pValid) return s
  if (pValid && sValid) return s.length > p.length ? s : p
  return p || s || undefined
}

export function mergeShiftRecords(
  existing: ServerShiftRegistration,
  incoming: ServerShiftRegistration
): ServerShiftRegistration {
  const existingRank = getShiftStatusRank(existing.status)
  const incomingRank = getShiftStatusRank(incoming.status)

  let primary = existing
  let secondary = incoming

  if (incomingRank > existingRank) {
    primary = incoming
    secondary = existing
  } else if (incomingRank === existingRank) {
    const existingScore = (existing.notes?.trim() ? 2 : 0) + (existing.approved_at ? 1 : 0)
    const incomingScore = (incoming.notes?.trim() ? 2 : 0) + (incoming.approved_at ? 1 : 0)
    if (incomingScore > existingScore) {
      primary = incoming
      secondary = existing
    }
  }

  return {
    ...secondary,
    ...primary,
    employee_name: pickRealEmployeeName(primary.employee_name, secondary.employee_name),
    shift_name: pickBetterShiftName(primary.shift_name, secondary.shift_name),
    position_id: primary.position_id || secondary.position_id,
    approved_by: primary.approved_by || secondary.approved_by,
    approved_at: primary.approved_at || secondary.approved_at,
    notes: primary.notes?.trim() ? primary.notes : secondary.notes,
  }
}

export function isFakeSeedShift(shift: Pick<ServerShiftRegistration, 'id' | 'notes'>): boolean {
  const id = (shift.id || '').trim().toLowerCase()
  return id.startsWith('sch-seed-')
}

export function dedupeServerShifts(shifts: ServerShiftRegistration[]): {
  shifts: ServerShiftRegistration[]
  changed: boolean
} {
  const seenRejectedIds = new Set<string>()
  const slotIndexMap = new Map<string, number>()
  const result: ServerShiftRegistration[] = []
  let changed = false

  for (const shift of shifts) {
    if (isFakeSeedShift(shift)) {
      changed = true
      continue
    }
    if ((shift.status || '').trim().toUpperCase() === 'REJECTED') {
      if (seenRejectedIds.has(shift.id)) {
        changed = true
        continue
      }
      seenRejectedIds.add(shift.id)
      result.push(shift)
      continue
    }

    const slotKey = getShiftSlotDedupeKey(shift)
    const existingIdx = slotIndexMap.get(slotKey)
    if (existingIdx !== undefined) {
      result[existingIdx] = mergeShiftRecords(result[existingIdx], shift)
      changed = true
    } else {
      slotIndexMap.set(slotKey, result.length)
      result.push(shift)
    }
  }

  return { shifts: result, changed }
}

export function dedupeOfficialSchedules(items: ServerOfficialSchedule[]): {
  schedules: ServerOfficialSchedule[]
  changed: boolean
} {
  const slotIndexMap = new Map<string, number>()
  const result: ServerOfficialSchedule[] = []
  let changed = false

  for (const raw of items) {
    if (!raw || !raw.employee_id || !raw.date || !raw.shift_id) {
      changed = true
      continue
    }
    if (isFakeSeedShift(raw) || isResignedEmployeeRecord(raw.employee_id, raw.employee_name)) {
      changed = true
      continue
    }

    const normStore = normalizeStoreId(raw.store_id)
    const normDate = raw.date.slice(0, 10)
    const normWeekStart = getCalendarWeekStart(normDate)
    const normStatus: 'draft' | 'published' = raw.status === 'published' ? 'published' : 'draft'

    const normalized: ServerOfficialSchedule = {
      ...raw,
      store_id: normStore,
      date: normDate,
      week_start_date: normWeekStart,
      status: normStatus,
    }
    if (
      normalized.store_id !== raw.store_id ||
      normalized.date !== raw.date ||
      normalized.week_start_date !== raw.week_start_date ||
      normalized.status !== raw.status
    ) {
      changed = true
    }

    const slotKey = getOfficialScheduleSlotKey(normalized)
    const existingIdx = slotIndexMap.get(slotKey)
    if (existingIdx !== undefined) {
      const existing = result[existingIdx]
      const incomingWins =
        (normalized.status === 'published' && existing.status !== 'published') ||
        (normalized.status === existing.status &&
          String(normalized.updated_at || '') >= String(existing.updated_at || ''))
      if (incomingWins) {
        result[existingIdx] = {
          ...existing,
          ...normalized,
          id: existing.id || normalized.id,
        }
      }
      changed = true
    } else {
      slotIndexMap.set(slotKey, result.length)
      result.push(normalized)
    }
  }

  return { schedules: result, changed }
}

export function dedupeScheduleWeeks(items: ServerScheduleWeekMeta[]): {
  weeks: ServerScheduleWeekMeta[]
  changed: boolean
} {
  const weekIndexMap = new Map<string, number>()
  const result: ServerScheduleWeekMeta[] = []
  let changed = false

  for (const raw of items) {
    if (!raw || !raw.week_start) {
      changed = true
      continue
    }
    const normStore = normalizeStoreId(raw.store_id)
    const normWeekStart = getCalendarWeekStart(raw.week_start)
    const normWeekEnd = getCalendarWeekEnd(normWeekStart)
    const normStatus: 'draft' | 'published' = raw.status === 'published' ? 'published' : 'draft'
    const normalized: ServerScheduleWeekMeta = {
      ...raw,
      store_id: normStore,
      week_start: normWeekStart,
      week_end: normWeekEnd,
      status: normStatus,
    }
    if (
      normalized.store_id !== raw.store_id ||
      normalized.week_start !== raw.week_start ||
      normalized.week_end !== raw.week_end ||
      normalized.status !== raw.status
    ) {
      changed = true
    }

    const key = `${normStore}|${normWeekStart}`
    const existingIdx = weekIndexMap.get(key)
    if (existingIdx !== undefined) {
      const existing = result[existingIdx]
      const incomingWins =
        (normalized.status === 'published' &&
          existing.status === 'published' &&
          String(normalized.published_at || normalized.updated_at || '') >=
            String(existing.published_at || existing.updated_at || '')) ||
        String(normalized.updated_at || '') >= String(existing.updated_at || '')
      if (incomingWins) {
        result[existingIdx] = normalized
      }
      changed = true
    } else {
      weekIndexMap.set(key, result.length)
      result.push(normalized)
    }
  }

  return { weeks: result, changed }
}

function normalizeServerDb(db: ServerDatabaseSchema): { db: ServerDatabaseSchema; migrated: boolean } {
  let migrated = false

  if (!db.contracts) db.contracts = getInitialContractsSeed()
  if (!db.invitations || db.invitations.length === 0) db.invitations = getInitialInvitationsSeed()
  if (!db.bsc_targets || db.bsc_targets.length === 0) db.bsc_targets = getInitialBscTargetsSeed()
  if (!db.bsc_logs || db.bsc_logs.length === 0) db.bsc_logs = getInitialBscLogsSeed()
  if (!db.bsc_settings) db.bsc_settings = getInitialBscSettingsSeed()
  if (!db.shifts) db.shifts = []
  if (!Array.isArray(db.official_schedules)) db.official_schedules = []
  if (!Array.isArray(db.schedule_weeks)) db.schedule_weeks = []
  if (!Array.isArray(db.schedule_change_logs)) db.schedule_change_logs = []
  if (!db.attendance) db.attendance = []
  if (!db.sessions) db.sessions = {}
  if (!db.ipos_integration) db.ipos_integration = getDefaultIposIntegrationConfig()
  if (!db.incidents || db.incidents.length === 0) db.incidents = getInitialIncidentsSeed()

  db.incidents.forEach((inc) => {
    if ((inc.status as string) === 'pending') {
      inc.status = 'proposed'
    }
  })

  if (db.employees) {
    db.employees.forEach((emp) => {
      if (emp.password && !emp.password.startsWith('pbkdf2:')) {
        emp.password = hashPassword(emp.password)
        migrated = true
      }

      if (emp.id === 'emp-bh9852' || emp.employee_code === 'BH-9852' || emp.full_name === 'Huỳnh Lê Kiều Linh') {
        if (emp.status !== 'active' || emp.account_status !== 'dang_hoat_dong' || emp.store_id !== 'store-001') {
          emp.status = 'active'
          emp.account_status = 'dang_hoat_dong'
          emp.store_id = 'store-001'
          migrated = true
        }
      } else if (
        RESIGNED_IDS.has(emp.id) ||
        (emp.employee_code && RESIGNED_CODES.has(emp.employee_code)) ||
        (emp.full_name && RESIGNED_NAMES.has(emp.full_name))
      ) {
        if (emp.status !== 'resigned' || emp.account_status !== 'bi_khoa') {
          emp.status = 'resigned'
          emp.account_status = 'bi_khoa'
          migrated = true
        }
      }
    })
  }

  const prevShiftsCount = db.shifts.length
  db.shifts = db.shifts.filter(
    s => !isResignedEmployeeRecord(s.employee_id, s.employee_name)
  )
  if (db.shifts.length !== prevShiftsCount) migrated = true

  const dedupedShifts = dedupeServerShifts(db.shifts)
  if (dedupedShifts.changed) {
    db.shifts = dedupedShifts.shifts
    migrated = true
  }

  const dedupedOfficial = dedupeOfficialSchedules(db.official_schedules)
  if (dedupedOfficial.changed) {
    db.official_schedules = dedupedOfficial.schedules
    migrated = true
  }

  const dedupedWeeks = dedupeScheduleWeeks(db.schedule_weeks)
  if (dedupedWeeks.changed) {
    db.schedule_weeks = dedupedWeeks.weeks
    migrated = true
  }

  const prevAttCount = db.attendance.length
  db.attendance = db.attendance.filter(
    a =>
      !RESIGNED_IDS.has(a.employee_id) &&
      (!a.employee_code || !RESIGNED_CODES.has(a.employee_code)) &&
      (!a.employee_name || !RESIGNED_NAMES.has(a.employee_name))
  )
  if (db.attendance.length !== prevAttCount) migrated = true

  return { db, migrated }
}

async function loadLocalDbBaseline(): Promise<ServerDatabaseSchema> {
  try {
    const raw = await fs.readFile(DB_FILE, 'utf-8')
    return JSON.parse(raw) as ServerDatabaseSchema
  } catch {
    try {
      const bundledPath = path.join(process.cwd(), 'data', 'server-db.json')
      const bundledData = await fs.readFile(bundledPath, 'utf-8')
      const initial = JSON.parse(bundledData) as ServerDatabaseSchema
      if (!initial.shifts || initial.shifts.length < 20) initial.shifts = getInitialShiftsSeed()
      if (!initial.attendance || initial.attendance.length < 50) initial.attendance = getInitialAttendanceSeed()
      return initial
    } catch {
      return getInitialSeedData()
    }
  }
}

async function mirrorDbToLocalFile(db: ServerDatabaseSchema): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf-8')
    const stat = await fs.stat(DB_FILE).catch(() => null)
    if (stat) lastMtime = stat.mtimeMs
  } catch {
    // Bỏ qua lỗi ghi đĩa trên môi trường serverless, inMemoryCache / Supabase vẫn giữ dữ liệu
  }
}

export async function getServerDb(): Promise<ServerDatabaseSchema> {
  // 1. Fast path khi bộ nhớ đệm đám mây còn tươi (trong 15 giây)
  if (inMemoryCache && lastCloudSyncAt > 0 && Date.now() - lastCloudSyncAt < CLOUD_CACHE_TTL_MS) {
    return normalizeServerDb(inMemoryCache).db
  }

  // 2. Ưu tiên đọc từ Supabase Cloud khi cấu hình sống (bền vững cho Vercel Serverless)
  const cloudRes = await loadCollectionsFromSupabase({
    hasLocalCache: Boolean(inMemoryCache),
  })
  if (cloudRes.ok) {
    if (cloudRes.unchanged && inMemoryCache) {
      lastCloudSyncAt = Date.now()
      return normalizeServerDb(inMemoryCache).db
    }

    if (cloudRes.partial && inMemoryCache && cloudRes.collections) {
      const mergedPartial = Object.assign({}, inMemoryCache, cloudRes.collections) as ServerDatabaseSchema
      const { db, migrated } = normalizeServerDb(mergedPartial)
      inMemoryCache = db
      lastCloudSyncAt = Date.now()
      await mirrorDbToLocalFile(db)
      if (migrated) {
        await saveCollectionsToSupabase(db as unknown as Record<string, unknown>)
      }
      return inMemoryCache
    }

    if (!cloudRes.empty && cloudRes.collections) {
      const merged = Object.assign({}, getInitialSeedData(), cloudRes.collections) as ServerDatabaseSchema
      const { db, migrated } = normalizeServerDb(merged)
      inMemoryCache = db
      lastCloudSyncAt = Date.now()
      await mirrorDbToLocalFile(db)
      if (migrated) {
        await saveCollectionsToSupabase(db as unknown as Record<string, unknown>)
      }
      return inMemoryCache
    }

    // Bảng trên Supabase mới tạo còn trống -> tự động nạp dữ liệu nền ban đầu lên Đám Mây
    const baseline = await loadLocalDbBaseline()
    const { db } = normalizeServerDb(baseline)
    await saveCollectionsToSupabase(db as unknown as Record<string, unknown>, { forceAll: true })
    inMemoryCache = db
    lastCloudSyncAt = Date.now()
    await mirrorDbToLocalFile(db)
    return inMemoryCache
  }

  // 3. Dự phòng file nội bộ (khi chạy local không có mạng / Supabase chưa cấu hình)
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    const stat = await fs.stat(DB_FILE).catch(() => null)
    if (inMemoryCache && stat && stat.mtimeMs === lastMtime) {
      return normalizeServerDb(inMemoryCache).db
    }

    const data = await fs.readFile(DB_FILE, 'utf-8')
    const parsed = JSON.parse(data) as ServerDatabaseSchema
    const { db, migrated } = normalizeServerDb(parsed)
    inMemoryCache = db

    if (migrated) {
      await saveServerDb(inMemoryCache)
    }
    if (stat) lastMtime = stat.mtimeMs
    return inMemoryCache
  } catch {
    const initial = await loadLocalDbBaseline()
    const { db } = normalizeServerDb(initial)
    inMemoryCache = db
    await mirrorDbToLocalFile(inMemoryCache)
    return inMemoryCache
  }
}

export interface SaveServerDbResult {
  ok: boolean
  cloudSynced: boolean
  cloudRequired: boolean
  reason?: string
}

export async function saveServerDb(db: ServerDatabaseSchema): Promise<SaveServerDbResult> {
  inMemoryCache = db
  await mirrorDbToLocalFile(db)
  let synced = await saveCollectionsToSupabase(db as unknown as Record<string, unknown>)

  if (!synced) {
    const statusBeforeRetry = await getStorageStatus()
    if (statusBeforeRetry.status !== 'unconfigured') {
      await new Promise((resolve) => setTimeout(resolve, 400))
      synced = await saveCollectionsToSupabase(db as unknown as Record<string, unknown>, {
        forceAll: true,
      })
    }
  }

  if (synced) {
    lastCloudSyncAt = Date.now()
  }

  const finalStatus = synced ? null : await getStorageStatus()
  const cloudRequired = Boolean(process.env.VERCEL)
  return {
    ok: !cloudRequired || synced,
    cloudSynced: synced,
    cloudRequired,
    reason: synced ? undefined : finalStatus?.reason,
  }
}

export function clearServerDbCache(): void {
  inMemoryCache = null
  lastMtime = 0
  lastCloudSyncAt = 0
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

