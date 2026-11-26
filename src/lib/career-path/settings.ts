// Lộ trình thăng tiến Homies theo Playbook V7.
// Cấu hình nghiệp vụ (bậc, mốc tháng/giờ, mức cộng lương, kỹ năng, người duyệt)
// đều nằm trong Cài đặt để HR/CEO chỉnh được, không ghi cứng trong logic.
// Mặc định mọi con số để trống (0 / không xét): lộ trình chỉ chạy sau khi CEO/HR điền và lưu lần đầu.
// Số tham khảo theo Playbook V7 nằm ở settings-suggestion.ts, chỉ áp dụng khi người dùng bấm "Điền gợi ý".

import { PLAYBOOK_V7_SKILLS } from './settings-suggestion.ts'

export const CAREER_GRADE_CODES = ['T0', 'G1', 'G2', 'G3', 'G4'] as const
export type CareerGradeCode = (typeof CAREER_GRADE_CODES)[number]

export const CAREER_POSITION_CODES = ['cashier', 'barista'] as const
export type CareerPositionCode = (typeof CAREER_POSITION_CODES)[number]

export type CareerSkillGroup = 'core' | 'support' | 'common' | 'advanced'
export type FullTimePayMethod = 'fixed_monthly' | 'hourly_x_hours'

export interface CareerPositionConfig {
  code: CareerPositionCode
  label: string
}

export interface CareerGradeRequirement {
  /** Mức tối thiểu (0-3) cho kỹ năng chính của vị trí chính. null = không xét. */
  main_min_level: number | null
  /** Mức tối thiểu cho kỹ năng hỗ trợ vị trí còn lại. */
  support_min_level: number | null
  /** Mức tối thiểu cho toàn bộ kỹ năng chính của vị trí thứ hai. */
  second_min_level: number | null
  /** Mức tối thiểu cho nhóm năng lực nâng cao. */
  advanced_min_level: number | null
  /** Bắt buộc đạt SOP / ATTP / tác phong. */
  common_required: boolean
}

export interface CareerGradeConfig {
  code: CareerGradeCode
  label: string
  description: string
  min_months: number
  min_hours: number
  /** Lương giờ cộng thêm so với bậc liền trước (đồng/giờ). */
  hourly_step_vnd: number
  /** Số tiền cộng thêm mỗi tháng so với G1, dùng cho Full-time khi chọn cách "cố định". */
  ft_monthly_vs_g1_vnd: number
  requirement: CareerGradeRequirement
}

export interface CareerSkillConfig {
  code: string
  name: string
  /** Vị trí sở hữu kỹ năng; null với kỹ năng dùng chung hoặc nâng cao. */
  position: CareerPositionCode | null
  group: CareerSkillGroup
  standard: string
  active: boolean
}

export interface CareerApprovalConfig {
  assessor_roles: string[]
  approver_roles: string[]
  /** Quản lý cửa hàng được tự duyệt tới bậc này (null = không được tự duyệt). */
  store_manager_can_approve_up_to: CareerGradeCode | null
  require_different_approver: boolean
  review_rounds_per_month: number
  respond_within_working_days: number
  assess_within_working_days: number
  notify_within_working_days: number
}

export interface CareerM1Config {
  enabled: boolean
  full_time_only: boolean
  min_grade: CareerGradeCode
}

export type MonthsFrom = 'hire_date' | 'first_placement'
export type HoursFrom = 'all_attendance' | 'since_first_placement'
export type FtMidMonth = 'prorate_days' | 'grade_at_period_end'

/** Các quy tắc tính nhỏ, đều do CEO/HR chọn. */
export interface CareerRulesConfig {
  /** Số ký tự tối thiểu của lý do khi đề xuất hoặc từ chối (0 = không bắt buộc). */
  reason_min_chars: number
  /** Cho phép đề xuất khi nhân viên chưa đủ điều kiện (ngoại lệ). */
  allow_exception: boolean
  /** Số ký tự tối thiểu của lý do khi đề xuất ngoại lệ. */
  exception_reason_min_chars: number
  /** Thứ trong tuần không tính là ngày làm việc khi đếm hạn (0 = Chủ nhật ... 6 = Thứ bảy). */
  non_working_weekdays: number[]
  /** Số tháng làm việc tính từ ngày nào. */
  months_from: MonthsFrom
  /** Giờ làm tính từ đâu (luôn cộng thêm số giờ HR nhập lúc xếp bậc). */
  hours_from: HoursFrom
  /** Tiền cộng theo bậc có tính thuế TNCN không. */
  pay_taxable: boolean
  /** Full-time cộng cố định mà đổi bậc giữa tháng: chia theo ngày hay tính trọn tháng theo bậc cuối kỳ. */
  ft_mid_month: FtMidMonth
}

export interface CareerPathSettings {
  version: number
  updated_at: string
  updated_by: string
  /** true sau khi CEO/HR lưu cài đặt lần đầu. Chưa cài đặt thì không xét bậc, không đề xuất, không cộng lương. */
  configured: boolean
  positions: CareerPositionConfig[]
  grades: CareerGradeConfig[]
  ft_pay_method: FullTimePayMethod
  /** Bật thì bảng lương (kỳ chưa khóa) tự cộng thêm tiền theo bậc. Mặc định tắt để HR kiểm tra trước. */
  payroll_link_enabled: boolean
  skills: CareerSkillConfig[]
  /** Mức (1-3) coi là "đạt" với tiêu chuẩn chung bắt buộc (ATTP, SOP...). */
  common_pass_level: number
  approval: CareerApprovalConfig
  rules: CareerRulesConfig
  m1: CareerM1Config
}

const req = (r: Partial<CareerGradeRequirement>): CareerGradeRequirement => ({
  main_min_level: null,
  support_min_level: null,
  second_min_level: null,
  advanced_min_level: null,
  common_required: false,
  ...r,
})

export function getDefaultCareerPathSettings(): CareerPathSettings {
  return {
    version: 1,
    updated_at: '',
    updated_by: '',
    configured: false,
    positions: [
      { code: 'cashier', label: 'Thu ngân' },
      { code: 'barista', label: 'Pha chế' },
    ],
    grades: [
      { code: 'T0', label: 'Hội nhập', description: 'Tháng đầu: học luồng đơn, nội quy, ATTP.', min_months: 0, min_hours: 0, hourly_step_vnd: 0, ft_monthly_vs_g1_vnd: 0, requirement: req({}) },
      { code: 'G1', label: 'Nền tảng', description: 'Làm các nghiệp vụ cơ bản đã học của vị trí chính.', min_months: 0, min_hours: 0, hourly_step_vnd: 0, ft_monthly_vs_g1_vnd: 0, requirement: req({}) },
      { code: 'G2', label: 'Chuyên môn', description: 'Thành thạo vị trí chính, hỗ trợ được vị trí còn lại.', min_months: 0, min_hours: 0, hourly_step_vnd: 0, ft_monthly_vs_g1_vnd: 0, requirement: req({}) },
      { code: 'G3', label: 'Đa nhiệm', description: 'Thành thạo vị trí chính, độc lập toàn bộ vị trí thứ hai.', min_months: 0, min_hours: 0, hourly_step_vnd: 0, ft_monthly_vs_g1_vnd: 0, requirement: req({}) },
      { code: 'G4', label: 'Chủ chốt', description: 'Thành thạo cả hai vị trí, phòng ngừa lỗi và hướng dẫn.', min_months: 0, min_hours: 0, hourly_step_vnd: 0, ft_monthly_vs_g1_vnd: 0, requirement: req({}) },
    ],
    ft_pay_method: 'fixed_monthly',
    payroll_link_enabled: false,
    skills: PLAYBOOK_V7_SKILLS.map((sk) => ({ ...sk })),
    common_pass_level: 0,
    approval: {
      assessor_roles: ['store_manager', 'area_manager', 'hr_admin', 'ceo'],
      approver_roles: ['ceo', 'hr_admin'],
      store_manager_can_approve_up_to: null,
      require_different_approver: true,
      review_rounds_per_month: 0,
      respond_within_working_days: 0,
      assess_within_working_days: 0,
      notify_within_working_days: 0,
    },
    rules: {
      reason_min_chars: 0,
      allow_exception: true,
      exception_reason_min_chars: 0,
      non_working_weekdays: [],
      months_from: 'hire_date',
      hours_from: 'all_attendance',
      pay_taxable: true,
      ft_mid_month: 'prorate_days',
    },
    m1: { enabled: true, full_time_only: true, min_grade: 'G4' },
  }
}

export function isCareerGradeCode(value: unknown): value is CareerGradeCode {
  return typeof value === 'string' && (CAREER_GRADE_CODES as readonly string[]).includes(value)
}

export function isCareerPositionCode(value: unknown): value is CareerPositionCode {
  return typeof value === 'string' && (CAREER_POSITION_CODES as readonly string[]).includes(value)
}

export function gradeOrder(code: CareerGradeCode): number {
  return CAREER_GRADE_CODES.indexOf(code)
}

const isWholeNonNegative = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0 && Math.floor(n) === n
const isLevelOrNull = (n: unknown) => n === null || (isWholeNonNegative(n) && n <= 3)

/** Kiểm tra cấu hình trước khi lưu. Trả về danh sách lỗi tiếng Việt (rỗng = hợp lệ). */
export function validateCareerPathSettings(s: CareerPathSettings): string[] {
  const errors: string[] = []
  const codes = s.grades.map((g) => g.code)
  if (codes.join(',') !== CAREER_GRADE_CODES.join(',')) {
    errors.push('Danh sách bậc phải đủ và đúng thứ tự T0, G1, G2, G3, G4.')
  }
  s.grades.forEach((g, i) => {
    const name = `Bậc ${g.code}`
    if (!g.label?.trim()) errors.push(`${name}: chưa có tên hiển thị.`)
    if (!isWholeNonNegative(g.min_months)) errors.push(`${name}: số tháng tối thiểu phải là số nguyên không âm.`)
    if (!isWholeNonNegative(g.min_hours)) errors.push(`${name}: số giờ tối thiểu phải là số nguyên không âm.`)
    if (!isWholeNonNegative(g.hourly_step_vnd)) errors.push(`${name}: mức cộng lương giờ phải là số nguyên không âm.`)
    if (!isWholeNonNegative(g.ft_monthly_vs_g1_vnd)) errors.push(`${name}: mức cộng tháng Full-time phải là số nguyên không âm.`)
    const r = g.requirement
    if (![r.main_min_level, r.support_min_level, r.second_min_level, r.advanced_min_level].every(isLevelOrNull)) {
      errors.push(`${name}: mức kỹ năng yêu cầu phải từ 0 đến 3.`)
    }
    const prev = s.grades[i - 1]
    if (prev) {
      if (g.min_months < prev.min_months) errors.push(`${name}: số tháng không được thấp hơn bậc ${prev.code}.`)
      if (g.min_hours < prev.min_hours) errors.push(`${name}: số giờ không được thấp hơn bậc ${prev.code}.`)
      if (g.ft_monthly_vs_g1_vnd < prev.ft_monthly_vs_g1_vnd) errors.push(`${name}: mức cộng tháng Full-time không được thấp hơn bậc ${prev.code}.`)
    }
  })
  if (s.ft_pay_method !== 'fixed_monthly' && s.ft_pay_method !== 'hourly_x_hours') {
    errors.push('Cách cộng lương Full-time không hợp lệ.')
  }
  const seen = new Set<string>()
  s.skills.forEach((sk) => {
    const code = sk.code?.trim()
    if (!code) errors.push('Có kỹ năng chưa có mã.')
    else if (seen.has(code)) errors.push(`Mã kỹ năng ${code} bị trùng.`)
    else seen.add(code)
    if (!sk.name?.trim()) errors.push(`Kỹ năng ${code || '(chưa có mã)'}: chưa có tên.`)
    if ((sk.group === 'core' || sk.group === 'support') && !isCareerPositionCode(sk.position)) {
      errors.push(`Kỹ năng ${code}: kỹ năng chính / hỗ trợ phải gắn với Thu ngân hoặc Pha chế.`)
    }
  })
  for (const pos of CAREER_POSITION_CODES) {
    if (!s.skills.some((sk) => sk.active && sk.group === 'core' && sk.position === pos)) {
      errors.push(`Vị trí ${pos === 'cashier' ? 'Thu ngân' : 'Pha chế'} chưa có kỹ năng chính nào đang dùng.`)
    }
  }
  const needsCommon = s.grades.some((g) => g.requirement.common_required)
  if (!isWholeNonNegative(s.common_pass_level) || s.common_pass_level > 3 || (needsCommon && s.common_pass_level < 1)) {
    errors.push('Có bậc bắt buộc đạt SOP / ATTP: hãy chọn mức coi là “đạt” (1 đến 3) ở tab Kỹ năng.')
  }
  const r = s.rules
  if (!isWholeNonNegative(r?.reason_min_chars) || !isWholeNonNegative(r?.exception_reason_min_chars)) {
    errors.push('Số ký tự tối thiểu của lý do phải là số nguyên không âm.')
  }
  if (!Array.isArray(r?.non_working_weekdays) || !r.non_working_weekdays.every((d) => isWholeNonNegative(d) && d <= 6)) {
    errors.push('Ngày nghỉ trong tuần không hợp lệ.')
  } else if (r.non_working_weekdays.length >= 7) {
    errors.push('Phải còn ít nhất một ngày làm việc trong tuần.')
  }
  if (r?.months_from !== 'hire_date' && r?.months_from !== 'first_placement') errors.push('Cách tính số tháng không hợp lệ.')
  if (r?.hours_from !== 'all_attendance' && r?.hours_from !== 'since_first_placement') errors.push('Cách tính số giờ không hợp lệ.')
  if (r?.ft_mid_month !== 'prorate_days' && r?.ft_mid_month !== 'grade_at_period_end') errors.push('Cách tính Full-time đổi bậc giữa tháng không hợp lệ.')
  const a = s.approval
  if (!a.approver_roles?.length) errors.push('Phải chọn ít nhất một vai trò được duyệt nâng bậc.')
  if (!a.assessor_roles?.length) errors.push('Phải chọn ít nhất một vai trò được đánh giá.')
  if (a.store_manager_can_approve_up_to !== null && !isCareerGradeCode(a.store_manager_can_approve_up_to)) {
    errors.push('Bậc tối đa quản lý cửa hàng tự duyệt không hợp lệ.')
  }
  for (const key of ['review_rounds_per_month', 'respond_within_working_days', 'assess_within_working_days', 'notify_within_working_days'] as const) {
    if (!isWholeNonNegative(a[key])) errors.push('Các mốc thời gian xét bậc phải là số nguyên không âm.')
  }
  if (!isCareerGradeCode(s.m1?.min_grade)) errors.push('Bậc tối thiểu để bổ nhiệm M1 không hợp lệ.')
  return errors
}

/** Ghép dữ liệu đã lưu với mặc định để bản cũ thiếu trường mới vẫn đọc được. */
export function normalizeCareerPathSettings(raw: Partial<CareerPathSettings> | null | undefined): CareerPathSettings {
  const d = getDefaultCareerPathSettings()
  if (!raw || typeof raw !== 'object') return d
  const grades = CAREER_GRADE_CODES.map((code) => {
    const base = d.grades.find((g) => g.code === code)!
    const saved = Array.isArray(raw.grades) ? raw.grades.find((g) => g?.code === code) : undefined
    return saved ? { ...base, ...saved, code, requirement: { ...base.requirement, ...(saved.requirement || {}) } } : base
  })
  return {
    ...d,
    ...raw,
    positions: d.positions.map((p) => ({ ...p, ...(raw.positions?.find((x) => x?.code === p.code) || {}), code: p.code })),
    grades,
    skills: Array.isArray(raw.skills) && raw.skills.length > 0 ? raw.skills : d.skills,
    approval: { ...d.approval, ...(raw.approval || {}) },
    rules: { ...d.rules, ...(raw.rules || {}) },
    m1: { ...d.m1, ...(raw.m1 || {}) },
    payroll_link_enabled: raw.payroll_link_enabled === true,
    // Bản đã lưu trước khi có cờ này (có updated_at) coi như đã cài đặt.
    configured: raw.configured === true || Boolean(raw.updated_at),
  }
}
