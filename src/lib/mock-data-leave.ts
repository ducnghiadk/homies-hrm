// ============================================
// HRM Trà Sữa 🧋 — Leave Management Data Layer
// Types, Mock Data, Validation, Helpers
// ============================================

// ─── LEAVE TYPES ───
export type LeaveType =
  | 'annual'       // Phép năm
  | 'sick'         // Nghỉ ốm
  | 'unpaid'       // Không lương
  | 'wedding'      // Nghỉ cưới
  | 'bereavement'  // Nghỉ tang
  | 'maternity'    // Thai sản
  | 'personal'     // Việc riêng

export type LeaveStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled'

// ─── LEAVE TYPE INFO (config) ───
export interface LeaveTypeInfo {
  type: LeaveType
  name: string
  icon: string
  isPaid: boolean
  defaultQuota: number        // ngày/năm (0 = không giới hạn)
  requiresDocument: boolean
  requiresDocumentAfterDays: number
  color: string               // tailwind-compatible color key
  colorHex: string            // hex for inline styles
  description: string
}

// ─── LEAVE REQUEST ───
export interface LeaveRequest {
  id: string
  employee_id: string
  employee_name: string
  employee_avatar?: string
  employee_position: string
  store_id: string

  leave_type: LeaveType
  leave_type_label: string
  status: LeaveStatus

  start_date: string          // ISO date
  end_date: string            // ISO date
  days: number
  isHalfDay: boolean
  halfDayPeriod?: 'morning' | 'afternoon'

  reason: string
  document_url?: string

  created_at: string
  updated_at: string

  // Approval
  approver_id?: string
  approver_name?: string
  approved_at?: string
  rejected_at?: string
  approver_comment?: string

  // Conflict
  hasScheduleConflict: boolean
  conflictingShifts?: { shiftId: string; date: string; time: string; position: string }[]
}

// ─── QUOTA ───
export interface QuotaDetail {
  total: number
  used: number
  pending: number
  remaining: number
  expiryDate?: string         // ISO date when quota expires
}

export interface LeaveQuota {
  employee_id: string
  employee_name: string
  year: number
  quotas: Record<LeaveType, QuotaDetail>
}

// ─── LEAVE BALANCE (legacy compat) ───
export interface LeaveBalance {
  employee_id: string
  employee_name: string
  balances: { type: LeaveType; label: string; total: number; used: number; remaining: number }[]
}

// ─── CALENDAR ───
export interface LeaveCalendarEntry {
  date: string
  employee_id: string
  employee_name: string
  leave_type: LeaveType
  color: string
}

// ─── POLICY ───
export interface LeavePolicy {
  id: string
  leave_type: LeaveType
  label: string
  base_days: number
  seniority_bonus: number
  max_carry_over: number
  allow_advance: boolean
  max_advance_days: number
  require_document: boolean
  min_notice_days: number
}

// ─── BLACKOUT DATES ───
export interface BlackoutDate {
  date: string                // ISO date
  reason: string
  isStrict: boolean           // true = cấm hoàn toàn
}

// ─── VALIDATION ───
export interface ValidationError {
  field: string
  code: 'INSUFFICIENT_QUOTA' | 'INVALID_DATE' | 'PAST_DATE' | 'OVERLAP_EXISTING' | 'BLACKOUT_DATE'
  message: string
}

export interface ValidationWarning {
  code: 'SCHEDULE_CONFLICT' | 'PEAK_PERIOD' | 'SHORT_NOTICE' | 'CONSECUTIVE_LEAVE'
  message: string
  severity: 'low' | 'medium' | 'high'
  suggestion?: string
}

export interface LeaveValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

// ─── STATS ───
export interface LeaveStats {
  totalRequests: number
  pending: number
  approved: number
  rejected: number
  upcomingLeaves: number      // trong 7 ngày tới
  onLeaveToday: number
}

// ─── FILTER ───
export interface LeaveFilter {
  status?: LeaveStatus[]
  type?: LeaveType[]
  employeeId?: string
  searchQuery?: string
}

// ─── NOTIFICATION ───
export interface LeaveNotification {
  id: string
  type: 'request_submitted' | 'request_approved' | 'request_rejected' | 'reminder' | 'conflict_alert'
  requestId: string
  recipientId: string
  message: string
  createdAt: string
  readAt?: string
}

// ═══════════════════════════════════════════
// CONFIG: Leave Types
// ═══════════════════════════════════════════

export const LEAVE_TYPES: LeaveTypeInfo[] = [
  {
    type: 'annual', name: 'Phép năm', icon: '🏖️',
    isPaid: true, defaultQuota: 12,
    requiresDocument: false, requiresDocumentAfterDays: 0,
    color: 'blue', colorHex: '#2F6FA8',
    description: 'Nghỉ phép có lương theo luật lao động'
  },
  {
    type: 'sick', name: 'Nghỉ ốm', icon: '🏥',
    isPaid: true, defaultQuota: 30,
    requiresDocument: true, requiresDocumentAfterDays: 3,
    color: 'red', colorHex: '#D9381E',
    description: 'Cần giấy bác sĩ nếu nghỉ trên 3 ngày'
  },
  {
    type: 'unpaid', name: 'Không lương', icon: '📝',
    isPaid: false, defaultQuota: 0,
    requiresDocument: false, requiresDocumentAfterDays: 0,
    color: 'gray', colorHex: '#6b7280',
    description: 'Nghỉ không hưởng lương, cần phê duyệt'
  },
  {
    type: 'wedding', name: 'Nghỉ cưới', icon: '💒',
    isPaid: true, defaultQuota: 3,
    requiresDocument: true, requiresDocumentAfterDays: 0,
    color: 'pink', colorHex: '#ec4899',
    description: 'Bản thân kết hôn (3 ngày)'
  },
  {
    type: 'bereavement', name: 'Nghỉ tang', icon: '🕯️',
    isPaid: true, defaultQuota: 3,
    requiresDocument: false, requiresDocumentAfterDays: 0,
    color: 'slate', colorHex: '#475569',
    description: 'Tùy quan hệ: cha mẹ 3 ngày, anh chị em 1 ngày'
  },
  {
    type: 'maternity', name: 'Thai sản', icon: '👶',
    isPaid: true, defaultQuota: 180,
    requiresDocument: true, requiresDocumentAfterDays: 0,
    color: 'purple', colorHex: '#a855f7',
    description: '6 tháng theo luật lao động'
  },
  {
    type: 'personal', name: 'Việc riêng', icon: '🏠',
    isPaid: false, defaultQuota: 3,
    requiresDocument: false, requiresDocumentAfterDays: 0,
    color: 'amber', colorHex: '#F6C85F',
    description: 'Việc gia đình đột xuất'
  },
]

export const LEAVE_TYPE_MAP = Object.fromEntries(
  LEAVE_TYPES.map(t => [t.type, t])
) as Record<LeaveType, LeaveTypeInfo>

// Status config
export const STATUS_CONFIG: Record<LeaveStatus, { label: string; color: string; icon: string }> = {
  draft:     { label: 'Nháp',       color: '#9ca3af', icon: '📄' },
  pending:   { label: 'Chờ duyệt',  color: '#F6C85F', icon: '⏳' },
  approved:  { label: 'Đã duyệt',   color: '#1E9E57', icon: '✅' },
  rejected:  { label: 'Từ chối',    color: '#D9381E', icon: '❌' },
  cancelled: { label: 'Đã hủy',     color: '#9ca3af', icon: '🚫' },
}

// ═══════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════

export const mockLeaveRequests: LeaveRequest[] = []

// ═══════════════════════════════════════════
// QUOTAS
// ═══════════════════════════════════════════

const emptyQuota = (total: number): QuotaDetail =>
  ({ total, used: 0, pending: 0, remaining: total })

export const mockLeaveQuotas: LeaveQuota[] = []

// ═══════════════════════════════════════════
// BLACKOUT DATES
// ═══════════════════════════════════════════

export const mockBlackoutDates: BlackoutDate[] = [
  { date: '2026-02-27', reason: 'Tết Nguyên Đán (cao điểm)', isStrict: true },
  { date: '2026-02-28', reason: 'Tết Nguyên Đán (cao điểm)', isStrict: true },
  { date: '2026-04-30', reason: 'Nghỉ lễ 30/4 (cao điểm)', isStrict: false },
  { date: '2026-05-01', reason: 'Nghỉ lễ 1/5 (cao điểm)', isStrict: false },
  { date: '2026-12-24', reason: 'Giáng sinh (cao điểm)', isStrict: false },
  { date: '2026-12-31', reason: 'Giao thừa (cao điểm)', isStrict: true },
]

// ═══════════════════════════════════════════
// CALENDAR (expanded for consistency)
// ═══════════════════════════════════════════

const leaveTypeColors: Record<LeaveType, string> = {
  annual: '#2F6FA8', sick: '#D9381E', personal: '#F6C85F',
  maternity: '#a855f7', unpaid: '#6b7280',
  wedding: '#ec4899', bereavement: '#475569',
}

export const mockLeaveCalendar: LeaveCalendarEntry[] = []

// ═══════════════════════════════════════════
// POLICIES
// ═══════════════════════════════════════════

export const mockLeavePolicies: LeavePolicy[] = [
  { id: 'lp-001', leave_type: 'annual',      label: 'Phép năm',    base_days: 12, seniority_bonus: 1, max_carry_over: 5,  allow_advance: true,  max_advance_days: 3, require_document: false, min_notice_days: 3 },
  { id: 'lp-002', leave_type: 'sick',         label: 'Nghỉ ốm',    base_days: 30, seniority_bonus: 0, max_carry_over: 0,  allow_advance: false, max_advance_days: 0, require_document: true,  min_notice_days: 0 },
  { id: 'lp-003', leave_type: 'personal',     label: 'Việc riêng',  base_days: 3,  seniority_bonus: 0, max_carry_over: 0,  allow_advance: false, max_advance_days: 0, require_document: false, min_notice_days: 1 },
  { id: 'lp-004', leave_type: 'maternity',    label: 'Thai sản',    base_days: 180,seniority_bonus: 0, max_carry_over: 0,  allow_advance: false, max_advance_days: 0, require_document: true,  min_notice_days: 30 },
  { id: 'lp-005', leave_type: 'unpaid',       label: 'Không lương', base_days: 0,  seniority_bonus: 0, max_carry_over: 0,  allow_advance: false, max_advance_days: 0, require_document: false, min_notice_days: 7 },
  { id: 'lp-006', leave_type: 'wedding',      label: 'Nghỉ cưới',  base_days: 3,  seniority_bonus: 0, max_carry_over: 0,  allow_advance: false, max_advance_days: 0, require_document: true,  min_notice_days: 7 },
  { id: 'lp-007', leave_type: 'bereavement',  label: 'Nghỉ tang',  base_days: 3,  seniority_bonus: 0, max_carry_over: 0,  allow_advance: false, max_advance_days: 0, require_document: false, min_notice_days: 0 },
]

// ═══════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════

export function getLeaveStats(requests: LeaveRequest[] = mockLeaveRequests): LeaveStats {
  const today = new Date().toISOString().split('T')[0]
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

  return {
    totalRequests: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    onLeaveToday: requests.filter(r =>
      r.status === 'approved' && r.start_date <= today && r.end_date >= today
    ).length,
    upcomingLeaves: requests.filter(r =>
      r.status === 'approved' && r.start_date > today && r.start_date <= nextWeek
    ).length,
  }
}

export function getMyQuota(employeeId: string): LeaveQuota | undefined {
  const found = mockLeaveQuotas.find(q => q.employee_id === employeeId)
  if (found) return found
  return {
    employee_id: employeeId,
    employee_name: '',
    year: new Date().getFullYear(),
    quotas: {
      annual: { total: 12, used: 0, pending: 0, remaining: 12, expiryDate: `${new Date().getFullYear()}-12-31` },
      sick: { total: 30, used: 0, pending: 0, remaining: 30 },
      unpaid: { total: 0, used: 0, pending: 0, remaining: 999 },
      wedding: emptyQuota(3),
      bereavement: emptyQuota(3),
      maternity: emptyQuota(180),
      personal: { total: 3, used: 0, pending: 0, remaining: 3 },
    },
  }
}

export function getMyRequests(employeeId: string): LeaveRequest[] {
  return mockLeaveRequests.filter(r => r.employee_id === employeeId)
}

export function getPendingLeaveRequests(): LeaveRequest[] {
  return mockLeaveRequests.filter(r => r.status === 'pending')
}

export function getBalanceByEmployee(empId: string) {
  return mockLeaveQuotas.find(q => q.employee_id === empId)
}

export function getLeaveCalendarByMonth(month: string) {
  return mockLeaveCalendar.filter(e => e.date.startsWith(month))
}

export function getConflictsOnDate(date: string) {
  return mockLeaveCalendar.filter(e => e.date === date)
}

export function calculateBusinessDays(start: string, end: string): number {
  const s = new Date(start)
  const e = new Date(end)
  let count = 0
  const current = new Date(s)
  while (current <= e) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) count++ // skip weekends
    current.setDate(current.getDate() + 1)
  }
  return count
}

export function validateLeaveRequest(
  request: Partial<LeaveRequest>,
  quota: LeaveQuota | undefined,
  existingRequests: LeaveRequest[] = mockLeaveRequests,
  blackouts: BlackoutDate[] = mockBlackoutDates,
): LeaveValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Check dates
  if (!request.start_date || !request.end_date) {
    errors.push({ field: 'dates', code: 'INVALID_DATE', message: 'Vui lòng chọn ngày nghỉ' })
  } else {
    const today = new Date().toISOString().split('T')[0]
    if (request.start_date < today) {
      errors.push({ field: 'start_date', code: 'PAST_DATE', message: 'Không thể chọn ngày trong quá khứ' })
    }

    // Check blackout
    const start = new Date(request.start_date)
    const end = new Date(request.end_date)
    const current = new Date(start)
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]
      const blackout = blackouts.find(b => b.date === dateStr)
      if (blackout?.isStrict) {
        errors.push({ field: 'dates', code: 'BLACKOUT_DATE', message: `${dateStr}: ${blackout.reason} (không được nghỉ)` })
      } else if (blackout) {
        warnings.push({ code: 'PEAK_PERIOD', message: `${dateStr}: ${blackout.reason}`, severity: 'high' })
      }
      current.setDate(current.getDate() + 1)
    }

    // Check overlap
    if (request.employee_id) {
      const overlapping = existingRequests.filter(r =>
        r.employee_id === request.employee_id &&
        r.status !== 'cancelled' && r.status !== 'rejected' &&
        r.id !== request.id &&
        r.start_date <= request.end_date! && r.end_date >= request.start_date!
      )
      if (overlapping.length > 0) {
        errors.push({ field: 'dates', code: 'OVERLAP_EXISTING', message: 'Trùng với đơn nghỉ đã có' })
      }
    }

    // Short notice warning
    const daysUntilStart = Math.ceil((new Date(request.start_date).getTime() - Date.now()) / 86400000)
    if (daysUntilStart < 3 && daysUntilStart >= 0) {
      warnings.push({ code: 'SHORT_NOTICE', message: `Gửi đơn sát ngày (${daysUntilStart} ngày) — có thể chậm duyệt`, severity: 'medium' })
    }
  }

  // Check quota (using computed remaining from quota-service)
  if (request.leave_type && request.days) {
    const q = quota?.quotas[request.leave_type]
    if (q && q.total > 0 && request.days > q.remaining) {
      errors.push({ field: 'type', code: 'INSUFFICIENT_QUOTA', message: `Không đủ quota: còn ${q.remaining} ngày, xin ${request.days} ngày` })
    }
  }

  // Conflict warning
  if (request.hasScheduleConflict) {
    warnings.push({
      code: 'SCHEDULE_CONFLICT',
      message: `Có ${request.conflictingShifts?.length || 0} ca làm bị ảnh hưởng`,
      severity: 'high',
      suggestion: 'Quản lý sẽ cần sắp xếp người thay',
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

// Legacy compat
export const mockLeaveBalances: LeaveBalance[] = mockLeaveQuotas.map(q => ({
  employee_id: q.employee_id,
  employee_name: q.employee_name,
  balances: (['annual', 'sick', 'personal'] as LeaveType[]).map(type => ({
    type,
    label: LEAVE_TYPE_MAP[type].name,
    total: q.quotas[type].total,
    used: q.quotas[type].used,
    remaining: q.quotas[type].remaining,
  })),
}))

export { leaveTypeColors }
