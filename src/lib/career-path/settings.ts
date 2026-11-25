// Lộ trình thăng tiến Homies theo Playbook V7.
// Cấu hình nghiệp vụ (bậc, mốc tháng/giờ, mức cộng lương, kỹ năng, người duyệt)
// đều nằm trong Cài đặt để HR/CEO chỉnh được, không ghi cứng trong logic.

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

export interface CareerPathSettings {
  version: number
  updated_at: string
  updated_by: string
  positions: CareerPositionConfig[]
  grades: CareerGradeConfig[]
  ft_pay_method: FullTimePayMethod
  skills: CareerSkillConfig[]
  /** Mức (1-3) coi là "đạt" với tiêu chuẩn chung bắt buộc (ATTP, SOP...). */
  common_pass_level: number
  approval: CareerApprovalConfig
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

const skill = (
  code: string,
  name: string,
  position: CareerPositionCode | null,
  group: CareerSkillGroup,
  standard: string
): CareerSkillConfig => ({ code, name, position, group, standard, active: true })

export function getDefaultCareerPathSettings(): CareerPathSettings {
  return {
    version: 1,
    updated_at: '',
    updated_by: '',
    positions: [
      { code: 'cashier', label: 'Thu ngân' },
      { code: 'barista', label: 'Pha chế' },
    ],
    grades: [
      { code: 'T0', label: 'Hội nhập', description: 'Tháng đầu: học luồng đơn, nội quy, ATTP.', min_months: 0, min_hours: 0, hourly_step_vnd: 0, ft_monthly_vs_g1_vnd: 0, requirement: req({}) },
      { code: 'G1', label: 'Nền tảng', description: 'Làm các nghiệp vụ cơ bản đã học của vị trí chính.', min_months: 1, min_hours: 120, hourly_step_vnd: 0, ft_monthly_vs_g1_vnd: 0, requirement: req({ main_min_level: 1, common_required: true }) },
      { code: 'G2', label: 'Chuyên môn', description: 'Thành thạo vị trí chính, hỗ trợ được vị trí còn lại.', min_months: 2, min_hours: 240, hourly_step_vnd: 1500, ft_monthly_vs_g1_vnd: 315000, requirement: req({ main_min_level: 3, support_min_level: 2, common_required: true }) },
      { code: 'G3', label: 'Đa nhiệm', description: 'Thành thạo vị trí chính, độc lập toàn bộ vị trí thứ hai.', min_months: 3, min_hours: 480, hourly_step_vnd: 2000, ft_monthly_vs_g1_vnd: 735000, requirement: req({ main_min_level: 3, second_min_level: 2, common_required: true }) },
      { code: 'G4', label: 'Chủ chốt', description: 'Thành thạo cả hai vị trí, phòng ngừa lỗi và hướng dẫn.', min_months: 4, min_hours: 720, hourly_step_vnd: 1500, ft_monthly_vs_g1_vnd: 1050000, requirement: req({ main_min_level: 3, second_min_level: 3, advanced_min_level: 2, common_required: true }) },
    ],
    ft_pay_method: 'fixed_monthly',
    skills: [
      skill('CS01', 'Menu, tư vấn', 'cashier', 'core', 'Giải thích đúng món, tùy chọn, ưu đãi'),
      skill('CS02', 'POS', 'cashier', 'core', 'Nhập đúng món, số lượng, yêu cầu'),
      skill('CS03', 'Thanh toán', 'cashier', 'core', 'Đúng phương thức, xác nhận giao dịch'),
      skill('CS04', 'Food App', 'cashier', 'core', 'Nhận, theo dõi, xử lý đơn thông thường'),
      skill('CS05', 'Theo dõi đơn', 'cashier', 'core', 'Không bỏ sót hoặc trùng đơn'),
      skill('CS06', 'QC đơn', 'cashier', 'core', 'Đúng món, đủ ly, phụ kiện'),
      skill('CS07', 'Đóng gói', 'cashier', 'core', 'Đúng quy cách'),
      skill('CS08', 'Giao đơn', 'cashier', 'core', 'Đúng mã và người nhận'),
      skill('CS09', 'SOP, vật tư', 'cashier', 'core', 'Mở / trong / đóng ca đúng phạm vi'),
      skill('CS10', 'Xử lý tình huống', 'cashier', 'core', 'Xử lý hoặc báo đúng quyền'),
      skill('BR01', 'Nguyên liệu', 'barista', 'core', 'Nhận diện và sử dụng đúng'),
      skill('BR02', 'Thiết bị', 'barista', 'core', 'Sử dụng an toàn, đúng cách'),
      skill('BR03', 'Tem ly', 'barista', 'core', 'Đọc đúng size, đường, đá, topping'),
      skill('BR04', 'Trà sữa', 'barista', 'core', 'Toàn nhóm món đang bán'),
      skill('BR05', 'Trà trái cây', 'barista', 'core', 'Toàn nhóm món đang bán'),
      skill('BR06', 'Topping', 'barista', 'core', 'Đúng loại, định lượng'),
      skill('BR07', 'Bán thành phẩm', 'barista', 'core', 'Đúng SOP được giao'),
      skill('BR08', 'Date, bảo quản', 'barista', 'core', 'Kiểm tra hạn và điều kiện bảo quản'),
      skill('BR09', 'QC sản phẩm', 'barista', 'core', 'Đúng công thức và ngoại quan'),
      skill('BR10', 'Năng suất, SOP', 'barista', 'core', 'Tổ chức tem, thao tác, vệ sinh khu vực'),
      skill('SB01', 'Đọc tem, chuẩn bị ly/dụng cụ', 'barista', 'support', 'Thu ngân hỗ trợ Pha chế'),
      skill('SB02', 'Chuẩn bị topping đã học', 'barista', 'support', 'Thu ngân hỗ trợ Pha chế'),
      skill('SB03', 'Bổ sung vật tư pha chế', 'barista', 'support', 'Thu ngân hỗ trợ Pha chế'),
      skill('SC01', 'Đọc mã đơn, kiểm tra đủ ly', 'cashier', 'support', 'Pha chế hỗ trợ Thu ngân'),
      skill('SC02', 'Đóng gói đúng quy cách', 'cashier', 'support', 'Pha chế hỗ trợ Thu ngân'),
      skill('SC03', 'Giao đúng đơn theo phân công', 'cashier', 'support', 'Pha chế hỗ trợ Thu ngân'),
      skill('SC04', 'POS cơ bản theo phân quyền', 'cashier', 'support', 'Pha chế hỗ trợ Thu ngân'),
      skill('AT01', 'ATTP & vệ sinh', null, 'common', 'Bắt buộc đạt ở mọi bậc'),
      skill('AT02', 'SOP & tác phong', null, 'common', 'Bắt buộc đạt ở mọi bậc'),
      skill('AD01', 'Phòng ngừa lỗi', null, 'advanced', 'Phát hiện thiếu topping, sai tem, date'),
      skill('AD02', 'Xử lý sự cố', null, 'advanced', 'Xác định phạm vi, xử lý đúng SOP, báo cáo'),
      skill('AD03', 'Hướng dẫn', null, 'advanced', 'Làm mẫu, quan sát, sửa lỗi, kiểm tra lại'),
      skill('AD04', 'Cải tiến', null, 'advanced', 'Nhận biết điểm nghẽn, đề xuất có căn cứ'),
    ],
    common_pass_level: 2,
    approval: {
      assessor_roles: ['store_manager', 'area_manager', 'hr_admin', 'ceo'],
      approver_roles: ['ceo', 'hr_admin'],
      store_manager_can_approve_up_to: null,
      require_different_approver: true,
      review_rounds_per_month: 2,
      respond_within_working_days: 3,
      assess_within_working_days: 7,
      notify_within_working_days: 2,
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
  if (!isWholeNonNegative(s.common_pass_level) || s.common_pass_level < 1 || s.common_pass_level > 3) {
    errors.push('Mức đạt tiêu chuẩn chung phải từ 1 đến 3.')
  }
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
    m1: { ...d.m1, ...(raw.m1 || {}) },
  }
}
