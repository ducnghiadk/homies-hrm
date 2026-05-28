// ============================================
// HRM Tra Sua - Mock Data: Employee Extensions
// Import, Export, Offboarding, Invitations
// ============================================

export type InvitationStatus = 'draft' | 'sent' | 'submitted' | 'pending_approval' | 'approved' | 'needs_revision' | 'rejected' | 'expired' | 'cancelled'
export type InvitationSendStatus = 'not_sent' | 'sending' | 'sent_success' | 'sent_failed'
export type EmploymentType = 'full_time' | 'part_time' | 'seasonal' | 'intern'
export type ProbationPolicy = 'time_based' | 'milestone_based'
export type ProbationSalaryMode = 'fixed_amount' | 'percent_of_official'
export type EmployeeActivityAction =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'account_changed'
  | 'offboarding_completed'
  | 'imported'
  | 'approved_from_invitation'

export interface EmployeeActivityLog {
  id: string
  employee_id: string
  action: EmployeeActivityAction
  title: string
  detail: string
  actor_id?: string
  actor_name?: string
  created_at: string
}

export interface InvitationSendLog {
  id: string
  status: Exclude<InvitationSendStatus, 'not_sent'>
  attempted_at: string
  attempted_by?: string
  error?: string
  snapshot: string
}

export interface EmployeeInvitation {
  id: string
  full_name: string
  email: string
  phone: string
  hire_date?: string
  store_id: string
  position_id: string
  department_name?: string
  employee_type?: EmploymentType
  job_level?: string
  official_salary?: number
  kpi_salary?: number
  is_probationary?: boolean
  probation_policy?: ProbationPolicy
  probation_end_date?: string
  probation_salary_mode?: ProbationSalaryMode
  probation_salary_value?: number
  auto_complete_probation?: boolean
  role: string
  invited_by: string
  invited_at: string
  status: InvitationStatus
  notes?: string
  hr_notes?: string
  revision_request_note?: string
  confirmed_employee_id?: string
  email_subject?: string
  email_personal_note?: string
  email_deadline?: string
  email_support_name?: string
  email_support_info?: string
  send_status?: InvitationSendStatus
  send_attempt_count?: number
  last_sent_at?: string
  last_send_error?: string
  last_sent_by?: string
  send_logs?: InvitationSendLog[]
  email_template_version?: string
  email_preview_snapshot?: string
  public_access_token?: string
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other'
  address?: string
  cccd?: string
  emergency_contact?: string
  candidate_notes?: string
}

export interface InvitationFormData {
  full_name: string
  email: string
  phone: string
  hire_date?: string
  store_id: string
  position_id: string
  department_name?: string
  employee_type?: EmploymentType
  job_level?: string
  official_salary?: number
  kpi_salary?: number
  is_probationary?: boolean
  probation_policy?: ProbationPolicy
  probation_end_date?: string
  probation_salary_mode?: ProbationSalaryMode
  probation_salary_value?: number
  auto_complete_probation?: boolean
  role: string
  notes?: string
  email_subject?: string
  email_personal_note?: string
  email_deadline?: string
  email_support_name?: string
  email_support_info?: string
}

export const INITIAL_INVITATIONS: EmployeeInvitation[] = [
  {
    id: 'inv-001',
    full_name: 'Le Thi Hoa',
    email: 'hoa.le@email.com',
    phone: '0909888777',
    store_id: 'store-001',
    position_id: 'pos-001',
    role: 'employee',
    invited_by: 'emp-016',
    invited_at: '2026-02-20T10:00:00Z',
    status: 'sent',
    send_status: 'sent_success',
    send_attempt_count: 1,
    last_sent_at: '2026-02-20T10:00:00Z',
    last_sent_by: 'emp-016',
    send_logs: [
      {
        id: 'send-log-inv-001-1',
        status: 'sent_success',
        attempted_at: '2026-02-20T10:00:00Z',
        attempted_by: 'emp-016',
        snapshot: 'Mock email sent successfully to hoa.le@email.com',
      },
    ],
    notes: 'Ung vien gioi, co kinh nghiem pha che',
  },
  {
    id: 'inv-002',
    full_name: 'Nguyen Van An',
    email: 'an.nguyen@email.com',
    phone: '0911222333',
    store_id: 'store-002',
    position_id: 'pos-002',
    role: 'employee',
    invited_by: 'emp-016',
    invited_at: '2026-02-18T14:30:00Z',
    status: 'pending_approval',
    send_status: 'sent_success',
    send_attempt_count: 1,
    last_sent_at: '2026-02-18T14:30:00Z',
    last_sent_by: 'emp-016',
    send_logs: [
      {
        id: 'send-log-inv-002-1',
        status: 'sent_success',
        attempted_at: '2026-02-18T14:30:00Z',
        attempted_by: 'emp-016',
        snapshot: 'Mock email sent successfully to an.nguyen@email.com',
      },
    ],
    notes: 'Da dien thong tin, cho HR xac nhan',
  },
  {
    id: 'inv-003',
    full_name: 'Tran Minh Duc',
    email: 'duc.tran@email.com',
    phone: '0922333444',
    store_id: 'store-001',
    position_id: 'pos-003',
    role: 'shift_leader',
    invited_by: 'emp-002',
    invited_at: '2026-02-10T09:00:00Z',
    status: 'approved',
    send_status: 'sent_success',
    send_attempt_count: 1,
    last_sent_at: '2026-02-10T09:00:00Z',
    last_sent_by: 'emp-002',
    send_logs: [
      {
        id: 'send-log-inv-003-1',
        status: 'sent_success',
        attempted_at: '2026-02-10T09:00:00Z',
        attempted_by: 'emp-002',
        snapshot: 'Mock email sent successfully to duc.tran@email.com',
      },
    ],
    confirmed_employee_id: 'emp-007',
  },
]

export const getInvitationStatusLabel = (status: InvitationStatus): string => {
  const labels: Record<InvitationStatus, string> = {
    draft: 'Nhap',
    sent: 'Da gui',
    submitted: 'Da dien thong tin',
    pending_approval: 'Cho duyet',
    approved: 'Da xac nhan',
    needs_revision: 'Can bo sung',
    rejected: 'Tu choi',
    expired: 'Het han',
    cancelled: 'Da huy',
  }
  return labels[status] || status
}

export const getInvitationStatusColor = (status: InvitationStatus): string => {
  switch (status) {
    case 'draft': return 'bg-gray-100 text-gray-600'
    case 'sent': return 'bg-blue-100 text-blue-700'
    case 'submitted': return 'bg-yellow-100 text-yellow-700'
    case 'pending_approval': return 'bg-amber-100 text-amber-700'
    case 'approved': return 'bg-green-100 text-green-700'
    case 'needs_revision': return 'bg-purple-100 text-purple-700'
    case 'rejected': return 'bg-red-100 text-red-700'
    case 'expired': return 'bg-gray-200 text-gray-500'
    case 'cancelled': return 'bg-red-100 text-red-600'
    default: return 'bg-gray-100 text-gray-600'
  }
}

export const getInvitationSendStatusLabel = (status?: InvitationSendStatus): string => {
  switch (status) {
    case 'sending':
      return 'Dang gui'
    case 'sent_success':
      return 'Da gui mail'
    case 'sent_failed':
      return 'Gui loi'
    case 'not_sent':
    default:
      return 'Chua gui'
  }
}

export const getInvitationSendStatusColor = (status?: InvitationSendStatus): string => {
  switch (status) {
    case 'sending':
      return 'bg-blue-100 text-blue-700'
    case 'sent_success':
      return 'bg-green-100 text-green-700'
    case 'sent_failed':
      return 'bg-red-100 text-red-700'
    case 'not_sent':
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

export interface ImportTemplate {
  columns: { key: string; label: string; required: boolean; type: string; example: string }[]
}

export interface ImportValidationResult {
  row: number
  employee_name: string
  status: 'valid' | 'error' | 'warning'
  errors: string[]
  warnings: string[]
  data: Record<string, string>
}

export interface ExportColumn {
  key: string
  label: string
  selected: boolean
}

export type OffboardingRiskLevel = 'low' | 'medium' | 'high'
export type OffboardingHandoverStatus = 'ready' | 'watch' | 'blocked'

export interface OffboardingHandoverItem {
  id: string
  title: string
  owner_name: string
  status: OffboardingHandoverStatus
  summary: string
  due_date?: string
  risk_level?: OffboardingRiskLevel
}

export interface OffboardingHandoverSummary {
  coverage_percent: number
  pending_count: number
  blocked_count: number
  notes?: string
  items: OffboardingHandoverItem[]
}

export interface OffboardingChecklist {
  id: string
  employee_id: string
  employee_name: string
  employee_code?: string
  store_id?: string
  position_id?: string
  position: string
  last_day: string
  initiated_by: string
  status: 'in_progress' | 'completed'
  exit_type?: 'voluntary' | 'involuntary' | 'end_of_contract'
  reason?: string
  owner_name?: string
  owner_team?: string
  effective_date?: string
  notes?: string
  risk_level?: OffboardingRiskLevel
  risk_flags?: string[]
  initiated_at?: string
  handover_summary?: OffboardingHandoverSummary
  handover_items?: OffboardingResourceItem[]
  access_items?: OffboardingResourceItem[]
  finance_items?: OffboardingResourceItem[]
  schedule_items?: OffboardingScheduleItem[]
  steps: OffboardingStep[]
}

export interface OffboardingStep {
  id: string
  label: string
  description: string
  is_done: boolean
  category?: 'asset' | 'account' | 'payroll' | 'handover' | 'exit'
  owner_id?: string
  owner_name?: string
  due_date?: string
  risk_level?: OffboardingRiskLevel
  required?: boolean
  priority?: 'required' | 'recommended'
  blocker_note?: string
  done_by?: string
  done_at?: string
}

export interface OffboardingResourceItem {
  id: string
  label: string
  owner_name: string
  status: 'pending' | 'in_progress' | 'done' | 'blocked'
  note?: string
}

export interface OffboardingScheduleItem {
  id: string
  label: string
  due_date: string
  owner_name: string
  status: 'pending' | 'done'
  note?: string
}

export const importTemplate: ImportTemplate = {
  columns: [
    { key: 'full_name', label: 'Ho ten', required: true, type: 'text', example: 'Nguyen Van A' },
    { key: 'phone', label: 'So dien thoai', required: true, type: 'phone', example: '0901234567' },
    { key: 'email', label: 'Email', required: false, type: 'email', example: 'a@company.vn' },
    { key: 'date_of_birth', label: 'Ngay sinh', required: true, type: 'date', example: '1998-05-15' },
    { key: 'gender', label: 'Gioi tinh', required: true, type: 'enum:male,female', example: 'male' },
    { key: 'address', label: 'Dia chi', required: false, type: 'text', example: '123 ABC, Q.1' },
    { key: 'position', label: 'Vi tri', required: true, type: 'enum:pos-001,...', example: 'Pha che' },
    { key: 'store', label: 'Cua hang', required: true, type: 'enum:store-001,...', example: 'Homies Milk Tea Q.1' },
    { key: 'hire_date', label: 'Ngay vao', required: true, type: 'date', example: '2026-02-15' },
    { key: 'base_salary', label: 'Luong co ban', required: false, type: 'number', example: '5500000' },
  ],
}

export const mockImportResults: ImportValidationResult[] = [
  { row: 1, employee_name: 'Tran Van Hung', status: 'valid', errors: [], warnings: [], data: { full_name: 'Tran Van Hung', phone: '0911111111', position: 'Pha che', store: 'Homies Milk Tea Q.1', hire_date: '2026-03-01' } },
  { row: 2, employee_name: 'Le Thi Nga', status: 'valid', errors: [], warnings: ['Email trong'], data: { full_name: 'Le Thi Nga', phone: '0922222222', position: 'Thu ngan', store: 'Homies Milk Tea Q.3', hire_date: '2026-03-01' } },
  { row: 3, employee_name: '', status: 'error', errors: ['Thieu ho ten', 'Thieu SDT'], warnings: [], data: { full_name: '', phone: '', position: 'Phuc vu', store: 'Homies Milk Tea Q.1', hire_date: '2026-03-01' } },
  { row: 4, employee_name: 'Pham Minh Duc', status: 'valid', errors: [], warnings: [], data: { full_name: 'Pham Minh Duc', phone: '0944444444', position: 'Phuc vu', store: 'Homies Milk Tea Thu Duc', hire_date: '2026-03-01' } },
  { row: 5, employee_name: 'Ngo Thi Hoa', status: 'error', errors: ['SDT da ton tai (emp-008)'], warnings: [], data: { full_name: 'Ngo Thi Hoa', phone: '0945678901', position: 'Pha che', store: 'Homies Milk Tea Q.1', hire_date: '2026-03-01' } },
  { row: 6, employee_name: 'Vo Van Binh', status: 'valid', errors: [], warnings: [], data: { full_name: 'Vo Van Binh', phone: '0966666666', position: 'Pha che', store: 'Homies Milk Tea Q.3', hire_date: '2026-03-15' } },
]

export const exportColumns: ExportColumn[] = [
  { key: 'employee_code', label: 'Ma NV', selected: true },
  { key: 'full_name', label: 'Ho ten', selected: true },
  { key: 'phone', label: 'SDT', selected: true },
  { key: 'email', label: 'Email', selected: true },
  { key: 'position', label: 'Vi tri', selected: true },
  { key: 'store', label: 'Cua hang', selected: true },
  { key: 'status', label: 'Trang thai', selected: true },
  { key: 'hire_date', label: 'Ngay vao', selected: true },
  { key: 'date_of_birth', label: 'Ngay sinh', selected: false },
  { key: 'gender', label: 'Gioi tinh', selected: false },
  { key: 'address', label: 'Dia chi', selected: false },
  { key: 'base_salary', label: 'Luong CB', selected: false },
  { key: 'total_points', label: 'Diem tich luy', selected: false },
]

export const mockOffboardingChecklists: OffboardingChecklist[] = [
  {
    id: 'off-001',
    employee_id: 'emp-013',
    employee_name: 'Bui Van Phong',
    employee_code: 'BH-013',
    store_id: 'store-003',
    position_id: 'pos-002',
    position: 'Thu ngan',
    last_day: '2026-05-28',
    initiated_by: 'emp-016',
    initiated_at: '2026-05-21',
    status: 'in_progress',
    exit_type: 'voluntary',
    reason: 'Xin nghi de chuyen ve gan nha',
    owner_name: 'Hoang Thi Yen',
    owner_team: 'HR',
    effective_date: '2026-05-28',
    notes: 'Can doi soat tam ung va quyen camera truoc ngay cuoi.',
    risk_level: 'high',
    risk_flags: ['Con tam ung 1.200.000', 'Tai khoan camera cua hang chua thu hoi'],
    handover_summary: {
      coverage_percent: 67,
      pending_count: 2,
      blocked_count: 1,
      notes: 'Ban giao van hanh co 1 muc dang bi block do mat khau camera.',
      items: [
        {
          id: 'handover-off-001-1',
          title: 'Ban giao ngan thu',
          owner_name: 'Tran Thi Lan',
          status: 'watch',
          summary: 'Da doi soat 3/4 ca truc, con 1 ca cuoi tuan can xac nhan.',
          due_date: '2026-05-26',
          risk_level: 'medium',
        },
        {
          id: 'handover-off-001-2',
          title: 'Ban giao tai khoan camera va wifi',
          owner_name: 'Nguyen Minh Tuan',
          status: 'blocked',
          summary: 'Da doi mat khau chung, nhung thiet bi ca nhan van luu thong tin dang nhap.',
          due_date: '2026-05-25',
          risk_level: 'high',
        },
        {
          id: 'handover-off-001-3',
          title: 'Ban giao ghi chu khach quen',
          owner_name: 'Phan Quoc Anh',
          status: 'ready',
          summary: 'Da chuyen file note order va gio cao diem cho ca sau.',
          due_date: '2026-05-24',
          risk_level: 'low',
        },
      ],
    },
    handover_items: [
      { id: 'handover-01', label: 'Quy trinh dong mo ca', owner_name: 'Tran Thi Lan', status: 'done', note: 'Da ban giao cho shift lead thay the' },
      { id: 'handover-02', label: 'Khach no va uu dai rieng', owner_name: 'Hoang Thi Yen', status: 'in_progress', note: 'Con doi xac nhan 2 the thanh vien than quen' },
      { id: 'handover-03', label: 'Bang note order gio cao diem', owner_name: 'Phan Quoc Anh', status: 'done', note: 'Da chuyen file ghi chu' },
    ],
    access_items: [
      { id: 'access-01', label: 'POS va he thong bill', owner_name: 'Nguyen Minh Tuan', status: 'pending', note: 'Hen khoa sau ca toi cuoi' },
      { id: 'access-02', label: 'Camera va wifi noi bo', owner_name: 'Nguyen Minh Tuan', status: 'blocked', note: 'Can doi soat thiet bi dang luu mat khau' },
      { id: 'access-03', label: 'Nhom Zalo cua cua hang', owner_name: 'Tran Thi Lan', status: 'pending', note: 'Can remove sau ca cuoi cung' },
    ],
    finance_items: [
      { id: 'finance-01', label: 'Luong con lai', owner_name: 'Hoang Thi Yen', status: 'in_progress', note: 'Dang doi bang doi soat tam ung ban dem' },
      { id: 'finance-02', label: 'Phep nam chua dung', owner_name: 'Hoang Thi Yen', status: 'done', note: 'Khong con phep ton' },
      { id: 'finance-03', label: 'Khoan tam ung', owner_name: 'Hoang Thi Yen', status: 'pending', note: 'Con 1.200.000 chua doi soat xong' },
    ],
    schedule_items: [
      { id: 'schedule-01', label: 'Chot nguoi thay ca cuoi tuan', due_date: '2026-05-26', owner_name: 'Tran Thi Lan', status: 'pending', note: 'Can doi shift lead thay ca' },
      { id: 'schedule-02', label: 'Giao lich tuan sau cho nguoi thay', due_date: '2026-05-27', owner_name: 'Pham Thi Huong', status: 'done' },
      { id: 'schedule-03', label: 'Exit interview', due_date: '2026-05-27', owner_name: 'Hoang Thi Yen', status: 'pending', note: 'Cho xac nhan gio hen' },
    ],
    steps: [
      { id: 'os-001', label: 'Thu hoi dong phuc', description: '2 ao, 1 tap de, 1 non va 1 bang ten', is_done: true, category: 'asset', owner_id: 'emp-004', owner_name: 'Pham Thi Huong', due_date: '2026-05-24', risk_level: 'low', required: true, priority: 'required', done_by: 'emp-004', done_at: '2026-05-23' },
      { id: 'os-002', label: 'Thu hoi the nhan vien va khoa tu', description: 'The ID, khoa tu locker va ma vao kho', is_done: true, category: 'asset', owner_id: 'emp-002', owner_name: 'Tran Thi Lan', due_date: '2026-05-24', risk_level: 'medium', required: true, priority: 'required', done_by: 'emp-002', done_at: '2026-05-23' },
      { id: 'os-003', label: 'Tinh luong con lai va doi soat tam ung', description: 'Luong pro-rata, phep chua dung va khoan tam ung gan nhat', is_done: false, category: 'payroll', owner_id: 'emp-016', owner_name: 'Hoang Thi Yen', due_date: '2026-05-25', risk_level: 'high', required: true, priority: 'required', blocker_note: 'Con cho cua hang gui bang doi soat tam ung ban dem.' },
      { id: 'os-004', label: 'Thu hoi quyen he thong', description: 'Tat POS, camera, wifi noi bo va nhom chat van hanh', is_done: false, category: 'account', owner_id: 'emp-001', owner_name: 'Nguyen Minh Tuan', due_date: '2026-05-25', risk_level: 'high', required: true, priority: 'required', blocker_note: 'Can doi soat thiet bi dang luu mat khau wifi.' },
      { id: 'os-005', label: 'Tong hop ban giao cong viec', description: 'Chot quy trinh dang lam, ghi chu khach quen va luu y cho ca sau', is_done: false, category: 'handover', owner_id: 'emp-002', owner_name: 'Tran Thi Lan', due_date: '2026-05-26', risk_level: 'medium', required: true, priority: 'required' },
      { id: 'os-006', label: 'Exit interview', description: 'Ghi nhan ly do nghi va de xuat cai thien', is_done: false, category: 'exit', owner_id: 'emp-016', owner_name: 'Hoang Thi Yen', due_date: '2026-05-27', risk_level: 'low', required: false, priority: 'recommended' },
    ],
  },
  {
    id: 'off-002',
    employee_id: 'emp-007',
    employee_name: 'Dang Minh Khoa',
    employee_code: 'BH-007',
    store_id: 'store-001',
    position_id: 'pos-003',
    position: 'Truong ca thu viec',
    last_day: '2026-05-31',
    initiated_by: 'emp-002',
    initiated_at: '2026-05-22',
    status: 'in_progress',
    exit_type: 'end_of_contract',
    reason: 'Ket thuc thu viec som theo de nghi hai ben',
    owner_name: 'Tran Thi Lan',
    owner_team: 'Store Operations',
    effective_date: '2026-05-31',
    notes: 'Can chot nguoi thay 2 buoi training cuoi.',
    risk_level: 'medium',
    risk_flags: ['Con 2 buoi training chua chot nguoi thay'],
    handover_summary: {
      coverage_percent: 84,
      pending_count: 1,
      blocked_count: 0,
      notes: 'Ban giao van hanh gan xong, con chot ca training cuoi.',
      items: [
        {
          id: 'handover-off-002-1',
          title: 'Ban giao checklist mo ca',
          owner_name: 'Tran Thi Lan',
          status: 'ready',
          summary: 'Da ban giao file checklist mo ca va huong dan dem tien cuoi ngay.',
          due_date: '2026-05-24',
          risk_level: 'low',
        },
        {
          id: 'handover-off-002-2',
          title: 'Ban giao lich training nhan vien moi',
          owner_name: 'Pham Thi Huong',
          status: 'watch',
          summary: 'Con 1 buoi shadow ca toi can doi sang nguoi huong dan moi.',
          due_date: '2026-05-27',
          risk_level: 'medium',
        },
      ],
    },
    handover_items: [
      { id: 'handover-item-101', label: 'Checklist mo ca', owner_name: 'Tran Thi Lan', status: 'done' },
      { id: 'handover-item-102', label: 'Lich training nhan vien moi', owner_name: 'Pham Thi Huong', status: 'in_progress', note: 'Con 1 buoi shadow' },
    ],
    access_items: [
      { id: 'access-item-101', label: 'App noi bo va drive', owner_name: 'Hoang Thi Yen', status: 'pending' },
    ],
    finance_items: [
      { id: 'finance-item-101', label: 'Luong ngay cong thu viec', owner_name: 'Hoang Thi Yen', status: 'pending' },
    ],
    schedule_items: [
      { id: 'schedule-item-101', label: 'Chot nguoi day thay 2 buoi cuoi', due_date: '2026-05-27', owner_name: 'Tran Thi Lan', status: 'pending' },
    ],
    steps: [
      { id: 'os-101', label: 'Thu hoi tai san thu viec', description: 'Apron, bang ten va the cham cong tam', is_done: true, category: 'asset', owner_id: 'emp-004', owner_name: 'Pham Thi Huong', due_date: '2026-05-30', risk_level: 'low', required: true, priority: 'required', done_by: 'emp-004', done_at: '2026-05-23' },
      { id: 'os-102', label: 'Chot training dang do', description: 'Xac nhan tai lieu, video va nguoi nhan lai ca training', is_done: false, category: 'handover', owner_id: 'emp-002', owner_name: 'Tran Thi Lan', due_date: '2026-05-27', risk_level: 'medium', required: true, priority: 'required' },
      { id: 'os-103', label: 'Khoa quyen app noi bo', description: 'Tat quyen vao dashboard, nhom ca va file drive', is_done: false, category: 'account', owner_id: 'emp-016', owner_name: 'Hoang Thi Yen', due_date: '2026-05-31', risk_level: 'medium', required: true, priority: 'required' },
    ],
  },
]

export const getValidImportRows = () => mockImportResults.filter(r => r.status === 'valid')
export const getErrorImportRows = () => mockImportResults.filter(r => r.status === 'error')
export const getActiveOffboarding = () => mockOffboardingChecklists.filter(o => o.status === 'in_progress')
export const getOffboardingByEmployeeId = (employeeId: string) =>
  mockOffboardingChecklists.find(item => item.employee_id === employeeId)
